
import React, { useState } from 'react';
import { useMistakes } from '../contexts/MistakeContext';
import { useLanguage } from '../contexts/LanguageContext';

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
}

export const OdapNoteModal: React.FC = () => {
  const { mistakes, showMistakeModal, setShowMistakeModal, removeMistake } = useMistakes();
  const { t, language } = useLanguage();
  
  // Confetti State
  const [particles, setParticles] = useState<Particle[]>([]);

  if (!showMistakeModal) return null;

  const triggerConfetti = (e: React.MouseEvent) => {
     const rect = (e.target as HTMLElement).getBoundingClientRect();
     const centerX = rect.left + rect.width / 2;
     const centerY = rect.top + rect.height / 2;
     
     const colors = ['#F97316', '#EC4899', '#8B5CF6', '#10B981', '#F59E0B'];
     const newParticles: Particle[] = [];
     
     for(let i=0; i<30; i++) {
         newParticles.push({
             id: Date.now() + i,
             x: centerX,
             y: centerY,
             color: colors[Math.floor(Math.random() * colors.length)]
         });
     }
     setParticles(prev => [...prev, ...newParticles]);
     
     // Cleanup
     setTimeout(() => {
         setParticles([]);
     }, 1000);
  };

  const handleMastery = (id: string, e: React.MouseEvent) => {
      triggerConfetti(e);
      // Small delay to let confetti start before item disappears
      setTimeout(() => {
          removeMistake(id);
      }, 300);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Chekki - Review Sheet</title>
            <style>
              body { font-family: 'Helvetica', 'Apple SD Gothic Neo', sans-serif; padding: 40px; color: #333; }
              .header { text-align: center; margin-bottom: 40px; border-bottom: 3px solid #f97316; padding-bottom: 20px; }
              .logo { font-size: 24px; font-weight: bold; color: #f97316; }
              .title { font-size: 32px; font-weight: 900; margin: 10px 0; }
              .subtitle { color: #666; font-style: italic; }
              .grid { display: grid; grid-template-columns: 1fr; gap: 20px; }
              .item { border: 1px solid #ddd; padding: 20px; border-radius: 12px; background: #fafafa; page-break-inside: avoid; }
              .question-label { font-size: 12px; font-weight: bold; color: #999; text-transform: uppercase; letter-spacing: 1px; }
              .question { font-size: 20px; font-weight: bold; margin: 5px 0 15px 0; }
              
              /* Writing Box */
              .answer-box { background: white; border: 2px dashed #cbd5e1; padding: 20px; border-radius: 8px; margin-top: 10px; min-height: 80px; position: relative; }
              .answer-label { font-size: 12px; color: #9ca3af; margin-bottom: 5px; font-weight: 500; }
              
              /* Repositioned Answer: Outside box, right aligned, upside down */
              .answer-footer { display: flex; justify-content: flex-end; margin-top: 8px; }
              .answer { 
                  color: #f97316; 
                  font-weight: bold; 
                  font-size: 11px; 
                  font-family: 'Comic Sans MS', cursive, sans-serif; 
                  transform: rotate(180deg); 
                  display: inline-block; 
                  opacity: 0.6; 
              }

              .tip { margin-top: 15px; font-size: 14px; color: #666; font-style: italic; border-left: 3px solid #f97316; padding-left: 10px; line-height: 1.5; }
              .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #aaa; }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="logo">Chekki AI</div>
              <div class="title">${t('review_title')}</div>
              <div class="subtitle">${language === 'ko' ? "오늘도 한 걸음 더 성장했어요!" : "Growing every day!"}</div>
            </div>
            
            <div class="grid">
              ${mistakes.map(m => `
                <div class="item">
                  <div class="question-label">${t('lbl_question')}</div>
                  <div class="question">${m.question_text}</div>
                  
                  <div class="answer-box">
                    <div class="answer-label">${t('lbl_write_answer')}</div>
                  </div>

                  <div class="answer-footer">
                     <div class="answer">(${t('lbl_correct_answer')} ${m.correct_answer})</div>
                  </div>

                  <div class="tip">
                    <strong>${t('lbl_mom_tip')}</strong> ${language === 'ko' ? m.teaching_script_ko : (m.teaching_script_en || m.teaching_script_ko)}
                  </div>
                </div>
              `).join('')}
            </div>

            <div class="footer">
              ${t('print_footer')}
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
    <>
        {/* Simple Confetti Container */}
        {particles.map(p => (
            <div 
                key={p.id}
                className="fixed w-2 h-2 rounded-full pointer-events-none z-[200] animate-[confetti_1s_ease-out_forwards]"
                style={{
                    left: p.x,
                    top: p.y,
                    backgroundColor: p.color,
                    '--tx': `${(Math.random() - 0.5) * 200}px`,
                    '--ty': `${(Math.random() - 1) * 200}px`,
                } as any}
            ></div>
        ))}
        <style>{`
            @keyframes confetti {
                0% { opacity: 1; transform: translate(0,0) scale(1); }
                100% { opacity: 0; transform: translate(var(--tx), var(--ty)) scale(0); }
            }
        `}</style>

        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
            onClick={() => setShowMistakeModal(false)}
        ></div>

        <div className="relative bg-zinc-900 rounded-3xl w-full max-w-2xl h-[80vh] flex flex-col overflow-hidden shadow-2xl border border-zinc-700 animate-fade-in-up">
            
            <div className="bg-zinc-800 p-6 flex justify-between items-center border-b border-zinc-700">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center text-2xl">
                📝
                </div>
                <div>
                <h2 className="text-xl font-bold text-white font-korean">{t('review_title')}</h2>
                <p className="text-zinc-400 text-sm">{mistakes.length} {t('lbl_mistakes_count')}</p>
                </div>
            </div>
            <button 
                onClick={() => setShowMistakeModal(false)}
                className="p-2 hover:bg-zinc-700 rounded-full transition-colors"
            >
                <svg className="w-6 h-6 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-4">
            {mistakes.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-zinc-500 text-center px-4">
                <div className="w-20 h-20 bg-zinc-800 rounded-full flex items-center justify-center mb-6">
                    <span className="text-4xl">🚩</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2 font-korean">{t('review_empty_title')}</h3>
                <p className="font-korean text-zinc-400 max-w-xs leading-relaxed">
                    {t('review_empty_desc')}
                </p>
                </div>
            ) : (
                mistakes.map((item) => (
                <div key={item.uniqueId} className="bg-zinc-950/50 border border-zinc-800 rounded-xl p-4 flex gap-4 group hover:border-red-500/30 transition-colors relative">
                    <div className="flex-1">
                    <h4 className="text-zinc-200 font-bold mb-1">{item.question_text}</h4>
                    <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-zinc-500 uppercase">{t('lbl_correct_answer')}</span>
                        <p className="text-emerald-400 font-hand text-lg font-bold">{item.correct_answer}</p>
                    </div>
                    <p className="text-zinc-500 text-xs mt-2 font-korean border-t border-zinc-800 pt-2">{item.korean_guide}</p>
                    </div>
                    <button 
                        onClick={(e) => handleMastery(item.uniqueId, e)}
                        className="self-start px-3 py-1.5 bg-green-900/30 text-green-400 hover:bg-green-500 hover:text-white rounded-lg transition-all text-xs font-bold border border-green-500/30 flex items-center gap-1 shadow-lg shadow-green-500/10 active:scale-95"
                        title="Mark as Mastered"
                    >
                        <span>🌟</span> Mastered!
                    </button>
                </div>
                ))
            )}
            </div>

            <div className="p-6 border-t border-zinc-800 bg-zinc-900">
            <button 
                onClick={handlePrint}
                disabled={mistakes.length === 0}
                className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all font-korean shadow-lg shadow-orange-500/20"
            >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 00-2 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                {t('review_print_btn')}
            </button>
            </div>

        </div>
        </div>
    </>
  );
};
