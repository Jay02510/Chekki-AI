import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

/**
 * Robust Firebase Admin Initialization
 * Handles service account from FIREBASE_SERVICE_ACCOUNT environment variable (JSON string)
 * or falls back to default Vercel/GCP credentials.
 */
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
const adminAuth = getAuth();

export default async function handler(req: VercelRequest, res: VercelResponse) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

    // Verify Firebase ID Token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Missing authorization header' });
    }
    const idToken = authHeader.split('Bearer ')[1].trim();

    try {
        const decodedToken = await adminAuth.verifyIdToken(idToken);
        const userId = decodedToken.uid;

        const subRef = adminDb.collection('subscriptions').doc(userId);
        const subDoc = await subRef.get();

        if (!subDoc.exists) {
            return res.status(200).json({
                subscription_status: 'none',
                subscription_platform: 'none',
                subscription_expiry_date: null,
            });
        }

        const data = subDoc.data()!;
        const now = new Date();
        const expiry = data.subscription_expiry_date ? new Date(data.subscription_expiry_date) : null;

        // Auto-expire if past expiry date
        if (
            expiry &&
            expiry < now &&
            data.subscription_status === 'active'
        ) {
            await subRef.update({ subscription_status: 'expired', updated_at: now.toISOString() });
            data.subscription_status = 'expired';

            // Also update user plan in main users collection
            await adminDb.collection('users').doc(userId).update({ plan: 'free', maxScansPerDay: 3 });
        }

        return res.status(200).json({
            subscription_status: data.subscription_status || 'none',
            subscription_platform: data.subscription_platform || 'none',
            subscription_expiry_date: data.subscription_expiry_date || null,
        });
    } catch (err: any) {
        console.error('[subscription-status] Error:', err);
        if (err.code === 'auth/id-token-expired') {
            return res.status(401).json({ error: 'Token expired' });
        }
        return res.status(401).json({ error: 'Invalid token' });
    }
}
