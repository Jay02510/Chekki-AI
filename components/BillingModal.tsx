
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

interface Props {
    onClose: () => void;
}

export const BillingModal: React.FC<Props> = ({ onClose }) => {
    const { user, upgradeToPro, cancelSubscription, setShowPaywall } = useAuth();
    const { language, t } = useLanguage();
    const isPro = user?.plan === 'pro';
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);

    const formatDate = (isoStr?: string) => {
        if (!isoStr) return "N/A";
        return new Date(isoStr).toLocaleDateString(language === 'ko' ? 'ko-KR' : 'en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>

            <div className="relative bg-zinc-900 rounded-[2rem] w-full max-w-2xl shadow-2xl border border-white/5 overflow-hidden animate-fade-in-up">

                <div className="bg-zinc-950 px-8 py-6 border-b border-white/5 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">💳</span>
                        <h2 className="text-2xl font-black text-white font-display">Billing & Subscription</h2>
                    </div>
                    <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">✕</button>
                </div>

                <div className="p-12 flex flex-col items-center text-center space-y-6">
                    <div className="w-24 h-24 rounded-full bg-orange-500/10 flex items-center justify-center text-5xl mb-4 animate-bounce">
                        💳
                    </div>
                    <h3 className="text-3xl font-black text-white font-display uppercase tracking-tight">
                        {t('subs_coming_soon')}
                    </h3>
                    <p className="text-zinc-400 max-w-sm font-medium leading-relaxed">
                        {language === 'ko'
                            ? "채키를 사랑해주셔서 감사합니다! 더욱 편리한 정기 구독 서비스를 준비 중입니다. 베타 기간 동안은 모든 기능을 무료로 즐겨보세요."
                            : "Thank you for using Chekki! We are currently building a better subscription experience for you. Please enjoy all pro features for free during our beta period."}
                    </p>
                    <div className="h-px w-12 bg-zinc-800 my-4"></div>
                    <button
                        onClick={onClose}
                        className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                    >
                        Back to App
                    </button>
                </div>
            </div>
        </div>
    );
};
