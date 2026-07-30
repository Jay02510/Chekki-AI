import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
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
import SubscribePage from './src/pages/SubscribePage';
import AdminPage from './src/pages/AdminPage';
import TeacherPage from './src/pages/TeacherPage';
import DirectorPage from './src/pages/DirectorPage';
import SchoolsLandingPage from './src/pages/SchoolsLandingPage';
import ReportStudioPage from './src/pages/ReportStudioPage';
import { AnalysisState, LegalType } from './types';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { MistakeProvider } from './contexts/MistakeContext';
import { ToastProvider } from './contexts/ToastContext';
import { ChekkiMascot } from './components/Icons';
import { db } from './services/database';
import { Capacitor } from '@capacitor/core';
import { revenueCatService } from './services/revenueCatService';
import { useWorksheetAnalysis } from './src/hooks/useWorksheetAnalysis';
import { APP_VERSION } from './src/version';

const SESSION_KEY = 'hw_last_session';

// Root Error Boundary Component - Fixed property issues by using property initializers and explicit typing
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  // Explicitly declare props and state properties to fix "Property 'state/props' does not exist" errors
  // Explicitly declared state type removed props as it's handled by generics
  state: { hasError: boolean } = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 bg-zinc-950 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-32 h-32 mb-8">
            <ChekkiMascot className="w-full h-full" mood="thinking" />
          </div>
          <h1 className="text-2xl font-black text-white mb-4 font-display">
            Something went wrong.
          </h1>
          <button
            onClick={() => window.location.reload()}
            className="bg-orange-500 text-white px-8 py-4 rounded-2xl font-black shadow-lg hover:bg-orange-600 transition-all active:scale-[0.97]"
          >
            Reload App
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Returns true (night) if hour is between 22:00–23:59 or 00:00–06:59 local time.
// Falls back to system dark mode if no time preference applies.
const isNightTime = (): boolean => {
  const hour = new Date().getHours();
  return hour >= 19 || hour < 7;
};

const getInitialTheme = () => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('chekki_theme');
    if (saved) return saved === 'dark';
    // Time-based: night between 22:00 and 07:00
    return isNightTime();
  }
  return false; // Default to light mode
};

