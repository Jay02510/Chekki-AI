import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

const ADMIN_PASSCODE = process.env.ADMIN_PASSCODE;

function initAdmin() {
  if (getApps().length > 0) return;
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (serviceAccount) {
    try {
      const cleaned = serviceAccount.trim().replace(/\n/g, '').replace(/\r/g, '');
      const parsed = JSON.parse(cleaned);
      initializeApp({ credential: cert(parsed) });
    } catch (e) {
      console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT:', e);
      initializeApp();
    }
  } else {
    initializeApp();
  }
}

initAdmin();
const adminDb = getFirestore();
const authDb = getAuth();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { passcode, action, uid, email, duration, schoolId, schoolName, teacherCode, maxUses } =
    req.body || {};

  if (passcode !== ADMIN_PASSCODE) {
    return res.status(401).json({ error: 'Unauthorized: Invalid Passcode' });
  }

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

      const sanitizedSchoolId = schoolId.toUpperCase().trim();
      const sanitizedTeacherCode = teacherCode.toUpperCase().trim();

      await adminDb
        .collection('schools')
        .doc(sanitizedSchoolId)
        .set({
          name: schoolName.trim(),
          teacherCode: sanitizedTeacherCode,
          maxUses: maxUses ? parseInt(maxUses, 10) : 5,
          usedByUids: [],
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
      const sanitizedSchoolId = schoolId.toUpperCase().trim();

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
      const sanitizedSchoolId = (invoiceData.academyName || 'SCHOOL').toUpperCase().replace(/\s+/g, '-').slice(0, 10) + `_${Date.now().toString().slice(-4)}`;
      const teacherCode = `${sanitizedSchoolId.split('_')[0]}-TEACHER`;

      // 1. Create school in schools collection
      await adminDb.collection('schools').doc(sanitizedSchoolId).set({
        name: invoiceData.academyName || 'B2B Academy',
        teacherCode: teacherCode,
        maxUses: invoiceData.teacherCount || 5,
        usedByUids: [],
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
                <div style="font-family: 'Apple SD Gothic Neo', sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background-color: #030305; color: #f4f4f5; border-radius: 16px;">
                  <div style="text-align: center; margin-bottom: 24px;">
                    <h1 style="font-size: 28px; font-weight: 900; margin: 0; color: #ffffff;">Chekki<span style="color: #f97316;">ai</span></h1>
                    <p style="font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #34d399; margin-top: 4px;">🎉 학원 계정 승인 완료</p>
                  </div>

                  <p style="font-size: 15px; color: #e4e4e7;">안녕하세요 <strong>${invoiceData.contactName || '선생님'}</strong> 님,</p>
                  <p style="font-size: 14px; color: #a1a1aa; line-height: 1.6;">
                    입금이 정상적으로 확인되었습니다. <strong>${invoiceData.academyName || '학원'}</strong>의 교사 전용 인증 코드가 등록되었습니다.
                  </p>

                  <div style="background-color: rgba(52, 211, 153, 0.1); border: 1px solid rgba(52, 211, 153, 0.3); border-radius: 12px; padding: 20px; margin: 20px 0; text-align: center;">
                    <p style="font-size: 12px; font-weight: bold; color: #34d399; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 1px;">🔑 교사 전용 인증 코드</p>
                    <p style="font-size: 24px; font-weight: 900; color: #ffffff; letter-spacing: 2px; margin: 8px 0; font-family: monospace;">${teacherCode}</p>
                    <p style="font-size: 12px; color: #a1a1aa; margin: 4px 0 0 0;">(최대 등록 가능 교사: ${invoiceData.teacherCount || 5}명)</p>
                  </div>

                  <div style="background-color: #18181b; border: 1px solid #27272a; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
                    <h4 style="margin: 0 0 8px 0; color: #ffffff; font-size: 14px;">등록 방법:</h4>
                    <ol style="margin: 0; padding-left: 20px; font-size: 13px; color: #a1a1aa; line-height: 1.8;">
                      <li><a href="https://chekkiai.com/teacher" style="color: #f97316; font-weight: bold;">chekkiai.com/teacher</a> 에 접속합니다.</li>
                      <li>교사 회원가입 후 위의 <strong>인증 코드</strong>를 입력합니다.</li>
                      <li>즉시 Pro 교사 권한이 활성화되어 클래스 생성 및 학생 등록을 시작할 수 있습니다.</li>
                    </ol>
                  </div>

                  <p style="font-size: 12px; color: #71717a; text-align: center; margin-top: 24px;">
                    문의 사항이 있으시면 <a href="mailto:support@chekkiai.com" style="color: #f97316;">support@chekkiai.com</a> 로 연락해 주세요.<br/>
                    © 2026 Chekki AI Inc.
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
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
