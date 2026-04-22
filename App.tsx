
import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { CameraView } from './components/CameraView';
import { LoadingScreen } from './components/LoadingScreen';
import { SplitView } from './components/SplitView';
import { DebugConsole } from './components/DebugConsole';
import { SplashScreen } from './components/SplashScreen';
import { MobileAppBanner } from './components/MobileAppBanner';
import { BottomNav, TabID } from './components/BottomNav';
import { HelpView } from './components/HelpView';

// Lazy loaded modals for performance
const PaywallModal = React.lazy(() => import('./components/PaywallModal').then(module => ({ default: module.PaywallModal })));
const OdapNoteModal = React.lazy(() => import('./components/OdapNoteModal').then(module => ({ default: module.OdapNoteModal })));
const LoginModal = React.lazy(() => import('./components/LoginModal').then(module => ({ default: module.LoginModal })));
const LegalModal = React.lazy(() => import('./components/LegalModal').then(module => ({ default: module.LegalModal })));
const ProgressiveOnboardingModal = React.lazy(() => import('./components/ProgressiveOnboardingModal').then(module => ({ default: module.ProgressiveOnboardingModal })));
import SubscribePage from './src/pages/SubscribePage';
import AdminPage from './src/pages/AdminPage';
import { AnalysisState, LegalType } from './types';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { MistakeProvider } from './contexts/MistakeContext';
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
          <h1 className="text-2xl font-black text-white mb-4 font-display">Something went wrong.</h1>
          <button
            onClick={() => window.location.reload()}
            className="bg-orange-500 text-white px-8 py-4 rounded-2xl font-black shadow-lg hover:bg-orange-600 transition-all active:scale-95"
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
  return hour >= 22 || hour < 7;
};

const getInitialTheme = () => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('chekki_theme');
    if (saved) return saved === 'dark';
    // Time-based: night between 22:00 and 07:00
    return isNightTime();
  }
  return true; // Default to dark mode
};