// Returns ms until the next theme-transition boundary (22:00 → night, 07:00 → day).
const msUntilNextTransition = (): number => {
  const now = new Date();
  const hour = now.getHours();
  const min = now.getMinutes();
  const sec = now.getSeconds();
  const ms = now.getMilliseconds();

  const totalMs = ((hour * 60 + min) * 60 + sec) * 1000 + ms;
  const nightStart = 19 * 60 * 60 * 1000; // 19:00 in ms
  const dayStart = 7 * 60 * 60 * 1000; // 07:00 in ms
  const dayMs = 24 * 60 * 60 * 1000;

  if (totalMs < dayStart) {
    // Currently night (after midnight). Next transition = 07:00 today.
    return dayStart - totalMs;
  } else if (totalMs < nightStart) {
    // Currently day. Next transition = 19:00 today.
    return nightStart - totalMs;
  } else {
    // Currently night (after 19:00). Next transition = 07:00 tomorrow.
    return dayMs - totalMs + dayStart;
  }
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
  } = useAuth();
  const { t, language } = useLanguage();
  const isInApp = useInAppBrowser();

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
  const [showSubscribePage, setShowSubscribePage] = useState(false);
  const [showAdminPage, setShowAdminPage] = useState(false);
  const [showTeacherPage, setShowTeacherPage] = useState(false);
  const [showDirectorPage, setShowDirectorPage] = useState(false);
  const [showSchoolsPage, setShowSchoolsPage] = useState(false);
  const [showReportStudioPage, setShowReportStudioPage] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const platform = Capacitor.getPlatform();

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
  useEffect(() => {
    const handleLocationChange = () => {
      const path = window.location.pathname;
      if (path === '/director' || path === '/director-hq') {
        setShowSplash(false);
        setShowDirectorPage(true);
        setShowTeacherPage(false);
        setShowSchoolsPage(false);
        setShowReportStudioPage(false);
        return;
      }
      setShowSubscribePage(path === '/subscribe');
      setShowAdminPage(path === '/admin');
      setShowTeacherPage(path === '/teacher');
      setShowDirectorPage(path === '/director' || path === '/director-hq');
      setShowSchoolsPage(path === '/schools' || path === '/for-schools');
      setShowReportStudioPage(path === '/reports' || path === '/report-studio');
    };

    window.addEventListener('popstate', handleLocationChange);
    handleLocationChange(); // Trigger on mount

    return () => {
      window.removeEventListener('popstate', handleLocationChange);
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

  useEffect(() => {
    const path = window.location.pathname.replace('/', '') as LegalType;
    if (['terms', 'privacy', 'refund', 'youth', 'support'].includes(path)) {
      setShowSplash(false);
      setStandaloneLegal(path);
    }

    // /subscribe route — web only
    if (window.location.pathname === '/subscribe' && Capacitor.getPlatform() === 'web') {
      setShowSplash(false);
      setShowSubscribePage(true);
    }

    // /admin route — web only
    if (window.location.pathname === '/admin' && Capacitor.getPlatform() === 'web') {
      setShowSplash(false);
      setShowAdminPage(true);
    }

    // /teacher route — web only
    if (window.location.pathname === '/teacher' && Capacitor.getPlatform() === 'web') {
      setShowSplash(false);
      setShowTeacherPage(true);
    }

    // /director route — web only
    if ((window.location.pathname === '/director' || window.location.pathname === '/director-hq') && Capacitor.getPlatform() === 'web') {
      setShowSplash(false);
      setShowDirectorPage(true);
    }

    // /schools and /for-schools route — web only
    if (
      (window.location.pathname === '/schools' || window.location.pathname === '/for-schools') &&
      Capacitor.getPlatform() === 'web'
    ) {
      setShowSplash(false);
      setShowSchoolsPage(true);
    }

    // Handle return from password reset
    const params = new URLSearchParams(window.location.search);
    if (params.get('auth_action') === 'reset') {
      // Clear the query parameter from the URL to prevent message appearing on refresh
      window.history.replaceState({}, '', window.location.pathname);
      setSuccessDialog(
        language === 'ko'
          ? '비밀번호가 성공적으로 변경되었습니다. 이제 로그인해주세요!'
          : 'Password successfully updated. You can now log in!'
      );
      setTimeout(openLoginModal, 1500);
    }
  }, [language, openLoginModal]);

  useEffect(() => {
    // Initialize RevenueCat
    revenueCatService.initialize();

    // --- Time-based auto night mode ---
    // Switches to night at 19:00 and back to day at 07:00 (local time).
    // If the user has manually set a preference in Settings it is respected,
    // but cleared at each threshold so the schedule resumes from that point.
    let themeTimer: ReturnType<typeof setTimeout>;

    const scheduleNextTransition = () => {
      const delay = msUntilNextTransition();
      themeTimer = setTimeout(() => {
        // At boundary: only apply time-based theme if user hasn't explicitly set a preference
        if (!localStorage.getItem('chekki_theme')) {
          setIsNight(isNightTime());
        }
        scheduleNextTransition(); // chain to next transition
      }, delay);
    };

    scheduleNextTransition();
    return () => clearTimeout(themeTimer);
  }, []);

  // Sync isNight state with HTML class and localStorage
  useEffect(() => {
    if (isNight) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('chekki_theme', isNight ? 'dark' : 'light');
  }, [isNight]);

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
      msg.includes('credits are depleted')
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
  if (showSubscribePage && platform === 'web') return <SubscribePage />;
  if (showAdminPage && platform === 'web') return <AdminPage />;
  if (showTeacherPage && platform === 'web') return <TeacherPage isNight={isNight} />;
  if (showDirectorPage && platform === 'web') return <DirectorPage isNight={isNight} />;
  if (showSchoolsPage && platform === 'web')
    return <SchoolsLandingPage isNight={isNight} setIsNight={setIsNight} />;
  if (showReportStudioPage && platform === 'web')
    return <ReportStudioPage isNight={isNight} setIsNight={setIsNight} />;

  return (
    <ErrorBoundary>
      <div
        className={`min-h-[100dvh] ${isNight ? 'bg-[#030305] text-zinc-100' : 'bg-[#FAFAFB] text-zinc-900'} font-sans overflow-x-hidden transition-colors duration-200 flex flex-col`}
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
          setIsNight={setIsNight}
          isSpeedMode={isSpeedMode}
          setIsSpeedMode={setIsSpeedMode}
          showSpeedToggle={analysisState.status === 'complete'}
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
        {platform === 'web' && <MobileAppBanner />}
        <PaywallModal isNight={isNight} />
        <OdapNoteModal isNight={isNight} />
        <LoginModal isNight={isNight} />

        {showSuccessToast && (
          <div className="fixed top-24 left-4 right-4 z-[99] bg-emerald-600 text-white p-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-slide-down border border-white/20 backdrop-blur-md">
            <span className="text-xl">✅</span>
            <p className="text-xs font-bold leading-tight font-korean">
              {language === 'ko'
                ? '분석 완료! 오늘도 아이와 함께 숙제하느라 고생 많으셨어요. 정답과 다정한 티칭 가이드가 준비되었습니다.'
                : 'Analysis complete! Great job surviving another homework session. Your answer overlays and teaching guides are ready.'}
            </p>
          </div>
        )}

        {isOffline && (
          <div className="fixed top-24 left-4 right-4 z-[99] bg-red-600 text-white p-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-slide-down border border-white/20 backdrop-blur-md">
            <span className="text-xl">🔌</span>
            <p className="text-xs font-bold leading-tight font-korean">
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
            setIsNight={setIsNight}
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

        {showConfetti && <Confetti />}

        {showDashboard && (
          <div className="fixed inset-0 z-[100] bg-zinc-950/80 backdrop-blur-sm animate-fade-in">
            <Dashboard onClose={() => setShowDashboard(false)} />
          </div>
        )}

        <main className="flex-1 min-h-0 max-w-7xl xl:max-w-[1440px] 2xl:max-w-[1600px] mx-auto w-full p-4 md:p-6 pb-[max(1rem,env(safe-area-inset-bottom))] flex flex-col pt-[calc(env(safe-area-inset-top)+6rem)] md:pt-32">
          {/* Main Content Area */}
          <>
            {analysisState.status === 'idle' && (
              <div className="animate-fade-in flex-1 h-full flex flex-col">
                {isInApp && showInAppNotice && (
                  <div className="fixed top-24 left-4 right-4 z-[60] bg-orange-600 text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between animate-fade-in-up border border-white/20 backdrop-blur-md">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">⚠️</span>
                      <p className="text-[10px] md:text-xs font-bold font-korean leading-tight">
                        {language === 'ko'
                          ? "더 원활한 기능을 위해 'Safari' 또는 'Chrome'으로 열어주세요."
                          : 'Open in Safari or Chrome for the best experience (Camera/Mic).'}
                      </p>
                    </div>
                    <button
                      onClick={() => setShowInAppNotice(false)}
                      className="text-white/60 p-1 ml-2"
                    >
                      ✕
                    </button>
                  </div>
                )}
                {isAuthLoading ? (
                  <div className="flex items-center justify-center min-h-[50vh]">
                    <div className="w-8 h-8 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
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
                <LoadingScreen isNight={isNight} onCancel={() => handleReset(false)} />
              </div>
            )}

            {analysisState.status === 'error' && (
              <div className="flex flex-col items-center justify-center flex-1 text-center p-6 animate-fade-in pt-24">
                <div className="relative w-40 h-40 md:w-52 md:h-52 mb-10">
                  {/* Empathy ring — expands outward to convey "something happened" */}
                  <div className="absolute inset-0 rounded-full bg-red-500/20 animate-ring-pulse" />
                  <div
                    className="absolute inset-0 rounded-full bg-red-500/10 animate-ring-pulse"
                    style={{ animationDelay: '0.4s' }}
                  />
                  <div className="relative w-full h-full bg-red-950/20 rounded-full flex items-center justify-center border border-red-500/30 overflow-hidden">
                    <img
                      src="https://res.cloudinary.com/dginphpy4/image/upload/v1765769939/chekki-scan_sqo9sz.png"
                      alt="Chekki"
                      className="w-36 h-36 md:w-48 md:h-48 object-contain"
                    />
                  </div>
                </div>
                <h3
                  className={`text-2xl font-bold ${isNight ? 'text-white' : 'text-zinc-900'} mb-2 font-korean`}
                >
                  {t('error_title')}
                </h3>
                <div className="space-y-2 mb-8 max-w-md mx-auto">
                  <p
                    className={`${isNight ? 'text-zinc-400' : 'text-zinc-650'} font-korean leading-relaxed`}
                  >
                    {translateError(analysisState.errorMessage || '')}
                  </p>
                  <p
                    className={`text-xs md:text-sm font-semibold mt-4 ${isNight ? 'text-zinc-500' : 'text-zinc-450'} font-korean leading-snug`}
                  >
                    {language === 'ko'
                      ? '💡 팁: 학습지를 평평하게 펴고, 밝은 곳에서 글자가 선명하게 보이도록 다시 촬영해 보세요.'
                      : '💡 Tip: Flatten the paper, ensure bright lighting, and make sure the text is in focus.'}
                  </p>
                  {analysisState.errorMessage && (
                    <div className="mt-6">
                      <button
                        type="button"
                        onClick={() => setShowErrorDetails(!showErrorDetails)}
                        className={`text-[10px] uppercase font-bold tracking-wider opacity-60 hover:opacity-100 transition-opacity flex items-center gap-1 mx-auto ${
                          isNight ? 'text-zinc-400' : 'text-zinc-500'
                        }`}
                      >
                        <span>{showErrorDetails ? '▼' : '▶'}</span>
                        <span>
                          {language === 'ko' ? '상세 에러 정보 보기' : 'View Technical Details'}
                        </span>
                      </button>
                      {showErrorDetails && (
                        <div
                          className={`mt-3 p-4 rounded-2xl border text-left text-[10px] font-mono break-all max-w-sm mx-auto overflow-y-auto max-h-32 transition-all duration-200 ${
                            isNight
                              ? 'bg-zinc-950/80 border-white/5 text-zinc-500'
                              : 'bg-zinc-100 border-zinc-200 text-zinc-600'
                          }`}
                        >
                          {analysisState.errorMessage}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row gap-4 w-full max-w-xs sm:max-w-none">
                  <button
                    onClick={hookHandleScanAgain}
                    className="bg-orange-500 text-white px-10 py-4 rounded-xl font-bold hover:bg-orange-600 transition-all font-korean shadow-lg w-full min-h-[48px]"
                  >
                    {t('btn_scan_again_simple')}
                  </button>
                  <button
                    onClick={() => handleReset(false)}
                    className={`px-10 py-4 rounded-xl font-bold border transition-all font-korean w-full min-h-[48px] ${isNight ? 'bg-zinc-900 border-white/10 text-zinc-400 hover:text-white' : 'bg-zinc-100 border-zinc-200 text-zinc-500 hover:text-zinc-800'}`}
                  >
                    {t('btn_retake')}
                  </button>
                </div>
              </div>
            )}

            {analysisState.status === 'complete' && analysisState.showHandwritingWarning && (
              <div className="flex flex-col items-center justify-center flex-1 text-center p-6 animate-fade-in pt-24">
                <div className="text-6xl md:text-7xl mb-6">📝</div>
                <h3
                  className={`text-2xl font-bold ${isNight ? 'text-white' : 'text-zinc-900'} mb-2 font-korean`}
                >
                  {language === 'ko' ? '글씨를 인식하기 어려워요' : 'Handwriting Unclear'}
                </h3>
                <div className="space-y-2 mb-8 max-w-md mx-auto">
                  <p
                    className={`${isNight ? 'text-zinc-400' : 'text-zinc-650'} font-korean leading-relaxed`}
                  >
                    {language === 'ko'
                      ? '작성된 글씨가 너무 흐리거나 알아보기 힘듭니다. AI가 채점을 시도하겠지만 결과가 부정확할 수 있습니다.'
                      : 'The handwriting on this worksheet is very messy or faded. Chekki tried its best, but the grading might be inaccurate.'}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 w-full max-w-xs sm:max-w-none justify-center">
                  <button
                    onClick={() =>
                      setAnalysisState((prev) => ({ ...prev, showHandwritingWarning: false }))
                    }
                    className="bg-orange-500 text-white px-10 py-4 rounded-xl font-bold hover:bg-orange-600 transition-all font-korean shadow-lg min-h-[48px] w-full sm:w-auto"
                  >
                    {language === 'ko' ? '그래도 진행하기' : 'Proceed Anyway'}
                  </button>
                  <button
                    onClick={() => handleReset(false)}
                    className={`px-10 py-4 rounded-xl font-bold border transition-all font-korean w-full sm:w-auto min-h-[48px] ${isNight ? 'bg-zinc-900 border-white/10 text-zinc-400 hover:text-white' : 'bg-zinc-100 border-zinc-200 text-zinc-500 hover:text-zinc-800'}`}
                  >
                    {t('btn_retake')}
                  </button>
                </div>
              </div>
            )}

            {analysisState.status === 'complete' &&
              !analysisState.showHandwritingWarning &&
              analysisState.data && (
                <div className="animate-fade-in-up flex flex-col pt-4 pb-4">
                  <div className="flex flex-row items-center justify-between gap-4 mb-4 shrink-0">
                    <div className="flex items-center gap-3 min-w-0">
                      <h2
                        className={`text-sm md:text-2xl font-black font-korean tracking-tight truncate ${isNight ? 'text-white' : 'text-zinc-850'}`}
                      >
                        {language === 'ko'
                          ? analysisState.data.worksheet_summary?.title_ko || '제목 없음'
                          : analysisState.data.worksheet_summary?.title_en || 'Untitled'}
                      </h2>
                      {user?.plan === 'pro' && (
                        <span className="bg-orange-500/20 text-orange-400 border border-orange-500/30 text-[8px] md:text-[9px] font-black px-2 py-0.5 rounded-full tracking-widest">
                          PRO
                        </span>
                      )}
                    </div>

                    {/* Duplicate Scan button removed here as it's now in the header for better visibility */}
                  </div>

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
        {!isLocked && (
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
              color: #ff2e97; /* more vibrant pink */
              font-style: italic;
              font-weight: 700;
            }
            .prose-answer mark {
              background: linear-gradient(120deg, rgba(6, 182, 212, 0.2) 0%, rgba(59, 130, 246, 0.1) 100%);
              color: #22d3ee; /* cyan-400 */
              padding: 0 4px;
              border-radius: 4px;
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
