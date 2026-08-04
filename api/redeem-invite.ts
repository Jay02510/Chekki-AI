import type { VercelRequest, VercelResponse } from '@vercel/node';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb, adminAuth } from './_lib/firebaseAdmin';

/**
 * Redeems a role-locked teacher invite (audit §21d). This is the only place
 * `educatorRole` gets set from something other than the teacher's own Welcome
 * modal choice — it comes from the invite document the director created, so
 * FT/KT is decided before the teacher ever logs in, not guessed from their
 * email (§7/§9/§20e) or self-reported afterward (§20e).
 *
 * Email-bound invites (the recommended default per §22) are checked against
 * the signed-in account's email so a leaked link can't be claimed by someone
 * else; invites created without an email stay open to whoever redeems them
 * first, then are immediately marked claimed (single-use either way).
 */
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

  const { inviteId } = req.body || {};
  if (!inviteId) {
    return res.status(400).json({ error: 'Missing inviteId' });
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;
    const callerEmail = (decodedToken.email || '').toLowerCase();

    const inviteRef = adminDb.collection('invites').doc(inviteId);
    const inviteSnap = await inviteRef.get();

    if (!inviteSnap.exists) {
      return res.status(404).json({ error: 'Invalid or expired invite link' });
    }
    const invite = inviteSnap.data()!;
    const schoolId = invite.schoolId;

    if (invite.status !== 'pending') {
      return res.status(409).json({ error: 'This invite has already been used' });
    }
    if (invite.email && invite.email.toLowerCase() !== callerEmail) {
      return res.status(403).json({ error: 'This invite was sent to a different email address' });
    }

    const schoolRef = adminDb.collection('schools').doc(schoolId);
    const schoolSnap = await schoolRef.get();
    const schoolName = schoolSnap.data()?.name || schoolId;

    await adminDb.collection('users').doc(uid).set(
      {
        role: 'teacher',
        educatorRole: invite.role,
        schoolId,
        schoolName,
        plan: 'pro',
        maxScansPerDay: 9999,
        maxQuestionsPerDay: 9999,
        subscriptionPlatform: 'teacher_invite',
      },
      { merge: true }
    );

    await inviteRef.update({
      status: 'claimed',
      claimedByUid: uid,
      claimedAt: new Date().toISOString(),
    });

    await schoolRef.update({ usedByUids: FieldValue.arrayUnion(uid) });

    return res.status(200).json({
      success: true,
      role: 'teacher',
      educatorRole: invite.role,
      schoolId,
      schoolName,
    });
  } catch (error: any) {
    console.error('[redeem-invite] error:', error);
    return res.status(500).json({ error: 'Failed to redeem invite' });
  }
}
