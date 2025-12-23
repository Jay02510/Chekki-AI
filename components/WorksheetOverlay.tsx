
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
}

export const WorksheetOverlay: React.FC<Props> = ({ imageUrl, items, focusedId, className }) => {
  const { user, setShowPaywall } = useAuth();
  const { t } = useLanguage();
  const [imageLoaded, setImageLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // Immediate check for completed image loads (prevents hanging on cached/base64 data)
  useEffect(() => {
    if (imgRef.current && imgRef.current.complete) {
      setImageLoaded(true);
    }
  }, [imageUrl]);

  const getStyle = (item: WorksheetItem) => {
    const box = item.bounding_box;
    if (!box) return { display: 'none' };
    
    // Scale percentages from 0-1000 range (Gemini coordinate system) to 0-100%
    const top = (box.ymin / 1000) * 100;
    const left = (box.xmin / 1000) * 100;

    return {
      top: `${top}%`,
      left: `${left}%`,
      zIndex: 10
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
    <div className={`w-full flex flex-col bg-zinc-950 rounded-2xl border border-zinc-800 overflow-hidden relative shadow-2xl ${className || 'h-full'}`}>
      <div className="flex-1 relative overflow-y-auto custom-scrollbar bg-black/40">
        <div ref={containerRef} className="relative w-full min-h-[200px] transform-gpu">
          <img 
            ref={imgRef}
            src={imageUrl} 
            alt="Worksheet" 
            className={`w-full h-auto block transition-opacity duration-500 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setImageLoaded(true)}
            onError={() => {
                console.error("Image load failed in overlay");
                setImageLoaded(true); // Allow items to show as fallback
            }}
            draggable={false}
            // @ts-ignore - fetchpriority is a valid attribute but TS might not recognize it yet
            fetchpriority="high"
          />
          
          {imageLoaded && items && items.map((item) => {
            const isFocused = focusedId === null || focusedId === undefined || item.id === focusedId;
            
            // Cleanup answer text: Remove leading question number if AI hallucinated it (e.g., "1. A. Cat" -> "A. Cat")
            const rawAnswer = item.correct_answer || "";
            const cleanAnswer = rawAnswer.replace(/^\d+[\.\)\s]+/, '').trim();
            const displayText = `${item.id}. ${cleanAnswer}`;
            
            return (
              <div
                key={item.id}
                style={getStyle(item)}
                className={`absolute transition-all duration-300 pointer-events-auto ${isFocused ? 'opacity-100 scale-100' : 'opacity-20 scale-95'}`}
                onClick={(e) => { e.stopPropagation(); playAudio(displayText); }}
              >
                 <div className="bg-orange-600 text-white px-3 py-1.5 md:px-4 md:py-2 rounded-xl shadow-[0_8px_30px_rgba(234,88,12,0.5)] border-2 border-white/20 flex items-center gap-2 transform transition-all hover:scale-105 active:scale-95 group cursor-pointer ring-4 ring-orange-500/10 min-w-fit max-w-[280px] md:max-w-[400px]">
                    <span className="font-display font-black text-xs md:text-base leading-tight tracking-tight whitespace-normal break-words break-keep text-left">
                      {displayText}
                    </span>
                    <span className="text-xs shrink-0 opacity-70 group-hover:opacity-100 transition-opacity">🔊</span>
                 </div>
              </div>
            );
          })}
        </div>
      </div>
      
      <div className="bg-zinc-900/90 backdrop-blur-md px-6 py-3 border-t border-white/5 flex justify-center shrink-0">
         <p className="text-zinc-400 text-[10px] md:text-xs font-black font-korean tracking-widest uppercase">{t('ws_voice_guide')}</p>
      </div>
    </div>
  );
};
