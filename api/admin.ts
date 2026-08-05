import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withSentry } from './_lib/withSentry';
import { FieldValue } from 'firebase-admin/firestore';
import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';
import { adminDb, adminAuth as authDb } from './_lib/firebaseAdmin';
import { seatsForPlan } from './_lib/pricingTiers';
import { applyCors } from './_lib/cors';

const ADMIN_PASSCODE = process.env.ADMIN_PASSCODE;

// schoolId becomes a Firestore doc ID via .doc(sanitizedSchoolId) below — the
// Admin SDK treats '/' in that string as a subcollection path separator, so
// an unrestricted schoolId (e.g. containing '/') could target an arbitrary
// nested path instead of a single schools/{id} document. Strip to a safe,
// still-human-readable charset.
export function sanitizeSchoolId(raw: string): string {
  return raw.toUpperCase().trim().replace(/[^A-Z0-9_-]/g, '');
}

// This endpoint gates account impersonation, deletion, and upgrades behind a
// single shared passcode — rate limit failed attempts hard so it can't be
// brute-forced (audit §15a).
const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
const redis = redisUrl && redisToken ? new Redis({ url: redisUrl, token: redisToken }) : null;
const ratelimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, '60 s'),
      analytics: true,
    })
  : null;

async function handler(req: VercelRequest, res: VercelResponse) {
  applyCors(req, res);

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { passcode, action, uid, email, duration, schoolId, schoolName, teacherCode, maxUses } =
    req.body || {};

  if (!ADMIN_PASSCODE) {
    return res.status(500).json({ error: 'Admin passcode is not configured.' });
  }

  if (ratelimit) {
    const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'anonymous';
    const ipString = Array.isArray(ip) ? ip[0] : ip;
    const { success, limit, reset, remaining } = await ratelimit.limit(`admin_${ipString}`);
    res.setHeader('X-RateLimit-Limit', limit.toString());
    res.setHeader('X-RateLimit-Remaining', remaining.toString());
    res.setHeader('X-RateLimit-Reset', reset.toString());
    if (!success) {
      console.warn(`[admin.ts] Rate limit exceeded for IP: ${ipString}`);
      return res.status(429).json({ error: 'Too many attempts. Try again later.' });
    }
  }

  if (passcode !== ADMIN_PASSCODE) {
    return res.status(401).json({ error: 'Unauthorized: Invalid Passcode' });
  }

  // Persistent audit trail for every admin action (not just console output,
  // which is easy to lose in Vercel's rolling log retention). The passcode
  // is shared/anonymous, so this is the only record of what an admin did.
  const auditIp = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
  adminDb.collection('adminAuditLog').add({
    action,
    uid: uid || null,
    email: email || null,
    schoolId: schoolId || null,
    ip: Array.isArray(auditIp) ? auditIp[0] : auditIp,
    at: new Date().toISOString(),
  }).catch((auditErr) => {
    console.error('[admin.ts] Failed to write audit log:', auditErr);
  });

  try {
    if (action === 'list') {
      const usersSnapshot = await adminDb
        .collection('users')
        .orderBy('subscriptionStartedAt', 'desc')
        .limit(100)
        .get();

      const users = usersSnapshot.docs.map((doc) => {
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
            await adminDb
              .collection('schools')
              .doc(userSchoolId)
              .update({
                usedByUids: FieldValue.arrayRemove(uidToDeleteFromFirestore),
              });
          }
        }
        await adminDb.collection('users').doc(uidToDeleteFromFirestore).delete();
      } catch (dbErr) {
        console.error('Error deleting user from Firestore:', dbErr);
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
        };
      });

      return res.status(200).json({ success: true, schools });
    } else if (action === 'delete_school') {
      if (!schoolId) return res.status(400).json({ error: 'Missing schoolId' });
      const sanitizedSchoolId = sanitizeSchoolId(schoolId);
      if (!sanitizedSchoolId) return res.status(400).json({ error: 'Invalid schoolId' });

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
      const invoiceSnap = await invoiceRef.get();
      if (!invoiceSnap.exists) return res.status(404).json({ error: 'Invoice not found' });

      const invoiceData = invoiceSnap.data() || {};
      const academyPrefix = sanitizeSchoolId((invoiceData.academyName || 'SCHOOL').replace(/\s+/g, '-')).slice(0, 10) || 'SCHOOL';
      const sanitizedSchoolId = `${academyPrefix}_${Date.now().toString().slice(-4)}`;
      const teacherCode = `${sanitizedSchoolId.split('_')[0]}-TEACHER`;

      // 1. Create school in schools collection
      await adminDb.collection('schools').doc(sanitizedSchoolId).set({
        name: invoiceData.academyName || 'B2B Academy',
        teacherCode: teacherCode,
        maxUses: invoiceData.teacherCount || 5,
        usedByUids: [],
        // Seat pool for the new director-invite system (§21) — derived from
        // the confirmed invoice's plan, same server-owned table used by
        // set-initial-role.ts, never a client-supplied number.
        seatsTotal: seatsForPlan(invoiceData.planId),
        createdAt: new Date().toISOString(),
      });

      // 2. Mark invoice as paid
      await invoiceRef.update({
        status: 'paid',
        paidAt: new Date().toISOString(),
        generatedSchoolId: sanitizedSchoolId,
        generatedTeacherCode: teacherCode,
      });

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
                      <li><a href="https://chekkiai.com/teacher" style="color: #f97316; font-weight: bold; text-decoration: underline;">chekkiai.com/teacher</a> 에 접속합니다.</li>
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
      const targetPlanId = req.body?.planId;
      if (!targetPlanId || typeof targetPlanId !== 'string') {
        return res.status(400).json({ error: 'Missing planId' });
      }

      const schoolRef = adminDb.collection('schools').doc(schoolId);
      const schoolSnap = await schoolRef.get();
      if (!schoolSnap.exists) return res.status(404).json({ error: 'School not found' });

      const newSeats = seatsForPlan(targetPlanId);
      await schoolRef.update({
        planId: targetPlanId,
        seatsTotal: newSeats,
        trialEndsAt: FieldValue.delete(),
      });

      return res.status(200).json({
        success: true,
        message: 'School upgraded successfully',
        schoolId,
        planId: targetPlanId,
        seatsTotal: newSeats,
      });
    } else if (action === 'assign_teacher') {
      if (!schoolId) return res.status(400).json({ error: 'Missing schoolId' });
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

      const schoolDoc = await adminDb.collection('schools').doc(schoolId).get();
      if (!schoolDoc.exists) {
        return res.status(404).json({ error: 'School not found' });
      }

      const sName = schoolDoc.data()?.name || schoolId;

      await adminDb.collection('users').doc(targetUid).set(
        {
          role: 'teacher',
          schoolId: schoolId,
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
        .doc(schoolId)
        .update({
          usedByUids: FieldValue.arrayUnion(targetUid),
        });

      return res
        .status(200)
        .json({ success: true, message: 'User assigned as teacher successfully' });
    } else if (action === 'impersonate') {
      if (!uid) return res.status(400).json({ error: 'Missing uid' });
      const customToken = await authDb.createCustomToken(uid);
      return res.status(200).json({ success: true, customToken });
    } else {
      return res.status(400).json({ error: 'Invalid action' });
    }
  } catch (err: any) {
    console.error(`[admin] Error (${action}):`, err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export default withSentry(handler);
