
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
  isNight?: boolean;
  onConfirm?: (options: { title: string; confirmText?: string; cancelText?: string; onConfirm: () => void }) => void;
}

type ViewMode = 'fit' | 'fill';

export const WorksheetOverlay: React.FC<Props> = ({ imageUrl, items: initialItems, focusedId, className, isLoadingItems = false, isNight = false, onConfirm }) => {
  const { user, setShowPaywall } = useAuth();
  const { t, language } = useLanguage();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('fit');
  const [showSettings, setShowSettings] = useState(false);
  
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
    const title = language === 'ko' ? "정답 위치를 초기화할까요?" : "Reset bubble positions?";
    
    if (onConfirm) {
      onConfirm({
        title,
        confirmText: language === 'ko' ? "초기화" : "Reset",
        cancelText: language === 'ko' ? "취소" : "Cancel",
        onConfirm: () => {
          setItems(initialItems.map(i => ({ ...i, custom_coords: undefined })));
        }
      });
    } else if (window.confirm(title)) {
      setItems(initialItems.map(i => ({ ...i, custom_coords: undefined })));
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

  const renderOverlayContent = (inFullscreen: boolean) => (
    <div 
      id={inFullscreen ? "worksheet-overlay-fullscreen" : "worksheet-overlay-capture"}
      ref={containerRef}
      onPointerMove={handlePointerMove}
      onContextMenu={(e) => e.preventDefault()}
      onClick={() => setIsFullscreen(!inFullscreen)}
      className={`group relative transform-gpu transition-all duration-500 ease-in-out flex items-center justify-center select-none cursor-pointer ${
        inFullscreen 
          ? viewMode === 'fit' ? 'h-full w-full' : 'w-full max-w-5xl mx-auto' 
          : 'w-full min-h-[300px] h-full'
      }`}
    >
      {/* Simplified background to prevent 'double image' glitch from failed blurs on mobile */}
      <div className={`absolute inset-0 overflow-hidden pointer-events-none opacity-20 ${isNight ? 'bg-zinc-800' : 'bg-zinc-200'}`}>
      </div>

      <div className={`relative pointer-events-none z-10 ${inFullscreen ? (viewMode === 'fit' ? 'h-full w-full flex items-center justify-center' : 'w-full') : 'h-full flex items-center justify-center'}`}>
        <img 
            src={imageUrl} 
            alt="Worksheet" 
            className={`block transition-all duration-1000 ease-in-out transform-gpu pointer-events-none ${
            (imageLoaded || inFullscreen) ? 'opacity-100 scale-100' : 'opacity-0 scale-105 blur-lg'
            } ${
            inFullscreen ? (viewMode === 'fit' ? 'max-h-full max-w-full object-contain' : 'w-full h-auto') : 'w-full h-auto'
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
              onClick={(e) => e.stopPropagation()}
          >
                <div className={`
                    rounded-[1.2rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-2 flex items-center gap-2 transform transition-all active:scale-95 group cursor-grab w-max max-w-[80vw] md:max-w-[500px] ring-offset-black ring-offset-2
                    ${isDragging ? 'cursor-grabbing border-white/50 scale-110 shadow-[0_25px_70px_rgba(249,115,22,0.6)] ring-4 ring-orange-500/40 z-[1000]' : ''}
                    ${isFocused ? 'bg-orange-500 border-white shadow-orange-500/20' : 'bg-transparent border-transparent'}
                    px-2.5 py-1.5 md:px-4 md:py-3
                `}>
                  <div className="w-5 h-5 md:w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center shrink-0 shadow-inner">
                      <span className="font-black text-[9px] md:text-sm text-white">{item.id}</span>
                  </div>
                  <span className={`font-hand font-black leading-tight tracking-tight text-white whitespace-normal break-words break-keep text-left drop-shadow-md text-sm md:text-xl`}>
                    {displayValue}
                  </span>
              </div>
          </div>
          );
      })}
    </div>
  );

  return (
    <>
      <div className={`w-full flex flex-col bg-zinc-950 border-white/5 overflow-hidden relative shadow-[0_40px_100px_rgba(0,0,0,0.7)] transition-all duration-700 ${className || 'h-full rounded-[2.5rem]'}`}>
        
        <div className="absolute top-4 left-4 right-4 z-50 flex justify-between items-start pointer-events-none">
            <div className="flex flex-col gap-3 items-start pointer-events-auto relative">
                   <button 
                    onClick={() => setShowSettings(!showSettings)}
                    className={`w-14 h-14 rounded-2xl bg-black/60 backdrop-blur-xl border-2 ${showSettings ? 'border-orange-500 text-orange-500' : 'border-white/10 text-white/90'} hover:bg-zinc-800 transition-all flex items-center justify-center text-xl shadow-2xl active:scale-90 group`}
                    title={language === 'ko' ? "정답 설정" : "Overlay Settings"}
                   >
                     <svg className={`w-7 h-7 ${showSettings ? 'scale-110' : 'group-hover:scale-110'} transition-transform`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 12h7.5" />
                     </svg>
                   </button>
                 
                 {showSettings && (
                   <>
                     <div className="fixed inset-0 z-40" onClick={() => setShowSettings(false)}></div>
                     <div className="flex flex-col gap-4 bg-black/80 backdrop-blur-2xl p-5 rounded-3xl border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-fade-in-up origin-top-left absolute top-16 left-0 w-max z-[100]">
                     <div className="flex flex-col gap-2">
                       <span className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] px-1">{language === 'ko' ? "정답 크기" : "Answer Size"}</span>
                       <div className="flex items-center gap-3">
                         <span className="text-xs opacity-50">A</span>
                         <input 
                            type="range" min="0.4" max="1.4" step="0.05" 
                            value={bubbleScale} 
                            onChange={(e) => setBubbleScale(parseFloat(e.target.value))}
                            className="w-32 accent-orange-500 cursor-pointer h-1.5 bg-white/10 rounded-full appearance-none"
                         />
                         <span className="text-lg font-black">A</span>
                       </div>
                     </div>
                     <div className="w-full h-px bg-white/10"></div>
                     <button 
                      onClick={resetPositions}
                      className="w-full py-3 rounded-2xl bg-white/5 text-white hover:bg-white/10 transition-all flex items-center justify-center gap-3 text-xs font-black uppercase tracking-widest active:scale-95 border border-white/10"
                     >
                       <span className="text-base">🔄</span> {language === 'ko' ? "위치 초기화" : "Reset Positions"}
                     </button>
                   </div>
                   </>
                 )}
            </div>

            <button 
              onClick={() => setIsFullscreen(true)}
              className="pointer-events-auto w-14 h-14 rounded-2xl bg-black/60 backdrop-blur-xl border-2 border-white/30 flex items-center justify-center text-white hover:bg-orange-600 transition-all shadow-2xl group active:scale-90"
              title="Full Screen Focus"
            >
              <svg className="w-7 h-7 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
            {renderOverlayContent(false)}
          </div>
        </div>


      </div>

      {isFullscreen && (
        <div className="fixed inset-0 z-[9999] flex flex-col bg-zinc-950 animate-fade-in overflow-hidden select-none">
          {/* Close button - prominently placed with safe area awareness */}
          <div className="absolute top-0 left-0 right-0 z-[10002] p-4 pt-[calc(env(safe-area-inset-top)+1rem)] flex justify-end pointer-events-none">
            <button 
              onClick={() => setIsFullscreen(false)}
              className="w-12 h-12 rounded-full bg-orange-600/80 hover:bg-orange-500 backdrop-blur-xl flex items-center justify-center text-white transition-all active:scale-90 border border-white/20 pointer-events-auto shadow-xl group"
            >
              <svg className="w-8 h-8 group-hover:rotate-90 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={4}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>

          <div 
            className="flex-1 w-full h-full relative flex items-center justify-center"
            onClick={() => setIsFullscreen(false)}
          >
            {/* Removed immersive blurred background to fix double image issue */}

             <div onClick={(e) => e.stopPropagation()} className="relative z-10 transform-gpu w-full h-full flex items-center justify-center p-0">
                <div className="relative flex shadow-[0_30px_100px_rgba(0,0,0,0.9)] rounded-lg md:rounded-3xl overflow-hidden" style={{ maxHeight: '100%', maxWidth: '100%' }}>
                  <img 
                      src={imageUrl} 
                      alt="Worksheet Result" 
                      className="block animate-scale-in transition-all duration-700 shadow-2xl object-contain"
                      style={{ maxHeight: '100vh', maxWidth: '100vw' }}
                      draggable={false}
                  />
                  
                  {/* Overlay items positioned exactly relative to this image container */}
                  {items.map((item) => {
                    const box = item.bounding_box;
                    if (!box && !item.custom_coords) return null;
                    const rawTop = item.custom_coords ? item.custom_coords.top : ((box!.ymin + box!.ymax) / 2000) * 100;
                    const rawLeft = item.custom_coords ? item.custom_coords.left : ((box!.xmin + box!.xmax) / 2000) * 100;
                    const top = Math.min(Math.max(rawTop, 5), 95);
                    const left = Math.min(Math.max(rawLeft, 5), 95);

                    return (
                      <div
                        key={item.id}
                        style={{
                          top: `${top}%`,
                          left: `${left}%`,
                          transform: `translate3d(-50%, -50%, 0) scale(${bubbleScale * 1.3})`,
                          position: 'absolute',
                        }}
                        className="pointer-events-none"
                      >
                        <div className="bg-orange-500 border-2 border-white/60 rounded-[1.2rem] shadow-[0_15px_40px_rgba(0,0,0,0.6)] px-4 py-2 flex items-center gap-2">
                          <div className="w-6 h-6 md:w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                            <span className="font-black text-[9px] md:text-sm text-white">{item.id}</span>
                          </div>
                          <span className="font-hand font-black text-white text-sm md:text-xl whitespace-nowrap drop-shadow-md">
                            {item.correct_answer}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
             </div>
          </div>
        </div>
      )}
    </>
  );
};
