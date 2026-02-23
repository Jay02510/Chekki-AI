let firebaseAdmin: any = null;

async function getFirebaseAdmin() {
    if (firebaseAdmin) return firebaseAdmin;
    if (!process.env.FIREBASE_PROJECT_ID) return null;

    try {
        const admin = await import('firebase-admin');
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
        firebaseAdmin = admin;
        return firebaseAdmin;
    } catch (e) {
        console.error("Firebase Admin initialization failed:", e);
        return null;
    }
}

export async function verifyAuth(req: any) {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ') || authHeader.endsWith(' undefined') || authHeader.endsWith(' null')) {
        return null; // Guest or unauthenticated
    }

    const admin = await getFirebaseAdmin();
    if (!admin) return null;

    const idToken = authHeader.split('Bearer ')[1];
    try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        return decodedToken;
    } catch (error) {
        console.error("Token verification failed:", error);
        throw new Error('INVALID_TOKEN');
    }
}
