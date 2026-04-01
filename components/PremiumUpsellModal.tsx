
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    featureName?: 'pronunciation' | 'audio' | 'guide';
}

export const PremiumUpsellModal: React.FC<Props> = ({ isOpen, onClose, featureName = 'pronunciation' }) => {
    const { setShowPaywall } = useAuth();
    const { language } = useLanguage();

    if (!isOpen) return null;

    const featureInfo = {
        pronunciation: {
            icon: '🎤',
            title_en: 'Speaking Coach',
            title_ko: '발음 연습',
            desc_en: 'Let your child practice speaking and earn digital stamps for correct pronunciation!',
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
            desc_en: 'Get a warm, step-by-step teaching script to read with your child.',
            desc_ko: '아이와 함께 읽을 수 있는 다정한 티칭 스크립트를 받아보세요.',
        },
    };

    const info = featureInfo[featureName];

    return (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4">
            <div className="absolute inset-0 bg-black/85 backdrop-blur-xl animate-fade-in" onClick={onClose} />

            <div className="relative bg-zinc-900 rounded-t-[2.5rem] md:rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-[0_0_80px_rgba(249,115,22,0.15)] border border-white/10 animate-fade-in-up">

                {/* Back Button */}
                <div className="p-4 flex items-center">
                    <button onClick={onClose} className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm font-bold active:scale-95">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                        </svg>
                        {language === 'ko' ? '뒤로' : 'Back'}
                    </button>
                </div>

                {/* Feature Preview */}
                <div className="px-6 pb-6 text-center">
                    <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center text-4xl mx-auto mb-4 shadow-2xl shadow-orange-500/30">
                        {info.icon}
                    </div>
                    <h2 className="text-xl font-black text-white mb-2 font-display">
                        {language === 'ko' ? info.title_ko : info.title_en}
                    </h2>
                    <p className="text-sm text-zinc-400 font-korean leading-relaxed max-w-sm mx-auto">
                        {language === 'ko' ? info.desc_ko : info.desc_en}
                    </p>
                </div>

                {/* Pro Badge */}
                <div className="mx-6 mb-4">
                    <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-4 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center text-white text-lg shrink-0 shadow-lg">⭐</div>
                        <div className="flex-1">
                            <h4 className="text-white font-bold text-xs uppercase tracking-wide">Premium</h4>
                            <p className="text-[10px] text-zinc-400 font-medium">
                                {language === 'ko'
                                    ? '무제한 스캔, AI 튜터, 티칭 가이드 등 모든 프리미엄 기능'
                                    : 'Unlimited magic scans, AI Tutor, teaching guides & more'}
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
                            setTimeout(() => setShowPaywall(true), 300);
                        }}
                        className="w-full py-4 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-black text-base shadow-xl active:scale-95 transition-all ring-2 ring-white/10 min-h-[52px] flex items-center justify-center gap-2"
                    >
                        <span>💳</span>
                        {language === 'ko' ? '구독 옵션 보기' : 'View Subscription Options'}
                    </button>
                </div>
            </div>
        </div>
    );
};
