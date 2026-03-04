
import React, { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { subscriptionService, AppleProducts } from '../services/subscriptionService';
import { Product } from '@capgo/native-purchases';
import { LegalModal } from './LegalModal';
import { AppleLogo } from './AppleLogo';

// ─── Sub-components ───────────────────────────────────────────────────────────

const AppleSubscriptionView: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
    const { processPayment, restorePurchases } = useAuth();
    const { language, t } = useLanguage();
    const [products, setProducts] = useState<Product[]>([]);
    const [selectedProduct, setSelectedProduct] = useState<string>(AppleProducts.YEARLY);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchProducts = async () => {
        setIsLoading(true);
        setError('');
        try {
            const p = await subscriptionService.fetchAppleProducts();
            if (p.length === 0) {
                setError(t('sub_load_error'));
            } else {
                setProducts(p);
            }
        } catch (err) {
            setError(t('sub_load_error'));
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const monthlyProduct = products.find(p => p.identifier === AppleProducts.MONTHLY);
    const yearlyProduct = products.find(p => p.identifier === AppleProducts.YEARLY);

    const handleSubscribe = async () => {
        setIsProcessing(true);
        setError('');
        const result = await processPayment(selectedProduct);
        if (!result.success) {
            setError(result.message || t('sub_error'));
        } else {
            onClose?.();
        }
        setIsProcessing(false);
    };

    const handleRestore = async () => {
        setIsProcessing(true);
        setError('');
        const result = await restorePurchases();
        if (result.success) {
            // Success logic is handled in AuthContext (updates status)
            // Show toast or alert if possible, or just close if pro
            onClose?.();
        } else {
            setError(result.message || t('sub_error'));
        }
        setIsProcessing(false);
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <div className="w-10 h-10 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
                <p className="text-zinc-500 text-sm font-bold">{t('sub_loading')}</p>
            </div>
        );
    }

    if (error && products.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
                <p className="text-zinc-400 text-sm font-medium max-w-xs">{error}</p>
                <button
                    onClick={fetchProducts}
                    className="px-8 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-black text-xs uppercase tracking-widest hover:bg-white/10 transition-all"
                >
                    {t('sub_retry')}
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Benefits List */}
            <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-6 md:p-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 md:gap-x-8 md:gap-y-6">
                    {[
                        { icon: '🪄', key: 'bene_unlimited' },
                        { icon: '🔊', key: 'bene_pronounce' },
                        { icon: '📖', key: 'bene_scripts' },
                        { icon: '⭐', key: 'bene_stamps' },
                        { icon: '🛡️', key: 'bene_anytime' },
                    ].map((item) => (
                        <div key={item.key} className="flex items-center gap-4 group">
                            <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center text-xl md:text-2xl group-hover:scale-110 transition-transform">
                                {item.icon}
                            </div>
                            <span className="text-sm md:text-lg font-bold text-zinc-200">{t(item.key as any)}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Plans */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                {/* Monthly */}
                <button
                    onClick={() => setSelectedProduct(AppleProducts.MONTHLY)}
                    className={`text-left rounded-[2rem] p-6 md:p-8 border-2 transition-all relative overflow-hidden group ${selectedProduct === AppleProducts.MONTHLY
                        ? 'bg-orange-500/10 border-orange-500 shadow-[0_20px_40px_rgba(249,115,22,0.1)]'
                        : 'bg-white/5 border-white/10 hover:border-white/20'}`}
                >
                    <p className="text-[10px] md:text-xs font-black text-zinc-500 uppercase tracking-[0.2em] mb-1">{t('sub_monthly')}</p>
                    <div className="flex items-baseline gap-1">
                        <p className="text-3xl md:text-4xl font-black text-white">
                            {monthlyProduct?.priceString || '$4.99'}
                        </p>
                        <p className="text-sm md:text-base font-bold text-zinc-500">{t('sub_perMonth')}</p>
                    </div>
                </button>

                {/* Yearly */}
                <button
                    onClick={() => setSelectedProduct(AppleProducts.YEARLY)}
                    className={`text-left rounded-[2.5rem] p-8 md:p-10 border-2 transition-all relative overflow-hidden group ${selectedProduct === AppleProducts.YEARLY
                        ? 'bg-orange-500/10 border-orange-500 shadow-[0_30px_60px_rgba(249,115,22,0.15)] scale-[1.02]'
                        : 'bg-white/5 border-white/10 hover:border-white/20'}`}
                >
                    <div className="absolute top-4 right-6">
                        <span className="text-[9px] md:text-xs bg-emerald-500 text-white px-3 py-1 rounded-full font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20">
                            {t('sub_bestValue')}
                        </span>
                    </div>
                    <p className="text-[10px] md:text-xs font-black text-zinc-500 uppercase tracking-[0.2em] mb-1">{t('sub_yearly')}</p>
                    <div className="flex items-baseline gap-1">
                        <p className="text-4xl md:text-5xl font-black text-white">
                            {yearlyProduct?.priceString || '$39.99'}
                        </p>
                        <p className="text-sm md:text-lg font-bold text-zinc-500">{t('sub_perYear')}</p>
                    </div>
                    <p className="text-[10px] md:text-xs text-emerald-500 font-black uppercase mt-2 group-hover:translate-x-1 transition-transform inline-flex items-center gap-1 leading-relaxed">
                        {language === 'ko' ? '기본 플랜 대비 33% 절약' : 'SAVE 33% OVER MONTHLY'} →
                    </p>
                </button>
            </div>

            {/* Disclosure & Legal */}
            <div className="space-y-6 pt-4">
                <div className="space-y-4">
                    <button
                        onClick={handleSubscribe}
                        disabled={isProcessing}
                        className="w-full py-5 rounded-[2rem] bg-orange-500 hover:bg-orange-600 disabled:bg-zinc-800 disabled:text-zinc-500 text-white font-black text-lg shadow-2xl shadow-orange-500/30 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                    >
                        {isProcessing ? (
                            <div className="w-5 h-5 border-3 border-white/20 border-t-white rounded-full animate-spin" />
                        ) : (
                            t('sub_subscribe')
                        )}
                    </button>

                    {error && (
                        <p className="text-center text-red-500 text-[10px] font-black uppercase tracking-widest animate-shake">
                            {error}
                        </p>
                    )}
                </div>

                <div className="flex flex-col items-center gap-6">
                    <button
                        onClick={handleRestore}
                        disabled={isProcessing}
                        className="text-zinc-400 hover:text-white font-black text-[10px] uppercase tracking-widest transition-colors"
                    >
                        {t('sub_restore')}
                    </button>

                    <div className="bg-white/5 rounded-3xl p-6 border border-white/5 space-y-4">
                        <p className="text-[10px] text-zinc-500 leading-relaxed text-center font-medium">
                            {t('sub_disclosure')}
                        </p>

                        <div className="flex justify-center gap-4 text-[10px] font-black uppercase tracking-widest">
                            <a
                                href="https://chekki-ai.vercel.app/privacy"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-orange-500 hover:underline"
                            >
                                {language === 'ko' ? '개인정보 처리방침' : 'Privacy Policy'}
                            </a>
                            <span className="text-zinc-800">|</span>
                            <a
                                href="https://chekki-ai.vercel.app/terms"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-orange-500 hover:underline"
                            >
                                {language === 'ko' ? '이용약관' : 'Terms of Use'}
                            </a>
                        </div>
                    </div>
                </div>
            </div >
        </div >
    );
};

const AndroidSubscriptionView: React.FC = () => {
    const { t } = useLanguage();
    return (
        <div className="flex flex-col items-center justify-center text-center py-12 space-y-4">
            <div className="w-20 h-20 rounded-3xl bg-green-500/10 border border-green-500/20 flex items-center justify-center text-4xl">
                🤖
            </div>
            <h3 className="text-xl font-black text-white">{t('sub_androidSoon')}</h3>
            <p className="text-sm text-zinc-400 max-w-xs leading-relaxed">
                {t('sub_androidSoonDesc')}
            </p>
        </div>
    );
};

const WebSubscriptionView: React.FC = () => {
    const { language, t } = useLanguage();
    return (
        <div className="flex flex-col items-center justify-center text-center py-8 space-y-6">
            <div className="w-20 h-20 rounded-3xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-4xl">
                📱
            </div>
            <div>
                <h3 className="text-xl font-black text-white mb-2">{t('sub_webHeadline')}</h3>
                <p className="text-sm text-zinc-400 max-w-xs leading-relaxed">{t('sub_webSubtext')}</p>
            </div>
            <a
                href="/subscribe"
                className="w-full max-w-xs py-4 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-black text-base shadow-xl shadow-orange-500/20 active:scale-95 transition-all text-center block"
            >
                {t('sub_webCta')}
            </a>
        </div>
    );
};

// ─── Main Export ──────────────────────────────────────────────────────────────

interface Props {
    onClose?: () => void;
}

export const SubscriptionScreen: React.FC<Props> = ({ onClose }) => {
    const { language, t } = useLanguage();
    const platform = Capacitor.getPlatform(); // 'ios' | 'android' | 'web'

    return (
        <div>
            {/* Header */}
            <div className="text-center mb-6">
                <h2 className="text-2xl md:text-3xl font-black text-white mb-1 font-display">
                    {t('sub_title')}
                </h2>
                <p className="text-zinc-400 text-sm font-medium">{t('sub_subtitle')}</p>

                <div className="mt-3 flex justify-center">
                    <span className="text-[9px] bg-white/5 border border-white/10 text-zinc-500 px-3 py-1 rounded-full font-black uppercase tracking-widest flex items-center gap-1.5">
                        {platform === 'ios' ? <><AppleLogo className="w-2.5 h-2.5" /> iOS</> : platform === 'android' ? '🤖 Android' : '🌐 Web'}
                    </span>
                </div>
            </div>

            {/* Platform-specific content */}
            {platform === 'ios' && <AppleSubscriptionView onClose={onClose} />}
            {platform === 'android' && <AndroidSubscriptionView />}
            {platform === 'web' && <WebSubscriptionView />}
        </div>
    );
};
