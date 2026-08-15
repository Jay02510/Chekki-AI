import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withSentry } from './_lib/withSentry.js';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb, adminAuth } from './_lib/firebaseAdmin.js';
import { applyCors } from './_lib/cors.js';
import { createRateLimiter } from './_lib/rateLimit.js';

// Codes (classCode/schoolCode/teacherCode) are short, guessable strings with
// real value behind them (free pro access, class enrollment) — this endpoint
// had no throttle, so a script could brute-force valid codes at full request
// speed. Keyed per-uid (post auth) so it can't be dodged by rotating IPs on
// an authenticated account (Audit: no rate limit on redeem.ts).
const checkRedeemLimit = createRateLimiter('redeem', 10, 60);

/**
 * Merged redeem-class-code / redeem-school-code / redeem-teacher-code /
 * redeem-invite into one function to stay under Vercel Hobby's 12-function
 * cap. Old paths still work via vercel.json rewrites (needed for already-
 * shipped iOS/Android builds that call the old URLs directly), so which
 * branch runs is decided by which body field is present, matching each
 * endpoint's original request shape exactly.
 */
// Real store subscriptions are tracked in `subscriptions/{uid}`, not on the
// `users` doc — `users.subscriptionPlatform` is only ever 'school_code',
// 'teacher_invite', 'admin_upgrade'/'admin_assign', or unset. Checking it for
// 'ios'/'android' (as this used to) never matches anything, so it never
// protects a paying subscriber (Audit: subscription metadata clobber).
async function hasActiveStoreSubscription(uid: string): Promise<boolean> {
  const subDoc = await adminDb.collection('subscriptions').doc(uid).get();
  if (!subDoc.exists) return false;
  const data = subDoc.data()!;
  return (
    data.subscription_status === 'active' &&
    ['apple', 'android', 'revenuecat'].includes(data.subscription_platform)
  );
}

async function handler(req: VercelRequest, res: VercelResponse) {
  applyCors(req, res);

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing authorization header' });
  }
  const idToken = authHeader.split('Bearer ')[1].trim();

  const { classCode, schoolCode, teacherCode, inviteId } = req.body || {};

  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    const { success, limit, remaining } = await checkRedeemLimit(uid);
    res.setHeader('X-RateLimit-Limit', limit.toString());
    res.setHeader('X-RateLimit-Remaining', remaining.toString());
    if (!success) {
      return res.status(429).json({ error: 'Too many attempts. Please wait a minute and try again.' });
    }

    if (classCode) return await redeemClassCode(res, uid, decodedToken.email, classCode);
    if (schoolCode) return await redeemSchoolCode(res, uid, schoolCode);
    if (teacherCode) return await redeemTeacherCode(res, uid, decodedToken.email, teacherCode);
    if (inviteId) return await redeemInvite(res, uid, decodedToken.email, inviteId);

    return res.status(400).json({ error: 'Missing classCode, schoolCode, teacherCode, or inviteId' });
  } catch (error: any) {
    console.error('[redeem] error:', error);
    return res.status(401).json({ error: 'Authentication failed' });
  }
}

