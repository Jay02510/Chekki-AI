
import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { CameraView } from './components/CameraView';
import { LoadingScreen } from './components/LoadingScreen';
import { WorksheetOverlay } from './components/WorksheetOverlay';
import { SplitView } from './components/SplitView';
import { PaywallModal } from './components/PaywallModal';
import { OnboardingTour } from './components/OnboardingTour';
import { OdapNoteModal } from './components/OdapNoteModal';
import { LoginModal } from './components/LoginModal';
import { RewardOverlay } from './components/RewardOverlay';
import { ChekkiMascot } from './components/Icons';
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
  const [lastImageData, setLastImageData] = useState<string | null>(null);

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

    setLastImageData(base64Data);
    const displayUrl = `data:image/jpeg;base64,${base64Data}`;
    setAnalysisState({ status: 'analyzing', data: null, originalImage: displayUrl, errorMessage: null, showReward: false });

    try {
      const result: any = await analyzeWorksheet(base64Data, isRetryAttempt);
      
      if (result.error === "ANALYSIS_FAILED") {
         throw new Error("API_ERROR");
      } else {
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
      }
    } catch (error: any) {
      console.error("[App] Analysis process failed. Check Vercel logs and API_KEY environment variable.");
      // Ensure user NEVER sees technical setup errors like "Missing API Key"
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
      handleReset();
    }
  };

  const handleReset = () => {
    if (analysisState.status === 'complete') {
        if (!window.confirm(t('err_confirm'))) return;
    }
    setAnalysisState({ status: 'idle', data: null, originalImage: null, errorMessage: null, showReward: false });
    setLastImageData(null);
    localStorage.removeItem(SESSION_KEY);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans overflow-x-hidden">
      <Header onReset={handleReset} />
      <PaywallModal />
      <OdapNoteModal />
      <LoginModal />
      
      {showOnboarding && <OnboardingTour onComplete={() => setShowOnboarding(false)} />}

      <main className="max-w-7xl mx-auto p-4 md:p-6 pb-0 h-screen flex flex-col">
        {analysisState.status === 'idle' && (
          <div className="animate-fade-in flex-1">
            <CameraView onImageSelected={(data) => handleImageSelected(data, false)} />
          </div>
        )}

        {analysisState.status === 'analyzing' && <LoadingScreen onCancel={handleReset} />}

        {analysisState.status === 'error' && (
           <div className="flex flex-col items-center justify-center flex-1 text-center p-6 animate-fade-in pt-24">
             <div className="w-32 h-32 md:w-40 md:h-40 bg-red-950/20 rounded-full flex items-center justify-center mb-10 border border-red-500/30 relative">
               <ChekkiMascot className="w-20 h-20 md:w-28 md:h-28" mood="thinking" />
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
               <button onClick={handleReset} className="bg-white text-black px-10 py-4 rounded-xl font-bold hover:bg-zinc-200 transition-all transform active:scale-95 font-korean shadow-lg">
                 {t('btn_retake')}
               </button>
             </div>
           </div>
        )}

        {analysisState.status === 'complete' && analysisState.data && (
          <div className="animate-fade-in-up flex flex-col h-full pt-20 md:pt-24 pb-4">
            <div className="flex flex-row items-center justify-between gap-4 mb-4 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                 <h2 className="text-xl md:text-2xl font-black text-white font-korean tracking-tight truncate">
                    {language === 'ko' ? analysisState.data.worksheet_summary?.title_ko : analysisState.data.worksheet_summary?.title_en}
                 </h2>
              </div>
              
              <div className="flex items-center gap-2 shrink-0">
                  <button onClick={handleReset} className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-xl border border-zinc-700 transition-all shadow-xl flex items-center gap-2 group active:scale-95">
                    <span className="text-lg group-hover:rotate-12 transition-transform">📸</span> 
                    <span className="hidden sm:inline text-xs font-black uppercase tracking-widest">{t('ws_scan_again')}</span>
                  </button>

                  <div className="flex bg-zinc-900 p-1 rounded-xl border border-zinc-800 shadow-inner">
                    <button onClick={() => setViewMode('overlay')} className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${viewMode === 'overlay' ? 'bg-zinc-700 text-white shadow-md' : 'text-zinc-500 hover:text-zinc-300'}`}>
                      {t('ws_overlay')}
                    </button>
                    <button onClick={() => setViewMode('split')} className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${viewMode === 'split' ? 'bg-zinc-700 text-white shadow-md' : 'text-zinc-500 hover:text-zinc-300'}`}>
                      {t('ws_list')}
                    </button>
                  </div>
              </div>
            </div>

            <div className="flex-1 min-h-0">
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
