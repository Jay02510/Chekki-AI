import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withSentry } from './_lib/withSentry.js';
import { adminDb, adminAuth } from './_lib/firebaseAdmin.js';
import { applyCors } from './_lib/cors.js';

/**
 * Two director-only, schoolId-owner-checked actions merged into one
 * function to stay under Vercel Hobby's 12-function cap (same reasoning as
 * api/redeem.ts): updating the school's display name/logo, and checking
 * trial status. Which branch runs is decided by the `checkTrialStatus` flag.
 */
async function handler(req: VercelRequest, res: VercelResponse) {
  applyCors(req, res);

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing authorization header' });
  }
  const idToken = authHeader.split('Bearer ')[1].trim();

  const { academyName, logoUrl, checkTrialStatus } = req.body || {};

  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    if (checkTrialStatus) {
      return await handleTrialStatus(res, uid);
    }

    if (!academyName || typeof academyName !== 'string' || !academyName.trim()) {
      return res.status(400).json({ error: 'Missing academyName' });
    }

    const userSnap = await adminDb.collection('users').doc(uid).get();
    const schoolId = userSnap.data()?.schoolId;
    if (!schoolId) {
      return res.status(404).json({ error: 'No school associated with this account' });
    }

    const schoolRef = adminDb.collection('schools').doc(schoolId);
    const schoolSnap = await schoolRef.get();
    if (!schoolSnap.exists || schoolSnap.data()?.ownerUid !== uid) {
      return res.status(403).json({ error: 'Not the owner of this school' });
    }

    const update: Record<string, string> = { name: academyName.trim() };
    if (typeof logoUrl === 'string' && logoUrl.trim()) {
      update.logoUrl = logoUrl.trim();
    }
    await schoolRef.update(update);
    await adminDb.collection('users').doc(uid).update({ schoolName: academyName.trim() });

    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('[update-school-profile] error:', error);
    return res.status(500).json({ error: 'Failed to update school profile' });
  }
}

/**
 * Called by the director dashboard on load. Returns how many days are left
 * on a trial school's clock, and — as a side effect — sends a one-time
 * Resend reminder email once 2 or fewer days remain (day-5/6 of a 7-day
 * trial), so expiry isn't a silent surprise on top of the create-class /
 * create-teacher-invite soft-lock. Idempotent via trialReminderSentAt on the
 * school doc: this is a lazy per-request check, not a cron job, so that flag
 * is what stops it firing on every dashboard load during the final two days.
 */
async function handleTrialStatus(res: VercelResponse, uid: string) {
  const userSnap = await adminDb.collection('users').doc(uid).get();
  const userData = userSnap.data();
  if (!userSnap.exists || userData?.role !== 'director' || !userData?.schoolId) {
    return res.status(403).json({ error: 'Only a director with a school can check trial status' });
  }
  const schoolId = userData.schoolId as string;

  const schoolRef = adminDb.collection('schools').doc(schoolId);
  const schoolSnap = await schoolRef.get();
  if (!schoolSnap.exists) return res.status(404).json({ error: 'School not found' });
  const schoolData = schoolSnap.data() || {};

  if (schoolData.planId !== 'trial' || !schoolData.trialEndsAt) {
    return res.status(200).json({ planId: schoolData.planId || null, onTrial: false });
  }

  const trialEndsAtMs = new Date(schoolData.trialEndsAt).getTime();
  const daysRemaining = Math.ceil((trialEndsAtMs - Date.now()) / (24 * 60 * 60 * 1000));
  const expired = daysRemaining <= 0;

  if (!expired && daysRemaining <= 2 && !schoolData.trialReminderSentAt) {
    const resendApiKey = process.env.RESEND_API_KEY;
    const userRecord = await adminAuth.getUser(uid).catch(() => null);
    const toEmail = userRecord?.email;
    if (resendApiKey && toEmail) {
      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Chekki AI <billing@chekkiai.com>',
            to: [toEmail],
            subject: `[Chekki AI] 무료 체험이 ${daysRemaining}일 후 종료됩니다`,
            html: `
              <div style="font-family: 'Apple SD Gothic Neo', sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background-color: #030305; color: #f4f4f5; border-radius: 16px;">
                <div style="text-align: center; margin-bottom: 24px;">
                  <h1 style="font-size: 28px; font-weight: 900; margin: 0; color: #ffffff;">Chekki<span style="color: #f97316;">ai</span></h1>
                </div>
                <p style="font-size: 15px; color: #e4e4e7;">${schoolData.name || '학원'}의 무료 체험이 <strong>${daysRemaining}일 후</strong> 종료됩니다.</p>
                <p style="font-size: 14px; color: #a1a1aa; line-height: 1.6;">체험 종료 후에도 기존 학급과 데이터는 계속 볼 수 있지만, 새 학급 개설과 선생님 초대는 제한됩니다. 계속 사용하시려면 업그레이드해주세요.</p>
                <div style="text-align: center; margin: 24px 0;">
                  <a href="https://chekkiai.com/schools" style="display: inline-block; background-color: #f97316; color: #ffffff; font-weight: 900; padding: 14px 28px; border-radius: 12px; text-decoration: none;">플랜 업그레이드</a>
                </div>
              </div>
            `,
          }),
        });
        await schoolRef.update({ trialReminderSentAt: new Date().toISOString() });
      } catch (emailErr) {
        console.warn('[update-school-profile:trialStatus] Resend reminder failed:', emailErr);
      }
    }
  }

  return res.status(200).json({
    planId: 'trial',
    onTrial: true,
    trialEndsAt: schoolData.trialEndsAt,
    daysRemaining,
    expired,
  });
}

export default withSentry(handler);
