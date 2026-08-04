import type { VercelRequest, VercelResponse } from '@vercel/node';
import { adminDb, adminAuth } from './_lib/firebaseAdmin';

// Sets a brand-new account's role (director/teacher) server-side, right after
// signup. The client can never write `role` directly — firestore.rules blocks
// it (users/{userId} update rule excludes 'role' from self-writable fields) —
// so a client-side updateDoc({ role }) call silently fails and the account is
// left with no persisted role (audit §20b/§20c). This endpoint is the one
// place that write is allowed to happen, and only as a one-time assignment:
// it refuses to change a role that's already been set, so it can't be used to
// self-promote an existing account.
const ALLOWED_ROLES = new Set(['director', 'teacher']);

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

  const { role } = req.body || {};
  if (!ALLOWED_ROLES.has(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    const userRef = adminDb.collection('users').doc(uid);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    const existingRole = userSnap.data()?.role;
    if (existingRole && existingRole !== 'parent') {
      // Role already assigned — refuse to overwrite (not a re-assignment endpoint).
      return res.status(409).json({ error: 'Role already set', role: existingRole });
    }

    await userRef.update({ role });
    return res.status(200).json({ success: true, role });
  } catch (error: any) {
    console.error('[set-initial-role] error:', error);
    return res.status(500).json({ error: 'Failed to set role' });
  }
}
