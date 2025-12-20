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
  addDoc
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { UserProfile } from '../types';

const firebaseConfig = {
  apiKey: "AIzaSyBU8ehL18e1y-WXMULzA9XkKFkC7BkzX8k",
  authDomain: "homework-assistant-c00b9.firebaseapp.com",
  projectId: "homework-assistant-c00b9",
  storageBucket: "homework-assistant-c00b9.firebasestorage.app",
  messagingSenderId: "123535525914",
  appId: "1:123535525914:web:decc3f5b3e3ffee4a0a9a3"
};

// Safe initialization for hot-reloading and ESM environments
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// These exports should be initialized after app is ready
export const auth = getAuth(app);
export const dbInstance = getFirestore(app);

const getLocalKey = (uid: string) => `chekki_mistakes_${uid}`;

export const db = {
  async getUser(uid: string): Promise<UserProfile | null> {
    try {
        const docRef = doc(dbInstance, "users", uid);
        const docSnap = await getDoc(docRef);
        return docSnap.exists() ? (docSnap.data() as UserProfile) : null;
    } catch (e: any) {
        console.warn("[Chekki DB] getUser failed:", e.message);
        return null;
    }
  },

  async createUser(uid: string, profile: UserProfile): Promise<void> {
    try {
      await setDoc(doc(dbInstance, "users", uid), { ...profile, uid });
    } catch (e) {
      console.error("[Chekki DB] createUser failed:", e);
    }
  },

  async updateUser(uid: string, updates: Partial<UserProfile>): Promise<void> {
    try {
      const userRef = doc(dbInstance, "users", uid);
      await updateDoc(userRef, updates);
    } catch (e) {
      console.error("[Chekki DB] updateUser failed:", e);
    }
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
    } catch (e: any) {
      console.warn("[Chekki DB] addMistake cloud sync failed:", e.message);
    }
  },

  async removeMistake(uniqueId: string, uid?: string): Promise<void> {
    if (uid) {
      const localKey = getLocalKey(uid);
      const currentLocal = JSON.parse(localStorage.getItem(localKey) || '[]');
      localStorage.setItem(localKey, JSON.stringify(currentLocal.filter((m: any) => m.uniqueId !== uniqueId)));
    }
    try {
      await deleteDoc(doc(dbInstance, "mistakes", uniqueId));
    } catch (e: any) {
      console.warn("[Chekki DB] removeMistake cloud sync failed:", e.message);
    }
  },

  async sendFeedback(uid: string, feedback: { rating?: number, comment: string, context?: any }): Promise<void> {
    try {
      await addDoc(collection(dbInstance, "feedback"), {
        ...feedback,
        userId: uid,
        timestamp: new Date().toISOString()
      });
    } catch (e: any) {
      console.error("[Chekki DB] sendFeedback failed:", e.message);
      throw e;
    }
  }
};