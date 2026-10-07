import React, { useState, useEffect, useRef } from 'react';
import { useToast } from '../contexts/ToastContext';
import { createPortal } from 'react-dom';
import {
  X,
  ChatCircleDots,
  CaretRight,
  ArrowsClockwise,
  MicrophoneStage,
  CheckCircle,
  Cards,
  NotePencil,
  CaretDown,
  Buildings,
  ShareNetwork,
} from '@phosphor-icons/react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useMistakes } from '../contexts/MistakeContext';
import { WorksheetItem } from '../types';
import { AskChekkiBar, AskChekkiAnswerModal } from './AskChekkiBar';
import { ParentClassLogs } from './ParentClassLogs';
import { Fold } from './metro';
import { FlashcardsView } from './FlashcardsView';
import { askChekkiQuestion, ChatTurn } from '../services/geminiService';
import { SpeechRecognition } from '@capgo/capacitor-speech-recognition';
import { Capacitor } from '@capacitor/core';
import { cleanAnswerText } from '../utils/speechUtils';
import { playSuccessSound, hapticSuccess, hapticError } from '../utils/feedbackUtils';
import { copyToClipboard } from '../utils/clipboard';

interface DashboardProps {
  onClose: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onClose }) => {
  const { showToast } = useToast();
  const { language } = useLanguage();
  const {
    isAuthenticated,
    checkQuestionLimit,
    incrementQuestion,
    openLoginModal,
    user,
    setShowPaywall,
  } = useAuth();
  const { mistakes } = useMistakes();
  const [isFlashcardsActive, setIsFlashcardsActive] = useState(false);

  // ── Ask Chekki State ───────────────────────────────────────────────────────
  const [askQuery, setAskQuery] = useState('');
  const [askAnswer, setAskAnswer] = useState<string | null>(null);
  const [askAnsweredQuestion, setAskAnsweredQuestion] = useState('');
  const [isAskAsking, setIsAskAsking] = useState(false);
  const [askHistory, setAskHistory] = useState<ChatTurn[]>([]);

  const handleAskSubmit = async (question: string) => {
    if (!question.trim() || isAskAsking) return;
    if (isAuthenticated && !checkQuestionLimit()) return;

    const isFollowUp = askHistory.length > 0;
    if (!isFollowUp) {
      setAskAnswer(null);
      setAskHistory([]);
    }

    setAskAnsweredQuestion(question);
    setIsAskAsking(true);

    try {
      const isGuest = !isAuthenticated;
      const contextString =
        mistakes.length > 0
          ? mistakes.map((m) => `Q: ${m.question_text} | A: ${m.correct_answer}`).join('\n')
          : undefined;

      const response = await askChekkiQuestion(
        question,
        language,
        isGuest,
        undefined,
        askHistory,
        undefined,
        contextString
      );
      setAskAnswer(response);

      setAskHistory((prev) => [
        ...prev,
        { role: 'user' as const, text: question },
        { role: 'model' as const, text: response },
      ]);

      if (isAuthenticated) await incrementQuestion();
    } catch (error: any) {
      const isNetwork =
        !window.navigator.onLine ||
        error.message?.includes('network') ||
        error.message?.includes('fetch');
      const isQuota = error.message?.includes('quota') || error.status === 429;
      let errorMsgEn = 'Something went wrong. Please try again.';
      let errorMsgKo = '오류가 발생했습니다. 다시 시도해주세요.';
      if (isNetwork) {
        errorMsgEn = 'Network connection failed. Please check your internet and try again.';
        errorMsgKo = '네트워크 연결에 실패했습니다. 인터넷을 확인하고 다시 시도해주세요.';
      } else if (isQuota) {
        errorMsgEn = 'You have reached the daily question limit. Please try again tomorrow.';
        errorMsgKo = '일일 질문 한도에 도달했습니다. 내일 다시 시도해주세요.';
      }
      setAskAnswer(language === 'ko' ? errorMsgKo : errorMsgEn);
    } finally {
      setIsAskAsking(false);
    }
  };

  // ── Voice Practice State ───────────────────────────────────────────────────
  const [isPracticing, setIsPracticing] = useState(false);
  const [practiceIndex, setPracticeIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [practiceDone, setPracticeDone] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [spokenText, setSpokenText] = useState('');
  const [showHandoff, setShowHandoff] = useState(false);
  const [practiceStatus, setPracticeStatus] = useState<'idle' | 'success' | 'failed'>('idle');

  // Mock mistake bank removed

  useEffect(() => {
    // Cleanup listeners on unmount
    return () => {
      SpeechRecognition.removeAllListeners().catch(() => {});
    };
  }, []);

  const handleStartPractice = () => {
    if (!isAuthenticated) {
      openLoginModal();
      return;
    }
    if (user?.plan !== 'pro') {
      const today = new Date().toISOString().split('T')[0];
      const usedDate = localStorage.getItem('chekki_voice_limit_date');
      if (usedDate === today) {
        setShowPaywall(true);
        return;
      }
      localStorage.setItem('chekki_voice_limit_date', today);
    }
    setShowHandoff(true);
  };

  const handleStartFlashcards = () => {
    if (!isAuthenticated) {
      openLoginModal();
      return;
    }
    if (user?.plan !== 'pro') {
      const today = new Date().toISOString().split('T')[0];
      const usedDate = localStorage.getItem('chekki_flashcard_limit_date');
      if (usedDate === today) {
        setShowPaywall(true);
        return;
      }
      localStorage.setItem('chekki_flashcard_limit_date', today);
    }
    setIsFlashcardsActive(true);
  };

  const confirmStartPractice = () => {
    setShowHandoff(false);
    setIsPracticing(true);
    setPracticeIndex(0);
    setScore(0);
    setPracticeDone(false);
    setSpokenText('');
    setPracticeStatus('idle');
  };

  const handleResetPractice = () => {
    setIsPracticing(false);
    setIsListening(false);
    SpeechRecognition.stop().catch(() => {});
  };

  const normalizeString = (s: string) => {
    return s
      .toLowerCase()
      .replace(/[^\w\s]|_/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  };

  // Web Speech Fallback Ref
  const webSpeechRef = useRef<any>(null);

  const handleMicPress = async () => {
    if (isListening) {
      if (Capacitor.isNativePlatform()) {
        await SpeechRecognition.stop().catch(() => {});
      } else if (webSpeechRef.current) {
        webSpeechRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    try {
      if (Capacitor.isNativePlatform()) {
        const perm = await SpeechRecognition.requestPermissions();
        if (perm.speechRecognition !== 'granted') {
          showToast({
            message:
              language === 'ko'
                ? '마이크 권한이 필요합니다.'
                : 'Microphone permission is required.',
            type: 'error',
          });
          return;
        }

        setIsListening(true);
        setSpokenText('');
        setPracticeStatus('idle');

        await SpeechRecognition.removeAllListeners();

        let currentText = '';

        SpeechRecognition.addListener('partialResults', (data) => {
          if (data.matches && data.matches.length > 0) {
            currentText = data.matches[0];
            setSpokenText(currentText);
          }
        });

        SpeechRecognition.addListener('listeningState', (data) => {
          if (data.status === 'stopped') {
            setIsListening(false);
            if (currentText) {
              checkPronunciation(currentText);
            }
          }
        });

        await SpeechRecognition.start({
          language: 'en-US',
          partialResults: true,
          popup: false,
          maxResults: 1,
        });
      } else {
        // Web Fallback
        const SpeechRec =
          (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRec) {
          showToast({
            message: 'Speech recognition is not supported in this browser. Please use Chrome.',
            type: 'error',
          });
          return;
        }

        setIsListening(true);
        setSpokenText('');
        setPracticeStatus('idle');

        const recognition = new SpeechRec();
        webSpeechRef.current = recognition;
        recognition.lang = 'en-US';
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;

        recognition.onresult = (event: any) => {
          let interimTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              const finalTrans = event.results[i][0].transcript;
              setSpokenText(finalTrans);
              checkPronunciation(finalTrans);
              setIsListening(false);
            } else {
              interimTranscript += event.results[i][0].transcript;
              setSpokenText(interimTranscript);
            }
          }
        };

        recognition.onerror = (event: any) => {
          console.error(event.error);
          setIsListening(false);
          if (event.error !== 'aborted') {
            showToast({
              message:
                language === 'ko'
                  ? '음성 인식에 실패했습니다. 다시 시도해주세요.'
                  : 'Speech recognition failed. Try again.',
              type: 'error',
            });
          }
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognition.start();
      }
    } catch (e: any) {
      console.error(e);
      setIsListening(false);
      if (e.message !== 'recognition aborted') {
        showToast({
          message:
            language === 'ko'
              ? '음성 인식에 실패했습니다. 다시 시도해주세요.'
              : 'Speech recognition failed. Try again.',
          type: 'error',
        });
      }
    }
  };

  const playSuccessFeedback = () => {
    playSuccessSound();
    hapticSuccess();
  };

  const checkPronunciation = (transcript: string) => {
    if (!transcript) return;
    const current = mistakes[practiceIndex];
    const target = normalizeString(cleanAnswerText(current.correct_answer || ''));
    const spoken = normalizeString(transcript);

    const targetWords = target.split(' ').filter((w) => w.length > 0);
    const spokenWords = spoken.split(' ').filter((w) => w.length > 0);

    // Count how many target words are present in spoken words
    const matchCount = targetWords.filter((word) => spokenWords.includes(word)).length;

    // Strict passing criteria: Must match almost all words to avoid passing partial sentences
    const threshold = Math.max(targetWords.length, Math.ceil(targetWords.length * 0.9));
    const isPass = spoken === target || spoken.includes(target) || matchCount >= threshold;

    if (isPass) {
      setPracticeStatus('success');
      setScore((s) => s + 1);
      playSuccessFeedback();
    } else {
      setPracticeStatus('failed');
      hapticError();
    }
  };

  const handleNextPractice = () => {
    if (practiceIndex + 1 >= mistakes.length) {
      setPracticeDone(true);
    } else {
      setPracticeIndex((i) => i + 1);
      setPracticeStatus('idle');
      setSpokenText('');
    }
  };

  const allExamples = [
    'Nouns & Pronouns',
    'Action Verbs',
    'Prepositions',
    'Adjectives & Adverbs',
    'Present Continuous',
    'Past Tense',
    'Future Tense',
    'Articles (a, an, the)',
  ];
  const [examples, setExamples] = useState(allExamples.slice(0, 3));

  const handleRefreshExamples = () => {
    const shuffled = [...allExamples].sort(() => 0.5 - Math.random());
    setExamples(shuffled.slice(0, 3));
  };

  const [isDark, setIsDark] = useState(true);
  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const shareDirectorInvite = async () => {
              const inviteText = language === 'ko'
                ? '안녕하세요 원장님! Chekki AI로 아이 숙제를 스캔해서 채점 결과를 바로 받아보고 있어요. Chekki School Pro를 도입하시면 선생님들 채점 시간이 크게 줄고, 저희 같은 학부모들은 전원 무료로 이용할 수 있대요. 한번 살펴봐 주시겠어요? https://www.chekkiai.com/schools'
                : "Hello Director! We've been using Chekki AI to scan and grade my child's homework — it's been great. Chekki School Pro brings this to your whole academy: teachers save hours on grading, and every parent gets it free. Worth a look: https://www.chekkiai.com/schools";

              // 1. If mobile Web Share API is available, trigger native 1-click KakaoTalk / SMS share sheet
              if (navigator.share) {
                try {
                  await navigator.share({
                    title: language === 'ko' ? 'Chekki 어학원 원장님 초대' : 'Chekki Academy Director Invite',
                    text: inviteText,
                    url: 'https://www.chekkiai.com/schools'
                  });
                  showToast({
                    message: language === 'ko' ? '원장님 추천 초대장 전달 완료!' : 'Invitation shared successfully!',
                    type: 'success'
                  });
                  return;
                } catch (err) {
                  // User cancelled share sheet; fallback to clipboard copy
                }
              }

              // 2. Fallback: copy to clipboard (falls back further to
              // execCommand if the Clipboard API is denied — see utils/clipboard.ts)
              const copied = await copyToClipboard(inviteText);
              showToast({
                message: copied
                  ? (language === 'ko' ? '원장님 추천 초대 문구가 복사되었습니다! 카카오톡이나 이메일에 붙여넣어 주세요.' : 'Academy invitation link copied to clipboard! Paste into KakaoTalk or Email.')
                  : (language === 'ko' ? '복사에 실패했습니다. 다시 시도해 주세요.' : 'Copy failed — please try again.'),
                type: copied ? 'success' : 'error',
              });
  };

  return createPortal(
    <div className="fixed inset-0 z-[200] bg-ground text-ink overflow-y-auto animate-fade-in font-sans">
      
      {showHandoff && (
        <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center p-6 bg-ground tile-ground animate-fade-in">
          <div className="max-w-md w-full text-center space-y-6">
            <img src="/images/chekki-wave.webp" alt="" className="mx-auto h-32 w-32 object-contain" />
            <h2 className="whitespace-pre-line text-[30px] md:text-[40px] font-extrabold text-ink tracking-[-0.02em] leading-tight break-keep">
              {language === 'ko' ? '폰을 테이블에\n올려주세요!' : 'Tabletop Co-Pilot\nMode Active'}
            </h2>
            <p className="text-ink-2 text-[17px] break-keep">
              {language === 'ko'
                ? '화면 터치 없이 오디오로 복습이 진행됩니다.'
                : 'Hands-free interactive voice review is starting.'}
            </p>
            <button
              onClick={confirmStartPractice}
              className="btn-press w-full min-h-14 bg-line text-[#2b211a] font-extrabold rounded-md text-[18px]"
            >
              {language === 'ko' ? '준비 완료!' : "I'm Ready!"}
            </button>
            <button
              onClick={() => setShowHandoff(false)}
              className="min-h-11 px-4 text-ink-3 hover:text-ink font-semibold text-[15px]"
            >
              {language === 'ko' ? '취소' : 'Cancel'}
            </button>
          </div>
        </div>
      )}

      <AskChekkiAnswerModal
        answer={askAnswer}
        isAsking={isAskAsking}
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
        isNight={isDark}
      />

      <div className="relative z-10 flex items-center justify-between px-4 pb-5 pt-[calc(env(safe-area-inset-top)+1.5rem)] md:pt-[calc(env(safe-area-inset-top)+2rem)] max-w-2xl mx-auto">
        <h1 className="text-balance text-2xl md:text-3xl font-black flex items-center gap-2 font-korean">
          <span>{language === 'ko' ? '학습 대시보드' : 'Learning Dashboard'}</span>
        </h1>
        <button
          aria-label="Close Dashboard"
          onClick={onClose}
          className="w-12 h-12 rounded-full bg-sunken flex items-center justify-center hover:bg-rule transition-colors active:scale-[0.97]"
        >
          <X size={20} weight="bold" />
        </button>
      </div>

      <div className="relative z-10 mx-auto w-full max-w-2xl space-y-3 px-4 pb-24 animate-fade-in-up">
        {user?.classId && user?.classStatus === 'active' && (
          <ParentClassLogs classId={user.classId} studentUid={user.uid} studentName={user.studentName} language={language} />
        )}

        {/* saved mistakes: each one opens to its answer */}
        <Fold
          defaultOpen
          icon={<NotePencil size={20} weight="bold" />}
          title={language === 'ko' ? '다시 볼 문제' : 'To practice again'}
          sub={
            language === 'ko'
              ? '채점 결과에서 저장한 문제예요. 누르면 정답이 보여요.'
              : 'Saved from your scans. Tap one to see the answer.'
          }
          badge={
            mistakes.length > 0 ? (
              <span className="num rounded-full bg-line-soft px-2.5 py-0.5 text-[13px] font-bold text-line-ink">{mistakes.length}</span>
            ) : undefined
          }
        >
          {mistakes.length === 0 ? (
            <p className="py-4 text-center text-[15px] text-ink-3 break-keep">
              {language === 'ko'
                ? '아직 없어요. 채점 결과에서 ‘오답노트’를 누르면 여기에 모여요.'
                : 'Nothing yet. Tap “Save” on a scan result to collect problems here.'}
            </p>
          ) : (
            <>
              <ul className="space-y-2">
                {mistakes.map((mistake, i) => (
                  <li key={mistake.uniqueId || i}>
                    <details className="group/m rounded-md bg-sunken">
                      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden">
                        <span className="min-w-0 text-[15px] font-semibold text-ink break-words">{mistake.question_text}</span>
                        <CaretDown size={16} weight="bold" className="shrink-0 text-ink-3 transition-transform group-open/m:rotate-180" />
                      </summary>
                      <p className="px-4 pb-4 text-[17px] font-extrabold text-correct break-words">
                        {cleanAnswerText(mistake.correct_answer || '')}
                      </p>
                    </details>
                  </li>
                ))}
              </ul>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <button
                  onClick={handleStartPractice}
                  className="inline-flex min-h-14 items-center justify-center gap-2 rounded-md bg-line px-4 text-[16px] font-extrabold text-[#2b211a] active:scale-[0.98]"
                >
                  <MicrophoneStage size={20} weight="bold" />
                  {language === 'ko' ? '아이와 말하기 연습' : 'Speaking practice'}
                </button>
                <button
                  onClick={handleStartFlashcards}
                  className="inline-flex min-h-14 items-center justify-center gap-2 rounded-md bg-surface px-4 text-[16px] font-bold text-ink ring-1 ring-inset ring-rule active:scale-[0.98]"
                >
                  <Cards size={20} weight="bold" />
                  {language === 'ko' ? '플래시카드' : 'Flashcards'}
                </button>
              </div>
            </>
          )}
        </Fold>

        <Fold
          icon={<ChatCircleDots size={20} weight="bold" />}
          title={language === 'ko' ? '채키에게 물어보기' : 'Ask Chekki'}
          sub={language === 'ko' ? '이해 안 되는 게 있으면 편하게 물어보세요.' : "Anything you didn't understand? Just ask."}
        >
          <AskChekkiBar
            query={askQuery}
            setQuery={setAskQuery}
            onSubmit={handleAskSubmit}
            isAsking={isAskAsking}
            language={language}
            isNight={isDark}
          />
        </Fold>

        {/* invite the academy: quiet, folded, gone once linked */}
        {!user?.schoolId && (
          <Fold
            icon={<Buildings size={20} weight="bold" />}
            title={language === 'ko' ? '학원에 채키 추천하기' : 'Recommend Chekki to your academy'}
            sub={language === 'ko' ? '학원이 쓰면 우리 아이는 무료예요.' : 'If your academy uses it, your child goes free.'}
          >
            <p className="text-[15px] leading-relaxed text-ink-2 break-keep">
              {language === 'ko'
                ? '원장님이 Chekki School Pro를 도입하시면, 채점 시간은 줄고 학부모님은 ₩0원으로 프리미엄을 이용하실 수 있어요.'
                : 'Chekki School Pro autogrades homework so teachers save hours, and every parent at the academy gets Premium free.'}
            </p>
            <button
              type="button"
              onClick={shareDirectorInvite}
              className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md bg-sign px-4 text-[15px] font-bold text-on-sign"
            >
              <ShareNetwork size={18} weight="bold" />
              {language === 'ko' ? '원장님께 보내기' : 'Send to the director'}
            </button>
          </Fold>
        )}
      </div>

      {/* ── Interactive Practice Room Modal ─────────────────────────────────────────── */}
      {isPracticing && (
        <div className="fixed inset-0 z-[300] bg-ground tile-ground flex items-center justify-center p-4 animate-fade-in">
          <div className="relative w-full max-w-2xl bg-surface ring-1 ring-inset ring-rule rounded-lg p-6 md:p-10">
            {/* Close */}
            <button
              onClick={handleResetPractice}
              aria-label={language === 'ko' ? '닫기' : 'Close'}
              className="absolute top-4 right-4 w-11 h-11 rounded-md text-ink-3 flex items-center justify-center hover:bg-sunken hover:text-ink"
            >
              <X size={18} weight="bold" />
            </button>

            {practiceDone ? (
              <div className="flex flex-col items-center gap-6 py-8 text-center">
                <img src="/images/chekki-thumbs.webp" alt="" className="h-28 w-28 object-contain" />
                <h2 className="text-[28px] font-extrabold tracking-[-0.02em] text-ink">
                  {language === 'ko' ? '연습 완료!' : 'Practice Complete!'}
                </h2>
                <p className="num text-[34px] font-extrabold text-line-ink">
                  {score}/{mistakes.length}
                </p>
                <p className="text-ink-2 text-[17px] break-keep">
                  {language === 'ko'
                    ? score === mistakes.length
                      ? '발음이 완벽해요! 🎉'
                      : '꾸준히 연습하면 더 좋아질 거에요!'
                    : score === mistakes.length
                      ? 'Perfect pronunciation! 🎉'
                      : 'Keep practicing, you are doing great!'}
                </p>
                <button
                  onClick={handleStartPractice}
                  className="btn-press mt-2 px-8 min-h-12 bg-surface ring-1 ring-inset ring-rule text-ink font-bold rounded-md hover:ring-ink-3 text-[15px]"
                >
                  {language === 'ko' ? '다시 연습하기' : 'Practice Again'}
                </button>
              </div>
            ) : (
              (() => {
                const current = mistakes[practiceIndex];
                return (
                  <div className="mt-12 flex flex-col gap-6 items-center text-center">
                    <div className="w-full flex items-center justify-between mb-4">
                      <span className="num shrink-0 pr-3 font-bold text-ink-2">
                        {practiceIndex + 1} / {mistakes.length}
                      </span>
                      <div className="w-full h-1.5 bg-rule rounded-full overflow-hidden">
                        <div
                          className="h-full bg-line transition-[width] duration-200"
                          style={{ width: `${((practiceIndex + 1) / mistakes.length) * 100}%` }}
                        />
                      </div>
                      <span className="num shrink-0 pl-3 text-[14px] font-bold text-line-ink">{score} ✓</span>
                    </div>

                    <p className="text-[15px] font-bold text-ink-2">
                      {language === 'ko'
                        ? '다음 문장을 소리 내어 읽어보세요'
                        : 'Read the sentence out loud'}
                    </p>

                    <div className="bg-sunken rounded-md p-6 w-full">
                      <p className="text-sm text-ink-3 mb-2">
                        {current.question_text}
                      </p>
                      <p
                        className="text-[26px] md:text-[32px] font-extrabold text-ink mb-4 cursor-pointer active:scale-[0.97] transition-transform break-keep"
                        onClick={() => {
                          const correctText = cleanAnswerText(current.correct_answer || '');
                          setSpokenText(correctText);
                          checkPronunciation(correctText);
                        }}
                        title={
                          language === 'ko'
                            ? '정답으로 바로 넘어가기'
                            : 'Tap to skip speech recognition'
                        }
                      >
                        {cleanAnswerText(current.correct_answer || '')}
                      </p>

                      <div className="h-20 flex items-center justify-center bg-surface rounded-md ring-1 ring-inset ring-rule relative overflow-hidden">
                        {isListening && (
                          <div className="absolute inset-0 bg-line-soft animate-pulse" />
                        )}
                        <p
                          className={`text-lg font-medium relative z-10 px-4 ${spokenText ? 'text-ink' : 'text-ink-3'}`}
                        >
                          {spokenText ||
                            (language === 'ko'
                              ? '(마이크 버튼을 누르고 말하세요)'
                              : '(Tap the mic and speak)')}
                        </p>
                      </div>
                    </div>

                    {practiceStatus === 'idle' && (
                      <div className="flex flex-col items-center gap-4">
                        <button
                          onClick={handleMicPress}
                          aria-label={isListening ? (language === 'ko' ? '듣기 멈추기' : 'Stop listening') : language === 'ko' ? '말하기 시작' : 'Start speaking'}
                          className="btn-press group relative w-24 h-24 rounded-full flex items-center justify-center outline-none"
                        >
                          <div className="absolute inset-0 rounded-full bg-line-soft" />
                          <div
                            className={`relative z-10 w-[calc(100%-1rem)] h-[calc(100%-1rem)] rounded-full flex items-center justify-center transition-colors duration-300 ${isListening ? 'bg-sign' : 'bg-line'}`}
                          >
                            {isListening && (
                              <div className="absolute inset-0 rounded-full border-2 border-line animate-ping opacity-60" />
                            )}
                            <MicrophoneStage
                              size={36}
                              weight="fill"
                              className={`relative z-10 ${isListening ? 'text-line' : 'text-[#2b211a]'}`}
                            />
                          </div>
                        </button>
                        {isListening && (
                          <span
                            className="text-[14px] text-ink-2 font-bold animate-fade-in cursor-pointer"
                            onClick={handleMicPress}
                          >
                            {language === 'ko' ? '정지 / 취소' : 'Stop / Cancel'}
                          </span>
                        )}
                      </div>
                    )}

                    {practiceStatus === 'success' && (
                      <div className="flex flex-col items-center gap-6 animate-fade-in w-full">
                        <div className="flex items-center gap-3 text-correct bg-right-soft px-6 py-3 rounded-full">
                          <CheckCircle size={24} weight="fill" />
                          <span className="text-lg font-bold font-korean">
                            {language === 'ko' ? '완벽해요!' : 'Perfect!'}
                          </span>
                        </div>
                        <button
                          onClick={handleNextPractice}
                          className="btn-press w-full sm:w-auto min-h-12 px-6 bg-line text-[#2b211a] font-bold rounded-md flex items-center justify-center gap-2"
                        >
                          <span className="font-bold text-[15px]">
                            {practiceIndex + 1 >= mistakes.length
                              ? language === 'ko'
                                ? '결과 보기'
                                : 'See Results'
                              : language === 'ko'
                                ? '다음 문장'
                                : 'Next Sentence'}
                          </span>
                          <CaretRight size={18} weight="bold" />
                        </button>
                      </div>
                    )}

                    {practiceStatus === 'failed' && (
                      <div className="flex flex-col items-center gap-6 animate-fade-in w-full">
                        <div className="flex items-center gap-3 text-line-ink bg-line-soft px-6 py-3 rounded-full">
                          <span className="text-lg font-bold font-korean">
                            {language === 'ko'
                              ? '조금 아쉬워요. 다시 해볼까요?'
                              : "Not quite. Let's try again!"}
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            setPracticeStatus('idle');
                            setSpokenText('');
                          }}
                          className="btn-press w-full sm:w-auto min-h-12 px-6 bg-surface text-ink font-bold rounded-md ring-1 ring-inset ring-rule hover:ring-ink-3 text-[15px] flex items-center justify-center gap-2"
                        >
                          <span>
                            {language === 'ko' ? '다시 말하기' : 'Try Again'}
                          </span>
                          <ArrowsClockwise size={18} weight="bold" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })()
            )}
          </div>
        </div>
      )}

      {isFlashcardsActive && (
        <FlashcardsView
          mistakes={mistakes}
          language={language}
          onClose={() => setIsFlashcardsActive(false)}
        />
      )}
    </div>,
    document.body
  );
};
