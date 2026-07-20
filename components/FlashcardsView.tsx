import React, { useState, useEffect } from 'react';
import { X, CheckCircle, XCircle, Repeat, HandsClapping } from '@phosphor-icons/react';
import { WorksheetItem } from '../types';
import { cleanAnswerText } from '../utils/speechUtils';
import { playSuccessSound, hapticLight, hapticSuccess, hapticError } from '../utils/feedbackUtils';
import confetti from 'canvas-confetti';

interface FlashcardsViewProps {
  mistakes: WorksheetItem[];
  language: string;
  onClose: () => void;
}

export const FlashcardsView: React.FC<FlashcardsViewProps> = ({ mistakes, language, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [score, setScore] = useState(0);
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    if (isDone) {
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#10B981', '#F59E0B', '#3B82F6'],
      });
    }
  }, [isDone]);

  const handleNext = (correct: boolean) => {
    if (correct) {
      setScore((prev) => prev + 1);
      playSuccessSound();
      hapticSuccess();
    } else {
      hapticError();
    }

    setIsFlipped(false);

    setTimeout(() => {
      if (currentIndex < mistakes.length - 1) {
        setCurrentIndex((prev) => prev + 1);
      } else {
        setIsDone(true);
      }
    }, 300); // Wait for unflip animation
  };

  const currentMistake = mistakes[currentIndex];

  return (
    <div className="fixed inset-0 z-[300] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-4">
      <div className="relative w-full max-w-2xl bg-zinc-900 border border-white/10 rounded-[2.5rem] p-6 md:p-12 shadow-2xl flex flex-col h-[80vh] md:h-[600px]">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 shrink-0 relative z-10">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl md:text-2xl font-black text-white font-korean">
              {language === 'ko' ? '디지털 플래시카드' : 'Digital Flashcards'}
            </h2>
            {!isDone && (
              <span className="text-zinc-500 text-sm font-bold tracking-widest uppercase">
                {currentIndex + 1} / {mistakes.length}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors active:scale-[0.97]"
          >
            <X size={20} weight="bold" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 w-full relative" style={{ perspective: '1000px' }}>
          {isDone ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center animate-fade-in">
              <div className="w-24 h-24 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mb-6">
                <HandsClapping size={48} weight="fill" />
              </div>
              <h3 className="text-3xl font-black text-white mb-2 font-korean">
                {language === 'ko' ? '복습 완료!' : 'Review Complete!'}
              </h3>
              <p className="text-xl text-emerald-400 font-bold mb-8">
                {score} / {mistakes.length} {language === 'ko' ? '정답' : 'Correct'}
              </p>
              <button
                onClick={() => {
                  setCurrentIndex(0);
                  setScore(0);
                  setIsFlipped(false);
                  setIsDone(false);
                }}
                className="group px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-bold rounded-2xl transition-all duration-200 active:scale-[0.97] border border-white/5 flex items-center gap-3 font-korean"
              >
                <Repeat
                  size={20}
                  weight="bold"
                  className="group-hover:-rotate-180 transition-transform duration-200"
                />
                {language === 'ko' ? '다시 복습하기' : 'Review Again'}
              </button>
            </div>
          ) : (
            <div
              className="w-full h-full relative cursor-pointer group"
              onClick={() => {
                setIsFlipped(!isFlipped);
                hapticLight();
              }}
            >
              <div
                className="w-full h-full absolute transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)]"
                style={{
                  transformStyle: 'preserve-3d',
                  transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                }}
              >
                {/* Front of Card */}
                <div
                  className="absolute inset-0 bg-black/40 border border-white/10 rounded-3xl p-8 flex flex-col items-center justify-center text-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] hover:bg-white/5 transition-colors"
                  style={{ backfaceVisibility: 'hidden' }}
                >
                  <span className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 mb-6 absolute top-8">
                    {language === 'ko' ? '문제' : 'Question'}
                  </span>
                  <p className="text-2xl md:text-3xl lg:text-4xl font-medium text-white leading-relaxed">
                    {currentMistake?.question_text}
                  </p>
                  <p className="text-zinc-500 text-sm mt-8 absolute bottom-8 font-korean">
                    {language === 'ko' ? '카드를 탭해서 정답 확인하기' : 'Tap card to flip'}
                  </p>
                </div>

                {/* Back of Card */}
                <div
                  className="absolute inset-0 bg-emerald-900/20 border border-emerald-500/20 rounded-3xl p-8 flex flex-col items-center justify-center text-center shadow-[inset_0_1px_1px_rgba(16,185,129,0.1)]"
                  style={{
                    backfaceVisibility: 'hidden',
                    transform: 'rotateY(180deg)',
                  }}
                >
                  <span className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-500 mb-6 absolute top-8">
                    {language === 'ko' ? '정답' : 'Answer'}
                  </span>
                  <p className="text-3xl md:text-4xl lg:text-5xl font-black text-emerald-400 leading-tight">
                    {cleanAnswerText(currentMistake?.correct_answer || '')}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div
          className={`mt-8 flex items-center justify-center gap-4 transition-all duration-200 shrink-0 ${isFlipped && !isDone ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}
        >
          <button
            onClick={() => handleNext(false)}
            className="flex-1 py-4 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold rounded-2xl border border-red-500/20 transition-all duration-200 active:scale-[0.97] flex items-center justify-center gap-2 font-korean"
          >
            <XCircle size={24} weight="fill" />
            {language === 'ko' ? '다시 연습' : 'Needs Practice'}
          </button>
          <button
            onClick={() => handleNext(true)}
            className="flex-1 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-2xl transition-all duration-200 active:scale-[0.97] flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(16,185,129,0.3)] font-korean"
          >
            <CheckCircle size={24} weight="fill" />
            {language === 'ko' ? '맞았어요!' : 'Got it!'}
          </button>
        </div>
      </div>
    </div>
  );
};
