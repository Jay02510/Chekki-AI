import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withSentry } from './_lib/withSentry.js';
import { adminDb, adminAuth } from './_lib/firebaseAdmin.js';
import { maxInvitesForRole } from './_lib/seatLimits.js';
import { applyCors } from './_lib/cors.js';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * Director-only school-membership actions: create invite (default), assign
 * a teacher to a class, or remove a teacher entirely. Folded into one file
 * — was 3 separate endpoint files (create-teacher-invite, assign-class-
 * teacher, remove-teacher) until the Vercel Hobby plan's 12-function cap
 * blocked deployment. Dispatches on `action` in the request body; omitting
 * it defaults to the original invite-creation behavior so no existing
 * client call site needed to change.
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

async function handleCreateInvite(req: VercelRequest, res: VercelResponse, corsOrigin: string, uid: string, schoolId: string) {
  const { role, email } = req.body || {};
  if (!ALLOWED_ROLES.has(role)) {
    return res.status(400).json({ error: 'role must be "ft" or "kt"' });
  }
  const cleanEmail = typeof email === 'string' && email.trim() ? email.trim().toLowerCase() : undefined;

  const schoolRef = adminDb.collection('schools').doc(schoolId);
  const schoolSnap = await schoolRef.get();
  if (!schoolSnap.exists) {
    return res.status(404).json({ error: 'School not found' });
  }
  const schoolData = schoolSnap.data() || {};

  // Soft-lock: trial expiry blocks new invites but leaves existing
  // teachers, classes, and data fully accessible.
  if (schoolData.planId === 'trial' && schoolData.trialEndsAt && new Date(schoolData.trialEndsAt).getTime() < Date.now()) {
    return res.status(400).json({
      error: 'Your 7-day trial has ended. Upgrade your plan to invite more teachers.',
      trialExpired: true,
    });
  }

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

  // Always build the invite link against a real https origin — corsOrigin
  // can resolve to 'capacitor://localhost' when the request comes from
  // the native app's WebView, which would produce a broken link.
  const linkOrigin = corsOrigin.startsWith('http') ? corsOrigin : 'https://chekkiai.com';
  const inviteUrl = `${linkOrigin}/teacher?invite=${inviteId}`;

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
}

async function handleAssignClassTeacher(req: VercelRequest, res: VercelResponse, schoolId: string) {
  const { classId, teacherUid, assignAction } = req.body || {};
  if (typeof classId !== 'string' || typeof teacherUid !== 'string' || (assignAction !== 'add' && assignAction !== 'remove')) {
    return res.status(400).json({ error: 'classId, teacherUid, and assignAction ("add"|"remove") are required' });
  }

  const classRef = adminDb.collection('classes').doc(classId);
  const classSnap = await classRef.get();
  if (!classSnap.exists) return res.status(404).json({ error: 'Class not found' });
  if (classSnap.data()?.schoolId !== schoolId) {
    return res.status(403).json({ error: 'That class does not belong to your school' });
  }

  const teacherSnap = await adminDb.collection('users').doc(teacherUid).get();
  const teacherData = teacherSnap.data();
  if (!teacherSnap.exists || teacherData?.role !== 'teacher' || teacherData?.schoolId !== schoolId) {
    return res.status(400).json({ error: 'That teacher does not belong to your school' });
  }

  await classRef.update({
    assignedTeacherUids: assignAction === 'add' ? FieldValue.arrayUnion(teacherUid) : FieldValue.arrayRemove(teacherUid),
  });

  return res.status(200).json({ success: true });
}

async function handleRemoveTeacher(req: VercelRequest, res: VercelResponse, callerUid: string, schoolId: string) {
  const { teacherUid } = req.body || {};
  if (typeof teacherUid !== 'string' || !teacherUid) {
    return res.status(400).json({ error: 'teacherUid is required' });
  }
  if (callerUid === teacherUid) {
    return res.status(400).json({ error: 'Cannot remove yourself' });
  }

  const teacherRef = adminDb.collection('users').doc(teacherUid);
  const teacherSnap = await teacherRef.get();
  const teacherData = teacherSnap.data();
  if (!teacherSnap.exists || teacherData?.role !== 'teacher' || teacherData?.schoolId !== schoolId) {
    return res.status(400).json({ error: 'That teacher does not belong to your school' });
  }

  await teacherRef.update({
    role: FieldValue.delete(),
    schoolId: FieldValue.delete(),
    schoolName: FieldValue.delete(),
    educatorRole: FieldValue.delete(),
    removedFromSchoolAt: new Date().toISOString(),
  });

  const inviteSnap = await adminDb
    .collection('invites')
    .where('schoolId', '==', schoolId)
    .where('claimedByUid', '==', teacherUid)
    .where('status', '==', 'claimed')
    .get();
  await Promise.all(inviteSnap.docs.map((d) => d.ref.update({ status: 'revoked', revokedAt: new Date().toISOString() })));

  const classesSnap = await adminDb
    .collection('classes')
    .where('schoolId', '==', schoolId)
    .where('assignedTeacherUids', 'array-contains', teacherUid)
    .get();
  await Promise.all(
    classesSnap.docs.map((d) => d.ref.update({ assignedTeacherUids: FieldValue.arrayRemove(teacherUid) }))
  );

  return res.status(200).json({ success: true });
}

async function handler(req: VercelRequest, res: VercelResponse) {
  const corsOrigin = applyCors(req, res);

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing authorization header' });
  }
  const idToken = authHeader.split('Bearer ')[1].trim();

  const action = req.body?.action; // undefined => 'invite' (original default behavior)

  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    const userSnap = await adminDb.collection('users').doc(uid).get();
    const userData = userSnap.data();
    if (!userSnap.exists || userData?.role !== 'director' || !userData?.schoolId) {
      return res.status(403).json({ error: 'Only a director with a school can perform this action' });
    }
    const schoolId = userData.schoolId as string;

    if (action === 'assign') return await handleAssignClassTeacher(req, res, schoolId);
    if (action === 'remove') return await handleRemoveTeacher(req, res, uid, schoolId);
    return await handleCreateInvite(req, res, corsOrigin, uid, schoolId);
  } catch (error: any) {
    console.error('[create-teacher-invite] error:', error);
    return res.status(500).json({ error: 'Request failed' });
  }
}

export default withSentry(handler);
