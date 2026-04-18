
import React, { useMemo, useState, useRef, useEffect } from 'react';
import { WorksheetItem } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { useMistakes } from '../contexts/MistakeContext';
import { useAuth } from '../contexts/AuthContext';
import { CloneWorksheetModal } from './CloneWorksheetModal';
import { PremiumUpsellModal } from './PremiumUpsellModal';
import { FeedbackModal } from './FeedbackModal';
import { RefineModal } from './RefineModal';
import { WorksheetOverlay } from './WorksheetOverlay';
import { InlineFeedback } from './InlineFeedback';
import { ASSETS } from '../constants';
import { Share } from '@capacitor/share';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';
import { PUBLIC_APP_URL } from '../config';
import { toJpeg } from 'html-to-image';
import { SpeechRecognition } from '@capgo/capacitor-speech-recognition';
import { normalizeText, compareSpeech } from '../utils/speechUtils';
import { refineWorksheetItem } from '../services/geminiService';
import { renderMarkdown } from '../utils/markdownUtils';
import { AskChekkiBar, AskChekkiAnswerModal } from './AskChekkiBar';
import { askChekkiQuestion } from '../services/geminiService';


interface Props {
  imageUrl: string;
  items: WorksheetItem[];
  isLoadingItems?: boolean;
  worksheetTitle?: string;
  onScanAgain?: () => void;
}