async function redeemClassCode(res: VercelResponse, uid: string, email: string | undefined, classCode: string) {
  const sanitized = classCode.toUpperCase().trim();

  let classId: string;
  let classData: FirebaseFirestore.DocumentData;
  // Doc to flip to 'redeemed' once enrollment succeeds, and whether that
  // flip is load-bearing (must reject if it's already redeemed) or just
  // best-effort status bookkeeping. Set two ways:
  //  - matched a single-use pushed invite code directly -> load-bearing,
  //    re-checked inside the transaction (Audit: invite codes must only
  //    work once).
  //  - matched the shared joinCode, but this parent has a pendingStudents
  //    entry for the class -> not load-bearing, just marks that entry
  //    joined so the roster's status column stays accurate either way the
  //    parent actually redeemed.
  let pendingStudentRef: FirebaseFirestore.DocumentReference | null = null;
  let requireInviteStillPending = false;

  const classQuery = await adminDb.collection('classes').where('joinCode', '==', sanitized).limit(1).get();
  if (!classQuery.empty) {
    classId = classQuery.docs[0].id;
    classData = classQuery.docs[0].data();

    // Gate: the shared joinCode used to let anyone who had the string join,
    // not just families the school actually knows about (Audit: joinCode
    // has no identity check — no requirement the redeemer is one of the
    // class's own students). Skip the gate for someone who's already a
    // member of this exact class (re-redemption on reinstall/re-login).
    const existingUserSnap = await adminDb.collection('users').doc(uid).get();
    const alreadyMember = existingUserSnap.exists && existingUserSnap.data()?.classId === classId;
    if (!alreadyMember) {
      const allowlistSnap = email
        ? await adminDb
            .collection('pendingStudents')
            .where('classId', '==', classId)
            .where('parentEmail', '==', email.toLowerCase().trim())
            .limit(1)
            .get()
        : null;
      if (!allowlistSnap || allowlistSnap.empty) {
        return res.status(403).json({
          error: 'This class requires an invite from your teacher. Contact your teacher, or support@chekkiai.com if you think this is a mistake.',
        });
      }
      if (allowlistSnap.docs[0].data().status === 'invited') {
        pendingStudentRef = allowlistSnap.docs[0].ref;
      }
    }
  } else {
    const inviteQuery = await adminDb.collection('pendingStudents').where('inviteCode', '==', sanitized).limit(1).get();
    if (inviteQuery.empty) {
      return res.status(404).json({ error: 'Invalid class code. Please check with your teacher.' });
    }
    const inviteDoc = inviteQuery.docs[0];
    if (inviteDoc.data().status !== 'invited') {
      return res.status(400).json({ error: 'This invite code has already been used. Ask your teacher to resend it.' });
    }
    // A single-use invite code was previously redeemable by ANY signed-in
    // account, not just the parent it was actually emailed to — no email
    // check existed on this path at all (only the shared joinCode+allowlist
    // path checked identity). That let an unrelated account burn someone
    // else's one-time code and get attached to the class in their place.
    const invitedEmail = (inviteDoc.data().parentEmail || '').toLowerCase().trim();
    if (invitedEmail && email?.toLowerCase().trim() !== invitedEmail) {
      return res.status(403).json({
        error: `This invite was sent to ${invitedEmail}. Please sign in with that email, or ask your teacher to resend it.`,
      });
    }
    const classSnap = await adminDb.collection('classes').doc(inviteDoc.data().classId).get();
    if (!classSnap.exists) {
      return res.status(404).json({ error: 'Invalid class code. Please check with your teacher.' });
    }
    classId = classSnap.id;
    classData = classSnap.data()!;
    pendingStudentRef = inviteDoc.ref;
    requireInviteStillPending = true;
  }

  const schoolId = classData.schoolId;
  const schoolName = classData.schoolName || schoolId;

  const userRef = adminDb.collection('users').doc(uid);
  const hasStoreSub = await hasActiveStoreSubscription(uid);

  try {
    await adminDb.runTransaction(async (t) => {
      // Re-check the invite's single-use status inside the transaction —
      // the lookup above ran before this transaction started, so two
      // concurrent redemptions of the same invite code could otherwise
      // both pass that earlier check. Only load-bearing for the direct
      // inviteCode path; the joinCode+allowlist path just skips the status
      // flip below if it's stale, it doesn't reject the redemption.
      if (pendingStudentRef && requireInviteStillPending) {
        const freshInvite = await t.get(pendingStudentRef);
        if (!freshInvite.exists || freshInvite.data()?.status !== 'invited') {
          throw { httpStatus: 400, message: 'This invite code has already been used. Ask your teacher to resend it.' };
        }
      }

      // --- ANTI-FRAUD GUARDRAIL: Student Enrollment Cap ---
      // Prevents public code leaks. Default: 30 students per class seat.
      // Read-then-write inside a transaction so two concurrent redemptions
      // against the last open seat can't both pass the cap check (Audit:
      // non-transactional cap checks).
      const maxStudents = classData.maxStudents || 30;
      const enrolledSnapshot = await t.get(adminDb.collection('users').where('classId', '==', classId));
      const isAlreadyEnrolled = enrolledSnapshot.docs.some((doc) => doc.id === uid);
      if (!isAlreadyEnrolled && enrolledSnapshot.size >= maxStudents) {
        throw { httpStatus: 400, message: `This class has reached its enrollment capacity (${maxStudents} students). Please contact your teacher.` };
      }

      const existingUserSnap = await t.get(userRef);
      const existingUserData = existingUserSnap.data() || {};

      const updatePayload: Record<string, any> = {
        schoolId,
        schoolName,
        classId,
        plan: 'pro',
        maxScansPerDay: 9999,
        maxQuestionsPerDay: 9999,
      };

      // Only reset an already-approved membership back to 'pending' if this is
      // actually a different class. Without this check, a duplicate redemption
      // request (double-tap, a re-scanned QR code) silently kicked an already-
      // approved family back into the teacher's approval queue for no reason
      // (Audit: redemption idempotency).
      if (!(existingUserData.classId === classId && existingUserData.classStatus === 'approved')) {
        updatePayload.classStatus = 'pending';
      }

      // Don't overwrite a real, paid subscription's platform label with the
      // school-code tag — a family with an independent RevenueCat subscription
      // who also redeems a school code shouldn't have that hidden behind
      // 'school_code', where it could be misread as no longer paid if the
      // school's plan ever lapses (Audit: subscription metadata clobber).
      if (!hasStoreSub) {
        updatePayload.subscriptionPlatform = 'school_code';
      }

      t.set(userRef, updatePayload, { merge: true });

      if (pendingStudentRef) {
        t.update(pendingStudentRef, {
          status: 'redeemed',
          redeemedAt: FieldValue.serverTimestamp(),
          redeemedUid: uid,
        });
      }
    });
  } catch (error: any) {
    if (error && typeof error.httpStatus === 'number') {
      return res.status(error.httpStatus).json({ error: error.message });
    }
    throw error;
  }

  return res.status(200).json({
    success: true,
    schoolId,
    schoolName,
    classId,
    className: classData.name,
    message: 'Class code redeemed successfully',
  });
}

