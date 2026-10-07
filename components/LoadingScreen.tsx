import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { ASSETS } from '../constants';

interface Props {
  onCancel?: () => void;
  isNight?: boolean;
  imageUrl?: string | null;
}

// While grading: the parent sees their own page being read by Chekki, and
// gets one warm thing to say to the child beside them. No percentage bar:
// grading time isn't knowable.
const PROMPTS = [
  { ko: '숙제 끝까지 다 했네! 정말 멋지다.', en: 'You finished all of it. That is amazing!' },
  { ko: '오늘 숙제 중에 뭐가 제일 쉬웠어?', en: 'Which one was the easiest today?' },
  { ko: '어려웠던 문제 하나만 엄마한테 알려 줄래?', en: 'Can you show me one that was hard?' },
  { ko: '이 단어 어떻게 읽는지 엄마한테 가르쳐 줄래?', en: 'Can you teach me how to read this word?' },
];

export const LoadingScreen: React.FC<Props> = ({ onCancel, imageUrl }) => {
  const { t, language } = useLanguage();
  const ko = language === 'ko';
  const [textIndex, setTextIndex] = useState(0);
  const [promptIndex, setPromptIndex] = useState(0);

  const statusTexts = useMemo(
    () => [t('loading_step0'), t('loading_step1'), t('loading_step2'), t('loading_step3'), t('loading_thorough')],
    [t]
  );

  useEffect(() => {
    const a = setInterval(() => setTextIndex((i) => (i + 1) % statusTexts.length), 2600);
    const b = setInterval(() => setPromptIndex((i) => (i + 1) % PROMPTS.length), 7000);
    return () => {
      clearInterval(a);
      clearInterval(b);
    };
  }, [statusTexts]);

  const prompt = PROMPTS[promptIndex];

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-ground tile-ground px-4 py-10">
      <div className="mx-auto flex min-h-full w-full max-w-md flex-col justify-center">
        {/* their page, being read */}
        <div className="relative mx-auto w-full max-w-[340px]">
          <div className="relative h-56 overflow-hidden rounded-lg bg-surface ring-1 ring-inset ring-rule sm:h-64">
            {imageUrl ? (
              <img src={imageUrl} alt="" className="h-full w-full object-cover object-top opacity-90" />
            ) : (
              <div className="h-full w-full bg-sunken" />
            )}
            <span className="chekki-scanline absolute inset-x-0 h-10 bg-gradient-to-b from-transparent via-line/35 to-transparent" aria-hidden="true">
              <span className="absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2 bg-line" />
            </span>
          </div>
          {/* the moving Chekki, peeking in */}
          <span className="absolute -bottom-8 -right-4 inline-flex h-28 w-28 overflow-hidden rounded-full border-[6px] border-ground bg-black ring-4 ring-line sm:-right-8">
            <img src={ASSETS.ANIM_ANALYZING} alt="" className="h-full w-full scale-125 object-cover" />
          </span>
        </div>

        <h1 className="sign-ko mt-14 text-center text-[28px] text-ink break-keep">
          {ko ? '채키가 채점하고 있어요' : 'Chekki is grading'}
        </h1>
        <p
          key={textIndex}
          role="status"
          aria-live="polite"
          className="mt-2 min-h-[1.5rem] text-center text-[15px] font-medium text-ink-3 animate-fade-in"
        >
          {statusTexts[textIndex]}
        </p>

        {/* something to do together while waiting */}
        <div className="mt-8 rounded-lg bg-line-soft px-6 py-5">
          <p className="text-[13px] font-bold text-line-ink">
            {ko ? '기다리는 동안, 아이에게 이렇게 말해 보세요' : 'While you wait, try saying'}
          </p>
          <p key={promptIndex} className="mt-1.5 text-[20px] font-extrabold leading-snug text-ink break-keep animate-fade-in">
            “{ko ? prompt.ko : prompt.en}”
          </p>
        </div>

        {onCancel && (
          <button
            onClick={onCancel}
            className="mx-auto mt-6 block min-h-11 rounded-md px-5 text-[14px] font-bold text-ink-3 hover:text-ink"
          >
            {t('btn_cancel_retry')}
          </button>
        )}
      </div>

      <style>{`
        @keyframes chekki-scan { 0% { top: -2.5rem; } 100% { top: 100%; } }
        .chekki-scanline { animation: chekki-scan 2.4s cubic-bezier(0.45, 0, 0.55, 1) infinite alternate; }
        @media (prefers-reduced-motion: reduce) { .chekki-scanline { animation: none; top: 45%; } }
      `}</style>
    </div>
  );
};
