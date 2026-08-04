import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { adminDb, adminAuth } from './_lib/firebaseAdmin';

const firestore = getFirestore();

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

  const { schoolCode } = req.body || {};
  if (!schoolCode) {
    return res.status(400).json({ error: 'Missing schoolCode' });
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    const sanitized = schoolCode.toUpperCase().trim();

    // Fetch school config from Firestore
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
        schoolName: schoolName,
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
  } catch (err: any) {
    console.error('[redeem-school-code] Error:', err);
    return res.status(401).json({ error: 'Authentication failed' });
  }
}
