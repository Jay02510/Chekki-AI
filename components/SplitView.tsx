
import React, { useMemo, useState, useRef, useEffect } from 'react';
import { WorksheetItem } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { useMistakes } from '../contexts/MistakeContext';
import { useAuth } from '../contexts/AuthContext';
import { CloneWorksheetModal } from './CloneWorksheetModal';
import { PremiumUpsellModal } from './PremiumUpsellModal';
import { FeedbackModal } from './FeedbackModal';
import { WorksheetOverlay } from './WorksheetOverlay';
import { InlineFeedback } from './InlineFeedback';
import { ASSETS } from '../constants';

interface Props {
  imageUrl: string;
  items: WorksheetItem[];
  isLoadingItems?: boolean;
  worksheetTitle?: string;
}

export const SplitView: React.FC<Props> = ({ imageUrl, items, isLoadingItems = false, worksheetTitle }) => {
  const { t, language } = useLanguage();
  const { toggleMistake, isMistake } = useMistakes();
  const { user, setShowPaywall, isAuthenticated, openLoginModal } = useAuth();

  const [activeItemId, setActiveItemId] = useState<number | null>(null);
  const [showCloneModal, setShowCloneModal] = useState(false);
  const [reportContext, setReportContext] = useState<WorksheetItem | null>(null);
  const [mascotError, setMascotError] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [copyStatus, setCopyStatus] = useState(false);
  const [upsellFeature, setUpsellFeature] = useState<'pronunciation' | 'audio' | 'guide' | null>(null);

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
      setHasInteracted(true);
    }

    // Stop any active recognition when selection changes
    if (recognitionRef.current && isListening) {
      recognitionRef.current.abort();
      setIsListening(false);
    }
  }, [activeItemId]);

  // Handle Speech Recognition Setup & Cleanup
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition && !recognitionRef.current) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript.toLowerCase();
        const activeItem = items.find(i => i.id === activeItemId);
        if (activeItem) {
          const cleanAnswer = activeItem.correct_answer.toLowerCase().replace(/[^\w\s]/g, '').trim();
          const cleanSpeech = transcript.replace(/[^\w\s]/g, '').trim();

          if (cleanSpeech.includes(cleanAnswer) || cleanAnswer.includes(cleanSpeech)) {
            setSpeechResult({ id: activeItem.id, success: true });
            if ('vibrate' in navigator) navigator.vibrate(50);
            const audio = new Audio(ASSETS.STAMP_SOUND);
            audio.play().catch(() => { });
          } else {
            setSpeechResult({ id: activeItem.id, success: false });
            if ('vibrate' in navigator) navigator.vibrate([30, 30, 30]);
          }
        }
        setIsListening(false);
      };

      recognition.onerror = (e: any) => {
        console.error("Speech Recognition Error", e);
        setIsListening(false);
        if (e.error === 'not-allowed') {
          alert("Microphone access was denied. Please check your browser settings.");
        }
      };
      recognition.onend = () => setIsListening(false);
      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [items, activeItemId]); // Refresh when items or active state changes

  const playAudio = (text: string) => {
    if (!isAuthenticated) {
      openLoginModal();
      return;
    }
    if (user?.plan !== 'pro') {
      setUpsellFeature('audio');
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

  const handleCopyToCafe = () => {
    const title = worksheetTitle || (language === 'ko' ? "영어 학습지" : "English Worksheet");
    const template = language === 'ko'
      ? `[영유 숙제 기록] 채키 AI로 오늘 '${title}' 공부 끝냈어요! ✨\n\n아이랑 영유 숙제하다 보면 저도 가끔 헷갈릴 때가 있는데,\n채키(Chekki) 덕분에 정답 위치도 바로 확인하고\n설명도 다정하게 해줄 수 있어서 너무 편하네요.\n\n매일 밤 숙제 전쟁이었는데, 이제는 웃으면서 금방 끝내요! 영유 맘님들께 강력 추천합니다. ❤️\n\n#채키AI #영유맘 #숙제도우미 #부모표영어 #자기주도학습`
      : `Finished '${title}' with Chekki AI tonight! 🚀\n\nHomework time is so much more peaceful now. Chekki gives me the answers and the exact words to say to encourage my child.\n\nHighly recommend to all EK parents! ❤️\n\n#ChekkiAI #HomeworkHelper #ParentingHacks`;

    navigator.clipboard.writeText(template).then(() => {
      setCopyStatus(true);
      setTimeout(() => setCopyStatus(false), 3000);
    });
  };

  const startPronunciationCheck = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      openLoginModal();
      return;
    }
    if (user?.plan !== 'pro') {
      setUpsellFeature('pronunciation');
      return;
    }
    if (!recognitionRef.current) return;
    setSpeechResult(null);
    setIsListening(true);
    recognitionRef.current.start();
  };

  const handleActionClick = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      openLoginModal();
    } else {
      action();
    }
  };

  return (
    <>
      {showCloneModal && <CloneWorksheetModal originalItems={items} onClose={() => setShowCloneModal(false)} />}
      {reportContext && <FeedbackModal context={reportContext} onClose={() => setReportContext(null)} />}
      <PremiumUpsellModal isOpen={upsellFeature !== null} onClose={() => setUpsellFeature(null)} featureName={upsellFeature || 'pronunciation'} />

      <div className="flex flex-col lg:flex-row gap-4 md:gap-6 h-[calc(100dvh-140px)] lg:h-[calc(100vh-250px)] min-h-[500px]">
        <div className="w-full lg:w-1/2 h-[35%] lg:h-full">
          <WorksheetOverlay
            imageUrl={imageUrl}
            items={items}
            focusedId={activeItemId}
            isLoadingItems={isLoadingItems}
          />
        </div>

        <div className="w-full lg:w-1/2 h-[65%] lg:h-full flex flex-col bg-zinc-950/40 rounded-[2.5rem] border border-white/5 overflow-hidden relative shadow-inner" onClick={() => setActiveItemId(null)}>
          <div className="px-5 py-4 border-b border-white/5 bg-zinc-900/40 backdrop-blur-xl flex flex-col shrink-0">
            <div className="flex justify-between items-center w-full">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-zinc-800 border border-white/5 flex items-center justify-center overflow-hidden shadow-xl">
                  {!mascotError ? <img src={ASSETS.MASCOT_HAPPY} alt="Chekki" className="w-full h-full object-cover scale-110" onError={() => setMascotError(true)} /> : <span className="text-xl">🎓</span>}
                </div>
                <div>
                  <h3 className="font-black text-white font-display text-lg leading-none mb-0.5">{t('ws_results_title')}</h3>
                  <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest">{isLoadingItems ? t('ws_scanning_header') : `${items.length} ${t('ws_items_found')}`}</p>
                </div>
              </div>
            </div>

            {!isLoadingItems && items.length > 0 && !hasInteracted && (
              <div className="mt-3 animate-fade-in-up">
                <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl px-4 py-2 flex items-center gap-3">
                  <span className="text-orange-500 text-sm animate-pulse">💡</span>
                  <p className="text-[9px] md:text-xs font-black text-orange-400 uppercase tracking-widest leading-tight">
                    {t('tip_click_guide')}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="overflow-y-auto p-4 md:p-6 space-y-4 custom-scrollbar flex-1 overscroll-contain bg-gradient-to-b from-transparent to-zinc-950/20">
            {isLoadingItems && items.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center space-y-4 py-20">
                <div className="w-10 h-10 border-2 border-white/5 border-t-orange-500 rounded-full animate-spin"></div>
                <p className="text-xs font-bold text-zinc-500 font-korean">{t('ws_scanning_detail')}</p>
              </div>
            )}

            {items.map((item, idx) => {
              const isActive = activeItemId === item.id;
              const flagged = isMistake(item.question_text, item.correct_answer);
              const scriptText = language === 'ko' ? item.teaching_script_ko : item.teaching_script_en;
              const guideText = language === 'ko' ? item.korean_guide : item.english_guide;
              const answerText = item.correct_answer;
              const isFirstItem = idx === 0;

              return (
                <div key={item.id} ref={(el) => { itemRefs.current[item.id] = el; }} onClick={(e) => { e.stopPropagation(); setActiveItemId(item.id); }}
                  className={`group relative rounded-[1.8rem] border transition-all duration-300 cursor-pointer overflow-hidden animate-fade-in-up transform-gpu ${isActive ? 'bg-zinc-800/95 border-orange-500/50 shadow-[0_20px_60px_rgba(0,0,0,0.5)] scale-[1.01]' : 'bg-zinc-900/60 border-white/5 hover:border-white/20'}`}>

                  {isFirstItem && !hasInteracted && (
                    <div className="absolute top-2 right-2 flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500 text-[8px] font-black text-white uppercase tracking-widest animate-bounce z-10 shadow-lg ring-2 ring-white/10">
                      <span>Tap here</span> 👆
                    </div>
                  )}

                  <div className="flex items-start p-4 md:p-6 gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs md:text-base font-black shrink-0 transition-all duration-300 ${isActive ? 'bg-orange-500 text-white shadow-lg' : 'bg-zinc-800 text-zinc-500'}`}>
                      {item.id}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className={`text-sm md:text-lg font-bold leading-relaxed mb-3 transition-colors break-keep ${isActive ? 'text-white' : 'text-zinc-400'}`}>
                        {item.question_text.replace(/^\d+[\.\)\s]+/, '')}
                      </h4>
                      <div className="bg-white/5 rounded-2xl px-4 py-1.5 border border-white/5 w-fit shadow-inner">
                        <span className="font-hand text-2xl md:text-3xl text-emerald-400 font-bold">{answerText}</span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button onClick={(e) => { e.stopPropagation(); playAudio(answerText); }} className={`w-10 h-10 md:w-11 md:h-11 rounded-full flex items-center justify-center transition-all ${isActive ? 'bg-orange-500 text-white shadow-lg' : 'bg-white/5 text-zinc-400 hover:bg-zinc-700'} active:scale-90 min-w-[44px] min-h-[44px]`}>
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77zm-3 0L5.5 8H1v8h4.5l6.5 4.77V3.23z" /></svg>
                      </button>
                      <button onClick={(e) => handleActionClick(e, () => toggleMistake(item))} className={`w-10 h-10 md:w-11 md:h-11 rounded-full flex items-center justify-center transition-all ${flagged ? 'bg-red-500 text-white shadow-lg' : 'bg-white/5 text-zinc-400 hover:bg-zinc-700'} active:scale-90 min-w-[44px] min-h-[44px]`}>
                        <svg className="w-5 h-5" fill={flagged ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
                      </button>
                    </div>
                  </div>

                  {isActive && (
                    <div className="px-4 pb-6 md:px-6 md:pb-8 animate-fade-in-up space-y-4">
                      {!isAuthenticated ? (
                        <div className="bg-orange-500/10 border border-orange-500/30 rounded-3xl p-6 text-center space-y-4 shadow-inner">
                          <p className="text-sm font-bold text-white font-korean leading-relaxed">
                            {language === 'ko' ? "다정한 티칭 스크립트와 가이드를 보려면 로그인이 필요해요!" : "Log in to unlock the full teaching scripts and guides!"}
                          </p>
                          <button onClick={openLoginModal} className="bg-white text-black px-8 py-4 rounded-2xl font-black text-sm uppercase shadow-xl active:scale-95 transition-all w-full min-h-[48px]">
                            {language === 'ko' ? "지금 로그인하기" : "Log In Now"}
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-3xl p-5 flex items-center gap-5 shadow-inner">
                            <button
                              onClick={startPronunciationCheck}
                              disabled={isListening}
                              className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center transition-all ${isListening ? 'bg-red-500 animate-[pulse_1s_infinite] ring-4 ring-red-500/40' : 'bg-indigo-600 hover:bg-indigo-500'} text-white shadow-[0_15px_35px_rgba(79,70,229,0.3)] active:scale-90 min-w-[56px] min-h-[56px]`}
                            >
                              {isListening ? (
                                <div className="flex items-center gap-1.5">
                                  <div className="w-1.5 h-6 bg-white rounded-full animate-[mic-wave_1s_ease-in-out_infinite_0s]"></div>
                                  <div className="w-1.5 h-8 bg-white rounded-full animate-[mic-wave_1s_ease-in-out_infinite_0.1s]"></div>
                                  <div className="w-1.5 h-6 bg-white rounded-full animate-[mic-wave_1s_ease-in-out_infinite_0.2s]"></div>
                                </div>
                              ) : (
                                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" /><path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" /></svg>
                              )}
                            </button>
                            <div className="flex-1">
                              <p className="text-xs text-white font-black uppercase tracking-widest mb-1">
                                {isListening ? (language === 'ko' ? "듣고 있어요..." : "Listening...") : (language === 'ko' ? "원어민처럼 말하기" : "Speaking Coach")}
                              </p>
                              <p className="text-[10px] text-indigo-300/80 font-bold leading-relaxed">
                                {isListening ? (language === 'ko' ? "아이의 목소리를 분석 중입니다" : "Analyzing your child's voice...") : (language === 'ko' ? "버튼을 누르고 발음해보세요! (영어만 가능)" : "Tap to speak and get a digital stamp!")}
                              </p>
                            </div>
                          </div>
                          {user?.plan === 'pro' ? (
                            <>
                              <div className="bg-orange-500/10 border border-orange-500/20 rounded-3xl p-5 shadow-inner">
                                <p className="text-[10px] font-black uppercase text-orange-500 mb-2 tracking-widest">{t('lbl_mom_tip')}</p>
                                <p className="text-sm md:text-base text-zinc-200 font-korean leading-relaxed font-bold italic">"{scriptText}"</p>
                              </div>
                              <div className="bg-zinc-950/40 border border-white/5 rounded-3xl p-5 shadow-inner">
                                <p className="text-[10px] font-black uppercase text-zinc-500 mb-2 tracking-widest">Learning Guide</p>
                                <p className="text-xs md:text-sm text-zinc-400 font-korean leading-relaxed break-keep">{guideText}</p>
                              </div>
                            </>
                          ) : (
                            <button onClick={() => setUpsellFeature('guide')} className="bg-gradient-to-r from-orange-500/10 to-pink-500/10 border border-orange-500/20 rounded-3xl p-5 shadow-inner text-center w-full active:scale-95 transition-all">
                              <p className="text-[10px] font-black uppercase text-orange-500 mb-2 tracking-widest">🔒 {language === 'ko' ? '프리미엄 기능' : 'Premium Feature'}</p>
                              <p className="text-sm text-zinc-300 font-korean font-bold">{language === 'ko' ? '티칭 가이드와 스크립트를 보려면 업그레이드하세요' : 'Upgrade to unlock Teaching Guide & Script'}</p>
                              <p className="text-[10px] text-orange-400 font-bold mt-2 uppercase tracking-wider">{language === 'ko' ? '탭하여 업그레이드' : 'Tap to Upgrade →'}</p>
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {!isLoadingItems && items.length > 0 && (
              <div className="space-y-6 pt-6 pb-2">
                <div className="bg-[#03C75A]/10 border border-[#03C75A]/20 rounded-[2.5rem] p-6 md:p-8 animate-fade-in-up flex flex-col items-center text-center group">
                  <div className="w-14 h-14 rounded-full bg-[#03C75A] flex items-center justify-center text-2xl mb-4 shadow-[0_10px_30px_rgba(3,199,90,0.3)] animate-float">
                    🕊️
                  </div>
                  <h4 className="text-white font-black text-lg md:text-xl font-display mb-2">{t('share_title')}</h4>
                  <p className="text-zinc-400 text-xs md:text-sm font-korean mb-6 leading-relaxed opacity-80 break-keep">
                    {t('share_desc')}
                  </p>
                  <button
                    onClick={handleCopyToCafe}
                    className={`w-full py-4 rounded-2xl font-black text-sm transition-all transform active:scale-95 flex items-center justify-center gap-3 shadow-xl min-h-[48px] ${copyStatus ? 'bg-emerald-500 text-white' : 'bg-[#03C75A] hover:bg-[#02A64B] text-white'}`}
                  >
                    {copyStatus ? (
                      <span className="animate-fade-in">✓ {t('share_toast')}</span>
                    ) : (
                      <>
                        <span>📋</span> {t('share_btn')}
                      </>
                    )}
                  </button>
                </div>

                <InlineFeedback />
              </div>
            )}
          </div>

          <div className="p-5 md:p-6 bg-zinc-900/90 backdrop-blur-3xl border-t border-white/5 shrink-0 z-10 shadow-[0_-20px_40px_rgba(0,0,0,0.4)]" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => { if (!isAuthenticated) openLoginModal(); else if (user?.plan !== 'pro') setShowPaywall(true); else setShowCloneModal(true); }}
              disabled={isLoadingItems}
              className="w-full py-5 rounded-[2rem] bg-gradient-to-r from-orange-500 to-pink-500 text-white font-black text-base shadow-[0_15px_40px_rgba(249,115,22,0.4)] flex items-center justify-center gap-3 transform transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 ring-2 ring-white/10 min-h-[56px]"
            >
              <span className="text-2xl">🪄</span>
              {isLoadingItems ? t('growing_text') : t('ws_gen_practice')}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
