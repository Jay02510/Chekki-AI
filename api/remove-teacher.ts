import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withSentry } from './_lib/withSentry';
import { adminDb, adminAuth } from './_lib/firebaseAdmin';
import { applyCors } from './_lib/cors';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * Director-only: revokes a teacher's access to the school.
 *
 * Three effects, all server-side (Admin SDK — no client rule allows a
 * director to edit another user's role/schoolId, by design):
 * 1. Clears the teacher's role/schoolId/educatorRole so isClassTeacher() and
 *    isSchoolDirectorOfClass() stop granting them access (role liveness
 *    check added to isClassTeacher() specifically to make this work, not
 *    just leaving stale teacherUid/assignedTeacherUids matches around).
 * 2. Revokes their claimed invite (status: 'revoked') so TeacherInvitePanel's
 *    seat count frees up immediately — it only counts 'pending'|'claimed'.
 * 3. Best-effort removes them from assignedTeacherUids on the school's
 *    classes, so stale entries don't linger in the assignment UI.
 */
async function handler(req: VercelRequest, res: VercelResponse) {
  applyCors(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing authorization header' });
  }

  const { teacherUid } = req.body || {};
  if (typeof teacherUid !== 'string' || !teacherUid) {
    return res.status(400).json({ error: 'teacherUid is required' });
  }

  try {
    const decoded = await adminAuth.verifyIdToken(authHeader.slice(7));
    const callerUid = decoded.uid;
    if (callerUid === teacherUid) {
      return res.status(400).json({ error: 'Cannot remove yourself' });
    }

    const callerSnap = await adminDb.collection('users').doc(callerUid).get();
    const callerData = callerSnap.data();
    if (!callerSnap.exists || callerData?.role !== 'director' || !callerData?.schoolId) {
      return res.status(403).json({ error: 'Only a director with a school can remove teachers' });
    }
    const schoolId = callerData.schoolId as string;

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
  } catch (error: any) {
    console.error('[remove-teacher] error:', error);
    return res.status(500).json({ error: 'Failed to remove teacher' });
  }
}

export default withSentry(handler);
