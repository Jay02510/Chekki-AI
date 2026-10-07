import React, { useState, useEffect, useRef, Suspense, lazy } from 'react';
import { Header } from './components/Header';
import { X } from '@phosphor-icons/react';
import { CameraView } from './components/CameraView';
import { LoadingScreen } from './components/LoadingScreen';
import { SplitView } from './components/SplitView';
import { Dashboard } from './components/Dashboard';
import { DebugConsole } from './components/DebugConsole';
import { SplashScreen } from './components/SplashScreen';
import { MobileAppBanner } from './components/MobileAppBanner';
import { HelpView } from './components/HelpView';
import { Footer } from './components/Footer';
import { ConfirmDialog } from './components/ConfirmDialog';
import { SuccessDialog } from './components/SuccessDialog';
import { Confetti } from './components/Confetti';

import { PaywallModal } from './components/PaywallModal';
import { OdapNoteModal } from './components/OdapNoteModal';
import { LoginModal } from './components/LoginModal';
import { LegalModal } from './components/LegalModal';
import { ProgressiveOnboardingModal } from './components/ProgressiveOnboardingModal';
// Route-level pages are lazy-loaded — each pulls in a large, disjoint
// dependency graph (admin tooling, the full teacher/director dashboard,
// the B2B sales page) that a parent scanning a worksheet never needs.
// Static imports here meant every visitor downloaded all of it up front.
const SubscribePage = lazy(() => import('./src/pages/SubscribePage'));
const AdminPage = lazy(() => import('./src/pages/AdminPage'));
const TeacherPage = lazy(() => import('./src/pages/TeacherPage'));
const SchoolsLandingPage = lazy(() => import('./src/pages/SchoolsLandingPage'));
import { AnalysisState, LegalType } from './types';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { MistakeProvider } from './contexts/MistakeContext';
import { ToastProvider, useToast } from './contexts/ToastContext';
import { ChekkiMascot } from './components/Icons';
import { db } from './services/database';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import { revenueCatService } from './services/revenueCatService';
import { useWorksheetAnalysis } from './src/hooks/useWorksheetAnalysis';
import { APP_VERSION } from './src/version';
import { ErrorBoundary } from './components/ErrorBoundary';

const SESSION_KEY = 'hw_last_session';

// Root Error Boundary Component
// Full-page crash fallback for the app's route-level ErrorBoundary wraps
// below — shows the actual error and a hard reload, distinct from the
// smaller in-place "Try Again" default the shared ErrorBoundary uses at
// section level (see components/ErrorBoundary.tsx).
const AppCrashFallback = (error: Error | null) => (
  <div className="fixed inset-0 bg-ground flex flex-col items-center justify-center p-6 text-center z-[99999]">
    <div className="w-24 h-24 mb-6">
      <ChekkiMascot className="w-full h-full" mood="thinking" />
    </div>
    <h1 className="text-xl font-extrabold text-ink mb-2">
      Something went wrong.
    </h1>
    {error && (
      <div className="max-w-md w-full p-4 mb-6 rounded-md bg-wrong-soft text-wrong text-xs font-mono text-left overflow-auto max-h-40">
        <p className="font-bold">{error.name}: {error.message}</p>
        {error.stack && (
          <pre className="text-xs mt-2 text-wrong/80 whitespace-pre-wrap">{error.stack.slice(0, 300)}</pre>
        )}
      </div>
    )}
    <button
      onClick={() => window.location.reload()}
      className="bg-line text-[#2b211a] px-8 py-3.5 rounded-md font-bold text-[15px] transition-transform active:scale-[0.97] cursor-pointer"
    >
      Reload App
    </button>
  </div>
);

// Suspense fallback for lazy-loaded route pages — brief by design, since the
// chunk is small and usually cached after first visit.
const RouteLoadingFallback: React.FC = () => (
  <div className="fixed inset-0 bg-ground flex items-center justify-center z-[99999]">
    <div className="w-10 h-10 border-4 border-rule border-t-line rounded-full animate-spin" />
  </div>
);

// Theme follows the device (prefers-color-scheme) unless the user picked one
// from the menu. New key on purpose: the old 'chekki_theme' was written on
// every load, so it pinned everyone to whatever theme their first visit had.
const THEME_OVERRIDE_KEY = 'chekki_theme_override';
const darkQuery = typeof window !== 'undefined' ? window.matchMedia('(prefers-color-scheme: dark)') : null;

const getInitialTheme = () => {
  try {
    const saved = localStorage.getItem(THEME_OVERRIDE_KEY);
    if (saved) return saved === 'dark';
  } catch {
    // storage blocked: fall back to the device theme
  }
  return !!darkQuery?.matches;
};

const useInAppBrowser = () => {
  const [isInApp, setIsInApp] = useState(false);
  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase();
    const restricted = /kakaotalk|naver|line|fbav|fban|instagram/i.test(ua);
    setIsInApp(restricted);
  }, []);
  return isInApp;
};

