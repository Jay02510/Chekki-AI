import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withSentry } from './_lib/withSentry.js';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb, adminAuth } from './_lib/firebaseAdmin.js';
import { applyCors } from './_lib/cors.js';

/**
 * Merged redeem-class-code / redeem-school-code / redeem-teacher-code /
 * redeem-invite into one function to stay under Vercel Hobby's 12-function
 * cap. Old paths still work via vercel.json rewrites (needed for already-
 * shipped iOS/Android builds that call the old URLs directly), so which
 * branch runs is decided by which body field is present, matching each
 * endpoint's original request shape exactly.
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

  const { classCode, schoolCode, teacherCode, inviteId } = req.body || {};

  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    if (classCode) return await redeemClassCode(res, uid, classCode);
    if (schoolCode) return await redeemSchoolCode(res, uid, schoolCode);
    if (teacherCode) return await redeemTeacherCode(res, uid, teacherCode);
    if (inviteId) return await redeemInvite(res, uid, decodedToken.email, inviteId);

    return res.status(400).json({ error: 'Missing classCode, schoolCode, teacherCode, or inviteId' });
  } catch (error: any) {
    console.error('[redeem] error:', error);
    return res.status(401).json({ error: 'Authentication failed' });
  }
}

async function redeemClassCode(res: VercelResponse, uid: string, classCode: string) {
  const sanitized = classCode.toUpperCase().trim();

  const classesRef = adminDb.collection('classes');
  const qSnapshot = await classesRef.where('joinCode', '==', sanitized).limit(1).get();

  if (qSnapshot.empty) {
    return res.status(404).json({ error: 'Invalid class code. Please check with your teacher.' });
  }

  const classDoc = qSnapshot.docs[0];
  const classData = classDoc.data();
  const classId = classDoc.id;
  const schoolId = classData.schoolId;
  const schoolName = classData.schoolName || schoolId;

  // --- ANTI-FRAUD GUARDRAIL: Student Enrollment Cap ---
  // Prevents public code leaks. Default: 30 students per class seat.
  const maxStudents = classData.maxStudents || 30;
  const enrolledSnapshot = await adminDb.collection('users').where('classId', '==', classId).get();

  const isAlreadyEnrolled = enrolledSnapshot.docs.some((doc) => doc.id === uid);
  if (!isAlreadyEnrolled && enrolledSnapshot.size >= maxStudents) {
    return res.status(400).json({
      error: `This class has reached its enrollment capacity (${maxStudents} students). Please contact your teacher.`,
    });
  }

  await adminDb.collection('users').doc(uid).set(
    {
      schoolId,
      schoolName,
      classId,
      classStatus: 'pending',
      plan: 'pro',
      maxScansPerDay: 9999,
      maxQuestionsPerDay: 9999,
      subscriptionPlatform: 'school_code',
    },
    { merge: true }
  );

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

  const schoolDoc = await adminDb.collection('schools').doc(sanitized).get();
  if (!schoolDoc.exists) {
    return res.status(400).json({ error: 'Invalid school code. Please check again.' });
  }

  const schoolData = schoolDoc.data() || {};
  const schoolName = schoolData.name || sanitized;
  const usedByUids = schoolData.usedByUids || [];
  const maxUses = schoolData.maxUses ?? 5;

  if (!usedByUids.includes(uid) && usedByUids.length >= maxUses) {
    return res.status(400).json({ error: 'This school code has reached its maximum usage limit.' });
  }

  await adminDb.collection('users').doc(uid).set(
    {
      schoolId: sanitized,
      schoolName,
      plan: 'pro',
      maxScansPerDay: 9999,
      maxQuestionsPerDay: 9999,
      subscriptionPlatform: 'school_code',
    },
    { merge: true }
  );

  await adminDb.collection('schools').doc(sanitized).update({
    usedByUids: FieldValue.arrayUnion(uid),
  });

  return res.status(200).json({
    success: true,
    schoolName,
    message: 'School code redeemed successfully',
  });
}

async function redeemTeacherCode(res: VercelResponse, uid: string, teacherCode: string) {
  const sanitized = teacherCode.toUpperCase().trim();

  const schoolsRef = adminDb.collection('schools');
  const qSnapshot = await schoolsRef.where('teacherCode', '==', sanitized).limit(1).get();

  if (qSnapshot.empty) {
    return res.status(400).json({ error: 'Invalid teacher authorization code. Please verify.' });
  }

  const schoolDoc = qSnapshot.docs[0];
  const schoolId = schoolDoc.id;
  const schoolData = schoolDoc.data() || {};
  const schoolName = schoolData.name || schoolId;

  const usedByUids = schoolData.usedByUids || [];
  const maxUses = schoolData.maxUses ?? 5;

  if (!usedByUids.includes(uid) && usedByUids.length >= maxUses) {
    return res.status(400).json({ error: 'This teacher authorization code has reached its maximum usage limit.' });
  }

  await adminDb.collection('users').doc(uid).set(
    {
      role: 'teacher',
      schoolId,
      schoolName,
      plan: 'pro',
      maxScansPerDay: 9999,
      maxQuestionsPerDay: 9999,
      subscriptionPlatform: 'school_code',
    },
    { merge: true }
  );

  await adminDb.collection('schools').doc(schoolId).update({
    usedByUids: FieldValue.arrayUnion(uid),
  });

  return res.status(200).json({
    success: true,
    schoolId,
    schoolName,
    message: 'Teacher registration completed successfully',
  });
}

async function redeemInvite(res: VercelResponse, uid: string, callerEmailRaw: string | undefined, inviteId: string) {
  const callerEmail = (callerEmailRaw || '').toLowerCase();

  const inviteRef = adminDb.collection('invites').doc(inviteId);

  let schoolId: string;
  let schoolName: string;
  let educatorRole: string;

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

      t.set(
        adminDb.collection('users').doc(uid),
        {
          role: 'teacher',
          educatorRole: invite.role,
          schoolId: invite.schoolId,
          schoolName: resolvedSchoolName,
          plan: 'pro',
          maxScansPerDay: 9999,
          maxQuestionsPerDay: 9999,
          subscriptionPlatform: 'teacher_invite',
        },
        { merge: true }
      );

      t.update(inviteRef, {
        status: 'claimed',
        claimedByUid: uid,
        claimedAt: new Date().toISOString(),
      });

      t.update(schoolRef, { usedByUids: FieldValue.arrayUnion(uid) });

      return { schoolId: invite.schoolId, schoolName: resolvedSchoolName, educatorRole: invite.role };
    });

    schoolId = result.schoolId;
    schoolName = result.schoolName;
    educatorRole = result.educatorRole;
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
  });
}

export default withSentry(handler);
