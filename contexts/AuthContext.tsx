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
  OAuthProvider,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithCredential,
  signInWithCustomToken,
  type User,
} from 'firebase/auth';
import { Capacitor } from '@capacitor/core';
import { SignInWithApple } from '@capacitor-community/apple-sign-in';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { KakaoLogin } from '@chuseok22/capacitor-kakao-login';
import { InAppReview } from '@capacitor-community/in-app-review';

// --- Nonce helpers for Apple Sign-In ---
// Apple requires a cryptographically random nonce. The SHA-256 hash is sent
// to Apple; the raw value is passed to Firebase for verification.
const generateRawNonce = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => chars[byte % chars.length]).join('');
};

const sha256 = async (plain: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
};
import { subscriptionService, AppleProducts } from '../services/subscriptionService';
import { revenueCatService } from '../services/revenueCatService';
import { PUBLIC_APP_URL, API_BASE_URL } from '../config';

const withTimeout = <T,>(promise: Promise<T>, ms: number, timeoutMsg: string): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(timeoutMsg)), ms)),
  ]);
};

interface AuthContextType {
  user: UserProfile | null;
  firebaseUser: User | null;
  subscriptionRecord: SubscriptionRecord | null;
  signUp: (name: string, email: string, pass: string, code?: string) => Promise<void>;
  signIn: (email: string, pass: string) => Promise<void>;
  signInWithApple: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithKakao: () => Promise<void>;
  sendResetEmail: (email: string) => Promise<void>;
  logout: () => void;
  updateProfile: (name: string) => Promise<void>;
  deleteAccount: () => Promise<void>;
  incrementScan: () => Promise<boolean>;
  checkScanLimit: () => boolean;
  checkQuestionLimit: () => boolean;
  incrementQuestion: () => Promise<boolean>;
  upgradeToPro: (code?: string) => Promise<boolean>;
  processPayment: (
    product?: any
  ) => Promise<{ success: boolean; message?: string; userCancelled?: boolean }>;
  restorePurchases: () => Promise<{ success: boolean; message?: string }>;
  joinSchool: (schoolCode: string) => Promise<boolean>;
  cancelSubscription: () => Promise<void>;
  requestLimitReset: (reason: string) => Promise<boolean>;
  isAuthenticated: boolean;
  isLoading: boolean;
  showPaywall: boolean;
  setShowPaywall: (show: boolean, context?: string | null) => void;
  paywallContext: string | null;
  showLoginModal: boolean;
  openLoginModal: () => void;
  closeLoginModal: () => void;
  updateChildProfile: (
    childAge: string,
    childEnglishLevel: string,
    parentEnglishLevel: string
  ) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const FREE_DAILY_LIMIT = 3;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [subscriptionRecord, setSubscriptionRecord] = useState<SubscriptionRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showPaywall, setShowPaywallState] = useState(false);
  const [paywallContext, setPaywallContext] = useState<string | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const setShowPaywall = (show: boolean, context: string | null = null) => {
    setShowPaywallState(show);
    if (show) {
      setPaywallContext(context);
    } else {
      setPaywallContext(null);
    }
  };
  // Flag to prevent onAuthStateChanged from wiping the profile during signup
  const isSigningUpRef = React.useRef(false);
  const googleAuthInitializedRef = React.useRef(false);

  useEffect(() => {
    if (Capacitor.isNativePlatform() && !googleAuthInitializedRef.current) {
      GoogleAuth.initialize()
        .then(() => {
          googleAuthInitializedRef.current = true;
        })
        .catch((err) => {
          console.error('[AuthContext] Google Auth Initialization Error:', err);
        });
    }
  }, []);

  const fetchAndSetUserProfile = async (user: User, baseProfile: UserProfile | null) => {
    // Identify in RevenueCat
    revenueCatService.identify(user.uid);

    let finalProfile = baseProfile;
    let hasActiveAppStoreSub = false;

    // --- Unified subscription check via backend ---
    try {
      const idToken = await withTimeout(user.getIdToken(), 5000, 'getIdToken timeout');

      // Race the subscription check against a 10s timeout to prevent hangs on simulator
      const subCheckTimeout = new Promise<SubscriptionRecord | null>((resolve) =>
        setTimeout(() => resolve(null), 10000)
      );
      const subRecord = await Promise.race([
        subscriptionService.initialize(user.uid, idToken) as Promise<SubscriptionRecord | null>,
        subCheckTimeout,
      ]);

      if (subRecord) {
        setSubscriptionRecord(subRecord);

        const isSubActive = subRecord.subscription_status === 'active';
        hasActiveAppStoreSub = isSubActive;

        if (baseProfile) {
          if (isSubActive && baseProfile.plan !== 'pro') {
            finalProfile = {
              ...baseProfile,
              plan: 'pro',
              maxScansPerDay: 9999,
              maxQuestionsPerDay: 9999,
              subscriptionPlatform: subRecord.subscription_platform,
            };
          } else if (
            !isSubActive &&
            baseProfile.plan === 'pro' &&
            subRecord.subscription_status === 'expired'
          ) {
            finalProfile = {
              ...baseProfile,
              plan: 'free',
              maxScansPerDay: FREE_DAILY_LIMIT,
              maxQuestionsPerDay: 5,
              subscriptionPlatform: subRecord.subscription_platform,
            };
            setShowPaywall(true);
          }
          if (subRecord.subscription_platform !== 'none') {
            finalProfile = {
              ...(finalProfile || baseProfile!),
              subscriptionPlatform: subRecord.subscription_platform,
            };
          }
        }
      }
    } catch (e) {
      console.error('[AuthContext] Subscription check failed:', e);
    }

    // --- Demo Account Override ---
    if (user.email === 'test@example.com') {
      finalProfile = {
        ...(finalProfile || ({} as UserProfile)),
        email: 'test@example.com',
        name: 'Reviewer',
        plan: 'pro',
        maxScansPerDay: 9999,
        maxQuestionsPerDay: 9999,
      };
    } else if (user.email === 'expired@example.com') {
      finalProfile = {
        ...(finalProfile || ({} as UserProfile)),
        email: 'expired@example.com',
        name: 'Reviewer (Expired)',
        plan: 'free',
        maxScansPerDay: 3,
        maxQuestionsPerDay: 5,
      };
      if (!hasActiveAppStoreSub) {
        setShowPaywall(true);
      }
    }

    setUserProfile(finalProfile);
    return finalProfile;
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        let profile: UserProfile | null = null;
        try {
          profile = await db.getUser(user.uid);
        } catch (e) {
          console.error('[AuthContext] Failed to load user profile:', e);
          setIsLoading(false);
          return;
        }

        if (profile) {
          await fetchAndSetUserProfile(user, profile);
        } else {
          // If the profile is null and we are not in the middle of a signup, set to null.
          // Otherwise, the signup/social sign-in helper will create the profile and set it.
          if (!isSigningUpRef.current) {
            setUserProfile(null);
          }
        }

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
          await withTimeout(signInAnonymously(auth), 5000, 'signInAnonymously timeout');
          // onAuthStateChanged will fire again with the new anon user — return here
          // so we don't call setIsLoading(false) twice.
          return;
        } catch (err) {
          console.error('[AuthContext] Anonymous sign-in failed or timed out:', err);
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

      const newProfile: UserProfile = {
        name,
        email: email.toLowerCase().trim(),
        plan: 'free',
        scansUsedToday: 0,
        lastScanDate: new Date().toISOString().split('T')[0],
        maxScansPerDay: FREE_DAILY_LIMIT,
        questionsUsedToday: 0,
        maxQuestionsPerDay: 5,
        lastQuestionDate: new Date().toISOString().split('T')[0],
        schoolId: null,
        schoolName: null,
        subscriptionStartedAt: null,
        nextBillingDate: null,
      };

      await db.createUser(res.user.uid, newProfile);
      let activeProfile = newProfile;

      if (code) {
        try {
          const idToken = await res.user.getIdToken();
          const redeemRes = await fetch(`${API_BASE_URL}/api/redeem-school-code`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${idToken}`,
            },
            body: JSON.stringify({ schoolCode: code }),
          });
          if (redeemRes.ok) {
            const data = await redeemRes.json();
            if (data.success) {
              activeProfile = {
                ...newProfile,
                plan: 'pro',
                maxScansPerDay: 9999,
                maxQuestionsPerDay: 9999,
                schoolId: code.toUpperCase().trim(),
                schoolName: data.schoolName,
                subscriptionPlatform: 'school_code',
              };
            }
          } else {
            console.error('Failed to redeem school code during signup');
          }
        } catch (redeemErr) {
          console.error('Error redeeming school code during signup:', redeemErr);
        }
      }

      await fetchAndSetUserProfile(res.user, activeProfile);
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
        subscription_expiry_date: new Date().toISOString(),
      };
      setSubscriptionRecord(expiredRecord);
      setShowPaywall(true); // Force paywall for expired account
    }

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(
        () =>
          reject(
            new Error('Login timed out. Please check your internet connection and try again.')
          ),
        15000
      );
    });

    const signInFlow = async () => {
      await signInWithEmailAndPassword(auth, cleanEmail, cleanPass);
      localStorage.setItem('chekki_last_auth', Date.now().toString());
      setShowLoginModal(false);
    };

    await Promise.race([signInFlow(), timeoutPromise]);
  };
  const signInWithApple = async () => {
    try {
      isSigningUpRef.current = true;
      const provider = new OAuthProvider('apple.com');

      if (Capacitor.getPlatform() === 'ios') {
        // NATIVE IOS FLOW
        const rawNonce = generateRawNonce();
        const hashedNonce = await sha256(rawNonce);

        const options = {
          clientId: 'com.chekkiai.app',
          redirectURI: 'https://homework-assistant-c00b9.firebaseapp.com/__/auth/handler',
          scopes: 'email name',
          state: generateRawNonce(),
          nonce: hashedNonce,
        };

        const result = await SignInWithApple.authorize(options);

        if (result.response && result.response.identityToken) {
          const credential = provider.credential({
            idToken: result.response.identityToken,
            rawNonce: rawNonce,
          });

          try {
            const authResult = await signInWithCredential(auth, credential);

            if (authResult.user) {
              const existingProfile = await db.getUser(authResult.user.uid);
              if (!existingProfile) {
                const name = result.response.givenName
                  ? `${result.response.givenName} ${result.response.familyName || ''}`.trim()
                  : 'User';
                const email = result.response.email || authResult.user.email || '';

                const newProfile: UserProfile = {
                  name: name || 'User',
                  email: email,
                  plan: 'free',
                  scansUsedToday: 0,
                  lastScanDate: new Date().toISOString().split('T')[0],
                  maxScansPerDay: FREE_DAILY_LIMIT,
                  questionsUsedToday: 0,
                  maxQuestionsPerDay: 5,
                  lastQuestionDate: new Date().toISOString().split('T')[0],
                  schoolId: null,
                  schoolName: null,
                  subscriptionStartedAt: null,
                  nextBillingDate: null,
                };
                await db.createUser(authResult.user.uid, newProfile);
                await fetchAndSetUserProfile(authResult.user, newProfile);
              } else {
                await fetchAndSetUserProfile(authResult.user, existingProfile);
              }
            }
          } catch (firebaseErr: any) {
            console.error('[AuthContext] Firebase Apple Sign-In Credential Error:', firebaseErr);
            throw new Error(`Firebase Auth Error: ${firebaseErr.code || firebaseErr.message}`);
          }
          setShowLoginModal(false);
        } else {
          throw new Error('Apple Sign-In returned no identity token.');
        }
      } else {
        // WEB / ANDROID FLOW
        const result = await signInWithPopup(auth, provider);
        if (result.user) {
          const existingProfile = await db.getUser(result.user.uid);
          if (!existingProfile) {
            const name = result.user.displayName || 'User';
            const email = result.user.email || '';

            const newProfile: UserProfile = {
              name: name,
              email: email,
              plan: 'free',
              scansUsedToday: 0,
              lastScanDate: new Date().toISOString().split('T')[0],
              maxScansPerDay: FREE_DAILY_LIMIT,
              questionsUsedToday: 0,
              maxQuestionsPerDay: 5,
              lastQuestionDate: new Date().toISOString().split('T')[0],
              schoolId: null,
              schoolName: null,
              subscriptionStartedAt: null,
              nextBillingDate: null,
            };
            await db.createUser(result.user.uid, newProfile);
            await fetchAndSetUserProfile(result.user, newProfile);
          } else {
            await fetchAndSetUserProfile(result.user, existingProfile);
          }
        }
        setShowLoginModal(false);
      }
    } catch (err: any) {
      console.error('Apple Sign-In Error:', err);
      // Ensure we pass the original error code if it's a Firebase error
      throw err;
    } finally {
      isSigningUpRef.current = false;
    }
  };

  const signInWithGoogle = async () => {
    try {
      isSigningUpRef.current = true;
      const provider = new GoogleAuthProvider();

      if (Capacitor.isNativePlatform()) {
        try {
          if (!googleAuthInitializedRef.current) {
            await GoogleAuth.initialize();
            googleAuthInitializedRef.current = true;
          }
          const googleUser = await GoogleAuth.signIn();
          if (googleUser && googleUser.authentication && googleUser.authentication.idToken) {
            const credential = GoogleAuthProvider.credential(googleUser.authentication.idToken);
            const result = await signInWithCredential(auth, credential);

            if (result.user) {
              const existingProfile = await db.getUser(result.user.uid);
              if (!existingProfile) {
                const newProfile: UserProfile = {
                  name: googleUser.name || result.user.displayName || 'User',
                  email: googleUser.email || result.user.email || '',
                  plan: 'free',
                  scansUsedToday: 0,
                  lastScanDate: new Date().toISOString().split('T')[0],
                  maxScansPerDay: FREE_DAILY_LIMIT,
                  questionsUsedToday: 0,
                  maxQuestionsPerDay: 5,
                  lastQuestionDate: new Date().toISOString().split('T')[0],
                  schoolId: null,
                  schoolName: null,
                  subscriptionStartedAt: null,
                  nextBillingDate: null,
                };
                await db.createUser(result.user.uid, newProfile);
                await fetchAndSetUserProfile(result.user, newProfile);
              } else {
                await fetchAndSetUserProfile(result.user, existingProfile);
              }
            }
            setShowLoginModal(false);
            return;
          }
        } catch (e: any) {
          console.error('Native Google Auth Error:', e);
          const errorMsg = e.message || (typeof e === 'string' ? e : JSON.stringify(e));
          if (
            errorMsg &&
            (errorMsg.toLowerCase().includes('cancel') ||
              errorMsg.includes('12501') ||
              errorMsg.includes('cancelsignin'))
          )
            return;
          throw new Error(`Native Google Sign-In failed: ${errorMsg}`);
        }
      }

      // Add custom parameters to ensure a fresh login experience
      provider.setCustomParameters({
        prompt: 'select_account',
      });

      // On mobile, popups can be blocked or cause argument-errors.
      // We use the standard popup but with extra error handling.
      const result = await signInWithPopup(auth, provider);

      if (result.user) {
        const existingProfile = await db.getUser(result.user.uid);
        if (!existingProfile) {
          const newProfile: UserProfile = {
            name: result.user.displayName || 'User',
            email: result.user.email || '',
            plan: 'free',
            scansUsedToday: 0,
            lastScanDate: new Date().toISOString().split('T')[0],
            maxScansPerDay: FREE_DAILY_LIMIT,
            questionsUsedToday: 0,
            maxQuestionsPerDay: 5,
            lastQuestionDate: new Date().toISOString().split('T')[0],
            schoolId: null,
            schoolName: null,
            subscriptionStartedAt: null,
            nextBillingDate: null,
          };
          await db.createUser(result.user.uid, newProfile);
          await fetchAndSetUserProfile(result.user, newProfile);
        } else {
          await fetchAndSetUserProfile(result.user, existingProfile);
        }
      }
      setShowLoginModal(false);
    } catch (err: any) {
      console.error('Google Sign-In Technical Error:', err);
      // If it's the specific mobile popup error, give a clear instruction
      if (err.code === 'auth/argument-error' || err.code === 'auth/internal-error') {
        throw new Error('Login interrupted. Please try again or use email login.');
      }
      throw err;
    } finally {
      isSigningUpRef.current = false;
    }
  };

  const signInWithKakao = async () => {
    try {
      isSigningUpRef.current = true;

      if (!Capacitor.isNativePlatform()) {
        throw new Error('Kakao login is only supported on Android and iOS devices.');
      }

      const kakaoUser = await KakaoLogin.login();
      if (!kakaoUser.accessToken) {
        throw new Error('Failed to retrieve access token from Kakao login.');
      }

      // Exchange Kakao Access Token for Firebase Custom Token
      const response = await fetch(`${API_BASE_URL}/api/kakao-auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ accessToken: kakaoUser.accessToken }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to authenticate with Kakao on the server.');
      }

      const { customToken } = await response.json();

      // Sign in to Firebase with the Custom Token
      const result = await signInWithCustomToken(auth, customToken);

      if (result.user) {
        const existingProfile = await db.getUser(result.user.uid);
        if (!existingProfile) {
          const newProfile: UserProfile = {
            name: kakaoUser.nickname || result.user.displayName || 'Kakao User',
            email: kakaoUser.email || result.user.email || '',
            plan: 'free',
            scansUsedToday: 0,
            lastScanDate: new Date().toISOString().split('T')[0],
            maxScansPerDay: FREE_DAILY_LIMIT,
            questionsUsedToday: 0,
            maxQuestionsPerDay: 5,
            lastQuestionDate: new Date().toISOString().split('T')[0],
            schoolId: null,
            schoolName: null,
            subscriptionStartedAt: null,
            nextBillingDate: null,
          };
          await db.createUser(result.user.uid, newProfile);
          await fetchAndSetUserProfile(result.user, newProfile);
        } else {
          await fetchAndSetUserProfile(result.user, existingProfile);
        }
      }

      setShowLoginModal(false);
    } catch (err: any) {
      // Capacitor plugin rejects with message="카카오 로그인 실패" and the real
      // native SDK error in err.data or err.errorMessage. Surface the real cause.
      const nativeDetail =
        err?.data?.localizedDescription ||
        err?.data?.debugDescription ||
        err?.errorMessage ||
        err?.data?.message ||
        err?.data ||
        '';

      const wrapperMsg = err?.message || (typeof err === 'string' ? err : '');
      const fullMsg = nativeDetail
        ? `${wrapperMsg} (${typeof nativeDetail === 'string' ? nativeDetail : JSON.stringify(nativeDetail)})`
        : wrapperMsg;

      console.error('[Kakao Sign-In] Error:', err);
      console.error('[Kakao Sign-In] Native detail:', nativeDetail);
      console.error('[Kakao Sign-In] Full message:', fullMsg);

      // Silently swallow user-cancellations
      if (
        fullMsg.toLowerCase().includes('cancel') ||
        fullMsg.includes('12501') ||
        fullMsg.toLowerCase().includes('cancelsignin') ||
        fullMsg.toLowerCase().includes('user cancelled')
      ) {
        return;
      }

      throw new Error(`Kakao Sign-In failed: ${fullMsg}`);
    } finally {
      isSigningUpRef.current = false;
    }
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

  const updateChildProfile = async (
    childAge: string,
    childEnglishLevel: string,
    parentEnglishLevel: string
  ) => {
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
        throw new Error(
          'Sensitive operation. Please log out and log back in before deleting your account.'
        );
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
      setUserProfile((prev) =>
        prev
          ? {
              ...prev,
              scansUsedToday: isNewDay ? 1 : prev.scansUsedToday + 1,
              lastScanDate: today,
            }
          : null
      );

      try {
        const scansCount = parseInt(localStorage.getItem('chekki_total_scans') || '0') + 1;
        localStorage.setItem('chekki_total_scans', scansCount.toString());
        if (scansCount === 3 || scansCount === 10) {
          if (Capacitor.isNativePlatform()) {
            await InAppReview.requestReview();
          }
        }
      } catch (reviewErr) {
        console.error('InAppReview error:', reviewErr);
      }

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
    const limit = userProfile.maxQuestionsPerDay || 5;
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
      setUserProfile((prev) =>
        prev
          ? {
              ...prev,
              questionsUsedToday: isNewDay ? 1 : prev.questionsUsedToday + 1,
              lastQuestionDate: today,
            }
          : null
      );
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
        userName: userProfile?.name || 'User',
      });
      return true;
    } catch (e) {
      return false;
    }
  };

  const joinSchool = async (schoolCode: string): Promise<boolean> => {
    if (!firebaseUser || !userProfile) return false;

    try {
      const idToken = await firebaseUser.getIdToken();
      const response = await fetch(`${PUBLIC_APP_URL}/api/redeem-school-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ schoolCode }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const updates: Partial<UserProfile> = {
            schoolId: schoolCode.toUpperCase().trim(),
            schoolName: data.schoolName,
            plan: 'pro',
            maxScansPerDay: 9999,
            maxQuestionsPerDay: 9999,
            subscriptionPlatform: 'school_code',
          };
          setUserProfile({ ...userProfile, ...updates });
          return true;
        }
      }
      return false;
    } catch (err) {
      console.error('joinSchool error:', err);
      return false;
    }
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
      isCanceled: false,
    };

    setUserProfile({ ...userProfile, ...updates });
    setShowPaywall(false);
    return true;
  };

  // Platform-aware payment: delegates to subscriptionService
  const processPayment = async (
    product: any = AppleProducts.MONTHLY
  ): Promise<{ success: boolean; message?: string; userCancelled?: boolean }> => {
    const isDemo = ['test@example.com', 'expired@example.com'].includes(userProfile?.email || '');
    if (!isDemo && (!firebaseUser || !userProfile)) {
      return { success: false, message: 'Please log in to subscribe.' };
    }

    const idToken = isDemo ? 'demo-token' : await firebaseUser!.getIdToken();
    const response = await subscriptionService.purchase(
      product,
      firebaseUser?.uid || 'demo-uid',
      idToken
    );

    if (response.success) {
      const upgraded = await upgradeToPro();
      const newSubRecord = subscriptionService.getStatus();
      if (newSubRecord) setSubscriptionRecord(newSubRecord);
      if (upgraded) return { success: true };
      return {
        success: false,
        message: 'Payment succeeded but profile update failed. Please contact support.',
      };
    }

    return {
      success: false,
      message: response.error?.message || 'An error occurred during payment.',
      userCancelled: response.userCancelled,
    };
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
    <AuthContext.Provider
      value={{
        user: userProfile,
        firebaseUser,
        subscriptionRecord,
        signUp,
        signIn,
        signInWithApple,
        signInWithGoogle,
        signInWithKakao,
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
        paywallContext,
        showLoginModal,
        openLoginModal,
        closeLoginModal,
        updateChildProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
