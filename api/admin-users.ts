import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const ADMIN_PASSCODE = 'ChekkiAdmin2026!';

function initAdmin() {
    if (getApps().length > 0) return;
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (serviceAccount) {
        try {
            const parsed = JSON.parse(serviceAccount);
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

    const { passcode } = req.body || {};

    if (passcode !== ADMIN_PASSCODE) {
        return res.status(401).json({ error: 'Unauthorized: Invalid Passcode' });
    }

    try {
        const usersSnapshot = await adminDb.collection('users').orderBy('subscriptionStartedAt', 'desc').limit(100).get();
        
        const users = usersSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                uid: doc.id,
                name: data.name || 'Unknown',
                email: data.email || 'No email',
                plan: data.plan || 'free',
                subscriptionStartedAt: data.subscriptionStartedAt || null,
                nextBillingDate: data.nextBillingDate || null,
                maxScansPerDay: data.maxScansPerDay || 0
            };
        });

        return res.status(200).json({ success: true, users });
    } catch (err: any) {
        console.error('[admin-users] Error:', err);
        return res.status(500).json({ error: err.message || 'Internal server error' });
    }
}
