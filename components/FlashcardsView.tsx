import React, { useState, useEffect } from 'react';
import { X, Repeat } from '@phosphor-icons/react';
import { WorksheetItem } from '../types';
import { cleanAnswerText } from '../utils/speechUtils';
import { playSuccessSound, hapticLight, hapticSuccess, hapticError } from '../utils/feedbackUtils';
import confetti from 'canvas-confetti';
import { useDialogA11y } from '../hooks/useDialogA11y';

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
        colors: ['#ef7c1c', '#fdebd8', '#1f8a4c', '#3a2c22'],
        disableForReducedMotion: true,
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
  const isKo = language === 'ko';
  const dialogRef = useDialogA11y<HTMLDivElement>({ isOpen: true, onClose });
  const flip = () => {
    setIsFlipped((f) => !f);
    hapticLight();
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-ground tile-ground p-4 animate-fade-in">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="flashcards-title"
        tabIndex={-1}
        className="relative flex h-full max-h-[720px] w-full max-w-2xl flex-col"
      >
        {/* Header */}
        <div className="mb-4 flex shrink-0 items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 id="flashcards-title" className="text-[22px] font-extrabold tracking-[-0.02em] text-ink break-keep">
              {isKo ? '아이와 카드 놀이' : 'Flashcards together'}
            </h2>
            {!isDone && (
              <p className="num mt-0.5 text-[15px] font-semibold text-ink-3">
                {currentIndex + 1} / {mistakes.length}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label={isKo ? '닫기' : 'Close'}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-ink-3 ring-1 ring-inset ring-rule hover:text-ink hover:ring-ink-3"
          >
            <X size={20} weight="bold" />
          </button>
        </div>

        {/* progress along the line */}
        {!isDone && (
          <div className="mb-5 h-1.5 shrink-0 rounded-full bg-rule" aria-hidden="true">
            <div
              className="h-full rounded-full bg-line transition-[width] duration-500 ease-[var(--ease-arrive)]"
              style={{ width: `${(currentIndex / mistakes.length) * 100}%` }}
            />
          </div>
        )}

        {/* Content Area */}
        <div className="relative min-h-0 w-full flex-1" style={{ perspective: '1000px' }}>
          {isDone ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center rounded-lg bg-surface p-8 text-center ring-1 ring-inset ring-rule animate-fade-in">
              <img src="/images/chekki-thumbs.webp" alt="" className="h-28 w-28 object-contain" />
              <h3 className="mt-3 text-[28px] font-extrabold tracking-[-0.02em] text-ink break-keep">
                {isKo ? '다 했어요!' : 'All done!'}
              </h3>
              <p className="num mt-1 text-[17px] font-bold text-line-ink">
                {isKo ? `${mistakes.length}개 중 ${score}개 알았어요` : `Knew ${score} of ${mistakes.length}`}
              </p>
              <button
                onClick={() => {
                  setCurrentIndex(0);
                  setScore(0);
                  setIsFlipped(false);
                  setIsDone(false);
                }}
                className="btn-press mt-7 flex min-h-12 items-center gap-2 rounded-md bg-surface px-6 text-[15px] font-bold text-ink ring-1 ring-inset ring-rule hover:ring-ink-3"
              >
                <Repeat size={18} weight="bold" />
                {isKo ? '한 번 더 하기' : 'Play again'}
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="absolute inset-0 block cursor-pointer text-center"
              onClick={flip}
              aria-label={isFlipped ? (isKo ? '문제 다시 보기' : 'Show question') : isKo ? '정답 보기' : 'Show answer'}
            >
              <div
                className="absolute inset-0 transition-transform duration-500 ease-[var(--ease-arrive)] motion-reduce:transition-none"
                style={{
                  transformStyle: 'preserve-3d',
                  transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                }}
              >
                {/* Front of Card */}
                <div
                  className="absolute inset-0 flex flex-col items-center justify-center rounded-lg bg-surface p-8 ring-1 ring-inset ring-rule"
                  style={{ backfaceVisibility: 'hidden' }}
                >
                  <span className="absolute top-6 text-[14px] font-bold text-ink-3">{isKo ? '문제' : 'Question'}</span>
                  <p className="text-[26px] font-bold leading-relaxed text-ink md:text-[34px] break-keep">
                    {currentMistake?.question_text}
                  </p>
                  <span className="absolute bottom-6 text-[14px] font-semibold text-line-ink">
                    {isKo ? '눌러서 정답 보기' : 'Tap to see the answer'}
                  </span>
                </div>

                {/* Back of Card */}
                <div
                  className="absolute inset-0 flex flex-col items-center justify-center rounded-lg bg-line-soft p-8 ring-2 ring-inset ring-line"
                  style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                >
                  <span className="absolute top-6 text-[14px] font-bold text-line-ink">{isKo ? '정답' : 'Answer'}</span>
                  <p className="text-[34px] font-extrabold leading-tight text-ink md:text-[46px] break-keep">
                    {cleanAnswerText(currentMistake?.correct_answer || '')}
                  </p>
                </div>
              </div>
            </button>
          )}
        </div>

        {/* Controls: only once the answer is showing */}
        <div
          className={`mt-5 flex shrink-0 gap-3 transition-[opacity,transform] duration-200 ${isFlipped && !isDone ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-3 opacity-0'}`}
          aria-hidden={!(isFlipped && !isDone)}
        >
          <button
            onClick={() => handleNext(false)}
            tabIndex={isFlipped && !isDone ? 0 : -1}
            className="btn-press min-h-14 flex-1 rounded-md bg-surface text-[16px] font-bold text-ink ring-1 ring-inset ring-rule hover:ring-ink-3"
          >
            {isKo ? '다시 볼래요' : 'Again later'}
          </button>
          <button
            onClick={() => handleNext(true)}
            tabIndex={isFlipped && !isDone ? 0 : -1}
            className="btn-press min-h-14 flex-1 rounded-md bg-line text-[16px] font-extrabold text-[#2b211a]"
          >
            {isKo ? '알았어요!' : 'Got it!'}
          </button>
        </div>
      </div>
    </div>
  );
};
