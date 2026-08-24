import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  initializeFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  addDoc,
  runTransaction,
} from 'firebase/firestore';
import {
  getAuth,
  initializeAuth,
  browserLocalPersistence,
  indexedDBLocalPersistence,
} from 'firebase/auth';
import { getAnalytics, logEvent } from 'firebase/analytics';
import { UserProfile } from '../types';
import { Capacitor } from '@capacitor/core';

const firebaseConfig = {
  apiKey: 'AIzaSyBU8ehL18e1y-WXMULzA9XkKFkC7BkzX8k',
  authDomain: 'homework-assistant-c00b9.firebaseapp.com',
  projectId: 'homework-assistant-c00b9',
  storageBucket: 'homework-assistant-c00b9.firebasestorage.app',
  messagingSenderId: '123535525914',
  appId: '1:123535525914:web:decc3f5b3e3ffee4a0a9a3',
  measurementId: 'G-8WK1D8YCGC',
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Use localStorage persistence on native (Capacitor) to avoid IndexedDB hang
const isNativePlatform = typeof window !== 'undefined' && Capacitor.isNativePlatform();

export const auth = (() => {
  if (isNativePlatform) {
    try {
      return initializeAuth(app, {
        persistence: browserLocalPersistence,
      });
    } catch (e: any) {
      if (e.code === 'auth/already-initialized') {
        return getAuth(app);
      }
      console.error('Firebase auth initialization error, retrying with indexedDB persistence:', e);
      try {
        return initializeAuth(app, {
          persistence: indexedDBLocalPersistence,
        });
      } catch (e2: any) {
        if (e2.code === 'auth/already-initialized') {
          return getAuth(app);
        }
        // Both persistence strategies failed — sessions will not survive an
        // app restart on this device. Surface loudly rather than silently
        // falling back to an unconfigured getAuth(app), which was masking
        // this as "auth randomly logs users out on cold start."
        console.error('Firebase auth: both browserLocal and indexedDB persistence failed, falling back to default (session will NOT persist):', e2);
      }
    }
  }
  return getAuth(app);
})();

export const dbInstance = (() => {
  try {
    if (isNativePlatform) {
      return initializeFirestore(app, {
        experimentalForceLongPolling: true,
      });
    }
    return getFirestore(app);
  } catch (e: any) {
    return getFirestore(app);
  }
})();

// Analytics may not work in Capacitor native WebView — init safely
let analyticsInstance: ReturnType<typeof getAnalytics> | null = null;
try {
  // Only init analytics in browser (or Android if permitted)
  const isNative = typeof window !== 'undefined' && Capacitor.isNativePlatform();
  if (!isNative) {
    analyticsInstance = getAnalytics(app);
  }
} catch (e) {
  console.error(e);
}
export const analytics = analyticsInstance;

const getLocalKey = (uid: string) => `chekki_mistakes_${uid}`;

export const db = {
  async getUser(uid: string): Promise<UserProfile | null> {
    const docRef = doc(dbInstance, 'users', uid);
    try {
      // 5-second timeout to prevent indefinite simulator hangs
      const docSnap = await Promise.race([
        getDoc(docRef),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000)),
      ]);
      return docSnap.exists() ? (docSnap.data() as UserProfile) : null;
    } catch (e) {
      console.warn('[getUser] failed or timed out:', e);
      throw e;
    }
  },

  async isAdmin(uid: string): Promise<boolean> {
    try {
      const adminRef = doc(dbInstance, 'admins', uid);
      const adminSnap = await getDoc(adminRef);
      return adminSnap.exists();
    } catch (e) {
      return false;
    }
  },

  async createUser(uid: string, profile: UserProfile): Promise<void> {
    await setDoc(doc(dbInstance, 'users', uid), { ...profile, uid });
  },

  async updateUser(uid: string, updates: Partial<UserProfile>): Promise<void> {
    try {
      const userRef = doc(dbInstance, 'users', uid);
      await updateDoc(userRef, updates);
    } catch (e: any) {
      console.error('Update fallback', e);
      // Every caller (SettingsModal, ProgressiveOnboardingModal, ...) already
      // awaits this inside its own try/catch and expects a rejected promise
      // to mean the write failed. Swallowing it here meant those catch blocks
      // never ran, so a rejected Firestore update (e.g. a firestore.rules
      // field-write rejection) looked identical to success (Audit: swallowed
      // write errors in database.ts).
      throw e;
    }
  },

  async deleteUserDoc(uid: string): Promise<void> {
    try {
      const userRef = doc(dbInstance, 'users', uid);
      await deleteDoc(userRef);
    } catch (e: any) {
      console.error('Failed to delete user document:', e);
      throw e;
    }
  },

  async sendFeedback(
    uid: string,
    feedback: {
      rating?: number;
      comment: string;
      context?: any;
      userEmail?: string;
      userName?: string;
      userRole?: string;
    }
  ): Promise<void> {
    try {
      await addDoc(collection(dbInstance, 'feedback'), {
        ...feedback,
        userId: uid,
        timestamp: new Date().toISOString(),
      });
    } catch (e: any) {
      console.error(e);
      throw e;
    }
  },

  // Throws on a real read failure instead of swallowing to `[]` — a caller
  // that can't tell "genuinely no mistakes yet" from "the read failed"
  // ends up treating a network blip as an empty account and can overwrite
  // real cloud data with nothing (Audit: silent mistake-history wipe).
  async getUserMistakes(uid: string): Promise<any[]> {
    const docRef = doc(dbInstance, 'users', uid, 'data', 'mistakes');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data().items || [];
    }
    return [];
  },

  // classId is stamped onto the doc so a teacher's read access (firestore.rules
  // users/{userId}/data/{document=**}) can check what class this data was
  // actually saved under, instead of the student's current, live-mutable
  // classId field — which used to mean switching classes granted the new
  // teacher instant read access to a student's entire mistake history from
  // a prior, unrelated academy (Audit: class-switch data boundary).
  async saveUserMistakes(uid: string, mistakes: any[], classId?: string | null): Promise<void> {
    try {
      const docRef = doc(dbInstance, 'users', uid, 'data', 'mistakes');
      await setDoc(
        docRef,
        { items: mistakes, updatedAt: new Date().toISOString(), classId: classId ?? null },
        { merge: true }
      );
    } catch (e) {
      console.error('[saveUserMistakes] failed:', e);
      throw e;
    }
  },

  logUserEvent(eventName: string, params?: any) {
    try {
      if (analytics) {
        logEvent(analytics, eventName, params);
      }
    } catch (e) {
      console.error(e);
    }
  },
};
