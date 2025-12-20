
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
  const [globalStickerScale, setGlobalStickerScale] = useState(1.0);

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
    
    // Apply global scale to the width/height of the box
    const width = ((box.xmax - box.xmin) / 1000) * 100 * globalStickerScale;
    const height = ((box.ymax - box.ymin) / 1000) * 100 * globalStickerScale;

    return {
      top: `${(box.ymin / 1000) * 100}%`,
      left: `${(box.xmin / 1000) * 100}%`,
      width: `${width}%`,
      height: `${height}%`,
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
        else if (/\s/.test(c)) width += 4;
        else width += 8;
    }
    return Math.max(width + 16, 24); 
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
      utterance.rate = 0.9;
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
                <div className="flex items-center gap-2 bg-black/40 px-3 py-1 rounded-xl border border-white/5">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest hidden md:block">Answer Size</span>
                    <div className="flex items-center gap-1">
                        <button onClick={() => setGlobalStickerScale(s => Math.max(0.5, s - 0.1))} className="w-7 h-7 flex items-center justify-center bg-zinc-800 rounded-lg hover:bg-zinc-700 text-white transition-colors">-</button>
                        <span className="text-xs font-mono w-10 text-center text-orange-400 font-bold">{Math.round(globalStickerScale * 100)}%</span>
                        <button onClick={() => setGlobalStickerScale(s => Math.min(2.0, s + 0.1))} className="w-7 h-7 flex items-center justify-center bg-zinc-800 rounded-lg hover:bg-zinc-700 text-white transition-colors">+</button>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button 
                        onMouseDown={handlePeekStart}
                        onMouseUp={handlePeekEnd}
                        onTouchStart={handlePeekStart}
                        onTouchEnd={handlePeekEnd}
                        className="w-9 h-9 flex items-center justify-center bg-indigo-600 rounded-xl hover:bg-indigo-500 text-white shadow-lg active:scale-90 transition-transform"
                        title="Hold to Peek"
                    >
                        👁️
                    </button>
                    {isMobile && (
                        <div className="flex items-center gap-1">
                            <button onClick={() => setScale(s => Math.max(0.5, s - 0.1))} className="w-9 h-9 flex items-center justify-center bg-zinc-800 rounded-xl hover:bg-zinc-700 text-white font-bold">-</button>
                            <button onClick={() => setScale(s => Math.min(3, s + 0.1))} className="w-9 h-9 flex items-center justify-center bg-zinc-800 rounded-xl hover:bg-zinc-700 text-white font-bold">+</button>
                        </div>
                    )}
                </div>
            </div>
        </div>

        <div className={`w-full flex justify-center bg-zinc-950 rounded-2xl border border-zinc-800 relative ${
          !isMobile ? 'overflow-y-auto overflow-x-hidden h-full block' : `overflow-hidden ${className || 'h-[600px]'}`
        }`}>
            <div 
                className={!isMobile ? "relative w-full h-auto" : "relative w-full h-full"}
                onMouseDown={(e) => handleStart(e, 'pan')}
                onTouchStart={(e) => handleStart(e, 'pan')}
                style={{ cursor: mode === 'view' ? 'grab' : 'default' }}
            >
                <div 
                    ref={containerRef}
                    className="relative w-full transition-transform duration-75 ease-out origin-top-left"
                    style={!isMobile ? { width: '100%', position: 'relative' } : { 
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
                        const isFocused = focusedId === null || focusedId === undefined || item.id === focusedId || (item.group_id && items.find(i => i.id === focusedId)?.group_id === item.group_id);
                        const opacityClass = isPeeking ? 'opacity-0' : (isFocused ? 'opacity-100' : 'opacity-30 grayscale');
                        
                        const isMcq = item.type === 'mcq';
                        const stickerData = stickers[item.id];
                        const rawText = stickerData?.text || item.correct_answer;
                        const displayText = `${index + 1}. ${rawText}`;
                        const isEditing = editingId === item.id;
                        
                        const textWidth = estimateTextWidth(displayText);
                        const viewBoxWidth = Math.max(textWidth, 24); 
                        const viewBoxHeight = 20;

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
                                    } ${isMcq ? '' : 'bg-white/75 shadow-lg rounded-md border border-orange-200/50'}`}
                                    style={isEditing ? { containerType: 'size' } as React.CSSProperties : {}} 
                                >
                                    {isMcq ? (
                                        <>
                                            <div className="w-full h-full border-[3.5px] border-orange-600 rounded-full bg-orange-500/15 box-border pointer-events-auto shadow-md" onClick={() => playAudio(displayText)}></div>
                                            <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white border border-orange-200 px-2 py-1 rounded-lg shadow-xl text-[10px] font-bold text-orange-600 whitespace-nowrap pointer-events-none transform -translate-y-full" style={{transform: `scale(${1/scale})`}}>
                                                {displayText}
                                            </div>
                                        </>
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center overflow-hidden pointer-events-auto" onClick={() => playAudio(displayText)}>
                                            {isEditing ? (
                                                <input 
                                                    autoFocus
                                                    className="w-full h-full text-center text-orange-600 font-bold bg-transparent border-none outline-none p-0 m-0 font-hand"
                                                    style={{ fontSize: '65cqh' }}
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
                                            className="absolute -bottom-3 -right-3 w-7 h-7 bg-orange-500 rounded-xl cursor-nwse-resize opacity-0 group-hover:opacity-100 flex items-center justify-center shadow-xl z-50 hover:bg-orange-600 transition-all pointer-events-auto border-2 border-white"
                                            style={{ transform: `scale(${1/scale})` }}
                                            onMouseDown={(e) => handleStart(e, 'resize', item.id)}
                                            onTouchStart={(e) => handleStart(e, 'resize', item.id)}
                                        >
                                            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
