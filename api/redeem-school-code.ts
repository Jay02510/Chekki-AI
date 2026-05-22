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

    const { schoolCode } = req.body || {};
    if (!schoolCode) {
        return res.status(400).json({ error: 'Missing schoolCode' });
    }

    try {
        const decodedToken = await adminAuth.verifyIdToken(idToken);
        const uid = decodedToken.uid;

        const sanitized = schoolCode.toUpperCase().trim();
        const schools: Record<string, string> = {
            'POLY10': 'Poly Academy Seocho',
            'GATE05': 'GATE Academy Bundang',
            'ECC99': 'YBM ECC Gangnam'
        };

        if (!schools[sanitized]) {
            return res.status(400).json({ error: 'Invalid school code' });
        }

        const schoolName = schools[sanitized];
        await adminDb.collection('users').doc(uid).update({
            schoolId: sanitized,
            schoolName: schoolName,
            plan: 'pro',
            maxScansPerDay: 9999,
            maxQuestionsPerDay: 9999,
            subscriptionPlatform: 'school_code'
        });

        return res.status(200).json({
            success: true,
            schoolName,
            message: 'School code redeemed successfully'
        });
    } catch (err: any) {
        console.error('[redeem-school-code] Error:', err);
        return res.status(401).json({ error: 'Authentication failed' });
    }
}
