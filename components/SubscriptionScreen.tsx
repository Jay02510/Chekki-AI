
import React, { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { subscriptionService, AppleProducts } from '../services/subscriptionService';
import { revenueCatService } from '../services/revenueCatService';
import { LegalModal } from './LegalModal';
import { AppleLogo } from './AppleLogo';
import { SCREENSHOT_MODE } from '../config';

// ─── Sub-components ───────────────────────────────────────────────────────────

const AppleSubscriptionView: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
    const { processPayment, restorePurchases } = useAuth();
    const { language, t } = useLanguage();
    const [products, setProducts] = useState<any[]>([]);
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
        
        // Find the full product object better trial/introductory offer detection
        const productObj = products.find(p => p.identifier === selectedProduct) || selectedProduct;

        const result = await processPayment(productObj);
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

    const features = [
        { icon: '♾️', key: 'bene_unlimited' },
        { icon: '🪄', key: 'bene_tutor' },
        { icon: '📖', key: 'bene_scripts' },
        { icon: '✨', key: 'bene_overlays' },
        { icon: '🔊', key: 'bene_pronounce' },
        { icon: '🛡️', key: 'bene_anytime' },
    ];

    return (
        <div className="space-y-5">

            {/* ── Hero Headline ── */}
            <div className="text-center space-y-2 pb-2">
                <div className="inline-flex items-center gap-2 bg-orange-500/15 border border-orange-500/30 rounded-full px-4 py-1.5 mb-1">
                    <span className="text-orange-400 text-[10px] font-black uppercase tracking-[0.2em]">
                        {language === 'ko' ? '🎉 7일 무료 체험' : '🎉 7-Day Free Trial'}
                    </span>
                </div>
                <h2 className="text-2xl md:text-3xl font-black text-white leading-tight">
                    {t('sub_trial_headline')}
                </h2>
                <p className="text-zinc-400 text-sm font-medium leading-relaxed max-w-sm mx-auto">
                    {t('sub_trial_subtext')}
                </p>
            </div>

            {/* ── Features List ── */}
            <div className="bg-white/5 border border-white/10 rounded-[2rem] p-5 md:p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 sm:gap-x-6">
                    {features.map((item) => (
                        <div key={item.key} className="flex items-center gap-3 group">
                            <div className="w-8 h-8 md:w-9 md:h-9 rounded-xl bg-orange-500/10 flex items-center justify-center text-base flex-shrink-0 group-hover:scale-110 transition-transform">
                                {item.icon}
                            </div>
                            <span className="text-xs md:text-sm font-bold text-zinc-200 leading-tight">
                                {t(item.key as any)}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Plan Cards ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 items-start">

                {/* Yearly (featured first, larger) */}
                <button
                    onClick={() => setSelectedProduct(AppleProducts.YEARLY)}
                    className={`text-left rounded-[2rem] p-5 md:p-7 border-2 transition-all relative overflow-hidden group flex flex-col gap-1 lg:order-first ${selectedProduct === AppleProducts.YEARLY
                        ? 'bg-gradient-to-br from-orange-500/15 to-orange-500/5 border-orange-500 shadow-[0_30px_60px_rgba(249,115,22,0.2)]'
                        : 'bg-white/5 border-white/10 hover:border-white/30'}`}
                >
                    {/* Badges row */}
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-[9px] md:text-[10px] bg-emerald-500 text-white px-2.5 py-0.5 rounded-full font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20">
                            {t('sub_bestValue')}
                        </span>
                        <span className="text-[9px] md:text-[10px] bg-orange-500/20 text-orange-400 border border-orange-500/30 px-2.5 py-0.5 rounded-full font-black uppercase tracking-widest">
                            {t('sub_trial_badge')}
                        </span>
                    </div>

                    <p className="text-[10px] md:text-[11px] font-black text-zinc-400 uppercase tracking-[0.2em]">
                        {SCREENSHOT_MODE ? t('sub_yearly') : t('sub_yearly')}
                    </p>

                    <div className="flex items-baseline gap-1.5">
                        <p className="font-black text-white text-3xl md:text-4xl">
                            {SCREENSHOT_MODE ? t('sub_yearly') : (yearlyProduct?.priceString || '$69.99')}
                        </p>
                        {!SCREENSHOT_MODE && (
                            <p className="text-sm font-bold text-zinc-500">{t('sub_perYear')}</p>
                        )}
                    </div>

                    {!SCREENSHOT_MODE && (
                        <p className="text-[10px] md:text-[11px] text-emerald-400 font-black uppercase tracking-wide mt-0.5">
                            ✓ {t('sub_save_yearly')}
                        </p>
                    )}

                    {/* Selected indicator */}
                    {selectedProduct === AppleProducts.YEARLY && (
                        <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center">
                            <span className="text-white text-[10px]">✓</span>
                        </div>
                    )}
                </button>

                {/* Monthly */}
                <button
                    onClick={() => setSelectedProduct(AppleProducts.MONTHLY)}
                    className={`text-left rounded-[1.5rem] p-4 md:p-5 border-2 transition-all relative overflow-hidden group flex flex-col gap-1 ${selectedProduct === AppleProducts.MONTHLY
                        ? 'bg-orange-500/10 border-orange-500 shadow-[0_20px_40px_rgba(249,115,22,0.1)]'
                        : 'bg-white/5 border-white/10 hover:border-white/30'}`}
                >
                    <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[9px] bg-orange-500/20 text-orange-400 border border-orange-500/30 px-2 py-0.5 rounded-full font-black uppercase tracking-widest">
                            {t('sub_trial_badge')}
                        </span>
                    </div>
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">
                        {t('sub_monthly')}
                    </p>
                    <div className="flex items-baseline gap-1">
                        <p className="font-black text-white text-2xl md:text-3xl">
                            {SCREENSHOT_MODE ? t('sub_monthly') : (monthlyProduct?.priceString || '$6.99')}
                        </p>
                        {!SCREENSHOT_MODE && (
                            <p className="text-xs font-bold text-zinc-500">{t('sub_perMonth')}</p>
                        )}
                    </div>

                    {selectedProduct === AppleProducts.MONTHLY && (
                        <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center">
                            <span className="text-white text-[10px]">✓</span>
                        </div>
                    )}
                </button>
            </div>

            {/* ── CTA Button ── */}
            <div className="space-y-3">
                <button
                    onClick={handleSubscribe}
                    disabled={isProcessing}
                    className="w-full py-5 rounded-[2rem] bg-orange-500 hover:bg-orange-400 disabled:bg-zinc-800 disabled:text-zinc-500 text-white font-black text-lg shadow-2xl shadow-orange-500/40 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                >
                    {isProcessing ? (
                        <div className="w-5 h-5 border-[3px] border-white/20 border-t-white rounded-full animate-spin" />
                    ) : (
                        <>
                            <span>{t('sub_cta_trial')}</span>
                            <span className="text-orange-200 text-sm font-bold">
                                — {selectedProduct === AppleProducts.YEARLY
                                    ? (language === 'ko' ? '연간' : 'Yearly')
                                    : (language === 'ko' ? '월간' : 'Monthly')}
                            </span>
                        </>
                    )}
                </button>

                {error && (
                    <p className="text-center text-red-500 text-[10px] font-black uppercase tracking-widest">
                        {error}
                    </p>
                )}

                {/* Trust signals */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-y-1.5 gap-x-4 pt-1">
                    {[
                        { icon: '🔒', key: 'sub_trial_no_charge' },
                        { icon: '✓', key: 'sub_cancelAnytimeSettings' },
                        { icon: '↩', key: 'sub_trial_restore' },
                    ].map((item) => (
                        <span key={item.key} className="text-[9px] md:text-[10px] text-zinc-500 font-bold flex items-center gap-1">
                            <span>{item.icon}</span>
                            {t(item.key as any)}
                        </span>
                    ))}
                </div>
            </div>

            {/* ── Restore + Legal ── */}
            <div className="flex flex-col items-center gap-5">
                <button
                    onClick={handleRestore}
                    disabled={isProcessing}
                    className="text-zinc-400 hover:text-white font-black text-[10px] uppercase tracking-widest transition-colors"
                >
                    {t('sub_restore')}
                </button>

                <div className="bg-white/5 rounded-3xl p-5 border border-white/5 space-y-4 w-full">
                    <p className="text-[10px] text-zinc-500 leading-relaxed text-center font-medium">
                        {t('sub_disclosure_trial')}
                    </p>

                    <div className="flex justify-center gap-4 text-[10px] font-black uppercase tracking-widest">
                        <button
                            onClick={() => window.dispatchEvent(new CustomEvent('show-legal', { detail: 'privacy' }))}
                            className="text-orange-500 hover:underline"
                        >
                            {language === 'ko' ? '개인정보 처리방침' : 'Privacy Policy'}
                        </button>
                        <span className="text-zinc-800">|</span>
                        <button
                            onClick={() => window.dispatchEvent(new CustomEvent('show-legal', { detail: 'terms' }))}
                            className="text-orange-500 hover:underline"
                        >
                            {language === 'ko' ? '이용약관' : 'Terms of Use'}
                        </button>
                    </div>
                    <p className="text-[9px] text-zinc-600 text-center uppercase tracking-tight">
                        Subscription follows Apple Standard EULA
                    </p>
                </div>
            </div>
        </div>
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
        <div className="flex flex-col items-center justify-center text-center py-6 space-y-6">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-3xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-3xl md:text-4xl shadow-lg shadow-orange-500/10">
                📱
            </div>
            <div className="px-4">
                <h3 className="text-lg md:text-xl font-black text-white mb-2 leading-tight">
                    {t('sub_webHeadline')}
                </h3>
                <p className="text-[11px] md:text-xs text-zinc-400 max-w-[280px] mx-auto leading-relaxed">
                    {t('sub_webSubtext')}
                </p>
            </div>
            
            <div className="w-full max-w-xs space-y-3 px-4">
                <a
                    href="/subscribe"
                    className="w-full py-4 rounded-2xl bg-orange-500 hover:bg-orange-400 text-white font-black text-base shadow-xl shadow-orange-500/20 active:scale-95 transition-all text-center block"
                >
                    {t('sub_webCta')}
                </a>
                
                <div className="flex items-center justify-center gap-3 py-2 border-t border-white/5 mt-4 opacity-50">
                    <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-1">
                        <AppleLogo className="w-2 h-2" /> iOS
                    </span>
                    <span className="text-zinc-700">|</span>
                    <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-1">
                        🤖 Android ({language === 'ko' ? '준비 중' : 'Soon'})
                    </span>
                </div>
            </div>
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
