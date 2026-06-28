import React, { useEffect, useState, useRef, useCallback } from 'react';
import { WorksheetItem } from '../types';
import { generateSimilarWorksheet } from '../services/geminiService';
import { ChekkiMascot } from './Icons';
import { useLanguage } from '../contexts/LanguageContext';
import { Spinner } from '@phosphor-icons/react';

interface Props {
  originalItems: WorksheetItem[];
  onClose: () => void;
  isNight?: boolean;
}

export const CloneWorksheetModal: React.FC<Props> = ({
  originalItems,
  onClose,
  isNight = true,
}) => {
  const [items, setItems] = useState<WorksheetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { t, language } = useLanguage();

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
      const newItems = await generateSimilarWorksheet(itemsToClone, language, controller.signal);
      setItems(newItems);
    } catch (e: any) {
      if (e.name === 'AbortError') return;
      console.error('Failed to generate clone', e);
    } finally {
      setLoading(false);
    }
  }, [language]);

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


  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={onClose}></div>

      <div
        className={`relative ${isNight ? 'bg-zinc-900 border-white/10' : 'bg-white border-zinc-200'} rounded-3xl w-full max-w-4xl h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-fade-in-up border`}
      >
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
          <button
            onClick={onClose}
            className="min-w-[48px] min-h-[48px] rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="bg-gray-50 px-6 py-2 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsDigitalMode(false)}
              className={`px-4 py-2 text-xs font-black rounded-lg transition-all min-h-[44px] ${!isDigitalMode ? 'bg-zinc-800 text-white shadow-md' : 'text-zinc-500 hover:text-zinc-800'}`}
            >
              Read / Print
            </button>
            <button
              onClick={() => setIsDigitalMode(true)}
              className={`px-4 py-2 text-xs font-black rounded-lg transition-all min-h-[44px] flex items-center gap-2 ${isDigitalMode ? 'bg-indigo-600 text-white shadow-md' : 'text-zinc-500 hover:text-zinc-800'}`}
            >
              <svg
                className="w-3 h-3"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
              </svg>
              Tablet / Trace
            </button>
          </div>
          {isDigitalMode && (
            <div className="flex items-center gap-3">
              <button
                onClick={clearCanvas}
                className="text-xs font-bold text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg border border-red-200 min-h-[44px]"
              >
                Clear
              </button>
              {hasDrawn && (
                <button
                  onClick={onClose}
                  className="bg-green-600 text-white px-4 py-1.5 rounded-lg font-bold text-xs shadow-lg animate-bounce min-h-[44px]"
                >
                  Finish & Get Stamp!
                </button>
              )}
            </div>
          )}
        </div>

        <div
          className={`flex-1 overflow-y-auto custom-scrollbar bg-gray-100 p-4 md:p-8 flex flex-col items-center relative ${isDigitalMode ? 'overflow-hidden touch-none' : ''}`}
        >
          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center space-y-6">
              <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
              <p className="text-gray-500 font-bold animate-pulse">Designing practice sheet...</p>
            </div>
          ) : (
            <div className="relative w-full max-w-[210mm] shadow-2xl animate-fade-in-up origin-top">
              <div
                ref={containerRef}
                className="bg-white w-full h-auto min-h-[297mm] p-[10mm] md:p-[20mm] flex flex-col pointer-events-none select-none overflow-hidden"
              >
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b-2 border-gray-900 pb-4 md:pb-8 mb-8 md:mb-12 gap-4">
                  <div>
                    <h1 className="text-2xl md:text-3xl font-black text-gray-900 uppercase tracking-tighter">
                      Daily Practice
                    </h1>
                    <span className="text-xs font-bold text-indigo-600">
                      Generated by Chekki AI
                    </span>
                  </div>
                  <div className="flex gap-4 md:gap-10 w-full md:w-auto">
                    <div className="flex flex-col gap-1 flex-1 md:flex-none">
                      <span className="text-[10px] font-bold text-gray-400 uppercase">Name</span>
                      <div className="w-full md:w-40 border-b border-gray-300"></div>
                    </div>
                    <div className="flex flex-col gap-1 flex-1 md:flex-none">
                      <span className="text-[10px] font-bold text-gray-400 uppercase">Date</span>
                      <div className="w-full md:w-40 border-b border-gray-300"></div>
                    </div>
                  </div>
                </div>

                <div className="flex-1 space-y-8 md:space-y-12">
                  {items.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex flex-col gap-3 md:gap-4 pb-6 md:pb-10 border-b border-gray-100 last:border-0"
                    >
                      <div className="flex gap-4 items-baseline">
                        <span className="text-xl font-black text-indigo-600">{idx + 1}.</span>
                        <span className="text-lg md:text-xl font-bold text-gray-800 leading-tight">
                          {item.question_text}
                        </span>
                      </div>
                      <div className="w-full min-h-[60px] md:min-h-[80px] border-b-2 border-dashed border-gray-200 relative flex items-center justify-center py-4">
                        <div className="font-hand text-3xl md:text-4xl text-gray-100 tracking-widest text-center select-none uppercase">
                          {item.correct_answer}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-12 pt-10 border-t border-gray-100 flex justify-between text-[11px] text-gray-400 font-bold uppercase tracking-widest">
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
          <button
            onClick={onClose}
            className="px-8 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100 min-h-[48px]"
          >
            Cancel
          </button>
          
        </div>
      </div>
    </div>
  );
};
