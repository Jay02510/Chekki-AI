
import React, { useState, useRef, useEffect } from 'react';
import { WorksheetItem } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

interface Props {
  imageUrl: string;
  items: WorksheetItem[];
  isInteractive?: boolean;
  focusedId?: number | null; 
  className?: string;
  isLoadingItems?: boolean;
}

type ViewMode = 'fit' | 'fill';

export const WorksheetOverlay: React.FC<Props> = ({ imageUrl, items, focusedId, className, isLoadingItems = false }) => {
  const { user, setShowPaywall } = useAuth();
  const { t, language } = useLanguage();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('fill');
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (imgRef.current && imgRef.current.complete) {
      setImageLoaded(true);
    }
  }, [imageUrl]);

  // Handle ESC key to exit fullscreen
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsFullscreen(false);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  const getStyle = (item: WorksheetItem) => {
    const box = item.bounding_box;
    if (!box) return { display: 'none' };
    
    const top = Math.min(Math.max((box.ymin / 1000) * 100, 2), 95);
    const left = Math.min(Math.max((box.xmin / 1000) * 100, 5), 85);

    return {
      top: `${top}%`,
      left: `${left}%`,
      zIndex: 10 + (item.id || 0), 
      transform: 'translate3d(0, 0, 0)', 
      willChange: 'transform, opacity'
    };
  };

  const playAudio = (text: string) => {
    if (user?.plan !== 'pro') {
      setShowPaywall(true);
      return;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  const OverlayContent = () => (
    <div 
      ref={containerRef} 
      className={`relative transform-gpu transition-all duration-500 ease-in-out ${
        isFullscreen 
          ? viewMode === 'fit' ? 'h-full w-auto' : 'w-full max-w-4xl mx-auto' 
          : 'w-full min-h-[300px]'
      }`}
    >
      <img 
        ref={imgRef}
        src={imageUrl} 
        alt="Worksheet" 
        className={`block transition-all duration-1000 ease-in-out ${
          imageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105 blur-lg'
        } ${
          isFullscreen && viewMode === 'fit' ? 'h-full w-auto object-contain' : 'w-full h-auto'
        }`}
        onLoad={() => setImageLoaded(true)}
        draggable={false}
        loading="eager"
      />
      
      {isLoadingItems && imageLoaded && !isFullscreen && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[60] bg-orange-600 text-white px-6 py-2.5 rounded-full flex items-center gap-3 shadow-[0_20px_40px_rgba(234,88,12,0.4)] animate-bounce border border-white/20 backdrop-blur-xl">
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            <span className="text-xs font-black uppercase tracking-[0.2em]">{t('ws_finding_questions')}</span>
        </div>
      )}

      {imageLoaded && items && items.map((item) => {
        const isFocused = focusedId === null || focusedId === undefined || item.id === focusedId;
        const displayText = `${item.id}. ${item.correct_answer}`;
        
        return (
          <div
            key={item.id}
            style={getStyle(item)}
            className={`absolute transition-all duration-500 pointer-events-auto animate-fade-in ${isFocused ? 'opacity-100 scale-100' : 'opacity-20 scale-90 blur-[1px]'}`}
            onClick={(e) => { e.stopPropagation(); playAudio(displayText); }}
          >
             <div className={`
                px-3 py-1.5 md:px-5 md:py-2.5 rounded-2xl shadow-2xl border-2 border-white/20 flex items-center gap-3 transform transition-all hover:scale-110 active:scale-95 group cursor-pointer min-w-fit max-w-[220px] md:max-w-[450px]
                ${isFocused ? 'bg-orange-600 ring-4 ring-orange-500/20' : 'bg-zinc-800 ring-1 ring-white/10'}
                ${isFocused && focusedId ? 'animate-[ping_1.5s_cubic-bezier(0,0,0.2,1)_1]' : ''}
             `}>
                <div className="w-5 h-5 md:w-6 md:h-6 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                    <span className="font-black text-[10px] md:text-xs text-white">{item.id}</span>
                </div>
                <span className={`font-hand font-bold leading-tight tracking-tight text-white whitespace-normal break-words break-keep text-left drop-shadow-md ${isFullscreen ? 'text-lg md:text-2xl' : 'text-sm md:text-xl'}`}>
                  {item.correct_answer}
                </span>
                <span className="text-xs md:text-lg shrink-0 opacity-50 group-hover:opacity-100 transition-opacity">🔊</span>
             </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <>
      <div className={`w-full flex flex-col bg-zinc-950 rounded-[2.5rem] border border-white/5 overflow-hidden relative shadow-[0_40px_100px_rgba(0,0,0,0.6)] transition-all duration-700 ${className || 'h-full'}`}>
        
        {/* Worksheet Header Actions (Normal View) */}
        <div className="absolute top-4 right-4 z-50 flex gap-2">
            <button 
              onClick={() => setIsFullscreen(true)}
              className="w-10 h-10 rounded-xl bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-orange-500 transition-all shadow-xl group"
              title="Full Screen Focus"
            >
              <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            </button>
        </div>

        <div className="flex-1 relative overflow-y-auto custom-scrollbar overscroll-contain">
          <div className="relative w-full transform-gpu">
            {!imageLoaded && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900/40 backdrop-blur-2xl min-h-[400px]">
                 <div className="w-16 h-16 border-4 border-orange-500/10 border-t-orange-500 rounded-full animate-spin mb-6"></div>
                 <p className="text-zinc-500 text-xs font-black uppercase tracking-[0.2em] animate-pulse">Scanning Canvas...</p>
              </div>
            )}
            <OverlayContent />
          </div>
        </div>
        
        <div className="bg-zinc-900/60 backdrop-blur-3xl px-6 py-4 border-t border-white/5 flex justify-center shrink-0">
           <p className="text-zinc-500 text-[10px] font-black font-korean tracking-[0.2em] uppercase">{t('ws_voice_guide')}</p>
        </div>
      </div>

      {/* FULL SCREEN PORTAL UI */}
      {isFullscreen && (
        <div className="fixed inset-0 z-[200] flex flex-col bg-[#050505] animate-fade-in overflow-hidden pt-[env(safe-area-inset-top)]">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-purple-500/5 pointer-events-none"></div>
          
          {/* Fullscreen Header */}
          <div className="h-16 md:h-20 bg-black/60 backdrop-blur-3xl border-b border-white/5 px-4 md:px-6 flex items-center justify-between z-50 shrink-0">
             <div className="flex items-center gap-3">
                <button 
                  onClick={() => setIsFullscreen(false)}
                  className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-2 rounded-xl text-white font-black text-[10px] uppercase tracking-widest transition-all active:scale-95"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
                  </svg>
                  <span>{language === 'ko' ? '뒤로' : 'Back'}</span>
                </button>
                <div className="hidden sm:block w-px h-6 bg-white/10 mx-2"></div>
                <div className="hidden sm:block">
                   <h2 className="text-white font-black text-sm md:text-base font-display leading-tight">{language === 'ko' ? '집중 모드' : 'Focus Mode'}</h2>
                   <p className="text-zinc-500 text-[9px] font-bold uppercase tracking-widest">{items.length} AI Answers</p>
                </div>
             </div>

             {/* View Controls */}
             <div className="flex bg-white/5 border border-white/10 p-1 rounded-2xl">
                <button 
                  onClick={() => setViewMode('fit')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all ${viewMode === 'fit' ? 'bg-orange-600 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
                  title="Fit Page to Screen"
                >
                   <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5" />
                   </svg>
                   <span className="text-[10px] font-black uppercase hidden md:inline">{language === 'ko' ? '전체보기' : 'Fit'}</span>
                </button>
                <button 
                  onClick={() => setViewMode('fill')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all ${viewMode === 'fill' ? 'bg-orange-600 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
                  title="Full Detail (Scrollable)"
                >
                   <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                   </svg>
                   <span className="text-[10px] font-black uppercase hidden md:inline">{language === 'ko' ? '확대보기' : 'Fill'}</span>
                </button>
             </div>

             <button 
                onClick={() => setIsFullscreen(false)}
                className="w-10 h-10 flex items-center justify-center text-zinc-500 hover:text-white transition-colors"
                aria-label="Exit"
             >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
             </button>
          </div>

          {/* Fullscreen Main Area */}
          <div className={`flex-1 overflow-auto custom-scrollbar overscroll-contain flex justify-center ${viewMode === 'fit' ? 'items-center p-2' : 'items-start p-4 md:p-12'}`}>
             <OverlayContent />
          </div>

          {/* Bottom Control Bar for Mobile */}
          <div className="md:hidden safe-bottom pb-8 flex justify-center z-50 pointer-events-none">
             <div className="bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-full px-4 py-2 flex items-center gap-2 shadow-2xl pointer-events-auto ring-1 ring-white/5">
                <button 
                  onClick={() => setIsFullscreen(false)}
                  className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white active:scale-90 transition-transform"
                >
                   ✕
                </button>
                <div className="w-px h-6 bg-white/10 mx-1"></div>
                <button 
                   onClick={() => setViewMode(viewMode === 'fit' ? 'fill' : 'fit')}
                   className="px-4 py-2 rounded-full bg-orange-600 text-white text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all"
                >
                   {viewMode === 'fit' ? (language === 'ko' ? '확대' : 'Fill') : (language === 'ko' ? '축소' : 'Fit')}
                </button>
             </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes markerPulse {
          0% { transform: scale(1) translate3d(0, 0, 0); }
          50% { transform: scale(1.03) translate3d(0, -2px, 0); }
          100% { transform: scale(1) translate3d(0, 0, 0); }
        }
        .safe-bottom {
          padding-bottom: calc(env(safe-area-inset-bottom) + 1rem);
        }
      `}</style>
    </>
  );
};
