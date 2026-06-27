import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, FilePdf, ChatCircleDots, TrendUp, CaretRight, Spinner, ArrowsClockwise, ListDashes, MicrophoneStage, CheckCircle, XCircle, Trophy } from '@phosphor-icons/react';
import { useLanguage } from '../contexts/LanguageContext';
import { generateAndSharePDF } from '../services/pdfService';
import { WorksheetItem } from '../types';
import { SpeechRecognition } from '@capgo/capacitor-speech-recognition';

interface DashboardProps {
  onClose: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onClose }) => {
  const { language } = useLanguage();
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // ── Voice Practice State ───────────────────────────────────────────────────
  const [isPracticing, setIsPracticing] = useState(false);
  const [practiceIndex, setPracticeIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [practiceDone, setPracticeDone] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [spokenText, setSpokenText] = useState("");
  const [practiceStatus, setPracticeStatus] = useState<'idle' | 'success' | 'failed'>('idle');

  // Mock mistake bank — in production this would come from Firestore
  const mockMistakes = [
    { question_text: "He don't like apples.", correct_answer: "He doesn't like apples." },
    { question_text: "I goes to school.", correct_answer: "I go to school." },
    { question_text: "She is play soccer.", correct_answer: "She is playing soccer." },
    { question_text: "Me like pizza.", correct_answer: "I like pizza." },
    { question_text: "They is happy.", correct_answer: "They are happy." },
  ];

  useEffect(() => {
    // Cleanup listeners on unmount
    return () => {
      SpeechRecognition.removeAllListeners().catch(() => {});
    };
  }, []);

  const handleStartPractice = () => {
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

  const handleMicPress = async () => {
    if (isListening) {
      await SpeechRecognition.stop().catch(() => {});
      setIsListening(false);
      return;
    }

    try {
      const perm = await SpeechRecognition.requestPermissions();
      if (perm.speechRecognition !== 'granted') {
        alert(language === 'ko' ? '마이크 권한이 필요합니다.' : 'Microphone permission is required.');
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

    } catch (e: any) {
      console.error(e);
      setIsListening(false);
      if (e.message !== 'recognition aborted') {
        alert(language === 'ko' ? '음성 인식에 실패했습니다. 다시 시도해주세요.' : 'Speech recognition failed. Try again.');
      }
    }
  };

  const checkPronunciation = (transcript: string) => {
    if (!transcript) return;
    const current = mockMistakes[practiceIndex];
    const target = normalizeString(current.correct_answer);
    const spoken = normalizeString(transcript);

    const targetWords = target.split(' ').filter(w => w.length > 0);
    const spokenWords = spoken.split(' ').filter(w => w.length > 0);
    
    // Count how many target words are present in spoken words
    const matchCount = targetWords.filter(word => spokenWords.includes(word)).length;
    
    // Pass if at least 60% of target words are matched (very forgiving for kids)
    const threshold = Math.max(1, Math.ceil(targetWords.length * 0.6));
    const isPass = spoken === target || spoken.includes(target) || matchCount >= threshold;

    if (isPass) {
      setPracticeStatus('success');
      setScore(s => s + 1);
    } else {
      setPracticeStatus('failed');
    }
  };

  const handleNextPractice = () => {
    if (practiceIndex + 1 >= mockMistakes.length) {
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

  const handleGeneratePdf = async (topic?: string) => {
    if (isGeneratingPdf) return;
    setIsGeneratingPdf(true);
    try {
      let mockItems: WorksheetItem[] = [];
      if (topic === 'Nouns & Pronouns') {
        mockItems = [
          { id: 1, type: 'fill_in', question_text: "Me like apples.", correct_answer: "I like apples.", teaching_script_ko: '', korean_guide: '' },
          { id: 2, type: 'fill_in', question_text: "This is he book.", correct_answer: "This is his book.", teaching_script_ko: '', korean_guide: '' },
          { id: 3, type: 'fill_in', question_text: "She goes to school with they.", correct_answer: "She goes to school with them.", teaching_script_ko: '', korean_guide: '' }
        ];
      } else if (topic === 'Action Verbs') {
        mockItems = [
          { id: 1, type: 'fill_in', question_text: "She run fast.", correct_answer: "She runs fast.", teaching_script_ko: '', korean_guide: '' },
          { id: 2, type: 'fill_in', question_text: "They is playing soccer.", correct_answer: "They are playing soccer.", teaching_script_ko: '', korean_guide: '' },
          { id: 3, type: 'fill_in', question_text: "He do not like carrots.", correct_answer: "He does not like carrots.", teaching_script_ko: '', korean_guide: '' }
        ];
      } else if (topic) {
        mockItems = [
          { id: 1, type: 'fill_in', question_text: `Example mistake for ${topic} 1`, correct_answer: `Correct answer 1`, teaching_script_ko: '', korean_guide: '' },
          { id: 2, type: 'fill_in', question_text: `Example mistake for ${topic} 2`, correct_answer: `Correct answer 2`, teaching_script_ko: '', korean_guide: '' },
          { id: 3, type: 'fill_in', question_text: `Example mistake for ${topic} 3`, correct_answer: `Correct answer 3`, teaching_script_ko: '', korean_guide: '' }
        ];
      } else {
        mockItems = [
          { id: 1, type: 'fill_in', question_text: "He don't like apples.", correct_answer: "He doesn't like apples.", teaching_script_ko: '', korean_guide: '' },
          { id: 2, type: 'fill_in', question_text: "I goes to school.", correct_answer: "I go to school.", teaching_script_ko: '', korean_guide: '' },
          { id: 3, type: 'fill_in', question_text: "She is play soccer.", correct_answer: "She is playing soccer.", teaching_script_ko: '', korean_guide: '' }
        ];
      }
      await generateAndSharePDF(mockItems);
    } catch (e) {
      console.error(e);
      alert(language === 'ko' ? 'PDF 생성에 실패했습니다.' : 'Failed to generate PDF');
    } finally {
      setIsGeneratingPdf(false);
    }
  };
  
  const cardShellClasses = "relative rounded-[2rem] p-1.5 bg-white/5 border border-white/10 group transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:scale-[0.98]";
  const cardCoreClasses = "relative w-full h-full rounded-[calc(2rem-0.375rem)] bg-zinc-950/80 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] flex flex-col p-6 md:p-8 overflow-hidden";

  return createPortal(
    <div className="fixed inset-0 z-[200] bg-[#050505] text-zinc-50 overflow-y-auto animate-fade-in font-sans">
      <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.03] bg-noise mix-blend-overlay" />
      
      <div className="relative z-10 flex items-center justify-between px-6 py-6 md:px-12 md:py-8 max-w-[1400px] mx-auto">
        <h1 className="text-balance text-2xl md:text-3xl font-black tracking-tighter flex items-center gap-2 font-korean">
          <span>{language === 'ko' ? '학습 대시보드' : 'Learning Dashboard'}</span>
        </h1>
        <button 
          onClick={onClose}
          className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors active:scale-95"
        >
          <X size={20} weight="bold" />
        </button>
      </div>

      <div className="relative z-10 px-6 md:px-12 mb-8 max-w-[1400px] mx-auto animate-fade-in-up" style={{ animationDelay: '100ms' }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold tracking-tight font-korean">{language === 'ko' ? '최근 스캔한 학습지' : 'Recent Worksheets'}</h2>
          <button className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors font-bold">{language === 'ko' ? '전체 보기' : 'View All'}</button>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar snap-x">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="min-w-[140px] md:min-w-[180px] aspect-[3/4] rounded-2xl bg-white/5 border border-white/10 shrink-0 overflow-hidden relative group cursor-pointer snap-start hover:border-white/20 transition-all hover:scale-[1.02]">
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent z-10" />
              <div className="absolute inset-0 bg-zinc-800 flex items-center justify-center opacity-50 group-hover:opacity-40 transition-opacity">
                <FilePdf size={32} className="text-white/20" />
              </div>
              <div className="absolute bottom-3 left-3 z-20">
                <div className="text-xs font-bold text-white mb-0.5">{language === 'ko' ? `학습지 ${i}` : `Worksheet ${i}`}</div>
                <div className="text-[10px] text-white/60">{i} {language === 'ko' ? '일 전' : 'days ago'}</div>
              </div>
            </div>
          ))}
        </div>
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
                  {language === 'ko' ? '오답 스피킹 연습' : 'Audio Practice Room'}
                </h2>
              </div>
              
              <p className="text-zinc-400 text-sm max-w-md mb-8 relative z-10 font-korean leading-relaxed">
                {language === 'ko' 
                  ? '오답 노트의 문장들을 아이가 직접 소리 내어 말해보며 완벽히 익힐 수 있게 해보세요.'
                  : 'Turn saved mistakes into an interactive speaking exercise so your child learns to pronounce it correctly.'}
              </p>

              <div className="flex-1 w-full bg-black/40 rounded-2xl border border-white/5 p-4 flex flex-col gap-3 overflow-y-auto relative z-10">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 mb-2">Past Mistakes</h3>
                {mockMistakes.slice(0, 3).map((mistake, i) => (
                  <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors cursor-default gap-3">
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-medium line-through text-zinc-500 decoration-red-500/50">{mistake.question_text}</span>
                      <span className="text-sm font-bold text-emerald-400">{mistake.correct_answer}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex justify-end relative z-10">
                <button 
                  onClick={handleStartPractice}
                  className={`group relative overflow-hidden px-8 py-3 bg-emerald-500 text-white font-bold rounded-full text-sm flex items-center justify-center gap-4 transition-all duration-300 active:scale-[0.96] shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:bg-emerald-600 font-korean`}
                >
                  <MicrophoneStage size={18} weight="bold" />
                  <span className="relative z-10">
                    {language === 'ko' ? '스피킹 연습 시작하기' : 'Start Audio Practice'}
                  </span>
                </button>
              </div>
            </div>
          </div>

          <div className={`md:col-span-4 md:row-span-1 ${cardShellClasses} min-h-[250px]`}>
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
                <div className="w-full mt-2 relative">
                  <input 
                    type="text" 
                    placeholder={language === 'ko' ? '질문 입력...' : 'Type a question...'} 
                    className="w-full bg-white/5 border border-white/10 rounded-full pl-5 pr-12 py-3 text-xs md:text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-white/20 transition-colors font-korean"
                  />
                  <button className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white hover:bg-blue-600 transition-colors">
                    <CaretRight size={14} weight="bold" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className={`md:col-span-4 md:row-span-1 ${cardShellClasses} min-h-[250px]`}>
            <div className={`${cardCoreClasses}`}>
              <div className="absolute bottom-0 right-0 w-48 h-48 bg-emerald-500/10 blur-[80px] rounded-full translate-x-1/4 translate-y-1/4 pointer-events-none" />
              
              <div className="flex items-center justify-between mb-6 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
                    <ListDashes size={20} weight="bold" />
                  </div>
                  <h2 className="text-balance text-lg font-bold tracking-tight font-korean">
                    {language === 'ko' ? '추천 워크시트' : 'Worksheet Examples'}
                  </h2>
                </div>
                <button 
                  onClick={handleRefreshExamples}
                  className="text-zinc-500 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10 active:scale-[0.98]"
                  aria-label="Refresh Examples"
                >
                  <ArrowsClockwise size={18} weight="bold" />
                </button>
              </div>
              
              <div className="flex-1 flex flex-col justify-center gap-3 relative z-10">
                {examples.map((example, i) => (
                  <button 
                    key={i}
                    onClick={() => handleGeneratePdf(example)}
                    disabled={isGeneratingPdf}
                    className="w-full text-left bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 transition-colors rounded-xl px-4 py-3 flex items-center justify-between group btn-press disabled:opacity-50"
                  >
                    <span className="text-sm font-medium text-zinc-300 group-hover:text-white">{example}</span>
                    {isGeneratingPdf ? (
                      <Spinner size={14} weight="bold" className="animate-spin text-emerald-400" />
                    ) : (
                      <CaretRight size={14} weight="bold" className="text-zinc-600 group-hover:text-emerald-400 transition-colors" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ── Audio Practice Room Modal ─────────────────────────────────────────── */}
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
                <p className="text-5xl font-black text-emerald-400">
                  {score}/{mockMistakes.length}
                </p>
                <p className="text-zinc-400 font-korean">
                  {language === 'ko'
                    ? score === mockMistakes.length ? '발음이 완벽해요! 🎉' : '꾸준히 연습하면 더 좋아질 거에요!'
                    : score === mockMistakes.length ? 'Perfect pronunciation! 🎉' : 'Keep practicing, you are doing great!'}
                </p>
                <button
                  onClick={handleStartPractice}
                  className="mt-4 px-8 py-3 bg-emerald-500 text-white font-bold rounded-full hover:bg-emerald-600 transition-colors font-korean"
                >
                  {language === 'ko' ? '다시 연습하기' : 'Practice Again'}
                </button>
              </div>
            ) : (() => {
              const current = mockMistakes[practiceIndex];
              return (
                <div className="flex flex-col gap-6 items-center text-center">
                  <div className="w-full flex items-center justify-between mb-4">
                    <span className="text-xs text-zinc-500 font-mono">
                      {practiceIndex + 1} / {mockMistakes.length}
                    </span>
                    <div className="flex-1 mx-4 h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: `${((practiceIndex + 1) / mockMistakes.length) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-emerald-400">{score} ✓</span>
                  </div>

                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">
                    {language === 'ko' ? '다음 문장을 소리 내어 읽어보세요' : 'Read the sentence out loud'}
                  </p>
                  
                  <div className="bg-black/40 rounded-2xl p-6 border border-white/5 w-full">
                    <p className="text-sm text-zinc-500 line-through mb-2">{current.question_text}</p>
                    <p className="text-2xl md:text-3xl font-bold text-emerald-400 mb-4">{current.correct_answer}</p>
                    
                    <div className="h-20 flex items-center justify-center bg-white/5 rounded-xl border border-white/5 relative overflow-hidden">
                      {isListening && <div className="absolute inset-0 bg-emerald-500/10 animate-pulse" />}
                      <p className={`text-lg font-medium relative z-10 px-4 ${spokenText ? 'text-white' : 'text-zinc-600'}`}>
                        {spokenText || (language === 'ko' ? '(마이크 버튼을 누르고 말하세요)' : '(Tap the mic and speak)')}
                      </p>
                    </div>
                  </div>

                  {practiceStatus === 'idle' && (
                    <button
                      onClick={handleMicPress}
                      className={`group relative w-24 h-24 rounded-full flex items-center justify-center transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] outline-none ${
                        isListening 
                          ? 'active:scale-95 shadow-[0_0_40px_rgba(239,68,68,0.4)]' 
                          : 'hover:scale-105 active:scale-95 shadow-[0_0_40px_rgba(16,185,129,0.2)] hover:shadow-[0_0_60px_rgba(16,185,129,0.4)]'
                      }`}
                    >
                      <div className={`absolute inset-0 rounded-full transition-colors duration-700 ${isListening ? 'bg-red-500/20' : 'bg-emerald-500/20'}`} />
                      <div className={`relative z-10 w-[calc(100%-1rem)] h-[calc(100%-1rem)] rounded-full flex items-center justify-center transition-colors duration-700 shadow-[inset_0_1px_2px_rgba(255,255,255,0.2)] ${isListening ? 'bg-red-500' : 'bg-emerald-500'}`}>
                        {isListening && <div className="absolute inset-0 rounded-full border-2 border-red-300 animate-ping opacity-50" />}
                        <MicrophoneStage size={36} weight="fill" className="text-white relative z-10 transition-transform duration-700 group-hover:scale-110" />
                      </div>
                    </button>
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
                        <span className="relative z-10 font-korean">
                          {practiceIndex + 1 >= mockMistakes.length
                            ? (language === 'ko' ? '결과 보기' : 'See Results')
                            : (language === 'ko' ? '다음 문장' : 'Next Sentence')}
                        </span>
                        <div className="w-10 h-10 rounded-full bg-black/20 flex items-center justify-center transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-105 group-hover:translate-x-1 group-hover:-translate-y-[1px]">
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
                        <div className="w-10 h-10 rounded-full bg-black/20 flex items-center justify-center transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-105 group-hover:-rotate-90">
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
    </div>,
    document.body
  );
};

