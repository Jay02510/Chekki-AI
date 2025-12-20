
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
  const [imageLoaded, setImageLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const getStyle = (item: WorksheetItem) => {
    const box = item.bounding_box;
    if (!box) return { display: 'none' };
    
    const h = Math.max(((box.ymax - box.ymin) / 1000) * 100, 5);
    const w = Math.max(((box.xmax - box.xmin) / 1000) * 100, 15);

    return {
      top: `${(box.ymin / 1000) * 100}%`,
      left: `${(box.xmin / 1000) * 100}%`,
      width: `${w}%`,
      height: `${h}%`,
      minWidth: '160px',
      minHeight: '44px'
    };
  };

  const playAudio = (text: string) => {
    if (user?.plan !== 'pro') {
      setShowPaywall(true);
      return;
    }
    if ('speechSynthesis' in window) {
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
            // Ensure we don't double up numbers if they are already in the string
            const displayText = text.startsWith(item.id.toString()) ? text : `${item.id}. ${text}`;
            
            return (
              <div
                key={item.id}
                style={getStyle(item)}
                className={`absolute z-10 transition-all duration-300 pointer-events-auto flex items-center justify-center ${isFocused ? 'opacity-100' : 'opacity-20'}`}
                onClick={(e) => { e.stopPropagation(); playAudio(displayText); }}
              >
                 <div className="bg-orange-600 text-white px-4 py-2 rounded-xl shadow-[0_10px_40px_rgba(234,88,12,0.6)] border-2 border-white/30 whitespace-nowrap flex items-center gap-2 transform transition-all hover:scale-105 active:scale-95 group cursor-pointer ring-4 ring-orange-500/20">
                    <span className="font-display font-black text-sm md:text-lg leading-none tracking-tight">
                      {displayText}
                    </span>
                    <span className="text-sm opacity-80 group-hover:opacity-100 group-hover:animate-pulse">🔊</span>
                 </div>
              </div>
            );
          })}
        </div>
      </div>
      
      <div className="bg-zinc-900/90 backdrop-blur-md px-6 py-4 border-t border-white/5 flex justify-center shrink-0">
         <p className="text-zinc-300 text-sm font-black font-korean tracking-wide">💡 정답을 누르면 영어 발음을 들려드려요!</p>
      </div>
    </div>
  );
};
