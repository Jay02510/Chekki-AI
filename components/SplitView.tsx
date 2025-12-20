
import React, { useMemo, useState, useRef, useEffect } from 'react';
import { WorksheetItem } from '../types';
import { WorksheetOverlay } from './WorksheetOverlay';
import { useLanguage } from '../contexts/LanguageContext';
import { useMistakes } from '../contexts/MistakeContext';
import { useAuth } from '../contexts/AuthContext';
import { CloneWorksheetModal } from './CloneWorksheetModal';
import { FeedbackModal } from './FeedbackModal';
import { ASSETS } from '../constants';
import { ChekkiMascot } from './Icons';

interface Props {
  imageUrl: string;
  items: WorksheetItem[];
}

export const SplitView: React.FC<Props> = ({ imageUrl, items }) => {
  const { t, language } = useLanguage(); 
  const { toggleMistake, isMistake } = useMistakes();
  const { user, setShowPaywall } = useAuth();
  
  const [activeItemId, setActiveItemId] = useState<number | null>(null);
  const [showCloneModal, setShowCloneModal] = useState(false);
  const [reportContext, setReportContext] = useState<WorksheetItem | null>(null);
  const [mascotError, setMascotError] = useState(false);

  const itemRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});

  useEffect(() => {
    if (activeItemId !== null && itemRefs.current[activeItemId]) {
      itemRefs.current[activeItemId]?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [activeItemId]);

  const normalizeText = (text: string) => {
    if (!text) return "";
    return text.replace(/[0-9]+\./g, '').replace(/[.,/#!$%^&*;:{}=\-_`~]/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
  };

  const getDisplayQuestion = (text: string) => text.replace(/\(\d+\/\d+\)/g, '').trim();

  const groupedItems = useMemo(() => {
    const groups: { main: WorksheetItem; count: number; ids: number[] }[] = [];
    const sortedItems = [...items].sort((a, b) => (a.id || 0) - (b.id || 0));

    sortedItems.forEach((item) => {
      const lastGroup = groups[groups.length - 1];
      const currentQ = normalizeText(item.question_text);
      const lastQ = lastGroup ? normalizeText(lastGroup.main.question_text) : "";
      
      const isSameQuestion = lastGroup && currentQ === lastQ;
      const isSameAnswer = lastGroup && item.correct_answer.toLowerCase().trim() === lastGroup.main.correct_answer.toLowerCase().trim();

      if (isSameQuestion && isSameAnswer) {
        lastGroup.count += 1;
        lastGroup.ids.push(item.id);
      } else {
        groups.push({ main: item, count: 1, ids: [item.id] });
      }
    });
    return groups;
  }, [items]);

  const playAudio = (text: string) => {
    if (user?.plan !== 'pro') {
      setShowPaywall(true);
      return;
    }
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <>
      {showCloneModal && <CloneWorksheetModal originalItems={items} onClose={() => setShowCloneModal(false)} />}
      {reportContext && <FeedbackModal context={reportContext} onClose={() => setReportContext(null)} />}

      <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-250px)] min-h-[500px]">
        <div className="w-full lg:w-1/2 h-1/2 lg:h-full flex flex-col">
          <WorksheetOverlay imageUrl={imageUrl} items={items} focusedId={activeItemId} className="h-full" />
        </div>

        <div className="w-full lg:w-1/2 h-1/2 lg:h-full flex flex-col bg-zinc-900/50 rounded-2xl border border-zinc-800/50 overflow-hidden relative" onClick={() => setActiveItemId(null)}>
          <div className="p-6 border-b border-zinc-800 bg-zinc-900 flex justify-between items-center shrink-0" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-4 relative z-10">
               <div className="w-14 h-14 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center overflow-hidden shadow-lg">
                    {!mascotError ? <img src={ASSETS.MASCOT_HAPPY} alt="Chekki" className="w-full h-full object-cover" onError={() => setMascotError(true)} /> : <span className="text-3xl">🎓</span>}
               </div>
               <div>
                  <h3 className="font-bold text-white font-display text-2xl leading-none mb-1">{t('ws_results_title')}</h3>
                  <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider bg-zinc-800 px-2 py-1 rounded">
                    {groupedItems.length} {t('ws_items_found')}
                  </span>
               </div>
            </div>
          </div>

          <div className="overflow-y-auto p-4 space-y-3 custom-scrollbar flex-1 relative z-10">
            <div className="bg-orange-500/10 border border-orange-500/20 p-3 rounded-xl flex items-start gap-3 mb-2">
               <span className="text-lg">💡</span>
               <p className="text-xs text-orange-200/80 leading-relaxed font-korean">{t('ws_review_tip')}</p>
            </div>

            {groupedItems.map((group) => {
              const item = group.main;
              const isActive = activeItemId === item.id;
              const flagged = isMistake(item.question_text);
              const guideText = language === 'ko' ? item.korean_guide : (item.english_guide || item.teaching_tip_en || item.korean_guide);
              const scriptText = item.teaching_script_ko;

              return (
                <div key={item.id} ref={(el) => { itemRefs.current[item.id] = el; }} onClick={(e) => { e.stopPropagation(); setActiveItemId(item.id); }}
                  className={`relative rounded-xl border transition-all duration-200 cursor-pointer overflow-hidden ${isActive ? 'bg-zinc-800/90 border-orange-500 shadow-xl' : 'bg-zinc-900/60 border-zinc-800/50 hover:bg-zinc-800'}`}>
                  <div className="flex items-start p-4 gap-4">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black shrink-0 transition-colors ${isActive ? 'bg-orange-500 text-white' : 'bg-zinc-800 text-zinc-500'}`}>
                      {item.id}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className={`text-sm font-bold leading-snug mb-2 ${isActive ? 'text-white' : 'text-zinc-400'}`}>{getDisplayQuestion(item.question_text)}</h4>
                      <div className="flex items-center gap-2"><span className="font-hand text-xl text-emerald-400 font-bold">{item.correct_answer}</span></div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button 
                        onClick={(e) => { e.stopPropagation(); setReportContext(item); }} 
                        className="p-2 rounded-full text-zinc-600 hover:text-amber-400 transition-colors"
                        title="Report Incorrect Answer"
                      >
                         <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                         </svg>
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); playAudio(item.correct_answer); }} className="p-2 rounded-full text-zinc-500 hover:text-white hover:bg-white/10 transition-colors">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 14.142M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); toggleMistake(item); }} className={`p-2 rounded-full transition-colors ${flagged ? 'text-red-500 bg-red-500/10' : 'text-zinc-600 hover:text-zinc-400'}`}>
                        <svg className="w-5 h-5" fill={flagged ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21V5a2 2 0 012-2h10a2 2 0 012 2v8l-7-3.5L5 13v8" /></svg>
                      </button>
                    </div>
                  </div>
                  {isActive && (
                    <div className="border-t border-white/5 bg-black/20 p-4 animate-fade-in space-y-3">
                        {scriptText && (
                          <div className="bg-brand-purple/10 border border-brand-purple/20 p-3 rounded-lg flex gap-3">
                             <span className="text-base shrink-0">👩‍🏫</span>
                             <div className="space-y-1">
                                <p className="text-[10px] font-black uppercase text-brand-purple tracking-widest">Mom's Script (엄마의 한마디)</p>
                                <p className="text-xs text-white leading-relaxed font-korean">{scriptText}</p>
                             </div>
                          </div>
                        )}
                        <div className="flex gap-2 items-start text-xs text-zinc-300 font-korean pl-1">
                           <span className="text-base shrink-0">🧐</span>
                           <div className="space-y-1">
                              <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Analysis (학습 가이드)</p>
                              <p className="leading-relaxed">{guideText}</p>
                           </div>
                        </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="p-4 bg-zinc-900 border-t border-zinc-800 shrink-0" onClick={(e) => e.stopPropagation()}>
             <button onClick={() => { if(user?.plan !== 'pro') setShowPaywall(true); else setShowCloneModal(true); }} className="w-full py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-black text-sm shadow-xl flex items-center justify-center gap-2 transform transition-all hover:scale-[1.02] active:scale-95">
                <span>🪄</span> {t('ws_gen_practice')}
             </button>
          </div>
        </div>
      </div>
    </>
  );
};
