import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, FilePdf, ChatCircleDots, TrendUp, CaretRight, Spinner, ArrowsClockwise, ListDashes, ShareNetwork, GameController, CheckCircle, XCircle, Trophy } from '@phosphor-icons/react';
import { useLanguage } from '../contexts/LanguageContext';
import { generateAndSharePDF } from '../services/pdfService';
import { generateQuiz, QuizItem } from '../services/geminiService';
import { WorksheetItem } from '../types';

interface DashboardProps {
  onClose: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onClose }) => {
  const { language } = useLanguage();
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // ── Quiz State ───────────────────────────────────────────────────────────────
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [quizError, setQuizError] = useState<string | null>(null);
  const [quizItems, setQuizItems] = useState<QuizItem[]>([]);
  const [quizIndex, setQuizIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [quizDone, setQuizDone] = useState(false);
  const [quizBankSize, setQuizBankSize] = useState(0); // tracks how many real mistakes were used

  // Mock mistake bank — in production this would come from Firestore
  const mockMistakes = [
    { question_text: "He don't like apples.", correct_answer: "He doesn't like apples." },
    { question_text: "I goes to school.", correct_answer: "I go to school." },
    { question_text: "She is play soccer.", correct_answer: "She is playing soccer." },
    { question_text: "Me like pizza.", correct_answer: "I like pizza." },
    { question_text: "They is happy.", correct_answer: "They are happy." },
  ];

  const handleStartQuiz = async () => {
    setIsGeneratingQuiz(true);
    setQuizError(null);
    setQuizItems([]);
    setQuizIndex(0);
    setScore(0);
    setSelectedOption(null);
    setQuizDone(false);
    try {
      // Track real bank size for the UI hint
      setQuizBankSize(mockMistakes.length);
      const items = await generateQuiz(mockMistakes, language);
      setQuizItems(items);
    } catch (e: any) {
      setQuizError(e.message || 'Failed to generate quiz');
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  const handleSelectOption = (option: string) => {
    if (selectedOption !== null) return; // already answered
    setSelectedOption(option);
    if (option === quizItems[quizIndex]?.correct_answer) {
      setScore((s) => s + 1);
    }
  };

  const handleNextQuestion = () => {
    if (quizIndex + 1 >= quizItems.length) {
      setQuizDone(true);
    } else {
      setQuizIndex((i) => i + 1);
      setSelectedOption(null);
    }
  };

  const handleResetQuiz = () => {
    setQuizItems([]);
    setQuizIndex(0);
    setScore(0);
    setSelectedOption(null);
    setQuizDone(false);
    setQuizError(null);
  };

  const allExamples = [
    'Nouns & Pronouns', 'Action Verbs', 'Prepositions', 
    'Adjectives & Adverbs', 'Present Continuous', 'Past Tense', 
    'Future Tense', 'Articles (a, an, the)'
  ];
  const [examples, setExamples] = useState(allExamples.slice(0, 3));
  
  const handleRefreshExamples = () => {
    // Shuffle and pick 3
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
  
  // Outer shell for double-bezel cards
  const cardShellClasses = "relative rounded-[2rem] p-1.5 bg-white/5 border border-white/10 group transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:scale-[0.98]";
  // Inner core
  const cardCoreClasses = "relative w-full h-full rounded-[calc(2rem-0.375rem)] bg-zinc-950/80 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] flex flex-col p-6 md:p-8 overflow-hidden";

  return createPortal(
    <div className="fixed inset-0 z-[200] bg-[#050505] text-zinc-50 overflow-y-auto animate-fade-in font-sans">
      {/* Texture */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.03] bg-noise mix-blend-overlay" />
      
      {/* Header */}
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

      {/* Past Worksheets Gallery */}
      <div className="relative z-10 px-6 md:px-12 mb-8 max-w-[1400px] mx-auto animate-fade-in-up" style={{ animationDelay: '100ms' }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold tracking-tight font-korean">{language === 'ko' ? '최근 스캔한 학습지' : 'Recent Worksheets'}</h2>
          <button className="text-sm text-orange-400 hover:text-orange-300 transition-colors font-bold">{language === 'ko' ? '전체 보기' : 'View All'}</button>
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

      {/* Bento Grid Content */}
      <div className="relative z-10 px-4 md:px-12 pb-24 max-w-[1400px] mx-auto animate-fade-in-up" style={{ animationDelay: '200ms' }}>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6">
          
          {/* Main Vault / Worksheet Generator (col-span-8 row-span-2) */}
          <div className={`md:col-span-8 md:row-span-2 ${cardShellClasses} flex flex-col min-h-[350px] md:min-h-[450px]`}>
            <div className={`${cardCoreClasses}`}>
              {/* Premium 3D Background Asset */}
              <div 
                className="absolute top-0 right-0 w-[600px] h-[600px] pointer-events-none -translate-y-1/3 translate-x-1/3 opacity-30 mix-blend-screen"
                style={{ maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 70%)', WebkitMaskImage: 'radial-gradient(ellipse at center, black 30%, transparent 70%)' }}
              >
                <div className="absolute inset-0 bg-orange-500/30 blur-[100px] rounded-full" />
                <img src="/dashboard-bg.png" alt="3D Geometric UI Asset" className="w-full h-full object-cover scale-110" />
              </div>
              
              <div className="flex items-center gap-3 mb-6 relative z-10">
                <div className="w-10 h-10 rounded-full bg-orange-500/10 text-orange-400 flex items-center justify-center shrink-0 border border-orange-500/20">
                  <GameController size={20} weight="bold" />
                </div>
                <h2 className="text-balance text-xl font-bold tracking-tight font-korean">
                  {language === 'ko' ? '오답 인터랙티브 퀴즈 & 리포트' : 'Interactive Quizzes & Reports'}
                </h2>
              </div>
              
              <p className="text-zinc-400 text-sm max-w-md mb-8 relative z-10 font-korean leading-relaxed">
                {language === 'ko' 
                  ? '지금까지 저장된 오답을 바탕으로 아이가 재미있게 풀 수 있는 인터랙티브 퀴즈를 시작하거나 튜터에게 보낼 리포트를 공유하세요.'
                  : 'Turn saved mistakes into an interactive quiz for your child, or share a progress report directly with their tutor.'}
              </p>

              {/* Mock Past Mistakes List inside the vault */}
              <div className="flex-1 w-full bg-black/40 rounded-2xl border border-white/5 p-4 flex flex-col gap-3 overflow-y-auto relative z-10">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 mb-2">Past Mistakes (Mock)</h3>
                {[
                  { q: 'He don\'t like apples.', a: 'He doesn\'t like apples.', date: '2 hours ago' },
                  { q: 'I goes to school.', a: 'I go to school.', date: 'Yesterday' },
                  { q: 'She is play soccer.', a: 'She is playing soccer.', date: '3 days ago' },
                ].map((mistake, i) => (
                  <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors cursor-default gap-3">
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-medium line-through text-zinc-500 decoration-red-500/50">{mistake.q}</span>
                      <span className="text-sm font-bold text-orange-400">{mistake.a}</span>
                    </div>
                    <span className="text-xs text-zinc-600 font-mono shrink-0">{mistake.date}</span>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex flex-col sm:flex-row justify-end gap-3 relative z-10">
                <button 
                  onClick={() => alert(language === 'ko' ? '리포트 공유 기능은 준비 중입니다.' : 'Report sharing is coming soon.')}
                  className="px-6 py-3 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 text-white text-sm font-bold flex items-center justify-center gap-2 transition-all font-korean"
                >
                  <ShareNetwork size={18} />
                  {language === 'ko' ? '튜터에게 리포트 공유' : 'Share Progress Report'}
                </button>
                <button 
                  onClick={handleStartQuiz}
                  disabled={isGeneratingQuiz}
                  className={`group relative overflow-hidden pl-6 pr-2 py-2 bg-orange-500 text-white font-bold rounded-full text-sm flex items-center justify-center gap-4 transition-all duration-300 active:scale-[0.96] shadow-[0_0_20px_rgba(249,115,22,0.3)] hover:bg-orange-600 font-korean ${isGeneratingQuiz ? 'opacity-80 cursor-wait' : ''}`}
                >
                  <span className="relative z-10">
                    {isGeneratingQuiz 
                      ? (language === 'ko' ? '퀴즈 생성 중...' : 'Generating Quiz...')
                      : (language === 'ko' ? '퀴즈 시작하기' : 'Start Interactive Quiz')}
                  </span>
                  <div className="w-10 h-10 rounded-full bg-black/20 flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
                    {isGeneratingQuiz ? <Spinner size={16} weight="bold" className="animate-spin" /> : <CaretRight size={16} weight="bold" />}
                  </div>
                </button>
              </div>
              {quizError && (
                <p className="mt-3 text-sm text-red-400 font-korean text-right relative z-10">{quizError}</p>
              )}
            </div>
          </div>

          {/* Ask Chekki Inline Chat (col-span-4 row-span-1) */}
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

          {/* Worksheet Examples (col-span-4 row-span-1) */}
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

      {/* ── Interactive Quiz Modal ─────────────────────────────────────────── */}
      {(quizItems.length > 0 || isGeneratingQuiz) && (
        <div className="fixed inset-0 z-[300] bg-black/90 backdrop-blur-2xl flex items-center justify-center p-4">
          <div className="relative w-full max-w-2xl bg-zinc-900 border border-white/10 rounded-[2rem] p-6 md:p-10 shadow-2xl">
            {/* Close quiz */}
            <button
              onClick={handleResetQuiz}
              className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
            >
              <X size={18} weight="bold" />
            </button>

            {isGeneratingQuiz ? (
              <div className="flex flex-col items-center gap-6 py-12">
                <Spinner size={40} className="animate-spin text-orange-400" />
                <p className="text-zinc-400 font-korean text-base">
                  {language === 'ko' ? 'AI가 퀴즈를 만들고 있어요...' : 'AI is building your quiz...'}
                </p>
              </div>
            ) : quizDone ? (
              <div className="flex flex-col items-center gap-6 py-8 text-center">
                <Trophy size={64} className="text-orange-400" weight="fill" />
                <h2 className="text-3xl font-black text-white">
                  {language === 'ko' ? '퀴즈 완료!' : 'Quiz Complete!'}
                </h2>
                <p className="text-5xl font-black text-orange-400">
                  {score}/{quizItems.length}
                </p>
                <p className="text-zinc-400 font-korean">
                  {language === 'ko'
                    ? score === quizItems.length ? '완벽해요! 모두 맞췄어요 🎉' : `${quizItems.length - score}개를 더 연습해 보세요!`
                    : score === quizItems.length ? 'Perfect score! 🎉' : `Keep practicing! ${quizItems.length - score} to review.`}
                </p>
                <button
                  onClick={handleStartQuiz}
                  className="mt-4 px-8 py-3 bg-orange-500 text-white font-bold rounded-full hover:bg-orange-600 transition-colors font-korean"
                >
                  {language === 'ko' ? '다시 도전하기' : 'Try Again'}
                </button>
              </div>
            ) : (() => {
              const current = quizItems[quizIndex];
              return (
                <div className="flex flex-col gap-6">
                  {/* Progress */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-500 font-mono">
                      {quizIndex + 1} / {quizItems.length}
                    </span>
                    <div className="flex-1 mx-4 h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-orange-500 rounded-full transition-all duration-500"
                        style={{ width: `${((quizIndex + 1) / quizItems.length) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-orange-400">{score} ✓</span>
                  </div>

                  {/* Low bank hint — shows when fewer than 3 real mistakes were available */}
                  {quizBankSize < 3 && (
                    <div className="flex items-start gap-3 bg-orange-500/10 border border-orange-500/20 rounded-2xl px-4 py-3">
                      <span className="text-lg shrink-0">💡</span>
                      <p className="text-xs text-orange-300 font-korean leading-relaxed">
                        {language === 'ko'
                          ? `오답이 ${quizBankSize}개뿐이에요. AI가 추가 연습 문제를 채워 ${quizItems.length}문제 퀴즈를 만들었어요. 더 많은 워크시트를 스캔하면 퀴즈가 더 풍성해져요!`
                          : `Only ${quizBankSize} mistake${quizBankSize === 1 ? '' : 's'} in your bank — AI padded it with extra practice to make a ${quizItems.length}-question quiz. Scan more worksheets to grow your bank!`}
                      </p>
                    </div>
                  )}

                  {/* Question */}
                  <div className="bg-black/40 rounded-2xl p-5 border border-white/5">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 mb-2">
                      {language === 'ko' ? '틀린 문장을 올바르게 고치세요' : 'Fix the incorrect sentence'}
                    </p>
                    <p className="text-lg md:text-xl font-bold text-white font-korean">{current.question}</p>
                  </div>

                  {/* Options */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {current.options.map((option) => {
                      const isSelected = selectedOption === option;
                      const isCorrect = option === current.correct_answer;
                      const revealed = selectedOption !== null;
                      let style = 'bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10 hover:border-white/20';
                      if (revealed && isCorrect) style = 'bg-emerald-500/20 border-emerald-500 text-emerald-300';
                      else if (revealed && isSelected && !isCorrect) style = 'bg-red-500/20 border-red-500 text-red-300';
                      return (
                        <button
                          key={option}
                          onClick={() => handleSelectOption(option)}
                          disabled={revealed}
                          className={`text-left p-4 rounded-2xl border-2 transition-all duration-200 font-korean text-sm font-medium flex items-center justify-between gap-3 ${style} ${!revealed ? 'active:scale-[0.98] cursor-pointer' : 'cursor-default'}`}
                        >
                          <span>{option}</span>
                          {revealed && isCorrect && <CheckCircle size={20} weight="fill" className="text-emerald-400 shrink-0" />}
                          {revealed && isSelected && !isCorrect && <XCircle size={20} weight="fill" className="text-red-400 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>

                  {/* Explanation + Next */}
                  {selectedOption && (
                    <div className="flex flex-col gap-4 animate-fade-in">
                      <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                        <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">
                          {language === 'ko' ? '설명' : 'Explanation'}
                        </p>
                        <p className="text-sm text-zinc-300 font-korean leading-relaxed">{current.explanation_ko}</p>
                      </div>
                      <button
                        onClick={handleNextQuestion}
                        className="self-end px-8 py-3 bg-orange-500 text-white font-bold rounded-full hover:bg-orange-600 transition-colors font-korean flex items-center gap-2"
                      >
                        {quizIndex + 1 >= quizItems.length
                          ? (language === 'ko' ? '결과 보기' : 'See Results')
                          : (language === 'ko' ? '다음 문제' : 'Next Question')}
                        <CaretRight size={16} weight="bold" />
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
