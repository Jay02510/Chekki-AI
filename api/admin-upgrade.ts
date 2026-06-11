import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const ADMIN_PASSCODE = 'ChekkiAdmin2026!';

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { passcode, email, duration } = req.body || {};

  if (passcode !== ADMIN_PASSCODE) {
    return res.status(401).json({ error: 'Unauthorized: Invalid Passcode' });
  }
  if (!email) {
    return res.status(400).json({ error: 'Missing email' });
  }

  try {
    const cleanEmail = email.toLowerCase().trim();
    const usersRef = adminDb.collection('users');
    const q = usersRef.where('email', '==', cleanEmail);
    const querySnapshot = await q.get();

    if (querySnapshot.empty) {
      return res.status(404).json({ error: 'User not found. Please check the email address.' });
    }

    const userDoc = querySnapshot.docs[0];
    const uid = userDoc.id;

    let nextBillingDateStr: string | null = null;
    if (duration === '1_month') {
      const d = new Date();
      d.setMonth(d.getMonth() + 1);
      nextBillingDateStr = d.toISOString();
    } else if (duration === '1_year') {
      const d = new Date();
      d.setFullYear(d.getFullYear() + 1);
      nextBillingDateStr = d.toISOString();
    } else if (duration === 'lifetime') {
      const d = new Date();
      d.setFullYear(d.getFullYear() + 100);
      nextBillingDateStr = d.toISOString();
    }

    await adminDb.collection('users').doc(uid).update({
      plan: 'pro',
      maxScansPerDay: 9999,
      maxQuestionsPerDay: 9999,
      subscriptionStartedAt: new Date().toISOString(),
      nextBillingDate: nextBillingDateStr,
      subscriptionPlatform: 'admin_upgrade',
    });

    return res.status(200).json({ success: true, message: 'User upgraded successfully' });
  } catch (err: any) {
    console.error('[admin-upgrade] Error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
