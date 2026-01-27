
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
type TextSize = 'sm' | 'md' | 'lg';

export const WorksheetOverlay: React.FC<Props> = ({ imageUrl, items, focusedId, className, isLoadingItems = false }) => {
  const { user, setShowPaywall } = useAuth();
  const { t, language } = useLanguage();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('fit');
  const [textSize, setTextSize] = useState<TextSize>('md');
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (imgRef.current && imgRef.current.complete) {
      setImageLoaded(true);
    }
  }, [imageUrl]);

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

  const getTextClasses = () => {
    switch(textSize) {
      case 'sm': return 'text-[10px] md:text-sm px-2 py-1';
      case 'lg': return 'text-lg md:text-3xl px-4 py-3';
      default: return 'text-sm md:text-xl px-3 py-2';
    }
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
      className={`relative transform-gpu transition-all duration-500 ease-in-out flex items-center justify-center ${
        isFullscreen 
          ? viewMode === 'fit' ? 'h-full w-auto max-h-full' : 'w-full max-w-4xl mx-auto' 
          : 'w-full min-h-[300px]'
      }`}
    >
      <div className="relative">
        <img 
            ref={imgRef}
            src={imageUrl} 
            alt="Worksheet" 
            className={`block transition-all duration-1000 ease-in-out ${
            imageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105 blur-lg'
            } ${
            isFullscreen && viewMode === 'fit' ? 'max-h-[calc(100vh-140px)] w-auto object-contain' : 'w-full h-auto'
            }`}
            onLoad={() => setImageLoaded(true)}
            draggable={false}
            loading="eager"
        />
        
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
                    rounded-xl md:rounded-2xl shadow-2xl border-2 border-white/20 flex items-center gap-2 md:gap-3 transform transition-all hover:scale-105 active:scale-95 group cursor-pointer min-w-fit max-w-[150px] md:max-w-[400px]
                    ${isFocused ? 'bg-orange-600 ring-4 ring-orange-500/20' : 'bg-zinc-800 ring-1 ring-white/10'}
                    ${getTextClasses()}
                `}>
                    <div className="w-4 h-4 md:w-6 md:h-6 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                        <span className="font-black text-[8px] md:text-xs text-white">{item.id}</span>
                    </div>
                    <span className={`font-hand font-bold leading-tight tracking-tight text-white whitespace-normal break-words break-keep text-left drop-shadow-md`}>
                    {item.correct_answer}
                    </span>
                    <span className="text-[10px] md:text-lg shrink-0 opacity-50 group-hover:opacity-100 transition-opacity">🔊</span>
                </div>
            </div>
            );
        })}
      </div>
    </div>
  );

  return (
    <>
      <div className={`w-full flex flex-col bg-zinc-950 rounded-[2.5rem] border border-white/5 overflow-hidden relative shadow-[0_40px_100px_rgba(0,0,0,0.6)] transition-all duration-700 ${className || 'h-full'}`}>
        
        <div className="absolute top-4 right-4 z-50">
            <button 
              onClick={() => setIsFullscreen(true)}
              className="w-12 h-12 rounded-2xl bg-black/60 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white hover:bg-orange-600 transition-all shadow-2xl group active:scale-90"
              title="Full Screen Focus"
            >
              <svg className="w-6 h-6 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
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

      {/* FULL SCREEN MODAL */}
      {isFullscreen && (
        <div className="fixed inset-0 z-[200] flex flex-col bg-[#050505] animate-fade-in overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent pointer-events-none"></div>
          
          {/* Header Controls */}
          <div className="relative z-[220] pt-[env(safe-area-inset-top)] bg-zinc-900/95 backdrop-blur-3xl border-b border-white/10 shadow-2xl shrink-0">
            <div className="h-20 px-4 md:px-8 flex items-center justify-between">
                
                {/* Size Controls */}
                <div className="flex bg-black/40 p-1 rounded-xl border border-white/5">
                    {(['sm', 'md', 'lg'] as TextSize[]).map((size) => (
                        <button 
                            key={size}
                            onClick={() => setTextSize(size)}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${textSize === size ? 'bg-orange-600 text-white shadow-lg' : 'text-zinc-500 hover:text-white'}`}
                        >
                            {size}
                        </button>
                    ))}
                </div>

                {/* View Toggles */}
                <div className="hidden sm:flex bg-black/40 p-1 rounded-xl border border-white/5">
                    <button 
                        onClick={() => setViewMode('fit')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${viewMode === 'fit' ? 'bg-indigo-600 text-white shadow-lg' : 'text-zinc-500 hover:text-white'}`}
                    >
                        <span className="text-[10px] font-black uppercase">{language === 'ko' ? '맞춤' : 'Fit'}</span>
                    </button>
                    <button 
                        onClick={() => setViewMode('fill')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${viewMode === 'fill' ? 'bg-indigo-600 text-white shadow-lg' : 'text-zinc-500 hover:text-white'}`}
                    >
                        <span className="text-[10px] font-black uppercase">{language === 'ko' ? '확대' : 'Zoom'}</span>
                    </button>
                </div>

                {/* Visible Close Button */}
                <button 
                    onClick={() => setIsFullscreen(false)}
                    className="w-12 h-12 bg-red-600 hover:bg-red-700 text-white flex items-center justify-center rounded-2xl shadow-xl transition-all active:scale-90"
                    aria-label="Exit Full Screen"
                >
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
          </div>

          <div className={`flex-1 overflow-auto custom-scrollbar overscroll-contain flex justify-center ${viewMode === 'fit' ? 'items-center p-4' : 'items-start p-4 md:p-12'}`}>
             <OverlayContent />
          </div>

          {/* Floating Mobile Exit Button (Ensures they can ALWAYS exit) */}
          <button 
            onClick={() => setIsFullscreen(false)}
            className="sm:hidden fixed bottom-10 right-6 z-[300] w-16 h-16 bg-red-600 rounded-full flex items-center justify-center text-white shadow-2xl shadow-black ring-4 ring-white/10 active:scale-95"
          >
            <span className="text-3xl font-black">✕</span>
          </button>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
      `}</style>
    </>
  );
};
