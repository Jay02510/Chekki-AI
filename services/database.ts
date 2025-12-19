
import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs,
  deleteDoc,
  Firestore
} from 'firebase/firestore';
import { UserProfile, WorksheetItem } from '../types';

// --- FIREBASE CONFIGURATION ---
// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBU8ehL18e1y-WXMULzA9XkKFkC7BkzX8k",
  authDomain: "homework-assistant-c00b9.firebaseapp.com",
  projectId: "homework-assistant-c00b9",
  storageBucket: "homework-assistant-c00b9.firebasestorage.app",
  messagingSenderId: "123535525914",
  appId: "1:123535525914:web:decc3f5b3e3ffee4a0a9a3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
let dbInstance: Firestore | null = null;

try {
    dbInstance = getFirestore(app);
    console.log("Firebase initialized successfully");
} catch (e) {
    console.warn("Firebase initialization failed completely (Offline Mode Active):", e);
}

// --- LOCAL STORAGE FALLBACK HELPERS ---
const LOCAL_KEYS = {
    USER: 'hw_user',
    MISTAKES: 'hw_mistakes_db'
};

const localDB = {
    getUser: (email: string): UserProfile | null => {
        try {
            const stored = localStorage.getItem(LOCAL_KEYS.USER);
            if (!stored) return null;
            const user = JSON.parse(stored) as UserProfile;
            return user.email === email ? user : null;
        } catch (e) { return null; }
    },
    saveUser: (user: UserProfile) => {
        localStorage.setItem(LOCAL_KEYS.USER, JSON.stringify(user));
    },
    getMistakes: (email: string): any[] => {
        try {
            const stored = localStorage.getItem(LOCAL_KEYS.MISTAKES);
            const allMistakes = stored ? JSON.parse(stored) : [];
            return allMistakes.filter((m: any) => m.userEmail === email);
        } catch (e) { return []; }
    },
    addMistake: (email: string, mistake: any) => {
        const stored = localStorage.getItem(LOCAL_KEYS.MISTAKES);
        const allMistakes = stored ? JSON.parse(stored) : [];
        allMistakes.push({ ...mistake, userEmail: email });
        localStorage.setItem(LOCAL_KEYS.MISTAKES, JSON.stringify(allMistakes));
    },
    removeMistake: (uniqueId: string) => {
        const stored = localStorage.getItem(LOCAL_KEYS.MISTAKES);
        if (!stored) return;
        const allMistakes = JSON.parse(stored);
        const filtered = allMistakes.filter((m: any) => m.uniqueId !== uniqueId);
        localStorage.setItem(LOCAL_KEYS.MISTAKES, JSON.stringify(filtered));
    }
};

export const db = {
  
  async getUser(email: string): Promise<UserProfile | null> {
    // 1. Try Firebase
    if (dbInstance) {
        try {
            const docRef = doc(dbInstance, "users", email);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const userData = docSnap.data() as UserProfile;
                // Sync to local
                localDB.saveUser(userData);
                return userData;
            }
        } catch (e) {
            console.warn("Firebase getUser failed, falling back to local.");
        }
    }
    // 2. Fallback to Local
    return localDB.getUser(email);
  },

  async createUser(profile: UserProfile): Promise<UserProfile> {
    // Always save local first for speed
    localDB.saveUser(profile);

    if (dbInstance) {
        try {
            await setDoc(doc(dbInstance, "users", profile.email), profile);
        } catch (e) {
            console.warn("Firebase createUser failed (Data saved locally only).");
        }
    }
    return profile;
  },

  async updateUser(profile: UserProfile): Promise<void> {
    localDB.saveUser(profile);
    
    if (dbInstance) {
        try {
            const userRef = doc(dbInstance, "users", profile.email);
            await updateDoc(userRef, { ...profile });
        } catch (e) {
             console.warn("Firebase updateUser failed (Data saved locally).");
        }
    }
  },

  async getMistakes(userEmail: string): Promise<(WorksheetItem & { uniqueId: string })[]> {
    let items: any[] = [];
    
    // 1. Try Firebase
    if (dbInstance) {
        try {
            const q = query(collection(dbInstance, "mistakes"), where("userEmail", "==", userEmail));
            const querySnapshot = await getDocs(q);
            querySnapshot.forEach((doc) => {
                items.push(doc.data());
            });
        } catch (e) {
            console.warn("Firebase getMistakes failed, using local backup.");
            items = localDB.getMistakes(userEmail);
        }
    } else {
        items = localDB.getMistakes(userEmail);
    }

    // Sort by date added (newest first)
    return items.sort((a, b) => (b.dateAdded || "").localeCompare(a.dateAdded || ""));
  },

  async addMistake(userEmail: string, mistake: WorksheetItem & { uniqueId: string }): Promise<void> {
    // Optimistic Local Save
    localDB.addMistake(userEmail, mistake);

    if (dbInstance) {
        try {
            await addDoc(collection(dbInstance, "mistakes"), { ...mistake, userEmail });
        } catch (e) {
            console.warn("Firebase addMistake failed (Data saved locally).");
        }
    }
  },

  async removeMistake(uniqueId: string): Promise<void> {
    // Optimistic Local Remove
    localDB.removeMistake(uniqueId);

    if (dbInstance) {
        try {
            const q = query(collection(dbInstance, "mistakes"), where("uniqueId", "==", uniqueId));
            const querySnapshot = await getDocs(q);
            const deletePromises: Promise<void>[] = [];
            querySnapshot.forEach((doc) => {
                deletePromises.push(deleteDoc(doc.ref));
            });
            await Promise.all(deletePromises);
        } catch (e) {
            console.warn("Firebase removeMistake failed (Data removed locally).");
        }
    }
  }
};
