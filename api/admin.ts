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
import { sendEmail, escapeHtml, emailLayout, emailButton } from './_lib/email.js';

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

  const { passcode, action, uid, email, duration, schoolId, schoolName, maxUses } =
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

  // The passcode alone was a single shared secret gating impersonation and
  // deletion. Also require a signed-in account listed in admins/{uid} (the
  // same collection firestore.rules' isAdmin() checks).
  const adminAuthHeader = req.headers.authorization;
  if (!adminAuthHeader || !adminAuthHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Admin login required. Sign in to Chekki with your admin account first.' });
  }
  let adminUid: string;
  try {
    adminUid = (await authDb.verifyIdToken(adminAuthHeader.split('Bearer ')[1].trim())).uid;
  } catch {
    return res.status(401).json({ error: 'Admin session expired. Sign in again.' });
  }
  const adminDoc = await adminDb.collection('admins').doc(adminUid).get();
  if (!adminDoc.exists) {
    return res.status(403).json({ error: 'This account is not an admin.' });
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
      adminUid,
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
    } else if (action === 'create_pro_user') {
      // Server-side so the admin's own session isn't replaced by the new
      // account (client createUserWithEmailAndPassword signs in as it).
      const { password, name, duration: proDuration } = req.body || {};
      if (!email || typeof email !== 'string') return res.status(400).json({ error: 'Missing email' });
      if (typeof password !== 'string' || password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' });
      }
      const cleanEmail = email.toLowerCase().trim();
      let created;
      try {
        created = await authDb.createUser({ email: cleanEmail, password, displayName: name || undefined });
      } catch (e: any) {
        if (e.code === 'auth/email-already-exists') {
          return res.status(409).json({ error: 'This email is already registered — use the Upgrade tab.', alreadyExists: true });
        }
        throw e;
      }
      const years = proDuration === 'lifetime' ? 100 : proDuration === '1_year' ? 1 : 0;
      const nextBilling = new Date();
      if (years) nextBilling.setFullYear(nextBilling.getFullYear() + years);
      else nextBilling.setMonth(nextBilling.getMonth() + 1);
      const today = new Date().toISOString().split('T')[0];
      await adminDb.collection('users').doc(created.uid).set({
        uid: created.uid,
        name: name || 'User',
        email: cleanEmail,
        role: 'parent',
        plan: 'pro',
        scansUsedToday: 0,
        lastScanDate: today,
        maxScansPerDay: 9999,
        questionsUsedToday: 0,
        lastQuestionDate: today,
        maxQuestionsPerDay: 9999,
        schoolId: null,
        schoolName: null,
        subscriptionStartedAt: new Date().toISOString(),
        nextBillingDate: nextBilling.toISOString(),
        subscriptionPlatform: 'admin_upgrade',
        createdAt: new Date().toISOString(),
      });
      return res.status(200).json({ success: true, uid: created.uid });
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

      const sanitizedSchoolId = sanitizeSchoolId(schoolId);
      if (!sanitizedSchoolId) return res.status(400).json({ error: 'Invalid schoolId' });

      await adminDb
        .collection('schools')
        .doc(sanitizedSchoolId)
        .set({
          name: schoolName.trim(),
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
          schoolCode: data.schoolCode || '',
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
            educatorRole: FieldValue.delete(),
            classId: null,
            classStatus: null,
            plan: 'free',
            maxScansPerDay: 2,
            maxQuestionsPerDay: 5,
            subscriptionPlatform: FieldValue.delete(),
          });
        });
        await batch.commit();
        // Claims don't follow the user doc on their own.
        await Promise.allSettled(teachersSnapshot.docs.map((d) => syncAuthClaims(d.id)));
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
      let resolvedSchoolId: string;
      let upgradedExisting = false;
      try {
        const result = await adminDb.runTransaction(async (t) => {
          const invoiceSnap = await t.get(invoiceRef);
          if (!invoiceSnap.exists) {
            throw { httpStatus: 404, message: 'Invoice not found' };
          }
          const data = invoiceSnap.data() || {};

          // Idempotent: a double-click or retry must not create a second school.
          if (data.status === 'paid') {
            throw { httpStatus: 200, alreadyPaid: true, schoolId: data.generatedSchoolId };
          }

          const planId = data.planId || 'starter';
          const seatsTotal = seatsForPlan(planId);
          const paidUpdate = { status: 'paid', paidAt: new Date().toISOString() };

          // An already-onboarded director requesting seats from their own
          // portal sends schoolId — upgrade that school instead of minting a
          // second, disconnected one.
          if (typeof data.schoolId === 'string' && isValidExistingDocId(data.schoolId)) {
            const existingRef = adminDb.collection('schools').doc(data.schoolId);
            const existingSnap = await t.get(existingRef);
            if (existingSnap.exists) {
              t.update(existingRef, { planId, seatsTotal, trialEndsAt: FieldValue.delete() });
              t.update(invoiceRef, { ...paidUpdate, generatedSchoolId: data.schoolId });
              return { data, schoolId: data.schoolId, upgradedExisting: true };
            }
          }

          const academyPrefix = sanitizeSchoolId((data.academyName || 'SCHOOL').replace(/\s+/g, '-')).slice(0, 10) || 'SCHOOL';
          const newSchoolId = `${academyPrefix}_${generateJoinCode()}`;

          // No account exists yet for an invoice-first director. ownerEmail
          // lets set-initial-role.ts hand them this school when they sign up
          // as a director with that (verified) email.
          t.set(adminDb.collection('schools').doc(newSchoolId), {
            name: data.academyName || 'B2B Academy',
            planId,
            seatsTotal,
            usedByUids: [],
            ownerEmail: (data.email || '').toLowerCase() || null,
            ownerUid: null,
            createdAt: new Date().toISOString(),
          });
          t.update(invoiceRef, { ...paidUpdate, generatedSchoolId: newSchoolId });

          return { data, schoolId: newSchoolId, upgradedExisting: false };
        });

        invoiceData = result.data;
        resolvedSchoolId = result.schoolId;
        upgradedExisting = result.upgradedExisting;
      } catch (error: any) {
        if (error && error.alreadyPaid) {
          return res.status(200).json({ success: true, message: 'Invoice already confirmed', schoolId: error.schoolId });
        }
        if (error && typeof error.httpStatus === 'number') {
          return res.status(error.httpStatus).json({ error: error.message });
        }
        throw error;
      }

      if (upgradedExisting) {
        await notifyDirectors(resolvedSchoolId, {
          type: 'plan_upgraded',
          title: 'Payment confirmed',
          body: `Your school's plan was upgraded to ${invoiceData.planId || 'starter'}.`,
          meta: { planId: invoiceData.planId || 'starter' },
        });
      }

      const academyName = escapeHtml(invoiceData.academyName || '학원');
      const contactName = escapeHtml(invoiceData.contactName || '원장');
      const ownerEmail = escapeHtml(invoiceData.email || '');
      const emailSent = invoiceData.email
        ? await sendEmail({
            to: invoiceData.email,
            subject: `[Chekki AI] ${invoiceData.academyName || '학원'} 입금 확인 안내`,
            html: emailLayout(
              upgradedExisting
                ? `
              <p style="font-size: 15px; color: #e4e4e7;">안녕하세요 <strong>${contactName}</strong> 님,</p>
              <p style="font-size: 14px; color: #a1a1aa; line-height: 1.6;">입금이 확인되어 <strong>${academyName}</strong>의 플랜이 업그레이드되었습니다. 대시보드에서 바로 선생님을 추가로 초대하실 수 있습니다.</p>
              ${emailButton('https://www.chekkiai.com/teacher', '대시보드 열기')}`
                : `
              <p style="font-size: 15px; color: #e4e4e7;">안녕하세요 <strong>${contactName}</strong> 님,</p>
              <p style="font-size: 14px; color: #a1a1aa; line-height: 1.6;">입금이 확인되어 <strong>${academyName}</strong> 학원 계정이 준비되었습니다.</p>
              <ol style="font-size: 14px; color: #a1a1aa; line-height: 1.8; padding-left: 20px;">
                <li>아래 버튼으로 접속해 <strong>원장(Director)</strong>으로 가입해 주세요. 반드시 이 이메일(<strong>${ownerEmail}</strong>)로 가입해야 학원이 자동 연결됩니다.</li>
                <li>이메일 인증 링크가 오면 눌러주세요.</li>
                <li>대시보드에서 반을 만들고 선생님과 학생(학부모)을 초대하세요. 학부모님께는 개별 초대 메일이 발송됩니다.</li>
              </ol>
              ${emailButton('https://www.chekkiai.com/teacher', '원장 계정 만들기')}`
            ),
          })
        : false;

      return res.status(200).json({
        success: true,
        message: upgradedExisting ? 'Payment confirmed — existing school upgraded.' : 'Payment confirmed and school account created.',
        schoolId: resolvedSchoolId,
        upgradedExisting,
        emailSent,
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
    } else {
      return res.status(400).json({ error: 'Invalid action' });
    }
  } catch (err: any) {
    console.error(`[admin] Error (${action}):`, err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export default withSentry(handler);
