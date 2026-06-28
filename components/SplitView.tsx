import React, { useMemo, useState, useRef, useEffect } from 'react';
import { useToast } from '../contexts/ToastContext';
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
import { normalizeText, compareSpeech, cleanAnswerText, sanitizeForEnglishSpeech } from '../utils/speechUtils';
import { refineWorksheetItem } from '../services/geminiService';
import { WorksheetItemCard } from './WorksheetItemCard';
import { AskChekkiBar, AskChekkiAnswerModal } from './AskChekkiBar';
import { askChekkiQuestion, ChatTurn } from '../services/geminiService';
import { Dashboard } from './Dashboard';

const simplifyGuideText = (text: string) => {
  if (!text) return text;
  return text
    .replace(/\s*\/[^/]+\/\s*/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

interface SplitViewProps {
  imageUrl: string;
  items: WorksheetItem[];
  isLoadingItems?: boolean;
  worksheetTitle?: string;
  onScanAgain?: () => void;
  onClose?: () => void;
  isNight?: boolean;
  onConfirm?: (options: {
    title: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
  }) => void;
  data?: any; // Simplified for now, should be WorksheetAnalysis | null
  onOpenDashboard?: () => void;
  isSpeedMode?: boolean;
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
  data,
  onOpenDashboard,
  isSpeedMode = false,
}) => {
  const { showToast } = useToast();
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
  const [upsellFeature, setUpsellFeature] = useState<'pronunciation' | 'audio' | 'guide' | null>(
    null
  );
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

  // Pronunciation States
  const [isListening, setIsListening] = useState(false);
  const [speechResult, setSpeechResult] = useState<{ id: number; success: boolean } | null>(null);
  const recognitionRef = useRef<any>(null);
  const nativeListenerRef = useRef<any>(null);
  const endListenerRef = useRef<any>(null);
  const lastAudioTextRef = useRef<string | null>(null);
  const lastTranscriptRef = useRef<string>('');

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
      setHasInteracted(true);

      // Smooth scroll the selected card container into view
      setTimeout(() => {
        itemRefs.current[activeItemId]?.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        });
      }, 100);
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

    const WebSpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (WebSpeechRecognition) {
      const recognition = new WebSpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        const activeItem = items.find((i) => i.id === activeItemId);
        if (activeItem) {
          evaluateSpeechResult(transcript, activeItem);
        }
        setIsListening(false);
      };

      recognition.onerror = (e: any) => {
        console.error('Speech Recognition Error', e);
        setIsListening(false);
        if (e.error === 'not-allowed') {
          showToast({ message: 'Microphone access was denied. Please check your browser settings.', type: 'error' });
        }
      };

      recognition.onend = () => setIsListening(false);
      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {
          console.error(e);
        }
        recognitionRef.current = null;
      }
      if (nativeListenerRef.current) {
        nativeListenerRef.current.remove().catch(() => {});
        nativeListenerRef.current = null;
      }
      if (endListenerRef.current) {
        endListenerRef.current.remove().catch(() => {});
        endListenerRef.current = null;
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
        if (endListenerRef.current) {
          await endListenerRef.current.remove();
          endListenerRef.current = null;
        }

        const activeItem = items.find((i) => i.id === activeItemId);
        if (activeItem && lastTranscriptRef.current) {
          evaluateSpeechResult(lastTranscriptRef.current, activeItem);
        } else if (activeItem && !speechResult) {
          // If stopped without any transcript, mark as failed
          setSpeechResult({ id: activeItem.id, success: false });
        }
      } catch (err) {
        console.error('Native speech recognition stop error:', err);
      } finally {
        setIsListening(false);
      }
    } else if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (err) {
        console.error(err);
      }
      setIsListening(false);
    }
  };

  const playAudio = (text: string) => {
    if (!isAuthenticated) {
      openLoginModal();
      return;
    }
    if ('speechSynthesis' in window) {
      const cleanText = sanitizeForEnglishSpeech(text);
      if (!cleanText) return;

      // Toggle logic: stop playing if clicking the same text
      if (window.speechSynthesis.speaking && lastAudioTextRef.current === cleanText) {
        window.speechSynthesis.cancel();
        lastAudioTextRef.current = null;
        return;
      }

      window.speechSynthesis.cancel();
      lastAudioTextRef.current = cleanText;

      const utterance = new SpeechSynthesisUtterance(cleanText);
      
      utterance.onend = () => {
        if (lastAudioTextRef.current === cleanText) {
          lastAudioTextRef.current = null;
        }
      };

      utterance.lang = 'en-US';
      utterance.rate = 0.85;
      
      // Attempt to select a premium/clearer voice if available
      const voices = window.speechSynthesis.getVoices();
      const preferredVoiceNames = ['Google US English', 'Samantha', 'Alex'];
      let selectedVoice = null;
      
      for (const name of preferredVoiceNames) {
        selectedVoice = voices.find((v) => v.name.includes(name));
        if (selectedVoice) break;
      }
      
      if (!selectedVoice) {
        selectedVoice = voices.find((v) => v.lang === 'en-US');
      }
      
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }

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
      setAskHistory((prev) => [
        ...prev,
        { role: 'user' as const, text: question },
        { role: 'model' as const, text: response },
      ]);
    } catch (error: any) {
      console.error('Ask Chekki error:', error.message);

      let errorMsg =
        language === 'ko'
          ? '오류가 발생했습니다. 다시 시도해주세요.'
          : 'Something went wrong. Please try again.';

      if (error.message === 'BURST_LIMIT_REACHED') {
        errorMsg =
          language === 'ko'
            ? '채키가 잠시 숨을 고르고 있어요. 1분 후에 다시 질문해 주세요! 🧘‍♂️'
            : 'Whoa! Chekki needs a quick breather. Please wait a minute before asking again. 🧘‍♂️';
      } else if (
        error.message === 'GUEST_LIMIT_REACHED' ||
        error.message === 'QUESTION_LIMIT_REACHED'
      ) {
        errorMsg =
          language === 'ko'
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
    const title = worksheetTitle || (language === 'ko' ? '영어 학습지' : 'English Worksheet');

    // Clean text for image sharing (no links as requested)
    const shareText =
      language === 'ko'
        ? `채키 AI로 오늘 '${title}' 공부 끝냈어요! ✨`
        : `Finished '${title}' with Chekki AI tonight! 🚀`;

    try {
      let finalBase64Data = imageUrl.includes('base64,') ? imageUrl.split('base64,')[1] : null;

      try {
        const { generateCompositeImage } = await import('../utils/exportUtils');
        const compositeDataUrl = await generateCompositeImage(imageUrl, items, language);
        finalBase64Data = compositeDataUrl.split('base64,')[1];
      } catch (canvasErr) {
        console.error('Canvas composite failed, falling back to html-to-image', canvasErr);
        const node = document.getElementById('worksheet-overlay-capture');
        if (node) {
          try {
            const finalDataUrl = await toJpeg(node, {
              quality: 0.85,
              pixelRatio: 1,
              skipFonts: true,
            });
            finalBase64Data = finalDataUrl.split('base64,')[1];
          } catch (captureErr) {
            console.error('Failed to capture image composite', captureErr);
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
      } else if (navigator.share && /Mobi|Android/i.test(navigator.userAgent)) {
        // Use native share on mobile web browsers where 'Save Image' is usually supported in the share sheet
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
                files: [file],
              });
              return;
            }
          }
          await navigator.share({ title: 'Chekki AI Result', text: shareText });
        } catch (e) {
          await navigator.share({ title: 'Chekki AI Result', text: shareText });
        }
      } else {
        // Desktop Web Fallback: direct download to avoid confusing share sheet without save option
        const link = document.createElement('a');
        link.href = `data:image/jpeg;base64,${dataToSave}`;
        link.download = `chekki-worksheet-${Date.now()}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
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
      text:
        language === 'ko'
          ? '학부모를 위한 AI 영어 유치원 숙제 도우미, 채키 AI를 만나보세요! ✨'
          : 'Discover Chekki AI, the AI assistant for English Kindergarten parents! 🚀',
      url: PUBLIC_APP_URL,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        navigator.clipboard.writeText(PUBLIC_APP_URL);
        showToast({ message: language === 'ko' ? '앱 링크가 복사되었습니다!' : 'App link copied!', type: 'success' });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const evaluateSpeechResult = (transcript: string, itemForCheck: WorksheetItem) => {
    const isMatch = compareSpeech(transcript, itemForCheck.correct_answer);

    if (isMatch) {
      setSpeechResult({ id: itemForCheck.id, success: true });
      if ('vibrate' in navigator) navigator.vibrate(50);
      const audio = new Audio(ASSETS.STAMP_SOUND);
      audio.play().catch(() => {});
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
    const activeItem = items.find((i) => i.id === activeItemId);
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
          showToast({ message: language === 'ko' ? '이 기기에서 음성 인식을 사용할 수 없습니다.' : 'Speech recognition is not available on this device.', type: 'error' });
          return;
        }

        const permStatus = await SpeechRecognition.requestPermissions();
        if (permStatus.speechRecognition !== 'granted') {
          showToast({ message: language === 'ko' ? '마이크 및 음성 인식 권한을 허용해주세요.' : 'Please allow microphone and speech recognition permissions.', type: 'error' });
          return;
        }

        setSpeechResult(null);
        lastTranscriptRef.current = '';
        setIsListening(true);

        // Add listener for results
        if (nativeListenerRef.current) await nativeListenerRef.current.remove();
        nativeListenerRef.current = await SpeechRecognition.addListener(
          'partialResults',
          (event) => {
            if (event.matches && event.matches.length > 0) {
              lastTranscriptRef.current = event.matches[0];
            }
          }
        );

        // Add listener for automatic stop (silence detection)
        if (endListenerRef.current) await endListenerRef.current.remove();
        endListenerRef.current = await SpeechRecognition.addListener('listeningState', (event) => {
          if (event.status === 'stopped') {
            setIsListening(false);
            if (endListenerRef.current) {
              endListenerRef.current.remove();
              endListenerRef.current = null;
            }
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
        console.error('Native speech recognition error:', err);
        setIsListening(false);
        if (nativeListenerRef.current) {
          await nativeListenerRef.current.remove();
          nativeListenerRef.current = null;
        }
        if (endListenerRef.current) {
          await endListenerRef.current.remove();
          endListenerRef.current = null;
        }
        if (err?.message?.includes('denied') || err?.message?.includes('permission')) {
          showToast({ message: language === 'ko' ? '마이크 및 음성 인식 권한을 허용해주세요.' : 'Please allow microphone and speech recognition permissions in Settings.', type: 'error' });
        }
      }
      return;
    }

    // Web fallback: use Web Speech API
    if (!recognitionRef.current) {
      showToast({ message: language === 'ko' ? '이 브라우저에서는 음성 인식을 지원하지 않습니다. Chrome을 이용해주세요.' : 'Speech recognition is not supported in this browser. Please use Chrome.', type: 'error' });
      return;
    }

    setSpeechResult(null);
    setIsListening(true);

    try {
      recognitionRef.current.start();
    } catch (err: any) {
      console.warn('Speech recognition start failed:', err);
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
      const itemToRefine = localItems.find((i) => i.id === itemId);
      if (!itemToRefine) return;

      const refinedData = await refineWorksheetItem(itemToRefine, reason, language);

      setLocalItems((prev) => prev.map((i) => (i.id === itemId ? { ...i, ...refinedData } : i)));
      setRefiningItemId(null);
    } catch (err) {
      showToast({ message: language === 'ko' ? '다듬기 실패했습니다. 다시 시도해주세요.' : 'Failed to refine. Please try again.', type: 'error' });
    } finally {
      setIsRefining(false);
    }
  };

  return (
    <>
      {showCloneModal && (
        <CloneWorksheetModal
          originalItems={localItems}
          onClose={() => setShowCloneModal(false)}
          isNight={isNight}
        />
      )}
      {reportContext && (
        <FeedbackModal
          context={reportContext}
          onClose={() => setReportContext(null)}
          isNight={isNight}
        />
      )}
      <PremiumUpsellModal
        isOpen={upsellFeature !== null}
        onClose={() => setUpsellFeature(null)}
        featureName={upsellFeature || 'pronunciation'}
        isNight={isNight}
      />
      <AskChekkiAnswerModal
        answer={askAnswer}
        isAsking={isAsking}
        question={askAnsweredQuestion}
        isAuthenticated={isAuthenticated}
        language={language}
        history={askHistory}
        onClose={() => {
          setAskAnswer(null);
          setAskAnsweredQuestion('');
          setAskHistory([]);
        }}
        openLoginModal={openLoginModal}
        onFollowUp={handleAskSubmit}
        isNight={isNight}
      />
      {refiningItemId !== null && (
        <RefineModal
          item={localItems.find((i) => i.id === refiningItemId)!}
          isOpen={true}
          onClose={() => setRefiningItemId(null)}
          onSubmit={handleRefineSubmit}
          isSubmitting={isRefining}
          isNight={isNight}
        />
      )}

      <div
        className={`flex flex-col lg:flex-row w-full ${isNight ? 'bg-[#030305]' : 'bg-white'} min-h-0`}
      >
        {/* Left side: Image (Scrolls with page on mobile, fixed height on desktop) */}
        <div
          className={`relative w-full lg:w-1/2 lg:sticky lg:top-0 lg:h-screen border-r ${isNight ? 'border-white/5 bg-zinc-950' : 'border-zinc-200 bg-white'} lg:overflow-hidden shrink-0`}
        >
          <WorksheetOverlay
            imageUrl={imageUrl}
            items={localItems}
            focusedId={activeItemId}
            isLoadingItems={isLoadingItems}
            isNight={isNight}
            onConfirm={onConfirm}
            onSelect={(id) => setActiveItemId(id)}
            hasHandwriting={data?.worksheet_summary?.has_handwriting}
            className="h-auto lg:h-full rounded-none"
          />
        </div>

        <div
          className={`w-full lg:w-1/2 min-w-0 flex flex-col ${isNight ? 'bg-[#111111]/80 border-white/10 shadow-black/80' : 'bg-white/80 border-zinc-200 shadow-zinc-300/50'} backdrop-blur-2xl rounded-[2.5rem] border lg:overflow-hidden relative lg:h-screen`}
          onClick={() => setActiveItemId(null)}
        >
          <div
            className={`px-4 py-3 border-b ${isNight ? 'border-white/5 bg-zinc-900/40' : 'border-zinc-100 bg-white/80'} flex flex-col shrink-0 transition-all`}
          >
            <div className="flex justify-between items-center w-full gap-4">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div
                  className={`w-8 h-8 rounded-lg ${isNight ? 'bg-zinc-800' : 'bg-zinc-100'} flex items-center justify-center shrink-0`}
                >
                  <span className="text-sm">✨</span>
                </div>
                <p
                  className={`text-[10px] font-black uppercase tracking-widest ${isNight ? 'text-zinc-400' : 'text-zinc-500'} truncate`}
                >
                  {isLoadingItems
                    ? t('ws_scanning_header')
                    : `${localItems.length} ${t('ws_items_found')}`}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  aria-label="Open Dashboard"
                  onClick={() => onOpenDashboard && onOpenDashboard()}
                  className={`h-12 px-5 rounded-full bg-orange-500 text-white hover:bg-orange-600 flex items-center justify-center font-black text-xs uppercase tracking-widest transition-all duration-200 active:scale-[0.98] group shadow-sm shrink-0`}
                  title={language === 'ko' ? '대시보드 열기' : 'Open Dashboard'}
                >
                  <span className="group-hover:scale-[1.02] transition-transform">DASH</span>
                </button>
                <button
                  aria-label="Share"
                  onClick={handleShare}
                  disabled={isSharing}
                  className={`w-12 h-12 rounded-full ${isNight ? 'bg-zinc-800 text-zinc-400 hover:text-white' : 'bg-zinc-100 text-zinc-500 hover:text-zinc-900'} flex items-center justify-center active:scale-[0.97] transition-transform duration-[160ms] ease-out border ${isNight ? 'border-white/5' : 'border-black/5'} group`}
                  title={language === 'ko' ? '기록 저장' : 'Save Image'}
                >
                  {isSharing ? (
                    <div className="w-4 h-4 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
                  ) : isShareSuccess ? (
                    <svg
                      className="w-5 h-5 md:w-6 md:h-6 text-emerald-500 animate-bounce"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      strokeWidth={3}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg
                      className="w-5 h-5 md:w-6 md:h-6 group-hover:scale-110 transition-transform"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      strokeWidth="2.5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                      />
                    </svg>
                  )}
                </button>
                <button
                  aria-label="Close"
                  onClick={onClose}
                  className={`w-12 h-12 rounded-full ${isNight ? 'bg-zinc-800 text-zinc-400 hover:text-white' : 'bg-zinc-100 text-zinc-500 hover:text-zinc-900'} flex items-center justify-center text-lg active:scale-[0.97] transition-transform duration-[160ms] ease-out border ${isNight ? 'border-white/5' : 'border-black/5'} group`}
                  title={t('tt_close')}
                >
                  <svg
                    className="w-5 h-5 md:w-6 md:h-6 group-hover:rotate-90 transition-transform duration-200"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth="2.5"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {!isLoadingItems && localItems.length > 0 && !hasInteracted && (
              <div className="mt-3 animate-fade-in-up">
                <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl px-4 py-2.5 flex items-center gap-3">
                  <span className="text-orange-500 text-sm animate-pulse shrink-0">💡</span>
                  <p className={`text-xs md:text-sm font-black ${isNight ? 'text-orange-400' : 'text-orange-600'} uppercase tracking-wide leading-relaxed pt-0.5 break-keep`}>
                    {t('tip_click_guide')}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div
            className={`p-4 md:p-6 pb-8 md:pb-12 space-y-4 w-full lg:flex-1 lg:min-h-0 lg:overflow-y-auto ${isNight ? 'bg-gradient-to-b from-transparent to-zinc-950/20' : 'bg-white'}`}
            style={
              { WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' } as React.CSSProperties
            }
            onClick={(e) => e.stopPropagation()}
          >
            {isLoadingItems && localItems.length === 0 && (
              <div className="flex flex-col gap-4 pt-2 w-full">
                <div className="flex flex-col items-center justify-center space-y-3 pb-4">
                  <div className="w-6 h-6 border-2 border-white/10 border-t-orange-500 rounded-full animate-spin"></div>
                  <p className="text-[10px] md:text-xs font-bold text-zinc-500 font-korean uppercase tracking-wide leading-normal break-keep">
                    {t('ws_scanning_detail')}
                  </p>
                </div>
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={`animate-pulse flex items-start p-4 md:p-6 gap-4 ${isNight ? 'bg-zinc-900/60 border-white/5' : 'bg-white border-zinc-100 shadow-sm'} rounded-2xl border w-full`}
                  >
                    <div
                      className={`w-10 h-10 rounded-xl ${isNight ? 'bg-white/5' : 'bg-zinc-100'} shrink-0`}
                    ></div>
                    <div className="flex-1 space-y-4 py-1">
                      <div className="h-4 md:h-5 bg-white/5 rounded-md w-3/4"></div>
                      <div className="h-10 md:h-12 bg-white/5 rounded-2xl w-32 mt-4"></div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {localItems.map((item, idx) => (
              <div
                key={item.id}
                ref={(el) => {
                  itemRefs.current[item.id] = el;
                }}
                className="w-full animate-item-appear"
                style={{ '--i': idx } as React.CSSProperties}
              >
                <WorksheetItemCard
                  index={idx}
                  item={item}
                  isActive={activeItemId === item.id}
                  isNight={isNight}
                  isSpeedMode={isSpeedMode}
                  language={language}
                  t={t}
                  flagged={isMistake(item.question_text, item.correct_answer)}
                  speechResult={speechResult}
                  scriptLanguages={scriptLanguages}
                  isAuthenticated={isAuthenticated}
                  userPlan={user?.plan}
                  isListening={isListening && activeItemId === item.id}
                  hasHandwriting={data?.worksheet_summary?.has_handwriting}
                  onToggleActive={() => setActiveItemId(activeItemId === item.id ? null : item.id)}
                  onPlayAudio={playAudio}
                  onToggleMistake={toggleMistake}
                  onRefine={(item) => setRefiningItemId(item.id)}
                  onStartPronunciation={startPronunciationCheck}
                  onSetScriptLanguage={(id, lang) =>
                    setScriptLanguages((prev) => ({ ...prev, [id]: lang }))
                  }
                  openLoginModal={openLoginModal}
                  setShowPaywall={setShowPaywall}
                  setUpsellFeature={setUpsellFeature}
                  style={{ animationDelay: `${idx * 80}ms`, animationFillMode: 'both' }}
                />
              </div>
            ))}

            {localItems.length > 0 && (
              <div className="pt-8 pb-6 border-t border-white/5 mt-4 space-y-6 animate-fade-in">
                
                {/* Heartfelt Message */}
                <div className="text-center px-4">
                  <p className={`text-sm md:text-base font-korean font-bold italic leading-relaxed ${isNight ? 'text-orange-300' : 'text-orange-500'}`}>
                    {language === 'ko'
                      ? '아무도 몰라줘도 채키는 알아요. 수고 많았어요, 엄마! 💌'
                      : 'If nobody noticed, Chekki will. Great job today, Mom. 💌'}
                  </p>
                </div>

                <div className="text-center">
                  <div className="flex justify-center">
                    <div
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-blue-500/20 bg-blue-500/5 backdrop-blur-sm cursor-help group relative"
                      title={t('zero_memory_desc')}
                    >
                      <span className="text-xs">🔒</span>
                      <span className="text-[9px] font-black text-blue-400 tracking-widest uppercase">
                        {t('zero_memory_policy')}
                      </span>

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

                <div className="flex flex-col gap-3">

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={onScanAgain}
                      className={`h-16 border rounded-full flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest active:scale-[0.97] transition-transform duration-[160ms] ease-out ${isNight ? 'bg-zinc-900 border-white/10 text-zinc-400 hover:text-white' : 'bg-white border-zinc-200 text-zinc-500 hover:text-zinc-800 shadow-sm'}`}
                    >
                      <span className="text-xl">📸</span>
                      {t('ws_scan_again')}
                    </button>
                    <button
                  aria-label="Share"
                  onClick={handleShare}
                  disabled={isSharing}
                      className={`h-16 border rounded-full flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest active:scale-[0.97] transition-transform duration-[160ms] ease-out ${isNight ? 'bg-zinc-800 border-white/10 text-zinc-300 hover:text-white' : 'bg-white border-zinc-200 text-zinc-500 hover:text-zinc-800'}`}
                    >
                      {isSharing ? (
                        <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <span className="text-xl">✨</span>{' '}
                          {language === 'ko' ? '기록 저장' : 'Save Image'}
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {isShareSuccess && (
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-3xl flex items-center gap-4 animate-pulse">
                    <span className="text-2xl">🎉</span>
                    <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest leading-relaxed">
                      {language === 'ko'
                        ? '기록이 성공적으로 저장되었습니다! ✨'
                        : 'Image saved to gallery! ✨'}
                    </p>
                  </div>
                )}

                <div className="pt-4 opacity-40">
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
