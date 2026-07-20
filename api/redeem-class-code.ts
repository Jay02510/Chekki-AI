import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

function initAdmin() {
  if (getApps().length > 0) return;
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (serviceAccount) {
    try {
      const cleaned = serviceAccount.trim().replace(/\n/g, '').replace(/\r/g, '');
      const parsed = JSON.parse(cleaned);
      initializeApp({ credential: cert(parsed) });
    } catch (e) {
      console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT:', e);
      initializeApp();
    }
  } else {
    initializeApp();
  }
}

initAdmin();
const adminDb = getFirestore();
const adminAuth = getAuth();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
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
