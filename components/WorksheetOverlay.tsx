
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
    <div className={`w-full flex flex-col bg-zinc-950 rounded-2xl border border-zinc-800 overflow-hidden relative shadow-2xl transition-all duration-500 ${className || 'h-full'}`}>
      <div className="flex-1 relative overflow-y-auto custom-scrollbar bg-black/40 overscroll-contain">
        <div ref={containerRef} className="relative w-full min-h-[300px] transform-gpu">
          <img 
            ref={imgRef}
            src={imageUrl} 
            alt="Worksheet" 
            className={`w-full h-auto block transition-opacity duration-1000 ease-in-out ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setImageLoaded(true)}
            draggable={false}
            loading="eager"
            // @ts-ignore
            fetchpriority="high"
          />
          
          {isLoadingItems && imageLoaded && (
            <div className="absolute top-4 right-4 z-[60] bg-orange-600 text-white px-3 py-1.5 rounded-full flex items-center gap-2 shadow-2xl animate-bounce">
                <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span className="text-[10px] font-black uppercase tracking-widest">Finding Questions...</span>
            </div>
          )}

          {!imageLoaded && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900/80 backdrop-blur-sm">
               <div className="w-12 h-12 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin mb-4"></div>
               <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest animate-pulse">Developing Canvas...</p>
            </div>
          )}

          {imageLoaded && items && items.map((item) => {
            const isFocused = focusedId === null || focusedId === undefined || item.id === focusedId;
            // No longer stripping letters/numbers. We show the full text extracted.
            const displayText = `${item.id}. ${item.correct_answer}`;
            
            return (
              <div
                key={item.id}
                style={getStyle(item)}
                className={`absolute transition-all duration-500 pointer-events-auto animate-fade-in ${isFocused ? 'opacity-100 scale-100' : 'opacity-10 scale-90'}`}
                onClick={(e) => { e.stopPropagation(); playAudio(displayText); }}
              >
                 <div className={`bg-orange-600 text-white px-2 py-1 md:px-4 md:py-2 rounded-xl shadow-[0_10px_40px_rgba(234,88,12,0.4)] border-2 border-white/20 flex items-center gap-2 transform transition-all hover:scale-110 active:scale-95 group cursor-pointer ring-4 ring-orange-500/10 min-w-fit max-w-[200px] md:max-w-[400px] animate-[markerPulse_2s_infinite]`}>
                    <span className="font-display font-black text-[10px] md:text-base leading-tight tracking-tight whitespace-normal break-words break-keep text-left">
                      {displayText}
                    </span>
                    <span className="text-[10px] md:text-xs shrink-0 opacity-70 group-hover:opacity-100 transition-opacity">🔊</span>
                 </div>
              </div>
            );
          })}
        </div>
      </div>
      
      <div className="bg-zinc-900/95 backdrop-blur-md px-6 py-2.5 border-t border-white/5 flex justify-center shrink-0">
         <p className="text-zinc-500 text-[9px] md:text-xs font-black font-korean tracking-widest uppercase">{t('ws_voice_guide')}</p>
      </div>

      <style>{`
        @keyframes markerPulse {
          0% { box-shadow: 0 10px 40px rgba(234,88,12,0.4); }
          50% { box-shadow: 0 10px 50px rgba(234,88,12,0.6); }
          100% { box-shadow: 0 10px 40px rgba(234,88,12,0.4); }
        }
      `}</style>
    </div>
  );
};
