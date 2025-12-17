
import React, { useState, useRef, useEffect } from 'react';
import { WorksheetItem } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface Props {
  imageUrl: string;
  items: WorksheetItem[];
  isInteractive?: boolean;
  focusedId?: number | null; 
  className?: string;
}

type Mode = 'view' | 'edit'; // View = Pan/Zoom, Edit = Drag/Resize/Type

// Helper hook for responsive check
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
  const { user, setShowPaywall } = useAuth(); // Added Auth hook
  const [imageLoaded, setImageLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [stickers, setStickers] = useState<{ [key: number]: { ymin: number; xmin: number; ymax: number; xmax: number, text?: string } }>({});
  const isMobile = useIsMobile();

  // Viewport State (Zoom/Pan)
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [mode, setMode] = useState<Mode>('view');
  
  // PEEK MODE STATE
  const [isPeeking, setIsPeeking] = useState(false);
  
  // Force Edit mode and Reset View on Desktop
  useEffect(() => {
    if (!isMobile) {
        setMode('edit');
        setScale(1);
        setPosition({ x: 0, y: 0 });
    } else {
        setMode('view'); // Default to view/pan on mobile
    }
  }, [isMobile]);

  // Editing State
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState("");

  useEffect(() => {
    const initialStickers: any = {};
    items.forEach(item => {
      // Store original bounding box AND text
      initialStickers[item.id] = { ...item.bounding_box, text: item.correct_answer };
    });
    setStickers(initialStickers);
  }, [items]);

  // Drag/Resize State
  const [activeOperation, setActiveOperation] = useState<{
    type: 'drag' | 'resize' | 'pan';
    id?: number;
    startX: number;
    startY: number;
    initialBox?: { ymin: number; xmin: number; ymax: number; xmax: number };
    initialPos?: { x: number; y: number };
  } | null>(null);

  // --- HELPER: Get Style for Sticker (With Padding Inflation) ---
  const getStyle = (id: number, originalBox?: any) => {
    const box = stickers[id] || originalBox;
    if (!box) return { display: 'none' };
    
    // REDUCED PADDING: Kept at 0 to fit lines perfectly
    const padding = 0; 
    const paddedYmin = Math.max(0, box.ymin - padding);
    const paddedXmin = Math.max(0, box.xmin - padding);
    const paddedYmax = Math.min(1000, box.ymax + padding);
    const paddedXmax = Math.min(1000, box.xmax + padding);

    return {
      top: `${(paddedYmin / 1000) * 100}%`,
      left: `${(paddedXmin / 1000) * 100}%`,
      width: `${((paddedXmax - paddedXmin) / 1000) * 100}%`,
      height: `${((paddedYmax - paddedYmin) / 1000) * 100}%`,
    };
  };

  // --- HELPER: Estimate Text Width for Dynamic SVG Scaling ---
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
    // Add padding to ensure no clipping
    return Math.max(width + 16, 24); 
  };

  // --- HANDLERS: Mouse/Touch Start ---
  const handleStart = (e: React.MouseEvent | React.TouchEvent, operationType: 'drag' | 'resize' | 'pan', id?: number) => {
    if (!isInteractive) return;
    
    // Prevent panning if we are in edit mode (Desktop defaults to edit)
    if (mode === 'edit' && operationType === 'pan') return;
    if (mode === 'view' && operationType !== 'pan') return;

    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

    if (operationType === 'pan') {
       setActiveOperation({ type: 'pan', startX: clientX, startY: clientY, initialPos: { ...position } });
    } else if (id !== undefined) {
       // Stop bubbling so we don't trigger a pan on the background
       e.stopPropagation();
       const currentBox = stickers[id] || items.find(i => i.id === id)?.bounding_box;
       if (!currentBox) return;
       setActiveOperation({ type: operationType, id, startX: clientX, startY: clientY, initialBox: { ...currentBox } });
    }
  };

  // --- EFFECT: Global Move/End Listeners ---
  useEffect(() => {
    const handleMove = (clientX: number, clientY: number) => {
      if (!activeOperation || !containerRef.current) return;
      
      const { type, id, startX, startY, initialBox, initialPos } = activeOperation;

      if (type === 'pan' && initialPos) {
        // Pan Logic
        const deltaX = clientX - startX;
        const deltaY = clientY - startY;
        setPosition({ x: initialPos.x + deltaX, y: initialPos.y + deltaY });
      } 
      else if ((type === 'drag' || type === 'resize') && initialBox && id !== undefined) {
        // Sticker Logic (Only works in Edit Mode)
        const rect = containerRef.current.getBoundingClientRect();
        // Adjust deltas based on current scale to ensure 1:1 movement
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
    const handleTouchMove = (e: TouchEvent) => {
        // e.preventDefault(); // Prevent browser scrolling while dragging
        handleMove(e.touches[0].clientX, e.touches[0].clientY);
    };
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

  // --- EDITING LOGIC ---
  const startEditing = (e: React.MouseEvent | React.TouchEvent, id: number, currentText: string) => {
    e.stopPropagation();
    if (mode !== 'edit') {
        setMode('edit');
    }
    setEditingId(id);
    setEditText(currentText);
  };

  const saveEdit = (id: number) => {
    setStickers(prev => ({
        ...prev,
        [id]: { ...prev[id], text: editText }
    }));
    setEditingId(null);
  };

  // PRO FEATURE LOCK
  const playAudio = (text: string) => {
    // If not pro, show paywall
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

  // --- PEEK BUTTON LOGIC ---
  const handlePeekStart = () => setIsPeeking(true);
  const handlePeekEnd = () => setIsPeeking(false);


  return (
    <div className="flex flex-col gap-2 w-full h-full">
        {/* --- TOOLBAR (MOBILE ONLY) --- */}
        {isInteractive && isMobile && (
            <div className="flex items-center justify-between bg-zinc-900 border border-zinc-800 p-2 rounded-xl mb-2 shadow-sm shrink-0 z-20 relative">
                <div className="flex items-center gap-1 bg-zinc-800 rounded-lg p-0.5">
                    <button 
                        onClick={() => setMode('view')}
                        className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1 ${mode === 'view' ? 'bg-zinc-600 text-white shadow' : 'text-zinc-400 hover:text-zinc-200'}`}
                    >
                        <span>✋ Pan</span>
                    </button>
                    <button 
                        onClick={() => setMode('edit')}
                        className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1 ${mode === 'edit' ? 'bg-orange-600 text-white shadow' : 'text-zinc-400 hover:text-zinc-200'}`}
                    >
                        <span>👆 Edit</span>
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    {/* Peek Button (Mobile) */}
                    <button 
                        onMouseDown={handlePeekStart}
                        onMouseUp={handlePeekEnd}
                        onTouchStart={handlePeekStart}
                        onTouchEnd={handlePeekEnd}
                        className="w-8 h-8 flex items-center justify-center bg-indigo-600 rounded-full hover:bg-indigo-500 text-white shadow-lg active:scale-90 transition-transform mr-1"
                        title="Hold to Peek"
                    >
                        👁️
                    </button>

                    <button onClick={() => setScale(s => Math.max(0.5, s - 0.1))} className="w-8 h-8 flex items-center justify-center bg-zinc-800 rounded-full hover:bg-zinc-700 text-zinc-300 font-bold">-</button>
                    <span className="text-xs font-mono w-8 text-center text-zinc-500">{Math.round(scale * 100)}%</span>
                    <button onClick={() => setScale(s => Math.min(3, s + 0.1))} className="w-8 h-8 flex items-center justify-center bg-zinc-800 rounded-full hover:bg-zinc-700 text-zinc-300 font-bold">+</button>
                </div>
            </div>
        )}

        {/* --- TOOLBAR (DESKTOP) --- */}
        {isInteractive && !isMobile && (
             <div className="absolute top-4 right-4 z-50 flex gap-2">
                 <button 
                    onMouseDown={handlePeekStart}
                    onMouseUp={handlePeekEnd}
                    onMouseLeave={handlePeekEnd}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg shadow-lg font-bold text-sm flex items-center gap-2 active:scale-95 transition-transform cursor-pointer"
                 >
                    <span>👁️</span> Hold to Peek
                 </button>
             </div>
        )}

        {/* --- CANVAS CONTAINER --- */}
        {/* On desktop, we remove the fixed height and overflow-hidden to allow native scrolling */}
        <div className={`w-full flex justify-center bg-zinc-900 rounded-2xl border border-zinc-800 relative cursor-crosshair ${
          !isMobile ? 'overflow-y-auto overflow-x-hidden h-full block' : `overflow-hidden ${className || 'h-[600px]'}`
        }`}>
            
            {/* The Wrapper */}
            <div 
                className={!isMobile ? "relative w-full h-auto" : "relative w-full h-full"}
                onMouseDown={(e) => handleStart(e, 'pan')}
                onTouchStart={(e) => handleStart(e, 'pan')}
                style={{ cursor: mode === 'view' ? 'grab' : 'default' }}
            >
                {/* The Transform Content */}
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
                        
                        // Apply transparency when Peeking
                        const opacityClass = isPeeking 
                             ? 'opacity-0 transition-opacity duration-100' 
                             : (isFocused ? 'opacity-100 grayscale-0' : 'opacity-30 grayscale');
                        
                        const isMcq = item.type === 'mcq';
                        // Fixed: Access property text safely with optional chaining
                        const stickerData = stickers[item.id];
                        const rawText = stickerData?.text || item.correct_answer;
                        // NEW: Prepend Question Number
                        const displayText = `${index + 1}. ${rawText}`;
                        
                        const isEditing = editingId === item.id;
                        
                        // Calculate text width for dynamic SVG sizing
                        const textWidth = estimateTextWidth(displayText);
                        const viewBoxWidth = Math.max(textWidth, 24); 
                        
                        // UPDATED: Tighter viewbox height (20) to make text appear larger within the box
                        const viewBoxHeight = 20;

                        return (
                            <div
                                key={item.id}
                                style={getStyle(item.id, item.bounding_box)}
                                className={`absolute group z-10 transition-colors duration-200 ${mode === 'edit' ? 'cursor-grab active:cursor-grabbing pointer-events-auto' : 'pointer-events-none'} ${opacityClass}`}
                                onMouseDown={(e) => handleStart(e, 'drag', item.id)}
                                onTouchStart={(e) => handleStart(e, 'drag', item.id)}
                                onDoubleClick={(e) => startEditing(e, item.id, displayText)}
                            >
                                {/* Box Border & Background */}
                                <div 
                                    className={`w-full h-full relative box-border ${
                                        activeOperation?.id === item.id ? 'z-50 ring-2 ring-orange-400' : ''
                                    } ${isMcq ? '' : 'bg-white/70 shadow-sm rounded-md border border-orange-200/50'}`}
                                    // Enable container query support for child inputs
                                    style={isEditing ? { containerType: 'size' } as React.CSSProperties : {}} 
                                    onClick={(e) => { 
                                        if (!activeOperation && mode === 'edit') {
                                            // Single click in edit mode
                                        } else if (mode === 'view' || !isInteractive) {
                                            // In view mode, allow audio play
                                        }
                                    }}
                                >
                                    {isMcq ? (
                                        <>
                                            <div className="w-full h-full border-[3px] border-orange-600 rounded-full bg-orange-500/10 box-border pointer-events-auto" onClick={() => playAudio(displayText)}></div>
                                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white px-2 py-1 rounded shadow text-xs font-bold text-orange-600 whitespace-nowrap pointer-events-none transform -translate-y-full" style={{transform: `scale(${1/scale})`}}>
                                                {displayText}
                                            </div>
                                        </>
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center overflow-hidden pointer-events-auto" onClick={() => playAudio(displayText)}>
                                            {isEditing ? (
                                                <input 
                                                    autoFocus
                                                    className="w-full h-full text-center text-orange-600 font-bold bg-transparent border-none outline-none p-0 m-0 font-hand"
                                                    style={{ fontSize: '60cqh' }} // 60% of Container Height - "Fitted Text"
                                                    value={editText}
                                                    onChange={(e) => setEditText(e.target.value)}
                                                    onBlur={() => saveEdit(item.id)}
                                                    onKeyDown={(e) => e.key === 'Enter' && saveEdit(item.id)}
                                                    onMouseDown={(e) => e.stopPropagation()} // Allow selecting text
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

                                    {/* Resize Handle (Only in Edit Mode) */}
                                    {isInteractive && mode === 'edit' && !isEditing && (
                                        <div 
                                            className="absolute -bottom-3 -right-3 w-6 h-6 bg-orange-500 rounded-full cursor-nwse-resize opacity-0 group-hover:opacity-100 flex items-center justify-center shadow-lg z-50 hover:bg-orange-600 transition-all pointer-events-auto"
                                            style={{ transform: `scale(${1/scale})` }} // Counter-scale handle so it stays usable size
                                            onMouseDown={(e) => handleStart(e, 'resize', item.id)}
                                            onTouchStart={(e) => handleStart(e, 'resize', item.id)}
                                        >
                                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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

            {/* Mode Indicator Overlay (Mobile Friendly) */}
            {isMobile && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full pointer-events-none text-xs font-bold text-white border border-white/10 opacity-0 md:opacity-0 transition-opacity">
                    {mode === 'view' ? 'Pan & Zoom Mode' : 'Edit Mode'}
                </div>
            )}
        </div>
    </div>
  );
};
