
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
import { requestProSubscription } from '../services/paymentService';

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
  checkScanLimit: () => boolean;
  upgradeToPro: (code?: string) => Promise<boolean>;
  processPayment: () => Promise<{ success: boolean; message?: string }>;
  joinSchool: (schoolCode: string) => Promise<boolean>;
  cancelSubscription: () => Promise<void>;
  requestLimitReset: (reason: string) => Promise<boolean>;
  isAuthenticated: boolean;
  isLoading: boolean;
  showPaywall: boolean;
  setShowPaywall: (show: boolean) => void;
  showLoginModal: boolean;
  openLoginModal: () => void;
  closeLoginModal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const FREE_DAILY_LIMIT = 3;
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

        // Session Expiration Check
        const lastLogin = localStorage.getItem('chekki_last_auth');
        const now = Date.now();
        const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

        if (lastLogin && now - parseInt(lastLogin) > TWENTY_FOUR_HOURS) {
          signOut(auth);
          localStorage.removeItem('chekki_last_auth');
        } else if (!lastLogin) {
          localStorage.setItem('chekki_last_auth', now.toString());
        }
      } else {
        setUserProfile(null);
        localStorage.removeItem('chekki_last_auth');
      }
      setIsLoading(false);
    });
    return unsubscribe;
  }, []);

  const signUp = async (name: string, email: string, pass: string, code?: string) => {
    const res = await createUserWithEmailAndPassword(auth, email, pass);

    let plan: 'free' | 'pro' = 'free';
    let maxScans = FREE_DAILY_LIMIT;
    let schoolId: string | undefined;
    let schoolName: string | undefined;
    let subscriptionStartedAt: string | undefined;
    let nextBillingDate: string | undefined;

    if (code) {
      const sanitized = code.toUpperCase().trim();
      const schools: Record<string, string> = {
        'POLY10': 'Poly Academy Seocho',
        'GATE05': 'GATE Academy Bundang',
        'ECC99': 'YBM ECC Gangnam'
      };

      if (schools[sanitized]) {
        plan = 'pro';
        maxScans = 9999;
        schoolId = sanitized;
        schoolName = schools[sanitized];
      } else if (sanitized === BETA_CODE_MAIN) {
        const canRedeem = await db.redeemBetaCode(sanitized, BETA_CODE_LIMIT);
        if (canRedeem) {
          plan = 'pro';
          maxScans = 9999;
          subscriptionStartedAt = new Date().toISOString();
          const nextMonth = new Date();
          nextMonth.setMonth(nextMonth.getMonth() + 1);
          nextBillingDate = nextMonth.toISOString();
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
      subscriptionStartedAt,
      nextBillingDate
    };

    await db.createUser(res.user.uid, newProfile);
    setUserProfile(newProfile);
    setShowLoginModal(false);
  };

  const signIn = async (email: string, pass: string) => {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Login timed out. Please check your internet connection and try again.')), 15000);
    });

    const signInFlow = async () => {
      await signInWithEmailAndPassword(auth, email, pass);
      localStorage.setItem('chekki_last_auth', Date.now().toString());
      setShowLoginModal(false);
    };

    await Promise.race([signInFlow(), timeoutPromise]);
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

  const checkScanLimit = (): boolean => true;

  const incrementScan = async (): Promise<boolean> => {
    if (!firebaseUser || !userProfile) return true;

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
      return false;
    }
  };

  const cancelSubscription = async () => {
    if (!firebaseUser || !userProfile) return;
    const updates: Partial<UserProfile> = { isCanceled: true };
    setUserProfile({ ...userProfile, ...updates });
    await db.updateUser(firebaseUser.uid, updates);
  };

  const requestLimitReset = async (reason: string): Promise<boolean> => {
    if (!firebaseUser) return false;
    try {
      // Send a high-priority feedback as a "reset request"
      await db.sendFeedback(firebaseUser.uid, {
        comment: `[RESET_REQUEST] ${reason}`,
        userEmail: firebaseUser.email || '',
        userName: userProfile?.name || 'User'
      });
      return true;
    } catch (e) {
      return false;
    }
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
        plan: 'pro',
        maxScansPerDay: 9999
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

      if (sanitizedCode !== BETA_CODE_MAIN) {
        return false;
      }

      const canRedeem = await db.redeemBetaCode(sanitizedCode, BETA_CODE_LIMIT);
      if (!canRedeem) {
        return false;
      }
    }

    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    const updates: Partial<UserProfile> = {
      plan: 'pro',
      maxScansPerDay: 9999,
      subscriptionStartedAt: new Date().toISOString(),
      nextBillingDate: nextMonth.toISOString(),
      isCanceled: false
    };

    setUserProfile({ ...userProfile, ...updates });
    await db.updateUser(firebaseUser.uid, updates);
    setShowPaywall(false);
    return true;
  };

  const processPayment = async (): Promise<{ success: boolean; message?: string }> => {
    if (!firebaseUser || !userProfile) {
      return { success: false, message: "Please log in to subscribe." };
    }

    const response = await requestProSubscription(userProfile.email, userProfile.name);

    if (response.success) {
      const upgraded = await upgradeToPro();
      if (upgraded) {
        return { success: true };
      } else {
        return { success: false, message: "Payment succeeded but profile update failed. Please contact support." };
      }
    }

    return { success: false, message: response.message };
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
      checkScanLimit,
      incrementScan,
      upgradeToPro,
      processPayment,
      joinSchool,
      cancelSubscription,
      requestLimitReset,
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
