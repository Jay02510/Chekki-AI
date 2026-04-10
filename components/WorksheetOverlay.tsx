
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

export const WorksheetOverlay: React.FC<Props> = ({ imageUrl, items: initialItems, focusedId, className, isLoadingItems = false }) => {
  const { user, setShowPaywall } = useAuth();
  const { t, language } = useLanguage();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('fit');
  
  const [bubbleScale, setBubbleScale] = useState(0.75); 
  const [items, setItems] = useState<WorksheetItem[]>(initialItems);
  
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const dragOffset = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  useEffect(() => {
    if (imgRef.current && imgRef.current.complete) {
      setImageLoaded(true);
    }
  }, [imageUrl]);

  const handlePointerDown = (e: React.PointerEvent, item: WorksheetItem) => {
    if (!containerRef.current) return;
    e.stopPropagation();
    
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    const rect = containerRef.current.getBoundingClientRect();
    const box = item.bounding_box;
    const currentTop = item.custom_coords ? item.custom_coords.top : (box!.ymin / 1000) * 100;
    const currentLeft = item.custom_coords ? item.custom_coords.left : (box!.xmin / 1000) * 100;
    const bubblePxX = (currentLeft / 100) * rect.width;
    const bubblePxY = (currentTop / 100) * rect.height;
    
    dragOffset.current = {
      x: (e.clientX - rect.left) - bubblePxX,
      y: (e.clientY - rect.top) - bubblePxY
    };

    setDraggingId(item.id);
    if ('vibrate' in navigator) navigator.vibrate(5);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (draggingId === null || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const newPxX = (e.clientX - rect.left) - dragOffset.current.x;
    const newPxY = (e.clientY - rect.top) - dragOffset.current.y;
    let left = (newPxX / rect.width) * 100;
    let top = (newPxY / rect.height) * 100;
    top = Math.min(Math.max(top, 3), 97);
    left = Math.min(Math.max(left, 3), 97);

    setItems(prev => prev.map(item => 
      item.id === draggingId 
        ? { ...item, custom_coords: { top, left } } 
        : item
    ));
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (draggingId !== null) {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
        setDraggingId(null);
        if ('vibrate' in navigator) navigator.vibrate(10);
    }
  };

  const resetPositions = () => {
    if (window.confirm(language === 'ko' ? "정답 위치를 초기화할까요?" : "Reset bubble positions?")) {
      setItems(initialItems.map(i => ({ ...i, custom_coords: undefined })));
    }
  };

  const playAudio = (text: string) => {
    if (!user) {
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

  const getStyle = (item: WorksheetItem) => {
    const box = item.bounding_box;
    if (!box && !item.custom_coords) return { display: 'none' };
    const rawTop = item.custom_coords ? item.custom_coords.top : ((box!.ymin + box!.ymax) / 2000) * 100;
    const rawLeft = item.custom_coords ? item.custom_coords.left : ((box!.xmin + box!.xmax) / 2000) * 100;
    const top = Math.min(Math.max(rawTop, 5), 95);
    const left = Math.min(Math.max(rawLeft, 5), 95);
    const isDragging = draggingId === item.id;

    return {
      top: `${top}%`,
      left: `${left}%`,
      zIndex: isDragging ? 1000 : 10 + (item.id || 0),
      transform: `translate3d(-50%, -50%, 0) scale(${bubbleScale * (isDragging ? 1.2 : 1)})`,
      transition: isDragging ? 'none' : 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), top 0.2s, left 0.2s',
      willChange: 'top, left, transform',
      touchAction: 'none', 
      WebkitUserSelect: 'none',
      userSelect: 'none',
    } as React.CSSProperties;
  };

  const OverlayContent = () => (
    <div 
      id="worksheet-overlay-capture"
      ref={containerRef}
      onPointerMove={handlePointerMove}
      onContextMenu={(e) => e.preventDefault()}
      className={`group relative transform-gpu transition-all duration-500 ease-in-out flex items-center justify-center select-none ${
        isFullscreen 
          ? viewMode === 'fit' ? 'h-full w-auto max-h-full' : 'w-full max-w-5xl mx-auto' 
          : 'w-full min-h-[300px]'
      }`}
    >
      <div className="relative pointer-events-none">
        <img 
            ref={imgRef}
            src={imageUrl} 
            alt="Worksheet" 
            className={`block transition-all duration-1000 ease-in-out transform-gpu pointer-events-none ${
            imageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105 blur-lg'
            } ${
            isFullscreen && viewMode === 'fit' ? 'max-h-[calc(100vh-160px)] w-auto object-contain' : 'w-full h-auto'
            }`}
            onLoad={() => setImageLoaded(true)}
            draggable={false}
            loading="eager"
        />

        {isLoadingItems && (
          <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
             <div className="w-full h-1 bg-gradient-to-r from-transparent via-orange-500/50 to-transparent absolute top-0 animate-[scan_3s_linear_infinite] shadow-[0_0_20px_#f97316]"></div>
          </div>
        )}
      </div>

      {imageLoaded && items && items.map((item) => {
          const isFocused = focusedId === null || focusedId === undefined || item.id === focusedId;
          const displayValue = item.correct_answer;
          const isDragging = draggingId === item.id;
          
          return (
          <div
              key={item.id}
              style={getStyle(item)}
              className={`absolute pointer-events-auto transform-gpu animate-fade-in ${isFocused ? 'opacity-100' : 'opacity-20 blur-[2px]'}`}
              onPointerDown={(e) => handlePointerDown(e, item)}
              onPointerUp={handlePointerUp}
              onClick={(e) => { e.stopPropagation(); if(!isDragging) playAudio(displayValue); }}
          >
              <div className={`
                  rounded-[1.2rem] shadow-[0_15px_40px_rgba(0,0,0,0.6)] border-2 flex items-center gap-2 transform transition-all active:scale-95 group cursor-grab w-max max-w-[80vw] md:max-w-[500px] ring-offset-black ring-offset-2
                  ${isDragging ? 'cursor-grabbing border-white/50 scale-110 shadow-[0_20px_60px_rgba(249,115,22,0.5)] ring-4 ring-orange-500/40' : ''}
                  ${isFocused ? 'bg-orange-600 border-white/30' : 'bg-zinc-800 border-white/10'}
                  px-2.5 py-1.5 md:px-4 md:py-3
              `}>
                  <div className="w-5 h-5 md:w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center shrink-0 shadow-inner">
                      <span className="font-black text-[9px] md:text-sm text-white">{item.id}</span>
                  </div>
                  <span className={`font-hand font-black leading-tight tracking-tight text-white whitespace-normal break-words break-keep text-left drop-shadow-md text-sm md:text-xl`}>
                    {displayValue}
                  </span>
                  <div className="w-px h-5 bg-white/10 shrink-0 mx-1"></div>
                  <span className="text-xs md:text-lg shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">🔊</span>
              </div>
          </div>
          );
      })}
    </div>
  );

  return (
    <>
      <div className={`w-full flex flex-col bg-zinc-950 rounded-[2.5rem] border border-white/5 overflow-hidden relative shadow-[0_40px_100px_rgba(0,0,0,0.7)] transition-all duration-700 ${className || 'h-full'}`}>
        
        <div className="absolute top-4 left-4 right-4 z-50 flex justify-between items-center pointer-events-none">
            <div className="flex gap-2 pointer-events-auto bg-black/50 backdrop-blur-2xl p-2 rounded-2xl border border-white/10 shadow-2xl items-center">
                 <button 
                  onClick={resetPositions}
                  className="w-10 h-10 rounded-xl bg-zinc-800 text-white hover:bg-zinc-700 transition-all flex items-center justify-center text-lg active:scale-90"
                  title={language === 'ko' ? "위치 초기화" : "Reset Positions"}
                 >
                   🔄
                 </button>
                 <div className="w-px h-6 bg-white/10 mx-1"></div>
                 <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest px-1">{language === 'ko' ? "크기" : "Size"}</span>
                 <input 
                    type="range" min="0.3" max="1.5" step="0.05" 
                    value={bubbleScale} 
                    onChange={(e) => setBubbleScale(parseFloat(e.target.value))}
                    className="w-20 md:w-32 accent-orange-500 cursor-pointer h-1.5 bg-zinc-700 rounded-lg appearance-none"
                 />
            </div>

            <button 
              onClick={() => setIsFullscreen(true)}
              className="pointer-events-auto w-12 h-12 rounded-2xl bg-black/60 backdrop-blur-xl border-2 border-white/30 flex items-center justify-center text-white hover:bg-orange-600 transition-all shadow-2xl group active:scale-90"
              title="Full Screen Focus"
            >
              <svg className="w-6 h-6 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            </button>
        </div>

        <div className="flex-1 relative overflow-y-auto custom-scrollbar overscroll-contain bg-zinc-900/50">
          <div className="relative w-full transform-gpu">
            {!imageLoaded && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900/40 backdrop-blur-2xl min-h-[400px]">
                 <div className="w-12 h-12 border-4 border-orange-500/10 border-t-orange-500 rounded-full animate-spin mb-6"></div>
                 <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest animate-pulse">{language === 'ko' ? "종이 분석 중..." : "Scanning Paper..."}</p>
              </div>
            )}
            <OverlayContent />
          </div>
        </div>
        
        <div className="bg-zinc-900/80 backdrop-blur-3xl px-6 py-2 border-t border-white/5 flex flex-col items-center shrink-0">
           <p className="text-zinc-500 text-[9px] font-black font-korean tracking-[0.3em] uppercase opacity-70 mb-1">{t('ws_voice_guide')}</p>
           <p className="text-[8px] text-orange-500/60 font-black uppercase tracking-widest">{language === 'ko' ? "정답을 직접 옮겨보세요" : "Drag answers to reposition"}</p>
        </div>
      </div>

      {isFullscreen && (
        <div className="fixed inset-0 z-[200] flex flex-col bg-black animate-fade-in overflow-hidden">
          <div className="relative z-[220] pt-[env(safe-area-inset-top)] bg-zinc-900/95 backdrop-blur-3xl border-b border-white/10 shadow-2xl shrink-0 h-16 px-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">{language === 'ko' ? "크기" : "Size"}</span>
                    <input 
                        type="range" min="0.3" max="2" step="0.1" 
                        value={bubbleScale} 
                        onChange={(e) => setBubbleScale(parseFloat(e.target.value))}
                        className="w-24 md:w-64 accent-orange-500 h-1.5 bg-zinc-800 rounded-lg appearance-none hidden md:block"
                    />
                    <div className="w-px h-6 bg-white/10 mx-2 hidden md:block"></div>
                    <button 
                        onClick={resetPositions}
                        className="w-10 h-10 rounded-xl bg-zinc-800 text-white hover:bg-zinc-700 transition-all flex items-center justify-center text-lg active:scale-90"
                        title={language === 'ko' ? "위치 초기화" : "Reset Positions"}
                    >
                        🔄
                    </button>
                    <button 
                        onClick={() => setViewMode(viewMode === 'fit' ? 'fill' : 'fit')}
                        className="w-10 h-10 rounded-xl bg-zinc-800 text-white hover:bg-zinc-700 transition-all flex items-center justify-center text-lg active:scale-90"
                        title={language === 'ko' ? "화면 줌" : "Zoom Image"}
                    >
                        {viewMode === 'fit' ? '🔍' : '🖼️'}
                    </button>
                </div>

                <button 
                    onClick={() => setIsFullscreen(false)}
                    className="flex items-center gap-2 bg-red-600 hover:bg-red-50 text-white px-5 py-2 rounded-xl shadow-xl transition-all active:scale-95 border border-white/10"
                >
                    <span className="text-[10px] font-black uppercase tracking-widest">{language === 'ko' ? '종료' : 'Exit'}</span>
                    <span className="text-lg">✕</span>
                </button>
          </div>

          <div 
            className="flex-1 overflow-auto custom-scrollbar overscroll-contain flex justify-center items-center p-4 md:p-12 relative bg-zinc-950"
            onClick={() => setIsFullscreen(false)}
          >
             <div onClick={(e) => e.stopPropagation()} className="relative transform-gpu max-w-full">
                <OverlayContent />
             </div>
          </div>

          <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[300] sm:hidden animate-fade-in-up">
              <button 
                onClick={() => setIsFullscreen(false)}
                className="bg-white text-black px-12 py-5 rounded-full font-black text-sm uppercase tracking-[0.2em] shadow-[0_20px_50px_rgba(255,255,255,0.2)] ring-4 ring-white/10 active:scale-90 transition-all"
              >
                {language === 'ko' ? '포커스 종료' : 'Close Focus'}
              </button>
          </div>
        </div>
      )}
    </>
  );
};