export const SplitView: React.FC<Props> = ({ imageUrl, items, isLoadingItems = false, worksheetTitle, onScanAgain }) => {
  const { t, language } = useLanguage();
  const { toggleMistake, isMistake } = useMistakes();
  const { user, setShowPaywall, isAuthenticated, openLoginModal } = useAuth();

  const [activeItemId, setActiveItemId] = useState<number | null>(null);
  const [localItems, setLocalItems] = useState<WorksheetItem[]>(items);
  const [showCloneModal, setShowCloneModal] = useState(false);
  const [reportContext, setReportContext] = useState<WorksheetItem | null>(null);
  const [refiningItemId, setRefiningItemId] = useState<number | null>(null);
  const [isRefining, setIsRefining] = useState(false);
  const [mascotError, setMascotError] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [upsellFeature, setUpsellFeature] = useState<'pronunciation' | 'audio' | 'guide' | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [shareWebNotice, setShareWebNotice] = useState(false);

  // Ask Chekki States
  const [askQuery, setAskQuery] = useState('');
  const [askAnswer, setAskAnswer] = useState<string | null>(null);
  const [askAnsweredQuestion, setAskAnsweredQuestion] = useState('');
  const [isAsking, setIsAsking] = useState(false);

  // Pronunciation States
  const [isListening, setIsListening] = useState(false);
  const [speechResult, setSpeechResult] = useState<{ id: number; success: boolean } | null>(null);
  const recognitionRef = useRef<any>(null);
  const nativeListenerRef = useRef<any>(null);
  const lastTranscriptRef = useRef<string>("");

  const itemRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});

  useEffect(() => {
    setLocalItems(items);
  }, [items]);

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
    // Clear speech result on active item change
    setSpeechResult(null);
  }, [activeItemId]);

  // Handle Speech Recognition Setup & Cleanup (Web Speech API fallback for browsers only)
  useEffect(() => {
    // On native platforms, we use @capgo/capacitor-speech-recognition instead
    if (Capacitor.isNativePlatform()) return;

    const WebSpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (WebSpeechRecognition) {
      const recognition = new WebSpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        const activeItem = items.find(i => i.id === activeItemId);
        if (activeItem) {
          evaluateSpeechResult(transcript, activeItem);
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
        try {
          recognitionRef.current.abort();
        } catch (e) { console.error(e); }
        recognitionRef.current = null;
      }
      if (nativeListenerRef.current) {
        nativeListenerRef.current.remove().catch(() => { });
        nativeListenerRef.current = null;
      }
    };
  }, [items, activeItemId]); // Refresh when items or active state changes

  const stopPronunciationCheck = async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        await SpeechRecognition.stop();
        if (nativeListenerRef.current) {
           await nativeListenerRef.current.remove();
           nativeListenerRef.current = null;
        }
        
        const activeItem = items.find(i => i.id === activeItemId);
        if (activeItem && lastTranscriptRef.current) {
          evaluateSpeechResult(lastTranscriptRef.current, activeItem);
        } else if (activeItem && !speechResult) {
          // If stopped without any transcript, mark as failed
          setSpeechResult({ id: activeItem.id, success: false });
        }
      } catch (err) {
        console.error("Native speech recognition stop error:", err);
      } finally {
        setIsListening(false);
      }
    } else if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (err) { console.error(err); }
      setIsListening(false);
    }
  };

  const playAudio = (text: string) => {
    if (!isAuthenticated) {
      openLoginModal();
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

  const handleAskSubmit = async (question: string) => {
    if (!question.trim() || isAsking) return;
    
    setAskAnswer(null);
    setAskAnsweredQuestion(question);
    setIsAsking(true);
    
    try {
      const isGuest = !isAuthenticated;
      const response = await askChekkiQuestion(question, language, isGuest);
      setAskAnswer(response);
    } catch (error: any) {
      console.error("Ask Chekki error:", error.message);
      
      let errorMsg = language === 'ko' ? '오류가 발생했습니다. 다시 시도해주세요.' : 'Something went wrong. Please try again.';
      
      if (error.message === 'BURST_LIMIT_REACHED') {
        errorMsg = language === 'ko' 
          ? '채키가 잠시 숨을 고르고 있어요. 1분 후에 다시 질문해 주세요! 🧘‍♂️' 
          : 'Whoa! Chekki needs a quick breather. Please wait a minute before asking again. 🧘‍♂️';
      } else if (error.message === 'GUEST_LIMIT_REACHED' || error.message === 'QUESTION_LIMIT_REACHED') {
        errorMsg = language === 'ko'
          ? '오늘의 질문 횟수를 모두 사용했습니다. 내일 다시 만나요! ⭐️'
          : "You've reached today's limit. See you again tomorrow! ⭐️";
      }
      
      setAskAnswer(errorMsg);
    } finally {
      // Add a slight cooldown to prevent accidental double-fire on button re-enable
      setTimeout(() => setIsAsking(false), 1500);
    }
  };

  const handleShare = async () => {
    setIsSharing(true);
    const title = worksheetTitle || (language === 'ko' ? "영어 학습지" : "English Worksheet");
    const shareData = {
      title: 'Chekki AI',
      text: language === 'ko' 
        ? `채키 AI로 오늘 '${title}' 공부 끝냈어요! ✨`
        : `Finished '${title}' with Chekki AI tonight! 🚀`,
      url: PUBLIC_APP_URL
    };

    try {
      let finalBase64Data = imageUrl.includes('base64,') ? imageUrl.split('base64,')[1] : null;

      try {
        const { generateCompositeImage } = await import('../utils/exportUtils');
        const compositeDataUrl = await generateCompositeImage(imageUrl, items);
        finalBase64Data = compositeDataUrl.split('base64,')[1];
      } catch (canvasErr) {
        console.error("Canvas composite failed, falling back to html-to-image", canvasErr);
        const node = document.getElementById('worksheet-overlay-capture');
        if (node) {
          try {
            // Lowering pixelRatio to 1 and quality to 0.85 significantly improves speed and memory usage on devices falling back to html-to-image
            const finalDataUrl = await toJpeg(node, { quality: 0.85, pixelRatio: 1, skipFonts: true });
            finalBase64Data = finalDataUrl.split('base64,')[1];
          } catch (captureErr) {
            console.error("Failed to capture image composite", captureErr);
          }
        }
      }

      const fallbackBase64 = imageUrl.includes('base64,') ? imageUrl.split('base64,')[1] : imageUrl;
      const dataToSave = finalBase64Data || fallbackBase64;

      if (Capacitor.isNativePlatform()) {
        const fileName = `chekki-share-${Date.now()}.jpg`;

        const savedFile = await Filesystem.writeFile({
          path: fileName,
          data: dataToSave,
          directory: Directory.Cache,
        });

        await Share.share({
          title: shareData.title,
          text: shareData.text,
          url: shareData.url,
          files: [savedFile.uri],
          dialogTitle: 'Share with Chekki AI',
        });
      } else if (navigator.share) {
        try {
          if (finalBase64Data) {
            const byteCharacters = atob(finalBase64Data);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
              byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: 'image/jpeg' });
            const file = new File([blob], `chekki-share-${Date.now()}.jpg`, { type: 'image/jpeg' });
            
            if (navigator.canShare && navigator.canShare({ files: [file] })) {
              await navigator.share({
                  ...shareData,
                  files: [file]
              });
              return;
            }
          }
          await navigator.share(shareData);
        } catch (e) {
          await navigator.share(shareData);
        }
      } else {
        setShareWebNotice(true);
        setTimeout(() => setShareWebNotice(false), 3000);
      }
    } catch (err) {
      console.error('Error sharing:', err);
    } finally {
      setIsSharing(false);
    }
  };


  const evaluateSpeechResult = (transcript: string, itemForCheck: WorksheetItem) => {
    const isMatch = compareSpeech(transcript, itemForCheck.correct_answer);

    if (isMatch) {
      setSpeechResult({ id: itemForCheck.id, success: true });
      if ('vibrate' in navigator) navigator.vibrate(50);
      const audio = new Audio(ASSETS.STAMP_SOUND);
      audio.play().catch(() => { });
    } else {
      setSpeechResult({ id: itemForCheck.id, success: false });
      if ('vibrate' in navigator) navigator.vibrate([30, 30, 30]);
    }
  };

  const startPronunciationCheck = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      openLoginModal();
      return;
    }
    const activeItem = items.find(i => i.id === activeItemId);
    if (!activeItem) return;

    if (isListening) {
      await stopPronunciationCheck();
      return;
    }

    // Native path: use @capgo/capacitor-speech-recognition
    if (Capacitor.isNativePlatform()) {
      try {
        const { available } = await SpeechRecognition.available();
        if (!available) {
          alert(language === 'ko' ? "이 기기에서 음성 인식을 사용할 수 없습니다." : "Speech recognition is not available on this device.");
          return;
        }

        const permStatus = await SpeechRecognition.requestPermissions();
        if (permStatus.speechRecognition !== 'granted') {
          alert(language === 'ko' ? "마이크 및 음성 인식 권한을 허용해주세요." : "Please allow microphone and speech recognition permissions.");
          return;
        }

        setSpeechResult(null);
        lastTranscriptRef.current = "";
        setIsListening(true);

        // Add listener for results
        if (nativeListenerRef.current) await nativeListenerRef.current.remove();
        nativeListenerRef.current = await SpeechRecognition.addListener('partialResults', (event) => {
          if (event.matches && event.matches.length > 0) {
            lastTranscriptRef.current = event.matches[0];
          }
        });

        // Add listener for automatic stop (silence detection)
        const endListener = await SpeechRecognition.addListener('listeningState', (event) => {
          if (event.status === 'stopped') {
            setIsListening(false);
            endListener.remove();
            if (nativeListenerRef.current) {
              nativeListenerRef.current.remove();
              nativeListenerRef.current = null;
            }
            if (lastTranscriptRef.current) {
              evaluateSpeechResult(lastTranscriptRef.current, activeItem);
            } else {
              setSpeechResult({ id: activeItem.id, success: false });
            }
          }
        });

        await SpeechRecognition.start({
          language: 'en-US',
          partialResults: true,
          maxResults: 1,
        });

      } catch (err: any) {
        console.error("Native speech recognition error:", err);
        setIsListening(false);
        if (nativeListenerRef.current) {
          await nativeListenerRef.current.remove();
          nativeListenerRef.current = null;
        }
        if (err?.message?.includes('denied') || err?.message?.includes('permission')) {
          alert(language === 'ko' ? "마이크 및 음성 인식 권한을 허용해주세요." : "Please allow microphone and speech recognition permissions in Settings.");
        }
      }
      return;
    }

    // Web fallback: use Web Speech API
    if (!recognitionRef.current) {
      alert(language === 'ko' ? "이 브라우저에서는 음성 인식을 지원하지 않습니다. Chrome을 이용해주세요." : "Speech recognition is not supported in this browser. Please use Chrome.");
      return;
    }
    
    setSpeechResult(null);
    setIsListening(true);
    
    try {
      recognitionRef.current.start();
    } catch (err: any) {
      console.warn("Speech recognition start failed:", err);
      if (err.name !== 'InvalidStateError') {
        setIsListening(false);
      }
    }
  };

  const handleActionClick = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      openLoginModal();
    } else {
      action();
    }
  };

  const handleRefineSubmit = async (itemId: number, reason: string) => {
    setIsRefining(true);
    try {
      const itemToRefine = localItems.find(i => i.id === itemId);
      if (!itemToRefine) return;
      
      const refinedData = await refineWorksheetItem(itemToRefine, reason, language);
      
      setLocalItems(prev => prev.map(i => i.id === itemId ? { ...i, ...refinedData } : i));
      setRefiningItemId(null);
    } catch (err) {
      alert(language === 'ko' ? "다듬기 실패했습니다. 다시 시도해주세요." : "Failed to refine. Please try again.");
    } finally {
      setIsRefining(false);
    }
  };

  return (
    <>
      {showCloneModal && <CloneWorksheetModal originalItems={localItems} onClose={() => setShowCloneModal(false)} />}
      {reportContext && <FeedbackModal context={reportContext} onClose={() => setReportContext(null)} />}
      <PremiumUpsellModal isOpen={upsellFeature !== null} onClose={() => setUpsellFeature(null)} featureName={upsellFeature || 'pronunciation'} />
      <AskChekkiAnswerModal 
        answer={askAnswer} 
        isAsking={isAsking} 
        question={askAnsweredQuestion}
        isAuthenticated={isAuthenticated}
        language={language}
        onClose={() => { setAskAnswer(null); setAskAnsweredQuestion(''); }}
        openLoginModal={openLoginModal}
      />
      {refiningItemId !== null && (
        <RefineModal 
          item={localItems.find(i => i.id === refiningItemId)!} 
          isOpen={true} 
          onClose={() => setRefiningItemId(null)} 
          onSubmit={handleRefineSubmit} 
          isSubmitting={isRefining} 
        />
      )}

      <div className="flex flex-col lg:flex-row gap-4 md:gap-8 h-[calc(100dvh-120px)] lg:h-[calc(100vh-280px)] min-h-[600px]">
        <div className="w-full lg:w-[50%] h-[35%] lg:h-full">
          <WorksheetOverlay
            imageUrl={imageUrl}
            items={localItems}
            focusedId={activeItemId}
            isLoadingItems={isLoadingItems}
          />
        </div>

        <div className="w-full lg:w-[45%] h-[70%] lg:h-full flex flex-col bg-zinc-950/40 rounded-[2.5rem] border border-white/5 overflow-hidden relative shadow-inner" onClick={() => setActiveItemId(null)}>
          <div className="px-5 py-4 border-b border-white/5 bg-zinc-900/40 backdrop-blur-xl flex flex-col shrink-0">
            <div className="flex justify-between items-center w-full">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-zinc-800 border border-white/5 flex items-center justify-center overflow-hidden shadow-xl">
                  {!mascotError ? <img src={ASSETS.MASCOT_HAPPY} alt="Chekki" className="w-full h-full object-contain scale-105" onError={() => setMascotError(true)} /> : <span className="text-xl">🎓</span>}
                </div>
                <div>
                  <h3 className="font-black text-white font-display text-lg leading-none mb-0.5">{t('ws_results_title')}</h3>
                  <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest leading-none mt-1">{isLoadingItems ? t('ws_scanning_header') : `${localItems.length} ${t('ws_items_found')}`}</p>
                </div>
              </div>
            </div>

            {!isLoadingItems && localItems.length > 0 && !hasInteracted && (
              <div className="mt-3 animate-fade-in-up">
                <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl px-4 py-2 flex items-center gap-3">
                  <span className="text-orange-500 text-sm animate-pulse">💡</span>
                  <p className="text-[10px] md:text-xs font-black text-orange-400 uppercase tracking-widest leading-tight">
                    {t('tip_click_guide')}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="px-5 py-4 shrink-0">
            <AskChekkiBar 
              query={askQuery} 
              setQuery={setAskQuery} 
              onSubmit={handleAskSubmit} 
              isAsking={isAsking} 
              language={language}
            />
          </div>

          <div className="overflow-y-auto p-4 md:p-6 space-y-4 custom-scrollbar flex-1 overscroll-contain bg-gradient-to-b from-transparent to-zinc-950/20">
            {isLoadingItems && localItems.length === 0 && (
              <div className="flex flex-col gap-4 pt-2 w-full">
                <div className="flex flex-col items-center justify-center space-y-3 pb-4">
                  <div className="w-6 h-6 border-2 border-white/10 border-t-orange-500 rounded-full animate-spin"></div>
                  <p className="text-[10px] md:text-xs font-bold text-zinc-500 font-korean uppercase tracking-widest">{t('ws_scanning_detail')}</p>
                </div>
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse flex items-start p-4 md:p-6 gap-4 bg-zinc-900/60 rounded-[1.8rem] border border-white/5 w-full">
                    <div className="w-10 h-10 rounded-xl bg-white/5 shrink-0"></div>
                    <div className="flex-1 space-y-4 py-1">
                      <div className="h-4 md:h-5 bg-white/5 rounded-md w-3/4"></div>
                      <div className="h-10 md:h-12 bg-white/5 rounded-2xl w-32 mt-4"></div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {localItems.map((item, idx) => {
              const isActive = activeItemId === item.id;
              const flagged = isMistake(item.question_text, item.correct_answer);
              const scriptText = language === 'ko' ? item.teaching_script_ko : (item.teaching_script_en || "");
              const guideText = language === 'ko' ? item.korean_guide : (item.english_guide || "");
              const answerText = item.correct_answer;
              const isFirstItem = idx === 0;

              return (
                <div key={item.id} ref={(el) => { itemRefs.current[item.id] = el; }} onClick={(e) => { e.stopPropagation(); setActiveItemId(item.id); }}
                  className={`group relative rounded-[1.8rem] border transition-all duration-300 cursor-pointer overflow-hidden animate-fade-in-up transform-gpu ${isActive ? 'bg-zinc-800/95 border-orange-500/50 shadow-[0_20px_60px_rgba(0,0,0,0.5)] scale-[1.01]' : 'bg-zinc-900/60 border-white/5 hover:border-white/20'}`}>

                  {isFirstItem && !hasInteracted && !isActive && (
                    <div className="absolute top-2 right-2 flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500 text-[10px] font-black text-white uppercase tracking-widest animate-bounce z-10 shadow-lg ring-2 ring-white/10">
                      <span>Tap here</span> 👆
                    </div>
                  )}

                  <div className="flex items-start p-4 md:p-6 gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs md:text-base font-black shrink-0 transition-all duration-300 ${isActive ? 'bg-orange-500 text-white shadow-lg' : 'bg-zinc-800 text-zinc-500'}`}>
                      {item.id}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className={`text-sm md:text-lg font-bold leading-relaxed mb-3 transition-colors break-keep ${isActive ? 'text-white' : 'text-zinc-400'}`}>
                        {item.question_text.replace(/^\d+[.)\s]+/, '')}
                      </h4>
                      
                      <div className="flex flex-col gap-4">
                        {/* Dynamic Visual Feedback for Speech Recognition */}
                        <div className={`relative rounded-2xl px-4 py-1.5 border min-w-[50%] w-max max-w-full shadow-inner transition-all duration-500 ease-in-out transform-gpu ${speechResult?.id === item.id ? (speechResult.success ? 'border-green-400 bg-green-500/20 shadow-[0_0_25px_rgba(34,197,94,0.3)] scale-110 z-10' : 'border-red-400 bg-red-500/20 translate-x-1 shadow-[0_0_15px_rgba(239,68,68,0.2)]') : 'bg-white/5 border-white/5'}`}>
                          <span className={`font-hand text-2xl md:text-3xl font-bold transition-colors duration-500 block break-words whitespace-normal break-keep ${speechResult?.id === item.id ? (speechResult.success ? 'text-green-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]' : 'text-red-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]') : 'text-emerald-400'}`}>
                            {answerText}
                          </span>
                          
                          {/* Success/Fail Achievement Stamps */}
                          {speechResult?.id === item.id && speechResult.success && (
                            <div className="absolute -top-4 -right-4 text-3xl animate-[bounce_1s_ease-in-out_infinite] drop-shadow-lg z-20">🌟</div>
                          )}
                          {speechResult?.id === item.id && !speechResult.success && (
                            <div className="absolute -top-3 -right-3 text-2xl animate-pulse drop-shadow-lg z-20">🤔</div>
                          )}
                        </div>

                        {/* Action Buttons Toolbar */}
                        <div className="flex flex-row items-center gap-1.5 bg-zinc-900/50 backdrop-blur-md p-1 rounded-full border border-white/5 w-fit shadow-xl group-hover:border-white/10 transition-all" onClick={(e) => e.stopPropagation()}>
                          <button 
                            onClick={(e) => { e.stopPropagation(); playAudio(answerText); }} 
                            className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${isActive ? 'bg-orange-500 text-white shadow-lg' : 'bg-white/5 text-zinc-400 hover:bg-zinc-700'} hover:scale-110 active:scale-95 min-w-[44px] min-h-[44px]`}
                            title={t('tt_audio')}
                            aria-label={language === 'ko' ? '오디오 듣기' : 'Play audio'}
                          >
                            <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77zm-3 0L5.5 8H1v8h4.5l6.5 4.77V3.23z" /></svg>
                          </button>
                          
                          <button 
                            onClick={(e) => handleActionClick(e, () => toggleMistake(item))} 
                            className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${flagged ? 'bg-red-500 text-white shadow-lg' : 'bg-white/5 text-zinc-400 hover:bg-zinc-700'} hover:scale-110 active:scale-95 min-w-[44px] min-h-[44px]`}
                            title={t('tt_bookmark')}
                            aria-label={language === 'ko' ? '즐겨찾기' : 'Bookmark'}
                          >
                            <svg className="w-5 h-5 flex-shrink-0" fill={flagged ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
                          </button>

                          {isActive && (
                            <button 
                              onClick={(e) => handleActionClick(e, () => {
                                if (user?.plan !== 'pro') {
                                  setShowPaywall(true);
                                } else {
                                  setRefiningItemId(item.id);
                                }
                              })} 
                              className="w-11 h-11 rounded-full flex items-center justify-center transition-all bg-white/5 text-orange-400 hover:bg-orange-500 hover:text-white shadow-lg focus:outline-none hover:scale-110 active:scale-95 min-w-[44px] min-h-[44px]"
                              title={t('tt_refine')}
                              aria-label={language === 'ko' ? '정답 다듬기' : 'Refine answer'}
                            >
                              <span className="text-xl flex-shrink-0">🪄</span>
                            </button>
                          )}

                          {isActive && (
                            <button 
                              onClick={(e) => { e.stopPropagation(); setActiveItemId(null); }}
                              className="w-11 h-11 rounded-full flex items-center justify-center transition-all bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white ring-1 ring-white/5 shadow-lg hover:scale-110 active:scale-95 min-w-[44px] min-h-[44px]"
                              title={t('tt_close')}
                              aria-label={language === 'ko' ? '닫기' : 'Close'}
                            >
                              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12"/></svg>
                            </button>
                          )}
                        </div>
                      </div>
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
                              <div className="bg-orange-500/10 border border-orange-500/20 rounded-3xl p-5 shadow-inner prose-answer">
                                <p className="text-[11px] font-black uppercase text-orange-500 mb-2 tracking-widest">{t('lbl_mom_tip')}</p>
                                <div 
                                  className="text-sm md:text-base text-zinc-200 font-korean leading-relaxed font-bold italic"
                                  dangerouslySetInnerHTML={{ __html: renderMarkdown(`&quot;${scriptText}&quot;`) }}
                                />
                              </div>
                              <div className="bg-zinc-950/40 border border-white/5 rounded-3xl p-5 shadow-inner prose-answer">
                                <p className="text-[11px] font-black uppercase text-zinc-500 mb-2 tracking-widest">Learning Guide</p>
                                <div 
                                  className="text-xs md:text-sm text-zinc-400 font-korean leading-relaxed break-keep"
                                  dangerouslySetInnerHTML={{ __html: renderMarkdown(guideText) }}
                                />
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

            {localItems.length > 0 && (
              <div className="pt-4 border-t border-white/5 mt-4">
                 <InlineFeedback />
              </div>
            )}
          </div>

          {/* Sticky Actions Footer */}
          {localItems.length > 0 && (
            <div className="shrink-0 bg-zinc-900/80 backdrop-blur-xl border-t border-white/5 px-4 py-4 md:px-6 md:py-5 flex flex-col gap-3 rounded-b-[2.5rem] z-10" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => { if (!isAuthenticated) openLoginModal(); else if (user?.plan !== 'pro') setShowPaywall(true); else setShowCloneModal(true); }}
                disabled={isLoadingItems}
                className="w-full py-4 md:py-5 rounded-[1.5rem] md:rounded-[2rem] bg-gradient-to-r from-orange-500 to-pink-500 text-white font-black text-sm md:text-base shadow-[0_10px_30px_rgba(249,115,22,0.3)] flex items-center justify-center gap-2 md:gap-3 transform transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 ring-1 md:ring-2 ring-white/10"
              >
                <span className="text-xl md:text-2xl">🪄</span>
                {isLoadingItems ? t('growing_text') : t('ws_gen_practice')}
              </button>

              <div className="flex gap-2 md:gap-3">
                <button
                  onClick={handleShare}
                  disabled={isSharing}
                  className="flex-[2] bg-zinc-800 hover:bg-zinc-700 border border-white/10 rounded-xl md:rounded-2xl py-3 md:py-4 flex items-center justify-center gap-1.5 md:gap-2 text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg disabled:opacity-50 text-white"
                >
                  {isSharing ? (
                    <div className="w-3.5 h-3.5 md:w-4 md:h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  ) : (
                    <><span className="text-sm md:text-base">📤</span> {language === 'ko' ? '결과 공유/저장' : 'Share/Save Results'}</>
                  )}
                </button>

                {onScanAgain && (
                  <button
                    onClick={onScanAgain}
                    className="flex-1 bg-zinc-800 hover:bg-zinc-700 border border-white/10 rounded-xl md:rounded-2xl py-3 md:py-4 px-3 md:px-4 flex items-center justify-center gap-2 text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg text-orange-400"
                    title={t('ws_scan_again')}
                  >
                    <span className="text-sm md:text-base">📸</span>
                    {language === 'ko' ? '재촬영' : 'Rescan'}
                  </button>
                )}
              </div>

              {shareWebNotice && (
                <p className="text-emerald-400 text-[8px] md:text-[9px] font-black text-center animate-fade-in uppercase tracking-wider absolute -top-6 left-1/2 -translate-x-1/2 bg-zinc-900/90 px-3 py-1 rounded-full border border-emerald-500/20 shadow-lg">
                  ✓ {language === 'ko' ? '클립보드에 복사되었어요!' : 'Copied to clipboard!'}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};