async function redeemSchoolCode(res: VercelResponse, uid: string, schoolCode: string) {
  const sanitized = schoolCode.toUpperCase().trim();
  const schoolRef = adminDb.collection('schools').doc(sanitized);
  const userRef = adminDb.collection('users').doc(uid);
  const hasStoreSub = await hasActiveStoreSubscription(uid);

  let schoolName = sanitized;
  try {
    await adminDb.runTransaction(async (t) => {
      const schoolDoc = await t.get(schoolRef);
      if (!schoolDoc.exists) {
        throw { httpStatus: 400, message: 'Invalid school code. Please check again.' };
      }

      const schoolData = schoolDoc.data() || {};
      schoolName = schoolData.name || sanitized;
      const usedByUids = schoolData.usedByUids || [];
      const maxUses = schoolData.maxUses ?? 5;

      // Cap check moved inside the transaction so two concurrent redemptions
      // against the last open seat can't both pass it (Audit: non-transactional
      // cap checks).
      if (!usedByUids.includes(uid) && usedByUids.length >= maxUses) {
        throw { httpStatus: 400, message: 'This school code has reached its maximum usage limit.' };
      }

      const updatePayload: Record<string, any> = {
        schoolId: sanitized,
        schoolName,
        plan: 'pro',
        maxScansPerDay: 9999,
        maxQuestionsPerDay: 9999,
      };
      // See redeemClassCode above — don't clobber a real paid subscription's
      // platform label with the school-code tag (Audit: subscription metadata clobber).
      if (!hasStoreSub) {
        updatePayload.subscriptionPlatform = 'school_code';
      }

      t.set(userRef, updatePayload, { merge: true });
      t.update(schoolRef, { usedByUids: FieldValue.arrayUnion(uid) });
    });
  } catch (error: any) {
    if (error && typeof error.httpStatus === 'number') {
      return res.status(error.httpStatus).json({ error: error.message });
    }
    throw error;
  }

  return res.status(200).json({
    success: true,
    schoolName,
    message: 'School code redeemed successfully',
  });
}

