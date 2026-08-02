import type { VercelRequest, VercelResponse } from '@vercel/node';
// Fix 14 (Audit §13e): use shared Firebase Admin init instead of copy-pasted block
import { adminDb, adminAuth } from './_lib/firebaseAdmin';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Fix 13 (Audit §2): restrict CORS to known origins only.
  // Wildcard '*' on an authenticated data-writing endpoint allows any origin to
  // make cross-origin requests, which combined with a stolen Bearer token creates
  // an XSRF amplification surface.
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

  const { classCode } = req.body || {};
  if (!classCode) {
    return res.status(400).json({ error: 'Missing classCode' });
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    const sanitized = classCode.toUpperCase().trim();

    // Find the class document by joinCode
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
    const enrolledSnapshot = await adminDb
      .collection('users')
      .where('classId', '==', classId)
      .get();

    const isAlreadyEnrolled = enrolledSnapshot.docs.some((doc) => doc.id === uid);
    if (!isAlreadyEnrolled && enrolledSnapshot.size >= maxStudents) {
      return res.status(400).json({
        error: `This class has reached its enrollment capacity (${maxStudents} students). Please contact your teacher.`,
      });
    }

    // Update parent profile in Firestore
    await adminDb.collection('users').doc(uid).set(
      {
        schoolId: schoolId,
        schoolName: schoolName,
        classId: classId,
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
  } catch (error: any) {
    console.error('Redeem class code error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
