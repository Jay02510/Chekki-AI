import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useModalExit } from '../hooks/useModalExit';
import { useDialogA11y } from '../hooks/useDialogA11y';
import { BookOpenText, Check, Microphone, SpeakerHigh, X } from '@phosphor-icons/react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  featureName?: 'pronunciation' | 'audio' | 'guide';
  isNight?: boolean;
}

export const PremiumUpsellModal: React.FC<Props> = ({
  isOpen,
  onClose,
  featureName = 'pronunciation',
  isNight = false,
}) => {
  const { setShowPaywall } = useAuth();
  const { language, t } = useLanguage();
  const { isClosing, close } = useModalExit(onClose);
  const dialogRef = useDialogA11y<HTMLDivElement>({ isOpen, onClose: close });

  if (!isOpen) return null;

  const featureInfo = {
    pronunciation: {
      icon: Microphone,
      title_en: 'Speaking Coach',
      title_ko: '발음 연습',
      desc_en:
        'Let your child practice speaking and earn digital stamps for correct pronunciation!',
      desc_ko: '아이가 원어민처럼 발음을 연습하고 디지털 도장을 받을 수 있어요!',
    },
    audio: {
      icon: SpeakerHigh,
      title_en: 'Native Pronunciation',
      title_ko: '원어민 발음 듣기',
      desc_en: 'Hear the correct pronunciation of each answer read aloud in natural English.',
      desc_ko: '각 답을 자연스러운 영어 원어민 발음으로 들을 수 있어요.',
    },
    guide: {
      icon: BookOpenText,
      title_en: "Teacher's Guide",
      title_ko: '티칭 가이드',
      desc_en: 'Teach with absolute confidence using a step-by-step bilingual script.',
      desc_ko: '영어를 몰라도 완벽하게 지도할 수 있는 다정한 티칭 스크립트를 받아보세요.',
    },
  };

  const info = featureInfo[featureName];
  const isKo = language === 'ko';
  const Icon = info.icon;
  const perks = [t('bene_unlimited'), t('bene_scripts'), t('bene_pronounce')];

  return createPortal(
    <div className="fixed inset-0 z-[10005] flex items-end justify-center sm:items-center sm:p-4">
      <div
        className={`absolute inset-0 bg-[#2b211a]/55 ${isClosing ? 'modal-backdrop-exit' : 'animate-fade-in'}`}
        onClick={close}
        aria-hidden="true"
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="premium-upsell-title"
        tabIndex={-1}
        className={`relative w-full overflow-hidden rounded-t-lg bg-surface ring-1 ring-inset ring-rule shadow-[0_24px_60px_-20px_rgba(43,33,26,0.45)] sm:max-w-md sm:rounded-lg ${isClosing ? 'modal-exit' : 'modal-enter'}`}
      >
        <button
          onClick={close}
          aria-label={isKo ? '닫기' : 'Close'}
          className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-md text-ink-3 hover:bg-sunken hover:text-ink"
        >
          <X size={20} weight="bold" />
        </button>

        <div className="px-5 pb-6 pt-7 sm:px-6">
          <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-line-soft text-line-ink">
            <Icon size={28} weight="bold" />
          </span>
          <p className="mt-4 text-[13px] font-bold text-line-ink">Premium</p>
          <h2 id="premium-upsell-title" className="mt-0.5 text-[22px] font-extrabold tracking-[-0.02em] text-ink break-keep">
            {isKo ? info.title_ko : info.title_en}
          </h2>
          <p className="mt-1.5 text-[15px] leading-relaxed text-ink-2 break-keep">{isKo ? info.desc_ko : info.desc_en}</p>

          <ul className="mt-5 space-y-2.5 rounded-md bg-sunken px-4 py-4">
            {perks.map((perk) => (
              <li key={perk} className="flex items-start gap-2.5 text-[15px] font-semibold text-ink break-keep">
                <Check size={18} weight="bold" className="mt-0.5 shrink-0 text-line-ink" />
                {perk}
              </li>
            ))}
          </ul>

          {/* Opens PaywallModal, which handles platform detection */}
          <button
            onClick={() => {
              close();
              setTimeout(
                () => setShowPaywall(true, featureName === 'guide' ? 'moms_scripts' : featureName),
                300
              );
            }}
            className="btn-press mt-5 flex min-h-12 w-full items-center justify-center rounded-md bg-line text-[15px] font-bold text-[#2b211a]"
          >
            {isKo ? '요금제 보기' : 'See plans'}
          </button>
          <button
            onClick={close}
            className="mt-2 min-h-11 w-full rounded-md text-[14px] font-semibold text-ink-3 hover:text-ink"
          >
            {isKo ? '나중에' : 'Maybe later'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
