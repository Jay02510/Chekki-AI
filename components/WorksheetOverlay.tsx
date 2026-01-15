
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

export const WorksheetOverlay: React.FC<Props> = ({ imageUrl, items, focusedId, className, isLoadingItems = false }) => {
  const { user, setShowPaywall } = useAuth();
  const { t } = useLanguage();
  const [imageLoaded, setImageLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (imgRef.current && imgRef.current.complete) {
      setImageLoaded(true);
    }
  }, [imageUrl]);

  const getStyle = (item: WorksheetItem) => {
    const box = item.bounding_box;
    if (!box) return { display: 'none' };
    
    const top = (box.ymin / 1000) * 100;
    const left = (box.xmin / 1000) * 100;

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

  return (
    <div className={`w-full flex flex-col bg-zinc-950 rounded-[2.5rem] border border-white/5 overflow-hidden relative shadow-[0_40px_100px_rgba(0,0,0,0.6)] transition-all duration-700 ${className || 'h-full'}`}>
      <div className="flex-1 relative overflow-y-auto custom-scrollbar overscroll-contain">
        <div ref={containerRef} className="relative w-full min-h-[300px] transform-gpu">
          <img 
            ref={imgRef}
            src={imageUrl} 
            alt="Worksheet" 
            className={`w-full h-auto block transition-all duration-1000 ease-in-out ${imageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105 blur-lg'}`}
            onLoad={() => setImageLoaded(true)}
            draggable={false}
            loading="eager"
            // @ts-ignore
            fetchpriority="high"
          />
          
          {isLoadingItems && imageLoaded && (
            <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[60] bg-orange-600 text-white px-6 py-2.5 rounded-full flex items-center gap-3 shadow-[0_20px_40px_rgba(234,88,12,0.4)] animate-bounce border border-white/20 backdrop-blur-xl">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span className="text-xs font-black uppercase tracking-[0.2em]">{t('ws_finding_questions')}</span>
            </div>
          )}

          {!imageLoaded && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900/40 backdrop-blur-2xl">
               <div className="w-16 h-16 border-4 border-orange-500/10 border-t-orange-500 rounded-full animate-spin mb-6"></div>
               <p className="text-zinc-500 text-xs font-black uppercase tracking-[0.2em] animate-pulse">Scanning Canvas...</p>
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
                    animate-[markerPulse_3s_infinite]
                 `}>
                    <div className="w-5 h-5 md:w-6 md:h-6 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                        <span className="font-black text-[10px] md:text-xs text-white">{item.id}</span>
                    </div>
                    <span className="font-hand font-bold text-sm md:text-xl leading-tight tracking-tight text-white whitespace-normal break-words break-keep text-left drop-shadow-md">
                      {item.correct_answer}
                    </span>
                    <span className="text-xs md:text-lg shrink-0 opacity-50 group-hover:opacity-100 transition-opacity">🔊</span>
                 </div>
              </div>
            );
          })}
        </div>
      </div>
      
      <div className="bg-zinc-900/60 backdrop-blur-3xl px-6 py-4 border-t border-white/5 flex justify-center shrink-0">
         <p className="text-zinc-500 text-[10px] font-black font-korean tracking-[0.2em] uppercase">{t('ws_voice_guide')}</p>
      </div>

      <style>{`
        @keyframes markerPulse {
          0% { transform: scale(1) translate3d(0, 0, 0); }
          50% { transform: scale(1.03) translate3d(0, -2px, 0); }
          100% { transform: scale(1) translate3d(0, 0, 0); }
        }
      `}</style>
    </div>
  );
};
