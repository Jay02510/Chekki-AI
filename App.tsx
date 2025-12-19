
import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { CameraView } from './components/CameraView';
import { LoadingScreen } from './components/LoadingScreen';
import { WorksheetOverlay } from './components/WorksheetOverlay';
import { SplitView } from './components/SplitView';
import { PaywallModal } from './components/PaywallModal';
import { OnboardingTour } from './components/OnboardingTour';
import { SplashScreen } from './components/SplashScreen';
import { OdapNoteModal } from './components/OdapNoteModal';
import { LoginModal } from './components/LoginModal';
import { RewardOverlay } from './components/RewardOverlay';
import { analyzeWorksheet } from './services/geminiService';
import { AnalysisState, WorksheetAnalysis, WorkspaceMode } from './types';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { MistakeProvider } from './contexts/MistakeContext';

const SESSION_KEY = 'hw_last_session';

function AppContent() {
  const { user, openLoginModal, isAuthenticated, incrementScan } = useAuth();
  const { t, language } = useLanguage();
  
  const [analysisState, setAnalysisState] = useState<AnalysisState>({
    status: 'idle',
    data: null,
    originalImage: null,
    errorMessage: null,
    showReward: false,
  });
  
  const [viewMode, setViewMode] = useState<WorkspaceMode>('overlay');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    if (!showSplash && analysisState.status === 'idle') {
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
  }, [showSplash]);

  useEffect(() => {
     if (analysisState.status === 'complete' && analysisState.data) {
        try {
           localStorage.setItem(SESSION_KEY, JSON.stringify({
              state: analysisState,
              timestamp: Date.now()
           }));
        } catch (e) {}
     }
  }, [analysisState]);

  useEffect(() => {
    if (!showSplash && isAuthenticated) {
       const visited = localStorage.getItem('hw_onboarding_done');
       if (!visited) setShowOnboarding(true);
    }
  }, [showSplash, isAuthenticated]);

  const handleImageSelected = async (base64Data: string) => {
    if (!isAuthenticated) {
      openLoginModal();
      return;
    }

    if (!incrementScan()) return; 

    const displayUrl = `data:image/jpeg;base64,${base64Data}`;
    setAnalysisState({ status: 'analyzing', data: null, originalImage: displayUrl, errorMessage: null, showReward: false });

    try {
      const result: WorksheetAnalysis = await analyzeWorksheet(base64Data);
      
      if (result.error && result.error !== "API_ERROR_FALLBACK") {
         setAnalysisState({
            status: 'error',
            data: null,
            originalImage: null,
            errorMessage: result.message_ko ?? "Unknown error.",
            showReward: false
         });
      } else {
        setAnalysisState({
          status: 'complete',
          data: result,
          originalImage: displayUrl,
          errorMessage: result.error ? (result.message_ko ?? "API Error") : null,
          showReward: true, // Trigger Reward
        });
        setViewMode('overlay');
      }
    } catch (error) {
      setAnalysisState({ status: 'error', data: null, originalImage: null, errorMessage: "Network error.", showReward: false });
    }
  };

  const handleReset = () => {
    if (analysisState.status === 'complete') {
        const msg = language === 'ko' 
            ? "⚠️ 경고: 이미지가 사라집니다. 계속하시겠습니까?"
            : "⚠️ Warning: Image will be lost. Continue?";
        if (!window.confirm(msg)) return;
    }
    setAnalysisState({ status: 'idle', data: null, originalImage: null, errorMessage: null, showReward: false });
    localStorage.removeItem(SESSION_KEY);
  };

  if (showSplash) return <SplashScreen onFinish={() => setShowSplash(false)} />;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans">
      <Header onReset={handleReset} />
      <PaywallModal />
      <OdapNoteModal />
      <LoginModal />
      {analysisState.showReward && (
          <RewardOverlay 
            onClose={() => setAnalysisState(prev => ({ ...prev, showReward: false }))} 
            score={analysisState.data?.worksheet_summary?.total_score || 100}
          />
      )}
      {showOnboarding && <OnboardingTour onComplete={() => setShowOnboarding(false)} />}

      <main className="max-w-6xl mx-auto p-4 md:p-6 pb-0">
        {analysisState.status === 'idle' && (
          <div className="animate-fade-in pb-32">
            <CameraView onImageSelected={handleImageSelected} />
          </div>
        )}

        {analysisState.status === 'analyzing' && <LoadingScreen />}

        {analysisState.status === 'error' && (
           <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-6 animate-fade-in pt-24">
             <div className="w-24 h-24 bg-red-900/20 rounded-full flex items-center justify-center mb-6 border border-red-500/30 relative">
               <span className="text-5xl">👓</span>
               <span className="absolute top-0 right-0 text-3xl">⚠️</span>
             </div>
             <h3 className="text-2xl font-bold text-white mb-2 font-korean">{t('error_title')}</h3>
             <p className="text-zinc-400 mb-8 max-w-md mx-auto font-korean leading-relaxed">
               {analysisState.errorMessage}
             </p>
             <button onClick={handleReset} className="bg-zinc-800 text-white px-8 py-3 rounded-xl font-bold hover:bg-zinc-700 transition-colors border border-zinc-700 font-korean">
               {t('btn_retake')}
             </button>
           </div>
        )}

        {analysisState.status === 'complete' && analysisState.data && (
          <div className="animate-fade-in-up pt-24 md:pt-28">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
              <div className="flex-1">
                 <h2 className="text-2xl font-bold text-white font-korean tracking-tight">
                    {language === 'ko' ? analysisState.data.worksheet_summary?.title_ko : analysisState.data.worksheet_summary?.title_en}
                 </h2>
                 {analysisState.data.worksheet_summary?.total_score && (
                     <div className="inline-flex items-center gap-2 bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-lg text-xs font-bold mt-2">
                        <span>⭐</span> Score: {analysisState.data.worksheet_summary.total_score}
                     </div>
                 )}
              </div>
              
              <div className="flex items-center gap-3">
                  <button onClick={handleReset} className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-xl font-bold border border-zinc-700 transition-all flex items-center gap-2 shadow-sm hover:border-orange-500/50 group">
                    <span className="group-hover:rotate-12 transition-transform text-lg">📸</span> 
                    <span className="hidden md:inline text-sm font-korean">{t('ws_scan_again')}</span>
                  </button>

                  <div className="flex bg-zinc-900 p-1 rounded-xl border border-zinc-800 shrink-0 shadow-inner">
                    <button onClick={() => setViewMode('overlay')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${viewMode === 'overlay' ? 'bg-zinc-700 text-white shadow-md' : 'text-zinc-500 hover:text-zinc-300'}`}>
                      <span className="text-lg">🔍</span>{t('ws_overlay')}
                    </button>
                    <button onClick={() => setViewMode('split')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${viewMode === 'split' ? 'bg-zinc-700 text-white shadow-md' : 'text-zinc-500 hover:text-zinc-300'}`}>
                      <span className="text-lg">📄</span>{t('ws_list')}
                    </button>
                  </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-zinc-900 to-zinc-900 border border-zinc-800 rounded-xl p-5 mb-8 flex items-start gap-4 shadow-sm relative overflow-hidden group">
              <div className="bg-orange-500/20 p-3 rounded-full"><span className="text-3xl">📝</span></div>
              <div>
                <h4 className="text-orange-500 font-bold text-xs uppercase mb-1 tracking-wider font-korean">{t('ws_summary_title')}</h4>
                <p className="text-zinc-200 leading-relaxed font-korean text-lg font-medium">
                  "{language === 'ko' ? analysisState.data.worksheet_summary?.overview_ko : analysisState.data.worksheet_summary?.overview_en}"
                </p>
              </div>
            </div>

            <div className="mb-24">
              {viewMode === 'overlay' ? (
                <WorksheetOverlay 
                  imageUrl={analysisState.originalImage!} 
                  items={analysisState.data.items || []} 
                  className="h-[calc(100vh-250px)]"
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
