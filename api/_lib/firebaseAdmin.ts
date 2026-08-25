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

// firestore.rules' isSchoolDirectorOfClass()/isClassTeacher() gate reads via
// get(users/$(request.auth.uid)).data.role/.schoolId — a cross-document
// read. Firestore denies an entire LIST query outright when its rule
// depends on a get()/exists() call to a document unrelated to the query's
// own filter, even though a plain single-doc get() with the identical rule
// succeeds (confirmed empirically: TeacherPage.tsx's classes list queries
// all failed permission-denied for a real director account while a get() on
// one known class doc, and on their own user doc, both succeeded).
//
// Auth custom claims sidestep this: request.auth.token.role/.schoolId come
// from the caller's own ID token, not a Firestore read, so a rule built on
// them needs zero get()/exists() calls and list queries evaluate cleanly.
// Call this any time role/schoolId is written server-side so the token
// claims never drift from the Firestore user doc.
//
// setCustomUserClaims() REPLACES the entire claims object on every call —
// it does not merge. Always re-reading the just-committed Firestore doc
// (rather than trusting whatever fields a given caller happened to change)
// means every call site sets the complete, correct claims object, so a
// caller that only touched schoolId can never silently wipe out an
// already-set role claim (or vice versa).
export async function syncAuthClaims(uid: string): Promise<void> {
  try {
    const snap = await adminDb.collection('users').doc(uid).get();
    const data = snap.data() || {};
    await adminAuth.setCustomUserClaims(uid, { role: data.role || null, schoolId: data.schoolId || null });
  } catch (e) {
    // Non-fatal — the Firestore doc (source of truth) is already written by
    // the caller; a claims-sync failure just means this account keeps
    // relying on the get()-based rule path until the next successful sync
    // or the backfill sweep catches it, not a data-loss risk.
    console.error(`[syncAuthClaims] Failed to set claims for ${uid}:`, e);
  }
}
