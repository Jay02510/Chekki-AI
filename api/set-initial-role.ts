import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withSentry } from './_lib/withSentry.js';
import { adminDb, adminAuth } from './_lib/firebaseAdmin.js';
import { seatsForPlan } from './_lib/pricingTiers.js';
import { applyCors } from './_lib/cors.js';

// Sets a brand-new account's role (director/teacher) server-side, right after
// signup. The client can never write `role` directly — firestore.rules blocks
// it (users/{userId} update rule excludes 'role' from self-writable fields) —
// so a client-side updateDoc({ role }) call silently fails and the account is
// left with no persisted role (audit §20b/§20c). This endpoint is the one
// place that write is allowed to happen, and only as a one-time assignment:
// it refuses to change a role that's already been set, so it can't be used to
// self-promote an existing account.
const ALLOWED_ROLES = new Set(['director', 'teacher']);

async function handler(req: VercelRequest, res: VercelResponse) {
  applyCors(req, res);

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing authorization header' });
  }
  const idToken = authHeader.split('Bearer ')[1].trim();

  const { role, academyName, planId } = req.body || {};
  if (!ALLOWED_ROLES.has(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    const userRef = adminDb.collection('users').doc(uid);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    const existingRole = userSnap.data()?.role;
    if (existingRole && existingRole !== 'parent') {
      // Role already assigned — refuse to overwrite (not a re-assignment endpoint).
      return res.status(409).json({ error: 'Role already set', role: existingRole });
    }

    let schoolId: string | undefined;
    if (role === 'director') {
      // A director needs a school to own before they can invite anyone —
      // create one if this account doesn't have one yet. The `seats` figure
      // comes from a server-side plan table (api/_lib/pricingTiers.ts), never
      // from the client, so it can't be inflated by editing the request body
      // (audit §21b — this is the fix for the old sessionStorage-only
      // `chekki_teacher_seats` number that nothing ever enforced).
      const existingSchoolId = userSnap.data()?.schoolId;
      const resolvedSchoolId: string = existingSchoolId || `school_${uid}`;
      schoolId = resolvedSchoolId;
      if (!existingSchoolId) {
        const resolvedPlanId = typeof planId === 'string' ? planId : 'trial';
        const seats = seatsForPlan(resolvedPlanId);
        const schoolDoc: Record<string, any> = {
          name: typeof academyName === 'string' && academyName.trim() ? academyName.trim() : 'New Academy',
          ownerUid: uid,
          planId: resolvedPlanId,
          seatsTotal: seats,
          usedByUids: [],
          createdAt: new Date().toISOString(),
        };
        // The "7-day free trial" promise was previously just landing-page
        // copy — createdAt was stored but nothing ever read it to check
        // whether 7 days had passed. trialEndsAt is the real, checkable
        // deadline that api/create-class.ts and api/create-teacher-invite.ts
        // gate new actions on.
        if (resolvedPlanId === 'trial') {
          schoolDoc.trialEndsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
        }
        await adminDb.collection('schools').doc(resolvedSchoolId).set(schoolDoc, { merge: true });
      }
      const schoolNameForUser = typeof academyName === 'string' && academyName.trim() ? academyName.trim() : 'New Academy';
      await userRef.update({ role, schoolId, schoolName: schoolNameForUser });
    } else {
      await userRef.update({ role });
    }

    return res.status(200).json({ success: true, role, schoolId });
  } catch (error: any) {
    console.error('[set-initial-role] error:', error);
    return res.status(500).json({ error: 'Failed to set role' });
  }
}

export default withSentry(handler);