async function redeemTeacherCode(res: VercelResponse, uid: string, callerEmailRaw: string | undefined, teacherCode: string) {
  const sanitized = teacherCode.toUpperCase().trim();

  const schoolsRef = adminDb.collection('schools');
  const qSnapshot = await schoolsRef.where('teacherCode', '==', sanitized).limit(1).get();

  if (qSnapshot.empty) {
    return res.status(400).json({ error: 'Invalid teacher authorization code. Please verify.' });
  }

  const schoolRef = qSnapshot.docs[0].ref;
  const schoolId = schoolRef.id;
  const callerEmail = (callerEmailRaw || '').toLowerCase();
  const hasStoreSub = await hasActiveStoreSubscription(uid);

  let schoolName = schoolId;
  let isOwnerClaim = false;
  try {
    await adminDb.runTransaction(async (t) => {
      const schoolDoc = await t.get(schoolRef);
      const schoolData = schoolDoc.data() || {};
      schoolName = schoolData.name || schoolId;

      // Invoice-first customers (api/admin.ts confirm_invoice) only ever get a
      // teacherCode to hand out — this is often the first time the director
      // themselves creates an account. If their email matches the school's
      // recorded owner and nobody has claimed it yet, grant them 'director'
      // (and bind ownerUid) instead of silently making them a plain 'teacher'
      // on a school they can't administer (Audit: director path divergence).
      isOwnerClaim = !!callerEmail && !schoolData.ownerUid && schoolData.ownerEmail === callerEmail;

      if (!isOwnerClaim) {
        const usedByUids = schoolData.usedByUids || [];
        const maxUses = schoolData.maxUses ?? 5;
        // Cap check moved inside the transaction so two concurrent redemptions
        // against the last open seat can't both pass it (Audit: non-transactional
        // cap checks).
        if (!usedByUids.includes(uid) && usedByUids.length >= maxUses) {
          throw { httpStatus: 400, message: 'This teacher authorization code has reached its maximum usage limit.' };
        }
      }

      const updatePayload: Record<string, any> = {
        role: isOwnerClaim ? 'director' : 'teacher',
        schoolId,
        schoolName,
        plan: 'pro',
        maxScansPerDay: 9999,
        maxQuestionsPerDay: 9999,
      };
      if (!hasStoreSub) {
        updatePayload.subscriptionPlatform = 'school_code';
      }

      t.set(adminDb.collection('users').doc(uid), updatePayload, { merge: true });

      if (isOwnerClaim) {
        t.update(schoolRef, { ownerUid: uid });
      } else {
        t.update(schoolRef, { usedByUids: FieldValue.arrayUnion(uid) });
      }
    });
  } catch (error: any) {
    if (error && typeof error.httpStatus === 'number') {
      return res.status(error.httpStatus).json({ error: error.message });
    }
    throw error;
  }

  return res.status(200).json({
    success: true,
    schoolId,
    schoolName,
    role: isOwnerClaim ? 'director' : 'teacher',
    message: isOwnerClaim ? 'Director account activated successfully' : 'Teacher registration completed successfully',
  });
}

