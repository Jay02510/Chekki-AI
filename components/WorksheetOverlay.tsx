
import React, { useState, useRef } from 'react';
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

export const WorksheetOverlay: React.FC<Props> = ({ imageUrl, items, isInteractive = true, focusedId, className }) => {
  const { user, setShowPaywall } = useAuth();
  const { t } = useLanguage();
  const [imageLoaded, setImageLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const getStyle = (item: WorksheetItem) => {
    const box = item.bounding_box;
    if (!box) return { display: 'none' };
    
    // Scale percentages from 0-1000 range to 0-100%
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
      <div className="flex-1 relative overflow-y-auto custom-scrollbar">
        <div ref={containerRef} className="relative w-full">
          <img 
            src={imageUrl} 
            alt="Worksheet" 
            className={`w-full h-auto block transition-opacity duration-500 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setImageLoaded(true)}
            draggable={false}
          />
          
          {imageLoaded && items.map((item) => {
            const isFocused = focusedId === null || focusedId === undefined || item.id === focusedId;
            const text = item.correct_answer || "";
            const displayText = text.startsWith(item.id.toString()) ? text : `${item.id}. ${text}`;
            
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
