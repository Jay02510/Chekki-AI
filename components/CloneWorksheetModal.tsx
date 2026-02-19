
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { WorksheetItem } from '../types';
import { generateSimilarWorksheet } from '../services/geminiService';
import { ChekkiMascot } from './Icons';
import { useLanguage } from '../contexts/LanguageContext';
import { RewardOverlay } from './RewardOverlay';

interface Props {
    originalItems: WorksheetItem[];
    onClose: () => void;
}

export const CloneWorksheetModal: React.FC<Props> = ({ originalItems, onClose }) => {
    const [items, setItems] = useState<WorksheetItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [showReward, setShowReward] = useState(false);
    const { t } = useLanguage();

    const [isDigitalMode, setIsDigitalMode] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [hasDrawn, setHasDrawn] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    const fetchClone = useCallback(async (itemsToClone: WorksheetItem[]) => {
        if (abortControllerRef.current) abortControllerRef.current.abort();
        const controller = new AbortController();
        abortControllerRef.current = controller;

        setLoading(true);
        try {
            const newItems = await generateSimilarWorksheet(itemsToClone, controller.signal);
            setItems(newItems);
        } catch (e: any) {
            if (e.name === 'AbortError') return;
            console.error("Failed to generate clone", e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (originalItems.length > 0) {
            fetchClone(originalItems);
        }
        return () => {
            if (abortControllerRef.current) abortControllerRef.current.abort();
        };
    }, [originalItems, fetchClone]);

    useEffect(() => {
        if (isDigitalMode && canvasRef.current && containerRef.current) {
            const canvas = canvasRef.current;
            const container = containerRef.current;
            canvas.width = container.offsetWidth;
            canvas.height = container.offsetHeight;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                ctx.strokeStyle = '#3b82f6';
                ctx.lineWidth = 4;
            }
        }
    }, [isDigitalMode, items, loading]);

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDigitalMode || !canvasRef.current) return;
        setIsDrawing(true);
        setHasDrawn(true);
        const ctx = canvasRef.current.getContext('2d');
        if (!ctx) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
        ctx.beginPath();
        ctx.moveTo(clientX - rect.left, clientY - rect.top);
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing || !isDigitalMode || !canvasRef.current) return;
        const ctx = canvasRef.current.getContext('2d');
        if (!ctx) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
        ctx.lineTo(clientX - rect.left, clientY - rect.top);
        ctx.stroke();
    };

    const stopDrawing = () => setIsDrawing(false);

    const clearCanvas = () => {
        if (!canvasRef.current) return;
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        setHasDrawn(false);
    };

    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Chekki Practice Worksheet</title>
                <style>
                    body { font-family: 'Nunito', sans-serif; padding: 40px; margin: 0; color: #1f2937; }
                    .page { max-width: 800px; margin: 0 auto; background: white; }
                    .header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 50px; border-bottom: 2px solid #1f2937; padding-bottom: 20px; }
                    .brand-text { font-size: 24px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; }
                    .brand-sub { font-size: 12px; color: #f97316; font-weight: bold; }
                    .question-list { display: flex; flex-direction: column; gap: 40px; }
                    .q-header { display: flex; gap: 12px; margin-bottom: 15px; align-items: baseline; }
                    .q-num { font-size: 18px; font-weight: 800; color: #f97316; min-width: 25px; }
                    .q-text { font-size: 18px; font-weight: 600; line-height: 1.4; }
                    .writing-area { height: 50px; width: 100%; border-bottom: 1.5px dashed #9ca3af; position: relative; }
                </style>
            </head>
            <body>
                <div class="page">
                    <div class="header">
                        <div><div class="brand-text">Practice Sheet</div><div class="brand-sub">Generated by Chekki AI</div></div>
                        <div style="font-size: 10px; color: #999;">Name: ____________________ Date: ___________</div>
                    </div>
                    <div class="question-list">
                        ${items.map((item, index) => `
                            <div class="question-item">
                                <div class="q-header"><span class="q-num">${index + 1}.</span><span class="q-text">${item.question_text}</span></div>
                                <div class="writing-area"></div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                <script>window.onload = () => window.print();</script>
            </body>
            </html>
            `);
            printWindow.document.close();
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={onClose}></div>

            {showReward && <RewardOverlay score={100} onClose={() => { setShowReward(false); onClose(); }} />}

            <div className="relative bg-[#f9fafb] rounded-2xl w-full max-w-4xl h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-fade-in-up">

                <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm z-10 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                            <span className="text-xl">🪄</span>
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 font-display">Practice Mode</h2>
                            <p className="text-xs text-gray-500 font-medium">Extra practice for your child</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="min-w-[48px] min-h-[48px] rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors">✕</button>
                </div>

                <div className="bg-gray-50 px-6 py-2 border-b border-gray-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <button onClick={() => setIsDigitalMode(false)} className={`px-4 py-2 text-xs font-black rounded-lg transition-all min-h-[44px] ${!isDigitalMode ? 'bg-zinc-800 text-white shadow-md' : 'text-zinc-500 hover:text-zinc-800'}`}>Read / Print</button>
                        <button onClick={() => setIsDigitalMode(true)} className={`px-4 py-2 text-xs font-black rounded-lg transition-all min-h-[44px] ${isDigitalMode ? 'bg-indigo-600 text-white shadow-md' : 'text-zinc-500 hover:text-zinc-800'}`}>✏️ Tablet / Trace</button>
                    </div>
                    {isDigitalMode && (
                        <div className="flex items-center gap-3">
                            <button onClick={clearCanvas} className="text-xs font-bold text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg border border-red-200 min-h-[44px]">Clear</button>
                            {hasDrawn && (
                                <button onClick={() => setShowReward(true)} className="bg-green-600 text-white px-4 py-1.5 rounded-lg font-bold text-xs shadow-lg animate-bounce min-h-[44px]">Finish & Get Stamp!</button>
                            )}
                        </div>
                    )}
                </div>

                <div className={`flex-1 overflow-y-auto custom-scrollbar bg-gray-100 p-8 flex justify-center relative ${isDigitalMode ? 'overflow-hidden touch-none' : ''}`}>
                    {loading ? (
                        <div className="flex flex-col items-center justify-center space-y-6">
                            <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                            <p className="text-gray-500 font-bold animate-pulse">Designing practice sheet...</p>
                        </div>
                    ) : (
                        <div className="relative w-full max-w-[210mm] min-h-[297mm] shadow-2xl animate-fade-in-up">
                            <div ref={containerRef} className="bg-white w-full h-full p-[20mm] flex flex-col pointer-events-none select-none">
                                <div className="flex justify-between items-end border-b-2 border-gray-900 pb-8 mb-12">
                                    <div>
                                        <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tighter">Daily Practice</h1>
                                        <span className="text-xs font-bold text-indigo-600">Generated by Chekki AI</span>
                                    </div>
                                    <div className="flex gap-10">
                                        <div className="flex flex-col gap-1"><span className="text-[10px] font-bold text-gray-400 uppercase">Name</span><div className="w-40 border-b border-gray-300"></div></div>
                                        <div className="flex flex-col gap-1"><span className="text-[10px] font-bold text-gray-400 uppercase">Date</span><div className="w-40 border-b border-gray-300"></div></div>
                                    </div>
                                </div>

                                <div className="flex-1 space-y-8 md:space-y-12 h-full">
                                    {items.map((item, idx) => (
                                        <div key={idx} className="flex flex-col gap-3 md:gap-4 pb-6 md:pb-10 border-b border-gray-100 last:border-0">
                                            <div className="flex gap-4 items-baseline">
                                                <span className="text-xl font-black text-indigo-600">{idx + 1}.</span>
                                                <span className="text-lg md:text-xl font-bold text-gray-800 leading-tight">{item.question_text}</span>
                                            </div>
                                            <div className="w-full min-h-[60px] md:min-h-[80px] border-b-2 border-dashed border-gray-200 relative flex items-center justify-center py-4">
                                                <div className="font-hand text-3xl md:text-4xl text-gray-100 tracking-widest text-center select-none uppercase">{item.correct_answer}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-auto pt-10 border-t border-gray-100 flex justify-between text-[11px] text-gray-400 font-bold uppercase tracking-widest">
                                    <span>Chekki AI Practice</span>
                                    <span>Great Work Today! 🌟</span>
                                </div>
                            </div>

                            {isDigitalMode && (
                                <canvas
                                    ref={canvasRef}
                                    className="absolute inset-0 z-50 cursor-crosshair touch-none"
                                    onMouseDown={startDrawing}
                                    onMouseMove={draw}
                                    onMouseUp={stopDrawing}
                                    onMouseLeave={stopDrawing}
                                    onTouchStart={startDrawing}
                                    onTouchMove={draw}
                                    onTouchEnd={stopDrawing}
                                />
                            )}
                        </div>
                    )}
                </div>

                <div className="bg-white p-6 border-t border-gray-200 flex justify-end gap-3 shrink-0 z-10">
                    <button onClick={onClose} className="px-8 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100 min-h-[48px]">Cancel</button>
                    {!isDigitalMode && (
                        <button onClick={handlePrint} className="px-10 py-3 rounded-xl font-bold bg-zinc-900 text-white shadow-xl flex items-center gap-2 transform transition-all active:scale-95 min-h-[48px]">
                            <span>🖨️</span> Print PDF
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
