
import React, { useMemo, useState, useRef, useEffect } from 'react';
import { WorksheetItem } from '../types';
import { WorksheetOverlay } from './WorksheetOverlay';
import { useLanguage } from '../contexts/LanguageContext';
import { useMistakes } from '../contexts/MistakeContext';
import { useAuth } from '../contexts/AuthContext';
import { CloneWorksheetModal } from './CloneWorksheetModal';
import { ASSETS } from '../constants';
import { ChekkiMascot } from './Icons';

interface Props {
  imageUrl: string;
  items: WorksheetItem[];
}

export const SplitView: React.FC<Props> = ({ imageUrl, items }) => {
  const { t, language } = useLanguage(); 
  const { toggleMistake, isMistake } = useMistakes();
  const { user, setShowPaywall } = useAuth(); // Auth hook for Paywall
  
  const [activeItemId, setActiveItemId] = useState<number | null>(null);
  const [listeningId, setListeningId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{id: number, type: 'success' | 'error' | 'info', msg: string} | null>(null);
  const [userAudio, setUserAudio] = useState<string | null>(null);
  const [showTip, setShowTip] = useState(true);
  const [showCloneModal, setShowCloneModal] = useState(false);
  const [mascotError, setMascotError] = useState(false);

  // Refs
  const itemRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Auto-scroll logic when activeItemId changes
  useEffect(() => {
    if (activeItemId !== null && itemRefs.current[activeItemId]) {
      itemRefs.current[activeItemId]?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [activeItemId]);

  // Clean up user audio when switching items
  useEffect(() => {
    setUserAudio(null);
    setFeedback(null);
  }, [activeItemId]);

  const normalizeText = (text: string) => {
    if (!text) return "";
    return text
      .replace(/\([^)]*\)/g, '')
      .replace(/\[[^\]]*\]/g, '')
      .replace(/\d+(?:st|nd|rd|th)\s*(?:time|line)?/gi, '')
      .replace(/\d+x's?/gi, '')
      .replace(/[0-9]+\./g, '')
      .replace(/[.,/#!$%^&*;:{}=\-_`~]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  };

  const getDisplayQuestion = (text: string) => text.replace(/\(\d+\/\d+\)/g, '').trim();

  const groupedItems = useMemo(() => {
    const groups: { main: WorksheetItem; count: number; ids: number[] }[] = [];
    
    // Sort by position
    const sortedItems = [...items].sort((a, b) => {
        const yA = a.bounding_box ? a.bounding_box.ymin : 0;
        const yB = b.bounding_box ? b.bounding_box.ymin : 0;
        return yA - yB;
    });

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

  // PRO FEATURE: Audio
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

  const playUserAudio = () => {
      if (userAudio) {
          const audio = new Audio(userAudio);
          audio.play();
      }
  };

  // PRO FEATURE: Pronunciation Check (Microphone + Recording)
  const handlePronunciation = async (id: number, targetText: string) => {
    if (user?.plan !== 'pro') {
      setShowPaywall(true);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setFeedback({ id, type: 'error', msg: "Browser Not Supported" });
      setTimeout(() => setFeedback(null), 2000);
      return;
    }

    // Reset previous audio
    if (userAudio) URL.revokeObjectURL(userAudio);
    setUserAudio(null);

    setListeningId(id);
    setFeedback({ id, type: 'info', msg: "Listening..." });
    
    try {
        // 1. Setup Audio Recording
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) audioChunksRef.current.push(event.data);
        };

        mediaRecorder.onstop = () => {
            const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
            const url = URL.createObjectURL(audioBlob);
            setUserAudio(url);
            
            // Stop all tracks to release mic
            stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorder.start();

        // 2. Setup Speech Recognition
        const recognition = new SpeechRecognition();
        recognition.lang = 'en-US';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onresult = (event: any) => {
            const speechResult = event.results[0][0].transcript;
            const cleanSpeech = speechResult.toLowerCase().trim();
            const cleanTarget = targetText.toLowerCase().trim();
            
            // Stop recording immediately on result
            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
                mediaRecorderRef.current.stop();
            }

            // Simple fuzzy matching
            if (cleanSpeech.includes(cleanTarget) || cleanTarget.includes(cleanSpeech)) {
                setFeedback({ id, type: 'success', msg: "Perfect! 🎉" });
            } else {
                setFeedback({ id, type: 'error', msg: `Heard: "${speechResult}"` });
            }
            setListeningId(null);
        };

        recognition.onerror = (event: any) => { 
            console.error("Speech Recog Error", event.error);
            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
                mediaRecorderRef.current.stop();
            }

            if (event.error === 'not-allowed') {
                setFeedback({ id, type: 'error', msg: "Mic Blocked" });
            } else {
                setFeedback({ id, type: 'error', msg: "Try Again" });
            }
            setListeningId(null); 
        };

        recognition.onend = () => {
            if (listeningId === id) setListeningId(null);
        };

        recognition.start();

    } catch (e) {
        console.error("Mic access error", e);
        setListeningId(null);
        setFeedback({ id, type: 'error', msg: "Mic Error" });
    }
  };

  // PRO FEATURE: Generator
  const handleGenerateClick = () => {
    if (user?.plan !== 'pro') {
      setShowPaywall(true);
      return;
    }
    setShowCloneModal(true);
  };

  // Background click to reset selection
  const handleBackgroundClick = (e: React.MouseEvent) => {
    // Only reset if we are not clicking a button or interactive element
    // The e.target check helps, but stopping propagation on children is more robust
    setActiveItemId(null);
  };

  return (
    <>
      {showCloneModal && <CloneWorksheetModal originalItems={items} onClose={() => setShowCloneModal(false)} />}
      
      {/* Updated height to ensure scrolling happens above the footer button */}
      <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-250px)] min-h-[500px]">
        {/* LEFT: Interactive Map */}
        <div className="w-full lg:w-1/2 h-1/2 lg:h-full flex flex-col">
          <div className="flex-1 rounded-2xl border border-zinc-800 bg-zinc-900 shadow-xl overflow-hidden relative group">
              
              {/* PRIVACY INDICATOR HEADER */}
              <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/80 to-transparent backdrop-blur-[2px] px-4 py-3 flex justify-between items-start pointer-events-none">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest bg-black/50 px-2 py-1 rounded border border-white/10">
                    {t('ws_ref_scan')}
                  </span>
                  
                  {/* Privacy Badge */}
                  <div className="flex flex-col items-end">
                    <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-lg backdrop-blur-md">
                        <svg className="w-3 h-3 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        <span className="text-[10px] font-bold text-emerald-200">
                            {language === 'ko' ? "서버 저장 안됨 (보안)" : "Not Saved to Cloud"}
                        </span>
                    </div>
                  </div>
              </div>

              <div className="h-full overflow-y-auto custom-scrollbar flex items-center justify-center bg-zinc-950/50">
                <div className="w-full h-full">
                  <WorksheetOverlay 
                      imageUrl={imageUrl} 
                      items={items} 
                      isInteractive={true} 
                      focusedId={activeItemId} 
                      className="h-full"
                  />
                </div>
              </div>
          </div>
        </div>

        {/* RIGHT: Clean List View */}
        <div 
            className="w-full lg:w-1/2 h-1/2 lg:h-full flex flex-col bg-zinc-900/50 rounded-2xl border border-zinc-800/50 overflow-hidden relative"
            onClick={handleBackgroundClick} // Clicking the empty space resets selection
        >
          
          {/* List Header with Mascot */}
          <div 
            className="p-6 border-b border-zinc-800 bg-zinc-900 flex justify-between items-center shrink-0 relative overflow-hidden"
            onClick={(e) => e.stopPropagation()} // Prevent header clicks from resetting
          >
             {/* Mascot appearing on the right side of the header */}
             <div className="absolute -right-4 -bottom-12 w-48 h-48 opacity-100 pointer-events-none filter drop-shadow-xl z-0">
                 {!mascotError ? (
                     <img 
                        src={ASSETS.MASCOT_SCAN} 
                        alt="Chekki Scan" 
                        onError={() => setMascotError(true)} 
                        className="w-full h-full object-contain"
                     />
                 ) : (
                    <ChekkiMascot mood="happy" className="w-full h-full" />
                 )}
             </div>

            <div className="flex items-center gap-4 relative z-10">
               {/* Mascot Small Icon */}
               <div className="w-16 h-16 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center overflow-hidden shadow-lg">
                    {!mascotError ? (
                        <img 
                            src={ASSETS.MASCOT_HAPPY} 
                            alt="Chekki" 
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <span className="text-3xl">🎓</span>
                    )}
               </div>
               <div>
                  <h3 className="font-bold text-white font-display text-2xl leading-none mb-1">{t('ws_results_title')}</h3>
                  <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider bg-zinc-800 px-2 py-1 rounded">
                    {groupedItems.length} {t('ws_items_found')}
                  </span>
               </div>
            </div>
          </div>

          {showTip && (
            <div 
                className="bg-gradient-to-r from-orange-500/10 to-transparent border-b border-orange-500/10 p-3 flex items-center gap-3 shrink-0"
                onClick={(e) => e.stopPropagation()}
            >
              <span className="text-sm">💡</span>
              <p className="text-xs text-zinc-400 font-korean flex-1">{t('ws_review_tip')}</p>
              <button onClick={() => setShowTip(false)} className="text-zinc-500 hover:text-white px-2">✕</button>
            </div>
          )}

          <div className="overflow-y-auto p-2 space-y-2 custom-scrollbar flex-1 scroll-smooth relative z-10">
            {groupedItems.map((group, index) => {
              const item = group.main;
              const isRepeated = group.count > 1;
              const isActive = activeItemId === item.id || (isRepeated && activeItemId && group.ids.includes(activeItemId));
              const isListening = listeningId === item.id;
              const itemFeedback = feedback?.id === item.id ? feedback : null;
              const flagged = isMistake(item.question_text);

              // Logic for switching guide text based on language
              const guideText = language === 'ko' ? item.korean_guide : (item.english_guide || item.teaching_tip_en || item.korean_guide);

              return (
                <div 
                  key={index}
                  ref={(el) => { itemRefs.current[item.id] = el; }} 
                  onClick={(e) => { 
                      e.stopPropagation(); // Crucial: Prevent bubbling to background (which resets selection)
                      setActiveItemId(item.id); 
                  }}
                  className={`
                    relative rounded-lg border transition-all duration-200 cursor-pointer overflow-hidden backdrop-blur-sm
                    ${isActive 
                      ? 'bg-zinc-800/90 border-orange-500 shadow-lg ring-1 ring-orange-500/50' 
                      : 'bg-zinc-900/60 border-zinc-800/50 hover:bg-zinc-800/80 hover:border-zinc-700'
                    }
                  `}
                >
                  <div className="flex items-start p-3 gap-3">
                    <div className={`
                      w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 font-mono transition-colors
                      ${isActive ? 'bg-orange-500 text-white' : 'bg-zinc-800 text-zinc-500 group-hover:bg-zinc-700 group-hover:text-zinc-300'}
                    `}>
                      {index + 1}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className={`text-sm font-medium leading-tight mb-1.5 truncate ${isActive ? 'text-white' : 'text-zinc-400'}`}>
                        {getDisplayQuestion(item.question_text) || "Question"}
                      </h4>
                      
                      <div className="flex items-center gap-2 overflow-hidden">
                        <span className="font-hand text-lg text-emerald-400 font-bold whitespace-nowrap">
                          {isRepeated 
                            ? `${item.correct_answer} × ${group.count}`
                            : item.correct_answer
                          }
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {/* Audio Button - Paywalled via playAudio function */}
                      <button 
                        onClick={(e) => { e.stopPropagation(); playAudio(item.correct_answer); }}
                        className="p-2 rounded-full text-zinc-500 hover:text-white hover:bg-white/5 transition-colors relative group/btn"
                        title="Play Audio"
                      >
                         {user?.plan !== 'pro' && (
                             <div className="absolute -top-1 -right-1 w-3 h-3 bg-zinc-800 rounded-full border border-zinc-600 flex items-center justify-center">
                                 <span className="text-[6px]">🔒</span>
                             </div>
                         )}
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 14.142M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
                      </button>
                      
                      <button
                          onClick={(e) => { e.stopPropagation(); toggleMistake(item); }}
                          className={`p-2 rounded-full transition-colors ${flagged ? 'text-red-500 bg-red-500/10' : 'text-zinc-600 hover:text-zinc-400 hover:bg-white/5'}`}
                          title="Save to Review"
                        >
                          <svg className="w-4 h-4" fill={flagged ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21V5a2 2 0 012-2h10a2 2 0 012 2v8l-7-3.5L5 13v8" />
                          </svg>
                        </button>
                    </div>
                  </div>
                  
                  <div className={`
                      border-t border-white/5 bg-black/20 px-4 py-3 flex items-center justify-between gap-4 transition-all duration-300
                      ${isActive ? 'block opacity-100' : 'hidden opacity-0'}
                  `}>
                      <div className="flex gap-2 items-center text-xs text-zinc-400 font-korean overflow-hidden">
                        <span className="text-sm shrink-0">🧐</span>
                        <span className="truncate">{guideText}</span>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        {itemFeedback && (
                            <div className="flex items-center gap-2">
                                <span className={`text-xs font-bold animate-pulse ${
                                    itemFeedback.type === 'success' ? 'text-emerald-400' : 
                                    itemFeedback.type === 'error' ? 'text-red-400' : 'text-orange-400'
                                }`}>
                                    {itemFeedback.msg}
                                </span>
                                
                                {/* Replay User Audio Button */}
                                {userAudio && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); playUserAudio(); }}
                                        className="w-6 h-6 rounded-full bg-zinc-700 flex items-center justify-center hover:bg-zinc-600 transition-colors border border-zinc-600"
                                        title="Replay your recording"
                                    >
                                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M8 5v14l11-7z" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                        )}
                        {/* Pronunciation Check - Paywalled */}
                        <button 
                            onClick={(e) => { e.stopPropagation(); handlePronunciation(item.id, item.correct_answer); }} 
                            disabled={isListening} 
                            className={`
                              w-8 h-8 rounded-full flex items-center justify-center border transition-all relative group
                              ${isListening ? 'bg-orange-500/20 border-orange-500 text-orange-400 ring-2 ring-orange-500/30' : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500'}
                            `}
                            title="Check Pronunciation"
                          >
                            {user?.plan !== 'pro' && (
                                <div className="absolute -top-1 -right-1 w-3 h-3 bg-zinc-800 rounded-full border border-zinc-600 flex items-center justify-center z-10">
                                    <span className="text-[6px]">🔒</span>
                                </div>
                            )}
                            {isListening ? (
                              <div className="w-2 h-2 bg-orange-400 rounded-full animate-ping"></div>
                            ) : (
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                            )}
                          </button>
                      </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* AI Feature Button with Tooltip - Paywalled */}
          <div 
            className="p-4 bg-zinc-900 border-t border-zinc-800 relative z-20"
            onClick={(e) => e.stopPropagation()}
          >
             <div className="relative group">
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-64 bg-zinc-800 text-zinc-200 text-xs rounded-xl p-3 shadow-2xl opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-30 text-center border border-zinc-700 transform translate-y-2 group-hover:translate-y-0">
                    <span className="font-bold text-orange-400 block mb-1 text-sm">✨ Unlimited Practice (Pro)</span>
                    Create a brand new worksheet with similar questions to master these skills!
                    <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-zinc-800 rotate-45 border-r border-b border-zinc-700"></div>
                </div>

                 <button 
                   onClick={handleGenerateClick}
                   className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] relative"
                 >
                    {user?.plan !== 'pro' && <span className="absolute right-4 text-xs bg-black/20 px-2 py-0.5 rounded text-white/80">🔒 Pro</span>}
                    <span>🪄</span> Generate Practice Questions
                 </button>
             </div>
          </div>
        </div>
      </div>
    </>
  );
};
