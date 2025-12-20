
import { initializeApp } from "firebase/app";
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
  Firestore
} from 'firebase/firestore';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  onAuthStateChanged,
  Auth
} from 'firebase/auth';
import { UserProfile, WorksheetItem } from '../types';

const firebaseConfig = {
  apiKey: "AIzaSyBU8ehL18e1y-WXMULzA9XkKFkC7BkzX8k",
  authDomain: "homework-assistant-c00b9.firebaseapp.com",
  projectId: "homework-assistant-c00b9",
  storageBucket: "homework-assistant-c00b9.firebasestorage.app",
  messagingSenderId: "123535525914",
  appId: "1:123535525914:web:decc3f5b3e3ffee4a0a9a3"
};

const app = initializeApp(firebaseConfig);
export const auth: Auth = getAuth(app);
export const dbInstance: Firestore = getFirestore(app);

export const db = {
  async getUser(uid: string): Promise<UserProfile | null> {
    try {
        const docRef = doc(dbInstance, "users", uid);
        const docSnap = await getDoc(docRef);
        return docSnap.exists() ? (docSnap.data() as UserProfile) : null;
    } catch (e) {
        console.error("DB Get User Error:", e);
        return null;
    }
  },

  async createUser(uid: string, profile: UserProfile): Promise<void> {
    await setDoc(doc(dbInstance, "users", uid), { ...profile, uid });
  },

  async updateUser(uid: string, updates: Partial<UserProfile>): Promise<void> {
    const userRef = doc(dbInstance, "users", uid);
    await updateDoc(userRef, updates);
  },

  async getMistakes(uid: string): Promise<any[]> {
    const items: any[] = [];
    const q = query(collection(dbInstance, "mistakes"), where("userId", "==", uid));
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((doc) => items.push(doc.data()));
    return items.sort((a, b) => (b.dateAdded || "").localeCompare(a.dateAdded || ""));
  },

  async addMistake(uid: string, mistake: any): Promise<void> {
    await setDoc(doc(dbInstance, "mistakes", mistake.uniqueId), { ...mistake, userId: uid });
  },

  async removeMistake(uniqueId: string): Promise<void> {
    await deleteDoc(doc(dbInstance, "mistakes", uniqueId));
  }
};
