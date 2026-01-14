
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

  // Initialize Speech Recognition
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
          const cleanAnswer = activeItem.correct_answer.toLowerCase().replace(/^\d+[\.\)\s]+/, '').replace(/[^\w\s]/g, '').trim();
          const cleanSpeech = transcript.replace(/[^\w\s]/g, '').trim();
          
          if (cleanSpeech.includes(cleanAnswer) || cleanAnswer.includes(cleanSpeech)) {
            setSpeechResult({ id: activeItem.id, success: true });
            const audio = new Audio(ASSETS.STAMP_SOUND);
            audio.play().catch(() => {});
          } else {
            setSpeechResult({ id: activeItem.id, success: false });
          }
        }
        setIsListening(false);
      };

      recognitionRef.current.onerror = () => {
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, [activeItemId, items]);

  const normalizeText = (text: string) => {
    if (!text) return "";
    return text.replace(/[0-9]+\./g, '').replace(/[.,/#!$%^&*;:{}=\-_`~]/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
  };

  const getDisplayQuestion = (text: string) => {
    return text
      .replace(/^\d+[\.\)\s]+/, '') 
      .replace(/\(\d+\/\d+\)/g, '') 
      .trim();
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
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      window.speechSynthesis.speak(utterance);
    }
  };

  const startPronunciationCheck = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (user?.plan !== 'pro') {
      setShowPaywall(true);
      return;
    }
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }
    setSpeechResult(null);
    setIsListening(true);
    recognitionRef.current.start();
  };

  return (
    <>
      {showCloneModal && <CloneWorksheetModal originalItems={items} onClose={() => setShowCloneModal(false)} />}
      {reportContext && <FeedbackModal context={reportContext} onClose={() => setReportContext(null)} />}

      <div className="flex flex-col lg:flex-row gap-4 md:gap-6 h-[calc(100dvh-180px)] lg:h-[calc(100vh-250px)] min-h-[450px]">
        {/* Image Display */}
        <div className="w-full lg:w-1/2 h-[40%] lg:h-full flex flex-col">
          <WorksheetOverlay imageUrl={imageUrl} items={items} focusedId={activeItemId} className="h-full" isLoadingItems={isLoadingItems} />
        </div>

        {/* Results List */}
        <div className="w-full lg:w-1/2 h-[60%] lg:h-full flex flex-col bg-zinc-900/50 rounded-2xl border border-zinc-800/50 overflow-hidden relative" onClick={() => setActiveItemId(null)}>
          <div className="p-4 md:p-6 border-b border-zinc-800 bg-zinc-900 flex justify-between items-center shrink-0" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 md:gap-4 relative z-10">
               <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center overflow-hidden shadow-lg flex-shrink-0">
                    {!mascotError ? <img src={ASSETS.MASCOT_HAPPY} alt="Chekki" className="w-full h-full object-cover" onError={() => setMascotError(true)} /> : <span className="text-xl md:text-3xl">🎓</span>}
               </div>
               <div>
                  <h3 className="font-bold text-white font-display text-lg md:text-2xl leading-none mb-0.5 md:mb-1">{t('ws_results_title')}</h3>
                  <span className="text-[9px] md:text-xs text-zinc-500 font-bold uppercase tracking-wider bg-zinc-800 px-2 py-0.5 md:py-1 rounded">
                    {isLoadingItems ? "Scanning for questions..." : `${groupedItems.length} ${t('ws_items_found')}`}
                  </span>
               </div>
            </div>
          </div>

          <div className="overflow-y-auto p-4 space-y-3 custom-scrollbar flex-1 relative z-10 overscroll-contain">
            
            {isLoadingItems && items.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center space-y-4 py-20 opacity-50">
                    <div className="w-12 h-12 border-4 border-white/5 border-t-orange-500 rounded-full animate-spin"></div>
                    <p className="text-sm font-bold font-korean">문제를 꼼꼼하게 읽고 있어요...</p>
                </div>
            )}

            {!isLoadingItems && items.length > 0 && (
                <div className="bg-orange-500/10 border border-orange-500/20 p-3 rounded-xl flex items-start gap-3 mb-2 animate-fade-in shadow-lg">
                   <span className="text-base md:text-lg animate-bounce">💡</span>
                   <p className="text-[10px] md:text-xs text-orange-200/80 leading-relaxed font-bold font-korean">
                     {language === 'ko' ? "팁: 질문을 클릭하여 다정한 티칭 가이드와 발음 코칭을 확인해보세요!" : "Tip: Click any question to reveal Mom's Script, teaching guides, and the Pronunciation Coach!"}
                   </p>
                </div>
            )}

            {groupedItems.map((group) => {
              const item = group.main;
              const isActive = activeItemId === item.id;
              const flagged = isMistake(item.question_text);
              const scriptText = item.teaching_script_ko;
              
              const cleanAnswer = item.correct_answer.replace(/^\d+[\.\)\s]+/, '').trim();

              return (
                <div key={item.id} ref={(el) => { itemRefs.current[item.id] = el; }} onClick={(e) => { e.stopPropagation(); setActiveItemId(item.id); }}
                  className={`relative rounded-xl border transition-all duration-200 cursor-pointer overflow-hidden animate-fade-in ${isActive ? 'bg-zinc-800/90 border-orange-500 shadow-xl' : 'bg-zinc-900/60 border-zinc-800/50 hover:bg-zinc-800'}`}>
                  <div className="flex items-start p-3 md:p-4 gap-3 md:gap-4">
                    <div className={`w-7 h-7 md:w-8 md:h-8 rounded-lg flex items-center justify-center text-xs md:text-sm font-black shrink-0 transition-colors ${isActive ? 'bg-orange-500 text-white' : 'bg-zinc-800 text-zinc-500'}`}>
                      {item.id}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className={`text-xs md:text-sm font-bold leading-snug mb-1 md:mb-2 ${isActive ? 'text-white' : 'text-zinc-400'}`}>{getDisplayQuestion(item.question_text)}</h4>
                      <div className="flex items-center gap-2">
                        <span className="font-hand text-lg md:text-xl text-emerald-400 font-bold">{cleanAnswer}</span>
                        {speechResult?.id === item.id && speechResult.success && (
                            <span className="bg-emerald-500 text-white text-[10px] px-2 py-0.5 rounded-full animate-bounce">Good! 🌟</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5 md:gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <Tooltip text={t('tt_report')}>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setReportContext(item); }} 
                          className="p-1.5 md:p-2 rounded-full text-zinc-700 hover:text-amber-400 hover:bg-white/5 transition-all"
                        >
                           <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                           </svg>
                        </button>
                      </Tooltip>
                      <Tooltip text={t('tt_audio')}>
                        <button onClick={(e) => { e.stopPropagation(); playAudio(cleanAnswer); }} className="p-1.5 md:p-2 rounded-full text-zinc-500 hover:text-white hover:bg-white/10 transition-all">
                          <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 14.142M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
                        </button>
                      </Tooltip>
                      <Tooltip text={t('tt_save')}>
                        <button onClick={(e) => { e.stopPropagation(); toggleMistake(item); }} className={`p-1.5 md:p-2 rounded-full transition-all ${flagged ? 'text-red-500 bg-red-500/10' : 'text-zinc-600 hover:text-zinc-400 hover:bg-white/5'}`}>
                          <svg className="w-4 h-4 md:w-5 md:h-5" fill={flagged ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21V5a2 2 0 012-2h10a2 2 0 012 2v8l-7-3.5L5 13v8" /></svg>
                        </button>
                      </Tooltip>
                    </div>
                  </div>
                  {isActive && (
                    <div className="border-t border-white/5 bg-black/20 p-3 md:p-4 animate-fade-in space-y-4">
                        
                        {/* Pronunciation Coach */}
                        <div className="bg-indigo-500/10 border border-indigo-500/20 p-3 rounded-xl flex flex-col gap-3">
                            <div className="flex items-center justify-between">
                                <p className="text-[9px] md:text-[10px] font-black uppercase text-indigo-400 tracking-widest">
                                    {language === 'ko' ? "발음 연습 (Pronunciation Coach)" : "Pronunciation Coach (Practice Speaking)"}
                                </p>
                                {isListening && <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>}
                            </div>
                            <div className="flex items-center gap-3">
                                <button 
                                  onClick={startPronunciationCheck}
                                  disabled={isListening}
                                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${isListening ? 'bg-red-500 animate-pulse' : 'bg-indigo-600 hover:bg-indigo-500'} shadow-lg text-white ring-4 ring-indigo-500/20 active:scale-95`}
                                  title="Speak Answer"
                                >
                                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/><path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg>
                                </button>
                                <div className="flex-1">
                                    <p className="text-xs text-zinc-300 font-medium leading-tight">
                                        {isListening ? "I'm listening... Say it now!" : "Tap the mic and say the answer aloud for a stamp!"}
                                    </p>
                                    {speechResult?.id === item.id && !speechResult.success && (
                                        <p className="text-[10px] text-red-400 mt-1 font-bold">Try again! Listen to Chekki first. 🔊</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Monolingual Guide Based on Current Language */}
                        <div className="space-y-3 pl-1">
                            {language === 'en' ? (
                                <div className="flex gap-2 items-start text-[11px] md:text-xs text-zinc-300">
                                   <span className="text-base shrink-0">🇬🇧</span>
                                   <div className="space-y-1">
                                      <p className="text-[9px] md:text-[10px] font-black uppercase text-zinc-500 tracking-widest">English Guide</p>
                                      <p className="leading-relaxed">{item.english_guide || item.teaching_tip_en || "Learn how to solve this step by step."}</p>
                                   </div>
                                </div>
                            ) : (
                                <>
                                  <div className="bg-brand-purple/10 border border-brand-purple/20 p-2.5 md:p-3 rounded-lg flex gap-3">
                                    <span className="text-base shrink-0">👩‍🏫</span>
                                    <div className="space-y-1">
                                        <p className="text-[9px] md:text-[10px] font-black uppercase text-brand-purple tracking-widest">Mom's Script (엄마의 한마디)</p>
                                        <p className="text-xs text-white leading-relaxed font-korean">{scriptText}</p>
                                    </div>
                                  </div>
                                  <div className="flex gap-2 items-start text-[11px] md:text-xs text-zinc-300 font-korean">
                                    <span className="text-base shrink-0">🇰🇷</span>
                                    <div className="space-y-1">
                                        <p className="text-[9px] md:text-[10px] font-black uppercase text-zinc-500 tracking-widest">Korean Guide (학습 가이드)</p>
                                        <p className="leading-relaxed">{item.korean_guide}</p>
                                    </div>
                                  </div>
                                </>
                            )}
                        </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="p-3 md:p-4 bg-zinc-900 border-t border-zinc-800 shrink-0" onClick={(e) => e.stopPropagation()}>
             <button 
                onClick={() => { if(user?.plan !== 'pro') setShowPaywall(true); else setShowCloneModal(true); }} 
                disabled={isLoadingItems}
                className="w-full py-3 md:py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-black text-xs md:text-sm shadow-xl flex items-center justify-center gap-2 transform transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
             >
                <span>🪄</span> {isLoadingItems ? "Designing..." : t('ws_gen_practice')}
             </button>
          </div>
        </div>
      </div>
    </>
  );
};
