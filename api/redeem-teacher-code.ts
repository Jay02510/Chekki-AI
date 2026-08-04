import type { VercelRequest, VercelResponse } from '@vercel/node';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb, adminAuth } from './_lib/firebaseAdmin';

export default async function handler(req: VercelRequest, res: VercelResponse) {
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

  const { teacherCode } = req.body || {};
  if (!teacherCode) {
    return res.status(400).json({ error: 'Missing teacherCode' });
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    const sanitized = teacherCode.toUpperCase().trim();

    // Find school document where teacherCode matches
    const schoolsRef = adminDb.collection('schools');
    const qSnapshot = await schoolsRef.where('teacherCode', '==', sanitized).limit(1).get();

    if (qSnapshot.empty) {
      return res.status(400).json({ error: 'Invalid teacher authorization code. Please verify.' });
    }

    const schoolDoc = qSnapshot.docs[0];
    const schoolId = schoolDoc.id;
    const schoolData = schoolDoc.data() || {};
    const schoolName = schoolData.name || schoolId;

    // Usage limits verification
    const usedByUids = schoolData.usedByUids || [];
    const maxUses = schoolData.maxUses ?? 5;

    if (!usedByUids.includes(uid) && usedByUids.length >= maxUses) {
      return res
        .status(400)
        .json({ error: 'This teacher authorization code has reached its maximum usage limit.' });
    }

    // Update user profile in Firestore
    await adminDb.collection('users').doc(uid).set(
      {
        role: 'teacher',
        schoolId: schoolId,
        schoolName: schoolName,
        plan: 'pro',
        maxScansPerDay: 9999,
        maxQuestionsPerDay: 9999,
        subscriptionPlatform: 'school_code',
      },
      { merge: true }
    );

    // Track usage on school document
    await adminDb
      .collection('schools')
      .doc(schoolId)
      .update({
        usedByUids: FieldValue.arrayUnion(uid),
      });

    return res.status(200).json({
      success: true,
      schoolId: schoolId,
      schoolName: schoolName,
      message: 'Teacher registration completed successfully',
    });
  } catch (err: any) {
    console.error('[redeem-teacher-code] Error:', err);
    return res.status(401).json({ error: 'Authentication failed' });
  }
}