function AppContent() {
  const {
    user,
    openLoginModal,
    isAuthenticated,
    incrementScan,
    checkScanLimit,
    setShowPaywall,
    isLoading: isAuthLoading,
    redeemClassCodeDetailed,
    logout,
    redirectAuthError,
    clearRedirectAuthError,
  } = useAuth();
  const { t, language } = useLanguage();
  const isInApp = useInAppBrowser();
  const { showToast } = useToast();

  useEffect(() => {
    if (!redirectAuthError) return;
    showToast({ type: 'error', message: redirectAuthError });
    clearRedirectAuthError();
  }, [redirectAuthError, showToast, clearRedirectAuthError]);

  const {
    analysisState,
    setAnalysisState,
    lastImageData,
    handleImageSelected: baseHandleImageSelected,
    handleScanAgain: hookHandleScanAgain,
    executeReset: hookExecuteReset,
  } = useWorksheetAnalysis();

  const [isNight, setIsNight] = useState(getInitialTheme());
  const [isSpeedMode, setIsSpeedMode] = useState(false);
  const [isMobileBannerVisible, setIsMobileBannerVisible] = useState(false);
  const [showInAppNotice, setShowInAppNotice] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [isOffline, setIsOffline] = useState(
    typeof navigator !== 'undefined' ? !navigator.onLine : false
  );
  const [showErrorDetails, setShowErrorDetails] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const [showChildProfileModal, setShowChildProfileModal] = useState(false);
  const [standaloneLegal, setStandaloneLegal] = useState<LegalType | null>(null);
  // ── Route detection: resolved synchronously on first render to prevent
  //    a one-frame flash of the parent/mom app before useEffect fires.
  const [showSubscribePage, setShowSubscribePage] = useState(() =>
    typeof window !== 'undefined' && window.location.pathname === '/subscribe'
  );
  const [showAdminPage, setShowAdminPage] = useState(() =>
    typeof window !== 'undefined' && window.location.pathname === '/admin'
  );
  const [showTeacherPage, setShowTeacherPage] = useState(() => {
    if (typeof window === 'undefined') return false;
    const { pathname, search } = window.location;
    return (
      search.includes('invite=') ||
      pathname === '/teacher' ||
      pathname === '/director' ||
      pathname === '/director-hq' ||
      pathname.includes('/schools/login')
    );
  });
  const [showSchoolsPage, setShowSchoolsPage] = useState(() => {
    if (typeof window === 'undefined') return false;
    const { pathname, search } = window.location;
    return !search.includes('invite=') && (pathname === '/schools' || pathname === '/for-schools');
  });
  const [showHelp, setShowHelp] = useState(false);
  const platform = Capacitor.getPlatform();
  // Staff accounts on native can opt into the parent UI (one account, one role).
  const [staffAsParent, setStaffAsParent] = useState(() => {
    try { return localStorage.getItem('chekki_staff_as_parent') === '1'; } catch { return false; }
  });

  // Stashes a `?classCode=` param (the parent/student join-code deep link)
  // for the auth-gated redemption effect further down to pick up. Shared by
  // the mount effect (cold start / normal page load) and the appUrlOpen
  // listener (warm-start deep link) below — previously only the mount
  // effect ever called this, so a classCode link tapped while the app was
  // already running never got redeemed (audit: warm-start classCode links
  // don't stash/redeem).
  const stashPendingClassCodeFromSearch = (search: string) => {
    const classCodeParam = new URLSearchParams(search).get('classCode');
    if (!classCodeParam) return;
    try {
      sessionStorage.setItem('chekki_pending_class_code', classCodeParam.toUpperCase().trim());
      setClassCodeStashVersion((v) => v + 1);
    } catch (e) {
      console.warn('Failed to stash pending class code:', e);
    }
  };

  // Trigger onboarding for authenticated users without a complete profile
  useEffect(() => {
    if (
      isAuthenticated &&
      user &&
      !user.childAge &&
      !localStorage.getItem('skipped_child_profile')
    ) {
      setShowChildProfileModal(true);
    }
  }, [isAuthenticated, user]);

  // Listen for open-help events
  useEffect(() => {
    const handleOpenHelp = () => {
      window.scrollTo({ top: 0, behavior: 'instant' });
      setShowHelp(true);
    };
    window.addEventListener('open-help', handleOpenHelp);
    return () => window.removeEventListener('open-help', handleOpenHelp);
  }, []);

  // Listen for history popstate navigation changes (Dynamic Web Routing)
  // Note: initial state is set synchronously above — this only handles
  // back/forward navigation after the first paint. Also reused by the
  // appUrlOpen listener below (Universal/App Links warm-start handling).
  useEffect(() => {
    const handleLocationChange = () => {
      const path = window.location.pathname;
      const search = window.location.search;
      const isInvite = search.includes('invite=');

      setShowSubscribePage(path === '/subscribe');
      setShowAdminPage(path === '/admin');
      setShowTeacherPage(isInvite || path === '/teacher' || path === '/director' || path === '/director-hq' || path.includes('/schools/login'));
      setShowSchoolsPage(!isInvite && (path === '/schools' || path === '/for-schools'));
    };

    window.addEventListener('popstate', handleLocationChange);

    // Universal Links (iOS) / App Links (Android): a link tapped while the
    // app is already running (warm start) hands the OS-level URL to this
    // listener instead of reloading the WebView — a cold start (app not
    // running) already worked without this, since that's just the WebView's
    // normal initial page load of the invite URL. Without a listener here,
    // tapping an invite link with the app already open just foregrounded it
    // on whatever screen it was already showing (audit: warm-start deep
    // links didn't navigate). Only fires natively; no-op on web.
    let removeAppUrlListener: (() => void) | undefined;
    if (Capacitor.isNativePlatform()) {
      const listenerPromise = CapacitorApp.addListener('appUrlOpen', (event) => {
        try {
          const url = new URL(event.url);
          window.history.pushState({}, '', url.pathname + url.search);
          handleLocationChange();
          stashPendingClassCodeFromSearch(url.search);
        } catch (e) {
          console.warn('Failed to handle appUrlOpen deep link:', e);
        }
      });
      removeAppUrlListener = () => {
        void listenerPromise.then((listener) => listener.remove());
      };
    }

    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      removeAppUrlListener?.();
    };
  }, []);

  // Global Confirmation State
  const [confirmDialog, setConfirmDialog] = useState<{
    title: string;
    onConfirm: () => void;
    confirmText?: string;
    cancelText?: string;
    isSaving?: boolean;
  } | null>(null);
  const [successDialog, setSuccessDialog] = useState<string | null>(null);
  // Bumped whenever a classCode is (re-)stashed after mount — e.g. a
  // warm-start deep link — so the redemption effect below (gated on
  // isAuthLoading/isAuthenticated) re-checks sessionStorage even when auth
  // state itself didn't change.
  const [classCodeStashVersion, setClassCodeStashVersion] = useState(0);

  useEffect(() => {
    // Handle standalone legal pages and splash suppression for known routes
    const path = window.location.pathname.replace('/', '') as LegalType;
    if (['terms', 'privacy', 'refund', 'youth', 'support'].includes(path)) {
      setShowSplash(false);
      setStandaloneLegal(path);
    }

    // Suppress splash for any recognized non-parent route (already set correctly via lazy init).
    // Also suppress it for a classCode invite link — the splash screen fully
    // replaces the render tree (including LoginModal) until its own timer
    // finishes, so openLoginModal() below was firing into a component that
    // wasn't mounted yet and the sign-in prompt silently never appeared.
    if (
      showSubscribePage || showAdminPage || showTeacherPage ||
      showSchoolsPage ||
      window.location.search.includes('classCode=')
    ) {
      setShowSplash(false);
    }

    // Handle return from password reset
    const params = new URLSearchParams(window.location.search);
    if (params.get('auth_action') === 'reset') {
      window.history.replaceState({}, '', window.location.pathname);
      setSuccessDialog(
        language === 'ko'
          ? '비밀번호가 성공적으로 변경되었습니다. 이제 로그인해주세요!'
          : 'Password successfully updated. You can now log in!'
      );
      setTimeout(openLoginModal, 1500);
    }

    // Handle the invite-email "join this class" deep link (?classCode=XXXXXX).
    // Previously this param was never read anywhere — clicking the button in
    // the invite email just landed on the marketing page with no next step.
    // Just stash the code here and strip the URL — whether to prompt sign-in
    // or redeem immediately depends on auth state, which isn't resolved yet
    // on first mount, so that decision lives in the effect below instead
    // (this effect's deps don't include isAuthLoading/isAuthenticated, so it
    // would never re-run once auth resolved — openLoginModal() here was
    // effectively dead code).
    if (params.get('classCode')) {
      stashPendingClassCodeFromSearch(window.location.search);
      window.history.replaceState({}, '', window.location.pathname);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language, openLoginModal]);

  // Redeem a pending class-code deep link once auth state is known — covers
  // both an already-signed-in parent clicking the link, and someone who
  // still needs to sign in/sign up first. This is deliberately the effect
  // that decides whether to prompt sign-in (not the mount effect that
  // stashes the code) because it depends on isAuthLoading/isAuthenticated
  // and re-runs whenever those resolve or change — the mount effect only
  // ever runs once, before Firebase has had a chance to say who's signed in.
  useEffect(() => {
    if (isAuthLoading) return;
    let pending: string | null = null;
    try {
      pending = sessionStorage.getItem('chekki_pending_class_code');
    } catch (e) {
      return;
    }
    if (!pending) return;
    if (!isAuthenticated) {
      openLoginModal();
      return;
    }
    (async () => {
      const result = await redeemClassCodeDetailed(pending!);
      if (result.success) {
        try { sessionStorage.removeItem('chekki_pending_class_code'); } catch (e) { /* ignore */ }
        setSuccessDialog(
          language === 'ko'
            ? `🎉 ${result.schoolName || '학원'}${result.className ? ` · ${result.className}` : ''} 반에 가입되었습니다!`
            : `🎉 You're enrolled in ${result.className || 'the class'}${result.schoolName ? ` at ${result.schoolName}` : ''}!`
        );
      } else if (result.wrongAccount) {
        // The code was rejected because it's tied to a different email than
        // whoever is currently signed in — very likely someone already had
        // an account logged in on this device/browser when they clicked the
        // invite link. Keep the code stashed (don't clear it) and offer to
        // sign out, so signing back in with the right email retries
        // automatically instead of the code silently going nowhere.
        setConfirmDialog({
          title: language === 'ko'
            ? `${user?.email || '현재 계정'}(으)로 로그인되어 있어 코드를 사용할 수 없습니다. 초대받은 이메일로 로그아웃 후 다시 로그인해주세요.`
            : `This code isn't for the account you're signed in as (${user?.email || 'current account'}). Sign out and log back in with the email the invite was sent to.`,
          confirmText: language === 'ko' ? '로그아웃' : 'Sign Out',
          cancelText: language === 'ko' ? '나중에' : 'Later',
          onConfirm: () => {
            setConfirmDialog(null);
            logout();
            setTimeout(openLoginModal, 300);
          },
        });
      } else {
        try { sessionStorage.removeItem('chekki_pending_class_code'); } catch (e) { /* ignore */ }
        showToast({
          type: 'error',
          message: result.error || (language === 'ko' ? '코드를 확인할 수 없습니다. 선생님께 문의해주세요.' : "Couldn't redeem that code. Please check with your teacher."),
        });
      }
    })();
  // classCodeStashVersion: re-check sessionStorage when a warm-start deep
  // link stashes a new code, even if auth state itself hasn't changed.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthLoading, isAuthenticated, language, redeemClassCodeDetailed, showToast, user, openLoginModal, classCodeStashVersion]);

  useEffect(() => {
    // Initialize RevenueCat
    revenueCatService.initialize();

    // Follow the device theme live, unless the user set an override.
    const onSchemeChange = (e: MediaQueryListEvent) => {
      try {
        if (localStorage.getItem(THEME_OVERRIDE_KEY)) return;
      } catch {
        // storage blocked: keep following the device
      }
      setIsNight(e.matches);
    };
    darkQuery?.addEventListener('change', onSchemeChange);
    return () => darkQuery?.removeEventListener('change', onSchemeChange);
  }, []);

  // Sync isNight state with the HTML class. Persisting happens only in
  // setThemeByUser, so following the device theme never pins a choice.
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isNight);
    document.documentElement.style.colorScheme = isNight ? 'dark' : 'light';
  }, [isNight]);

  const setThemeByUser = React.useCallback((night: boolean) => {
    try {
      localStorage.setItem(THEME_OVERRIDE_KEY, night ? 'dark' : 'light');
    } catch {
      // storage blocked: the choice lasts this session only
    }
    setIsNight(night);
  }, []);

  const handleSplashFinish = React.useCallback(() => {
    setShowSplash(false);
  }, []);

  useEffect(() => {
    // Log app open
    db.logUserEvent('app_open');

    if (analysisState.status === 'idle') {
      const saved = localStorage.getItem(SESSION_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          const isFresh = parsed.timestamp && Date.now() - parsed.timestamp < 10 * 60 * 1000;
          if (isFresh && parsed.state && parsed.state.status === 'complete') {
            setAnalysisState(parsed.state);
          }
        } catch (e) {
          localStorage.removeItem(SESSION_KEY);
        }
      }
    }
  }, [analysisState.status, setAnalysisState]);

  // Confetti and success toast fire only when analysis genuinely completes
  useEffect(() => {
    if (analysisState.status === 'complete') {
      setShowConfetti(true);
      setShowSuccessToast(true);
      const confettiTimer = setTimeout(() => setShowConfetti(false), 3000);
      const toastTimer = setTimeout(() => setShowSuccessToast(false), 4000);
      return () => {
        clearTimeout(confettiTimer);
        clearTimeout(toastTimer);
      };
    }
  }, [analysisState.status]);

  // Ensure scroll is reset to top when returning to idle/camera home view
  useEffect(() => {
    if (analysisState.status === 'idle') {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [analysisState.status]);

  const handleImageSelected = async (base64Data: string) => {
    setShowErrorDetails(false);
    await baseHandleImageSelected(base64Data);
  };

  const translateError = (msg: string) => {
    const isKo = language === 'ko';

    // Check for resource exhaustion / 429 errors first (billing, prepayment, etc)
    if (
      msg.includes('RESOURCE_EXHAUSTED') ||
      msg.includes('429') ||
      msg.includes('Too Many Requests') ||
      msg.includes('prepayment') ||
      msg.includes('credits are depleted') ||
      msg.includes('AI_TEMPORARILY_UNAVAILABLE') ||
      msg.includes('UNAVAILABLE') ||
      msg.includes('503') ||
      msg.includes('overloaded')
    ) {
      return isKo
        ? '일시적으로 서비스 요청이 많아 연결이 지연되고 있습니다. 잠시 후 다시 시도해 주세요!'
        : 'The service is temporarily busy due to high demand. Please try again in a little while!';
    }

    if (msg.includes('OFFLINE_ERROR')) {
      return isKo ? '인터넷 연결을 확인해주세요.' : 'Please check your internet connection.';
    }

    if (msg.includes('NETWORK_ERROR')) {
      return isKo
        ? '서버에 연결할 수 없습니다. 인터넷 연결을 확인하고 잠시 후 다시 시도해 주세요.'
        : 'Unable to connect to the server. Please check your internet connection and try again.';
    }

    if (msg.includes('UNAUTHORIZED')) {
      return isKo
        ? '로그인이 필요합니다. 다시 로그인해주세요.'
        : 'Authorization failed. Please log out and log back in.';
    }

    if (msg.includes('API_KEY_MISSING')) {
      return isKo
        ? '서버 설정 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.'
        : 'Server configuration error. Please try again later.';
    }

    if (msg.includes('PAYLOAD_TOO_LARGE')) {
      return isKo
        ? '이미지 용량이 너무 큽니다. 10MB 이하의 사진을 업로드해 주세요.'
        : 'The image is too large. Please upload an image under 10MB.';
    }

    if (msg.includes('LIMIT_REACHED') || msg.includes('limit_reached')) {
      return isKo
        ? '오늘 이용 가능한 한도를 모두 사용하셨습니다. 매일 자정에 다시 충전됩니다!'
        : 'You have exceeded your limit for today. It will refill at midnight!';
    }

    if (msg.includes('INVALID_IMAGE_DATA') || msg.includes('INVALID_INPUT')) {
      return isKo
        ? '올바르지 않은 이미지 형식입니다. 학습지를 다시 선명하게 촬영해 주세요.'
        : 'Invalid image format. Please capture a clear photo of the worksheet.';
    }

    // Default analysis fallback
    return isKo
      ? '분석에 실패했어요. 밝은 곳에서 사진을 다시 찍어주세요!'
      : 'Analysis failed. Please try taking a clearer picture in good lighting!';
  };

  const handleScanAgain = () => {
    // Scroll to top whenever the user exits back to the scan/home screen
    window.scrollTo({ top: 0, behavior: 'instant' });
    handleReset(true);
  };

  const handleReset = (confirm = true) => {
    if (confirm && analysisState.status === 'complete') {
      setConfirmDialog({
        title:
          language === 'ko'
            ? '현재 결과가 삭제됩니다. 계속하시겠습니까?'
            : 'Current results will be removed. Do you want to continue?',
        confirmText: language === 'ko' ? '결과 삭제 (처음으로)' : 'Discard Results & Exit',
        cancelText: language === 'ko' ? '취소' : 'Cancel',
        onConfirm: () => {
          hookExecuteReset();
          setConfirmDialog(null);
          setShowErrorDetails(false);
        },
      });
      return;
    }
    hookExecuteReset();
    setShowErrorDetails(false);
  };

  const isLocked = !showHelp && analysisState.status === 'analyzing';

  useEffect(() => {
    if (isLocked) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isLocked]);

  if (showSplash) return <SplashScreen onFinish={handleSplashFinish} />;
  if (showSubscribePage && platform === 'web')
    return <ErrorBoundary fallback={AppCrashFallback}><Suspense fallback={<RouteLoadingFallback />}><SubscribePage /></Suspense></ErrorBoundary>;
  if (showAdminPage && platform === 'web')
    return <ErrorBoundary fallback={AppCrashFallback}><Suspense fallback={<RouteLoadingFallback />}><AdminPage /></Suspense></ErrorBoundary>;
  if (showTeacherPage && platform === 'web') {
    // TeacherPage's own role-state initializers (loginRole/educatorRole)
    // read `user` synchronously on first render — mounting it while auth is
    // still resolving meant those initializers ran against an undefined
    // `user`, always defaulting to the FT dashboard, which then got
    // replaced by the correct KT/director dashboard a render later once
    // `user` arrived. That replace-after-mount is the visible "wrong
    // dashboard flashes first" bug — holding the mount until auth settles
    // means TeacherPage's first render already has the real role to
    // initialize from (audit: dashboard flash on login).
    if (isAuthLoading) return <RouteLoadingFallback />;
    return <ErrorBoundary fallback={AppCrashFallback}><Suspense fallback={<RouteLoadingFallback />}><TeacherPage isNight={isNight} /></Suspense></ErrorBoundary>;
  }
  if (showSchoolsPage && platform === 'web')
    return <ErrorBoundary fallback={AppCrashFallback}><Suspense fallback={<RouteLoadingFallback />}><SchoolsLandingPage isNight={isNight} setIsNight={setThemeByUser} /></Suspense></ErrorBoundary>;

  // The FT/KT/Director dashboards only exist on web (TeacherPage etc. above
  // are gated `platform === 'web'`) — on the downloaded native app they were
  // silently falling straight through to the parent/consumer UI below with
  // no explanation, a dead end for any staff account (Audit: native app
  // covers only one of four roles). Tell them explicitly instead.
  if (platform !== 'web' && isAuthenticated && !staffAsParent && (user?.role === 'teacher' || user?.role === 'director')) {
    return (
      <div className={`min-h-[100dvh] flex items-center justify-center p-6 text-center ${isNight ? 'bg-brand-dark text-zinc-100' : 'bg-zinc-50 text-zinc-900'}`}>
        <div className="w-full max-w-sm space-y-4">
          <ChekkiMascot className="w-16 h-16 mx-auto opacity-80" />
          <h2 className="text-lg font-black">
            {language === 'ko' ? '교사/원장 대시보드는 웹에서만 이용 가능합니다' : 'Teacher & Director tools are web-only'}
          </h2>
          <p className="text-sm text-zinc-400 leading-relaxed">
            {language === 'ko'
              ? '이 앱은 학부모용입니다. 교사/원장 대시보드는 모바일 브라우저에서 chekki.ai/teacher 로 접속해 주세요.'
              : 'This app is for parents. Please open chekki.ai/teacher in your mobile browser to reach your dashboard.'}
          </p>
          <a
            href="https://chekki.ai/teacher"
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full rounded-xl bg-brand py-3 font-bold text-white"
          >
            {language === 'ko' ? '브라우저에서 열기' : 'Open in browser'}
          </a>
          <button
            onClick={() => {
              try { localStorage.setItem('chekki_staff_as_parent', '1'); } catch { /* storage blocked: session-only */ }
              setStaffAsParent(true);
            }}
            className="block w-full rounded-xl border border-zinc-300 py-3 font-bold"
          >
            {language === 'ko' ? '학부모 기능 사용하기' : 'Continue as parent'}
          </button>
          <button
            onClick={logout}
            className="block w-full rounded-xl py-3 font-bold text-zinc-500"
          >
            {language === 'ko' ? '로그아웃' : 'Sign out'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary fallback={AppCrashFallback}>
      <div
        className="min-h-[100dvh] bg-ground tile-ground text-ink font-sans overflow-x-hidden flex flex-col"
      >
        {standaloneLegal && (
          <div className="fixed inset-0 z-[200]">
            <LegalModal
              type={standaloneLegal}
              onClose={() => setStandaloneLegal(null)}
              isStandalone={true}
              isNight={isNight}
            />
          </div>
        )}
        <Header
          onReset={() => handleReset(true)}
          isNight={isNight}
          setIsNight={setThemeByUser}
          isSpeedMode={isSpeedMode}
          setIsSpeedMode={setIsSpeedMode}
          showSpeedToggle={analysisState.status === 'complete'}
          pushedDownByBanner={isMobileBannerVisible}
          onOpenHelp={() => {
            // We removed activeTab state, so we just use an event or a local state here if needed
            // Actually, let's just trigger a custom event or you can manage it with a new state 'showHelp'
            window.dispatchEvent(new CustomEvent('open-help'));
          }}
          onOpenDashboard={() => {
            if (isAuthenticated) {
              setShowDashboard(true);
            } else {
              openLoginModal();
            }
          }}
        />
        {/* Web-only mobile download banner */}
        {platform === 'web' && <MobileAppBanner onVisibilityChange={setIsMobileBannerVisible} />}
        <PaywallModal isNight={isNight} />
        <OdapNoteModal isNight={isNight} />
        <LoginModal isNight={isNight} />

        {showSuccessToast && (
          <div role="status" className="fixed top-20 left-4 right-4 z-[99] mx-auto max-w-xl bg-sign text-on-sign px-5 py-4 rounded-md shadow-[0_16px_40px_-16px_rgba(0,0,0,0.5)] flex items-start gap-3 animate-slide-down">
            <span className="mt-1 h-3 w-3 shrink-0 rounded-full bg-line" aria-hidden="true" />
            <p className="text-[14px] font-semibold leading-snug">
              {language === 'ko'
                ? '도착: 한국어 설명. 다시 볼 문제부터 아이와 같이 봐요.'
                : "Arrived: Explain. Start with the ones to look at together."}
            </p>
          </div>
        )}

        {isOffline && (
          <div role="alert" className="fixed top-20 left-4 right-4 z-[99] mx-auto max-w-xl bg-wrong text-white px-5 py-4 rounded-md shadow-[0_16px_40px_-16px_rgba(0,0,0,0.5)] flex items-center gap-3 animate-slide-down">
            <p className="text-[14px] font-semibold leading-snug">
              {language === 'ko'
                ? '네트워크가 연결되어 있지 않습니다. 연결 상태를 확인해주세요.'
                : 'You are offline. Please check your internet connection.'}
            </p>
          </div>
        )}

        {showChildProfileModal && (
          <ProgressiveOnboardingModal
            onComplete={() => setShowChildProfileModal(false)}
            onSkip={() => {
              localStorage.setItem('skipped_child_profile', 'true');
              setShowChildProfileModal(false);
            }}
            isNight={isNight}
            setIsNight={setThemeByUser}
          />
        )}

        {confirmDialog && (
          <ConfirmDialog
            title={confirmDialog.title}
            confirmText={confirmDialog.confirmText}
            cancelText={confirmDialog.cancelText}
            isSaving={confirmDialog.isSaving}
            isNight={isNight}
            onConfirm={confirmDialog.onConfirm}
            onCancel={() => setConfirmDialog(null)}
          />
        )}

        {successDialog && (
          <SuccessDialog
            message={successDialog}
            isNight={isNight}
            onClose={() => setSuccessDialog(null)}
          />
        )}


        {showDashboard && (
          <div className="fixed inset-0 z-[100] bg-ground animate-fade-in">
            <Dashboard onClose={() => setShowDashboard(false)} />
          </div>
        )}

        <main className="flex-1 min-h-0 max-w-7xl xl:max-w-[1440px] 2xl:max-w-[1600px] mx-auto w-full p-4 md:p-6 pb-[max(1rem,env(safe-area-inset-bottom))] flex flex-col pt-[calc(env(safe-area-inset-top)+4.5rem)] md:pt-20">
          {/* Main Content Area */}
          <>
            {analysisState.status === 'idle' && (
              <div className="animate-fade-in flex-1 h-full flex flex-col">
                {isInApp && showInAppNotice && (
                  <div className="fixed top-20 left-4 right-4 z-[60] mx-auto max-w-xl bg-sign text-on-sign px-5 py-3.5 rounded-md shadow-[0_16px_40px_-16px_rgba(0,0,0,0.5)] flex items-center justify-between animate-slide-down">
                    <div className="flex items-center gap-3">
                      <span className="h-3 w-3 shrink-0 rounded-full bg-line" aria-hidden="true" />
                      <p className="text-[14px] font-semibold leading-snug">
                        {language === 'ko'
                          ? "더 원활한 기능을 위해 'Safari' 또는 'Chrome'으로 열어주세요."
                          : 'Open in Safari or Chrome for the best experience (Camera/Mic).'}
                      </p>
                    </div>
                    <button
                      onClick={() => setShowInAppNotice(false)}
                      aria-label={language === 'ko' ? '닫기' : 'Dismiss'}
                      className="ml-2 inline-flex min-h-10 min-w-10 items-center justify-center rounded text-on-sign-2 hover:text-on-sign"
                    >
                      <X size={18} weight="bold" />
                    </button>
                  </div>
                )}
                {isAuthLoading ? (
                  <div className="flex items-center justify-center min-h-[50vh]">
                    <div className="w-8 h-8 border-4 border-rule border-t-line rounded-full animate-spin" />
                  </div>
                ) : (
                  <CameraView
                    isNight={isNight}
                    onImageSelected={(data) => handleImageSelected(data)}
                    minimal
                    onOpenHelp={() => window.dispatchEvent(new CustomEvent('open-help'))}
                  />
                )}
              </div>
            )}

            {analysisState.status === 'analyzing' && (
              <div className="animate-fade-in flex-1 h-full flex flex-col">
                <LoadingScreen isNight={isNight} imageUrl={analysisState.originalImage} onCancel={() => handleReset(false)} />
              </div>
            )}

            {analysisState.status === 'error' && (
              <div className="mx-auto w-full max-w-2xl px-1 pt-4 pb-12 animate-fade-in">
                {/* service notice: what stopped, then the way forward */}
                <section className="overflow-hidden rounded-md bg-surface ring-1 ring-inset ring-rule">
                  <div className="h-1.5 bg-wrong" aria-hidden="true" />
                  <div className="flex items-start gap-4 px-5 py-6 sm:px-8 sm:py-8">
                    <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-[4px] border-wrong text-xl font-extrabold text-wrong">
                      !
                    </span>
                    <div className="min-w-0">
                      <h2 className="sign-ko text-2xl sm:text-[28px] text-ink">{t('error_title')}</h2>
                      <p className="mt-2 text-base leading-relaxed text-ink-2">
                        {translateError(analysisState.errorMessage || '')}
                      </p>
                      <p className="mt-4 text-[14px] leading-snug text-ink-3">
                        {language === 'ko'
                          ? '사진 문제라면: 학습지를 평평하게 펴고, 밝은 곳에서 글자가 선명하게 보이도록 다시 찍어 주세요.'
                          : 'If it was the photo: flatten the paper, use bright light, and keep the text in focus.'}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-3 border-t border-rule px-5 py-5 sm:flex-row sm:px-8">
                    <button
                      onClick={hookHandleScanAgain}
                      className="min-h-12 rounded-md bg-line px-6 text-[15px] font-bold text-[#2b211a] sm:flex-1"
                    >
                      {t('btn_scan_again_simple')}
                    </button>
                    <button
                      onClick={() => handleReset(false)}
                      className="min-h-12 rounded-md px-6 text-[15px] font-bold text-ink-2 ring-1 ring-inset ring-rule hover:text-ink sm:flex-1"
                    >
                      {t('btn_retake')}
                    </button>
                  </div>
                </section>
                {analysisState.errorMessage && (
                  <div className="mt-4 px-1">
                    <button
                      type="button"
                      onClick={() => setShowErrorDetails(!showErrorDetails)}
                      aria-expanded={showErrorDetails}
                      className="text-[13px] font-semibold text-ink-3 hover:text-ink"
                    >
                      {language === 'ko' ? '기술 정보 보기' : 'Technical details'}
                    </button>
                    {showErrorDetails && (
                      <pre className="mt-2 max-h-32 overflow-y-auto whitespace-pre-wrap break-all rounded-md bg-sunken p-3 text-xs text-ink-2">
                        {analysisState.errorMessage}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            )}

            {analysisState.status === 'complete' && analysisState.showHandwritingWarning && (
              <div className="mx-auto w-full max-w-2xl px-1 pt-4 pb-12 animate-fade-in">
                <section className="overflow-hidden rounded-md bg-surface ring-1 ring-inset ring-rule">
                  <div className="h-1.5 bg-line" aria-hidden="true" />
                  <div className="px-5 py-6 sm:px-8 sm:py-8">
                    <h2 className="sign-ko text-2xl sm:text-[28px] text-ink">
                      {language === 'ko' ? '글씨를 읽기 어려워요' : 'Handwriting is hard to read'}
                    </h2>
                    <p className="mt-2 text-base leading-relaxed text-ink-2">
                      {language === 'ko'
                        ? '글씨가 흐리거나 알아보기 어려워요. 채점은 해 볼게요, 다만 결과가 틀릴 수 있어요.'
                        : 'The writing is faint or messy. Chekki can still try, but some marks may be wrong.'}
                    </p>
                  </div>
                  <div className="flex flex-col gap-3 border-t border-rule px-5 py-5 sm:flex-row sm:px-8">
                    <button
                      onClick={() => setAnalysisState((prev) => ({ ...prev, showHandwritingWarning: false }))}
                      className="min-h-12 rounded-md bg-line px-6 text-[15px] font-bold text-[#2b211a] sm:flex-1"
                    >
                      {language === 'ko' ? '그래도 채점 보기' : 'Show results anyway'}
                    </button>
                    <button
                      onClick={() => handleReset(false)}
                      className="min-h-12 rounded-md px-6 text-[15px] font-bold text-ink-2 ring-1 ring-inset ring-rule hover:text-ink sm:flex-1"
                    >
                      {t('btn_retake')}
                    </button>
                  </div>
                </section>
              </div>
            )}

            {analysisState.status === 'complete' &&
              !analysisState.showHandwritingWarning &&
              analysisState.data && (
                <div className="animate-fade-in flex flex-col pt-2 pb-4">
                  <div className="w-full">
                    <SplitView
                      imageUrl={analysisState.originalImage!}
                      items={analysisState.data.items || []}
                      isSpeedMode={isSpeedMode}
                      isLoadingItems={!analysisState.isItemsLoaded}
                      worksheetTitle={
                        language === 'ko'
                          ? analysisState.data.worksheet_summary?.title_ko
                          : analysisState.data.worksheet_summary?.title_en
                      }
                      onScanAgain={handleScanAgain}
                      onClose={handleScanAgain}
                      isNight={isNight}
                      onConfirm={(opts) => setConfirmDialog(opts)}
                      data={analysisState.data}
                      onOpenDashboard={() => {
                        if (isAuthenticated) {
                          setShowDashboard(true);
                        } else {
                          openLoginModal();
                        }
                      }}
                    />
                  </div>
                </div>
              )}
          </>
        </main>

        {/* --- PROFESSIONAL BUSINESS FOOTER --- */}
        {/* Business-registration footer is for the web; native users reach
            the same legal pages from Settings. */}
        {!isLocked && !Capacitor.isNativePlatform() && (
          <Footer
            isNight={isNight}
            language={language}
            onLegalClick={(type) => setStandaloneLegal(type)}
          />
        )}

        {/* Help View Overlay */}
        {showHelp && (
          <div
            className={`fixed inset-0 z-[100] animate-fade-in ${isNight ? 'bg-zinc-950' : 'bg-white'} overflow-y-auto touch-pan-y`}
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            <HelpView isNight={isNight} onClose={() => setShowHelp(false)} />
          </div>
        )}

        <DebugConsole />

        <style>{`
            @keyframes confetti {
              0% { opacity: 1; transform: translate(0, 0) scale(1) rotate(0deg); }
              100% { opacity: 0; transform: translate(var(--tx), var(--ty)) scale(0.5) rotate(360deg); }
            }
            .prose-answer strong {
              color: #f97316; /* orange-500 */
              font-weight: 900;
              text-shadow: 0 0 20px rgba(249, 115, 22, 0.1);
            }
            .prose-answer em {
              color: #f97316; /* brand-orange (One Accent Rule) */
              font-style: italic;
              font-weight: 700;
            }
            .prose-answer mark {
              background: rgba(249, 115, 22, 0.15);
              color: #f97316; /* brand-orange */
              padding: 0 4px;
              border-radius: 0.75rem; /* rounded-xl */
              font-weight: 700;
            }
            .prose-answer p {
              margin-bottom: 0.85rem;
              line-height: 1.8;
            }
        `}</style>
      </div>
    </ErrorBoundary>
  );
}

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <ToastProvider>
          <MistakeProvider>
            <AppContent />
          </MistakeProvider>
        </ToastProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
