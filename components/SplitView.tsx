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
import {
  normalizeText,
  compareSpeech,
  cleanAnswerText,
  sanitizeForEnglishSpeech,
} from '../utils/speechUtils';
import { refineWorksheetItem } from '../services/geminiService';
import { WorksheetItemCard } from './WorksheetItemCard';
import { AskChekkiBar, AskChekkiAnswerModal } from './AskChekkiBar';
import { askChekkiQuestion, ChatTurn } from '../services/geminiService';
import { Dashboard } from './Dashboard';
import { ArrowLeft, ArrowRight, Camera, Check, DownloadSimple, NotePencil, X } from '@phosphor-icons/react';

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

  const hasGrading = data?.worksheet_summary?.has_handwriting !== false;
  const wrongCount = hasGrading ? localItems.filter((i) => i.is_correct === false).length : 0;
  const correctCount = hasGrading ? localItems.filter((i) => i.is_correct === true).length : 0;

  // Focus mode: parent and child look at a single problem together. After
  // grading that's only the misses; an unanswered sheet (answer key) walks
  // every question. "See all" falls back to the full list.
  const wrongItems = hasGrading ? localItems.filter((i) => i.is_correct === false) : [];
  const focusItems = hasGrading ? wrongItems : localItems;
  const [showAll, setShowAll] = useState(false);
  const [step, setStep] = useState(0);
  const [finished, setFinished] = useState(false);
  const focusMode = !showAll && !isLoadingItems && focusItems.length > 0;
  const focusItem = focusMode ? focusItems[Math.min(step, focusItems.length - 1)] : null;

  useEffect(() => {
    if (focusItem && !finished) setActiveItemId(focusItem.id);
  }, [focusItem?.id, finished]);


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
          showToast({
            message: 'Microphone access was denied. Please check your browser settings.',
            type: 'error',
          });
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
      const worksheetContext =
        localItems.length > 0
          ? localItems
              .map(
                (i) =>
                  `Question ${i.id}: Text: "${i.question_text}". Correct Answer: "${i.correct_answer}"`
              )
              .join('\\n')
          : undefined;
      // Pass history along with the new question
      const response = await askChekkiQuestion(
        question,
        language,
        isGuest,
        undefined,
        askHistory,
        undefined,
        worksheetContext
      );

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
        showToast({
          message: language === 'ko' ? '앱 링크가 복사되었습니다!' : 'App link copied!',
          type: 'success',
        });
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
          showToast({
            message:
              language === 'ko'
                ? '이 기기에서 음성 인식을 사용할 수 없습니다.'
                : 'Speech recognition is not available on this device.',
            type: 'error',
          });
          return;
        }

        const permStatus = await SpeechRecognition.requestPermissions();
        if (permStatus.speechRecognition !== 'granted') {
          showToast({
            message:
              language === 'ko'
                ? '마이크 및 음성 인식 권한을 허용해주세요.'
                : 'Please allow microphone and speech recognition permissions.',
            type: 'error',
          });
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
          showToast({
            message:
              language === 'ko'
                ? '마이크 및 음성 인식 권한을 허용해주세요.'
                : 'Please allow microphone and speech recognition permissions in Settings.',
            type: 'error',
          });
        }
      }
      return;
    }

    // Web fallback: use Web Speech API
    if (!recognitionRef.current) {
      showToast({
        message:
          language === 'ko'
            ? '이 브라우저에서는 음성 인식을 지원하지 않습니다. Chrome을 이용해주세요.'
            : 'Speech recognition is not supported in this browser. Please use Chrome.',
        type: 'error',
      });
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
      showToast({
        message:
          language === 'ko'
            ? '다듬기 실패했습니다. 다시 시도해주세요.'
            : 'Failed to refine. Please try again.',
        type: 'error',
      });
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

      <div className="flex w-full min-h-0 flex-col gap-4 lg:flex-row lg:gap-6">
        {/* the worksheet itself, marks drawn on it; under the result on phones */}
        <div className="relative order-2 w-full shrink-0 overflow-hidden rounded-lg bg-surface ring-1 ring-inset ring-rule lg:order-1 lg:sticky lg:top-24 lg:self-start lg:h-[calc(100dvh-7rem)] lg:w-1/2">
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
          className="relative order-1 flex w-full min-w-0 flex-col lg:order-2 lg:w-1/2"
          onClick={() => !focusMode && setActiveItemId(null)}
        >
          {/* result: praise first, then how many to look at together */}
          <section className="relative rounded-lg bg-surface px-5 py-5 ring-1 ring-inset ring-rule">
            <div className="flex items-start gap-4">
              {!mascotError && (
                <img
                  src={wrongItems.length === 0 && hasGrading && !isLoadingItems ? '/images/chekki-wave.webp' : '/images/chekki-thumbs.webp'}
                  alt=""
                  onError={() => setMascotError(true)}
                  className="h-16 w-16 shrink-0 object-contain"
                />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-semibold text-ink-3">
                  {worksheetTitle || (language === 'ko' ? '학습지' : 'Worksheet')}
                </p>
                <h2 className="sign-ko mt-0.5 text-[24px] sm:text-[28px] text-ink break-keep">
                  {isLoadingItems
                    ? t('ws_scanning_header')
                    : !hasGrading
                      ? language === 'ko'
                        ? `정답지 ${localItems.length}문제`
                        : `Answer key · ${localItems.length} questions`
                      : wrongItems.length === 0
                        ? language === 'ko'
                          ? '다 맞았어요!'
                          : 'All correct!'
                        : language === 'ko'
                          ? `${correctCount}개 맞았어요!`
                          : `${correctCount} right!`}
                </h2>
                <p className="mt-1 text-[15px] font-medium text-ink-2 break-keep num">
                  {isLoadingItems
                    ? t('ws_scanning_detail')
                    : !hasGrading
                      ? language === 'ko'
                        ? '문제를 누르면 정답과 설명이 나와요.'
                        : 'Tap a question for the answer and how to explain it.'
                      : wrongItems.length === 0
                        ? language === 'ko'
                          ? '아이를 꼭 칭찬해 주세요.'
                          : 'Give your child a big well done.'
                        : language === 'ko'
                          ? `같이 볼 문제 ${wrongItems.length}개 · 전체 ${localItems.length}문제`
                          : `${wrongItems.length} to look at together · ${localItems.length} total`}
                </p>
              </div>
              <div className="-mr-2 -mt-2 flex shrink-0 items-center">
                <button
                  aria-label={language === 'ko' ? '이미지 저장' : 'Save image'}
                  title={language === 'ko' ? '기록 저장' : 'Save image'}
                  onClick={handleShare}
                  disabled={isSharing}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-md text-ink-3 hover:bg-sunken hover:text-ink"
                >
                  {isSharing ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  ) : isShareSuccess ? (
                    <Check size={20} weight="bold" />
                  ) : (
                    <DownloadSimple size={20} weight="bold" />
                  )}
                </button>
                <button
                  aria-label={t('tt_close')}
                  title={t('tt_close')}
                  onClick={onClose}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-md text-ink-3 hover:bg-sunken hover:text-ink"
                >
                  <X size={20} weight="bold" />
                </button>
              </div>
            </div>
          </section>

          <div
            className="relative mt-4 w-full pb-8 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:pr-1"
            style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' } as React.CSSProperties}
            onClick={(e) => e.stopPropagation()}
          >
            {isLoadingItems && localItems.length === 0 && (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex animate-pulse items-center gap-4 rounded-md bg-surface p-4 ring-1 ring-inset ring-rule">
                    <span className="h-9 w-9 shrink-0 rounded-full bg-sunken" />
                    <span className="h-4 w-2/3 rounded bg-sunken" />
                  </div>
                ))}
              </div>
            )}

            {focusMode && !finished && focusItem && (
              <div className="animate-fade-in">
                {/* where we are: problem 1 of 2 */}
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-[15px] font-bold text-ink num">
                      {hasGrading
                        ? language === 'ko'
                          ? `같이 볼 문제 ${step + 1} / ${focusItems.length}`
                          : `Together ${step + 1} of ${focusItems.length}`
                        : language === 'ko'
                          ? `문제 ${step + 1} / ${focusItems.length}`
                          : `Question ${step + 1} of ${focusItems.length}`}
                    </span>
                    <span className="flex gap-1.5" aria-hidden="true">
                      {focusItems.length <= 12 && focusItems.map((w, i) => (
                        <span key={w.id} className={`h-2 rounded-full transition-all ${i === step ? 'w-6 bg-line' : i < step ? 'w-2 bg-line/50' : 'w-2 bg-rule'}`} />
                      ))}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAll(true)}
                    className="min-h-11 rounded-md px-3 text-[14px] font-bold text-line-ink hover:bg-line-soft"
                  >
                    {language === 'ko' ? '전체 보기' : 'See all'}
                  </button>
                </div>

                <div key={focusItem.id} className="animate-item-appear">
                  <WorksheetItemCard
                    // the first one they look at is the free preview
                    index={step}
                    item={focusItem}
                    isActive
                    isNight={isNight}
                    isSpeedMode={isSpeedMode}
                    language={language}
                    t={t}
                    flagged={isMistake(focusItem.question_text, focusItem.correct_answer)}
                    speechResult={speechResult}
                    scriptLanguages={scriptLanguages}
                    isAuthenticated={isAuthenticated}
                    userPlan={user?.plan}
                    isListening={isListening}
                    hasHandwriting={data?.worksheet_summary?.has_handwriting}
                    onToggleActive={() => {}}
                    onPlayAudio={playAudio}
                    onToggleMistake={toggleMistake}
                    onRefine={(item) => setRefiningItemId(item.id)}
                    onStartPronunciation={startPronunciationCheck}
                    onSetScriptLanguage={(id, lang) => setScriptLanguages((prev) => ({ ...prev, [id]: lang }))}
                    openLoginModal={openLoginModal}
                    setShowPaywall={setShowPaywall}
                    setUpsellFeature={setUpsellFeature}
                  />
                </div>

                <div className="mt-4 flex gap-3">
                  {step > 0 && (
                    <button
                      type="button"
                      onClick={() => setStep(step - 1)}
                      className="inline-flex min-h-14 items-center justify-center gap-2 rounded-md bg-surface px-5 text-[16px] font-bold text-ink ring-1 ring-inset ring-rule"
                    >
                      <ArrowLeft size={18} weight="bold" />
                      {language === 'ko' ? '이전' : 'Back'}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => (step < focusItems.length - 1 ? setStep(step + 1) : setFinished(true))}
                    className="inline-flex min-h-14 flex-1 items-center justify-center gap-2 rounded-md bg-line px-5 text-[17px] font-extrabold text-[#2b211a]"
                  >
                    {step < focusItems.length - 1
                      ? language === 'ko'
                        ? '다음 문제'
                        : 'Next one'
                      : language === 'ko'
                        ? '다 봤어요'
                        : 'All done'}
                    <ArrowRight size={18} weight="bold" />
                  </button>
                </div>

                {correctCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowAll(true)}
                    className="mt-4 flex w-full items-center justify-between gap-3 rounded-md bg-right-soft px-5 py-4 text-left"
                  >
                    <span className="flex items-center gap-2 text-[15px] font-bold text-right">
                      <Check size={18} weight="bold" />
                      {language === 'ko' ? `맞은 문제 ${correctCount}개` : `${correctCount} correct`}
                    </span>
                    <span className="text-[14px] font-semibold text-ink-2">{language === 'ko' ? '보기' : 'View'}</span>
                  </button>
                )}

                {/* the usual tools stay one tap away */}
                <div className="mt-4 grid grid-cols-3 gap-2">
                  {[
                    { Icon: Camera, label: language === 'ko' ? '다시 찍기' : 'Scan again', onClick: onScanAgain },
                    { Icon: NotePencil, label: t('tt_review_note'), onClick: () => onOpenDashboard && onOpenDashboard() },
                    {
                      Icon: isShareSuccess ? Check : DownloadSimple,
                      label: isShareSuccess ? (language === 'ko' ? '저장했어요' : 'Saved') : language === 'ko' ? '기록 저장' : 'Save image',
                      onClick: handleShare,
                    },
                  ].map(({ Icon, label, onClick }) => (
                    <button
                      key={label}
                      type="button"
                      onClick={onClick}
                      className="inline-flex min-h-14 flex-col items-center justify-center gap-1 rounded-md bg-surface px-2 text-[13px] font-bold text-ink-2 ring-1 ring-inset ring-rule hover:text-ink"
                    >
                      <Icon size={20} weight="bold" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {focusMode && finished && (
              <div className="rounded-lg bg-line-soft px-6 py-8 text-center animate-fade-in">
                <img src="/images/chekki-wave.webp" alt="" className="mx-auto h-32 w-32 object-contain animate-[chekki-bob_4s_ease-in-out_infinite]" />
                <p className="sign-ko mt-3 text-[24px] text-ink break-keep">
                  {language === 'ko' ? '다 같이 봤어요!' : 'You went through them all!'}
                </p>
                <p className="mt-2 text-[16px] font-medium text-ink-2 break-keep">
                  {language === 'ko' ? '아이에게 “잘했어, 고마워!” 하고 안아 주세요.' : 'Tell your child "Great job, thank you!" and give a hug.'}
                </p>
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <button onClick={onScanAgain} className="inline-flex min-h-14 items-center justify-center gap-2 rounded-md bg-line px-4 text-[16px] font-extrabold text-[#2b211a]">
                    <Camera size={20} weight="bold" />
                    {language === 'ko' ? '다음 장 찍기' : 'Scan next page'}
                  </button>
                  <button
                    onClick={() => {
                      setFinished(false);
                      setShowAll(true);
                    }}
                    className="inline-flex min-h-14 items-center justify-center gap-2 rounded-md bg-surface px-4 text-[16px] font-bold text-ink ring-1 ring-inset ring-rule"
                  >
                    {language === 'ko' ? '전체 문제 보기' : 'See every question'}
                  </button>
                  <button
                    onClick={() => onOpenDashboard && onOpenDashboard()}
                    className="inline-flex min-h-14 items-center justify-center gap-2 rounded-md bg-surface px-4 text-[16px] font-bold text-ink ring-1 ring-inset ring-rule sm:col-span-2"
                  >
                    <NotePencil size={20} weight="bold" />
                    {t('tt_review_note')}
                  </button>
                </div>
              </div>
            )}

            {!focusMode && localItems.length > 0 && (
              <>
                {focusItems.length > 0 && (
                  <div className="mb-3 flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAll(false);
                        setFinished(false);
                        setStep(0);
                      }}
                      className="min-h-11 rounded-md px-3 text-[14px] font-bold text-line-ink hover:bg-line-soft"
                    >
                      {hasGrading
                        ? language === 'ko'
                          ? '틀린 문제만 하나씩 보기'
                          : 'Just the misses, one at a time'
                        : language === 'ko'
                          ? '한 문제씩 보기'
                          : 'One at a time'}
                    </button>
                  </div>
                )}
                <ol className="relative space-y-3">
                  {localItems.map((item, idx) => (
                    <li
                      key={item.id}
                      ref={(el) => {
                        itemRefs.current[item.id] = el as unknown as HTMLDivElement;
                      }}
                      className="relative w-full animate-item-appear"
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
                        onSetScriptLanguage={(id, lang) => setScriptLanguages((prev) => ({ ...prev, [id]: lang }))}
                        openLoginModal={openLoginModal}
                        setShowPaywall={setShowPaywall}
                        setUpsellFeature={setUpsellFeature}
                      />
                    </li>
                  ))}
                </ol>

                <div className="mt-8 space-y-4 animate-fade-in">
                  <div className="rounded-lg bg-line-soft px-5 py-5">
                    <p className="text-[17px] font-bold leading-snug text-ink break-keep">
                      {language === 'ko'
                        ? '아무도 몰라줘도 채키는 알아요. 수고 많았어요, 엄마!'
                        : 'If nobody noticed, Chekki did. Great job today, Mom.'}
                    </p>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <button
                      onClick={onScanAgain}
                      className="inline-flex min-h-14 items-center justify-center gap-2 rounded-md bg-line px-4 text-[16px] font-extrabold text-[#2b211a]"
                    >
                      <Camera size={20} weight="bold" />
                      {t('ws_scan_again')}
                    </button>
                    <button
                      onClick={() => onOpenDashboard && onOpenDashboard()}
                      className="inline-flex min-h-14 items-center justify-center gap-2 rounded-md bg-surface px-4 text-[16px] font-bold text-ink ring-1 ring-inset ring-rule hover:ring-ink-3"
                    >
                      <NotePencil size={20} weight="bold" />
                      {t('tt_review_note')}
                    </button>
                  </div>
                  <div className="pt-2">
                    <InlineFeedback />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
