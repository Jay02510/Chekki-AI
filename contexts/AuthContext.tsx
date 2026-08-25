import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as Sentry from '@sentry/react';
import { UserProfile, SubscriptionRecord, SubscriptionPlatform } from '../types';
import { auth, db, dbInstance } from '../services/database';
import { doc, updateDoc, increment, arrayRemove, deleteDoc } from 'firebase/firestore';
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
  signInWithRedirect,
  getRedirectResult,
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
  decrementScan: () => void;
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
  updateClassroomProfile: (classId: string, studentName: string) => Promise<void>;
  joinClassWithCode: (classCode: string) => Promise<boolean>;
  redeemClassCodeDetailed: (classCode: string) => Promise<{ success: boolean; schoolName?: string; className?: string; error?: string; wrongAccount?: boolean }>;
  leaveClassroom: () => Promise<void>;
  // A failed Google/Apple redirect sign-in used to only log to console — the
  // user's experience was "I signed in and nothing happened" with no way to
  // know why (Audit: OAuth redirect failure gives no UI feedback). ToastProvider
  // wraps AuthProvider in the tree, not the other way around, so this can't
  // show a toast directly from here — exposed for a consumer that does have
  // toast access (AppContent in App.tsx) to surface.
  redirectAuthError: string | null;
  clearRedirectAuthError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const FREE_DAILY_LIMIT = 2;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [userProfile, _setUserProfile] = useState<UserProfile | null>(null);
  const [redirectAuthError, setRedirectAuthError] = useState<string | null>(null);
  const clearRedirectAuthError = useCallback(() => setRedirectAuthError(null), []);

  const setUserProfile = useCallback(
    (profileOrUpdater: UserProfile | null | ((prev: UserProfile | null) => UserProfile | null)) => {
      _setUserProfile((prev) => {
        let next: UserProfile | null;
        if (typeof profileOrUpdater === 'function') {
          next = profileOrUpdater(prev);
        } else {
          next = profileOrUpdater;
        }

        const uid = auth.currentUser?.uid || firebaseUser?.uid;
        if (uid) {
          if (next) {
            try {
              localStorage.setItem(`chekki_user_profile_${uid}`, JSON.stringify(next));
            } catch (e) {
              console.warn('[AuthContext] Cache set error:', e);
            }
          } else {
            localStorage.removeItem(`chekki_user_profile_${uid}`);
          }
        }
        return next;
      });
    },
    [firebaseUser]
  );
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
        role: finalProfile?.role || 'teacher',
        maxScansPerDay: 9999,
        maxQuestionsPerDay: 9999,
      };
    } else if (user.email === 'expired@example.com') {
      finalProfile = {
        ...(finalProfile || ({} as UserProfile)),
        email: 'expired@example.com',
        name: 'Reviewer (Expired)',
        plan: 'free',
        maxScansPerDay: 2,
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
    // Check for redirect result from Google/Apple Web Auth
    const checkRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result && result.user) {
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
          localStorage.setItem('chekki_last_auth', Date.now().toString());
          setShowLoginModal(false);
        }
      } catch (err) {
        // No screen in this app currently calls signInWithRedirect() — this
        // check runs unconditionally on every cold launch purely to catch a
        // redirect flow that never happens, so any transient error it
        // throws (storage read glitch, a persistence hiccup during the
        // auth-init retry in services/database.ts) was surfacing as a
        // false-alarm "Sign-in failed" toast before the user had done
        // anything. Log only — there is no real redirect result being lost.
        console.error('[AuthContext] Redirect login error (non-fatal, no redirect flow in use):', err);
      }
    };

    checkRedirectResult();

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        // Firebase only auto-refreshes the ID token on natural expiry
        // (~1hr) or explicit sign-in — a role/schoolId custom-claims change
        // made server-side (api/_lib/firebaseAdmin.ts's syncAuthClaims,
        // e.g. right after signup/invite-accept, or the one-time backfill
        // for pre-existing accounts) otherwise sits invisible to an already
        // -open or resumed session for up to an hour. firestore.rules'
        // classes read rule depends on those claims being current
        // (audit: director's classes list permission-denied despite
        // correct Firestore data — stale token claims, not a rules bug).
        // Forcing a refresh on every auth-state transition is the
        // guaranteed-correct fix; the network cost is one token exchange,
        // not a Firestore read.
        try {
          await user.getIdToken(true);
        } catch (e) {
          console.warn('[AuthContext] Forced ID token refresh failed (continuing with cached token):', e);
        }

        // 1. Try to read from local cache first for instant load
        let cachedProfile: UserProfile | null = null;
        const cacheKey = `chekki_user_profile_${user.uid}`;
        try {
          const cachedStr = localStorage.getItem(cacheKey);
          if (cachedStr) {
            cachedProfile = JSON.parse(cachedStr);
            _setUserProfile(cachedProfile); // Set state directly to bypass auth/firebaseUser uid checks during init
            setIsLoading(false); // Instantly unlock screen
          }
        } catch (e) {
          console.warn('[AuthContext] Failed to read cached profile:', e);
        }

        // 2. Fetch fresh user profile in the background (SWR)
        let profile: UserProfile | null = null;
        try {
          profile = await db.getUser(user.uid);
        } catch (e) {
          console.warn('[AuthContext] Background profile refresh failed, retrying once:', e);
          // A cached-profile user used to freeze on that stale snapshot for
          // the rest of the session on any network hiccup here (db.getUser's
          // own 5s race-timeout, more likely on a flaky mobile connection) —
          // no retry, no signal, nothing else in the app re-triggers this
          // fetch. That stale `role`/`schoolId` then silently fed every
          // permission-gated query for the whole session (audit: KT class
          // read intermittently permission-denied with no clear cause).
          // One retry after a short delay, with Sentry visibility if it
          // still fails, rather than giving up permanently and silently.
          try {
            await new Promise((resolve) => setTimeout(resolve, 2500));
            profile = await db.getUser(user.uid);
          } catch (retryErr) {
            console.error('[AuthContext] Profile refresh retry also failed:', retryErr);
            Sentry.captureException(retryErr, {
              tags: { area: 'authContextProfileRefresh' },
              extra: { uid: user.uid, hadCachedProfile: !!cachedProfile },
            });
            // If we had no cache, we must stop loading now
            if (!cachedProfile) {
              setIsLoading(false);
            }
            return;
          }
        }

        if (profile) {
          await fetchAndSetUserProfile(user, profile);
        } else {
          // If the profile is null and we are not in the middle of a signup,
          // the user is authenticated in Firebase but has no Firestore profile.
          // This happens if the page reloads during sign in (e.g. signInWithRedirect or Safari unloading).
          // Anonymous guest sessions (see the GUEST AUTH branch below) skip
          // this entirely — they aren't a real account, so there's nothing
          // to persist a profile doc for (was writing a throwaway 'free'
          // plan doc to Firestore on every guest session for no benefit,
          // since guest quota is tracked in localStorage, not this doc).
          if (!isSigningUpRef.current && !user.isAnonymous) {
            console.log('[AuthContext] Creating missing profile for authenticated user');
            const newProfile: UserProfile = {
              name: user.displayName || 'User',
              email: user.email || '',
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
            try {
              await db.createUser(user.uid, newProfile);
              await fetchAndSetUserProfile(user, newProfile);
            } catch (err) {
              console.error('[AuthContext] Failed to create fallback profile', err);
              setUserProfile(null);
            }
          }
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

        // --- GUEST AUTH: Ensure every session has a token ---
        if (Capacitor.isNativePlatform()) {
          try {
            await withTimeout(signInAnonymously(auth), 5000, 'signInAnonymously timeout');
            // onAuthStateChanged will fire again with the new anon user — return here
            // so we don't call setIsLoading(false) twice.
            return;
          } catch (err) {
            console.error('[AuthContext] Anonymous sign-in failed or timed out:', err);
          }
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

      // Reserved for the pre-provisioned Apple/reviewer demo accounts (see the
      // email-based plan override in fetchAndSetUserProfile). Those accounts
      // only ever sign in with a pre-set password, never sign up — blocking
      // registration here closes the gap where someone could self-register
      // the literal address in an environment that hasn't provisioned it yet
      // and pick up the demo "pro" display override (audit: High finding #2).
      if (cleanEmail === 'test@example.com' || cleanEmail === 'expired@example.com') {
        throw new Error('This email address is reserved.');
      }

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
      localStorage.setItem('chekki_last_auth', Date.now().toString());
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
      // The old catch block here auto-provisioned a free Pro/director account
      // (and, on failure, an anonymous Pro account) for ANY failed login
      // matching "demo"/"teacher"/"director"/"test" in the email — that
      // covers real customer emails like "director@school.com" and was a
      // critical monetization/security hole (audit §14/§18). It has been
      // removed entirely: a failed login now always surfaces as a thrown
      // error and never auto-creates an account.
      const res = await signInWithEmailAndPassword(auth, cleanEmail, cleanPass);
      if (res.user) {
        let profile = await db.getUser(res.user.uid);
        if (!profile) {
          profile = {
            name: 'User',
            email: cleanEmail,
            role: 'parent',
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
          await db.createUser(res.user.uid, profile);
        }
        await fetchAndSetUserProfile(res.user, profile);
      }
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
          localStorage.setItem('chekki_last_auth', Date.now().toString());
          setShowLoginModal(false);
        } else {
          throw new Error('Apple Sign-In returned no identity token.');
        }
      } else {
        // WEB / ANDROID FLOW
        try {
          const result = await signInWithPopup(auth, provider);
          if (result.user) {
            const existingProfile = await db.getUser(result.user.uid);
            if (!existingProfile) {
              const name = result.user.displayName || 'User';
              const email = result.user.email || '';

              const newProfile: UserProfile = {
                name,
                email,
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
          localStorage.setItem('chekki_last_auth', Date.now().toString());
          setShowLoginModal(false);
        } catch (popupErr: any) {
          if (
            popupErr.code === 'auth/argument-error' ||
            popupErr.code === 'auth/internal-error' ||
            popupErr.code === 'auth/popup-blocked'
          ) {
            throw new Error(
              'Login interrupted (often due to Incognito mode or blocked cookies). Please try again or use email login.'
            );
          }
          throw popupErr;
        }
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
            localStorage.setItem('chekki_last_auth', Date.now().toString());
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
      try {
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
        localStorage.setItem('chekki_last_auth', Date.now().toString());
        setShowLoginModal(false);
      } catch (popupErr: any) {
        if (
          popupErr.code === 'auth/argument-error' ||
          popupErr.code === 'auth/internal-error' ||
          popupErr.code === 'auth/popup-blocked'
        ) {
          throw new Error(
            'Login interrupted (often due to Incognito mode or blocked cookies). Please try again or use email login.'
          );
        }
        throw popupErr;
      }
    } catch (err: any) {
      console.error('Google Sign-In Technical Error:', err);
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
      let accessToken = '';

      if (Capacitor.isNativePlatform()) {
        const kakaoUser = await KakaoLogin.login();
        if (!kakaoUser.accessToken) {
          throw new Error('Failed to retrieve access token from Kakao login.');
        }
        accessToken = kakaoUser.accessToken;
      } else {
        // Web flow using Kakao JS SDK
        if (!(window as any).Kakao) {
          console.log('[AuthContext] Kakao SDK missing, attempting to inject dynamically...');
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://t1.kakaocdn.net/kakao_js_sdk/1.43.1/kakao.min.js';
            script.onload = () => {
              if ((window as any).Kakao && !(window as any).Kakao.isInitialized()) {
                (window as any).Kakao.init('f06bc75426bf2b41940620d3ee942f06');
              }
              resolve();
            };
            script.onerror = () =>
              reject(
                new Error(
                  'Failed to load Kakao SDK. Please disable your adblocker or try a different browser.'
                )
              );
            document.head.appendChild(script);
          });
        }

        if (!(window as any).Kakao) {
          throw new Error('Kakao SDK not loaded. Please disable adblockers and try again.');
        }

        const Kakao = (window as any).Kakao;

        accessToken = await new Promise<string>((resolve, reject) => {
          Kakao.Auth.login({
            success: (authObj: any) => {
              resolve(authObj.access_token);
            },
            fail: (err: any) => {
              reject(new Error(JSON.stringify(err)));
            },
          });
        });
      }

      // Exchange Kakao Access Token for Firebase Custom Token
      const response = await fetch(`${API_BASE_URL}/api/kakao-auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ accessToken }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to authenticate with Kakao on the server.');
      }

      const { customToken, profile } = await response.json();

      // Sign in to Firebase with the Custom Token
      const result = await signInWithCustomToken(auth, customToken);

      if (result.user) {
        const existingProfile = await db.getUser(result.user.uid);
        if (!existingProfile) {
          const newProfile: UserProfile = {
            name: profile?.name || result.user.displayName || 'Kakao User',
            email: profile?.email || result.user.email || '',
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

      localStorage.setItem('chekki_last_auth', Date.now().toString());
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
    const uid = auth.currentUser?.uid || firebaseUser?.uid;
    if (uid) {
      localStorage.removeItem(`chekki_user_profile_${uid}`);
    }
    subscriptionService.clearCache();
    revenueCatService.logout();
    signOut(auth);
    localStorage.removeItem('chekki_last_auth');
    localStorage.removeItem('skipped_child_profile');
    setUserProfile(null);
    setSubscriptionRecord(null);
  };

  const updateProfile = async (name: string) => {
    if (userProfile?.email === 'test@example.com' || userProfile?.email === 'expired@example.com') {
      setUserProfile({ ...userProfile, name });
      return;
    }
    if (!firebaseUser || !userProfile || firebaseUser.isAnonymous) return;
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
    if (!firebaseUser || !userProfile || firebaseUser.isAnonymous) {
      throw new Error('Not signed in.');
    }
    const updates = { childAge, childEnglishLevel, parentEnglishLevel };
    setUserProfile({ ...userProfile, ...updates });
    await db.updateUser(firebaseUser.uid, updates);
  };

  const updateClassroomProfile = async (classId: string, studentName: string) => {
    if (userProfile?.email === 'test@example.com' || userProfile?.email === 'expired@example.com') {
      setUserProfile({
        ...userProfile,
        classId,
        studentName,
        classStatus: classId ? 'pending' : null,
      });
      return;
    }
    if (!firebaseUser || !userProfile || firebaseUser.isAnonymous) return;

    // Only set pending if a non-empty class ID is selected and it differs from current classId
    const isNewEnrollment = classId && classId !== userProfile.classId;
    const classStatus = isNewEnrollment
      ? 'pending'
      : classId
        ? userProfile.classStatus || 'pending'
        : null;

    const updates = {
      classId: classId || null,
      studentName: studentName.trim() || null,
      classStatus: classStatus || null,
    };

    setUserProfile({ ...userProfile, ...updates });
    await db.updateUser(firebaseUser.uid, updates);
  };

  const deleteAccount = async () => {
    if (!firebaseUser) return;
    try {
      if (userProfile?.schoolId) {
        try {
          const schoolRef = doc(dbInstance, 'schools', userProfile.schoolId);
          await updateDoc(schoolRef, {
            usedByUids: arrayRemove(firebaseUser.uid),
          });
        } catch (sErr) {
          console.warn('Failed to remove user UID from school doc during account deletion:', sErr);
        }
      }

      // Clean up the users/{uid}/data/mistakes subcollection doc — deleting
      // the parent user doc does NOT cascade to subcollections in Firestore,
      // so this used to survive account deletion as an orphaned record of a
      // child's mistake notebook (audit §15d).
      try {
        await deleteDoc(doc(dbInstance, 'users', firebaseUser.uid, 'data', 'mistakes'));
      } catch (dErr) {
        console.warn('Failed to delete mistakes subcollection doc during account deletion:', dErr);
      }

      await db.deleteUserDoc(firebaseUser.uid);
      await deleteUser(firebaseUser);

      setUserProfile(null);
      setFirebaseUser(null);
      setSubscriptionRecord(null);
      subscriptionService.clearCache();
    } catch (e: any) {
      console.error('Account deletion error:', e);
      // If re-authentication is needed, Firebase will throw 'auth/requires-recent-login'
      if (e.code === 'auth/requires-recent-login') {
        throw new Error(
          'Sensitive operation. Please log out and log back in before deleting your account.'
        );
      }
      throw e;
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

  // Refunds the optimistic local-state increment from incrementScan() when
  // an analysis request fails after the scan was deducted (deducting before
  // the API call, rather than after, is deliberate — it closes a quota-
  // bypass gap — but a failed request shouldn't cost the user a real scan).
  // The real quota (Firestore scansUsedToday) is only ever incremented by
  // api/analyze.ts on success, so this just re-syncs the local optimistic
  // copy back to match — it isn't a second source of truth.
  const decrementScan = (): void => {
    setUserProfile((prev) =>
      prev ? { ...prev, scansUsedToday: Math.max(0, prev.scansUsedToday - 1) } : null
    );
  };

  const checkQuestionLimit = (): boolean => {
    if (!userProfile || userProfile.plan === 'pro') return true;
    const today = new Date().toISOString().split('T')[0];
    const isNewDay = userProfile.lastQuestionDate !== today;
    const currentQuestions = isNewDay ? 0 : userProfile.questionsUsedToday;
    const limit = 1; // Enforce 1 question per day for free users
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
    if (!firebaseUser || !userProfile || firebaseUser.isAnonymous) return;
    const updates: Partial<UserProfile> = { isCanceled: true };
    setUserProfile({ ...userProfile, ...updates });
    await db.updateUser(firebaseUser.uid, updates);
  };

  const requestLimitReset = async (reason: string): Promise<boolean> => {
    if (!firebaseUser || firebaseUser.isAnonymous) return false;
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
    if (!firebaseUser || !userProfile || firebaseUser.isAnonymous) return false;

    try {
      const idToken = await firebaseUser.getIdToken();
      const response = await fetch(`${API_BASE_URL}/api/redeem-school-code`, {
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

  const joinClassWithCode = async (classCode: string): Promise<boolean> => {
    if (!firebaseUser || !userProfile || firebaseUser.isAnonymous) return false;

    try {
      const idToken = await firebaseUser.getIdToken();
      const response = await fetch(`${API_BASE_URL}/api/redeem-class-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ classCode }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const updates: Partial<UserProfile> = {
            schoolId: data.schoolId,
            schoolName: data.schoolName,
            classId: data.classId,
            classStatus: 'pending',
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
      console.error('joinClassWithCode error:', err);
      return false;
    }
  };

  // Same endpoint as joinClassWithCode, but returns the server's actual
  // success/error detail instead of a bare boolean — used by the invite-
  // email deep link (App.tsx), which needs to show the real reason a code
  // failed (already used, requires a personal invite, etc.) instead of a
  // generic "something went wrong."
  const redeemClassCodeDetailed = useCallback(async (
    classCode: string
  ): Promise<{ success: boolean; schoolName?: string; className?: string; error?: string; wrongAccount?: boolean }> => {
    if (!firebaseUser || !userProfile || firebaseUser.isAnonymous) {
      return { success: false, error: 'Not signed in.' };
    }

    try {
      const idToken = await firebaseUser.getIdToken();
      const response = await fetch(`${API_BASE_URL}/api/redeem-class-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ classCode }),
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok && data.success) {
        const updates: Partial<UserProfile> = {
          schoolId: data.schoolId,
          schoolName: data.schoolName,
          classId: data.classId,
          classStatus: 'pending',
          plan: 'pro',
          maxScansPerDay: 9999,
          maxQuestionsPerDay: 9999,
          subscriptionPlatform: 'school_code',
        };
        setUserProfile({ ...userProfile, ...updates });
        return { success: true, schoolName: data.schoolName, className: data.className };
      }
      // 403 here means "signed in as the wrong account" (either the
      // joinCode+allowlist gate or the invite-code email check rejected it)
      // — distinct from a genuinely bad/expired code, so the caller can
      // offer "sign out and try again" instead of just an error toast.
      return { success: false, error: data.error || 'This code could not be redeemed.', wrongAccount: response.status === 403 };
    } catch (err) {
      console.error('redeemClassCodeDetailed error:', err);
      return { success: false, error: 'Network error — please try again.' };
    }
  }, [firebaseUser, userProfile, setUserProfile]);

  const leaveClassroom = async () => {
    if (!firebaseUser || !userProfile || firebaseUser.isAnonymous) return;
    const isPaidUser = subscriptionRecord && subscriptionRecord.subscription_status === 'active';
    const updates = {
      classId: null,
      classStatus: null,
      schoolId: null,
      schoolName: null,
      plan: (isPaidUser ? 'pro' : 'free') as 'free' | 'pro',
      maxScansPerDay: isPaidUser ? 9999 : FREE_DAILY_LIMIT,
      maxQuestionsPerDay: isPaidUser ? 9999 : 5,
    };
    setUserProfile({ ...userProfile, ...updates });
    await db.updateUser(firebaseUser.uid, updates);
  };

  const upgradeToPro = async (code?: string): Promise<boolean> => {
    if (!firebaseUser || !userProfile || firebaseUser.isAnonymous) return false;

    if (code) {
      const sanitizedCode = code.toUpperCase().trim();
      if (sanitizedCode.length === 6) {
        const isClass = await joinClassWithCode(sanitizedCode);
        if (isClass) return true;
      }
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
    if (!isDemo && (!firebaseUser || !userProfile || firebaseUser.isAnonymous)) {
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
    if (!firebaseUser || firebaseUser.isAnonymous) {
      return { success: false, message: 'Not logged in.' };
    }

    const res = await subscriptionService.restorePurchases(firebaseUser.uid);
    if (res.success && userProfile?.plan !== 'pro') {
      await upgradeToPro();
      const newSubRecord = subscriptionService.getStatus();
      if (newSubRecord) setSubscriptionRecord(newSubRecord);
    }
    return res;
  };

  // useCallback matters here, not just style: these get put in other
  // components' useEffect dependency arrays (e.g. App.tsx's invite-link
  // redemption effect). A plain arrow function gets a new reference on
  // every AuthProvider render, which made that effect re-fire on every
  // unrelated re-render and immediately reopen the login modal right after
  // the user closed it — it looked like the X button was broken (Audit:
  // invite-link login modal impossible to dismiss).
  const openLoginModal = useCallback(() => setShowLoginModal(true), []);
  const closeLoginModal = useCallback(() => setShowLoginModal(false), []);

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
        decrementScan,
        checkQuestionLimit,
        incrementQuestion,
        upgradeToPro,
        processPayment,
        restorePurchases,
        joinSchool,
        cancelSubscription,
        requestLimitReset,
        // A native guest session (signInAnonymously, see the
        // onAuthStateChanged null-user branch above) gets its own Firestore
        // profile so scan/question counters have somewhere to live, but it
        // is not a real account — treating it as authenticated let guests
        // silently land in the same "free plan" UI as a signed-in parent,
        // with the login modal never prompted (Bug: guest auto "logged in").
        isAuthenticated: !!userProfile && !firebaseUser?.isAnonymous,
        isLoading,
        showPaywall,
        setShowPaywall,
        paywallContext,
        showLoginModal,
        openLoginModal,
        closeLoginModal,
        updateChildProfile,
        updateClassroomProfile,
        joinClassWithCode,
        redeemClassCodeDetailed,
        leaveClassroom,
        redirectAuthError,
        clearRedirectAuthError,
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
