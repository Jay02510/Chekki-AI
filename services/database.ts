import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getFirestore,
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
  runTransaction
} from 'firebase/firestore';
import { getAuth, initializeAuth, browserLocalPersistence, indexedDBLocalPersistence } from 'firebase/auth';
import { getAnalytics, logEvent } from 'firebase/analytics';
import { UserProfile } from '../types';

const firebaseConfig = {
  apiKey: "AIzaSyBU8ehL18e1y-WXMULzA9XkKFkC7BkzX8k",
  authDomain: "homework-assistant-c00b9.firebaseapp.com",
  projectId: "homework-assistant-c00b9",
  storageBucket: "homework-assistant-c00b9.firebasestorage.app",
  messagingSenderId: "123535525914",
  appId: "1:123535525914:web:decc3f5b3e3ffee4a0a9a3"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Use localStorage persistence on native (Capacitor) to avoid IndexedDB hang
const isNativePlatform = typeof window !== 'undefined' && (window as any).Capacitor?.isNativePlatform?.();
export const auth = (() => {
  try {
    if (isNativePlatform) {
      return initializeAuth(app, {
        persistence: indexedDBLocalPersistence
      });
    }
  } catch (e) {
    console.error("Firebase auth initialization error:", e);
  }
  return getAuth(app);
})();
export const dbInstance = getFirestore(app);

// Analytics may not work in Capacitor native WebView — init safely
let analyticsInstance: ReturnType<typeof getAnalytics> | null = null;
try {
  // Only init analytics in browser (or Android if permitted)
  const isNative = typeof window !== 'undefined' && (window as any).Capacitor?.isNativePlatform?.();
  if (!isNative) {
    analyticsInstance = getAnalytics(app);
  }
  } catch (e) { console.error(e); }
export const analytics = analyticsInstance;

const getLocalKey = (uid: string) => `chekki_mistakes_${uid}`;

export const db = {
  async getUser(uid: string): Promise<UserProfile | null> {
    try {
      const docRef = doc(dbInstance, "users", uid);
      const docSnap = await getDoc(docRef);
      return docSnap.exists() ? (docSnap.data() as UserProfile) : null;
    } catch (e: any) {
      return null;
    }
  },

  async isAdmin(uid: string): Promise<boolean> {
    try {
      const adminRef = doc(dbInstance, "admins", uid);
      const adminSnap = await getDoc(adminRef);
      return adminSnap.exists();
    } catch (e) {
      return false;
    }
  },

  async createUser(uid: string, profile: UserProfile): Promise<void> {
    await setDoc(doc(dbInstance, "users", uid), { ...profile, uid });
  },

  async updateUser(uid: string, updates: Partial<UserProfile>): Promise<void> {
    try {
      const userRef = doc(dbInstance, "users", uid);
      await updateDoc(userRef, updates);
    } catch (e: any) { console.error("Update fallback", e); }
  },

  async sendFeedback(uid: string, feedback: {
    rating?: number;
    comment: string;
    context?: any;
    userEmail?: string;
    userName?: string;
  }): Promise<void> {
    try {
      await addDoc(collection(dbInstance, "feedback"), {
        ...feedback,
        userId: uid,
        timestamp: new Date().toISOString()
      });
    } catch (e: any) { console.error(e); }
  },

  logUserEvent(eventName: string, params?: any) {
    try {
      if (analytics) {
        logEvent(analytics, eventName, params);
      }
    } catch (e) { console.error(e); }
  }
};
