import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
const app = initializeApp({ projectId: "homework-assistant-c00b9" });
const adminAuth = getAuth(app);
adminAuth.verifyIdToken("eyFakeToken")
  .catch(e => console.error("Verify Error:", e.message));
