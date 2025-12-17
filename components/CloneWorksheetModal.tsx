
import React, { useEffect, useState, useRef } from 'react';
import { WorksheetItem } from '../types';
import { generateSimilarWorksheet } from '../services/geminiService';
import { ChekkiMascot } from './Icons';
import { useLanguage } from '../contexts/LanguageContext';

interface Props {
    originalItems: WorksheetItem[];
    onClose: () => void;
}

export const CloneWorksheetModal: React.FC<Props> = ({ originalItems, onClose }) => {
    const [items, setItems] = useState<WorksheetItem[]>([]);
    const [loading, setLoading] = useState(true);
    const { t } = useLanguage();
    
    // Digital Tracing Mode State
    const [isDigitalMode, setIsDigitalMode] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const fetchClone = async () => {
        setLoading(true);
        const newItems = await generateSimilarWorksheet(originalItems);
        setItems(newItems);
        setLoading(false);
    };

    useEffect(() => {
        fetchClone();
    }, [originalItems]);

    // Handle Canvas Resizing
    useEffect(() => {
        if (isDigitalMode && canvasRef.current && containerRef.current) {
            const canvas = canvasRef.current;
            const container = containerRef.current;
            
            // Match canvas size to the "Sheet" size
            canvas.width = container.offsetWidth;
            canvas.height = container.offsetHeight;
            
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                ctx.strokeStyle = '#0000FF'; // Blue Pen
                ctx.lineWidth = 3;
            }
        }
    }, [isDigitalMode, items, loading]);

    // Drawing Handlers
    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDigitalMode || !canvasRef.current) return;
        setIsDrawing(true);
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

    const stopDrawing = () => {
        setIsDrawing(false);
    };
    
    const clearCanvas = () => {
        if (!canvasRef.current) return;
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    };

    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Chekki Practice Worksheet</title>
                <link href="https://fonts.googleapis.com/css2?family=Patrick+Hand&family=Nunito:wght@400;600;700&display=swap" rel="stylesheet">
                <style>
                    body { font-family: 'Nunito', sans-serif; padding: 0; margin: 0; -webkit-print-color-adjust: exact; color: #1f2937; }
                    .page { padding: 40px; max-width: 800px; margin: 0 auto; background: white; }
                    
                    /* Header Section */
                    .header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 50px; border-bottom: 2px solid #1f2937; padding-bottom: 20px; }
                    .brand { display: flex; align-items: center; gap: 10px; }
                    .brand-text { font-size: 24px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #1f2937; }
                    .brand-sub { font-size: 12px; color: #f97316; font-weight: bold; }
                    
                    .meta-fields { display: flex; gap: 30px; }
                    .field { display: flex; flex-direction: column; gap: 5px; }
                    .label { font-size: 10px; font-weight: bold; text-transform: uppercase; color: #9ca3af; letter-spacing: 1px; }
                    .input-line { width: 150px; height: 30px; border-bottom: 1.5px solid #d1d5db; }

                    /* Questions */
                    .question-list { display: flex; flex-direction: column; gap: 40px; }
                    .question-item { break-inside: avoid; page-break-inside: avoid; }
                    
                    .q-header { display: flex; gap: 12px; margin-bottom: 15px; align-items: baseline; }
                    .q-num { font-size: 18px; font-weight: 800; color: #f97316; min-width: 25px; }
                    .q-text { font-size: 18px; font-weight: 600; line-height: 1.4; color: #111; }
                    
                    .writing-area { 
                        height: 50px; 
                        width: 100%; 
                        border-bottom: 1px solid #e5e7eb; 
                        position: relative;
                    }
                    .writing-area.dashed { border-bottom: 1.5px dashed #9ca3af; }
                    
                    /* Optional Answer Guide (Faint) */
                    .guide-text {
                        position: absolute;
                        bottom: 5px;
                        left: 0;
                        width: 100%;
                        text-align: center;
                        font-family: 'Patrick Hand', cursive;
                        font-size: 24px;
                        color: #e5e7eb; /* Very faint */
                        letter-spacing: 2px;
                        z-index: -1;
                    }

                    .footer { 
                        margin-top: 60px; 
                        padding-top: 20px; 
                        border-top: 1px solid #f3f4f6; 
                        text-align: center; 
                        font-size: 10px; 
                        color: #9ca3af; 
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    }
                </style>
            </head>
            <body>
                <div class="page">
                    <div class="header">
                        <div class="brand">
                            <div>
                                <div class="brand-text">Practice Sheet</div>
                                <div class="brand-sub">Generated by Chekki AI</div>
                            </div>
                        </div>
                        <div class="meta-fields">
                            <div class="field">
                                <span class="label">Name</span>
                                <div class="input-line"></div>
                            </div>
                            <div class="field">
                                <span class="label">Date</span>
                                <div class="input-line"></div>
                            </div>
                        </div>
                    </div>

                    <div class="question-list">
                        ${items.map((item, index) => `
                            <div class="question-item">
                                <div class="q-header">
                                    <span class="q-num">${index + 1}.</span>
                                    <span class="q-text">${item.question_text}</span>
                                </div>
                                <div class="writing-area dashed">
                                    <!-- Faint guide for the answer, helpful for tracing, otherwise mostly blank -->
                                    <div class="guide-text">${item.correct_answer}</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>

                    <div class="footer">
                        <span>Chekki AI - Mom's Homework Helper</span>
                        <span>Keep Growing! 🌱</span>
                    </div>
                </div>
                <script>
                    window.onload = () => { window.print(); }
                </script>
            </body>
            </html>
            `);
            printWindow.document.close();
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={onClose}></div>
            
            <div className="relative bg-[#f9fafb] rounded-2xl w-full max-w-3xl h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-fade-in-up">
                
                {/* Header (App UI) */}
                <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm z-10 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-pink-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
                            <span className="text-xl">🪄</span>
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 font-display">AI Practice Generator</h2>
                            <p className="text-xs text-gray-500 font-medium">Professional Worksheet Layout</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors">✕</button>
                </div>
                
                {/* --- TOOLBAR (DIGITAL MODE) --- */}
                <div className="bg-gray-50 px-6 py-2 border-b border-gray-200 flex items-center justify-between">
                     <div className="flex items-center gap-2">
                         <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Mode:</span>
                         <button 
                            onClick={() => setIsDigitalMode(false)}
                            className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${!isDigitalMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-500 border border-gray-200'}`}
                         >
                            Read / Print
                         </button>
                         <button 
                            onClick={() => setIsDigitalMode(true)}
                            className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors flex items-center gap-1 ${isDigitalMode ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30' : 'bg-white text-gray-500 border border-gray-200'}`}
                         >
                            <span>✏️</span> Tablet / Trace
                         </button>
                     </div>
                     {isDigitalMode && (
                         <button 
                            onClick={clearCanvas}
                            className="text-xs font-bold text-red-500 hover:bg-red-50 px-2 py-1 rounded"
                         >
                            Clear Ink
                         </button>
                     )}
                </div>

                {/* Preview Area */}
                <div className={`flex-1 overflow-y-auto custom-scrollbar bg-gray-100 p-8 flex justify-center relative ${isDigitalMode ? 'overflow-hidden touch-none' : ''}`}>
                     {loading ? (
                         <div className="flex flex-col items-center justify-center space-y-6">
                             <div className="relative">
                                <div className="w-16 h-16 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin"></div>
                                <div className="absolute inset-0 flex items-center justify-center text-xl">🪄</div>
                             </div>
                             <p className="text-gray-500 font-bold animate-pulse">Designing your worksheet...</p>
                         </div>
                     ) : items.length === 0 ? (
                         <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                             <div className="text-4xl">😅</div>
                             <p className="text-gray-500 font-medium">Could not generate questions at this moment.</p>
                             <button onClick={fetchClone} className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-black transition-colors">Try Again</button>
                         </div>
                     ) : (
                         /* WYSIWYG Preview - Wrapper */
                         <div className="relative w-full max-w-[210mm] min-h-[297mm] shadow-xl animate-fade-in-up">
                             
                             {/* The Content (DOM) */}
                             <div ref={containerRef} className="bg-white w-full h-full p-[15mm] flex flex-col">
                                 {/* Sheet Header */}
                                 <div className="flex justify-between items-end border-b-2 border-gray-800 pb-6 mb-10 select-none pointer-events-none">
                                     <div>
                                         <h1 className="text-2xl font-black text-gray-800 uppercase tracking-wide">Practice Sheet</h1>
                                         <span className="text-xs font-bold text-orange-500">Generated by Chekki AI</span>
                                     </div>
                                     <div className="flex gap-8">
                                         <div className="flex flex-col gap-1">
                                             <span className="text-[10px] font-bold text-gray-400 uppercase">Name</span>
                                             <div className="w-32 border-b border-gray-300"></div>
                                         </div>
                                         <div className="flex flex-col gap-1">
                                             <span className="text-[10px] font-bold text-gray-400 uppercase">Date</span>
                                             <div className="w-32 border-b border-gray-300"></div>
                                         </div>
                                     </div>
                                 </div>

                                 {/* Sheet Body */}
                                 <div className="flex-1 space-y-10">
                                     {items.map((item, idx) => (
                                         <div key={idx} className="flex flex-col gap-3 select-none pointer-events-none">
                                             <div className="flex gap-3 items-baseline">
                                                 <span className="text-lg font-bold text-orange-500">{idx + 1}.</span>
                                                 <span className="text-lg font-bold text-gray-800">{item.question_text}</span>
                                             </div>
                                             <div className="w-full h-12 border-b-2 border-dashed border-gray-300 relative">
                                                {/* Faint Guide */}
                                                <div className="absolute bottom-1 left-0 w-full text-center font-hand text-3xl text-gray-200 select-none">
                                                    {item.correct_answer}
                                                </div>
                                             </div>
                                         </div>
                                     ))}
                                 </div>

                                 {/* Sheet Footer */}
                                 <div className="mt-auto pt-8 border-t border-gray-100 flex justify-between text-[10px] text-gray-400 font-medium select-none pointer-events-none">
                                     <span>Chekki AI - Mom's Homework Helper</span>
                                     <span>Keep Growing! 🌱</span>
                                 </div>
                             </div>

                             {/* CANVAS OVERLAY FOR DRAWING */}
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

                {/* Footer Actions */}
                <div className="bg-white p-4 border-t border-gray-200 flex justify-end gap-3 shrink-0 z-10">
                    <button onClick={onClose} className="px-6 py-3 rounded-xl font-bold text-gray-600 hover:bg-gray-100 transition-colors">Close</button>
                    <button 
                        onClick={handlePrint}
                        disabled={loading || items.length === 0}
                        className="px-8 py-3 rounded-xl font-bold bg-gray-900 text-white hover:bg-black shadow-xl shadow-gray-900/20 flex items-center gap-2 transform transition-all hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <span>🖨️</span> Print Worksheet
                    </button>
                </div>
            </div>
        </div>
    );
};