async function redeemInvite(res: VercelResponse, uid: string, callerEmailRaw: string | undefined, inviteId: string) {
  const callerEmail = (callerEmailRaw || '').toLowerCase();

  const inviteRef = adminDb.collection('invites').doc(inviteId);

  let schoolId: string;
  let schoolName: string;
  let educatorRole: string;
  let invitedByName: string | null;
  let className: string | null;

  try {
    const result = await adminDb.runTransaction(async (t) => {
      const inviteSnap = await t.get(inviteRef);
      if (!inviteSnap.exists) {
        throw { httpStatus: 404, message: 'Invalid or expired invite link' };
      }
      const invite = inviteSnap.data()!;

      if (invite.status !== 'pending') {
        throw { httpStatus: 409, message: 'This invite has already been used' };
      }
      if (invite.email && invite.email.toLowerCase() !== callerEmail) {
        throw { httpStatus: 403, message: 'This invite was sent to a different email address' };
      }

      const schoolRef = adminDb.collection('schools').doc(invite.schoolId);
      const schoolSnap = await t.get(schoolRef);
      const resolvedSchoolName = schoolSnap.data()?.name || invite.schoolId;

      // The director now picks the class at invite-creation time (see
      // api/create-teacher-invite.ts) instead of the teacher landing with
      // no class and either self-serving a disconnected one or waiting on
      // a separate after-the-fact assignment step. Reads happen before any
      // writes below per Firestore's transaction read-before-write rule.
      let classRef: FirebaseFirestore.DocumentReference | null = null;
      let resolvedClassName: string | null = null;
      if (invite.classId) {
        classRef = adminDb.collection('classes').doc(invite.classId);
        const classSnap = await t.get(classRef);
        if (classSnap.exists && classSnap.data()?.schoolId === invite.schoolId) {
          resolvedClassName = classSnap.data()?.name || null;
        } else {
          classRef = null;
        }
      }

      let invitedByName: string | null = null;
      if (invite.createdByUid) {
        const inviterSnap = await t.get(adminDb.collection('users').doc(invite.createdByUid));
        const inviterData = inviterSnap.data();
        invitedByName = inviterData?.displayName || inviterData?.name || inviterData?.email || null;
      }

      const subSnap = await t.get(adminDb.collection('subscriptions').doc(uid));
      const subData = subSnap.exists ? subSnap.data()! : null;
      const hasStoreSub =
        !!subData &&
        subData.subscription_status === 'active' &&
        ['apple', 'android', 'revenuecat'].includes(subData.subscription_platform);

      const userUpdate: Record<string, any> = {
        role: 'teacher',
        educatorRole: invite.role,
        schoolId: invite.schoolId,
        schoolName: resolvedSchoolName,
        plan: 'pro',
        maxScansPerDay: 9999,
        maxQuestionsPerDay: 9999,
      };
      if (!hasStoreSub) {
        userUpdate.subscriptionPlatform = 'teacher_invite';
      }

      t.set(adminDb.collection('users').doc(uid), userUpdate, { merge: true });

      t.update(inviteRef, {
        status: 'claimed',
        claimedByUid: uid,
        claimedAt: new Date().toISOString(),
      });

      t.update(schoolRef, { usedByUids: FieldValue.arrayUnion(uid) });

      if (classRef) {
        t.update(classRef, { assignedTeacherUids: FieldValue.arrayUnion(uid) });
      }

      return { schoolId: invite.schoolId, schoolName: resolvedSchoolName, educatorRole: invite.role, invitedByName, className: resolvedClassName };
    });

    schoolId = result.schoolId;
    schoolName = result.schoolName;
    educatorRole = result.educatorRole;
    invitedByName = result.invitedByName;
    className = result.className;
  } catch (error: any) {
    if (error && typeof error.httpStatus === 'number') {
      return res.status(error.httpStatus).json({ error: error.message });
    }
    throw error;
  }

  return res.status(200).json({
    success: true,
    role: 'teacher',
    educatorRole,
    schoolId,
    schoolName,
    invitedByName,
    className,
  });
}

export default withSentry(handler);
