
import React, { useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { AppleLogo } from './AppleLogo';

interface Props {
    onClose: () => void;
}

export const BillingModal: React.FC<Props> = ({ onClose }) => {
    const { user, subscriptionRecord, cancelSubscription, setShowPaywall } = useAuth();
    const { language, t } = useLanguage();
    const isPro = user?.plan === 'pro';
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);
    const platform = Capacitor.getPlatform();

    const formatDate = (isoStr?: string | null) => {
        if (!isoStr) return 'N/A';
        return new Date(isoStr).toLocaleDateString(language === 'ko' ? 'ko-KR' : 'en-US', {
            year: 'numeric', month: 'long', day: 'numeric'
        });
    };

    const platformBadge = () => {
        const p = subscriptionRecord?.subscription_platform;
        if (!p || p === 'none') return null;
        const badgeContent = () => {
            if (p === 'apple') return <><AppleLogo className="w-2.5 h-2.5" /> {t('sub_platformApple')}</>;
            if (p === 'google') return <>{'🤖 ' + t('sub_platformGoogle')}</>;
            if (p === 'web') return <>{'🌐 ' + t('sub_platformWeb')}</>;
            return p;
        };

        return (
            <span className="text-[9px] bg-orange-500/10 border border-orange-500/20 text-orange-400 px-3 py-1 rounded-full font-black uppercase tracking-widest flex items-center gap-1.5">
                {badgeContent()}
            </span>
        );
    };

    const cancelInstructions = () => {
        if (subscriptionRecord?.subscription_platform === 'apple') {
            return language === 'ko'
                ? 'Apple 구독을 취소하려면 iPhone의 설정 > [본인 이름] > 구독으로 이동하세요.'
                : 'To cancel your Apple subscription, go to Settings > [Your Name] > Subscriptions on your iPhone.';
        }
        if (subscriptionRecord?.subscription_platform === 'google') {
            return language === 'ko'
                ? 'Google Play 구독을 취소하려면 Google Play 스토어 > 구독으로 이동하세요.'
                : 'To cancel your Google subscription, go to Google Play Store > Subscriptions.';
        }
        return null;
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

            <div className="relative bg-zinc-900 rounded-[2rem] md:rounded-[3rem] w-full max-w-2xl md:max-w-3xl shadow-2xl border border-white/5 overflow-hidden animate-fade-in-up">

                <div className="bg-zinc-950 px-8 py-6 border-b border-white/5 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">💳</span>
                        <h2 className="text-2xl font-black text-white font-display">{t('billing_title')}</h2>
                    </div>
                    <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">✕</button>
                </div>

                <div className="p-10 flex flex-col items-center text-center space-y-5">
                    <div className="w-20 h-20 rounded-full bg-orange-500/10 flex items-center justify-center text-4xl">
                        💳
                    </div>

                    {subscriptionRecord?.subscription_status === 'active' ? (
                        <>
                            <h3 className="text-2xl font-black text-white font-display uppercase">{t('billing_active')}</h3>
                            {platformBadge()}
                            <div className="space-y-1.5 text-zinc-400 font-medium text-sm">
                                <p>{t('billing_plan')}: <span className="text-orange-500">
                                    {subscriptionRecord.apple_product_id === 'com.chekkiai.app.yearly' ? t('sub_yearly') : t('sub_monthly')}
                                </span></p>
                                {user?.subscriptionStartedAt && <p>{t('billing_started')}: {formatDate(user.subscriptionStartedAt)}</p>}
                                {user?.nextBillingDate && <p>{t('billing_next')}: {formatDate(user.nextBillingDate)}</p>}
                                {subscriptionRecord?.subscription_expiry_date && (
                                    <p>{t('billing_expires')}: {formatDate(subscriptionRecord.subscription_expiry_date)}</p>
                                )}
                                {user?.isCanceled && (
                                    <p className="text-red-400 text-xs font-bold mt-2">{t('billing_canceled_notice')}</p>
                                )}
                            </div>

                            {/* Cancel instructions — platform-specific */}
                            {cancelInstructions() && (
                                <div className="bg-zinc-800/50 border border-white/5 rounded-2xl p-4 max-w-sm text-left">
                                    <p className="text-[10px] text-zinc-400 leading-relaxed">{cancelInstructions()}</p>
                                </div>
                            )}
                        </>
                    ) : (
                        <>
                            <h3 className="text-2xl font-black text-white font-display uppercase">
                                {t('sub_no_active')}
                            </h3>
                            <p className="text-zinc-400 text-sm max-w-xs">
                                {language === 'ko'
                                    ? '모든 AI 기능을 무제한으로 사용하세요.'
                                    : 'Unlock all AI tools with unlimited access.'}
                            </p>
                            <button
                                onClick={() => { onClose(); setShowPaywall(true); }}
                                className="w-full max-w-xs bg-orange-500 hover:bg-orange-600 text-white py-4 rounded-2xl font-black text-sm shadow-xl shadow-orange-500/20 active:scale-95 transition-all"
                            >
                                {t('sub_subscribe_now')}
                            </button>
                        </>
                    )}

                    <div className="h-px w-12 bg-zinc-800" />
                    <button
                        onClick={onClose}
                        className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                    >
                        {t('billing_back')}
                    </button>
                </div>

                {showCancelConfirm && (
                    <div className="absolute inset-0 bg-zinc-950/95 backdrop-blur-md flex flex-col justify-center items-center p-8 text-center animate-fade-in z-50">
                        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center text-3xl mb-6">⚠️</div>
                        <h3 className="text-2xl font-black text-white font-display mb-2">{t('billing_cancel_btn')}</h3>
                        <p className="text-zinc-400 text-sm font-medium mb-8 max-w-sm">
                            {t('billing_cancel_desc')}
                        </p>
                        <div className="flex flex-col gap-3 w-full max-w-xs">
                            <button
                                onClick={async () => { await cancelSubscription(); setShowCancelConfirm(false); }}
                                className="w-full bg-red-500 hover:bg-red-600 text-white py-4 rounded-xl font-black transition-all active:scale-95"
                            >
                                {t('billing_cancel_yes')}
                            </button>
                            <button
                                onClick={() => setShowCancelConfirm(false)}
                                className="w-full bg-zinc-800 hover:bg-zinc-700 text-white py-4 rounded-xl font-black transition-all"
                            >
                                {t('billing_cancel_no')}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
