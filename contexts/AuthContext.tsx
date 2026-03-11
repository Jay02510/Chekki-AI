
import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, SubscriptionRecord, SubscriptionPlatform } from '../types';
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
import { subscriptionService, AppleProducts } from '../services/subscriptionService';

interface AuthContextType {
  user: UserProfile | null;
  firebaseUser: User | null;
  subscriptionRecord: SubscriptionRecord | null;
  signUp: (name: string, email: string, pass: string, code?: string) => Promise<void>;
  signIn: (email: string, pass: string) => Promise<void>;
  sendResetEmail: (email: string) => Promise<void>;
  logout: () => void;
  updateProfile: (name: string) => Promise<void>;
  deleteAccount: () => Promise<void>;
  incrementScan: () => Promise<boolean>;
  checkScanLimit: () => boolean;
  upgradeToPro: (code?: string) => Promise<boolean>;
  processPayment: (productId?: string) => Promise<{ success: boolean; message?: string }>;
  restorePurchases: () => Promise<{ success: boolean; message?: string }>;
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
const BETA_CODE_LIMIT = 9999;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [subscriptionRecord, setSubscriptionRecord] = useState<SubscriptionRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showPaywall, setShowPaywall] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        const profile = await db.getUser(user.uid);
        let finalProfile = profile;
        let hasActiveAppStoreSub = false;

        // --- Unified subscription check via backend ---
        try {
          const idToken = await user.getIdToken();

          // Race the subscription check against a 10s timeout to prevent hangs on simulator
          const subCheckTimeout = new Promise<SubscriptionRecord | null>((resolve) => setTimeout(() => resolve(null), 10000));
          const subRecord = await Promise.race([
            subscriptionService.initialize(user.uid, idToken) as Promise<SubscriptionRecord | null>,
            subCheckTimeout
          ]);

            if (subRecord) {
            setSubscriptionRecord(subRecord);

            const isSubActive = subRecord.subscription_status === 'active';
            hasActiveAppStoreSub = isSubActive;

            if (profile) {
              if (isSubActive && profile.plan !== 'pro') {
                finalProfile = { ...profile, plan: 'pro', maxScansPerDay: 9999, subscriptionPlatform: subRecord.subscription_platform };
                await updateDoc(doc(dbInstance, 'users', user.uid), {
                  plan: 'pro',
                  maxScansPerDay: 9999,
                });
              } else if (!isSubActive && profile.plan === 'pro' && subRecord.subscription_status === 'expired') {
                // Subscription expired — show renewal prompt
                setShowPaywall(true);
              }
              if (subRecord.subscription_platform !== 'none') {
                finalProfile = { ...(finalProfile || profile!), subscriptionPlatform: subRecord.subscription_platform };
              }
            }
          }
          // If subRecord is null (timeout), we continue with the existing profile — no crash
        } catch {
          // Subscription check failed — fallback to existing profile state
        }

        // --- Manual Expiration Check (Admin Provisioned) ---
        if (finalProfile?.plan === 'pro' && finalProfile.nextBillingDate) {
          const expirationMs = new Date(finalProfile.nextBillingDate).getTime();
          const nowMs = Date.now();
          
          if (nowMs > expirationMs && !hasActiveAppStoreSub) {
             finalProfile = { ...finalProfile, plan: 'free', maxScansPerDay: FREE_DAILY_LIMIT };
             await updateDoc(doc(dbInstance, 'users', user.uid), {
               plan: 'free',
               maxScansPerDay: FREE_DAILY_LIMIT
             });
             setShowPaywall(true);
          }
        }

        setUserProfile(finalProfile);

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
        setSubscriptionRecord(null);
        subscriptionService.clearCache();
        localStorage.removeItem('chekki_last_auth');
      }
      setIsLoading(false);
    });
    return unsubscribe;
  }, []);

  const signUp = async (name: string, email: string, pass: string, code?: string) => {
    try {
      const res = await createUserWithEmailAndPassword(auth, email, pass);

      let plan: 'free' | 'pro' = 'free';
      let maxScans = FREE_DAILY_LIMIT;
      let schoolId: string | null = null;
      let schoolName: string | null = null;
      let subscriptionStartedAt: string | null = null;
      let nextBillingDate: string | null = null;

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
    } catch (err: any) {
      console.error('Signup error details:', err);
      throw err;
    }
  };

  const signIn = async (email: string, pass: string) => {
    // 🍎 Apple Review Demo Account Bypass
    if (email === 'test@example.com' && pass === 'Test123') {
      const demoProfile: UserProfile = {
        name: 'Apple Reviewer',
        email: 'test@example.com',
        plan: 'pro',
        scansUsedToday: 0,
        lastScanDate: new Date().toISOString().split('T')[0],
        maxScansPerDay: 9999
      };
      setUserProfile(demoProfile);
      setShowLoginModal(false);
      localStorage.setItem('chekki_last_auth', Date.now().toString());
      return;
    }

    // 🍎 Apple Review Demo Account Bypass (Expired)
    if (email === 'expired@example.com' && pass === 'Test123') {
      const expiredProfile: UserProfile = {
        name: 'Apple Reviewer (Expired)',
        email: 'expired@example.com',
        plan: 'free',
        scansUsedToday: 0,
        lastScanDate: new Date().toISOString().split('T')[0],
        maxScansPerDay: 3
      };

      const expiredRecord: SubscriptionRecord = {
        user_id: 'demo-expired-uid',
        subscription_status: 'expired',
        subscription_platform: 'apple',
        subscription_expiry_date: new Date().toISOString()
      };

      setUserProfile(expiredProfile);
      setSubscriptionRecord(expiredRecord);
      setShowPaywall(true); // Force paywall for expired account
      setShowLoginModal(false);
      localStorage.setItem('chekki_last_auth', Date.now().toString());
      return;
    }

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

  const logout = () => {
    if (userProfile?.email === 'test@example.com' || userProfile?.email === 'expired@example.com') {
      setUserProfile(null);
      setSubscriptionRecord(null);
      subscriptionService.clearCache();
      localStorage.removeItem('chekki_last_auth');
      return;
    }
    subscriptionService.clearCache();
    signOut(auth);
  };

  const updateProfile = async (name: string) => {
    if (userProfile?.email === 'test@example.com' || userProfile?.email === 'expired@example.com') {
      setUserProfile({ ...userProfile, name });
      return;
    }
    if (!firebaseUser || !userProfile) return;
    setUserProfile({ ...userProfile, name });
    await db.updateUser(firebaseUser.uid, { name });
  };

  const deleteAccount = async () => {
    if (!firebaseUser) return;
    try {
      await db.updateUser(firebaseUser.uid, { name: 'Deleted User' });
      await deleteUser(firebaseUser);
    } catch (e: any) {
      console.error('Account deletion error:', e);
      // If re-authentication is needed, Firebase will throw 'auth/requires-recent-login'
      if (e.code === 'auth/requires-recent-login') {
        throw new Error("Sensitive operation. Please log out and log back in before deleting your account.");
      }
      throw e;
    } finally {
      setUserProfile(null);
      setFirebaseUser(null);
      setSubscriptionRecord(null);
      subscriptionService.clearCache();
    }
  };

  const checkScanLimit = (): boolean => {
    if (!userProfile || userProfile.plan === 'pro') return true;

    const today = new Date().toISOString().split('T')[0];
    const isNewDay = userProfile.lastScanDate !== today;

    const currentScans = isNewDay ? 0 : userProfile.scansUsedToday;
    const limit = userProfile.maxScansPerDay || FREE_DAILY_LIMIT;

    if (currentScans >= limit) {
      setShowPaywall(true);
      return false;
    }
    return true;
  };

  const incrementScan = async (): Promise<boolean> => {
    if (!firebaseUser || !userProfile) return true;

    const today = new Date().toISOString().split('T')[0];
    const isNewDay = userProfile.lastScanDate !== today;

    const userRef = doc(dbInstance, 'users', firebaseUser.uid);
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
    if (userProfile?.email === 'test@example.com' || userProfile?.email === 'expired@example.com') {
      setUserProfile({ ...userProfile, isCanceled: true });
      return;
    }
    if (!firebaseUser || !userProfile) return;
    const updates: Partial<UserProfile> = { isCanceled: true };
    setUserProfile({ ...userProfile, ...updates });
    await db.updateUser(firebaseUser.uid, updates);
  };

  const requestLimitReset = async (reason: string): Promise<boolean> => {
    if (!firebaseUser) return false;
    try {
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

      if (sanitizedCode !== BETA_CODE_MAIN) return false;

      const canRedeem = await db.redeemBetaCode(sanitizedCode, BETA_CODE_LIMIT);
      if (!canRedeem) return false;
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

  // Platform-aware payment: delegates to subscriptionService
  const processPayment = async (productId: string = AppleProducts.MONTHLY): Promise<{ success: boolean; message?: string }> => {
    const isDemo = ['test@example.com', 'expired@example.com'].includes(userProfile?.email || '');
    if (!isDemo && (!firebaseUser || !userProfile)) {
      return { success: false, message: 'Please log in to subscribe.' };
    }

    const idToken = isDemo ? 'demo-token' : await firebaseUser!.getIdToken();
    const response = await subscriptionService.purchase(productId, firebaseUser?.uid || 'demo-uid', idToken);

    if (response.success) {
      const upgraded = await upgradeToPro();
      const newSubRecord = subscriptionService.getStatus();
      if (newSubRecord) setSubscriptionRecord(newSubRecord);
      if (upgraded) return { success: true };
      return { success: false, message: 'Payment succeeded but profile update failed. Please contact support.' };
    }

    return { success: false, message: response.error?.message || 'An error occurred during payment.' };
  };

  const restorePurchases = async (): Promise<{ success: boolean; message?: string }> => {
    if (!firebaseUser) return { success: false, message: 'Not logged in.' };

    const res = await subscriptionService.restorePurchases(firebaseUser.uid);
    if (res.success && userProfile?.plan !== 'pro') {
      await upgradeToPro();
      const newSubRecord = subscriptionService.getStatus();
      if (newSubRecord) setSubscriptionRecord(newSubRecord);
    }
    return res;
  };

  const openLoginModal = () => setShowLoginModal(true);
  const closeLoginModal = () => setShowLoginModal(false);

  return (
    <AuthContext.Provider value={{
      user: userProfile,
      firebaseUser,
      subscriptionRecord,
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
      restorePurchases,
      joinSchool,
      cancelSubscription,
      requestLimitReset,
      isAuthenticated: !!firebaseUser || ['test@example.com', 'expired@example.com'].includes(userProfile?.email || ''),
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
