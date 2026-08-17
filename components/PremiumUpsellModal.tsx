import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

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
  const { language } = useLanguage();

  if (!isOpen) return null;

  const featureInfo = {
    pronunciation: {
      icon: '🎤',
      title_en: 'Speaking Coach',
      title_ko: '발음 연습',
      desc_en:
        'Let your child practice speaking and earn digital stamps for correct pronunciation!',
      desc_ko: '아이가 원어민처럼 발음을 연습하고 디지털 도장을 받을 수 있어요!',
    },
    audio: {
      icon: '🔊',
      title_en: 'Native Pronunciation',
      title_ko: '원어민 발음 듣기',
      desc_en: 'Hear the correct pronunciation of each answer read aloud in natural English.',
      desc_ko: '각 답을 자연스러운 영어 원어민 발음으로 들을 수 있어요.',
    },
    guide: {
      icon: '📖',
      title_en: "Teacher's Guide",
      title_ko: '티칭 가이드',
      desc_en: 'Teach with absolute confidence using a step-by-step bilingual script.',
      desc_ko: '영어를 몰라도 완벽하게 지도할 수 있는 다정한 티칭 스크립트를 받아보세요.',
    },
  };

  const info = featureInfo[featureName];

  return createPortal(
    <div className="fixed inset-0 z-[10005] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/85 backdrop-blur-xl animate-fade-in"
        onClick={onClose}
      />

      <div className="relative p-1.5 bg-white/5 border border-white/10 rounded-[2rem] shadow-[0_50px_100px_rgba(0,0,0,0.5)] modal-enter flex flex-col max-h-[95vh] w-full max-w-md mx-2 sm:mx-4">
        <div
          className={`relative w-full h-full rounded-[calc(2rem-0.375rem)] ${isNight ? 'bg-brand-dark' : 'bg-white'} shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] flex flex-col overflow-hidden`}
        >
          {/* Back Button */}
          <div className="p-4 flex items-center">
            <button
              onClick={onClose}
              className={`flex items-center gap-2 ${isNight ? 'text-zinc-400 hover:text-white' : 'text-zinc-500 hover:text-zinc-900'} transition-colors text-sm font-bold active:scale-[0.97]`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              {language === 'ko' ? '뒤로' : 'Back'}
            </button>
          </div>

          {/* Feature Preview */}
          <div className="px-6 pb-6 text-center">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center text-4xl mx-auto mb-4 shadow-2xl shadow-orange-500/30">
              {info.icon}
            </div>
            <h2
              className={`text-xl font-black ${isNight ? 'text-white' : 'text-zinc-900'} mb-2 font-display break-keep`}
            >
              {language === 'ko' ? info.title_ko : info.title_en}
            </h2>
            <p
              className={`text-sm ${isNight ? 'text-zinc-400' : 'text-zinc-500'} font-korean leading-relaxed max-w-sm mx-auto break-keep`}
            >
              {language === 'ko' ? info.desc_ko : info.desc_en}
            </p>
          </div>

          {/* Pro Badge */}
          <div className="mx-6 mb-4">
            <div
              className={`${isNight ? 'bg-orange-500/10 border-orange-500/20' : 'bg-orange-50 border-orange-200'} rounded-2xl p-4 flex items-center gap-4`}
            >
              <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center text-white text-lg shrink-0 shadow-lg">
                ⭐
              </div>
              <div className="flex-1">
                <h4
                  className={`${isNight ? 'text-white' : 'text-orange-600'} font-bold text-xs uppercase tracking-wide`}
                >
                  Premium
                </h4>
                <p
                  className={`text-[10px] ${isNight ? 'text-zinc-400' : 'text-zinc-600'} font-medium break-keep`}
                >
                  {language === 'ko'
                    ? '매일 밤의 숙제 전쟁을 끝내줄 무제한 1초 채점과 자동 오답 워크시트'
                    : 'Stop the homework fights with unlimited Instant Grading and Automated Worksheets'}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="px-6 pb-8">
            {/* Primary CTA — opens PaywallModal which handles platform detection */}
            <button
              onClick={() => {
                onClose();
                setTimeout(
                  () =>
                    setShowPaywall(true, featureName === 'guide' ? 'moms_scripts' : featureName),
                  300
                );
              }}
              className="w-full py-4 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-black text-base shadow-xl active:scale-[0.97] transition-all ring-2 ring-white/10 min-h-[52px] flex items-center justify-center gap-2"
            >
              <span>💳</span>
              {language === 'ko' ? '구독 옵션 보기' : 'View Subscription Options'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
