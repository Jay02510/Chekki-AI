import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withSentry } from './_lib/withSentry.js';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb, adminAuth as authDb, syncAuthClaims } from './_lib/firebaseAdmin.js';
import { seatsForPlan } from './_lib/pricingTiers.js';
import { applyCors } from './_lib/cors.js';
import { createRateLimiter, clientIp } from './_lib/rateLimit.js';
import { notifyDirectors } from './_lib/notifications.js';
import { createHash, timingSafeEqual } from 'crypto';
import { generateJoinCode } from './_lib/joinCode.js';

const ADMIN_PASSCODE = process.env.ADMIN_PASSCODE;

// Plain `!==` leaks timing information proportional to how many leading
// characters match, which a network attacker can exploit to recover the
// passcode character-by-character (Audit: non-constant-time admin passcode
// comparison — this endpoint gates account impersonation and deletion).
// Hashing both sides first sidesteps timingSafeEqual's requirement that
// both buffers be the same length (a raw length mismatch would otherwise
// throw before any real comparison happens).
function safeEquals(a: string, b: string): boolean {
  const hashA = createHash('sha256').update(a).digest();
  const hashB = createHash('sha256').update(b).digest();
  return timingSafeEqual(hashA, hashB);
}

// schoolId becomes a Firestore doc ID via .doc(sanitizedSchoolId) below — the
// Admin SDK treats '/' in that string as a subcollection path separator, so
// an unrestricted schoolId (e.g. containing '/') could target an arbitrary
// nested path instead of a single schools/{id} document. Strip to a safe,
// still-human-readable charset.
export function sanitizeSchoolId(raw: string): string {
  return raw.toUpperCase().trim().replace(/[^A-Z0-9_-]/g, '');
}

// delete_school/upgrade_school/assign_teacher all reference an EXISTING
// school doc, not a new one — they used to run the incoming schoolId
// through sanitizeSchoolId() same as create_school, which uppercases it.
// Self-serve director signups (api/set-initial-role.ts) create schools as
// `school_${uid}` — lowercase, with a mixed-case Firebase uid — never
// through sanitizeSchoolId at all. Re-sanitizing that id on delete/upgrade/
// assign silently retargeted a completely different, nonexistent doc path:
// Firestore's .delete() on a doc that doesn't exist succeeds without error,
// so "School deleted successfully" showed while the real school (and its
// data) was untouched and reappeared on the next refresh (audit: admin
// can't delete a self-serve-created school). This only guards against the
// actual injection risk (a '/' turning .doc(id) into a nested subcollection
// path) without reshaping a real, already-established id.
export function isValidExistingDocId(raw: string): boolean {
  return typeof raw === 'string' && raw.trim().length > 0 && !raw.includes('/');
}

// This endpoint gates account impersonation, deletion, and upgrades behind a
// single shared passcode — rate limit failed attempts hard so it can't be
// brute-forced (audit §15a).
// Generous volumetric guard applied to every admin request regardless of
// outcome — protects against a runaway client loop, not brute force.
const checkAdminLimit = createRateLimiter('admin', 60, 60);
// Strict guard counted only on a wrong passcode (see below) — this is the
// actual brute-force protection. Splitting these apart fixes a real bug: the
// single 5-per-60s limiter previously counted EVERY admin action (list,
// list_schools, list_invoices, list_invites all fire on page load alone),
// so a legitimate, already-authenticated director loading the dashboard or
// clicking between tabs routinely got locked out with "Too many attempts,"
// which read as if their user list had been wiped (audit: rate limit
// indistinguishable from data loss in the UI, and too strict for normal use).
const checkAdminAuthFailureLimit = createRateLimiter('admin_auth_fail', 5, 60);

