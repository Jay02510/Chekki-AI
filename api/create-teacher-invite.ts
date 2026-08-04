import type { VercelRequest, VercelResponse } from '@vercel/node';
import { adminDb, adminAuth } from './_lib/firebaseAdmin';
import { maxInvitesForRole } from './_lib/seatLimits';

/**
 * Director-only: generates a role-locked, seat-checked teacher invite.
 *
 * Audit §21: replaces the old single guessable `/teacher?invite={academySlug}`
 * link and the dead `staffEmails` field that nothing ever read. Every invite
 * is now its own Firestore doc under schools/{schoolId}/invites/{inviteId},
 * with `role` decided by the director at creation time — never guessed later
 * from an email substring or self-selected by the teacher. Seat limits are
 * enforced here by counting existing pending+claimed invites for the role
 * against schools/{schoolId}.seatsTotal, so it's structurally impossible to
 * hand out more invites than the plan allows.
 */
const ALLOWED_ROLES = new Set(['ft', 'kt']);

function generateInviteId(): string {
  return `inv_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const allowedOrigins = [
    'https://chekkiai.com',
    'https://www.chekkiai.com',
    'http://localhost:5173',
    'http://localhost:3000',
  ];
  const origin = req.headers.origin as string | undefined;
  const corsOrigin = origin && allowedOrigins.includes(origin) ? origin : allowedOrigins[0];

  res.setHeader('Access-Control-Allow-Origin', corsOrigin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing authorization header' });
  }
  const idToken = authHeader.split('Bearer ')[1].trim();

  const { role, email } = req.body || {};
  if (!ALLOWED_ROLES.has(role)) {
    return res.status(400).json({ error: 'role must be "ft" or "kt"' });
  }
  const cleanEmail = typeof email === 'string' && email.trim() ? email.trim().toLowerCase() : undefined;

  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    const userSnap = await adminDb.collection('users').doc(uid).get();
    const userData = userSnap.data();
    if (!userSnap.exists || userData?.role !== 'director' || !userData?.schoolId) {
      return res.status(403).json({ error: 'Only a director with a school can create invites' });
    }
    const schoolId = userData.schoolId as string;

    const schoolRef = adminDb.collection('schools').doc(schoolId);
    const schoolSnap = await schoolRef.get();
    if (!schoolSnap.exists) {
      return res.status(404).json({ error: 'School not found' });
    }
    const schoolData = schoolSnap.data() || {};
    const seatsTotal = schoolData.seatsTotal || { ft: 0, kt: 0 };
    const maxForRole = maxInvitesForRole(seatsTotal, role);

    const invitesRef = adminDb.collection('invites');
    const existingForRole = await invitesRef
      .where('schoolId', '==', schoolId)
      .where('role', '==', role)
      .where('status', 'in', ['pending', 'claimed'])
      .get();

    if (existingForRole.size >= maxForRole) {
      return res.status(400).json({
        error: `No ${role.toUpperCase()} seats remaining (${existingForRole.size}/${maxForRole} used).`,
      });
    }

    const inviteId = generateInviteId();
    const invitePayload = {
      schoolId,
      role,
      status: 'pending' as const,
      email: cleanEmail || null,
      claimedByUid: null,
      createdAt: new Date().toISOString(),
      createdByUid: uid,
    };
    await invitesRef.doc(inviteId).set(invitePayload);

    const inviteUrl = `${corsOrigin}/teacher?invite=${inviteId}`;

    // Email the invite directly if we have an address — reuses the same
    // Resend integration already wired up for invoice emails (audit §22),
    // so the director doesn't have to manually forward a link.
    const resendApiKey = process.env.RESEND_API_KEY;
    if (resendApiKey && cleanEmail) {
      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Chekki AI <billing@chekkiai.com>',
            to: [cleanEmail],
            subject: `[Chekki AI] ${schoolData.name || 'Your academy'}에서 선생님을 초대했습니다 (${role.toUpperCase()})`,
            html: `
              <div style="font-family: 'Apple SD Gothic Neo', sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background-color: #030305; color: #f4f4f5; border-radius: 16px;">
                <div style="text-align: center; margin-bottom: 24px;">
                  <h1 style="font-size: 28px; font-weight: 900; margin: 0; color: #ffffff;">Chekki<span style="color: #f97316;">ai</span></h1>
                </div>
                <p style="font-size: 15px; color: #e4e4e7;">${schoolData.name || 'An academy'}에서 회원님을 <strong>${role === 'ft' ? '원어민 선생님(FT)' : '한국인 선생님(KT)'}</strong>으로 초대했습니다.</p>
                <p style="font-size: 14px; color: #a1a1aa; line-height: 1.6;">아래 링크로 접속해 비밀번호만 설정하면 바로 시작할 수 있습니다.</p>
                <div style="text-align: center; margin: 24px 0;">
                  <a href="${inviteUrl}" style="display: inline-block; background-color: #f97316; color: #ffffff; font-weight: 900; padding: 14px 28px; border-radius: 12px; text-decoration: none;">초대 수락하기</a>
                </div>
                <p style="font-size: 12px; color: #71717a; text-align: center;">${inviteUrl}</p>
              </div>
            `,
          }),
        });
      } catch (emailErr) {
        console.warn('[create-teacher-invite] Resend email failed (invite still created):', emailErr);
      }
    }

    return res.status(200).json({ success: true, inviteId, inviteUrl, role, email: cleanEmail || null });
  } catch (error: any) {
    console.error('[create-teacher-invite] error:', error);
    return res.status(500).json({ error: 'Failed to create invite' });
  }
}
