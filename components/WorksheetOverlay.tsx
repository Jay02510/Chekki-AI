import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { WorksheetItem } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { ListDashes, Scan } from '@phosphor-icons/react';
import { removeMarkdown } from '../utils/speechUtils';

interface Props {
  imageUrl: string;
  items: WorksheetItem[];
  isInteractive?: boolean;
  focusedId?: number | null;
  className?: string;
  isLoadingItems?: boolean;
  isNight?: boolean;
  hasHandwriting?: boolean;
  onConfirm?: (options: {
    title: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
  }) => void;
  onSelect?: (id: number) => void;
}

type ViewMode = 'fit' | 'fill';

export const WorksheetOverlay: React.FC<Props> = ({
  imageUrl,
  items: initialItems,
  focusedId,
  className,
  isLoadingItems = false,
  isNight = false,
  hasHandwriting = true,
  onConfirm,
  onSelect,
}) => {
  const { user, setShowPaywall } = useAuth();
  const { t, language } = useLanguage();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('fit');

  const [showSettings, setShowSettings] = useState(false);
  const [showFullscreenSettings, setShowFullscreenSettings] = useState(false);
  const [showAnswers, setShowAnswers] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('chekki_show_answers');
      if (saved !== null) return saved === 'true';
    }
    return hasHandwriting !== false;
  });

  const handleToggleAnswers = () => {
    const newVal = !showAnswers;
    setShowAnswers(newVal);
    if (typeof window !== 'undefined') {
      localStorage.setItem('chekki_show_answers', String(newVal));
    }
  };

  const [bubbleScale, setBubbleScale] = useState(0.95);
  const [items, setItems] = useState<WorksheetItem[]>(initialItems);

  const [draggingId, setDraggingId] = useState<number | null>(null);
  const dragOffset = useRef({ x: 0, y: 0 });
  const dragStartPos = useRef({ x: 0, y: 0 });
  const pointerDownItemId = useRef<number | null>(null);
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

    // Use currentTarget to ensure we capture on the bubble container even if a child is touched
    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId);

    const rect = containerRef.current.getBoundingClientRect();
    const box = item.bounding_box;

    // Use the same coordinate logic as getStyle to prevent jumping on grab
    const currentTop = item.custom_coords
      ? item.custom_coords.top
      : ((box!.ymin + box!.ymax) / 2000) * 100;
    const currentLeft = item.custom_coords
      ? item.custom_coords.left
      : ((box!.xmin + box!.xmax) / 2000) * 100;

    const bubblePxX = (currentLeft / 100) * rect.width;
    const bubblePxY = (currentTop / 100) * rect.height;

    dragOffset.current = {
      x: e.clientX - rect.left - bubblePxX,
      y: e.clientY - rect.top - bubblePxY,
    };

    dragStartPos.current = { x: e.clientX, y: e.clientY };
    pointerDownItemId.current = item.id;
    setDraggingId(item.id);
    if ('vibrate' in navigator) navigator.vibrate(5);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (draggingId === null || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const newPxX = e.clientX - rect.left - dragOffset.current.x;
    const newPxY = e.clientY - rect.top - dragOffset.current.y;
    let left = (newPxX / rect.width) * 100;
    let top = (newPxY / rect.height) * 100;
    top = Math.min(Math.max(top, -5), 105);
    left = Math.min(Math.max(left, -5), 105);

    setItems((prev) =>
      prev.map((item) =>
        item.id === draggingId ? { ...item, custom_coords: { top, left } } : item
      )
    );
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (draggingId !== null) {
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch (err) {
        // Ignore if pointer capture was already lost
      }

      const dist = Math.hypot(
        e.clientX - dragStartPos.current.x,
        e.clientY - dragStartPos.current.y
      );
      if (dist < 6 && pointerDownItemId.current !== null && onSelect) {
        onSelect(pointerDownItemId.current);
      }

      setDraggingId(null);
      pointerDownItemId.current = null;
      if ('vibrate' in navigator) navigator.vibrate(10);
    }
  };

  const resetPositions = () => {
    const title = language === 'ko' ? '정답 위치를 초기화할까요?' : 'Reset bubble positions?';

    onConfirm?.({
      title,
      confirmText: language === 'ko' ? '초기화' : 'Reset',
      cancelText: language === 'ko' ? '취소' : 'Cancel',
      onConfirm: () => {
        setItems(initialItems.map((i) => ({ ...i, custom_coords: undefined })));
        setShowSettings(false);
      },
    });
  };

  const getStyle = (item: WorksheetItem, index: number = 0) => {
    const box = item.bounding_box;
    if (!box && !item.custom_coords) return { display: 'none' };
    const rawTop = item.custom_coords
      ? item.custom_coords.top
      : ((box!.ymin + box!.ymax) / 2000) * 100;
    const rawLeft = item.custom_coords
      ? item.custom_coords.left
      : ((box!.xmin + box!.xmax) / 2000) * 100;
    const top = Math.min(Math.max(rawTop, 5), 95);
    const left = Math.min(Math.max(rawLeft, 5), 95);
    const isDragging = draggingId === item.id;

    return {
      top: `${top}%`,
      left: `${left}%`,
      zIndex: isDragging ? 1000 : 10 + (item.id || 0),
      transform: `translate3d(-50%, -50%, 0) scale(${bubbleScale * (isDragging ? 1.2 : 1)})`,
      // Every tap on a bubble briefly sets/clears draggingId, so this curve
      // fires on the highest-frequency interaction in the app (select, drag
      // settle) — a spring overshoot there reads as unintentional bounce, not
      // a rare celebratory moment. Strong ease-out, under 300ms (audit: P1
      // finding, bounce-easing misapplied to routine UI).
      transition: isDragging
        ? 'none'
        : 'transform 220ms var(--ease-out-strong), top 0.2s, left 0.2s',
      willChange: 'top, left, transform',
      touchAction: 'none',
      WebkitUserSelect: 'none',
      userSelect: 'none',
      animationDelay: `${index * 120}ms`,
      animationFillMode: 'both',
    } as React.CSSProperties;
  };

  const renderOverlayContent = (inFullscreen: boolean) => {
    const isBlankKeyMode = hasHandwriting === false;

    return (
      <div
        id={inFullscreen ? 'worksheet-overlay-fullscreen' : 'worksheet-overlay-capture'}
        onContextMenu={(e) => e.preventDefault()}
        className={`group relative transform-gpu transition-[width,height] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] flex items-center justify-center select-none ${
          inFullscreen
            ? viewMode === 'fit'
              ? 'h-full w-full'
              : 'w-full max-w-5xl mx-auto'
            : 'w-full min-h-[300px] h-auto'
        }`}
        style={{ touchAction: inFullscreen || draggingId !== null ? 'none' : 'pan-y' }}
      >
        {/* Simplified background to prevent 'double image' glitch from failed blurs on mobile */}
        <div
          className={`absolute inset-0 overflow-hidden pointer-events-none opacity-20 ${isNight ? 'bg-zinc-800' : 'bg-zinc-200'}`}
        ></div>

        {/* The precise bounding container for the image and bubbles */}
        <div
          ref={containerRef}
          onPointerMove={handlePointerMove}
          className="relative inline-block max-w-full max-h-full"
        >
          <img
            src={imageUrl}
            alt="Worksheet"
            className={`block transition-[opacity,transform,filter] duration-1000 ease-[cubic-bezier(0.23,1,0.32,1)] transform-gpu pointer-events-none ${
              imageLoaded || inFullscreen ? 'opacity-100 scale-100' : 'opacity-0 scale-105 blur-lg'
            }`}
            style={{
              maxWidth: '100%',
              maxHeight: inFullscreen && viewMode === 'fit' ? '100vh' : '100%',
              width: 'auto',
              height: 'auto',
              display: 'block',
            }}
            onLoad={() => setImageLoaded(true)}
            draggable={false}
            loading="eager"
          />

          {isLoadingItems && (
            <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
              <div className="w-full h-1 bg-gradient-to-r from-transparent via-orange-500/50 to-transparent absolute top-0 animate-[scan_3s_linear_infinite] shadow-[0_0_20px_#f97316]"></div>
            </div>
          )}

          {imageLoaded &&
            items &&
            items.map((item, idx) => {
              const isFocused =
                focusedId === null || focusedId === undefined || item.id === focusedId;
              const isExplicitlyFocused = focusedId === item.id;

              // Hide the bubble if answers are hidden AND this item isn't explicitly focused
              if (!showAnswers && !isExplicitlyFocused) return null;

              const displayValue = removeMarkdown(item.correct_answer || '');
              const isDragging = draggingId === item.id;

              // Bubbles are the graded output itself — a screen-reader/keyboard
              // user with no way to reach this content couldn't use the core
              // product at all (audit: P0 finding, WorksheetOverlay a11y gap).
              const correctnessLabel = isBlankKeyMode
                ? ''
                : item.is_correct === true
                  ? language === 'ko'
                    ? ', 정답'
                    : ', correct'
                  : item.is_correct === false
                    ? language === 'ko'
                      ? ', 오답'
                      : ', incorrect'
                    : '';
              const bubbleAriaLabel =
                (language === 'ko'
                  ? `${item.id}번 문제, 정답: ${displayValue}`
                  : `Question ${item.id}, answer: ${displayValue}`) + correctnessLabel;

              return (
                <div
                  key={item.id}
                  style={getStyle(item, idx)}
                  className={`absolute pointer-events-auto transform-gpu animate-[fadeIn_200ms_ease-out] ${isFocused ? 'opacity-100' : 'opacity-20 blur-[2px]'}`}
                  role="button"
                  tabIndex={0}
                  aria-label={bubbleAriaLabel}
                  aria-pressed={isExplicitlyFocused}
                  onPointerDown={(e) => handlePointerDown(e, item)}
                  onPointerUp={handlePointerUp}
                  onPointerCancel={handlePointerUp}
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelect?.(item.id);
                    }
                  }}
                >
                  <div
                    className={`
                        rounded-2xl shadow-md border-2 flex items-center gap-2 transform transition-transform active:scale-[0.97] group cursor-grab w-fit max-w-[80vw] md:max-w-[500px] ring-offset-black ring-offset-2
                        ${isDragging ? 'cursor-grabbing border-white/50 scale-110 shadow-lg ring-4 z-[1000]' : ''}
                        ${
                          isFocused
                            ? isBlankKeyMode
                              ? 'bg-blue-500 border-white shadow-sm'
                              : item.is_correct === true
                                ? 'bg-emerald-500 border-white shadow-sm'
                                : item.is_correct === false
                                  ? 'bg-red-500 border-white shadow-sm'
                                  : 'bg-orange-500 border-white shadow-sm'
                            : 'bg-transparent border-transparent'
                        }
                        ${
                          focusedId !== null && focusedId !== undefined && focusedId === item.id
                            ? isBlankKeyMode
                              ? 'ring-2 ring-blue-500/50 scale-[1.02] shadow-md'
                              : item.is_correct === true
                                ? 'ring-2 ring-emerald-500/50 scale-[1.02] shadow-md'
                                : item.is_correct === false
                                  ? 'ring-2 ring-red-500/50 scale-[1.02] shadow-md'
                                  : 'ring-2 ring-orange-500/50 scale-[1.02] shadow-md'
                            : ''
                        }
                        px-2.5 py-1.5 md:px-4 md:py-3
                    `}
                  >
                    <>
                      <div className="w-5 h-5 md:w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center shrink-0 shadow-inner">
                        <span className="font-black text-[9px] md:text-sm text-white">
                          {item.id}
                        </span>
                      </div>
                      <span
                        className={`font-hand font-black leading-tight tracking-tight text-white whitespace-normal break-words text-left text-balance drop-shadow-md text-sm md:text-xl  inline-block`}
                      >
                        {displayValue}
                      </span>
                    </>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    );
  };

  return (
    <>
      <div
        className={`w-full flex flex-col ${isNight ? 'bg-zinc-950 border-white/5' : 'bg-white border-zinc-200 shadow-xl'} lg:overflow-hidden relative shadow-[0_40px_100px_rgba(0,0,0,0.7)] transition-[background-color,border-color] duration-700 ${className || 'h-full rounded-3xl'}`}
      >
        <div className="absolute top-4 right-4 md:top-8 md:right-8 z-50 flex flex-col items-end pointer-events-none gap-2">
          <div className="flex flex-col gap-3 items-start pointer-events-auto relative shrink-0">
            <button
              aria-label={language === 'ko' ? '정답 설정' : 'Overlay Settings'}
              onClick={() => setShowSettings(!showSettings)}
              className={`w-14 h-14 rounded-full ${isNight ? 'bg-black/60 border-white/10 text-white/90' : 'bg-white/80 border-zinc-200 text-zinc-900'} backdrop-blur-xl border-2 ${showSettings ? 'border-orange-500 text-orange-500 opacity-100' : 'opacity-70 md:opacity-40 md:hover:opacity-100'} hover:scale-110 active:scale-90 hover:border-orange-500/50 hover:text-orange-500 transition-[border-color,color,opacity,transform] duration-200 flex items-center justify-center text-xl shadow-2xl group shrink-0`}
              title={language === 'ko' ? '정답 설정' : 'Overlay Settings'}
            >
              <svg
                className={`w-7 h-7 ${showSettings ? 'scale-110' : 'group-hover:scale-110'} transition-transform`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 12h7.5"
                />
              </svg>
            </button>

            {showSettings && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowSettings(false)}></div>
                <div
                  className={`flex flex-col gap-4 ${isNight ? 'bg-black/80 border-white/20' : 'bg-white/95 border-zinc-200'} backdrop-blur-2xl p-5 rounded-3xl border shadow-md animate-[fadeIn_200ms_ease-out]-up origin-top-right absolute top-16 right-0 w-max z-[100]`}
                >
                  <div className="flex flex-col gap-2">
                    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] px-1">
                      {language === 'ko' ? '정답 크기' : 'Answer Size'}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs opacity-50">A</span>
                      <input
                        type="range"
                        min="0.4"
                        max="1.4"
                        step="0.05"
                        value={bubbleScale}
                        onChange={(e) => setBubbleScale(parseFloat(e.target.value))}
                        className={`w-32 accent-orange-500 cursor-pointer h-1.5 ${isNight ? 'bg-white/10' : 'bg-zinc-200'} rounded-full appearance-none`}
                      />
                      <span className="text-lg font-black">A</span>
                    </div>
                  </div>
                  <div className="w-full h-px bg-white/10"></div>
                  <button
                    onClick={resetPositions}
                    className={`w-full py-3 rounded-2xl ${isNight ? 'bg-white/5 text-white border-white/10 hover:bg-white/10' : 'bg-zinc-100 text-zinc-900 border-zinc-200 hover:bg-zinc-200'} transition-[background-color,transform] flex items-center justify-center gap-3 text-xs font-black uppercase tracking-widest active:scale-[0.97] border`}
                  >
                    <span className="text-base">🔄</span>{' '}
                    {language === 'ko' ? '위치 초기화' : 'Reset Positions'}
                  </button>
                </div>
              </>
            )}
          </div>

          <div className="flex items-center gap-3 pointer-events-auto shrink-0">
            <button
              onClick={() => setIsFullscreen(true)}
              className={`w-14 h-14 rounded-full ${isNight ? 'bg-black/60 border-white/30 text-white' : 'bg-white/80 border-zinc-200 text-zinc-900'} backdrop-blur-xl border-2 flex items-center justify-center hover:bg-orange-500 hover:border-orange-400 hover:text-white opacity-70 md:opacity-40 md:hover:opacity-100 hover:scale-110 active:scale-90 transition-[background-color,border-color,color,opacity,transform] duration-200 shadow-2xl group shrink-0`}
              title="Full Screen Focus"
            >
              <svg
                className="w-7 h-7 group-hover:scale-110 transition-transform"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                />
              </svg>
            </button>
          </div>
        </div>

        <div
          className={`lg:flex-1 relative lg:overflow-y-auto custom-scrollbar overscroll-y-auto ${isNight ? 'bg-zinc-900/50' : 'bg-zinc-50/50'}`}
        >
          <div className="relative w-full transform-gpu min-h-full">
            {!imageLoaded && (
              <div
                className={`absolute inset-0 flex flex-col items-center justify-center ${isNight ? 'bg-zinc-900/40' : 'bg-white/40'} backdrop-blur-2xl min-h-[400px] z-20`}
              >
                <div className="w-12 h-12 border-4 border-orange-500/10 border-t-orange-500 rounded-full animate-spin mb-6"></div>
                <p className="text-zinc-400 text-[10px] font-black uppercase tracking-wide leading-normal animate-pulse break-keep">
                  {language === 'ko' ? '종이 분석 중...' : 'Scanning Paper...'}
                </p>
              </div>
            )}
            {renderOverlayContent(false)}
          </div>
        </div>

        {/* Toggle Button for Worksheet Answers - Moved outside scrolling container */}
        {!isLoadingItems && items.length > 0 && (
          <div className="absolute bottom-6 left-0 right-0 flex justify-center pointer-events-none z-[60]">
            <button
              onClick={handleToggleAnswers}
              className={`pointer-events-auto px-6 py-3 rounded-full font-black text-xs md:text-sm uppercase tracking-widest shadow-2xl transition-[background-color,border-color,color,transform] active:scale-[0.97] border-2 ${
                showAnswers
                  ? 'bg-blue-500 text-white border-blue-400 shadow-sm'
                  : isNight
                    ? 'bg-zinc-800 text-zinc-300 border-white/10 hover:border-blue-500/50 hover:text-blue-400'
                    : 'bg-white text-zinc-600 border-zinc-200 hover:border-blue-500/50 hover:text-blue-500'
              }`}
            >
              {showAnswers
                ? language === 'ko'
                  ? '정답 숨기기'
                  : 'Hide Answers'
                : language === 'ko'
                  ? '👀 정답 보기'
                  : '👀 Show Answers'}
            </button>
          </div>
        )}
      </div>

      {isFullscreen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className={`fixed inset-0 z-[9999] flex flex-col ${isNight ? 'bg-zinc-950' : 'bg-white'} animate-[fadeIn_200ms_ease-out] overflow-hidden select-none`}
          >
            {/* Top Control Bar with safe area awareness */}
            <div className="absolute top-0 left-0 right-0 z-[10002] px-6 pt-[calc(env(safe-area-inset-top,0px)+1.5rem)] flex justify-between items-start pointer-events-none gap-4">
              <div className="flex gap-4 pointer-events-auto shrink-0">
                <button
                  onClick={() => setShowFullscreenSettings(!showFullscreenSettings)}
                  className={`w-14 h-14 rounded-full ${isNight ? 'bg-black/60 border-white/20 text-white/90' : 'bg-white/80 border-zinc-200 text-zinc-900'} backdrop-blur-xl border-2 ${showFullscreenSettings ? 'border-orange-500 text-orange-500 opacity-100' : 'opacity-40 hover:opacity-100'} transition-[border-color,color,opacity,transform] flex items-center justify-center text-2xl shadow-2xl active:scale-90 group relative`}
                  title={language === 'ko' ? '정답 설정' : 'Overlay Settings'}
                >
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 12h7.5"
                    />
                  </svg>

                  {showFullscreenSettings && (
                    <div
                      className={`absolute top-20 left-0 flex flex-col gap-4 ${isNight ? 'bg-black/90 border-white/20' : 'bg-white/95 border-zinc-200'} backdrop-blur-2xl p-6 rounded-3xl border shadow-[0_30px_70px_rgba(0,0,0,0.7)] animate-[fadeIn_200ms_ease-out]-up origin-top-left w-max z-[10003]`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex flex-col gap-3">
                        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] px-1">
                          {language === 'ko' ? '정답 크기' : 'Answer Size'}
                        </span>
                        <div className="flex items-center gap-4">
                          <span className="text-sm opacity-50">A</span>
                          <input
                            type="range"
                            min="0.4"
                            max="1.4"
                            step="0.05"
                            value={bubbleScale}
                            onChange={(e) => setBubbleScale(parseFloat(e.target.value))}
                            className={`w-36 accent-orange-500 cursor-pointer h-2 ${isNight ? 'bg-white/10' : 'bg-zinc-200'} rounded-full appearance-none`}
                          />
                          <span className="text-xl font-black">A</span>
                        </div>
                      </div>
                      <div className="w-full h-px bg-white/10"></div>
                      <button
                        onClick={resetPositions}
                        className="w-full py-4 rounded-2xl bg-white/5 text-white hover:bg-white/10 transition-[background-color,transform] flex items-center justify-center gap-3 text-xs font-black uppercase tracking-widest active:scale-[0.97] border border-white/10"
                      >
                        <span className="text-lg">🔄</span>{' '}
                        {language === 'ko' ? '위치 초기화' : 'Reset Positions'}
                      </button>
                    </div>
                  )}
                </button>

                {/* Toggle Button for Answers in Fullscreen */}
                {!isLoadingItems && items.length > 0 && (
                  <div className="flex justify-center pointer-events-none absolute left-1/2 -translate-x-1/2">
                    <button
                      onClick={handleToggleAnswers}
                      className={`pointer-events-auto px-6 py-3 rounded-full font-black text-xs md:text-sm uppercase tracking-widest shadow-2xl transition-[background-color,border-color,color,transform] active:scale-[0.97] border-2 ${
                        showAnswers
                          ? 'bg-blue-500 text-white border-blue-400 shadow-sm'
                          : 'bg-zinc-900 text-zinc-300 border-white/20 hover:border-blue-500/50 hover:text-blue-400'
                      }`}
                    >
                      {showAnswers
                        ? language === 'ko'
                          ? '정답 숨기기'
                          : 'Hide Answers'
                        : language === 'ko'
                          ? '👀 정답 보기'
                          : '👀 Show Answers'}
                    </button>
                  </div>
                )}

                <button
                  onClick={() => setViewMode(viewMode === 'fit' ? 'fill' : 'fit')}
                  className={`w-14 h-14 rounded-full ${isNight ? 'bg-black/60 border-white/20 text-white' : 'bg-white/80 border-zinc-200 text-zinc-900'} backdrop-blur-xl border-2 flex items-center justify-center opacity-40 hover:opacity-100 transition-opacity shadow-2xl active:scale-90`}
                  title={
                    viewMode === 'fit'
                      ? language === 'ko'
                        ? '화면에 꽉 차게'
                        : 'Fill Screen'
                      : language === 'ko'
                        ? '전체 보기'
                        : 'Fit to Screen'
                  }
                >
                  {viewMode === 'fit' ? (
                    <svg
                      className="w-8 h-8"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5l-4.5-4.5"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-8 h-8"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 3.75H4.5A1.125 1.125 0 003.375 4.875V9.375M9 3.75L3.375 9.375M9 20.25H4.5A1.125 1.125 0 013.375 19.125V14.625M9 20.25L3.375 14.625M15 3.75H19.5A1.125 1.125 0 0120.625 4.875V9.375M15 3.75L20.625 9.375M15 20.25H19.5A1.125 1.125 0 0020.625 19.125V14.625M15 20.25L20.625 14.625"
                      />
                    </svg>
                  )}
                </button>
              </div>

              <button
                onClick={() => setIsFullscreen(false)}
                className="w-14 h-14 rounded-full bg-orange-600/90 hover:bg-orange-500 backdrop-blur-xl flex items-center justify-center text-black opacity-40 hover:opacity-100 transition-[background-color,opacity,transform] active:scale-90 border-2 border-white/30 pointer-events-auto shadow-2xl group shrink-0"
              >
                <svg
                  className="w-10 h-10 group-hover:rotate-90 transition-transform duration-200"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={4}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div
              className="flex-1 w-full h-full relative flex items-center justify-center overflow-auto custom-scrollbar"
              onClick={() => setIsFullscreen(false)}
            >
              <div
                onClick={(e) => e.stopPropagation()}
                className={`relative z-10 transform-gpu flex items-center justify-center p-4 md:p-12 ${viewMode === 'fill' ? 'w-full h-auto mt-24 mb-12' : 'w-full h-full'}`}
              >
                {renderOverlayContent(true)}
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
};