async function handler(req: VercelRequest, res: VercelResponse) {
  applyCors(req, res);

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { passcode, action, uid, email, duration, schoolId, schoolName, teacherCode, maxUses } =
    req.body || {};

  if (!ADMIN_PASSCODE) {
    return res.status(500).json({ error: 'Admin passcode is not configured.' });
  }

  {
    const ipString = clientIp(req);
    const { success, limit, reset, remaining } = await checkAdminLimit(ipString);
    res.setHeader('X-RateLimit-Limit', limit.toString());
    res.setHeader('X-RateLimit-Remaining', remaining.toString());
    res.setHeader('X-RateLimit-Reset', reset.toString());
    if (!success) {
      console.warn(`[admin.ts] Rate limit exceeded for IP: ${ipString}`);
      return res.status(429).json({ error: 'Too many attempts. Try again later.' });
    }
  }

  if (typeof passcode !== 'string' || !safeEquals(passcode, ADMIN_PASSCODE)) {
    const ipString = clientIp(req);
    const { success } = await checkAdminAuthFailureLimit(ipString);
    if (!success) {
      console.warn(`[admin.ts] Repeated invalid passcode attempts from IP: ${ipString}`);
      return res.status(429).json({ error: 'Too many attempts. Try again later.' });
    }
    return res.status(401).json({ error: 'Unauthorized: Invalid Passcode' });
  }

  // Persistent audit trail for every admin action (not just console output,
  // which is easy to lose in Vercel's rolling log retention). The passcode
  // is shared/anonymous, so this is the only record of what an admin did.
  // Awaited (not fire-and-forget) so a frozen/terminated serverless instance
  // can't drop the log entry after the action has already been approved
  // (Audit: fire-and-forget audit log).
  const auditIp = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
  try {
    await adminDb.collection('adminAuditLog').add({
      action,
      uid: uid || null,
      email: email || null,
      schoolId: schoolId || null,
      ip: Array.isArray(auditIp) ? auditIp[0] : auditIp,
      at: new Date().toISOString(),
    });
  } catch (auditErr) {
    console.error('[admin.ts] Failed to write audit log:', auditErr);
  }

  try {
    if (action === 'list') {
      // orderBy() silently drops every doc that doesn't have the ordered
      // field set at all — Firestore excludes, not nulls-first, for a
      // range/order clause. This list previously ordered by
      // subscriptionStartedAt (excluded every free/trial account, which
      // writes that field as null) and was "fixed" to order by createdAt
      // instead — but createdAt wasn't actually set on the user doc by
      // ANY signup path (services/database.ts's createUser now sets it,
      // but every account created before that fix still lacks it), so the
      // orderBy() just traded one silent-exclusion bug for a worse one:
      // it found zero users, not just zero free/trial ones (audit: admin
      // "View Members" showed 0 users despite real accounts existing).
      // Fetching without orderBy and sorting after the fact can't silently
      // drop anything regardless of which fields any given doc happens to
      // have — undated docs (pre-fix accounts) just sort last instead of
      // being excluded.
      const usersSnapshot = await adminDb
        .collection('users')
        .limit(500)
        .get();

      // No further slice here — the admin panel's search box filters
      // whatever this endpoint returns client-side (AdminPage.tsx), so
      // capping this below the 500-doc Firestore limit silently made
      // whole accounts unsearchable. Undated docs (pre-createdAt-fix
      // signups, including several director accounts) sort last and were
      // the first ones cut, which is exactly what the search box's job
      // is to find (audit: director accounts didn't show up in "View
      // Members" search).
      const sortedDocs = [...usersSnapshot.docs].sort((a, b) => {
        const aTime = a.data().createdAt ? new Date(a.data().createdAt).getTime() : 0;
        const bTime = b.data().createdAt ? new Date(b.data().createdAt).getTime() : 0;
        return bTime - aTime;
      });

      const users = sortedDocs.map((doc) => {
        const data = doc.data();
        return {
          uid: doc.id,
          name: data.name || 'Unknown',
          email: data.email || 'No email',
          plan: data.plan || 'free',
          role: data.role || '',
          schoolId: data.schoolId || null,
          schoolName: data.schoolName || null,
          subscriptionStartedAt: data.subscriptionStartedAt || null,
          nextBillingDate: data.nextBillingDate || null,
          maxScansPerDay: data.maxScansPerDay || 0,
          scansUsedToday: data.scansUsedToday || 0,
          lastScanDate: data.lastScanDate || null,
          maxQuestionsPerDay: data.maxQuestionsPerDay || 0,
        };
      });

      return res.status(200).json({ success: true, users });
    } else if (action === 'upgrade') {
      if (!email) return res.status(400).json({ error: 'Missing email' });
      const cleanEmail = email.toLowerCase().trim();
      const usersRef = adminDb.collection('users');
      const q = usersRef.where('email', '==', cleanEmail);
      const querySnapshot = await q.get();

      if (querySnapshot.empty) {
        return res.status(404).json({ error: 'User not found. Please check the email address.' });
      }

      const userDoc = querySnapshot.docs[0];
      const targetUid = userDoc.id;

      let nextBillingDateStr: any = FieldValue.delete();
      if (duration === '1_month') {
        const d = new Date();
        d.setMonth(d.getMonth() + 1);
        nextBillingDateStr = d.toISOString();
      } else if (duration === '1_year') {
        const d = new Date();
        d.setFullYear(d.getFullYear() + 1);
        nextBillingDateStr = d.toISOString();
      } else if (duration === 'lifetime') {
        const d = new Date();
        d.setFullYear(d.getFullYear() + 100);
        nextBillingDateStr = d.toISOString();
      }

      await adminDb.collection('users').doc(targetUid).update({
        plan: 'pro',
        maxScansPerDay: 9999,
        maxQuestionsPerDay: 9999,
        subscriptionStartedAt: new Date().toISOString(),
        nextBillingDate: nextBillingDateStr,
        subscriptionPlatform: 'admin_upgrade',
      });

      return res.status(200).json({ success: true, message: 'User upgraded successfully' });
    } else if (action === 'downgrade') {
      if (!uid) return res.status(400).json({ error: 'Missing uid' });

      const updateData = {
        plan: 'free',
        maxScansPerDay: 2,
        maxQuestionsPerDay: 5,
        subscriptionStartedAt: FieldValue.delete(),
        nextBillingDate: FieldValue.delete(),
        subscriptionPlatform: FieldValue.delete(),
      };

      // Use set with merge to avoid failing if the document is somehow missing fields or doesn't exist
      await adminDb.collection('users').doc(uid).set(updateData, { merge: true });

      return res.status(200).json({ success: true, message: 'User downgraded successfully' });
    } else if (action === 'delete') {
      let targetUid = uid;
      let authUid = null;
      let firestoreUid = null;

      if (!targetUid && email) {
        const cleanEmail = email.toLowerCase().trim();

        // 1. Try to find in Auth
        try {
          const userRecord = await authDb.getUserByEmail(cleanEmail);
          authUid = userRecord.uid;
        } catch (e: any) {
          if (e.code !== 'auth/user-not-found') {
            console.error('Error finding user in Auth:', e);
          }
        }

        // 2. Try to find in Firestore
        const usersRef = adminDb.collection('users');
        const q = usersRef.where('email', '==', cleanEmail);
        const querySnapshot = await q.get();

        if (!querySnapshot.empty) {
          firestoreUid = querySnapshot.docs[0].id;
        }

        if (!authUid && !firestoreUid) {
          return res.status(404).json({ error: 'User not found. Please check the email address.' });
        }

        targetUid = authUid || firestoreUid; // Fallback to either
      }

      if (!targetUid) return res.status(400).json({ error: 'Missing uid or email' });

      // Delete from Firestore (using firestoreUid if we looked up by email, otherwise targetUid)
      const uidToDeleteFromFirestore = firestoreUid || targetUid;
      try {
        const userDoc = await adminDb.collection('users').doc(uidToDeleteFromFirestore).get();
        if (userDoc.exists) {
          const userData = userDoc.data();
          const userSchoolId = userData?.schoolId;
          if (userSchoolId) {
            // Best-effort seat/invite cleanup — must not block the actual user
            // doc delete below. A failure here (e.g. missing school doc) used
            // to throw into the outer catch and skip .delete() entirely,
            // so the API returned "success" while the user doc still existed
            // (Audit: admin delete says success, user reappears in list).
            try {
              await adminDb
                .collection('schools')
                .doc(userSchoolId)
                .update({
                  usedByUids: FieldValue.arrayRemove(uidToDeleteFromFirestore),
                });

              // Mirror handleRemoveTeacher (create-teacher-invite.ts) so an
              // admin-deleted teacher's invite/seat is actually freed instead of
              // permanently consuming a seat: revoke their claimed invite and
              // strip them from any class's assignedTeacherUids.
              const inviteSnap = await adminDb
                .collection('invites')
                .where('schoolId', '==', userSchoolId)
                .where('claimedByUid', '==', uidToDeleteFromFirestore)
                .where('status', '==', 'claimed')
                .get();
              await Promise.all(
                inviteSnap.docs.map((d) =>
                  d.ref.update({ status: 'revoked', revokedAt: new Date().toISOString() })
                )
              );

              const classesSnap = await adminDb
                .collection('classes')
                .where('schoolId', '==', userSchoolId)
                .where('assignedTeacherUids', 'array-contains', uidToDeleteFromFirestore)
                .get();
              await Promise.all(
                classesSnap.docs.map((d) =>
                  d.ref.update({ assignedTeacherUids: FieldValue.arrayRemove(uidToDeleteFromFirestore) })
                )
              );
            } catch (seatErr) {
              console.error('Error freeing seat/invite for deleted user:', seatErr);
            }
          }
        }
        await adminDb.collection('users').doc(uidToDeleteFromFirestore).delete();
      } catch (dbErr) {
        console.error('Error deleting user from Firestore:', dbErr);
        throw dbErr;
      }

      // Delete from Auth (using authUid if we looked up by email, otherwise targetUid)
      const uidToDeleteFromAuth = authUid || targetUid;
      try {
        await authDb.deleteUser(uidToDeleteFromAuth);
      } catch (authErr: any) {
        if (authErr.code !== 'auth/user-not-found') {
          console.error('Error deleting user from Auth:', authErr);
          throw authErr;
        }
      }

      return res.status(200).json({ success: true, message: 'User deleted successfully' });
    } else if (action === 'create_school') {
      if (!schoolId) return res.status(400).json({ error: 'Missing schoolId (School Code)' });
      if (!schoolName) return res.status(400).json({ error: 'Missing schoolName' });
      if (!teacherCode) return res.status(400).json({ error: 'Missing teacherCode' });

      const sanitizedSchoolId = sanitizeSchoolId(schoolId);
      if (!sanitizedSchoolId) return res.status(400).json({ error: 'Invalid schoolId' });
      const sanitizedTeacherCode = teacherCode.toUpperCase().trim();

      await adminDb
        .collection('schools')
        .doc(sanitizedSchoolId)
        .set({
          name: schoolName.trim(),
          teacherCode: sanitizedTeacherCode,
          // redeemSchoolCode (api/redeem.ts) used to trust the school's own
          // Firestore doc ID as "the code" — this IS that doc ID
          // (sanitizedSchoolId, shown to ops as "School Code (ID)" in
          // AdminPage). Real hagwon school IDs follow a guessable
          // ACADEMYPREFIX_NNNN pattern (see the invoice-confirm path below),
          // so knowing a target academy's name left only 10,000 candidates
          // to brute-force for free 'pro' access plus that school's
          // schoolId auth claim — cross-tenant read access to its
          // pendingStudents/invites (audit: school-code doc-ID-as-secret).
          // A genuine random field, checked instead of the doc ID, closes
          // that — same pattern teacherCode/redeemTeacherCode already use.
          schoolCode: generateJoinCode(),
          maxUses: maxUses ? parseInt(maxUses, 10) : 5,
          usedByUids: [],
          seatsTotal: seatsForPlan(req.body?.planId),
          createdAt: new Date().toISOString(),
        });

      return res.status(200).json({ success: true, message: 'School created successfully' });
    } else if (action === 'list_schools') {
      const schoolsSnapshot = await adminDb.collection('schools').get();
      const schools = schoolsSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          schoolId: doc.id,
          name: data.name || '',
          teacherCode: data.teacherCode || '',
          maxUses: data.maxUses ?? 5,
          usedByUids: data.usedByUids || [],
          createdAt: data.createdAt || null,
          planId: data.planId || null,
          trialEndsAt: data.trialEndsAt || null,
          // Real seat pool (director-invite system, §21) — was silently
          // dropped here even though every school has it, so the admin
          // schools table couldn't show FT/KT seat counts at all.
          seatsTotal: data.seatsTotal || { ft: 0, kt: 0 },
        };
      });

      return res.status(200).json({ success: true, schools });
    } else if (action === 'list_invites') {
      // Surfaces invites/{id}.status/createdAt — already written by
      // api/create-teacher-invite.ts, just never queried anywhere until now
      // — so ops can see teacher invite links a director sent that nobody
      // has claimed yet. Sorted oldest-first in memory rather than via
      // .orderBy('createdAt') so this single-equality-filter query doesn't
      // require a new Firestore composite index to be deployed.
      const invitesSnapshot = await adminDb
        .collection('invites')
        .where('status', '==', 'pending')
        .limit(200)
        .get();

      const invites = invitesSnapshot.docs
        .map((doc) => ({ inviteId: doc.id, ...doc.data() }))
        .sort((a: any, b: any) => (a.createdAt || '').localeCompare(b.createdAt || ''));

      return res.status(200).json({ success: true, invites });
    } else if (action === 'revoke_invite') {
      // Admin-side cancel for a stale/test invite — the director-facing
      // equivalent (api/create-teacher-invite.ts) requires a real director
      // Firebase session, which ops doesn't have. This is passcode-gated
      // instead, same as every other action on this endpoint.
      const { inviteId } = req.body || {};
      if (typeof inviteId !== 'string' || !inviteId) {
        return res.status(400).json({ error: 'Missing inviteId' });
      }
      const inviteRef = adminDb.collection('invites').doc(inviteId);
      const inviteSnap = await inviteRef.get();
      if (!inviteSnap.exists) {
        return res.status(404).json({ error: 'Invite not found' });
      }
      await inviteRef.update({ status: 'revoked', revokedAt: new Date().toISOString() });
      return res.status(200).json({ success: true });
    } else if (action === 'delete_school') {
      if (!schoolId) return res.status(400).json({ error: 'Missing schoolId' });
      if (!isValidExistingDocId(schoolId)) return res.status(400).json({ error: 'Invalid schoolId' });
      const sanitizedSchoolId = schoolId;

      const usersRef = adminDb.collection('users');
      const teachersSnapshot = await usersRef.where('schoolId', '==', sanitizedSchoolId).get();

      if (!teachersSnapshot.empty) {
        const batch = adminDb.batch();
        teachersSnapshot.docs.forEach((doc) => {
          batch.update(doc.ref, {
            schoolId: FieldValue.delete(),
            schoolName: FieldValue.delete(),
            role: FieldValue.delete(),
            plan: 'free',
            maxScansPerDay: 2,
            maxQuestionsPerDay: 5,
            subscriptionPlatform: FieldValue.delete(),
          });
        });
        await batch.commit();
      }

      await adminDb.collection('schools').doc(sanitizedSchoolId).delete();

      return res.status(200).json({ success: true, message: 'School deleted successfully' });
    } else if (action === 'list_invoices') {
      const invoicesSnapshot = await adminDb
        .collection('school_invoices')
        .orderBy('createdAt', 'desc')
        .limit(100)
        .get();

      const invoices = invoicesSnapshot.docs.map((doc) => ({
        invoiceId: doc.id,
        ...doc.data(),
      }));

      return res.status(200).json({ success: true, invoices });
    } else if (action === 'confirm_invoice') {
      const { invoiceId } = req.body;
      if (!invoiceId) return res.status(400).json({ error: 'Missing invoiceId' });

      const invoiceRef = adminDb.collection('school_invoices').doc(invoiceId);

      let invoiceData: Record<string, any>;
      let sanitizedSchoolId: string;
      let teacherCode: string;
      try {
        const result = await adminDb.runTransaction(async (t) => {
          const invoiceSnap = await t.get(invoiceRef);
          if (!invoiceSnap.exists) {
            throw { httpStatus: 404, message: 'Invoice not found' };
          }
          const data = invoiceSnap.data() || {};

          // A double-click, timeout retry, or concurrent request against the
          // same invoiceId used to create a second school (with its own
          // teacherCode) every time it ran, silently orphaning the first one
          // and its seats. Confirming is now a no-op past the first call
          // (Audit: confirm_invoice idempotency).
          if (data.status === 'paid') {
            throw {
              httpStatus: 200,
              alreadyPaid: true,
              schoolId: data.generatedSchoolId,
              teacherCode: data.generatedTeacherCode,
            };
          }

          const academyPrefix = sanitizeSchoolId((data.academyName || 'SCHOOL').replace(/\s+/g, '-')).slice(0, 10) || 'SCHOOL';
          const newSchoolId = `${academyPrefix}_${Date.now().toString().slice(-4)}`;
          const newTeacherCode = `${newSchoolId.split('_')[0]}-TEACHER`;

          // 1. Create school in schools collection
          // ownerEmail (not ownerUid — this director likely has no account yet,
          // invoice-first customers pay before ever signing up) marks who should
          // become this school's director once they do sign up or redeem the
          // teacherCode. redeemTeacherCode (api/redeem.ts) and set-initial-role.ts
          // both check this to claim the school instead of the invoiced director
          // silently landing as a plain 'teacher', or minting a second, orphaned
          // trial school for the same real business (Audit: director path divergence).
          t.set(adminDb.collection('schools').doc(newSchoolId), {
            name: data.academyName || 'B2B Academy',
            teacherCode: newTeacherCode,
            maxUses: data.teacherCount || 5,
            usedByUids: [],
            ownerEmail: (data.email || '').toLowerCase() || null,
            ownerUid: null,
            // Seat pool for the new director-invite system (§21) — derived from
            // the confirmed invoice's plan, same server-owned table used by
            // set-initial-role.ts, never a client-supplied number.
            seatsTotal: seatsForPlan(data.planId),
            createdAt: new Date().toISOString(),
          });

          // 2. Mark invoice as paid
          t.update(invoiceRef, {
            status: 'paid',
            paidAt: new Date().toISOString(),
            generatedSchoolId: newSchoolId,
            generatedTeacherCode: newTeacherCode,
          });

          return { data, schoolId: newSchoolId, teacherCode: newTeacherCode };
        });

        invoiceData = result.data;
        sanitizedSchoolId = result.schoolId;
        teacherCode = result.teacherCode;
      } catch (error: any) {
        if (error && error.alreadyPaid) {
          return res.status(200).json({
            success: true,
            message: 'Invoice already confirmed',
            schoolId: error.schoolId,
            teacherCode: error.teacherCode,
          });
        }
        if (error && typeof error.httpStatus === 'number') {
          return res.status(error.httpStatus).json({ error: error.message });
        }
        throw error;
      }

      // 3. Send automated activation email via Resend
      const resendApiKey = process.env.RESEND_API_KEY;
      if (resendApiKey && invoiceData.email) {
        try {
          await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${resendApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: 'Chekki AI <billing@chekkiai.com>',
              to: [invoiceData.email],
              subject: `🎉 [Chekki AI] ${invoiceData.academyName || '학원'} 입금 확인 및 교사 인증 코드 안내`,
              html: `
                <div style="font-family: 'Apple SD Gothic Neo', -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 28px; background-color: #030305; color: #f4f4f5; border-radius: 20px; border: 1px solid #27272a;">
                  <!-- Header -->
                  <div style="text-align: center; margin-bottom: 28px;">
                    <h1 style="font-size: 32px; font-weight: 900; margin: 0; color: #ffffff; letter-spacing: -0.5px;">Chekki<span style="color: #f97316;">ai</span></h1>
                    <div style="display: inline-block; background-color: rgba(52, 211, 153, 0.15); border: 1px solid rgba(52, 211, 153, 0.3); border-radius: 9999px; padding: 4px 14px; margin-top: 8px;">
                      <span style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; color: #34d399;">🎉 학원 계정 승인 완료</span>
                    </div>
                  </div>

                  <p style="font-size: 15px; color: #e4e4e7; margin-bottom: 8px;">안녕하세요 <strong>${invoiceData.contactName || '선생님'}</strong> 님,</p>
                  <p style="font-size: 14px; color: #a1a1aa; line-height: 1.6; margin-bottom: 24px;">
                    입금이 정상 확인되었습니다. <strong>${invoiceData.academyName || '학원'}</strong>의 교사 전용 인증 코드가 등록되었습니다.
                  </p>

                  <!-- Teacher Code Card -->
                  <div style="background: linear-gradient(135deg, rgba(249, 115, 22, 0.12) 0%, rgba(249, 115, 22, 0.04) 100%); border: 1px solid rgba(249, 115, 22, 0.3); border-radius: 16px; padding: 22px; margin-bottom: 24px; text-align: center;">
                    <p style="font-size: 11px; font-weight: 800; color: #fb923c; margin: 0 0 6px 0; text-transform: uppercase; letter-spacing: 1.5px;">🔑 교사 전용 인증 코드</p>
                    <p style="font-size: 28px; font-weight: 900; color: #ffffff; letter-spacing: 3px; margin: 8px 0; font-family: monospace; text-shadow: 0 2px 10px rgba(249, 115, 22, 0.3);">${teacherCode}</p>
                    <p style="font-size: 12px; color: #a1a1aa; margin: 6px 0 0 0;">(최대 등록 가능 교사: ${invoiceData.teacherCount || 5}명)</p>
                  </div>

                  <!-- Teacher Instructions -->
                  <div style="background-color: #121215; border: 1px solid #27272a; border-radius: 16px; padding: 20px; margin-bottom: 24px;">
                    <h3 style="margin: 0 0 12px 0; color: #ffffff; font-size: 15px; font-weight: 700; display: flex; align-items: center; gap: 8px;">
                      👨‍🏫 교사 계정 시작 방법
                    </h3>
                    <ol style="margin: 0; padding-left: 20px; font-size: 13px; color: #a1a1aa; line-height: 1.8;">
                      <li><a href="https://www.chekkiai.com/teacher" style="color: #f97316; font-weight: bold; text-decoration: underline;">chekkiai.com/teacher</a> 에 접속합니다.</li>
                      <li>계정이 없으신 경우 <strong>회원가입</strong>, 계정이 있으신 경우 <strong>로그인</strong>을 완료합니다.</li>
                      <li>로그인 후 나타나는 인증창에 위 <strong>교사 인증 코드</strong>를 입력합니다.</li>
                      <li>Pro 교사 권한이 활성화되면 학급을 생성하고 6자리 <strong>학급 Join 코드</strong>를 발급받으세요.</li>
                    </ol>
                  </div>

                  <!-- Parent App Download & QR Code Section -->
                  <div style="background-color: #121215; border: 1px solid #27272a; border-radius: 16px; padding: 20px; margin-bottom: 24px; text-align: center;">
                    <h3 style="margin: 0 0 8px 0; color: #ffffff; font-size: 15px; font-weight: 700;">
                      📲 학부모 앱 설치 안내 (iOS / Android 공용)
                    </h3>
                    <p style="font-size: 13px; color: #a1a1aa; line-height: 1.5; margin-bottom: 16px;">
                      학부모님이 스마트폰에서 Chekki AI 앱을 설치하면 숙제 검출 및 오답 데이터가 교사 대시보드와 자동 연동됩니다.
                    </p>

                    <div style="margin: 16px 0;">
                      <a href="https://urlgeni.us/chekki" target="_blank" style="display: inline-block; background-color: #f97316; color: #ffffff; font-weight: 800; font-size: 14px; text-decoration: none; padding: 14px 28px; border-radius: 12px; box-shadow: 0 4px 14px rgba(249, 115, 22, 0.4);">
                        📲 Chekki 앱 다운로드 받기 (App Store / Google Play)
                      </a>
                    </div>

                    <div style="margin-top: 16px; padding-top: 16px; border-top: 1px dashed #27272a;">
                      <p style="font-size: 11px; color: #71717a; margin-bottom: 8px;">PC/모니터로 확인 중이신 경우 스마트폰 카메라로 아래 QR 코드를 스캔하세요:</p>
                      <img src="https://api.qrserver.com/v1/create-qr-code/?size=130x130&data=https://urlgeni.us/chekki" alt="Chekki App Download QR Code" style="border-radius: 8px; border: 2px solid #27272a; width: 130px; height: 130px; margin: 0 auto;" />
                    </div>
                  </div>

                  <!-- Copy-Paste Notice Template for Parents -->
                  <div style="background-color: #18181c; border: 1px dashed rgba(249, 115, 22, 0.4); border-radius: 16px; padding: 20px; margin-bottom: 24px;">
                    <p style="font-size: 12px; font-weight: 800; color: #f97316; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 1px;">
                      📋 [학부모 단톡방 / 카카오톡 전송용 안내 문구]
                    </p>
                    <p style="font-size: 11px; color: #71717a; margin-bottom: 12px;">아래 문구를 복사하여 학부모 단체 카카오톡/밴드/문자로 전송해 주세요:</p>
                    
                    <div style="background-color: #09090b; border: 1px solid #27272a; border-radius: 10px; padding: 14px; font-size: 12px; color: #d4d4d8; line-height: 1.7; font-family: monospace; white-space: pre-wrap;">[${invoiceData.academyName || '학원명'}] Chekki AI 학부모 앱 설치 안내

안녕하세요 학부모님! 
우리 학원에서는 학생들의 체계적인 학습 관리 및 오답 분석을 위해 Chekki AI 시스템을 도입하였습니다.

아래 링크를 통해 스마트폰에 Chekki 앱을 설치해 주세요!

📲 Chekki 앱 다운로드:
https://urlgeni.us/chekki

앱 설치 후 로그인하여 학원에서 안내드리는 6자리 학급 코드를 입력해주시면 가정 숙제 검수 데이터가 선생님과 자동 연동됩니다.

감사합니다.</div>
                  </div>

                  <!-- Footer -->
                  <p style="font-size: 12px; color: #71717a; text-align: center; margin-top: 24px; line-height: 1.6;">
                    문의 사항이 있으시면 <a href="mailto:support@chekkiai.com" style="color: #f97316; text-decoration: underline;">support@chekkiai.com</a> 로 언제든 연락해 주세요.<br/>
                    © 2026 Chekki AI Inc. All rights reserved.
                  </p>
                </div>
              `,
            }),
          });
        } catch (emailErr) {
          console.error('[admin:confirm_invoice] Failed to send email via Resend:', emailErr);
        }
      }

      return res.status(200).json({
        success: true,
        message: 'Payment confirmed and School Account Activated!',
        schoolId: sanitizedSchoolId,
        teacherCode: teacherCode,
      });
    } else if (action === 'delete_invoice') {
      // Dismiss a test/erroneous invoice request. Only removes the request
      // record itself — if it was already confirmed (status: 'paid'), the
      // school it generated is untouched; use delete_school separately for that.
      const { invoiceId } = req.body || {};
      if (typeof invoiceId !== 'string' || !invoiceId) {
        return res.status(400).json({ error: 'Missing invoiceId' });
      }
      await adminDb.collection('school_invoices').doc(invoiceId).delete();
      return res.status(200).json({ success: true });
    } else if (action === 'upgrade_school') {
      // The missing half of confirm_invoice: that action activates a
      // brand-new school from a pre-signup invoice, but nothing updated an
      // *existing* director's school when they paid after starting on the
      // trial. This is the same shape — seatsTotal from the server-owned
      // PLAN_SEATS table, never a client number — just applied to an
      // existing schools/{schoolId} doc instead of creating a new one, and
      // it clears trialEndsAt so the create-class/create-teacher-invite
      // soft-lock stops applying.
      if (!schoolId) return res.status(400).json({ error: 'Missing schoolId' });
      if (!isValidExistingDocId(schoolId)) return res.status(400).json({ error: 'Invalid schoolId' });
      const sanitizedUpgradeSchoolId = schoolId;
      const targetPlanId = req.body?.planId;
      if (!targetPlanId || typeof targetPlanId !== 'string') {
        return res.status(400).json({ error: 'Missing planId' });
      }

      const schoolRef = adminDb.collection('schools').doc(sanitizedUpgradeSchoolId);
      const schoolSnap = await schoolRef.get();
      if (!schoolSnap.exists) return res.status(404).json({ error: 'School not found' });

      const newSeats = seatsForPlan(targetPlanId);
      await schoolRef.update({
        planId: targetPlanId,
        seatsTotal: newSeats,
        trialEndsAt: FieldValue.delete(),
      });

      await notifyDirectors(sanitizedUpgradeSchoolId, {
        type: 'plan_upgraded',
        title: 'Payment confirmed',
        body: `Your school's plan was upgraded to ${targetPlanId} (${newSeats} seats).`,
        meta: { planId: targetPlanId, seatsTotal: newSeats },
      });

      return res.status(200).json({
        success: true,
        message: 'School upgraded successfully',
        schoolId: sanitizedUpgradeSchoolId,
        planId: targetPlanId,
        seatsTotal: newSeats,
      });
    } else if (action === 'assign_teacher') {
      if (!schoolId) return res.status(400).json({ error: 'Missing schoolId' });
      if (!isValidExistingDocId(schoolId)) return res.status(400).json({ error: 'Invalid schoolId' });
      const sanitizedAssignSchoolId = schoolId;
      let targetUid = uid;

      if (!targetUid && email) {
        const cleanEmail = email.toLowerCase().trim();
        const usersRef = adminDb.collection('users');
        const q = usersRef.where('email', '==', cleanEmail);
        const querySnapshot = await q.get();

        if (querySnapshot.empty) {
          return res.status(404).json({ error: 'User not found in Firestore.' });
        }
        targetUid = querySnapshot.docs[0].id;
      }

      if (!targetUid) return res.status(400).json({ error: 'Missing uid or email' });

      const schoolDoc = await adminDb.collection('schools').doc(sanitizedAssignSchoolId).get();
      if (!schoolDoc.exists) {
        return res.status(404).json({ error: 'School not found' });
      }

      const sName = schoolDoc.data()?.name || sanitizedAssignSchoolId;

      await adminDb.collection('users').doc(targetUid).set(
        {
          role: 'teacher',
          schoolId: sanitizedAssignSchoolId,
          schoolName: sName,
          plan: 'pro',
          maxScansPerDay: 9999,
          maxQuestionsPerDay: 9999,
          subscriptionPlatform: 'admin_assign',
        },
        { merge: true }
      );

      // Add user to usedByUids array on the school doc
      await adminDb
        .collection('schools')
        .doc(sanitizedAssignSchoolId)
        .update({
          usedByUids: FieldValue.arrayUnion(targetUid),
        });

      await syncAuthClaims(targetUid);

      return res
        .status(200)
        .json({ success: true, message: 'User assigned as teacher successfully' });
    } else if (action === 'impersonate') {
      if (!uid) return res.status(400).json({ error: 'Missing uid' });
      const customToken = await authDb.createCustomToken(uid);
      return res.status(200).json({ success: true, customToken });
    } else if (action === 'purge_demo_data') {
      // Finds and (only when dryRun === false) deletes: (1) any user whose
      // email contains "demo" or "test", and (2) orphaned curriculums/demo_*
      // docs — leftovers from the shared placeholder id bug where every
      // account's empty-state preview used the literal id "demo" (fixed
      // client-side, but past writes under that id are still sitting in
      // Firestore). Defaults to a dry run so the caller always sees exactly
      // what would be deleted before committing to it.
      const dryRun = req.body?.dryRun !== false;
      const DEMO_EMAIL_PATTERN = /demo|test/i;

      const usersSnap = await adminDb.collection('users').get();
      const matchedUsers = usersSnap.docs.filter((d) => DEMO_EMAIL_PATTERN.test(d.data()?.email || ''));

      const curriculumsSnap = await adminDb.collection('curriculums').get();
      const matchedCurriculums = curriculumsSnap.docs.filter((d) => d.id.startsWith('demo_') || d.id.startsWith('demo_week_'));

      if (dryRun) {
        return res.status(200).json({
          success: true,
          dryRun: true,
          users: matchedUsers.map((d) => ({ uid: d.id, email: d.data()?.email || null })),
          curriculumDocIds: matchedCurriculums.map((d) => d.id),
        });
      }

      let deletedUsers = 0;
      for (const userDoc of matchedUsers) {
        try {
          await adminDb.collection('users').doc(userDoc.id).delete();
          deletedUsers++;
        } catch (e) {
          console.error('[purge_demo_data] Failed to delete user doc:', userDoc.id, e);
        }
        try {
          await authDb.deleteUser(userDoc.id);
        } catch (e: any) {
          if (e.code !== 'auth/user-not-found') {
            console.error('[purge_demo_data] Failed to delete Auth user:', userDoc.id, e);
          }
        }
      }

      let deletedCurriculums = 0;
      for (const curriculumDoc of matchedCurriculums) {
        try {
          await adminDb.collection('curriculums').doc(curriculumDoc.id).delete();
          deletedCurriculums++;
        } catch (e) {
          console.error('[purge_demo_data] Failed to delete curriculum doc:', curriculumDoc.id, e);
        }
      }

      return res.status(200).json({ success: true, dryRun: false, deletedUsers, deletedCurriculums });
    } else if (action === 'sweep_orphaned_class_assignments') {
      // Cleanup for a class of stale data left by the pre-fix client-side
      // class-delete path (silently permission-denied, so the class doc
      // survived) and the schoolId-sanitization bug (delete_school/
      // upgrade_school retargeting the wrong doc): a class's teacherUid or
      // assignedTeacherUids can still list a uid whose own user doc's
      // schoolId no longer matches the class's schoolId (moved/removed from
      // that school) or whose user doc is gone entirely. isSchoolDirectorOfClass()/
      // isClassTeacher() in firestore.rules both do a schoolId/role
      // cross-check against the class doc, so a single such stale entry
      // permission-denies the *entire* array-contains query for that uid —
      // this is why a director's fetchClasses() could throw
      // "Missing or insufficient permissions" for a brand-new account with
      // zero real classes.
      const dryRun = req.body?.dryRun !== false;

      const classesSnap = await adminDb.collection('classes').get();
      const userCache = new Map<string, any | null>();
      const getUser = async (targetUid: string) => {
        if (userCache.has(targetUid)) return userCache.get(targetUid);
        const snap = await adminDb.collection('users').doc(targetUid).get();
        const val = snap.exists ? snap.data() : null;
        userCache.set(targetUid, val);
        return val;
      };

      const findings: Array<{
        classId: string;
        className: string;
        classSchoolId: string | null;
        field: 'teacherUid' | 'assignedTeacherUids';
        uid: string;
        reason: string;
      }> = [];

      for (const classDoc of classesSnap.docs) {
        const data = classDoc.data();
        const classSchoolId = data.schoolId || null;
        const uidsToCheck: Array<{ field: 'teacherUid' | 'assignedTeacherUids'; uid: string }> = [];
        if (data.teacherUid) uidsToCheck.push({ field: 'teacherUid', uid: data.teacherUid });
        if (Array.isArray(data.assignedTeacherUids)) {
          for (const u of data.assignedTeacherUids) uidsToCheck.push({ field: 'assignedTeacherUids', uid: u });
        }

        for (const { field, uid: checkUid } of uidsToCheck) {
          const userData = await getUser(checkUid);
          if (!userData) {
            findings.push({ classId: classDoc.id, className: data.name || classDoc.id, classSchoolId, field, uid: checkUid, reason: 'user_missing' });
          } else if (userData.schoolId !== classSchoolId) {
            findings.push({ classId: classDoc.id, className: data.name || classDoc.id, classSchoolId, field, uid: checkUid, reason: 'schoolId_mismatch' });
          }
        }
      }

      if (dryRun) {
        return res.status(200).json({ success: true, dryRun: true, findingsCount: findings.length, findings });
      }

      let fixedClasses = 0;
      const byClass = new Map<string, typeof findings>();
      for (const f of findings) {
        if (!byClass.has(f.classId)) byClass.set(f.classId, []);
        byClass.get(f.classId)!.push(f);
      }
      for (const [classId, classFindings] of byClass.entries()) {
        const update: Record<string, any> = {};
        if (classFindings.some((f) => f.field === 'teacherUid')) {
          update.teacherUid = FieldValue.delete();
        }
        const staleAssigned = classFindings.filter((f) => f.field === 'assignedTeacherUids').map((f) => f.uid);
        if (staleAssigned.length > 0) {
          update.assignedTeacherUids = FieldValue.arrayRemove(...staleAssigned);
        }
        await adminDb.collection('classes').doc(classId).update(update);
        fixedClasses++;
      }

      return res.status(200).json({ success: true, dryRun: false, fixedClasses, findingsCount: findings.length, findings });
    } else if (action === 'debug_director_classes') {
      // Read-only diagnostic — dumps the RAW server-side truth for one
      // account instead of reasoning about the client's possibly-stale
      // AuthContext cache. TeacherPage.tsx's fetchClasses trusts
      // client-side `user.schoolId` (stale-while-revalidate from
      // localStorage, see contexts/AuthContext.tsx's cached-profile
      // comment) to build its schoolId-scoped query; if that value is out
      // of sync with what's actually in Firestore, the query silently
      // filters on the wrong id. This surfaces the mismatch directly
      // (audit: "couldn't load classes" persisted after two rounds of
      // logically-sound fixes — needed real data, not more reasoning).
      const { email } = req.body || {};
      if (!email || typeof email !== 'string') {
        return res.status(400).json({ error: 'email is required' });
      }
      const cleanEmail = email.toLowerCase().trim();
      const userQuery = await adminDb.collection('users').where('email', '==', cleanEmail).limit(1).get();
      if (userQuery.empty) {
        return res.status(404).json({ error: 'No user found with that email' });
      }
      const userDoc = userQuery.docs[0];
      const userData = userDoc.data();
      const uid = userDoc.id;
      const realSchoolId = userData.schoolId || null;

      // firestore.rules' isSchoolDirectorOfClass() does
      // get(users/$(request.auth.uid)).data.role — with no exists() guard
      // (unlike isClassTeacher() right above it, which explicitly guards
      // for this same reason). If the signed-in Firebase Auth UID has no
      // matching users/{uid} doc, that .data access crashes the rule
      // evaluation and Firestore fails closed as permission-denied for
      // every read gated by that function — which is nearly everything a
      // director does. This checks whether that's actually happening here.
      let authUid: string | null = null;
      let authUidMatchesFirestoreDoc: boolean | null = null;
      try {
        const authUser = await authDb.getUserByEmail(cleanEmail);
        authUid = authUser.uid;
        authUidMatchesFirestoreDoc = authUser.uid === uid;
      } catch (e: any) {
        authUid = null;
        authUidMatchesFirestoreDoc = null;
      }

      const [byTeacherUid, byAssigned, bySchoolId] = await Promise.all([
        adminDb.collection('classes').where('teacherUid', '==', uid).get(),
        adminDb.collection('classes').where('assignedTeacherUids', 'array-contains', uid).get(),
        realSchoolId
          ? adminDb.collection('classes').where('schoolId', '==', realSchoolId).get()
          : Promise.resolve({ docs: [] } as any),
      ]);

      const summarize = (snap: any) =>
        snap.docs.map((d: any) => ({
          id: d.id,
          name: d.data().name,
          schoolId: d.data().schoolId,
          teacherUid: d.data().teacherUid,
          assignedTeacherUids: d.data().assignedTeacherUids || [],
          createdAt: d.data().createdAt || null,
        }));

      return res.status(200).json({
        success: true,
        user: {
          uid,
          email: userData.email,
          role: userData.role || null,
          schoolId: realSchoolId,
          educatorRole: userData.educatorRole || null,
          authUid,
          authUidMatchesFirestoreDoc,
        },
        classesByTeacherUid: summarize(byTeacherUid),
        classesByAssignedTeacherUids: summarize(byAssigned),
        classesBySchoolId: summarize(bySchoolId),
      });
    } else if (action === 'backfill_auth_claims') {
      // One-time sweep: every existing account was assigned role/schoolId
      // before Auth custom claims existed, so none of them carry the claims
      // firestore.rules now needs to read director/teacher classes without
      // the get()-in-a-list-query permission-denied bug. Sets every user's
      // claims to match their current Firestore doc. Already-signed-in
      // sessions still need a token refresh (forced client-side after
      // sign-in, or a natural ~1hr refresh) before the new claims take
      // effect — this only updates the Auth-side record.
      const usersSnap = await adminDb.collection('users').select('role', 'schoolId').get();
      let updated = 0;
      let failed = 0;
      const failedUids: string[] = [];
      // 174 accounts one-at-a-time blew past Vercel's function timeout (the
      // Auth Admin API call is a network round trip each, ~100-300ms — fine
      // sequentially for a handful of accounts, not for the whole user
      // base). Batches of 20 in parallel finish well inside the limit.
      const BATCH_SIZE = 20;
      for (let i = 0; i < usersSnap.docs.length; i += BATCH_SIZE) {
        const batch = usersSnap.docs.slice(i, i + BATCH_SIZE);
        const results = await Promise.allSettled(
          batch.map((userDoc) => {
            const data = userDoc.data();
            return authDb.setCustomUserClaims(userDoc.id, { role: data.role || null, schoolId: data.schoolId || null });
          })
        );
        results.forEach((r, idx) => {
          if (r.status === 'fulfilled') updated++;
          else {
            failed++;
            failedUids.push(batch[idx].id);
          }
        });
      }
      return res.status(200).json({ success: true, totalUsers: usersSnap.size, updated, failed, failedUids });
    } else if (action === 'simulate_client_read') {
      // debug_director_classes proved the data and the Auth UID are both
      // correct — but it reads via the Admin SDK, which bypasses
      // firestore.rules entirely, so it can't explain a client-side
      // permission-denied. This mints a real custom token for the target
      // uid and runs the SAME three queries TeacherPage.tsx's fetchClasses
      // runs, through the actual client SDK (firestore.rules enforced,
      // exactly like the browser), to see which specific query fails and
      // why — real rule evaluation instead of reading rule text and
      // guessing a third time.
      const { email } = req.body || {};
      if (!email || typeof email !== 'string') {
        return res.status(400).json({ error: 'email is required' });
      }
      const cleanEmail = email.toLowerCase().trim();
      const userQuery = await adminDb.collection('users').where('email', '==', cleanEmail).limit(1).get();
      if (userQuery.empty) {
        return res.status(404).json({ error: 'No user found with that email' });
      }
      const targetUid = userQuery.docs[0].id;
      const targetSchoolId = userQuery.docs[0].data().schoolId || null;
      const sampleClassSnap = await adminDb.collection('classes').where('teacherUid', '==', targetUid).limit(1).get();
      const sampleClassId = sampleClassSnap.empty ? null : sampleClassSnap.docs[0].id;

      // Admin SDK bypasses rules entirely — ground truth on exactly what's
      // in the doc(s) the client-side classId-filtered query keeps denying
      // on, instead of reasoning about rule text further.
      const sampleClassDoc = sampleClassId ? sampleClassSnap.docs[0].data() : null;
      const rawPendingByClassId = sampleClassId
        ? (await adminDb.collection('pendingStudents').where('classId', '==', sampleClassId).get()).docs.map((d) => ({ id: d.id, ...d.data() }))
        : [];

      const customToken = await authDb.createCustomToken(targetUid);

      const { initializeApp: initClientApp, getApps: getClientApps, getApp: getClientApp, deleteApp } = await import('firebase/app');
      const { getAuth: getClientAuth, signInWithCustomToken } = await import('firebase/auth');
      const { getFirestore: getClientFirestore, collection, query: fbQuery, where, getDocs, doc, getDoc } = await import('firebase/firestore');

      const firebaseConfig = {
        apiKey: 'AIzaSyBU8ehL18e1y-WXMULzA9XkKFkC7BkzX8k',
        authDomain: 'homework-assistant-c00b9.firebaseapp.com',
        projectId: 'homework-assistant-c00b9',
        storageBucket: 'homework-assistant-c00b9.firebasestorage.app',
        messagingSenderId: '123535525914',
        appId: '1:123535525914:web:decc3f5b3e3ffee4a0a9a3',
      };
      const appName = `simulate-${Date.now()}`;
      const clientApp = getClientApps().some((a) => a.name === appName)
        ? getClientApp(appName)
        : initClientApp(firebaseConfig, appName);
      const clientAuth = getClientAuth(clientApp);
      const db = getClientFirestore(clientApp);

      const results: Record<string, any> = {};
      try {
        await signInWithCustomToken(clientAuth, customToken);

        const tryQuery = async (label: string, q: any) => {
          try {
            const snap = await getDocs(q);
            results[label] = { ok: true, docCount: snap.docs.length };
          } catch (e: any) {
            results[label] = { ok: false, code: e?.code || null, message: e?.message || String(e) };
          }
        };

        await tryQuery('teacherUid_eq_uid', fbQuery(collection(db, 'classes'), where('teacherUid', '==', targetUid)));
        await tryQuery('assignedTeacherUids_array_contains_uid', fbQuery(collection(db, 'classes'), where('assignedTeacherUids', 'array-contains', targetUid)));
        if (targetSchoolId) {
          await tryQuery('schoolId_eq_schoolId', fbQuery(collection(db, 'classes'), where('schoolId', '==', targetSchoolId)));
        }

        try {
          const d = await getDoc(doc(db, 'users', targetUid));
          results['own_users_doc_read'] = { ok: true, exists: d.exists(), role: d.data()?.role, schoolId: d.data()?.schoolId };
        } catch (e: any) {
          results['own_users_doc_read'] = { ok: false, code: e?.code || null, message: e?.message || String(e) };
        }

        // Distinguishes a plain single-doc get() (rule runs once, directly)
        // from a list/query (Firestore must prove the rule holds for every
        // possible result up front) — a get() succeeding where the
        // equivalent list fails would confirm this is specifically a
        // list-query limitation on get()-based rules, not a broken rule.
        if (sampleClassId) {
          try {
            const d = await getDoc(doc(db, 'classes', sampleClassId));
            results['single_class_doc_get'] = { ok: true, exists: d.exists(), classId: sampleClassId };
          } catch (e: any) {
            results['single_class_doc_get'] = { ok: false, code: e?.code || null, message: e?.message || String(e), classId: sampleClassId };
          }

          // Reproduces the "student added but never appears" report exactly
          // — same collections, same query shape, as StudentInvitePanel and
          // fetchRosterAndMistakes, but with firestore.rules actually
          // enforced (unlike the Admin SDK reads elsewhere in this action).
          await tryQuery('pendingStudents_classId_eq', fbQuery(collection(db, 'pendingStudents'), where('classId', '==', sampleClassId)));
          await tryQuery('users_classId_eq', fbQuery(collection(db, 'users'), where('classId', '==', sampleClassId)));
        }
        if (targetSchoolId) {
          await tryQuery('pendingStudents_schoolId_eq', fbQuery(collection(db, 'pendingStudents'), where('schoolId', '==', targetSchoolId)));
        }

        // The ID token minted for this session should carry whatever custom
        // claims are currently set on the account — if role/schoolId here
        // don't match the Firestore user doc's own fields, every rule that
        // reads request.auth.token.* is silently checking stale/wrong values
        // no amount of query retrying can fix.
        try {
          const tokenResult = await clientAuth.currentUser?.getIdTokenResult();
          results['id_token_claims'] = { role: tokenResult?.claims?.role ?? null, schoolId: tokenResult?.claims?.schoolId ?? null };
        } catch (e: any) {
          results['id_token_claims'] = { error: e?.message || String(e) };
        }
      } finally {
        await deleteApp(clientApp).catch(() => {});
      }

      return res.status(200).json({ success: true, targetUid, targetSchoolId, sampleClassId, sampleClassDoc, rawPendingByClassId, results });
    } else {
      return res.status(400).json({ error: 'Invalid action' });
    }
  } catch (err: any) {
    console.error(`[admin] Error (${action}):`, err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export default withSentry(handler);
