
import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, SubscriptionRecord, SubscriptionPlatform } from '../types';
import { auth, db, dbInstance } from '../services/database';
import { doc, updateDoc, increment } from 'firebase/firestore';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously,
  signOut,
  deleteUser,
  sendPasswordResetEmail,
  type User
} from 'firebase/auth';
import { subscriptionService, AppleProducts } from '../services/subscriptionService';
import { revenueCatService } from '../services/revenueCatService';
import { PUBLIC_APP_URL } from '../config';

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
  checkQuestionLimit: () => boolean;
  incrementQuestion: () => Promise<boolean>;
  upgradeToPro: (code?: string) => Promise<boolean>;
  processPayment: (product?: any) => Promise<{ success: boolean; message?: string }>;
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
  updateChildProfile: (childAge: string, childEnglishLevel: string, parentEnglishLevel: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const FREE_DAILY_LIMIT = 3;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [subscriptionRecord, setSubscriptionRecord] = useState<SubscriptionRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showPaywall, setShowPaywall] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  // Flag to prevent onAuthStateChanged from wiping the profile during signup
  const isSigningUpRef = React.useRef(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        // Identify in RevenueCat
        revenueCatService.identify(user.uid);

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
                finalProfile = { ...profile, plan: 'pro', maxScansPerDay: 9999, maxQuestionsPerDay: 9999, subscriptionPlatform: subRecord.subscription_platform };
                await updateDoc(doc(dbInstance, 'users', user.uid), {
                  plan: 'pro',
                  maxScansPerDay: 9999,
                  maxQuestionsPerDay: 9999
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

        // --- Demo Account Override ---
        if (user.email === 'test@example.com') {
          finalProfile = {
            ...(finalProfile || {} as UserProfile),
            email: 'test@example.com',
            name: 'Reviewer',
            plan: 'pro',
            maxScansPerDay: 9999,
            maxQuestionsPerDay: 9999,
          };
        } else if (user.email === 'expired@example.com') {
          finalProfile = {
            ...(finalProfile || {} as UserProfile),
            email: 'expired@example.com',
            name: 'Reviewer (Expired)',
            plan: 'free',
            maxScansPerDay: 3,
            maxQuestionsPerDay: 2
          };
          if (!hasActiveAppStoreSub) {
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
        // If we are in the middle of signing up, a transient null user fires here.
        // Skip wiping state to avoid a race condition where the new profile gets cleared.
        if (isSigningUpRef.current) {
          setIsLoading(false);
          return;
        }
        setUserProfile(null);
        setSubscriptionRecord(null);
        subscriptionService.clearCache();
        localStorage.removeItem('chekki_last_auth');

        // --- GUEST AUTH: Ensure every session has a token ---
        try {
          await signInAnonymously(auth);
          // onAuthStateChanged will fire again with the new anon user — return here
          // so we don't call setIsLoading(false) twice.
          return;
        } catch (err) {
          console.error("[AuthContext] Anonymous sign-in failed:", err);
        }
      }
      setIsLoading(false);
    });
    return unsubscribe;
  }, []);

  const signUp = async (name: string, email: string, pass: string, code?: string) => {
    isSigningUpRef.current = true;
    try {
      const cleanEmail = email.toLowerCase().trim();
      const cleanPass = pass.trim();
      const res = await createUserWithEmailAndPassword(auth, cleanEmail, cleanPass);

      let plan: 'free' | 'pro' = 'free';
      let maxScans = FREE_DAILY_LIMIT;
      let schoolId: string | null = null;
      let schoolName: string | null = null;
      const subscriptionStartedAt: string | null = null;
      const nextBillingDate: string | null = null;

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
        }
      }

      const newProfile: UserProfile = {
        name,
        email: email.toLowerCase().trim(),
        plan,
        scansUsedToday: 0,
        lastScanDate: new Date().toISOString().split('T')[0],
        maxScansPerDay: maxScans,
        questionsUsedToday: 0,
        maxQuestionsPerDay: plan === 'pro' ? 9999 : 2,
        lastQuestionDate: new Date().toISOString().split('T')[0],
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
    } finally {
      isSigningUpRef.current = false;
    }
  };

  const signIn = async (email: string, pass: string) => {
    const cleanEmail = email.toLowerCase().trim();
    const cleanPass = pass.trim();

    // 🍎 Apple Review Demo Account Bypass (Expired)
    // For demo accounts, we still authenticate with Firebase (e.g., anonymous or specific demo user)
    // but override the UI state in onAuthStateChanged for consistent demo experience.
    // We set these here to ensure they are ready before onAuthStateChanged fully processes.
    if (cleanEmail === 'expired@example.com' && cleanPass === 'Test123') {
      const expiredRecord: SubscriptionRecord = {
        user_id: 'demo-expired-uid', // This will be replaced by actual UID in onAuthStateChanged
        subscription_status: 'expired',
        subscription_platform: 'apple',
        subscription_expiry_date: new Date().toISOString()
      };
      setSubscriptionRecord(expiredRecord);
      setShowPaywall(true); // Force paywall for expired account
    }

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Login timed out. Please check your internet connection and try again.')), 15000);
    });

    const signInFlow = async () => {
      await signInWithEmailAndPassword(auth, cleanEmail, cleanPass);
      localStorage.setItem('chekki_last_auth', Date.now().toString());
      setShowLoginModal(false);
    };

    await Promise.race([signInFlow(), timeoutPromise]);
  };

  const sendResetEmail = async (email: string) => {
    // ActionCodeSettings ensures the recovery email contains a trusted redirect URL.
    // This helps prevent emails from being marked as spam and redirects the user back to the app.
    const actionCodeSettings = {
      url: `${PUBLIC_APP_URL}/?auth_action=reset`,
      handleCodeInApp: false,
    };
    await sendPasswordResetEmail(auth, email.toLowerCase().trim(), actionCodeSettings);
  };

  const logout = () => {
    subscriptionService.clearCache();
    revenueCatService.logout();
    signOut(auth);
    localStorage.removeItem('chekki_last_auth');
    setUserProfile(null);
    setSubscriptionRecord(null);
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

  const updateChildProfile = async (childAge: string, childEnglishLevel: string, parentEnglishLevel: string) => {
    if (userProfile?.email === 'test@example.com' || userProfile?.email === 'expired@example.com') {
      setUserProfile({ ...userProfile, childAge, childEnglishLevel, parentEnglishLevel });
      return;
    }
    if (!firebaseUser || !userProfile) return;
    const updates = { childAge, childEnglishLevel, parentEnglishLevel };
    setUserProfile({ ...userProfile, ...updates });
    await db.updateUser(firebaseUser.uid, updates);
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
    try {
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

  const checkQuestionLimit = (): boolean => {
    if (!userProfile || userProfile.plan === 'pro') return true;
    const today = new Date().toISOString().split('T')[0];
    const isNewDay = userProfile.lastQuestionDate !== today;
    const currentQuestions = isNewDay ? 0 : userProfile.questionsUsedToday;
    const limit = userProfile.maxQuestionsPerDay || 2;
    if (currentQuestions >= limit) {
      setShowPaywall(true);
      return false;
    }
    return true;
  };

  const incrementQuestion = async (): Promise<boolean> => {
    if (!firebaseUser || !userProfile) return true;
    const today = new Date().toISOString().split('T')[0];
    const isNewDay = userProfile.lastQuestionDate !== today;
    try {
      setUserProfile(prev => prev ? {
        ...prev,
        questionsUsedToday: isNewDay ? 1 : prev.questionsUsedToday + 1,
        lastQuestionDate: today
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
    }

    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    const updates: Partial<UserProfile> = {
      plan: 'pro',
      maxScansPerDay: 9999,
      maxQuestionsPerDay: 9999,
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
  const processPayment = async (product: any = AppleProducts.MONTHLY): Promise<{ success: boolean; message?: string }> => {
    const isDemo = ['test@example.com', 'expired@example.com'].includes(userProfile?.email || '');
    if (!isDemo && (!firebaseUser || !userProfile)) {
      return { success: false, message: 'Please log in to subscribe.' };
    }

    const idToken = isDemo ? 'demo-token' : await firebaseUser!.getIdToken();
    const response = await subscriptionService.purchase(product, firebaseUser?.uid || 'demo-uid', idToken);

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
      checkQuestionLimit,
      incrementQuestion,
      upgradeToPro,
      processPayment,
      restorePurchases,
      joinSchool,
      cancelSubscription,
      requestLimitReset,
      isAuthenticated: !!userProfile,
      isLoading,
      showPaywall,
      setShowPaywall,
      showLoginModal,
      openLoginModal,
      closeLoginModal,
      updateChildProfile
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
