import React, { useState, useEffect, useRef } from 'react';
import { useToast } from '../contexts/ToastContext';
import { createPortal } from 'react-dom';
import { X, Camera, ChatCircleDots, TrendUp, CaretRight, Spinner, ArrowsClockwise, ListDashes, MicrophoneStage, CheckCircle, XCircle, Trophy, Cards, DeviceMobile } from '@phosphor-icons/react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useMistakes } from '../contexts/MistakeContext';
import { WorksheetItem } from '../types';
import { AskChekkiBar, AskChekkiAnswerModal } from './AskChekkiBar';
import { FlashcardsView } from './FlashcardsView';
import { askChekkiQuestion, ChatTurn } from '../services/geminiService';
import { SpeechRecognition } from '@capgo/capacitor-speech-recognition';
import { Capacitor } from '@capacitor/core';
import { cleanAnswerText } from '../utils/speechUtils';
import { playSuccessSound, hapticSuccess, hapticError } from '../utils/feedbackUtils';

interface DashboardProps {
  onClose: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onClose }) => {
  const { showToast } = useToast();
  const { language } = useLanguage();
  const { isAuthenticated, checkQuestionLimit, incrementQuestion, openLoginModal } = useAuth();
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
      const contextString = mistakes.length > 0 
        ? mistakes.map(m => `Q: ${m.question_text} | A: ${m.correct_answer}`).join('\n')
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
      const isNetwork = !window.navigator.onLine || error.message?.includes('network') || error.message?.includes('fetch');
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
  const [spokenText, setSpokenText] = useState("");
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
    setShowHandoff(true);
  };

  const confirmStartPractice = () => {
    setShowHandoff(false);
    setIsPracticing(true);
    setPracticeIndex(0);
    setScore(0);
    setPracticeDone(false);
    setSpokenText("");
    setPracticeStatus('idle');
  };

  const handleResetPractice = () => {
    setIsPracticing(false);
    setIsListening(false);
    SpeechRecognition.stop().catch(() => {});
  };

  const normalizeString = (s: string) => {
    return s.toLowerCase().replace(/[^\w\s]|_/g, "").replace(/\s+/g, " ").trim();
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
          showToast({ message: language === 'ko' ? '마이크 권한이 필요합니다.' : 'Microphone permission is required.', type: 'error' });
          return;
        }

        setIsListening(true);
        setSpokenText("");
        setPracticeStatus('idle');

        await SpeechRecognition.removeAllListeners();
        
        SpeechRecognition.addListener('partialResults', (data) => {
          if (data.matches && data.matches.length > 0) {
            setSpokenText(data.matches[0]);
          }
        });

        const result = await SpeechRecognition.start({
          language: "en-US",
          partialResults: true,
          maxResults: 1
        });

        setIsListening(false);
        const finalTranscript = result.matches && result.matches.length > 0 ? result.matches[0] : spokenText;
        setSpokenText(finalTranscript);
        checkPronunciation(finalTranscript);
      } else {
        // Web Fallback
        const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRec) {
          showToast({ message: 'Speech recognition is not supported in this browser. Please use Chrome.', type: 'error' });
          return;
        }

        setIsListening(true);
        setSpokenText("");
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
            showToast({ message: language === 'ko' ? '음성 인식에 실패했습니다. 다시 시도해주세요.' : 'Speech recognition failed. Try again.', type: 'error' });
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
        showToast({ message: language === 'ko' ? '음성 인식에 실패했습니다. 다시 시도해주세요.' : 'Speech recognition failed. Try again.', type: 'error' });
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

    const targetWords = target.split(' ').filter(w => w.length > 0);
    const spokenWords = spoken.split(' ').filter(w => w.length > 0);
    
    // Count how many target words are present in spoken words
    const matchCount = targetWords.filter(word => spokenWords.includes(word)).length;
    
    // Strict passing criteria: Must match almost all words to avoid passing partial sentences
    const threshold = Math.max(targetWords.length, Math.ceil(targetWords.length * 0.9));
    const isPass = spoken === target || spoken.includes(target) || matchCount >= threshold;

    if (isPass) {
      setPracticeStatus('success');
      setScore(s => s + 1);
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
      setPracticeIndex(i => i + 1);
      setPracticeStatus('idle');
      setSpokenText("");
    }
  };

  const allExamples = [
    'Nouns & Pronouns', 'Action Verbs', 'Prepositions', 
    'Adjectives & Adverbs', 'Present Continuous', 'Past Tense', 
    'Future Tense', 'Articles (a, an, the)'
  ];
  const [examples, setExamples] = useState(allExamples.slice(0, 3));
  
  const handleRefreshExamples = () => {
    const shuffled = [...allExamples].sort(() => 0.5 - Math.random());
    setExamples(shuffled.slice(0, 3));
  };

  
  const cardShellClasses = "relative rounded-[2rem] p-1.5 bg-white/5 border border-white/10 group transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:scale-[0.98]";
  const cardCoreClasses = "relative w-full h-full rounded-[calc(2rem-0.375rem)] bg-zinc-950/80 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] flex flex-col p-6 md:p-8 overflow-hidden";

  const [isDark, setIsDark] = useState(true);
  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  return createPortal(
    <div className="fixed inset-0 z-[200] bg-[#050505] text-zinc-50 overflow-y-auto animate-fade-in font-sans">
      <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.03] bg-noise mix-blend-overlay" />

      {showHandoff && (
        <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center p-6 bg-black/95 backdrop-blur-3xl animate-in fade-in zoom-in duration-300">
          <div className="max-w-md w-full text-center space-y-8">
            <div className="w-32 h-32 mx-auto bg-orange-500/20 rounded-full flex items-center justify-center mb-8 animate-pulse">
              <span className="text-6xl">📱</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-white font-display tracking-tight leading-tight">
              {language === 'ko' ? '폰을 테이블에\n올려주세요!' : 'Tabletop Co-Pilot\nMode Active'}
            </h2>
            <p className="text-zinc-400 font-korean text-lg mb-12">
              {language === 'ko' ? '화면 터치 없이 오디오로 복습이 진행됩니다.' : 'Hands-free interactive voice review is starting.'}
            </p>
            <button
              onClick={confirmStartPractice}
              className="w-full py-5 bg-orange-500 hover:bg-orange-600 text-white font-black rounded-full text-xl shadow-[0_0_30px_rgba(249,115,22,0.4)] active:scale-95 transition-all"
            >
              {language === 'ko' ? '준비 완료!' : 'I\'m Ready!'}
            </button>
            <button
              onClick={() => setShowHandoff(false)}
              className="mt-4 text-zinc-500 hover:text-white font-korean text-sm"
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
      
      <div className="relative z-10 flex items-center justify-between px-6 py-6 md:px-12 md:py-8 max-w-[1400px] mx-auto">
        <h1 className="text-balance text-2xl md:text-3xl font-black tracking-tighter flex items-center gap-2 font-korean">
          <span>{language === 'ko' ? '학습 대시보드' : 'Learning Dashboard'}</span>
        </h1>
        <button 
          aria-label="Close Dashboard"
          onClick={onClose}
          className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors active:scale-[0.97]"
        >
          <X size={20} weight="bold" />
        </button>
      </div>


      <div className="relative z-10 px-4 md:px-12 pb-24 max-w-[1400px] mx-auto animate-fade-in-up" style={{ animationDelay: '200ms' }}>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6">
          
          <div className={`md:col-span-8 md:row-span-2 ${cardShellClasses} flex flex-col min-h-[350px] md:min-h-[450px]`}>
            <div className={`${cardCoreClasses}`}>
              <div 
                className="absolute top-0 right-0 w-[600px] h-[600px] pointer-events-none -translate-y-1/3 translate-x-1/3 opacity-30 mix-blend-screen"
                style={{ maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 70%)', WebkitMaskImage: 'radial-gradient(ellipse at center, black 30%, transparent 70%)' }}
              >
                <div className="absolute inset-0 bg-emerald-500/30 blur-[100px] rounded-full" />
                <img src="/dashboard-bg.png" alt="3D Geometric UI Asset" className="w-full h-full object-cover scale-110" />
              </div>
              
              <div className="flex items-center gap-3 mb-6 relative z-10">
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
                  <MicrophoneStage size={20} weight="bold" />
                </div>
                <h2 className="text-balance text-xl font-bold tracking-tight font-korean">
                  {language === 'ko' ? '오답 인터랙티브 연습' : 'Interactive Practice Room'}
                </h2>
              </div>
              
              <p className="text-zinc-400 text-sm max-w-md mb-8 relative z-10 font-korean leading-relaxed">
                {language === 'ko' 
                  ? '오답 노트의 문장들을 아이가 직접 소리 내어 말해보며 완벽히 익힐 수 있게 해보세요.'
                  : 'Turn saved mistakes into an interactive speaking exercise so your child learns to pronounce it correctly.'}
              </p>

              <div className="flex-1 w-full bg-black/40 rounded-2xl border border-white/5 p-4 flex flex-col gap-3 overflow-y-auto relative z-10">
                {showHandoff ? (
                  <div className="flex flex-col items-center justify-center h-full text-center p-4 animate-in fade-in">
                    <DeviceMobile size={40} className="text-orange-500 mb-4 animate-pulse" weight="fill" />
                    <h3 className="text-lg font-bold text-white mb-2">{language === 'ko' ? '폰을 테이블에 올려주세요!' : 'Tabletop Co-Pilot Mode Active'}</h3>
                    <p className="text-xs text-zinc-400 mb-6">{language === 'ko' ? '화면 터치 없이 오디오로 복습이 진행됩니다.' : 'Hands-free interactive voice review is starting.'}</p>
                    <div className="flex items-center gap-3 w-full">
                      <button onClick={() => setShowHandoff(false)} className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-sm font-bold transition-all">Cancel</button>
                      <button onClick={confirmStartPractice} className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-bold shadow-[0_0_20px_rgba(249,115,22,0.4)] transition-all">I'm Ready!</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 mb-2">Past Mistakes</h3>
                    {mistakes.length === 0 ? (
                      <div className="flex flex-col items-center justify-center p-8 text-center h-full">
                        <span className="text-4xl mb-4">📓</span>
                        <p className="text-zinc-400 font-medium font-korean text-sm">
                          {language === 'ko'
                            ? '아직 복습할 문항이 없습니다. 스캔 결과에서 오답을 저장하면 여기에 표시됩니다.'
                            : 'Your mistake bank is empty. It will be populated with real sentences when you save a mistake from a scan.'}
                        </p>
                      </div>
                    ) : (
                      mistakes.slice(0, 3).map((mistake, i) => (
                        <div key={mistake.uniqueId || i} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors cursor-default gap-3">
                          <div className="flex flex-col gap-1">
                            <span className="text-sm font-medium line-through text-zinc-500 decoration-red-500/50">{mistake.question_text}</span>
                            <span className="text-sm font-bold text-emerald-400">{cleanAnswerText(mistake.correct_answer || '')}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </>
                )}
              </div>

              <div className="mt-6 flex flex-col sm:flex-row items-center justify-end gap-3 relative z-10">
                <button 
                  onClick={() => setIsFlashcardsActive(true)}
                  disabled={mistakes.length === 0}
                  className={`group relative overflow-hidden px-6 py-3 bg-white/5 text-white font-bold rounded-full text-sm flex items-center justify-center gap-3 transition-all duration-200 active:scale-[0.97] hover:bg-white/10 border border-white/10 font-korean disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <Cards size={18} weight="bold" />
                  <span className="relative z-10">
                    {language === 'ko' ? '디지털 플래시카드' : 'Digital Flashcards'}
                  </span>
                </button>
                <button 
                  onClick={handleStartPractice}
                  disabled={mistakes.length === 0}
                  className={`group relative overflow-hidden px-8 py-3 bg-emerald-500 text-white font-bold rounded-full text-sm flex items-center justify-center gap-3 transition-all duration-200 active:scale-[0.97] shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:bg-emerald-600 font-korean disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:bg-emerald-500/50`}
                >
                  <MicrophoneStage size={18} weight="bold" />
                  <span className="relative z-10">
                    {language === 'ko' ? '스피킹 연습 시작하기' : 'Start Audio Practice'}
                  </span>
                </button>
              </div>
            </div>
          </div>

          <div className={`md:col-span-4 md:row-span-2 ${cardShellClasses} min-h-[250px]`}>
            <div className={`${cardCoreClasses}`}>
              <div className="absolute top-0 left-0 w-48 h-48 bg-blue-500/10 blur-[80px] rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
              
              <div className="flex items-center gap-3 mb-4 relative z-10">
                <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/20">
                  <ChatCircleDots size={20} weight="bold" />
                </div>
                <h2 className="text-balance text-lg font-bold tracking-tight font-korean">Ask Chekki</h2>
              </div>
              
              <div className="flex-1 w-full bg-black/40 rounded-xl border border-white/5 p-4 flex flex-col justify-end gap-3 relative z-10">
                <div className="self-start bg-zinc-800/80 px-4 py-3 rounded-2xl rounded-tl-sm max-w-[85%] text-xs md:text-sm text-zinc-300 font-korean leading-relaxed border border-white/5">
                  {language === 'ko' ? '오늘 배운 내용 중 이해 안 되는 부분이 있나요?' : 'Is there anything you didn\'t understand today?'}
                </div>
                <div className="w-full mt-2 relative z-[100]">
                  <AskChekkiBar
                    query={askQuery}
                    setQuery={setAskQuery}
                    onSubmit={handleAskSubmit}
                    isAsking={isAskAsking}
                    language={language}
                    isNight={isDark}
                  />
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ── Interactive Practice Room Modal ─────────────────────────────────────────── */}
      {isPracticing && (
        <div className="fixed inset-0 z-[300] bg-black/90 backdrop-blur-2xl flex items-center justify-center p-4">
          <div className="relative w-full max-w-2xl bg-zinc-900 border border-white/10 rounded-[2rem] p-6 md:p-10 shadow-2xl">
            {/* Close */}
            <button
              onClick={handleResetPractice}
              className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
            >
              <X size={18} weight="bold" />
            </button>

            {practiceDone ? (
              <div className="flex flex-col items-center gap-6 py-8 text-center">
                <Trophy size={64} className="text-emerald-400" weight="fill" />
                <h2 className="text-3xl font-black text-white">
                  {language === 'ko' ? '연습 완료!' : 'Practice Complete!'}
                </h2>
                <p className="text-4xl font-black text-white mb-2">
                  {score}/{mistakes.length}
                </p>
                <p className="text-zinc-400 mb-8 font-korean">
                  {language === 'ko'
                    ? score === mistakes.length ? '발음이 완벽해요! 🎉' : '꾸준히 연습하면 더 좋아질 거에요!'
                    : score === mistakes.length ? 'Perfect pronunciation! 🎉' : 'Keep practicing, you are doing great!'}
                </p>
                <button
                  onClick={handleStartPractice}
                  className="mt-4 px-8 py-3 bg-emerald-500 text-white font-bold rounded-full hover:bg-emerald-600 transition-all duration-200 active:scale-[0.97] font-korean"
                >
                  {language === 'ko' ? '다시 연습하기' : 'Practice Again'}
                </button>
              </div>
            ) : (() => {
              const current = mistakes[practiceIndex];
              return (
                <div className="flex flex-col gap-6 items-center text-center">
                  <div className="w-full flex items-center justify-between mb-4">
                    <span className="font-bold">
                      {practiceIndex + 1} / {mistakes.length}
                    </span>
                    <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-orange-500 transition-all duration-200"
                        style={{ width: `${((practiceIndex + 1) / mistakes.length) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-emerald-400">{score} ✓</span>
                  </div>

                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">
                    {language === 'ko' ? '다음 문장을 소리 내어 읽어보세요' : 'Read the sentence out loud'}
                  </p>
                  
                  <div className="bg-black/40 rounded-2xl p-6 border border-white/5 w-full">
                    <p className="text-sm text-zinc-500 line-through mb-2">{current.question_text}</p>
                    <p 
                      className="text-2xl md:text-3xl font-bold text-emerald-400 mb-4 cursor-pointer active:scale-95 transition-transform"
                      onClick={() => {
                        const correctText = cleanAnswerText(current.correct_answer || '');
                        setSpokenText(correctText);
                        checkPronunciation(correctText);
                      }}
                      title={language === 'ko' ? '정답으로 바로 넘어가기' : 'Tap to skip speech recognition'}
                    >
                      {cleanAnswerText(current.correct_answer || '')}
                    </p>
                    
                    <div className="h-20 flex items-center justify-center bg-white/5 rounded-xl border border-white/5 relative overflow-hidden">
                      {isListening && <div className="absolute inset-0 bg-emerald-500/10 animate-pulse" />}
                      <p className={`text-lg font-medium relative z-10 px-4 ${spokenText ? 'text-white' : 'text-zinc-600'}`}>
                        {spokenText || (language === 'ko' ? '(마이크 버튼을 누르고 말하세요)' : '(Tap the mic and speak)')}
                      </p>
                    </div>
                  </div>

                  {practiceStatus === 'idle' && (
                    <div className="flex flex-col items-center gap-4">
                      <button
                        onClick={handleMicPress}
                        className={`group relative w-24 h-24 rounded-full flex items-center justify-center transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] outline-none ${
                          isListening 
                            ? 'active:scale-[0.97] shadow-[0_0_40px_rgba(239,68,68,0.4)]' 
                            : 'hover:scale-[1.02] active:scale-[0.97] shadow-[0_0_40px_rgba(16,185,129,0.2)] hover:shadow-[0_0_60px_rgba(16,185,129,0.4)]'
                        }`}
                      >
                        <div className={`absolute inset-0 rounded-full transition-colors duration-700 ${isListening ? 'bg-red-500/20' : 'bg-emerald-500/20'}`} />
                        <div className={`relative z-10 w-[calc(100%-1rem)] h-[calc(100%-1rem)] rounded-full flex items-center justify-center transition-colors duration-700 shadow-[inset_0_1px_2px_rgba(255,255,255,0.2)] ${isListening ? 'bg-red-500' : 'bg-emerald-500'}`}>
                          {isListening && <div className="absolute inset-0 rounded-full border-2 border-red-300 animate-ping opacity-50" />}
                          <MicrophoneStage size={36} weight="fill" className="text-white relative z-10 transition-transform duration-700 group-hover:scale-110" />
                        </div>
                      </button>
                      {isListening && (
                        <span className="text-xs text-red-400 font-bold tracking-widest uppercase animate-fade-in cursor-pointer" onClick={handleMicPress}>
                          {language === 'ko' ? '정지 / 취소' : 'Stop / Cancel'}
                        </span>
                      )}
                    </div>
                  )}

                  {practiceStatus === 'success' && (
                    <div className="flex flex-col items-center gap-6 animate-fade-in w-full">
                      <div className="flex items-center gap-3 text-emerald-400 bg-emerald-500/10 px-6 py-3 rounded-full border border-emerald-500/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
                        <CheckCircle size={24} weight="fill" />
                        <span className="text-lg font-bold font-korean">{language === 'ko' ? '완벽해요!' : 'Perfect!'}</span>
                      </div>
                      <button
                        onClick={handleNextPractice}
                        className="group relative overflow-hidden pl-8 pr-2 py-2 w-full sm:w-auto bg-emerald-500 text-white font-bold rounded-full text-lg flex items-center justify-between gap-8 transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] shadow-2xl shadow-emerald-500/20 outline-none"
                      >
                        <span className="font-bold text-sm">
                          {practiceIndex + 1 >= mistakes.length
                            ? (language === 'ko' ? '결과 보기' : 'See Results')
                            : (language === 'ko' ? '다음 문장' : 'Next Sentence')}
                        </span>
                        <div className="w-10 h-10 rounded-full bg-black/20 flex items-center justify-center transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-[1.02] group-hover:translate-x-1 group-hover:-translate-y-[1px]">
                          <CaretRight size={20} weight="bold" />
                        </div>
                      </button>
                    </div>
                  )}

                  {practiceStatus === 'failed' && (
                    <div className="flex flex-col items-center gap-6 animate-fade-in w-full">
                      <div className="flex items-center gap-3 text-red-400 bg-red-500/10 px-6 py-3 rounded-full border border-red-500/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
                        <XCircle size={24} weight="fill" />
                        <span className="text-lg font-bold font-korean">{language === 'ko' ? '조금 아쉬워요. 다시 해볼까요?' : 'Not quite. Let\'s try again!'}</span>
                      </div>
                      <button
                        onClick={() => {
                          setPracticeStatus('idle');
                          setSpokenText("");
                        }}
                        className="group relative overflow-hidden pl-8 pr-2 py-2 w-full sm:w-auto bg-white/10 text-white font-bold rounded-full border border-white/20 hover:bg-white/20 text-lg flex items-center justify-between gap-8 transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] outline-none"
                      >
                        <span className="relative z-10 font-korean">
                          {language === 'ko' ? '다시 말하기' : 'Try Again'}
                        </span>
                        <div className="w-10 h-10 rounded-full bg-black/20 flex items-center justify-center transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-[1.02] group-hover:-rotate-90">
                          <ArrowsClockwise size={20} weight="bold" />
                        </div>
                      </button>
                    </div>
                  )}

                </div>
              );
            })()}
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

