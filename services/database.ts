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
    if (isNativePlatform && getApps().length === 1) {
      console.log('[Firebase] Using localStorage persistence for native platform');
      return initializeAuth(app, {
        persistence: browserLocalPersistence
      });
    }
  } catch (e) {
    console.warn('[Firebase] initializeAuth failed, falling back to getAuth:', e);
  }
  return getAuth(app);
})();
export const dbInstance = getFirestore(app);

// Analytics may not work in Capacitor native WebView — init safely
let analyticsInstance: ReturnType<typeof getAnalytics> | null = null;
try {
  // Only init analytics in browser, not native Capacitor
  const isNative = typeof window !== 'undefined' && (window as any).Capacitor?.isNativePlatform?.();
  if (!isNative) {
    analyticsInstance = getAnalytics(app);
  } else {
    console.log('[Firebase] Skipping Analytics on native platform');
  }
} catch (e) {
  console.warn('[Firebase] Analytics init failed:', e);
}
export const analytics = analyticsInstance;

const getLocalKey = (uid: string) => `chekki_mistakes_${uid}`;

export const db = {
  async getUser(uid: string): Promise<UserProfile | null> {
    try {
      console.log('[Database] Fetching user profile for:', uid);
      const docRef = doc(dbInstance, "users", uid);
      const docSnap = await getDoc(docRef);
      console.log('[Database] User profile found:', docSnap.exists());
      return docSnap.exists() ? (docSnap.data() as UserProfile) : null;
    } catch (e: any) {
      console.error('[Database] getUser error:', e);
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
    try {
      console.log('[Database] Creating user document for:', uid);
      await setDoc(doc(dbInstance, "users", uid), { ...profile, uid });
      console.log('[Database] User document created successfully');
    } catch (e: any) {
      console.error('[Database] createUser error:', e.message || e);
      throw e;
    }
  },

  async updateUser(uid: string, updates: Partial<UserProfile>): Promise<void> {
    try {
      const userRef = doc(dbInstance, "users", uid);
      await updateDoc(userRef, updates);
    } catch (e) { }
  },

  async getMistakes(uid: string): Promise<any[]> {
    try {
      const items: any[] = [];
      const q = query(collection(dbInstance, "mistakes"), where("userId", "==", uid));
      const querySnapshot = await getDocs(q);
      querySnapshot.forEach((doc) => items.push(doc.data()));
      const sorted = items.sort((a, b) => (b.dateAdded || "").localeCompare(a.dateAdded || ""));
      localStorage.setItem(getLocalKey(uid), JSON.stringify(sorted));
      return sorted;
    } catch (e: any) {
      const localData = localStorage.getItem(getLocalKey(uid));
      return localData ? JSON.parse(localData) : [];
    }
  },

  async addMistake(uid: string, mistake: any): Promise<void> {
    const localKey = getLocalKey(uid);
    const currentLocal = JSON.parse(localStorage.getItem(localKey) || '[]');
    localStorage.setItem(localKey, JSON.stringify([mistake, ...currentLocal]));
    try {
      await setDoc(doc(dbInstance, "mistakes", mistake.uniqueId), { ...mistake, userId: uid });
    } catch (e: any) { }
  },

  async removeMistake(uniqueId: string, uid?: string): Promise<void> {
    if (uid) {
      const localKey = getLocalKey(uid);
      const currentLocal = JSON.parse(localStorage.getItem(localKey) || '[]');
      localStorage.setItem(localKey, JSON.stringify(currentLocal.filter((m: any) => m.uniqueId !== uniqueId)));
    }
    try {
      await deleteDoc(doc(dbInstance, "mistakes", uniqueId));
    } catch (e: any) { }
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
    } catch (e: any) {
      console.error("[Chekki DB] sendFeedback failed:", e.message);
    }
  },

  async redeemBetaCode(code: string, limit: number): Promise<boolean> {
    const usageRef = doc(dbInstance, "system", "beta_usage");
    try {
      return await runTransaction(dbInstance, async (transaction) => {
        const usageDoc = await transaction.get(usageRef);
        let currentCount = 0;
        if (usageDoc.exists()) {
          currentCount = usageDoc.data()[code] || 0;
        }
        if (currentCount >= limit) return false;
        transaction.set(usageRef, { [code]: currentCount + 1 }, { merge: true });
        return true;
      });
    } catch (e) {
      console.error("Redemption transaction failed", e);
      return false;
    }
  },

  logUserEvent(eventName: string, params?: any) {
    try {
      if (analytics) {
        logEvent(analytics, eventName, params);
        console.log(`[Analytics] Logged event: ${eventName}`, params);
      }
    } catch (e) {
      console.warn("[Analytics] Failed to log event:", e);
    }
  }
};
