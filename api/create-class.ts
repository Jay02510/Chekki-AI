import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withSentry } from './_lib/withSentry.js';
import { adminDb, adminAuth } from './_lib/firebaseAdmin.js';
import { maxClassesForSeats } from './_lib/seatLimits.js';
import { applyCors } from './_lib/cors.js';
import { createRateLimiter } from './_lib/rateLimit.js';
import { generateJoinCode } from './_lib/joinCode.js';
import { isValidAddStudentsPayload } from './_lib/rosterValidation.js';
import { FieldValue } from 'firebase-admin/firestore';

const checkCreateClassLimit = createRateLimiter('create_class', 20, 60);
const checkAddStudentsLimit = createRateLimiter('add_students', 20, 60);

/**
 * Server-side seat-limit enforcement on class creation (audit §2/§10/§18).
 *
 * The client-side check in TeacherPage.tsx's handleCreateClass is advisory
 * only — it gives the teacher an instant "you're at your limit" message, but
 * a direct Firestore write from the browser could always bypass it. This
 * endpoint is now the only path that can create a `classes` doc:
 * firestore.rules denies client-side creates entirely, so the count check
 * here is a real boundary, not just UX.
 *
 * The limit is the school's total provisioned seats (ft + kt), the same
 * seatsTotal set by api/set-initial-role.ts / api/admin.ts and already
 * enforced for teacher invites in api/create-teacher-invite.ts — one number,
 * checked the same way everywhere, instead of the old dead `seatCount` field
 * that nothing ever wrote.
 *
 * Also dispatches (action=add_students/resend_student_invite/remove_pending_student)
 * a director/KT-facing pre-add-student flow — folded in here rather than a
 * new file to stay under Vercel Hobby's 12-function cap, same reasoning as
 * api/create-teacher-invite.ts's action dispatch. Enrollment used to be
 * self-serve only (parent types a 6-digit joinCode); this lets staff instead
 * push a named invite (individually or via bulk Excel/CSV upload from the
 * client) to a parent's email, and see whether each one has actually
 * redeemed it yet via `pendingStudents/{id}.status`.
 */

async function handleCreateClassAction(req: VercelRequest, res: VercelResponse, uid: string) {
  const { name, level } = req.body || {};
  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'Missing class name' });
  }

  const { success } = await checkCreateClassLimit(uid);
  if (!success) {
    return res.status(429).json({ error: 'Too many requests. Please wait a minute and try again.' });
  }

  const userSnap = await adminDb.collection('users').doc(uid).get();
  const userData = userSnap.data();
  if (!userSnap.exists || (userData?.role !== 'teacher' && userData?.role !== 'director')) {
    return res.status(403).json({ error: 'Only teachers or directors can create classes' });
  }

  const schoolId: string | undefined = userData?.schoolId;
  let maxClasses = 1; // unconfirmed/no-school accounts get a single trial class
  if (schoolId) {
    const schoolSnap = await adminDb.collection('schools').doc(schoolId).get();
    const schoolData = schoolSnap.data();
    maxClasses = maxClassesForSeats(schoolData?.seatsTotal);

    // Soft-lock: trial expiry blocks new classes but leaves existing
    // classes, scans, and reports fully visible — only forward progress
    // is gated, not access to what's already there.
    if (schoolData?.planId === 'trial' && schoolData?.trialEndsAt && new Date(schoolData.trialEndsAt).getTime() < Date.now()) {
      return res.status(400).json({
        error: 'Your 7-day trial has ended. Upgrade your plan to create new classes.',
        trialExpired: true,
      });
    }
  }

  const existingQuery = schoolId
    ? adminDb.collection('classes').where('schoolId', '==', schoolId)
    : adminDb.collection('classes').where('teacherUid', '==', uid);
  const existingSnap = await existingQuery.get();

  if (existingSnap.size >= maxClasses) {
    return res.status(400).json({
      error: `Class limit reached (${existingSnap.size}/${maxClasses}). Contact support@chekkiai.com to add more seats.`,
    });
  }

  const sanitizedName = name.trim().replace(/\s+/g, '-');
  const classId = `${schoolId || uid}_${sanitizedName}_${Date.now()}`;
  const newClass = {
    id: classId,
    schoolId: schoolId || `school_${uid.slice(0, 8)}`,
    schoolName: userData?.schoolName || 'B2B Academy',
    name: name.trim(),
    level: typeof level === 'string' && level.trim() ? level.trim() : 'General',
    teacherUid: uid,
    assignedTeacherUids: [uid],
    activeWeekNumber: 1,
    joinCode: generateJoinCode(),
    createdAt: new Date().toISOString(),
  };

  await adminDb.collection('classes').doc(classId).set(newClass);

  return res.status(200).json({ success: true, class: newClass });
}

/**
 * A per-invite code, distinct from the class's shared joinCode. The shared
 * joinCode is meant to be reused by every parent in the class; a pushed
 * invite needs to be single-use (Audit: invite links/codes must only work
 * once) so it can't be forwarded or reused after the intended parent
 * already redeemed it. Checked against both classes.joinCode and existing
 * pendingStudents.inviteCode so an invite code can never collide with (or
 * be shadowed by) a real class code.
 */
