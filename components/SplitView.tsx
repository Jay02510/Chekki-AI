
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

interface TooltipProps {
  text: string;
  // Fix: Changed React.Node to React.ReactNode which is the correct type for children in React
  children: React.ReactNode;
}

const Tooltip: React.FC<TooltipProps> = ({ text, children }) => {
  const [show, setShow] = useState(false);
  return (
    <div 
      className="relative flex items-center"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-zinc-800 text-white text-[10px] rounded shadow-xl border border-white/10 whitespace-nowrap z-50 pointer-events-none animate-fade-in">
          {text}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-zinc-800"></div>
        </div>
      )}
    </div>
  );
};

interface Props {
  imageUrl: string;
  items: WorksheetItem[];
  isLoadingItems?: boolean;
}

export const SplitView: React.FC<Props> = ({ imageUrl, items, isLoadingItems = false }) => {
  const { t, language } = useLanguage(); 
  const { toggleMistake, isMistake } = useMistakes();
  const { user, setShowPaywall } = useAuth();
  
  const [activeItemId, setActiveItemId] = useState<number | null>(null);
  const [showCloneModal, setShowCloneModal] = useState(false);
  const [reportContext, setReportContext] = useState<WorksheetItem | null>(null);
  const [mascotError, setMascotError] = useState(false);

  // Pronunciation States
  const [isListening, setIsListening] = useState(false);
  const [speechResult, setSpeechResult] = useState<{ id: number; success: boolean } | null>(null);
  const recognitionRef = useRef<any>(null);

  const itemRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});

  useEffect(() => {
    if (activeItemId !== null && itemRefs.current[activeItemId]) {
      itemRefs.current[activeItemId]?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [activeItemId]);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript.toLowerCase();
        const activeItem = items.find(i => i.id === activeItemId);
        if (activeItem) {
          const cleanAnswer = activeItem.correct_answer.toLowerCase().replace(/[^\w\s]/g, '').trim();
          const cleanSpeech = transcript.replace(/[^\w\s]/g, '').trim();
          
          if (cleanSpeech.includes(cleanAnswer) || cleanAnswer.includes(cleanSpeech)) {
            setSpeechResult({ id: activeItem.id, success: true });
            if ('vibrate' in navigator) navigator.vibrate(50);
            const audio = new Audio(ASSETS.STAMP_SOUND);
            audio.play().catch(() => {});
          } else {
            setSpeechResult({ id: activeItem.id, success: false });
            if ('vibrate' in navigator) navigator.vibrate([30, 30, 30]);
          }
        }
        setIsListening(false);
      };

      recognitionRef.current.onerror = () => setIsListening(false);
      recognitionRef.current.onend = () => setIsListening(false);
    }
  }, [activeItemId, items]);

  const normalizeText = (text: string) => {
    if (!text) return "";
    return text.replace(/[0-9]+\./g, '').replace(/[.,/#!$%^&*;:{}=\-_`~]/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
  };

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
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.85;
      window.speechSynthesis.speak(utterance);
    }
  };

  const startPronunciationCheck = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (user?.plan !== 'pro') {
      setShowPaywall(true);
      return;
    }
    if (!recognitionRef.current) return;
    setSpeechResult(null);
    setIsListening(true);
    recognitionRef.current.start();
  };

  return (
    <>
      {showCloneModal && <CloneWorksheetModal originalItems={items} onClose={() => setShowCloneModal(false)} />}
      {reportContext && <FeedbackModal context={reportContext} onClose={() => setReportContext(null)} />}

      <div className="flex flex-col lg:flex-row gap-4 md:gap-6 h-[calc(100dvh-180px)] lg:h-[calc(100vh-250px)] min-h-[450px]">
        {/* Left Side: Original Image with Magnifier Potential */}
        <div className="w-full lg:w-5/12 h-[35%] lg:h-full flex flex-col">
          <WorksheetOverlay imageUrl={imageUrl} items={items} focusedId={activeItemId} className="h-full" isLoadingItems={isLoadingItems} />
        </div>

        {/* Right Side: Enhanced Memo Cards */}
        <div className="w-full lg:w-7/12 h-[65%] lg:h-full flex flex-col bg-zinc-950/40 rounded-3xl border border-white/5 overflow-hidden relative shadow-inner" onClick={() => setActiveItemId(null)}>
          <div className="px-6 py-5 border-b border-white/5 bg-zinc-900/40 backdrop-blur-xl flex justify-between items-center shrink-0">
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 rounded-2xl bg-zinc-800 border border-white/5 flex items-center justify-center overflow-hidden shadow-xl">
                    {!mascotError ? <img src={ASSETS.MASCOT_HAPPY} alt="Chekki" className="w-full h-full object-cover scale-110" onError={() => setMascotError(true)} /> : <span className="text-2xl">🎓</span>}
               </div>
               <div>
                  <h3 className="font-black text-white font-display text-xl leading-none mb-1">{t('ws_results_title')}</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">{isLoadingItems ? t('ws_scanning_header') : `${groupedItems.length} ${t('ws_items_found')}`}</span>
                    <span className="w-1 h-1 bg-zinc-700 rounded-full"></span>
                    <span className="text-[10px] text-orange-500 font-black animate-pulse uppercase">Live Guidance</span>
                  </div>
               </div>
            </div>
          </div>

          <div className="overflow-y-auto p-4 md:p-6 space-y-4 custom-scrollbar flex-1 overscroll-contain bg-gradient-to-b from-transparent to-zinc-950/20">
            {isLoadingItems && items.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center space-y-4 py-20">
                    <div className="w-12 h-12 border-2 border-white/5 border-t-orange-500 rounded-full animate-spin"></div>
                    <p className="text-sm font-bold text-zinc-500 font-korean">{t('ws_scanning_detail')}</p>
                </div>
            )}

            {groupedItems.map((group) => {
              const item = group.main;
              const isActive = activeItemId === item.id;
              const flagged = isMistake(item.question_text);
              const scriptText = item.teaching_script_ko;
              const answerText = item.correct_answer;

              return (
                <div key={item.id} ref={(el) => { itemRefs.current[item.id] = el; }} onClick={(e) => { e.stopPropagation(); setActiveItemId(item.id); }}
                  className={`group relative rounded-[1.5rem] border transition-all duration-300 cursor-pointer overflow-hidden animate-fade-in-up ${isActive ? 'bg-zinc-800/90 border-orange-500/50 shadow-[0_20px_40px_rgba(0,0,0,0.4)] ring-1 ring-orange-500/20' : 'bg-zinc-900/60 border-white/5 hover:border-white/20'}`}>
                  
                  <div className="flex items-start p-4 md:p-6 gap-4">
                    <div className={`w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center text-xs md:text-sm font-black shrink-0 transition-all duration-300 ${isActive ? 'bg-orange-500 text-white rotate-3 scale-110 shadow-lg shadow-orange-500/20' : 'bg-zinc-800 text-zinc-500 group-hover:bg-zinc-700 group-hover:text-zinc-300'}`}>
                      {item.id}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h4 className={`text-sm md:text-base font-bold leading-relaxed mb-2 transition-colors ${isActive ? 'text-white' : 'text-zinc-400'}`}>
                        {item.question_text.replace(/^\d+[\.\)\s]+/, '')}
                      </h4>
                      
                      <div className="flex items-center gap-4">
                        <div className="bg-white/5 rounded-xl px-3 py-1 border border-white/5 group-hover:border-white/10 transition-colors">
                            <span className="font-hand text-xl md:text-2xl text-emerald-400 font-bold tracking-tight drop-shadow-sm">{answerText}</span>
                        </div>
                        {speechResult?.id === item.id && speechResult.success && (
                            <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-black px-3 py-1 rounded-full border border-emerald-500/20 animate-bounce tracking-widest uppercase">Excellent! 🌟</span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                        <button onClick={(e) => { e.stopPropagation(); playAudio(answerText); }} className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/5 flex items-center justify-center text-zinc-400 hover:bg-orange-500 hover:text-white transition-all shadow-lg active:scale-90">
                           <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77zm-3 0L5.5 8H1v8h4.5l6.5 4.77V3.23z"/></svg>
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); toggleMistake(item); }} className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center transition-all shadow-lg active:scale-90 ${flagged ? 'bg-red-500 text-white' : 'bg-white/5 text-zinc-400 hover:bg-zinc-700'}`}>
                           <svg className="w-4 h-4" fill={flagged ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
                        </button>
                    </div>
                  </div>

                  {isActive && (
                    <div className="px-4 pb-6 md:px-6 md:pb-8 animate-fade-in-up space-y-6">
                        {/* Pronunciation Section */}
                        <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-4 flex flex-col gap-4 shadow-inner">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="flex h-2 w-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]"></span>
                                    <p className="text-[10px] font-black uppercase text-indigo-400 tracking-[0.2em]">{language === 'ko' ? "원어민 발음 코칭" : "Native Speaking Coach"}</p>
                                </div>
                                {isListening && <span className="text-[9px] font-black text-red-500 animate-pulse uppercase tracking-widest">Recording...</span>}
                            </div>
                            <div className="flex items-center gap-4">
                                <button 
                                  onClick={startPronunciationCheck}
                                  disabled={isListening}
                                  className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 ${isListening ? 'bg-red-500 animate-pulse' : 'bg-indigo-600 hover:bg-indigo-500'} shadow-xl text-white ring-4 ring-indigo-500/20 active:scale-95`}
                                >
                                    <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/><path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg>
                                </button>
                                <div className="flex-1">
                                    <p className="text-xs text-indigo-200/80 font-bold leading-relaxed mb-1">
                                        {isListening ? "말씀해 주세요! Chekki가 듣고 있어요." : "마이크를 누르고 정답을 소리 내어 읽어보세요!"}
                                    </p>
                                    <p className="text-[10px] text-zinc-500 font-medium">Native pronunciation: "{answerText}"</p>
                                </div>
                            </div>
                        </div>

                        {/* Teaching Memos */}
                        <div className="grid gap-4">
                            {language === 'ko' ? (
                                <>
                                    <div className="bg-orange-500/5 border border-orange-500/10 rounded-2xl p-5 relative overflow-hidden group/memo transition-all hover:bg-orange-500/10">
                                        <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/5 rounded-full blur-2xl -mr-10 -mt-10 group-hover/memo:bg-orange-500/10 transition-colors"></div>
                                        <div className="relative flex gap-4">
                                            <div className="text-2xl shrink-0">💌</div>
                                            <div className="space-y-1.5">
                                                <p className="text-[10px] font-black uppercase text-orange-500 tracking-[0.2em]">{t('lbl_mom_tip')}</p>
                                                <p className="text-[13px] text-zinc-200 leading-relaxed font-korean font-medium tracking-tight">
                                                    "{scriptText}"
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-zinc-950/40 border border-white/5 rounded-2xl p-5">
                                        <div className="flex gap-4">
                                            <div className="text-2xl shrink-0">🇰🇷</div>
                                            <div className="space-y-2">
                                                <p className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.2em]">Learning Guide</p>
                                                <p className="text-[12px] text-zinc-400 leading-relaxed font-korean font-medium">{item.korean_guide}</p>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="bg-zinc-950/40 border border-white/5 rounded-2xl p-5">
                                    <div className="flex gap-4">
                                        <div className="text-2xl shrink-0">🇬🇧</div>
                                        <div className="space-y-2">
                                            <p className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.2em]">English Explanation</p>
                                            <p className="text-[13px] text-zinc-300 leading-relaxed font-medium">{item.english_guide || "Review the vocabulary and grammar rules above."}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        <div className="flex justify-end pt-2">
                            <button onClick={(e) => { e.stopPropagation(); setReportContext(item); }} className="text-[10px] font-bold text-zinc-600 hover:text-amber-500 uppercase tracking-widest flex items-center gap-1.5 transition-colors">
                                <span className="text-xs">⚠️</span> {t('tt_report')}
                            </button>
                        </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="p-4 md:p-6 bg-zinc-900 border-t border-white/5 backdrop-blur-3xl shrink-0" onClick={(e) => e.stopPropagation()}>
             <button 
                onClick={() => { if(user?.plan !== 'pro') setShowPaywall(true); else setShowCloneModal(true); }} 
                disabled={isLoadingItems}
                className="w-full py-4 md:py-5 rounded-2xl bg-gradient-to-r from-orange-500 to-pink-500 text-white font-black text-sm md:text-base shadow-[0_10px_30px_rgba(249,115,22,0.3)] flex items-center justify-center gap-3 transform transition-all hover:scale-[1.02] hover:shadow-orange-500/50 active:scale-95 disabled:opacity-50 group"
             >
                <span className="text-xl group-hover:rotate-12 transition-transform">🪄</span> 
                {isLoadingItems ? t('growing_text') : t('ws_gen_practice')}
             </button>
          </div>
        </div>
      </div>
    </>
  );
};
