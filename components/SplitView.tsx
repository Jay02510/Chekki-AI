
import React, { useMemo, useState, useRef, useEffect } from 'react';
import { WorksheetItem } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { useMistakes } from '../contexts/MistakeContext';
import { useAuth } from '../contexts/AuthContext';
import { CloneWorksheetModal } from './CloneWorksheetModal';
import { FeedbackModal } from './FeedbackModal';
import { WorksheetOverlay } from './WorksheetOverlay';
import { ASSETS } from '../constants';

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
        {/* Left Side: Worksheet Overlay (The Magic Paper) */}
        <div className="w-full lg:w-1/2 h-[40%] lg:h-full">
            <WorksheetOverlay 
                imageUrl={imageUrl} 
                items={items} 
                focusedId={activeItemId}
                isLoadingItems={isLoadingItems}
            />
        </div>

        {/* Right Side: Enhanced Teaching Cards */}
        <div className="w-full lg:w-1/2 h-[60%] lg:h-full flex flex-col bg-zinc-950/40 rounded-[2.5rem] border border-white/5 overflow-hidden relative" onClick={() => setActiveItemId(null)}>
          <div className="px-6 py-5 border-b border-white/5 bg-zinc-900/40 backdrop-blur-xl flex justify-between items-center shrink-0">
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 rounded-2xl bg-zinc-800 border border-white/5 flex items-center justify-center overflow-hidden shadow-xl">
                    {!mascotError ? <img src={ASSETS.MASCOT_HAPPY} alt="Chekki" className="w-full h-full object-cover scale-110" onError={() => setMascotError(true)} /> : <span className="text-2xl">🎓</span>}
               </div>
               <div>
                  <h3 className="font-black text-white font-display text-xl leading-none mb-1">{t('ws_results_title')}</h3>
                  <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">{isLoadingItems ? t('ws_scanning_header') : `${items.length} ${t('ws_items_found')}`}</p>
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

            {items.map((item) => {
              const isActive = activeItemId === item.id;
              const flagged = isMistake(item.question_text);
              const scriptText = language === 'ko' ? item.teaching_script_ko : item.teaching_script_en;
              const guideText = language === 'ko' ? item.korean_guide : item.english_guide;
              const answerText = item.correct_answer;

              return (
                <div key={item.id} ref={(el) => { itemRefs.current[item.id] = el; }} onClick={(e) => { e.stopPropagation(); setActiveItemId(item.id); }}
                  className={`group relative rounded-[1.8rem] border transition-all duration-300 cursor-pointer overflow-hidden animate-fade-in-up ${isActive ? 'bg-zinc-800/90 border-orange-500/50 shadow-[0_20px_40px_rgba(0,0,0,0.4)]' : 'bg-zinc-900/60 border-white/5 hover:border-white/20'}`}>
                  
                  <div className="flex items-start p-4 md:p-6 gap-4">
                    <div className={`w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center text-xs md:text-sm font-black shrink-0 transition-all duration-300 ${isActive ? 'bg-orange-500 text-white shadow-lg' : 'bg-zinc-800 text-zinc-500'}`}>
                      {item.id}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h4 className={`text-sm md:text-base font-bold leading-relaxed mb-2 transition-colors ${isActive ? 'text-white' : 'text-zinc-400'}`}>
                        {item.question_text.replace(/^\d+[\.\)\s]+/, '')}
                      </h4>
                      <div className="bg-white/5 rounded-xl px-3 py-1 border border-white/5 w-fit">
                         <span className="font-hand text-xl md:text-2xl text-emerald-400 font-bold">{answerText}</span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                        <button onClick={(e) => { e.stopPropagation(); playAudio(answerText); }} className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-white/5 flex items-center justify-center text-zinc-400 hover:bg-orange-500 hover:text-white transition-all">
                           <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77zm-3 0L5.5 8H1v8h4.5l6.5 4.77V3.23z"/></svg>
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); toggleMistake(item); }} className={`w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center transition-all ${flagged ? 'bg-red-500 text-white' : 'bg-white/5 text-zinc-400 hover:bg-zinc-700'}`}>
                           <svg className="w-4 h-4" fill={flagged ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
                        </button>
                    </div>
                  </div>

                  {isActive && (
                    <div className="px-4 pb-6 md:px-6 md:pb-8 animate-fade-in-up space-y-4">
                        <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-4 flex items-center gap-4">
                            <button onClick={startPronunciationCheck} disabled={isListening} className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${isListening ? 'bg-red-500 animate-pulse' : 'bg-indigo-600'} text-white shadow-lg`}>
                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/><path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg>
                            </button>
                            <p className="text-xs text-indigo-200/80 font-bold leading-relaxed">{isListening ? (language === 'ko' ? "듣는 중..." : "Listening...") : (language === 'ko' ? "발음 연습을 해보세요!" : "Tap to practice speaking!")}</p>
                        </div>
                        <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-4">
                            <p className="text-[10px] font-black uppercase text-orange-500 mb-1">{t('lbl_mom_tip')}</p>
                            <p className="text-sm text-zinc-200 font-korean leading-relaxed font-medium">"{scriptText}"</p>
                        </div>
                        <div className="bg-zinc-950/40 border border-white/5 rounded-2xl p-4">
                            <p className="text-[10px] font-black uppercase text-zinc-500 mb-1">Learning Guide</p>
                            <p className="text-xs text-zinc-400 font-korean leading-relaxed">{guideText}</p>
                        </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="p-4 md:p-6 bg-zinc-900 border-t border-white/5 shrink-0" onClick={(e) => e.stopPropagation()}>
             <button 
                onClick={() => { if(user?.plan !== 'pro') setShowPaywall(true); else setShowCloneModal(true); }} 
                disabled={isLoadingItems}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-orange-500 to-pink-500 text-white font-black text-sm shadow-[0_10px_30px_rgba(249,115,22,0.3)] flex items-center justify-center gap-3 transform transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
             >
                <span className="text-xl">🪄</span> 
                {isLoadingItems ? t('growing_text') : t('ws_gen_practice')}
             </button>
          </div>
        </div>
      </div>
    </>
  );
};