async function generateUniqueInviteCode(): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateJoinCode();
    const [classMatch, inviteMatch] = await Promise.all([
      adminDb.collection('classes').where('joinCode', '==', code).limit(1).get(),
      adminDb.collection('pendingStudents').where('inviteCode', '==', code).limit(1).get(),
    ]);
    if (classMatch.empty && inviteMatch.empty) return code;
  }
  throw new Error('Failed to generate a unique invite code');
}

async function requireDirectorOrKt(uid: string) {
  const userSnap = await adminDb.collection('users').doc(uid).get();
  const userData = userSnap.data();
  const isDirector = userData?.role === 'director';
  const isKt = userData?.role === 'teacher' && userData?.educatorRole === 'kt';
  if (!userSnap.exists || !userData?.schoolId || !(isDirector || isKt)) {
    return null;
  }
  return { schoolId: userData.schoolId as string };
}

async function sendStudentInviteEmail(opts: {
  parentEmail: string;
  studentName: string;
  className: string;
  schoolName: string;
  inviteCode: string;
}): Promise<boolean> {
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) return false;
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${resendApiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Chekki AI <billing@chekkiai.com>',
        to: [opts.parentEmail],
        subject: `[Chekki AI] ${opts.studentName} 학생 학급 등록 안내`,
        html: `
          <div style="font-family: 'Apple SD Gothic Neo', sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background-color: #030305; color: #f4f4f5; border-radius: 16px;">
            <div style="text-align: center; margin-bottom: 24px;">
              <h1 style="font-size: 28px; font-weight: 900; margin: 0; color: #ffffff;">Chekki<span style="color: #f97316;">ai</span></h1>
            </div>
            <p style="font-size: 15px; color: #e4e4e7;"><strong>${opts.schoolName}</strong>에서 <strong>${opts.studentName}</strong> 학생을 <strong>${opts.className}</strong> 학급에 등록했습니다.</p>
            <p style="font-size: 14px; color: #a1a1aa; line-height: 1.6;">아래 버튼을 누르면 가입 코드가 자동으로 연결됩니다 — 따로 입력하실 필요 없습니다. 계정이 없으시면 버튼을 누른 뒤 뜨는 화면에서 <strong>"Sign Up"</strong>을 눌러 새로 만들어 주시면 됩니다. 이미 계정이 있으시면 그 이메일로 로그인만 하시면 자동으로 연결됩니다.</p>
            <div style="text-align: center; margin: 24px 0;">
              <a href="https://chekkiai.com/?classCode=${opts.inviteCode}" style="display: inline-block; background-color: #f97316; color: #ffffff; font-weight: 900; padding: 14px 28px; border-radius: 12px; text-decoration: none;">지금 가입하기</a>
            </div>
            <p style="font-size: 12px; color: #71717a; text-align: center; margin: 0 0 8px 0;">버튼이 안 열리면 이 코드를 앱/사이트에 직접 입력해 주세요 (1회용):</p>
            <div style="background-color: rgba(249, 115, 22, 0.1); border: 1px solid rgba(249, 115, 22, 0.3); border-radius: 12px; padding: 16px; margin: 0 0 24px 0; text-align: center;">
              <p style="margin: 0; font-size: 24px; font-weight: 900; color: #ffffff; letter-spacing: 4px; font-family: monospace;">${opts.inviteCode}</p>
            </div>
            <p style="font-size: 12px; color: #71717a; text-align: center; margin-top: 24px;">
              문의 사항이 있으시면 <a href="mailto:support@chekkiai.com" style="color: #f97316;">support@chekkiai.com</a> 로 연락해 주세요.
            </p>
          </div>
        `,
      }),
    });
    if (!response.ok) {
      // fetch doesn't throw on a non-2xx — a rejected Resend request (bad
      // API key, unverified sender domain, malformed payload) used to fail
      // completely silently here, so "Invited N student(s)!" showed in the
      // director's UI even when zero emails actually went out.
      const body = await response.text().catch(() => '');
      console.error('[create-class:add_students] Resend API rejected the request:', response.status, body, opts.parentEmail);
      return false;
    }
    return true;
  } catch (emailErr) {
    console.warn('[create-class:add_students] Resend email failed:', opts.parentEmail, emailErr);
    return false;
  }
}

