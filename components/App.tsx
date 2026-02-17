import React, { useState, useEffect, useRef } from 'react';
import { Header } from './Header';
import { CameraView } from './CameraView';
import { LoadingScreen } from './LoadingScreen';
import { SplitView } from './SplitView';
import { PaywallModal } from './PaywallModal';
import { OnboardingTour } from './OnboardingTour';
import { OdapNoteModal } from './OdapNoteModal';
import { LoginModal } from './LoginModal';
import { SplashScreen } from './SplashScreen';
import { AnalysisState, LegalType } from '../types';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { LanguageProvider, useLanguage } from '../contexts/LanguageContext';
import { MistakeProvider } from '../contexts/MistakeContext';
import { ChekkiMascot } from './Icons';
import { analyzeWorksheet } from '../services/geminiService';

const SESSION_KEY = 'hw_last_session';
const ONBOARDED_KEY = 'chekki_onboarded_v1';
const GUEST_SCAN_KEY = 'chekki_guest_scan_used';

interface EBProps {
  children?: React.ReactNode;
}

interface EBState {
  hasError: boolean;
}

/**
 * ErrorBoundary class component.
 * Fixed by adding constructor to correctly initialize props and state for TypeScript.
 */
class ErrorBoundary extends React.Component<EBProps, EBState> {
  // Define constructor to correctly initialize props and state
  constructor(props: EBProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() { 
    return { hasError: true }; 
  }

  render() {
    // Access state and props via destructuring to ensure correct typed access
    const { hasError } = this.state;
    const { children } = this.props;

    if (hasError) {
      return (
        <div className="fixed inset-0 bg-zinc-950 flex flex-col items-center justify-center p-6 text-center">
          <ChekkiMascot className="w-32 h-32 mb-8" mood="thinking" />
          <h1 className="text-2xl font-black text-white mb-4">Something went wrong.</h1>
          <button onClick={() => window.location.reload()} className="bg-orange-500 text-white px-8 py-4 rounded-2xl font-black shadow-lg">Reload App</button>
        </div>
      );
    }
    // Return children via destructured variable
    return children;
  }
}

const isNightModeKST = () => {
  const now = new Date();
  const kstTime = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Seoul',
    hour: 'numeric',
    hour12: false,
  }).format(now);
  const hour = parseInt(kstTime, 10);
  return hour >= 22 || hour < 6;
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
  const { user, openLoginModal, isAuthenticated, incrementScan } = useAuth();
  const { t, language } = useLanguage();
  const isInApp = useInAppBrowser();
  
  const [isNight, setIsNight] = useState(isNightModeKST());
  const [showInAppNotice, setShowInAppNotice] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [analysisState, setAnalysisState] = useState<AnalysisState>({
    status: 'idle',
    data: { worksheet_summary: { title_en: "", title_ko: "", overview_ko: "" }, items: [] },
    originalImage: null,
    errorMessage: null,
    showReward: false,
    isSummaryLoaded: false,
    isItemsLoaded: false
  });
  
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [lastImageData, setLastImageData] = useState<string | null>(null);

  // Global Confirmation State
  const [confirmDialog, setConfirmDialog] = useState<{title: string, onConfirm: () => void} | null>(null);

  // AbortController to prevent stale fetches
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const path = window.location.pathname.replace('/', '') as LegalType;
    if (['terms', 'privacy', 'refund', 'youth'].includes(path)) {
      setShowSplash(false);
    }
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setIsNight(isNightModeKST());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const hasOnboarded = localStorage.getItem(ONBOARDED_KEY);
    if (!hasOnboarded) setShowOnboarding(true);
  }, []);

  const handleOnboardingComplete = () => {
    localStorage.setItem(ONBOARDED_KEY, 'true');
    setShowOnboarding(false);
  };

  useEffect(() => {
    if (analysisState.status === 'idle') {
      const saved = localStorage.getItem(SESSION_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          const isFresh = parsed.timestamp && (Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000);
          if (isFresh && parsed.state && parsed.state.status === 'complete') {
             setAnalysisState(parsed.state);
          }
        } catch(e) {
          localStorage.removeItem(SESSION_KEY);
        }
      }
    }
  }, []);

  const handleImageSelected = async (base64Data: string, isRetryAttempt = false) => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const guestUsed = localStorage.getItem(GUEST_SCAN_KEY);
    
    if (!isAuthenticated && guestUsed) {
      openLoginModal();
      return;
    }

    if (isAuthenticated && !isRetryAttempt) {
      const canScan = await incrementScan();
      if (!canScan) return; 
    }

    const displayUrl = `data:image/jpeg;base64,${base64Data}`;
    setLastImageData(base64Data);
    
    setAnalysisState({ 
        status: 'analyzing', 
        data: null, 
        originalImage: displayUrl, 
        errorMessage: null, 
        showReward: false,
        isSummaryLoaded: false,
        isItemsLoaded: false
    });

    try {
        const result = await analyzeWorksheet(base64Data, controller.signal, user?.plan || 'free');
        
        if (!isAuthenticated) {
          localStorage.setItem(GUEST_SCAN_KEY, 'true');
        }

        const newState: AnalysisState = {
            status: 'complete',
            data: result,
            originalImage: displayUrl,
            errorMessage: null,
            showReward: false,
            isSummaryLoaded: true,
            isItemsLoaded: true
        };

        setAnalysisState(newState);
        localStorage.setItem(SESSION_KEY, JSON.stringify({ state: newState, timestamp: Date.now() }));
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3000);

    } catch (e: any) {
        if (e.name === 'AbortError') return;
        setAnalysisState({ 
            status: 'error', 
            errorMessage: t('err_network'),
            data: null,
            originalImage: displayUrl,
            isSummaryLoaded: false,
            isItemsLoaded: false
        });
    }
  };

  const handleScanAgain = () => {
    if (lastImageData) handleImageSelected(lastImageData, true);
    else handleReset(false);
  };

  const handleReset = (confirm = true) => {
    if (confirm && analysisState.status === 'complete') {
        setConfirmDialog({
            title: t('err_confirm'),
            onConfirm: () => {
                executeReset();
                setConfirmDialog(null);
            }
        });
        return;
    }
    executeReset();
  };

  const executeReset = () => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
    setAnalysisState({ 
        status: 'idle', 
        data: null, 
        originalImage: null, 
        errorMessage: null, 
        showReward: false,
        isSummaryLoaded: false,
        isItemsLoaded: false
    });
    setLastImageData(null);
    localStorage.removeItem(SESSION_KEY);
  };

  if (showSplash) return <SplashScreen onFinish={() => setShowSplash(false)} />;

  return (
    <ErrorBoundary>
        <div className={`min-h-[100dvh] ${isNight ? 'bg-[#030305]' : 'bg-zinc-950'} text-zinc-100 font-sans overflow-x-hidden transition-colors duration-1000 flex flex-col`}>
        <Header onReset={() => handleReset(false)} />
        <PaywallModal />
        <OdapNoteModal />
        <LoginModal />
        
        {showOnboarding && <OnboardingTour onComplete={handleOnboardingComplete} />}

        {confirmDialog && (
            <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setConfirmDialog(null)}></div>
                <div className="relative bg-zinc-900 border border-white/10 rounded-3xl p-8 max-sm w-full text-center animate-fade-in-up">
                    <p className="text-white font-bold text-lg mb-8 font-korean">{confirmDialog.title}</p>
                    <div className="flex gap-4">
                        <button onClick={() => setConfirmDialog(null)} className="flex-1 bg-zinc-800 text-zinc-400 py-4 rounded-2xl font-black uppercase text-xs">No</button>
                        <button onClick={confirmDialog.onConfirm} className="flex-1 bg-white text-black py-4 rounded-2xl font-black uppercase text-xs shadow-xl">Yes</button>
                    </div>
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

        <main className={`flex-1 max-w-7xl mx-auto w-full p-4 md:p-6 pb-[max(1rem,env(safe-area-inset-bottom))] flex flex-col ${analysisState.status === 'idle' ? 'pt-20 md:pt-32' : 'pt-2 md:pt-4'}`}>
            
            {analysisState.status === 'idle' && isInApp && showInAppNotice && (
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

            {analysisState.status === 'idle' && (
            <div className="animate-fade-in flex-1">
                <CameraView isNight={isNight} onImageSelected={(data) => handleImageSelected(data, false)} />
            </div>
            )}

            {analysisState.status === 'analyzing' && <LoadingScreen isNight={isNight} onCancel={() => handleReset(false)} />}

            {analysisState.status === 'error' && (
            <div className="flex flex-col items-center justify-center flex-1 text-center p-6 animate-fade-in pt-24">
                <div className="w-32 h-32 md:w-40 md:h-40 bg-red-950/20 rounded-full flex items-center justify-center mb-10 border border-red-500/30 relative">
                <ChekkiMascot className="w-20 h-20 md:w-28 md:h-28" mood={isNight ? "sleeping" : "thinking"} />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2 font-korean">{t('error_title')}</h3>
                <p className="text-zinc-400 mb-8 max-w-md mx-auto font-korean leading-relaxed">
                {analysisState.errorMessage}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 w-full max-w-xs sm:max-w-none">
                <button onClick={handleScanAgain} className="bg-orange-500 text-white px-10 py-4 rounded-xl font-bold hover:bg-orange-600 transition-all font-korean shadow-lg w-full min-h-[48px]">
                    {t('btn_scan_again_simple')}
                </button>
                <button onClick={() => handleReset(false)} className="bg-white text-black px-10 py-4 rounded-xl font-bold hover:bg-zinc-200 transition-all font-korean shadow-lg w-full min-h-[48px]">
                    {t('btn_retake')}
                </button>
                </div>
            </div>
            )}

            {analysisState.status === 'complete' && analysisState.data && (
            <div className="animate-fade-in-up flex flex-col flex-1 pt-12 md:pt-24 pb-4 overflow-hidden">
                <div className="flex flex-row items-center justify-between gap-4 mb-4 shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                    <h2 className="text-sm md:text-2xl font-black text-white font-korean tracking-tight truncate">
                        {language === 'ko' ? (analysisState.data.worksheet_summary?.title_ko || "제목 없음") : (analysisState.data.worksheet_summary?.title_en || "Untitled")}
                    </h2>
                    {user?.plan === 'pro' && (
                    <span className="bg-orange-500/20 text-orange-400 border border-orange-500/30 text-[8px] md:text-[9px] font-black px-2 py-0.5 rounded-full tracking-widest">PRO</span>
                    )}
                </div>
                
                <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => handleReset(true)} className="bg-zinc-800 hover:bg-zinc-700 text-white px-3 py-2 md:px-4 md:py-2 rounded-xl border border-zinc-700 transition-all shadow-xl flex items-center gap-2 group active:scale-95 min-h-[44px]">
                        <span className="text-lg">📸</span> 
                        <span className="hidden sm:inline text-[10px] font-black uppercase tracking-widest">{t('ws_scan_again')}</span>
                    </button>
                </div>
                </div>

                <div className="flex-1 min-h-0">
                    <SplitView 
                        imageUrl={analysisState.originalImage!} 
                        items={analysisState.data.items || []} 
                        isLoadingItems={!analysisState.isItemsLoaded}
                        worksheetTitle={language === 'ko' ? analysisState.data.worksheet_summary?.title_ko : analysisState.data.worksheet_summary?.title_en}
                    />
                </div>
            </div>
            )}
        </main>
        
        <style>{`
            @keyframes confetti {
            0% { opacity: 1; transform: translate(0, 0) scale(1) rotate(0deg); }
            100% { opacity: 0; transform: translate(var(--tx), var(--ty)) scale(0.5) rotate(360deg); }
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