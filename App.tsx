
import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { CameraView } from './components/CameraView';
import { LoadingScreen } from './components/LoadingScreen';
import { WorksheetOverlay } from './components/WorksheetOverlay';
import { SplitView } from './components/SplitView';
import { PaywallModal } from './components/PaywallModal';
import { OnboardingTour } from './components/OnboardingTour';
import { OdapNoteModal } from './components/OdapNoteModal';
import { LoginModal } from './components/LoginModal';
import { analyzeWorksheet } from './services/geminiService';
import { AnalysisState, WorksheetAnalysis, WorkspaceMode } from './types';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { MistakeProvider } from './contexts/MistakeContext';
import { ChekkiMascot } from './components/Icons';

const SESSION_KEY = 'hw_last_session';

const isNightModeKST = () => {
  const now = new Date();
  const kstTime = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Seoul',
    hour: 'numeric',
    hour12: false,
  }).format(now);
  const hour = parseInt(kstTime, 10);
  // Night mode between 10 PM (22:00) and 6 AM (06:00)
  return hour >= 22 || hour < 6;
};

// Hook for detecting restricted in-app browsers common in Korea
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
  const [analysisState, setAnalysisState] = useState<AnalysisState>({
    status: 'idle',
    data: null,
    originalImage: null,
    errorMessage: null,
    showReward: false,
  });
  
  const [viewMode, setViewMode] = useState<WorkspaceMode>('overlay');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [lastImageData, setLastImageData] = useState<string | null>(null);

  // Sync night mode on mount and potentially interval
  useEffect(() => {
    const timer = setInterval(() => {
      setIsNight(isNightModeKST());
    }, 60000); // Check every minute
    return () => clearInterval(timer);
  }, []);

  // Sync analysis state with auth state: reset to landing if logged out
  useEffect(() => {
    if (!isAuthenticated && analysisState.status !== 'idle') {
      setAnalysisState({ status: 'idle', data: null, originalImage: null, errorMessage: null, showReward: false });
      localStorage.removeItem(SESSION_KEY);
    }
  }, [isAuthenticated]);

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
    if (!isAuthenticated) {
      openLoginModal();
      return;
    }

    if (!isRetryAttempt) {
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
        showReward: false 
    });

    try {
      const result: any = await analyzeWorksheet(base64Data, isRetryAttempt);
      
      if (!result || result.error === "ANALYSIS_FAILED") {
         throw new Error("API_ERROR");
      }

      const formattedData: WorksheetAnalysis = {
          worksheet_summary: result.worksheet_summary || { title_en: "Worksheet", title_ko: "워크시트" },
          items: Array.isArray(result) ? result : (result.items || [])
      };

      const newState: AnalysisState = {
        status: 'complete',
        data: formattedData,
        originalImage: displayUrl,
        errorMessage: null,
        showReward: false, 
      };

      setAnalysisState(newState);
      setViewMode('overlay');

      localStorage.setItem(SESSION_KEY, JSON.stringify({
        state: newState,
        timestamp: Date.now()
      }));
      
    } catch (error: any) {
      console.error("[App] Analysis failed:", error);
      setAnalysisState({ 
        status: 'error', 
        data: null, 
        originalImage: null, 
        errorMessage: t('err_network'), 
        showReward: false 
      });
    }
  };

  const handleScanAgain = () => {
    if (lastImageData) {
      handleImageSelected(lastImageData, true);
    } else {
      handleReset(false);
    }
  };

  const handleReset = (confirm = true) => {
    if (confirm && analysisState.status === 'complete') {
        if (!window.confirm(t('err_confirm'))) return;
    }
    setAnalysisState({ status: 'idle', data: null, originalImage: null, errorMessage: null, showReward: false });
    setLastImageData(null);
    localStorage.removeItem(SESSION_KEY);
  };

  return (
    <div className={`min-h-screen ${isNight ? 'bg-[#030305]' : 'bg-zinc-950'} text-zinc-100 font-sans overflow-x-hidden transition-colors duration-1000`}>
      <Header onReset={() => handleReset(false)} />
      <PaywallModal />
      <OdapNoteModal />
      <LoginModal />
      
      {showOnboarding && <OnboardingTour onComplete={() => setShowOnboarding(false)} />}

      <main className={`max-w-7xl mx-auto p-4 md:p-6 pb-0 min-h-screen flex flex-col ${analysisState.status === 'idle' ? 'pt-20 md:pt-32' : ''}`}>
        
        {/* In-App Browser Warning Banner for Korean Users */}
        {analysisState.status === 'idle' && isInApp && showInAppNotice && (
            <div className="fixed top-20 left-4 right-4 z-[60] bg-brand-orange text-white p-3 rounded-2xl shadow-2xl flex items-center justify-between animate-fade-in-up border border-white/20">
                <div className="flex items-center gap-3">
                    <span className="text-xl">⚠️</span>
                    <p className="text-[11px] md:text-xs font-bold font-korean leading-tight">
                        {language === 'ko' 
                           ? "현재 인앱 브라우저를 사용 중입니다. 더 원활한 스캔을 위해 'Safari' 또는 'Chrome'으로 열어주세요." 
                           : "Restricted browser detected. Please open in Safari or Chrome for full AI functionality."}
                    </p>
                </div>
                <button onClick={() => setShowInAppNotice(false)} className="text-white/60 p-1">✕</button>
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
               <div className="absolute top-0 right-0 bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold shadow-lg animate-bounce">!</div>
             </div>
             <h3 className="text-2xl font-bold text-white mb-2 font-korean">{t('error_title')}</h3>
             <p className="text-zinc-400 mb-8 max-w-md mx-auto font-korean leading-relaxed">
               {analysisState.errorMessage}
             </p>
             <div className="flex flex-col sm:flex-row gap-4">
               <button onClick={handleScanAgain} className="bg-orange-500 text-white px-10 py-4 rounded-xl font-bold hover:bg-orange-600 transition-all transform active:scale-95 font-korean shadow-lg">
                 {t('btn_scan_again_simple')}
               </button>
               <button onClick={() => handleReset(false)} className="bg-white text-black px-10 py-4 rounded-xl font-bold hover:bg-zinc-200 transition-all transform active:scale-95 font-korean shadow-lg">
                 {t('btn_retake')}
               </button>
             </div>
           </div>
        )}

        {analysisState.status === 'complete' && analysisState.data && (
          <div className="animate-fade-in-up flex flex-col flex-1 pt-14 md:pt-24 pb-4">
            <div className="flex flex-row items-center justify-between gap-4 mb-4 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                 <h2 className="text-lg md:text-2xl font-black text-white font-korean tracking-tight truncate">
                    {language === 'ko' ? analysisState.data.worksheet_summary?.title_ko : analysisState.data.worksheet_summary?.title_en}
                 </h2>
              </div>
              
              <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => handleReset(true)} className="bg-zinc-800 hover:bg-zinc-700 text-white px-3 py-1.5 md:px-4 md:py-2 rounded-xl border border-zinc-700 transition-all shadow-xl flex items-center gap-2 group active:scale-95">
                    <span className="text-base md:text-lg group-hover:rotate-12 transition-transform">📸</span> 
                    <span className="hidden sm:inline text-xs font-black uppercase tracking-widest">{t('ws_scan_again')}</span>
                  </button>

                  <div className="flex bg-zinc-900 p-1 rounded-xl border border-zinc-800 shadow-inner">
                    <button onClick={() => setViewMode('overlay')} className={`px-2.5 py-1.5 md:px-4 md:py-2 rounded-lg text-[10px] md:text-xs font-black transition-all ${viewMode === 'overlay' ? 'bg-zinc-700 text-white shadow-md' : 'text-zinc-500 hover:text-zinc-300'}`}>
                      {t('ws_overlay')}
                    </button>
                    <button onClick={() => setViewMode('split')} className={`px-2.5 py-1.5 md:px-4 md:py-2 rounded-lg text-[10px] md:text-xs font-black transition-all ${viewMode === 'split' ? 'bg-zinc-700 text-white shadow-md' : 'text-zinc-500 hover:text-zinc-300'}`}>
                      {t('ws_list')}
                    </button>
                  </div>
              </div>
            </div>

            <div className="flex-1 min-h-[400px]">
              {viewMode === 'overlay' ? (
                <WorksheetOverlay 
                  imageUrl={analysisState.originalImage!} 
                  items={analysisState.data.items || []} 
                  className="h-full"
                />
              ) : (
                <SplitView imageUrl={analysisState.originalImage!} items={analysisState.data.items || []} />
              )}
            </div>
          </div>
        )}
      </main>
    </div>
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
