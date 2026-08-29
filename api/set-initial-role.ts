import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withSentry } from './_lib/withSentry.js';
import { adminDb, adminAuth, syncAuthClaims } from './_lib/firebaseAdmin.js';
import { seatsForPlan } from './_lib/pricingTiers.js';
import { applyCors } from './_lib/cors.js';
import { createRateLimiter } from './_lib/rateLimit.js';

const checkSetRoleLimit = createRateLimiter('set_initial_role', 10, 60);

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

  const { role, academyName } = req.body || {};
  if (!ALLOWED_ROLES.has(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    const { success } = await checkSetRoleLimit(uid);
    if (!success) {
      return res.status(429).json({ error: 'Too many requests. Please wait a minute and try again.' });
    }

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
      let resolvedSchoolId: string;
      let schoolNameForUser = typeof academyName === 'string' && academyName.trim() ? academyName.trim() : 'New Academy';

      if (existingSchoolId) {
        resolvedSchoolId = existingSchoolId;
      } else {
        // Cross-reference by email: did this person already pay via the
        // invoice-first path (api/admin.ts confirm_invoice) before ever
        // creating an account? That flow can only record an ownerEmail, not
        // an ownerUid, since the account didn't exist yet. Without this
        // check, signing up here mints a brand-new, disconnected trial
        // school instead of claiming the real, already-paid one — leaving
        // two schools in Firestore for one business (Audit: director path
        // divergence).
        const email = (decodedToken.email || '').toLowerCase();
        let claimedSchool: { id: string; name?: string } | null = null;
        if (email) {
          // Read-then-update inside a transaction — otherwise two concurrent
          // signups for the same invoiced email could both pass the
          // `pendingSnap.empty` check and both claim the same school (Audit:
          // non-transactional school claim).
          //
          // The user-doc write (role/schoolId) used to happen separately,
          // after this transaction committed. If that second write failed
          // (transient error, function timeout), the school stayed
          // permanently claimed (ownerUid set) but the user doc never got
          // schoolId — a retry could no longer find the school via the
          // `ownerUid == null` query above, so it fell through to minting a
          // brand-new, disconnected trial school for the same director,
          // recreating the exact "two schools for one business" bug this
          // endpoint exists to prevent. Both writes now happen in the same
          // transaction so they succeed or fail together.
          claimedSchool = await adminDb.runTransaction(async (t) => {
            const pendingSnap = await t.get(
              adminDb.collection('schools')
                .where('ownerEmail', '==', email)
                .where('ownerUid', '==', null)
                .limit(1)
            );
            if (pendingSnap.empty) return null;
            const pendingDoc = pendingSnap.docs[0];
            const claimedName = pendingDoc.data()?.name;
            t.update(pendingDoc.ref, { ownerUid: uid });
            t.set(
              userRef,
              { role, schoolId: pendingDoc.id, schoolName: claimedName || schoolNameForUser },
              { merge: true }
            );
            return { id: pendingDoc.id, name: claimedName };
          });
        }

        if (claimedSchool) {
          // Role/schoolId already written atomically with the claim above —
          // skip the shared write below for this path.
          await syncAuthClaims(uid);
          return res.status(200).json({ success: true, role, schoolId: claimedSchool.id });
        }

        {
          resolvedSchoolId = `school_${uid}`;
          // A brand-new school is always a trial, full stop — planId is never
          // read from the request body here. This is the self-serve signup
          // path with no payment behind it; only api/admin.ts's
          // confirm_invoice/upgrade_school (invoice-confirmed, ops-only) may
          // set a paid planId. Trusting a client-sent planId let anyone POST
          // {"planId":"enterprise"} and get 12 FT + 8 KT seats with no
          // trialEndsAt (so the trial-expiry gate in create-class.ts /
          // create-teacher-invite.ts never fired) — a free ₩590,000/mo plan,
          // indefinitely (confirmed via seatsForPlan('enterprise') ->
          // {ft:12,kt:8} and this branch's own resolvedPlanId==='trial' check
          // skipping trialEndsAt for any other value).
          const seats = seatsForPlan('trial');
          const schoolDoc: Record<string, any> = {
            name: schoolNameForUser,
            ownerUid: uid,
            planId: 'trial',
            seatsTotal: seats,
            usedByUids: [],
            createdAt: new Date().toISOString(),
            // The "7-day free trial" promise was previously just landing-page
            // copy — createdAt was stored but nothing ever read it to check
            // whether 7 days had passed. trialEndsAt is the real, checkable
            // deadline that api/create-class.ts and api/create-teacher-invite.ts
            // gate new actions on.
            trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          };
          await adminDb.collection('schools').doc(resolvedSchoolId).set(schoolDoc, { merge: true });
        }
      }

      schoolId = resolvedSchoolId;
      await userRef.update({ role, schoolId, schoolName: schoolNameForUser });
    } else {
      await userRef.update({ role });
    }

    await syncAuthClaims(uid);
    return res.status(200).json({ success: true, role, schoolId });
  } catch (error: any) {
    console.error('[set-initial-role] error:', error);
    return res.status(500).json({ error: 'Failed to set role' });
  }
}

export default withSentry(handler);
