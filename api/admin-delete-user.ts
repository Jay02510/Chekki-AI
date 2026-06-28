import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

const ADMIN_PASSCODE = 'ChecciAdmin2026!';

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
const authDb = getAuth();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { passcode, uid } = req.body || {};

  if (passcode !== ADMIN_PASSCODE) {
    return res.status(401).json({ error: 'Unauthorized: Invalid Passcode' });
  }

  if (!uid) {
    return res.status(400).json({ error: 'User UID is required' });
  }

  try {
    // Delete user from Firestore
    await adminDb.collection('users').doc(uid).delete();

    // Delete user from Firebase Auth
    await authDb.deleteUser(uid);

    return res.status(200).json({ success: true, message: 'User deleted successfully' });
  } catch (err: any) {
    console.error('[admin-delete-user] Error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