// Returns ms until the next theme-transition boundary (22:00 → night, 07:00 → day).
const msUntilNextTransition = (): number => {
  const now = new Date();
  const hour = now.getHours();
  const min = now.getMinutes();
  const sec = now.getSeconds();
  const ms = now.getMilliseconds();

  const totalMs = ((hour * 60 + min) * 60 + sec) * 1000 + ms;
  const nightStart = 22 * 60 * 60 * 1000; // 22:00 in ms
  const dayStart  =  7 * 60 * 60 * 1000;  // 07:00 in ms
  const dayMs = 24 * 60 * 60 * 1000;

  if (totalMs < dayStart) {
    // Currently night (after midnight). Next transition = 07:00 today.
    return dayStart - totalMs;
  } else if (totalMs < nightStart) {
    // Currently day. Next transition = 22:00 today.
    return nightStart - totalMs;
  } else {
    // Currently night (after 22:00). Next transition = 07:00 tomorrow.
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
  const { user, openLoginModal, isAuthenticated, incrementScan, checkScanLimit, setShowPaywall, isLoading: isAuthLoading } = useAuth();
  const { t, language } = useLanguage();
  const isInApp = useInAppBrowser();

  const {
    analysisState,
    setAnalysisState,
    handleImageSelected: baseHandleImageSelected,
    handleScanAgain: hookHandleScanAgain,
    executeReset: hookExecuteReset
  } = useWorksheetAnalysis();

  const [isNight, setIsNight] = useState(getInitialTheme());
  const [showInAppNotice, setShowInAppNotice] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  const [showChildProfileModal, setShowChildProfileModal] = useState(false);
  const [standaloneLegal, setStandaloneLegal] = useState<LegalType | null>(null);
  const [showSubscribePage, setShowSubscribePage] = useState(false);
  const [showAdminPage, setShowAdminPage] = useState(false);
  const [activeTab, setActiveTab] = useState<TabID>('scan');
  const platform = Capacitor.getPlatform();

  // Always scroll to the top of the page when switching tabs or going back
  const switchTab = React.useCallback((tab: TabID) => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    setActiveTab(tab);
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

    // Handle return from password reset
    const params = new URLSearchParams(window.location.search);
    if (params.get('auth_action') === 'reset') {
      // Clear the query parameter from the URL to prevent message appearing on refresh
      window.history.replaceState({}, '', window.location.pathname);
      setSuccessDialog(language === 'ko' ? "비밀번호가 성공적으로 변경되었습니다. 이제 로그인해주세요!" : "Password successfully updated. You can now log in!");
      setTimeout(openLoginModal, 1500);
    }
  }, [language, openLoginModal]);


  useEffect(() => {
    // Initialize RevenueCat
    revenueCatService.initialize();

    // --- Time-based auto night mode ---
    // Switches to night at 22:00 and back to day at 07:00 (local time).
    // If the user has manually set a preference in Settings it is respected,
    // but cleared at each threshold so the schedule resumes from that point.
    let themeTimer: ReturnType<typeof setTimeout>;

    const scheduleNextTransition = () => {
      const delay = msUntilNextTransition();
      themeTimer = setTimeout(() => {
        // At boundary: clear any manual override and apply time-based theme
        localStorage.removeItem('chekki_theme');
        setIsNight(isNightTime());
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
    db.logUserEvent("app_open");

    if (analysisState.status === 'idle') {
      const saved = localStorage.getItem(SESSION_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          const isFresh = parsed.timestamp && (Date.now() - parsed.timestamp < 10 * 60 * 1000);
          if (isFresh && parsed.state && parsed.state.status === 'complete') {
            setAnalysisState(parsed.state);
          }
        } catch (e) {
          localStorage.removeItem(SESSION_KEY);
        }
      }
    }
  }, [analysisState.status, setAnalysisState]);

  // Confetti fires only when analysis genuinely completes — not on upload
  useEffect(() => {
    if (analysisState.status === 'complete') {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [analysisState.status]);

  const handleImageSelected = async (base64Data: string) => {
    await baseHandleImageSelected(base64Data);
  };

  const translateError = (msg: string) => {
    if (msg.includes('OFFLINE_ERROR')) return language === 'ko' ? "인터넷 연결을 확인해주세요." : "Please check your internet connection.";
    if (msg.includes('NETWORK_ERROR')) return language === 'ko' ? "서버에 연결할 수 없습니다. 시뮬레이터 설정을 확인해주세요." : "Cannot connect to server. Check simulator setup.";
    if (msg.includes('UNAUTHORIZED')) return language === 'ko' ? "로그인이 필요합니다. 다시 로그인해주세요." : "Authorization failed. Please log out and log back in.";
    if (msg.includes('API_KEY_MISSING')) return language === 'ko' ? "서버 설정 오류입니다. 관리자에게 문의하세요." : "Server configuration error. Please contact support.";
    if (msg.includes('ANALYSIS_FAILED') && msg.length > 'ANALYSIS_FAILED'.length) return msg; // show details
    return msg;
  };

  const handleScanAgain = () => {
    // Scroll to top whenever the user exits back to the scan/home screen
    window.scrollTo({ top: 0, behavior: 'instant' });
    handleReset(true);
  };

  const handleReset = (confirm = true) => {
    if (confirm && analysisState.status === 'complete') {
      setConfirmDialog({
        title: language === 'ko' ? "현재 결과가 삭제됩니다. 계속하시겠습니까?" : "Current results will be removed. Do you want to continue?",
        confirmText: language === 'ko' ? "결과 삭제 (처음으로)" : "Discard Results & Exit",
        cancelText: language === 'ko' ? "취소" : "Cancel",
        onConfirm: () => {
          hookExecuteReset();
          setConfirmDialog(null);
        }
      });
      return;
    }
    hookExecuteReset();
  };


  if (showSplash) return <SplashScreen onFinish={handleSplashFinish} />;
  if (showSubscribePage && platform === 'web') return <SubscribePage />;
  if (showAdminPage && platform === 'web') return <AdminPage />;

  return (
    <ErrorBoundary>
      <div className={`min-h-[100dvh] ${isNight ? 'bg-[#030305] text-zinc-100' : 'bg-[#FAFAFB] text-zinc-900'} font-sans overflow-x-hidden transition-colors duration-500 flex flex-col`}>
        <React.Suspense fallback={null}>
          {standaloneLegal && (
            <div className="fixed inset-0 z-[200]">
              <LegalModal type={standaloneLegal} onClose={() => setStandaloneLegal(null)} isStandalone={true} />
            </div>
          )}
        </React.Suspense>
        <Header 
          onReset={() => handleReset(true)} 
          isNight={isNight}
          setIsNight={setIsNight}
          onOpenHelp={() => {
            if (analysisState.status !== 'idle') {
              handleReset(false);
            }
            switchTab('help');
          }}
        />
        {/* Web-only mobile download banner */}
        {platform === 'web' && (
          <React.Suspense fallback={null}>
            <MobileAppBanner />
          </React.Suspense>
        )}
        <React.Suspense fallback={null}>
          <PaywallModal isNight={isNight} />
          <OdapNoteModal isNight={isNight} />
          <LoginModal isNight={isNight} />

          {showChildProfileModal && (
            <ProgressiveOnboardingModal 
              onComplete={() => setShowChildProfileModal(false)}
              onSkip={() => {
                sessionStorage.setItem('skipped_child_profile', 'true');
                setShowChildProfileModal(false);
              }}
              isNight={isNight}
            />
          )}
        </React.Suspense>

        {confirmDialog && (
          <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setConfirmDialog(null)}></div>
            <div className={`relative ${isNight ? 'bg-zinc-900 border-white/10' : 'bg-white border-zinc-200 shadow-2xl'} border rounded-[2.5rem] p-8 max-w-sm w-full text-center animate-fade-in-up`}>
              <p className={`${isNight ? 'text-white' : 'text-zinc-900'} font-black text-lg mb-6 font-korean uppercase tracking-tight`}>{confirmDialog.title}</p>
              <div className="flex flex-col gap-3">

                <button onClick={confirmDialog.onConfirm} disabled={confirmDialog.isSaving} className={`w-full ${isNight ? 'bg-white text-black' : 'bg-zinc-900 text-white shadow-lg shadow-zinc-900/20'} py-4 rounded-2xl font-black uppercase text-xs transition-all active:scale-95 disabled:opacity-50`}>
                  {confirmDialog.confirmText || "Yes"}
                </button>
                <button onClick={() => setConfirmDialog(null)} disabled={confirmDialog.isSaving} className={`w-full ${isNight ? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700' : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'} py-4 rounded-2xl font-black uppercase text-xs transition-all active:scale-95 disabled:opacity-50`}>
                  {confirmDialog.cancelText || "No"}
                </button>
              </div>
            </div>
          </div>
        )}

        {successDialog && (
          <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 md:p-6">
            <div className="absolute inset-0 bg-black/95 backdrop-blur-xl" onClick={() => setSuccessDialog(null)}></div>
            <div className="relative bg-zinc-900 border border-emerald-500/30 rounded-[2.5rem] p-8 md:p-10 max-w-md w-full text-center shadow-[0_0_100px_rgba(16,185,129,0.1)] animate-fade-in-up">
              <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl">✅</span>
              </div>
              <p className="text-white font-bold text-lg mb-8 font-korean leading-relaxed">{successDialog}</p>
              <button onClick={() => setSuccessDialog(null)} className="w-full bg-emerald-500 text-white py-4 rounded-2xl font-black uppercase text-xs shadow-xl shadow-emerald-500/20">Close</button>
            </div>
          </div>
        )}

        {showConfetti && (
          <div className="fixed inset-0 z-[100] pointer-events-none flex items-center justify-center">
            {[...Array(40)].map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 rounded-full animate-[confetti_3s_ease-out_forwards]"
                style={{
                  backgroundColor: ['#F97316', '#EC4899', '#8B5CF6', '#FCD34D'][i % 4],
                  left: '50%',
                  top: '50%',
                  '--tx': `${(Math.random() - 0.5) * 600}px`,
                  '--ty': `${(Math.random() - 0.7) * 400}px`,
                  animationDelay: `${Math.random() * 0.5}s`
                } as any}
              ></div>
            ))}
          </div>
        )}

        <main className={`flex-1 max-w-7xl mx-auto w-full p-4 md:p-6 pb-[max(1rem,env(safe-area-inset-bottom))] flex flex-col ${analysisState.status === 'idle' ? 'pt-24 md:pt-40' : 'pt-4 md:pt-8'}`}>

          {analysisState.status === 'idle' && (
            <div className="animate-fade-in flex-1 h-full flex flex-col">
              {activeTab === 'scan' ? (
                <>
                  {isInApp && showInAppNotice && (
                    <div className="fixed top-24 left-4 right-4 z-[60] bg-orange-600 text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between animate-fade-in-up border border-white/20 backdrop-blur-md">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">⚠️</span>
                        <p className="text-[10px] md:text-xs font-bold font-korean leading-tight">
                          {language === 'ko'
                            ? "더 원활한 기능을 위해 'Safari' 또는 'Chrome'으로 열어주세요."
                            : "Open in Safari or Chrome for the best experience (Camera/Mic)."}
                        </p>
                      </div>
                      <button onClick={() => setShowInAppNotice(false)} className="text-white/60 p-1 ml-2">✕</button>
                    </div>
                  )}
                  {isAuthLoading ? (
                    <div className="flex items-center justify-center min-h-[50vh]">
                      <div className="w-8 h-8 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
                    </div>
                  ) : (
                    <CameraView isNight={isNight} onImageSelected={(data) => handleImageSelected(data)} minimal onOpenHelp={() => switchTab('help')} />
                  )}
                </>
              ) : activeTab === 'help' ? (
                <HelpView isNight={isNight} onClose={() => switchTab('scan')} />
              ) : null}
            </div>
          )}

          {analysisState.status === 'analyzing' && (
            <div className="animate-fade-in flex-1 h-full flex flex-col">
              <LoadingScreen isNight={isNight} onCancel={() => handleReset(false)} />
            </div>
          )}

          {analysisState.status === 'error' && (
            <div className="flex flex-col items-center justify-center flex-1 text-center p-6 animate-fade-in pt-24">
              <div className="w-40 h-40 md:w-52 md:h-52 bg-red-950/20 rounded-full flex items-center justify-center mb-10 border border-red-500/30 relative overflow-hidden">
                <img src="https://res.cloudinary.com/dginphpy4/image/upload/v1765769939/chekki-scan_sqo9sz.png" alt="Chekki" className="w-36 h-36 md:w-48 md:h-48 object-contain" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2 font-korean">{t('error_title')}</h3>
              <div className="space-y-2 mb-8 max-w-md mx-auto">
                <p className="text-zinc-400 font-korean leading-relaxed">
                  {translateError(analysisState.errorMessage || "")}
                </p>
                {analysisState.errorMessage && (analysisState.errorMessage.includes('NETWORK_ERROR') || analysisState.errorMessage.includes('ANALYSIS_FAILED') || analysisState.errorMessage.includes('UNAUTHORIZED')) && (
                  <p className="text-[10px] text-zinc-600 font-mono break-all opacity-50">
                    {analysisState.errorMessage}
                  </p>
                )}
              </div>
              <div className="flex flex-col sm:flex-row gap-4 w-full max-w-xs sm:max-w-none">
                <button onClick={handleScanAgain} className="bg-orange-500 text-white px-10 py-4 rounded-xl font-bold hover:bg-orange-600 transition-all font-korean shadow-lg w-full min-h-[48px]">
                  {t('btn_scan_again_simple')}
                </button>
                <button onClick={() => handleReset(false)} className={`px-10 py-4 rounded-xl font-bold border transition-all font-korean w-full min-h-[48px] ${isNight ? 'bg-zinc-900 border-white/10 text-zinc-400 hover:text-white' : 'bg-zinc-100 border-zinc-200 text-zinc-500 hover:text-zinc-800'}`}>
                  {t('btn_retake')}
                </button>
              </div>
            </div>
          )}

          {analysisState.status === 'complete' && analysisState.data && (
            <div className="animate-fade-in-up flex flex-col flex-1 pt-16 md:pt-28 pb-4 overflow-hidden">
              <div className="flex flex-row items-center justify-between gap-4 mb-4 shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  <h2 className="text-sm md:text-2xl font-black text-white font-korean tracking-tight truncate">
                    {language === 'ko' ? (analysisState.data.worksheet_summary?.title_ko || "제목 없음") : (analysisState.data.worksheet_summary?.title_en || "Untitled")}
                  </h2>
                  {user?.plan === 'pro' && (
                    <span className="bg-orange-500/20 text-orange-400 border border-orange-500/30 text-[8px] md:text-[9px] font-black px-2 py-0.5 rounded-full tracking-widest">PRO</span>
                  )}
                </div>

                {/* Duplicate Scan button removed here as it's now in the header for better visibility */}
              </div>

              <div className="flex-1 min-h-0">
                <SplitView
                  imageUrl={analysisState.originalImage!}
                  items={analysisState.data.items || []}
                  isLoadingItems={!analysisState.isItemsLoaded}
                  worksheetTitle={language === 'ko' ? analysisState.data.worksheet_summary?.title_ko : analysisState.data.worksheet_summary?.title_en}
                  onScanAgain={handleScanAgain}
                  onClose={handleScanAgain}
                  isNight={isNight}
                  onConfirm={(opts) => setConfirmDialog(opts)}
                  data={analysisState.data}
                />
              </div>
            </div>
          )}
        </main>

        {/* --- PROFESSIONAL BUSINESS FOOTER --- */}
        <footer className={`w-full ${isNight ? 'bg-zinc-950/50 border-white/5' : 'bg-white border-zinc-100 shadow-[0_-20px_50px_rgba(0,0,0,0.02)]'} border-t py-12 px-6`}>
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
                  <ChekkiMascot className="w-8 h-8 text-white" mood="happy" />
                </div>
                <h2 className={`text-2xl font-black ${isNight ? 'text-white' : 'text-zinc-900'} font-display`}>Chekki<span className="text-orange-500">AI</span></h2>
              </div>
              <p className="text-zinc-500 text-xs font-medium leading-relaxed max-w-sm">
                {language === 'ko'
                  ? "채키 AI는 부모님과 아이들의 즐거운 학습 경험을 위해 최선을 다합니다. 혁신적인 AI 기술로 숙제와 공부가 더 즐거워지는 세상을 만듭니다."
                  : "Chekki AI is dedicated to creating joyful learning experiences for parents and children through innovative AI technology."}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div className="space-y-3">
                <h4 className={`text-xs font-black ${isNight ? 'text-white' : 'text-zinc-900'} uppercase tracking-[0.2em]`}>{language === 'ko' ? '사업자 정보' : 'Business Info'}</h4>
                <div className="space-y-1.5 text-[10px] md:text-xs text-zinc-500 font-medium">
                  <p><span className="text-zinc-600 font-bold">{language === 'ko' ? '상호:' : 'Biz:'}</span> 채키 AI (Chekki AI)</p>
                  <p><span className="text-zinc-600 font-bold">{language === 'ko' ? '사업자번호:' : 'Reg No:'}</span> 814-14-03096</p>
                </div>
              </div>
              <div className="space-y-3">
                <h4 className={`text-xs font-black ${isNight ? 'text-white opacity-40' : 'text-zinc-400'} uppercase tracking-[0.2em]`}>{language === 'ko' ? '고객 센터' : 'Contact Us'}</h4>
                <div className="space-y-1.5 text-[10px] md:text-xs text-zinc-500 font-medium font-korean">
                  <p><span className="text-zinc-600 font-bold">{language === 'ko' ? '이메일:' : 'Email:'}</span> chekkihelp@gmail.com</p>
                </div>
              </div>
            </div>
          </div>
          <div className="max-w-7xl mx-auto mt-12 pt-6 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-[10px] md:text-xs text-zinc-600 font-bold uppercase tracking-widest">© 2026 CHEKKI AI. ALL RIGHTS RESERVED.</p>
            <div className="flex gap-4 md:gap-6">
              <button onClick={() => setStandaloneLegal('privacy')} className="text-[10px] md:text-xs text-zinc-600 hover:text-orange-500 font-bold uppercase tracking-widest transition-colors">Privacy</button>
              <button onClick={() => setStandaloneLegal('terms')} className="text-[10px] md:text-xs text-zinc-600 hover:text-orange-500 font-bold uppercase tracking-widest transition-colors">Terms</button>
              <button onClick={() => setStandaloneLegal('support')} className="text-[10px] md:text-xs text-zinc-600 hover:text-orange-500 font-bold uppercase tracking-widest transition-colors">Support</button>
              <button onClick={() => setStandaloneLegal('refund')} className="text-[10px] md:text-xs text-zinc-600 hover:text-orange-500 font-bold uppercase tracking-widest transition-colors">Refund</button>
            </div>
          </div>
        </footer>

        <BottomNav 
          activeTab={activeTab} 
          onTabChange={switchTab} 
          isVisible={analysisState.status === 'idle'} 
          isNight={isNight}
          isAuthenticated={isAuthenticated}
          openLoginModal={openLoginModal}
        />

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
        <MistakeProvider>
          <AppContent />
        </MistakeProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