async function handleAddStudents(req: VercelRequest, res: VercelResponse, uid: string) {
  const { success } = await checkAddStudentsLimit(uid);
  if (!success) {
    return res.status(429).json({ error: 'Too many requests. Please wait a minute and try again.' });
  }

  const caller = await requireDirectorOrKt(uid);
  if (!caller) {
    return res.status(403).json({ error: 'Only a director or Korean Teacher with a school can add students' });
  }

  if (!isValidAddStudentsPayload(req.body)) {
    return res.status(400).json({ error: 'classId and 1-200 students ({name, parentEmail}) are required' });
  }
  const { classId, students } = req.body;

  const classSnap = await adminDb.collection('classes').doc(classId).get();
  const classData = classSnap.data();
  if (!classSnap.exists || classData?.schoolId !== caller.schoolId) {
    return res.status(404).json({ error: 'That class does not belong to your school' });
  }

  const batch = adminDb.batch();
  const created: { id: string; name: string; parentEmail: string; inviteCode: string }[] = [];
  // Sequential (not Promise.all): generateUniqueInviteCode reads Firestore
  // before this batch has committed, so concurrent generation for a large
  // bulk upload could hand out the same "unique" code to two students.
  for (const student of students) {
    const ref = adminDb.collection('pendingStudents').doc();
    const inviteCode = await generateUniqueInviteCode();
    batch.set(ref, {
      classId,
      schoolId: caller.schoolId,
      name: student.name.trim(),
      parentEmail: student.parentEmail.trim().toLowerCase(),
      inviteCode,
      status: 'invited',
      addedByUid: uid,
      addedAt: FieldValue.serverTimestamp(),
    });
    created.push({ id: ref.id, name: student.name.trim(), parentEmail: student.parentEmail.trim().toLowerCase(), inviteCode });
  }
  await batch.commit();

  // emailSentAt is only stamped on an actual confirmed send below — it used
  // to be written unconditionally at creation time regardless of whether
  // Resend accepted the request, which made a fully-silent email failure
  // look identical to a successful one in the roster UI.
  const emailResults = await Promise.all(
    created.map((c) =>
      sendStudentInviteEmail({
        parentEmail: c.parentEmail,
        studentName: c.name,
        className: classData?.name || 'Class',
        schoolName: classData?.schoolName || 'Your school',
        inviteCode: c.inviteCode,
      })
    )
  );
  await Promise.all(
    created.map((c, i) =>
      emailResults[i]
        ? adminDb.collection('pendingStudents').doc(c.id).update({ emailSentAt: FieldValue.serverTimestamp() })
        : Promise.resolve()
    )
  );

  const emailsSent = emailResults.filter(Boolean).length;
  return res.status(200).json({
    success: true,
    added: created.length,
    emailsSent,
    resendConfigured: !!process.env.RESEND_API_KEY,
  });
}

async function handleResendStudentInvite(req: VercelRequest, res: VercelResponse, uid: string) {
  const caller = await requireDirectorOrKt(uid);
  if (!caller) {
    return res.status(403).json({ error: 'Only a director or Korean Teacher with a school can resend invites' });
  }
  const { pendingStudentId } = req.body || {};
  if (typeof pendingStudentId !== 'string' || !pendingStudentId) {
    return res.status(400).json({ error: 'pendingStudentId is required' });
  }

  const ref = adminDb.collection('pendingStudents').doc(pendingStudentId);
  const snap = await ref.get();
  const data = snap.data();
  if (!snap.exists || data?.schoolId !== caller.schoolId) {
    return res.status(404).json({ error: 'Invite not found' });
  }
  if (data?.status !== 'invited') {
    return res.status(400).json({ error: 'This student has already joined' });
  }

  const classSnap = await adminDb.collection('classes').doc(data.classId).get();
  const classData = classSnap.data();

  const sent = await sendStudentInviteEmail({
    parentEmail: data.parentEmail,
    studentName: data.name,
    className: classData?.name || 'Class',
    schoolName: classData?.schoolName || 'Your school',
    inviteCode: data.inviteCode || '',
  });
  if (!sent) {
    return res.status(502).json({
      error: process.env.RESEND_API_KEY
        ? 'Failed to send the email. Please try again.'
        : 'Email sending is not configured for this deployment.',
    });
  }
  await ref.update({ emailSentAt: FieldValue.serverTimestamp() });

  return res.status(200).json({ success: true });
}

async function handleRemovePendingStudent(req: VercelRequest, res: VercelResponse, uid: string) {
  const caller = await requireDirectorOrKt(uid);
  if (!caller) {
    return res.status(403).json({ error: 'Only a director or Korean Teacher with a school can remove invites' });
  }
  const { pendingStudentId } = req.body || {};
  if (typeof pendingStudentId !== 'string' || !pendingStudentId) {
    return res.status(400).json({ error: 'pendingStudentId is required' });
  }

  const ref = adminDb.collection('pendingStudents').doc(pendingStudentId);
  const snap = await ref.get();
  if (!snap.exists || snap.data()?.schoolId !== caller.schoolId) {
    return res.status(404).json({ error: 'Invite not found' });
  }
  await ref.delete();

  return res.status(200).json({ success: true });
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
  const action = req.body?.action; // undefined => create class (original default behavior)

  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    if (action === 'add_students') return await handleAddStudents(req, res, uid);
    if (action === 'resend_student_invite') return await handleResendStudentInvite(req, res, uid);
    if (action === 'remove_pending_student') return await handleRemovePendingStudent(req, res, uid);
    return await handleCreateClassAction(req, res, uid);
  } catch (error: any) {
    console.error('[create-class] error:', error);
    return res.status(500).json({ error: 'Request failed' });
  }
}

export default withSentry(handler);
