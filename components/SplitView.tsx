
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
import { askChekkiQuestion, ChatTurn } from '../services/geminiService';

const simplifyGuideText = (text: string) => {
  if (!text) return text;
  return text.replace(/\s*\/[^/]+\/\s*/g, ' ').replace(/\s+/g, ' ').trim();
};

interface SplitViewProps {
  imageUrl: string;
  items: WorksheetItem[];
  isLoadingItems?: boolean;
  worksheetTitle?: string;
  onScanAgain?: () => void;
  onClose?: () => void;
  isNight?: boolean;
  onConfirm?: (options: { title: string; confirmText?: string; cancelText?: string; onConfirm: () => void }) => void;
  data?: any; // Simplified for now, should be WorksheetAnalysis | null
}

export const SplitView: React.FC<SplitViewProps> = ({ 
  imageUrl, 
  items, 
  isLoadingItems = false, 
  worksheetTitle, 
  onScanAgain, 
  onClose,
  isNight = false,
  onConfirm,
  data
}) => {
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
  const [isShareSuccess, setIsShareSuccess] = useState(false);

  // Ask Chekki States
  const [askQuery, setAskQuery] = useState('');
  const [askAnswer, setAskAnswer] = useState<string | null>(null);
  const [askAnsweredQuestion, setAskAnsweredQuestion] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const [askHistory, setAskHistory] = useState<ChatTurn[]>([]);
  const [scriptLanguages, setScriptLanguages] = useState<Record<number, 'en' | 'ko'>>({});

  // Swipe States
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const minSwipeDistance = 50;

  // Pronunciation States
  const [isListening, setIsListening] = useState(false);
  const [speechResult, setSpeechResult] = useState<{ id: number; success: boolean } | null>(null);
  const recognitionRef = useRef<any>(null);
  const nativeListenerRef = useRef<any>(null);
  const lastTranscriptRef = useRef<string>("");

  const itemRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});

  useEffect(() => {
    if (items.length > 0 && isLoadingItems === false) {
      // Haptic feedback on scan success
      if ('vibrate' in navigator) navigator.vibrate([10, 30, 10]);
    }
    setLocalItems(items);
  }, [items, isLoadingItems]);

  useEffect(() => {
    if (activeItemId !== null) {
      if (itemRefs.current[activeItemId]) {
        itemRefs.current[activeItemId]?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }
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

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe || isRightSwipe) {
      const currentIndex = localItems.findIndex(i => i.id === activeItemId);
      if (currentIndex === -1) return;

      const nextIndex = isLeftSwipe ? currentIndex + 1 : currentIndex - 1;
      if (nextIndex >= 0 && nextIndex < localItems.length) {
        setActiveItemId(localItems[nextIndex].id);
        if ('vibrate' in navigator) navigator.vibrate(5);
      }
    }
  };

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
  }, [items]); // Only rebuild when items change, NOT on every active card tap

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
    
    const isFollowUp = askHistory.length > 0;
    
    // Only clear history if it's a completely fresh question from the top bar.
    // This allows the follow-up logic to keep context visible while "thinking".
    if (!isFollowUp) {
      setAskAnswer(null);
      setAskHistory([]);
    }
    
    setAskAnsweredQuestion(question);
    setIsAsking(true);
    
    try {
      const isGuest = !isAuthenticated;
      // Pass history along with the new question
      const response = await askChekkiQuestion(question, language, isGuest, undefined, askHistory);
      
      setAskAnswer(response);
      // Update history: add BOTH the question and the response
      setAskHistory(prev => [
        ...prev, 
        { role: 'user' as const, text: question },
        { role: 'model' as const, text: response }
      ]);
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
      setTimeout(() => setIsAsking(false), 500);
    }
  };

  const handleShare = async () => {
    setIsSharing(true);
    const title = worksheetTitle || (language === 'ko' ? "영어 학습지" : "English Worksheet");
    
    // Clean text for image sharing (no links as requested)
    const shareText = language === 'ko' 
      ? `채키 AI로 오늘 '${title}' 공부 끝냈어요! ✨`
      : `Finished '${title}' with Chekki AI tonight! 🚀`;

    try {
      let finalBase64Data = imageUrl.includes('base64,') ? imageUrl.split('base64,')[1] : null;

      try {
        const { generateCompositeImage } = await import('../utils/exportUtils');
        const compositeDataUrl = await generateCompositeImage(imageUrl, items, language);
        finalBase64Data = compositeDataUrl.split('base64,')[1];
      } catch (canvasErr) {
        console.error("Canvas composite failed, falling back to html-to-image", canvasErr);
        const node = document.getElementById('worksheet-overlay-capture');
        if (node) {
          try {
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
          title: 'Chekki AI Result',
          text: shareText,
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
                  title: 'Chekki AI Result',
                  text: shareText,
                  files: [file]
              });
              return;
            }
          }
          await navigator.share({ title: 'Chekki AI Result', text: shareText });
        } catch (e) {
          await navigator.share({ title: 'Chekki AI Result', text: shareText });
        }
      } else {
        setShareWebNotice(true);
        setTimeout(() => setShareWebNotice(false), 3000);
      }
    } catch (err) {
      console.error('Error sharing:', err);
    } finally {
      setIsSharing(false);
      setIsShareSuccess(true);
      setTimeout(() => setIsShareSuccess(false), 4000);
    }
  };

  const handleShareApp = async () => {
    const shareData = {
      title: 'Chekki AI',
      text: language === 'ko' 
        ? "학부모를 위한 AI 영어 유치원 숙제 도우미, 채키 AI를 만나보세요! ✨"
        : "Discover Chekki AI, the AI assistant for English Kindergarten parents! 🚀",
      url: PUBLIC_APP_URL
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        navigator.clipboard.writeText(PUBLIC_APP_URL);
        alert(language === 'ko' ? "앱 링크가 복사되었습니다!" : "App link copied!");
      }
    } catch (err) { console.error(err); }
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
      {showCloneModal && <CloneWorksheetModal originalItems={localItems} onClose={() => setShowCloneModal(false)} isNight={isNight} />}
      {reportContext && <FeedbackModal context={reportContext} onClose={() => setReportContext(null)} isNight={isNight} />}
      <PremiumUpsellModal isOpen={upsellFeature !== null} onClose={() => setUpsellFeature(null)} featureName={upsellFeature || 'pronunciation'} />
      <AskChekkiAnswerModal 
        answer={askAnswer} 
        isAsking={isAsking} 
        question={askAnsweredQuestion}
        isAuthenticated={isAuthenticated}
        language={language}
        history={askHistory}
        onClose={() => { setAskAnswer(null); setAskAnsweredQuestion(''); setAskHistory([]); }}
        openLoginModal={openLoginModal}
        onFollowUp={handleAskSubmit}
      />
      {refiningItemId !== null && (
        <RefineModal 
          item={localItems.find(i => i.id === refiningItemId)!} 
          isOpen={true} 
          onClose={() => setRefiningItemId(null)} 
          onSubmit={handleRefineSubmit} 
          isSubmitting={isRefining} 
          isNight={isNight}
        />
      )}

      <div className={`flex flex-col lg:flex-row h-full w-full ${isNight ? 'bg-[#030305]' : 'bg-white'}`}>
      
      {/* Left side: Image (Fixed/Overlay) */}
      <div className={`relative w-full lg:w-1/2 h-[50vh] lg:h-full border-r ${isNight ? 'border-white/5 bg-zinc-950' : 'border-zinc-200 bg-white'} overflow-hidden shrink-0`}>
          <WorksheetOverlay
            imageUrl={imageUrl}
            items={localItems}
            focusedId={activeItemId}
            isLoadingItems={isLoadingItems}
            isNight={isNight}
            onConfirm={onConfirm}
            className="h-full rounded-none lg:rounded-none"
          />
        </div>
        


        <div className={`w-full lg:w-[45%] h-[70%] lg:h-full flex flex-col ${isNight ? 'bg-zinc-950/40 border-white/5' : 'bg-white border-transparent'} rounded-[2.5rem] md:rounded-[3.5rem] border overflow-hidden relative`} onClick={() => setActiveItemId(null)}>
          <div 
            className={`px-5 py-5 border-b ${isNight ? 'border-white/5 bg-zinc-900/40' : 'border-zinc-100 bg-white/80'} backdrop-blur-xl flex flex-col shrink-0 transition-all`}
          >
            <div className="flex justify-between items-center w-full">
              <div className="flex items-center gap-3 md:gap-4">
                <div className={`w-11 h-11 md:w-14 md:h-14 rounded-2xl ${isNight ? 'bg-zinc-800' : 'bg-zinc-100'} border ${isNight ? 'border-white/5' : 'border-black/5'} flex items-center justify-center overflow-hidden shadow-xl transition-transform`}>
                  <span className="text-xl">✨</span>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className={`font-black ${isNight ? 'text-white' : 'text-zinc-900'} font-display text-lg md:text-xl leading-none`}>{t('ws_results_title')}</h3>
                    {(data?.worksheet_summary as any)?.worksheet_type && (
                      <span className="px-2 py-0.5 rounded-md bg-orange-500/20 text-orange-500 text-[8px] font-black uppercase tracking-widest border border-orange-500/30">
                        {(data?.worksheet_summary as any).worksheet_type}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span>
                    <p className={`text-[9px] md:text-xs ${isNight ? 'text-zinc-400' : 'text-zinc-500'} font-black uppercase tracking-widest leading-none mt-1`}>{isLoadingItems ? t('ws_scanning_header') : `${localItems.length} ${t('ws_items_found')}`}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {!isLoadingItems && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      const text = `I just used Chekki AI to analyze my child's homework! Found ${localItems.length} questions ✨\n\n#ChekkiAI #Education #MomLife`;
                      if (navigator.share) {
                        navigator.share({ title: 'Chekki AI Result', text, url: window.location.href }).catch(() => {});
                      } else {
                        navigator.clipboard.writeText(text);
                        alert("Copied to clipboard!");
                      }
                    }}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${isNight ? 'bg-orange-500/10 border-orange-500/20 text-orange-500 hover:bg-orange-500/20' : 'bg-orange-50 border-orange-200 text-orange-600 hover:bg-orange-100'} transition-all active:scale-95 text-[9px] font-black uppercase tracking-widest shadow-lg shadow-orange-500/10`}
                  >
                    <span>✨</span> {language === 'ko' ? '공유' : 'Share'}
                  </button>
                )}

                <button 
                  onClick={onClose} 
                  className={`w-10 h-10 md:w-12 md:h-12 rounded-xl ${isNight ? 'bg-zinc-800 text-zinc-400 hover:text-white' : 'bg-zinc-100 text-zinc-500 hover:text-zinc-900'} flex items-center justify-center text-lg transition-all active:scale-90 border ${isNight ? 'border-white/5' : 'border-black/5'}`}
                >✕</button>
              </div>
            </div>

            {!isLoadingItems && localItems.length > 0 && !hasInteracted && (
              <div className="mt-3 animate-fade-in-up">
                <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl px-4 py-2 flex items-center gap-3">
                  <span className="text-orange-500 text-sm animate-pulse">💡</span>
                  <p className="text-xs md:text-sm font-black text-orange-400 uppercase tracking-widest leading-tight">
                    {t('tip_click_guide')}
                  </p>
                </div>
              </div>
            )}
          </div>


          <div
            className={`overflow-y-auto p-4 md:p-6 space-y-4 flex-1 overscroll-contain ${isNight ? 'bg-gradient-to-b from-transparent to-zinc-950/20' : 'bg-white'}`}
            style={{ WebkitOverflowScrolling: 'touch', willChange: 'scroll-position' } as React.CSSProperties}
            onClick={(e) => e.stopPropagation()}>
            {isLoadingItems && localItems.length === 0 && (
              <div className="flex flex-col gap-4 pt-2 w-full">
                <div className="flex flex-col items-center justify-center space-y-3 pb-4">
                  <div className="w-6 h-6 border-2 border-white/10 border-t-orange-500 rounded-full animate-spin"></div>
                  <p className="text-[10px] md:text-xs font-bold text-zinc-500 font-korean uppercase tracking-widest">{t('ws_scanning_detail')}</p>
                </div>
                {[1, 2, 3].map((i) => (
                  <div key={i} className={`animate-pulse flex items-start p-4 md:p-6 gap-4 ${isNight ? 'bg-zinc-900/60 border-white/5' : 'bg-white border-zinc-100 shadow-sm'} rounded-[1.8rem] border w-full`}>
                    <div className={`w-10 h-10 rounded-xl ${isNight ? 'bg-white/5' : 'bg-zinc-100'} shrink-0`}></div>
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
                  <div 
                    key={item.id} 
                    ref={(el) => { itemRefs.current[item.id] = el; }} 
                    onClick={(e) => { e.stopPropagation(); setActiveItemId(isActive ? null : item.id); }}
                    onTouchStart={isActive ? handleTouchStart : undefined}
                    onTouchMove={isActive ? handleTouchMove : undefined}
                    onTouchEnd={isActive ? handleTouchEnd : undefined}
                    className={`group relative rounded-[2rem] md:rounded-[2.5rem] border cursor-pointer overflow-hidden animate-fade-in-up transform-gpu transition-[border-color,box-shadow,transform] duration-300 ${isActive ? (isNight ? 'bg-zinc-900 border-orange-500/50 shadow-2xl scale-[1.01]' : 'bg-white border-orange-500 shadow-2xl scale-[1.01]') : (isNight ? 'bg-zinc-900/60 border-transparent hover:border-white/10' : 'bg-white border-transparent hover:border-zinc-200 shadow-[0_10px_30px_rgba(0,0,0,0.02)] hover:shadow-lg')}`}
                  >

                  {/* Removed 'Tap here' pill as requested */}

                  <div className="p-4 md:p-8 flex items-start gap-4 md:gap-8">
                    <div className={`w-8 h-8 md:w-12 md:h-12 rounded-xl md:rounded-[1.2rem] flex items-center justify-center shrink-0 transition-all duration-500 ${isActive ? 'bg-orange-500 text-white shadow-lg rotate-3' : (isNight ? 'bg-zinc-800 text-zinc-500' : 'bg-zinc-100 text-zinc-400')}`}>
                      <span className="text-xs md:text-xl font-black font-display">{item.id}</span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className={`text-sm md:text-lg font-bold leading-relaxed mb-3 transition-colors break-keep ${isActive ? (isNight ? 'text-white' : 'text-zinc-900') : (isNight ? 'text-zinc-500' : 'text-zinc-600')}`}>
                         {item.question_text.replace(/^\d+[.)\s]+/, '')}
                      </h4>
                      
                      <div className="flex flex-col gap-4">
                        <div className={`flex flex-col items-start gap-1`}>
                            <div className={`relative px-0 py-1 transition-all duration-500 ease-in-out transform-gpu ${speechResult?.id === item.id ? (speechResult.success ? 'scale-110 z-10' : 'translate-x-1') : ''}`}>
                             <span className={`font-hand text-3xl md:text-5xl font-bold transition-colors duration-500 block break-words whitespace-normal break-keep ${speechResult?.id === item.id ? (speechResult.success ? 'text-green-300 drop-shadow-[0_2px_8px_rgba(34,197,94,0.5)]' : 'text-red-300 drop-shadow-[0_2px_8px_rgba(239,68,68,0.5)]') : (isNight ? 'text-emerald-400' : 'text-emerald-600')}`}>
                                {answerText}
                              </span>
                              {isActive && (
                                <div className="absolute -top-1 -right-4 flex items-center gap-1">
                                  <div className={`w-2 h-2 rounded-full ${item.confidence_score && item.confidence_score < 0.7 ? 'bg-amber-500 animate-pulse' : 'bg-green-500'}`} title={item.confidence_score && item.confidence_score < 0.7 ? 'Double check this' : 'High confidence'}></div>
                                </div>
                              )}
                            {speechResult?.id === item.id && speechResult.success && <div className="absolute -top-4 -right-4 text-3xl animate-[bounce_1s_ease-in-out_infinite] drop-shadow-lg z-20">🌟</div>}
                          </div>
                          
                          {/* Teaching Tips Hint Arrow */}
                          {!isActive && (
                            <div className="flex items-center gap-1.5 ml-1 animate-pulse">
                              <span className="text-[7px] font-black uppercase text-orange-500 tracking-[0.1em] opacity-70">
                                {language === 'ko' ? '티칭 팁 보기' : 'Teaching Tips'}
                              </span>
                              <svg className="w-2.5 h-2.5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                              </svg>
                            </div>
                          )}
                        </div>

                        {/* Action Icons — only show when active to keep collapsed cards clean */}
                        {isActive && (
                         <div className="flex items-center gap-4 py-4 px-0 transition-all duration-300 w-full max-w-sm animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
                           <div className="flex flex-col items-center gap-1.5 group/btn">
                             <button 
                               onClick={(e) => { e.stopPropagation(); playAudio(answerText); }} 
                               className="w-11 h-11 md:w-12 md:h-12 flex items-center justify-center transition-all text-orange-500 hover:scale-110 active:scale-95 group-hover/btn:rotate-6"
                               title={t('tt_audio')}
                             >
                               <svg className="w-5 h-5 md:w-6 md:h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77zm-3 0L5.5 8H1v8h4.5l6.5 4.77V3.23z" /></svg>
                             </button>
                             <span className="text-[7px] md:text-[9px] font-black uppercase text-orange-500 tracking-widest opacity-80 leading-none h-4 flex items-center text-center">{t('lbl_audio')}</span>
                           </div>

                           <div className="flex flex-col items-center gap-1.5 group/btn">
                             <button 
                               onClick={(e) => handleActionClick(e, () => toggleMistake(item))} 
                               className={`w-11 h-11 md:w-12 md:h-12 flex items-center justify-center transition-all ${flagged ? 'text-red-500' : (isNight ? 'text-zinc-500 hover:text-zinc-300' : 'text-zinc-400 hover:text-zinc-600')} hover:scale-110 active:scale-95 group-hover/btn:scale-110`}
                               title={t('tt_bookmark')}
                             >
                               <svg className="w-5 h-5 md:w-6 md:h-6" fill={flagged ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
                             </button>
                             <span className={`text-[7px] md:text-[9px] font-black uppercase tracking-widest opacity-80 leading-none h-4 flex items-center text-center ${flagged ? 'text-red-400' : (isNight ? 'text-zinc-500' : 'text-zinc-400')}`}>{t('lbl_bookmark')}</span>
                           </div>

                           <div className="flex flex-col items-center gap-1.5 group/btn">
                             <button 
                               onClick={(e) => {
                                 e.stopPropagation();
                                 const textToCopy = `${language === 'ko' ? '가이드' : 'Guide'}: ${guideText}\n\n${language === 'ko' ? '티칭 팁' : 'Teaching Tip'}: "${scriptText}"`;
                                 navigator.clipboard.writeText(textToCopy);
                                 const btn = e.currentTarget;
                                 const originalText = btn.title;
                                 btn.title = t('script_copied');
                                 setTimeout(() => { btn.title = originalText; }, 2000);
                               }} 
                               className={`w-11 h-11 md:w-12 md:h-12 flex items-center justify-center transition-all ${isNight ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-500'} group-hover/btn:-rotate-6`}
                               title={t('copy_script')}
                             >
                               <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                             </button>
                             <span className={`text-[7px] md:text-[9px] font-black uppercase ${isNight ? 'text-zinc-500' : 'text-zinc-400'} tracking-widest opacity-80 leading-none h-4 flex items-center text-center`}>{language === 'ko' ? '복사' : 'Copy'}</span>
                           </div>

                           <div className="flex flex-col items-center gap-1.5 group/btn">
                             <button 
                               onClick={(e) => handleActionClick(e, () => {
                                 if (user?.plan !== 'pro') setShowPaywall(true);
                                 else setRefiningItemId(item.id);
                               })} 
                               className={`w-11 h-11 md:w-12 md:h-12 flex items-center justify-center transition-all ${isNight ? 'text-orange-400 hover:text-orange-300' : 'text-orange-600 hover:text-orange-500'} group-hover/btn:scale-110`}
                               title={t('tt_refine')}
                             >
                               <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                             </button>
                             <span className={`text-[7px] md:text-[9px] font-black uppercase ${isNight ? 'text-zinc-500' : 'text-zinc-400'} tracking-widest opacity-80 leading-none h-4 flex items-center text-center`}>{language === 'ko' ? '다듬기' : 'Refine'}</span>
                           </div>
                        </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {isActive && (
                    <div className="px-4 pb-6 md:px-10 md:pb-10 animate-fade-in-up space-y-6">
                      {!isAuthenticated ? (
                        <div className="bg-orange-500/10 border border-orange-500/30 rounded-3xl p-6 text-center space-y-4">
                          <p className={`text-sm font-bold ${isNight ? 'text-white' : 'text-zinc-900'} font-korean leading-relaxed`}>{language === 'ko' ? "다정한 티칭 스크립트와 가이드를 보려면 로그인이 필요해요!" : "Log in to unlock the full teaching scripts and guides!"}</p>
                          <button onClick={openLoginModal} className="bg-white text-black px-8 py-3 rounded-2xl font-black text-sm uppercase shadow-xl w-full">{language === 'ko' ? "지금 로그인하기" : "Log In Now"}</button>
                        </div>
                      ) : (
                        <>
                          <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-3xl p-5 flex items-center gap-5">
                            <button
                              onClick={startPronunciationCheck}
                              className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center transition-all ${isListening ? 'bg-red-500 animate-pulse' : 'bg-indigo-600'} text-white shadow-lg`}
                            >
                              {isListening ? (
                                <div className="flex items-center gap-1.5"><div className="w-1.5 h-6 bg-white rounded-full animate-mic-wave"></div><div className="w-1.5 h-8 bg-white rounded-full animate-mic-wave delay-75"></div><div className="w-1.5 h-6 bg-white rounded-full animate-mic-wave delay-150"></div></div>
                              ) : (
                                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" /><path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" /></svg>
                              )}
                            </button>
                            <div className="flex-1">
                              <p className={`text-xs ${isNight ? 'text-white' : 'text-zinc-900'} font-black uppercase tracking-widest`}>{isListening ? (language === 'ko' ? "듣고 있어요..." : "Listening...") : `${language === 'ko' ? '질문' : 'Question'} ${item.id} - Coach`}</p>
                              <p className="text-[10px] text-indigo-300/80 font-bold">{isListening ? (language === 'ko' ? "아이의 목소리를 분석 중입니다" : "Analyzing child's voice...") : (language === 'ko' ? "버튼을 누르고 발음해보세요!" : "Tap to speak and check pronunciation!")}</p>
                            </div>
                          </div>
                          {user?.plan === 'pro' ? (
                            <>
                              <div className={`${isNight ? 'bg-orange-500/10 border-orange-500/20 shadow-inner' : 'bg-orange-50/80 border-orange-200 shadow-sm'} border rounded-3xl p-5 relative`}>
                                <div className="flex justify-between items-center mb-2">
                                  <p className="text-[10px] font-black uppercase text-orange-500 tracking-widest">{t('lbl_mom_tip')}</p>
                                  <div className="flex bg-zinc-800/50 rounded-lg p-0.5 border border-white/5">
                                    <button 
                                      onClick={(e) => { e.stopPropagation(); setScriptLanguages(prev => ({ ...prev, [item.id]: 'ko' })); }}
                                      className={`px-2 py-0.5 rounded-md text-[8px] font-black transition-all ${(!scriptLanguages[item.id] ? language === 'ko' : scriptLanguages[item.id] === 'ko') ? 'bg-orange-500 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
                                    >KO</button>
                                    <button 
                                      onClick={(e) => { e.stopPropagation(); setScriptLanguages(prev => ({ ...prev, [item.id]: 'en' })); }}
                                      className={`px-2 py-0.5 rounded-md text-[8px] font-black transition-all ${(!scriptLanguages[item.id] ? language === 'en' : scriptLanguages[item.id] === 'en') ? 'bg-orange-500 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
                                    >EN</button>
                                  </div>
                                </div>
                                <div className={`text-base md:text-lg ${isNight ? 'text-zinc-200' : 'text-zinc-800'} font-korean leading-relaxed font-medium italic`} dangerouslySetInnerHTML={{ __html: renderMarkdown(`&quot;${(!scriptLanguages[item.id] ? (language === 'ko' ? item.teaching_script_ko : item.teaching_script_en) : (scriptLanguages[item.id] === 'ko' ? item.teaching_script_ko : item.teaching_script_en)) || ""}&quot;`) }} />
                              </div>
                              <div className={`${isNight ? 'bg-zinc-950/40 border-white/5' : 'bg-zinc-100 border-zinc-200'} border rounded-3xl p-5`}>
                                <p className="text-[10px] font-black uppercase text-zinc-500 mb-2 tracking-widest">Guide</p>
                                <div className={`text-sm md:text-base ${isNight ? 'text-zinc-400' : 'text-zinc-600'} font-korean leading-relaxed break-keep`} dangerouslySetInnerHTML={{ __html: renderMarkdown(simplifyGuideText((!scriptLanguages[item.id] ? (language === 'ko' ? item.korean_guide : item.english_guide) : (scriptLanguages[item.id] === 'ko' ? item.korean_guide : item.english_guide)) || "")) }} />
                              </div>
                            </>
                          ) : (
                            <button onClick={() => setUpsellFeature('guide')} className="bg-gradient-to-r from-orange-500/10 to-pink-500/10 border border-orange-500/20 rounded-3xl p-5 text-center w-full">
                              <p className="text-[10px] font-black uppercase text-orange-500 mb-2 tracking-widest">🔒 Premium</p>
                              <p className={`text-sm ${isNight ? 'text-zinc-300' : 'text-zinc-600'} font-korean font-bold`}>{language === 'ko' ? '티칭 가이드와 스크립트를 보려면 업그레이드하세요' : 'Upgrade to unlock Guide & Script'}</p>
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
              <div className="pt-12 pb-10 border-t border-white/5 mt-8 space-y-8 animate-fade-in">
                <div className="text-center space-y-3">
                  <div className="flex justify-center mb-4">
                    <div 
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-blue-500/20 bg-blue-500/5 backdrop-blur-sm cursor-help group relative"
                      title={t('zero_memory_desc')}
                    >
                      <span className="text-xs">🔒</span>
                      <span className="text-[9px] font-black text-blue-400 tracking-widest uppercase">{t('zero_memory_policy')}</span>
                      
                      {/* Tooltip Overlay */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-64 p-4 bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all z-[100] transform translate-y-2 group-hover:translate-y-0">
                        <p className="text-[10px] text-zinc-300 font-bold leading-relaxed normal-case tracking-normal text-left">
                          {t('zero_memory_desc')}
                        </p>
                        <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-zinc-900 border-r border-b border-white/10 rotate-45"></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  <button
                    onClick={() => { if (!isAuthenticated) openLoginModal(); else if (user?.plan !== 'pro') setShowPaywall(true); else setShowCloneModal(true); }}
                    disabled={isLoadingItems}
                    className="w-full h-16 rounded-full bg-gradient-to-r from-orange-500 to-pink-500 text-white font-black text-lg shadow-[0_20px_50px_rgba(249,115,22,0.3)] flex items-center justify-center gap-3 active:scale-95 transition-all"
                  >
                    <span className="text-2xl">🪄</span>
                    {isLoadingItems ? t('growing_text') : t('ws_gen_practice')}
                  </button>

                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={onScanAgain}
                      className={`h-16 border rounded-full flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 ${isNight ? 'bg-zinc-900 border-white/10 text-zinc-400 hover:text-white' : 'bg-white border-zinc-200 text-zinc-500 hover:text-zinc-800 shadow-sm'}`}
                    >
                      <span className="text-xl">📸</span>
                      {t('ws_scan_again')}
                    </button>
                    <button
                      onClick={handleShare}
                      disabled={isSharing}
                      className={`h-16 border rounded-full flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 ${isNight ? 'bg-zinc-800 border-white/10 text-zinc-300 hover:text-white' : 'bg-zinc-100 border-zinc-200 text-zinc-500 hover:text-zinc-800'}`}
                    >
                      {isSharing ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <><span className="text-xl">✨</span> {language === 'ko' ? '기록 저장' : 'Save Image'}</>}
                    </button>
                  </div>

                  <button
                    onClick={handleShareApp}
                    className={`w-full h-14 rounded-full border flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 ${isNight ? 'bg-zinc-800 border-white/5 text-zinc-400 hover:text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-500 hover:text-zinc-800'}`}
                  >
                    <span className="text-lg">📢</span>
                    {t('share_app')}
                  </button>
                </div>

                {isShareSuccess && (
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-3xl flex items-center gap-4 animate-bounce">
                    <span className="text-2xl">🎉</span>
                    <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest leading-relaxed">
                      {language === 'ko' ? '기록이 성공적으로 저장되었습니다! ✨' : 'Ritual Success! Image saved to gallery. ✨'}
                    </p>
                  </div>
                )}
                
                <div className="pt-8 opacity-40">
                  <InlineFeedback />
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  );
};
