import React, { useState, useCallback } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { ASSETS } from '../constants';
import { FeedbackModal } from './FeedbackModal';
import { LegalType } from '../types';
import { Roundel } from './metro';
import { ArrowLeft, ChatCircleText, Heart, LockSimple, PlayCircle, X } from '@phosphor-icons/react';
import { useModalExit } from '../hooks/useModalExit';

interface HelpViewProps {
  isNight: boolean;
  onClose?: () => void;
}

export const HelpView: React.FC<HelpViewProps> = ({ isNight, onClose }) => {
  const { t, language } = useLanguage();
  const { isAuthenticated, checkQuestionLimit, incrementQuestion, openLoginModal } = useAuth();

  // Modals
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const { isClosing: isVideoClosing, close: closeVideo } = useModalExit(() =>
    setShowVideoModal(false)
  );

  const isKo = language === 'ko';
  const steps = [
    {
      ko: '찍으면 바로 채점',
      en: 'Snap and grade',
      koDesc: '아이가 푼 숙제를 찍으세요. 채키가 손글씨를 읽고 바로 채점해요.',
      enDesc: "Take a photo of the homework. Chekki reads your child's handwriting and grades it.",
    },
    {
      ko: '빠르게 또는 자세히',
      en: 'Quick or detailed',
      koDesc: '빠른 채점은 정답만, 튜터 모드는 원어민 발음과 쉬운 설명까지 보여줘요.',
      enDesc: 'Speed mode shows just the answers. Tutor mode adds native audio and a simple explanation.',
    },
    {
      ko: '틀린 문제는 대시보드에',
      en: 'Misses go to the dashboard',
      koDesc: '틀린 문제는 대시보드에 모여요. 따로 적어 둘 필요 없어요.',
      enDesc: 'Missed questions collect in the dashboard. No need to write them down.',
    },
    {
      ko: '아이와 같이 복습',
      en: 'Review together',
      koDesc: '모인 문제로 카드 놀이와 말하기 연습을 아이와 함께 해 보세요.',
      enDesc: 'Turn the saved misses into flashcards and speaking practice with your child.',
    },
  ];

  return (
    <div className="min-h-screen bg-ground pb-24 animate-fade-in">
      {showFeedbackModal && (
        <FeedbackModal onClose={() => setShowFeedbackModal(false)} isNight={isNight} warm />
      )}
      {showVideoModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div
            className={`absolute inset-0 bg-[#2b211a]/80 ${isVideoClosing ? 'modal-backdrop-exit' : 'animate-fade-in'}`}
            onClick={closeVideo}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label={isKo ? '사용 가이드 영상' : 'Walkthrough video'}
            className={`relative aspect-video w-full max-w-4xl overflow-hidden rounded-lg bg-black ${isVideoClosing ? 'modal-exit' : 'modal-enter'}`}
          >
            <video src={ASSETS.VIDEO_WALKTHROUGH} controls autoPlay className="h-full w-full" />
            <button
              onClick={closeVideo}
              aria-label={isKo ? '닫기' : 'Close'}
              className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-md bg-sign text-on-sign"
            >
              <X size={20} weight="bold" />
            </button>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-2xl px-4 pt-[calc(env(safe-area-inset-top)+1rem)]">
        {onClose && (
          <button
            onClick={onClose}
            className="-ml-2 flex min-h-11 items-center gap-2 rounded-md px-2 text-[15px] font-semibold text-ink-2 hover:text-ink"
          >
            <ArrowLeft size={18} weight="bold" />
            {t('btn_back') || (isKo ? '돌아가기' : 'Back')}
          </button>
        )}

        <h1 className="mt-4 text-[28px] font-extrabold tracking-[-0.02em] text-ink sm:text-[34px] break-keep">{t('how_title')}</h1>

        <ol className="mt-6 space-y-3">
          {steps.map((step, i) => (
            <li key={step.en} className="flex gap-4 rounded-md bg-surface p-4 ring-1 ring-inset ring-rule sm:p-5">
              <Roundel state={i === 0 ? 'current' : 'next'} size={36}>
                {i + 1}
              </Roundel>
              <div className="min-w-0">
                <h2 className="text-[17px] font-extrabold text-ink break-keep">{isKo ? step.ko : step.en}</h2>
                <p className="mt-1 text-[15px] leading-relaxed text-ink-2 break-keep">{isKo ? step.koDesc : step.enDesc}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <button
            onClick={() => setShowVideoModal(true)}
            className="btn-press flex min-h-14 items-center justify-center gap-2 rounded-md bg-line text-[16px] font-bold text-[#2b211a]"
          >
            <PlayCircle size={22} weight="fill" />
            {isKo ? '사용 가이드 영상 보기' : 'Watch the walkthrough'}
          </button>
          <button
            onClick={() => setShowFeedbackModal(true)}
            className="btn-press flex min-h-14 items-center justify-center gap-2 rounded-md bg-surface text-[16px] font-bold text-ink ring-1 ring-inset ring-rule hover:ring-ink-3"
          >
            <ChatCircleText size={20} weight="bold" />
            {isKo ? '의견 보내기' : 'Send feedback'}
          </button>
        </div>

        <h2 className="mt-12 text-[20px] font-extrabold tracking-[-0.02em] text-ink break-keep">{t('trust_title')}</h2>
        <div className="mt-4 space-y-3">
          {[
            { icon: <LockSimple size={20} weight="bold" />, title: t('trust_privacy'), desc: t('trust_privacy_desc') },
            { icon: <Heart size={20} weight="bold" />, title: t('trust_safety'), desc: t('trust_safety_desc') },
          ].map((row) => (
            <div key={row.title} className="flex gap-4 rounded-md bg-surface p-4 ring-1 ring-inset ring-rule sm:p-5">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-line-soft text-line-ink">
                {row.icon}
              </span>
              <div className="min-w-0">
                <h3 className="text-[17px] font-extrabold text-ink break-keep">{row.title}</h3>
                <p className="mt-1 text-[15px] leading-relaxed text-ink-2 break-keep">{row.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
