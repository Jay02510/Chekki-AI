import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { auth, db, dbInstance } from '../services/database';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  deleteUser,
  sendPasswordResetEmail,
  type User
} from 'firebase/auth';

interface AuthContextType {
  user: UserProfile | null;
  firebaseUser: User | null;
  signUp: (name: string, email: string, pass: string, code?: string) => Promise<void>;
  signIn: (email: string, pass: string) => Promise<void>;
  sendResetEmail: (email: string) => Promise<void>;
  logout: () => void;
  updateProfile: (name: string) => Promise<void>;
  deleteAccount: () => Promise<void>;
  incrementScan: () => Promise<boolean>;
  upgradeToPro: (code?: string) => Promise<boolean>;
  joinSchool: (schoolCode: string) => Promise<boolean>;
  cancelSubscription: () => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
  showPaywall: boolean;
  setShowPaywall: (show: boolean) => void;
  showLoginModal: boolean;
  openLoginModal: () => void;
  closeLoginModal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const GUEST_LIMIT = 1;
const BETA_CODE_MAIN = 'CHEKKI40';
const BETA_CODE_LIMIT = 40;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showPaywall, setShowPaywall] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        const profile = await db.getUser(user.uid);
        setUserProfile(profile);
      } else {
        setUserProfile(null);
      }
      setIsLoading(false);
    });
    return unsubscribe;
  }, []);

  const signUp = async (name: string, email: string, pass: string, code?: string) => {
    const res = await createUserWithEmailAndPassword(auth, email, pass);
    
    let plan: 'free' | 'pro' = 'free';
    let maxScans = 9999; // Members get unlimited basic magic scans
    let schoolId: string | undefined;
    let schoolName: string | undefined;
    let subscriptionStartedAt: string | undefined;

    if (code) {
      const sanitized = code.toUpperCase().trim();
      const schools: Record<string, string> = {
          'POLY10': 'Poly Academy Seocho',
          'GATE05': 'GATE Academy Bundang',
          'ECC99': 'YBM ECC Gangnam'
      };

      if (schools[sanitized]) {
        plan = 'pro';
        schoolId = sanitized;
        schoolName = schools[sanitized];
      } else if (sanitized === BETA_CODE_MAIN) {
        const canRedeem = await db.redeemBetaCode(sanitized, BETA_CODE_LIMIT);
        if (canRedeem) {
            plan = 'pro';
            subscriptionStartedAt = new Date().toISOString();
        }
      }
    }

    const newProfile: UserProfile = {
      name,
      email,
      plan,
      scansUsedToday: 0,
      lastScanDate: new Date().toISOString().split('T')[0],
      maxScansPerDay: maxScans,
      schoolId,
      schoolName,
      subscriptionStartedAt
    };

    await db.createUser(res.user.uid, newProfile);
    setUserProfile(newProfile);
    setShowLoginModal(false);
  };

  const signIn = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email, pass);
    setShowLoginModal(false);
  };

  const sendResetEmail = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const logout = () => signOut(auth);

  const updateProfile = async (name: string) => {
    if (!firebaseUser || !userProfile) return;
    const updates = { name };
    setUserProfile({ ...userProfile, ...updates });
    await db.updateUser(firebaseUser.uid, updates);
  };

  const deleteAccount = async () => {
    if (!firebaseUser) return;
    await db.updateUser(firebaseUser.uid, { name: 'Deleted User' });
    await deleteUser(firebaseUser);
    setUserProfile(null);
    setFirebaseUser(null);
  };

  const incrementScan = async (): Promise<boolean> => {
    if (!firebaseUser || !userProfile) {
        // Guest logic handled in App.tsx via localStorage
        return true;
    }
    
    // AUTHENTICATED USERS: No limit on "Magic Scans" (Answer Key Overlays)
    // Limits only exist for Guests to drive signup.
    const today = new Date().toISOString().split('T')[0];
    const isNewDay = userProfile.lastScanDate !== today;

    const userRef = doc(dbInstance, "users", firebaseUser.uid);
    const updates = { 
      scansUsedToday: isNewDay ? 1 : increment(1),
      lastScanDate: today
    };
    
    try {
      await updateDoc(userRef, updates);
      setUserProfile(prev => prev ? { 
        ...prev, 
        scansUsedToday: isNewDay ? 1 : prev.scansUsedToday + 1,
        lastScanDate: today
      } : null);
      return true;
    } catch (e) {
      console.error("Failed to increment scan:", e);
      return true; // Don't block user on network failure for analytics
    }
  };

  const cancelSubscription = async () => {
    if (!firebaseUser || !userProfile) return;
  };

  const joinSchool = async (schoolCode: string): Promise<boolean> => {
    if (!firebaseUser || !userProfile) return false;
    
    const sanitized = schoolCode.toUpperCase().trim();
    const schools: Record<string, string> = {
        'POLY10': 'Poly Academy Seocho',
        'GATE05': 'GATE Academy Bundang',
        'ECC99': 'YBM ECC Gangnam'
    };

    if (schools[sanitized]) {
        const updates: Partial<UserProfile> = {
            schoolId: sanitized,
            schoolName: schools[sanitized],
            plan: 'pro'
        };
        setUserProfile({ ...userProfile, ...updates });
        await db.updateUser(firebaseUser.uid, updates);
        return true;
    }
    return false;
  };

  const upgradeToPro = async (code?: string): Promise<boolean> => {
    if (!firebaseUser || !userProfile) return false;

    if (code) {
      const sanitizedCode = code.toUpperCase().trim();
      const isSchool = await joinSchool(sanitizedCode);
      if (isSchool) return true;

      if (sanitizedCode !== BETA_CODE_MAIN) return false;
      
      const canRedeem = await db.redeemBetaCode(sanitizedCode, BETA_CODE_LIMIT);
      if (!canRedeem) return false; 
    } else {
      return false;
    }
    
    const updates: Partial<UserProfile> = { 
      plan: 'pro', 
      subscriptionStartedAt: new Date().toISOString()
    };
    
    setUserProfile({ ...userProfile, ...updates });
    await db.updateUser(firebaseUser.uid, updates);
    setShowPaywall(false);
    return true;
  };

  const openLoginModal = () => setShowLoginModal(true);
  const closeLoginModal = () => setShowLoginModal(false);

  return (
    <AuthContext.Provider value={{ 
      user: userProfile,
      firebaseUser,
      signUp,
      signIn,
      sendResetEmail,
      logout,
      updateProfile,
      deleteAccount,
      incrementScan,
      upgradeToPro,
      joinSchool,
      cancelSubscription,
      isAuthenticated: !!firebaseUser,
      isLoading,
      showPaywall,
      setShowPaywall,
      showLoginModal,
      openLoginModal,
      closeLoginModal
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};