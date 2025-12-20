
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

type Mode = 'view' | 'edit';

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return isMobile;
};

export const WorksheetOverlay: React.FC<Props> = ({ imageUrl, items, isInteractive = true, focusedId, className }) => {
  const { user, setShowPaywall } = useAuth();
  const { t } = useLanguage();
  const [imageLoaded, setImageLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [stickers, setStickers] = useState<{ [key: number]: { ymin: number; xmin: number; ymax: number; xmax: number, text?: string } }>({});
  const isMobile = useIsMobile();

  // Answer Scaling State
  const [globalStickerScale, setGlobalStickerScale] = useState(1.1); // Default slightly larger for visibility

  // Viewport State
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [mode, setMode] = useState<Mode>('view');
  const [isPeeking, setIsPeeking] = useState(false);
  
  useEffect(() => {
    if (!isMobile) {
        setMode('edit');
        setScale(1);
        setPosition({ x: 0, y: 0 });
    } else {
        setMode('view');
    }
  }, [isMobile]);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState("");

  useEffect(() => {
    const initialStickers: any = {};
    items.forEach(item => {
      initialStickers[item.id] = { ...item.bounding_box, text: item.correct_answer };
    });
    setStickers(initialStickers);
  }, [items]);

  const [activeOperation, setActiveOperation] = useState<{
    type: 'drag' | 'resize' | 'pan';
    id?: number;
    startX: number;
    startY: number;
    initialBox?: { ymin: number; xmin: number; ymax: number; xmax: number };
    initialPos?: { x: number; y: number };
  } | null>(null);

  const getStyle = (id: number, originalBox?: any) => {
    const box = stickers[id] || originalBox;
    if (!box) return { display: 'none' };
    
    // Width and Height are based on bounding box percentage 0-1000
    const w = ((box.xmax - box.xmin) / 1000) * 100;
    const h = ((box.ymax - box.ymin) / 1000) * 100;

    // Center point of the original box
    const centerX = ((box.xmin + box.xmax) / 2 / 1000) * 100;
    const centerY = ((box.ymin + box.ymax) / 2 / 1000) * 100;

    // Apply global scaling relative to center
    const scaledWidth = w * globalStickerScale;
    const scaledHeight = h * globalStickerScale;

    return {
      top: `${centerY - scaledHeight/2}%`,
      left: `${centerX - scaledWidth/2}%`,
      width: `${scaledWidth}%`,
      height: `${scaledHeight}%`,
    };
  };

  const estimateTextWidth = (text: string) => {
    let width = 0;
    const t = text || "";
    for (let i = 0; i < t.length; i++) {
        const c = t[i];
        if (/[il1\.,':;!|]/.test(c)) width += 5;
        else if (/[mwMW]/.test(c)) width += 13;
        else if (/[A-Z]/.test(c)) width += 10;
        else if (/\s/.test(c)) width += 5;
        else width += 9;
    }
    return Math.max(width + 24, 40); 
  };

  const handleStart = (e: React.MouseEvent | React.TouchEvent, operationType: 'drag' | 'resize' | 'pan', id?: number) => {
    if (!isInteractive) return;
    if (mode === 'edit' && operationType === 'pan') return;
    if (mode === 'view' && operationType !== 'pan') return;

    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

    if (operationType === 'pan') {
       setActiveOperation({ type: 'pan', startX: clientX, startY: clientY, initialPos: { ...position } });
    } else if (id !== undefined) {
       e.stopPropagation();
       const currentBox = stickers[id] || items.find(i => i.id === id)?.bounding_box;
       if (!currentBox) return;
       setActiveOperation({ type: operationType, id, startX: clientX, startY: clientY, initialBox: { ...currentBox } });
    }
  };

  useEffect(() => {
    const handleMove = (clientX: number, clientY: number) => {
      if (!activeOperation || !containerRef.current) return;
      const { type, id, startX, startY, initialBox, initialPos } = activeOperation;

      if (type === 'pan' && initialPos) {
        setPosition({ x: initialPos.x + (clientX - startX), y: initialPos.y + (clientY - startY) });
      } 
      else if ((type === 'drag' || type === 'resize') && initialBox && id !== undefined) {
        const rect = containerRef.current.getBoundingClientRect();
        const deltaX = ((clientX - startX) / (rect.width / scale)) * 1000; 
        const deltaY = ((clientY - startY) / (rect.height / scale)) * 1000;

        setStickers(prev => {
          const newBox = { ...prev[id] };
          if (type === 'drag') {
            newBox.xmin = initialBox.xmin + deltaX; 
            newBox.xmax = initialBox.xmax + deltaX; 
            newBox.ymin = initialBox.ymin + deltaY; 
            newBox.ymax = initialBox.ymax + deltaY;
          } else if (type === 'resize') {
            const newWidth = Math.max(10, (initialBox.xmax - initialBox.xmin) + deltaX);
            const newHeight = Math.max(10, (initialBox.ymax - initialBox.ymin) + deltaY);
            newBox.xmax = newBox.xmin + newWidth; 
            newBox.ymax = newBox.ymin + newHeight;
          }
          return { ...prev, [id]: newBox };
        });
      }
    };

    const handleMouseMove = (e: MouseEvent) => handleMove(e.clientX, e.clientY);
    const handleTouchMove = (e: TouchEvent) => handleMove(e.touches[0].clientX, e.touches[0].clientY);
    const handleEnd = () => setActiveOperation(null);

    if (activeOperation) {
      window.addEventListener('mousemove', handleMouseMove); 
      window.addEventListener('mouseup', handleEnd);
      window.addEventListener('touchmove', handleTouchMove, { passive: false }); 
      window.addEventListener('touchend', handleEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove); 
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleTouchMove); 
      window.removeEventListener('touchend', handleEnd);
    };
  }, [activeOperation, scale]);

  const startEditing = (e: React.MouseEvent | React.TouchEvent, id: number, currentText: string) => {
    e.stopPropagation();
    if (mode !== 'edit') setMode('edit');
    setEditingId(id);
    setEditText(currentText);
  };

  const saveEdit = (id: number) => {
    setStickers(prev => ({ ...prev, [id]: { ...prev[id], text: editText } }));
    setEditingId(null);
  };

  const playAudio = (text: string) => {
    if (user?.plan !== 'pro') {
      setShowPaywall(true);
      return;
    }
    if ('speechSynthesis' in window && !editingId) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handlePeekStart = () => setIsPeeking(true);
  const handlePeekEnd = () => setIsPeeking(false);

  return (
    <div className="flex flex-col gap-2 w-full h-full">
        {/* --- DYNAMIC TOOLBAR --- */}
        <div className="flex items-center justify-between bg-zinc-900/80 backdrop-blur-md border border-white/10 p-2.5 rounded-2xl mb-2 shadow-lg shrink-0 z-20 relative">
            <div className="flex items-center gap-1 bg-black/40 rounded-xl p-1">
                <button 
                    onClick={() => setMode('view')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${mode === 'view' ? 'bg-zinc-700 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                    <span>✋</span> {isMobile ? 'Pan' : 'View'}
                </button>
                <button 
                    onClick={() => setMode('edit')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${mode === 'edit' ? 'bg-orange-600 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                    <span>✍️</span> Edit
                </button>
            </div>

            <div className="flex items-center gap-4">
                {/* Answer Size Controls */}
                <div className="flex items-center gap-2 bg-black/40 px-3 py-1 rounded-xl border border-white/10">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest hidden md:block">Answer Size</span>
                    <div className="flex items-center gap-1">
                        <button onClick={() => setGlobalStickerScale(s => Math.max(0.5, s - 0.1))} className="w-8 h-8 flex items-center justify-center bg-zinc-800 rounded-lg hover:bg-zinc-700 text-white transition-colors text-lg font-bold">-</button>
                        <span className="text-xs font-mono w-10 text-center text-orange-400 font-bold">{Math.round(globalStickerScale * 100)}%</span>
                        <button onClick={() => setGlobalStickerScale(s => Math.min(2.5, s + 0.1))} className="w-8 h-8 flex items-center justify-center bg-zinc-800 rounded-lg hover:bg-zinc-700 text-white transition-colors text-lg font-bold">+</button>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button 
                        onMouseDown={handlePeekStart}
                        onMouseUp={handlePeekEnd}
                        onTouchStart={handlePeekStart}
                        onTouchEnd={handlePeekEnd}
                        className="w-10 h-10 flex items-center justify-center bg-indigo-600 rounded-xl hover:bg-indigo-500 text-white shadow-lg active:scale-90 transition-transform text-lg"
                        title="Hold to Peek"
                    >
                        👁️
                    </button>
                </div>
            </div>
        </div>

        <div className={`w-full flex justify-center bg-zinc-950 rounded-2xl border border-zinc-800 relative overflow-hidden ${className || 'h-[600px]'}`}>
            <div 
                className="relative w-full h-full"
                onMouseDown={(e) => handleStart(e, 'pan')}
                onTouchStart={(e) => handleStart(e, 'pan')}
                style={{ cursor: mode === 'view' ? 'grab' : 'default' }}
            >
                <div 
                    ref={containerRef}
                    className="relative w-full transition-transform duration-75 ease-out origin-top-left"
                    style={{ 
                        transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                        width: '100%' 
                    }}
                >
                    <img 
                        src={imageUrl} 
                        alt="Worksheet" 
                        className={`w-full h-auto block transition-opacity duration-500 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                        onLoad={() => setImageLoaded(true)}
                        draggable={false}
                    />
                    
                    {imageLoaded && items.map((item, index) => {
                        const isFocused = focusedId === null || focusedId === undefined || item.id === focusedId;
                        const opacityClass = isPeeking ? 'opacity-0' : (isFocused ? 'opacity-100' : 'opacity-30 grayscale');
                        
                        const isMcq = item.type === 'mcq' || item.type === 'MCQ';
                        const stickerData = stickers[item.id];
                        const rawText = stickerData?.text || item.correct_answer;
                        
                        // Use actual item ID from AI if it matches numbering, otherwise fallback to index
                        const displayText = rawText.match(/^\d+/) ? rawText : `${item.id}. ${rawText}`;
                        const isEditing = editingId === item.id;
                        
                        const textWidth = estimateTextWidth(displayText);
                        const viewBoxWidth = Math.max(textWidth, 40); 
                        const viewBoxHeight = 22;

                        return (
                            <div
                                key={item.id}
                                style={getStyle(item.id, item.bounding_box)}
                                className={`absolute group z-10 transition-all duration-200 ${mode === 'edit' ? 'cursor-grab active:cursor-grabbing pointer-events-auto' : 'pointer-events-none'} ${opacityClass}`}
                                onMouseDown={(e) => handleStart(e, 'drag', item.id)}
                                onTouchStart={(e) => handleStart(e, 'drag', item.id)}
                                onDoubleClick={(e) => startEditing(e, item.id, displayText)}
                            >
                                <div 
                                    className={`w-full h-full relative box-border transition-transform ${
                                        activeOperation?.id === item.id ? 'z-50 ring-2 ring-orange-400' : ''
                                    } ${isMcq ? '' : 'bg-white/90 shadow-2xl rounded-lg border border-orange-200/80'}`}
                                    style={isEditing ? { containerType: 'size' } as React.CSSProperties : {}} 
                                >
                                    {isMcq ? (
                                        <>
                                            <div 
                                                className="w-full h-full border-[4px] border-orange-600 rounded-full bg-orange-500/25 box-border pointer-events-auto shadow-xl hover:bg-orange-500/40 transition-colors" 
                                                onClick={() => playAudio(displayText)}
                                            ></div>
                                            <div 
                                                className="absolute -top-12 left-1/2 -translate-x-1/2 bg-white border border-orange-300 px-3 py-1.5 rounded-xl shadow-2xl text-[12px] font-black text-orange-600 whitespace-nowrap pointer-events-none transform -translate-y-full ring-2 ring-orange-100"
                                                style={{transform: `scale(${1/scale})` }}
                                            >
                                                {displayText}
                                            </div>
                                        </>
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center overflow-hidden pointer-events-auto" onClick={() => playAudio(displayText)}>
                                            {isEditing ? (
                                                <input 
                                                    autoFocus
                                                    className="w-full h-full text-center text-orange-600 font-bold bg-transparent border-none outline-none p-0 m-0 font-hand"
                                                    style={{ fontSize: '70cqh' }}
                                                    value={editText}
                                                    onChange={(e) => setEditText(e.target.value)}
                                                    onBlur={() => saveEdit(item.id)}
                                                    onKeyDown={(e) => e.key === 'Enter' && saveEdit(item.id)}
                                                    onMouseDown={(e) => e.stopPropagation()}
                                                />
                                            ) : (
                                                <svg 
                                                    viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
                                                    width="100%" 
                                                    height="100%" 
                                                    preserveAspectRatio="xMidYMid meet"
                                                    className="drop-shadow-sm select-none"
                                                >
                                                    <text 
                                                        x="50%" 
                                                        y="50%" 
                                                        fontSize="16" 
                                                        fontFamily="'Patrick Hand', cursive" 
                                                        fontWeight="bold"
                                                        fill="#ea580c" 
                                                        textAnchor="middle" 
                                                        dominantBaseline="middle"
                                                    >
                                                        {displayText}
                                                    </text>
                                                </svg>
                                            )}
                                        </div>
                                    )}

                                    {isInteractive && mode === 'edit' && !isEditing && (
                                        <div 
                                            className="absolute -bottom-4 -right-4 w-9 h-9 bg-orange-500 rounded-2xl cursor-nwse-resize opacity-0 group-hover:opacity-100 flex items-center justify-center shadow-xl z-50 hover:bg-orange-600 transition-all pointer-events-auto border-2 border-white"
                                            style={{ transform: `scale(${1/scale})` }}
                                            onMouseDown={(e) => handleStart(e, 'resize', item.id)}
                                            onTouchStart={(e) => handleStart(e, 'resize', item.id)}
                                        >
                                            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    </div>
  );
};
