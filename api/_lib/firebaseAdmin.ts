/**
 * Shared Firebase Admin SDK initialization.
 *
 * Fix 14 (Audit §13e): This module replaces the ~15-line Firebase Admin init
 * block that was previously copy-pasted into 4+ API files. Import from here
 * instead of duplicating the init logic.
 *
 * Usage:
 *   import { adminDb, adminAuth } from './_lib/firebaseAdmin.js';
 */
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

function initAdmin(): void {
  if (getApps().length > 0) return;

  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (serviceAccount) {
    try {
      const cleaned = serviceAccount.trim().replace(/\n/g, '').replace(/\r/g, '');
      const parsed = JSON.parse(cleaned);
      initializeApp({ credential: cert(parsed) });
    } catch (e) {
      console.error('[firebaseAdmin] Failed to parse FIREBASE_SERVICE_ACCOUNT:', e);
      initializeApp();
    }
  } else {
    initializeApp();
  }
}

initAdmin();

export const adminDb = getFirestore();
export const adminAuth = getAuth();
