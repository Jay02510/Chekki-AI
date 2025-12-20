
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

export const WorksheetOverlay: React.FC<Props> = ({ imageUrl, items, isInteractive = true, focusedId, className }) => {
  const { user, setShowPaywall } = useAuth();
  const [imageLoaded, setImageLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Pan & Zoom State
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    setIsPanning(true);
    setStartPos({ x: clientX - position.x, y: clientY - position.y });
  };

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isPanning) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    setPosition({ x: clientX - startPos.x, y: clientY - startPos.y });
  };

  const handleEnd = () => setIsPanning(false);

  const getStyle = (item: WorksheetItem) => {
    const box = item.bounding_box;
    if (!box) return { display: 'none' };
    
    // We increase height slightly for visibility if the AI provides a very thin box
    const h = Math.max(((box.ymax - box.ymin) / 1000) * 100, 4);
    const w = ((box.xmax - box.xmin) / 1000) * 100;

    return {
      top: `${(box.ymin / 1000) * 100}%`,
      left: `${(box.xmin / 1000) * 100}%`,
      width: `${w}%`,
      height: `${h}%`,
      minWidth: '140px', // Ensure it's readable even if the box is small
      minHeight: '40px'
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
    <div className={`w-full flex flex-col bg-zinc-950 rounded-2xl border border-zinc-800 overflow-hidden relative shadow-2xl ${className || 'h-[60vh]'}`}>
      {/* ZOOM CONTROLS */}
      <div className="absolute top-4 right-4 z-20 flex gap-2">
         <button onClick={() => setScale(s => Math.min(s + 0.2, 4))} className="w-10 h-10 bg-zinc-900/80 border border-white/10 text-white rounded-full font-bold shadow-lg backdrop-blur-md hover:bg-zinc-800 transition-colors">+</button>
         <button onClick={() => setScale(s => Math.max(s - 0.2, 0.5))} className="w-10 h-10 bg-zinc-900/80 border border-white/10 text-white rounded-full font-bold shadow-lg backdrop-blur-md hover:bg-zinc-800 transition-colors">-</button>
         <button onClick={() => { setScale(1); setPosition({x:0,y:0}); }} className="px-4 py-2 bg-zinc-900/80 border border-white/10 text-white rounded-full text-xs font-bold shadow-lg backdrop-blur-md hover:bg-zinc-800 transition-colors">Reset</button>
      </div>

      <div 
        className="flex-1 relative cursor-grab active:cursor-grabbing overflow-hidden"
        onMouseDown={handleStart}
        onMouseMove={handleMove}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
        onTouchStart={handleStart}
        onTouchMove={handleMove}
        onTouchEnd={handleEnd}
      >
        <div 
          ref={containerRef}
          className="relative origin-top-left transition-transform duration-75 ease-out"
          style={{ transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`, width: '100%' }}
        >
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
            
            return (
              <div
                key={item.id}
                style={getStyle(item)}
                className={`absolute z-10 transition-all duration-300 pointer-events-auto flex flex-col items-center justify-center ${isFocused ? 'opacity-100' : 'opacity-20'}`}
                onClick={(e) => { e.stopPropagation(); playAudio(text); }}
              >
                 {/* High Visibility Answer Bubble */}
                 <div className="bg-orange-600 text-white px-3 py-1.5 rounded-lg shadow-2xl border-2 border-white/20 whitespace-nowrap flex items-center gap-2 transform transition-transform hover:scale-105 active:scale-95 group">
                    <span className="font-display font-black text-sm md:text-base leading-none">
                      {text.includes('.') ? text : `${item.id}. ${text}`}
                    </span>
                    <span className="text-sm opacity-60 group-hover:opacity-100">🔊</span>
                 </div>
                 {/* Selection Pulse Ring */}
                 <div className="absolute inset-0 border-4 border-orange-500/50 rounded-xl animate-pulse -m-1"></div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* HINT FOOTER */}
      <div className="bg-zinc-900/80 backdrop-blur-md px-6 py-3 border-t border-white/5 flex justify-center">
         <p className="text-zinc-400 text-xs font-bold font-korean">💡 정답을 누르면 영어 발음을 들려드려요!</p>
      </div>
    </div>
  );
};
