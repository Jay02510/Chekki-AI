import * as admin from 'firebase-admin';

const apps = admin.apps || [];

if (!apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
    });
}

export async function verifyAuth(req: any) {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ') || authHeader.endsWith(' undefined') || authHeader.endsWith(' null')) {
        return null; // Guest or unauthenticated
    }

    const idToken = authHeader.split('Bearer ')[1];

    // Check if Firebase is configured
    if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_PRIVATE_KEY) {
        console.warn("Firebase Admin not configured, skipping token verification");
        return null;
    }

    try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        return decodedToken;
    } catch (error) {
        console.error("Token verification failed:", error);
        throw new Error('INVALID_TOKEN');
    }
}
