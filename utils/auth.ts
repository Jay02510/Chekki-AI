let firebaseAdmin: any = null;
async function getFirebaseAdmin() {
  if (firebaseAdmin) return firebaseAdmin;

  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
  const projectId = process.env.FIREBASE_PROJECT_ID;

  if (!serviceAccount && !projectId) return null;

  try {
    const adminModule = await import('firebase-admin');
    // Handle both CJS (default) and ESM patterns
    const admin = adminModule.default || adminModule;

    const apps = admin.apps || [];
    if (!apps.length) {
      if (serviceAccount) {
        const cleaned = serviceAccount.trim().replace(/\n/g, '').replace(/\r/g, '');
        const parsed = JSON.parse(cleaned);
        admin.initializeApp({
          credential: admin.credential.cert(parsed),
        });
      } else {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId: projectId,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
          }),
        });
      }
    }
    firebaseAdmin = admin;
    return firebaseAdmin;
  } catch (e) {
    console.error('Firebase Admin initialization failed:', e);
    return null;
  }
}

export async function verifyAuth(req: any) {
  const authHeader = req.headers.authorization;
  if (
    !authHeader?.startsWith('Bearer ') ||
    authHeader.endsWith(' undefined') ||
    authHeader.endsWith(' null')
  ) {
    return null; // Guest or unauthenticated
  }

  const admin = await getFirebaseAdmin();
  if (!admin) return null;

  const idToken = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    console.error('Token verification failed:', error);
    throw new Error('INVALID_TOKEN');
  }
}
