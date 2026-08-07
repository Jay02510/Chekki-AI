import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withSentry } from './_lib/withSentry';
import { adminDb, adminAuth } from './_lib/firebaseAdmin';
import { applyCors } from './_lib/cors';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * Director-only: adds or removes a teacher from a class's assignedTeacherUids.
 * Admin SDK only (bypasses firestore.rules' classes/{classId} update rule,
 * which explicitly forbids clients from changing teacherUid/assignedTeacherUids
 * themselves) — every membership check (caller is director of the class's
 * school, target teacherUid actually belongs to that school) happens here.
 */
async function handler(req: VercelRequest, res: VercelResponse) {
  applyCors(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing authorization header' });
  }

  const { classId, teacherUid, action } = req.body || {};
  if (typeof classId !== 'string' || typeof teacherUid !== 'string' || (action !== 'add' && action !== 'remove')) {
    return res.status(400).json({ error: 'classId, teacherUid, and action ("add"|"remove") are required' });
  }

  try {
    const decoded = await adminAuth.verifyIdToken(authHeader.slice(7));
    const callerUid = decoded.uid;

    const callerSnap = await adminDb.collection('users').doc(callerUid).get();
    const callerData = callerSnap.data();
    if (!callerSnap.exists || callerData?.role !== 'director' || !callerData?.schoolId) {
      return res.status(403).json({ error: 'Only a director with a school can assign teachers' });
    }
    const schoolId = callerData.schoolId as string;

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
      assignedTeacherUids: action === 'add' ? FieldValue.arrayUnion(teacherUid) : FieldValue.arrayRemove(teacherUid),
    });

    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('[assign-class-teacher] error:', error);
    return res.status(500).json({ error: 'Failed to update class assignment' });
  }
}

export default withSentry(handler);
