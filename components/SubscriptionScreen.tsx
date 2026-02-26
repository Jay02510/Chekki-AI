
import React, { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { subscriptionService, AppleProducts } from '../services/subscriptionService';
import { Product } from '@capgo/native-purchases';

// ─── Sub-components ───────────────────────────────────────────────────────────

const AppleSubscriptionView: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
    const { processPayment, restorePurchases, user } = useAuth();
    const { language, t } = useLanguage();
    const [products, setProducts] = useState<Product[]>([]);
    const [selectedProduct, setSelectedProduct] = useState<string>(AppleProducts.MONTHLY);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        subscriptionService.fetchAppleProducts().then(p => {
            setProducts(p);
        });
    }, []);

    const monthlyProduct = products.find(p => p.identifier === AppleProducts.MONTHLY);
    const yearlyProduct = products.find(p => p.identifier === AppleProducts.YEARLY);

    const handleSubscribe = async () => {
        setIsProcessing(true);
        setError('');
        const result = await processPayment(selectedProduct);
        if (!result.success) {
            setError(result.message || t('sub_error'));
        }
        setIsProcessing(false);
    };

    const handleRestore = async () => {
        setIsProcessing(true);
        const result = await restorePurchases();
        if (!result.success) {
            setError(result.message || t('sub_error'));
        }
        setIsProcessing(false);
    };

    return (
        <div className="space-y-5">
            {/* Plans */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Monthly */}
                <button
                    onClick={() => setSelectedProduct(AppleProducts.MONTHLY)}
                    className={`text-left rounded-3xl p-6 border-2 transition-all relative overflow-hidden ${selectedProduct === AppleProducts.MONTHLY
                        ? 'bg-orange-500/10 border-orange-500'
                        : 'bg-white/5 border-white/10 hover:border-white/20'}`}
                >
                    <div className="absolute top-2 right-3">
                        <span className="text-[9px] bg-orange-500 text-white px-2 py-0.5 rounded-full font-black uppercase tracking-widest">
                            {t('sub_mostPopular')}
                        </span>
                    </div>
                    <p className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-1">{t('sub_monthly')}</p>
                    <p className="text-2xl font-black text-white">
                        {monthlyProduct ? monthlyProduct.priceString : '...'}
                        <span className="text-zinc-500 text-xs font-bold ml-1">{t('sub_perMonth')}</span>
                    </p>
                </button>

                {/* Yearly */}
                <button
                    onClick={() => setSelectedProduct(AppleProducts.YEARLY)}
                    className={`text-left rounded-3xl p-6 border-2 transition-all relative overflow-hidden ${selectedProduct === AppleProducts.YEARLY
                        ? 'bg-orange-500/10 border-orange-500'
                        : 'bg-white/5 border-white/10 hover:border-white/20'}`}
                >
                    <div className="absolute top-2 right-3">
                        <span className="text-[9px] bg-emerald-500 text-white px-2 py-0.5 rounded-full font-black uppercase tracking-widest">
                            {t('sub_bestValue')}
                        </span>
                    </div>
                    <p className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-1">{t('sub_yearly')}</p>
                    <p className="text-2xl font-black text-white">
                        {yearlyProduct ? yearlyProduct.priceString : '...'}
                        <span className="text-zinc-500 text-xs font-bold ml-1">{t('sub_perYear')}</span>
                    </p>
                </button>
            </div>

            {/* Feature list */}
            <ul className="space-y-2">
                {['✓ Unlimited AI Scans', '✓ Review Notes & Teaching Guides', '✓ Native Audio Pronunciation', `✓ ${t('sub_cancelAnytime')}`].map((f, i) => (
                    <li key={i} className="flex items-center gap-2 text-[11px] text-zinc-300 font-bold">
                        {language === 'ko' ? (
                            ['✓ AI 분석 무제한', '✓ 오답노트 및 티칭 가이드', '✓ 원어민 발음 듣기', `✓ ${t('sub_cancelAnytime')}`][i]
                        ) : f}
                    </li>
                ))}
            </ul>

            {error && (
                <p className="text-center text-red-400 text-[10px] font-black uppercase tracking-widest">{error}</p>
            )}

            {/* Subscribe CTA */}
            <button
                onClick={handleSubscribe}
                disabled={isProcessing}
                className="w-full py-4 rounded-2xl bg-orange-500 hover:bg-orange-600 disabled:bg-zinc-700 text-white font-black text-base shadow-xl shadow-orange-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
                {isProcessing && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                {isProcessing ? '...' : t('sub_subscribe')}
            </button>

            {/* Restore & Legal */}
            <div className="flex flex-col items-center gap-3 pt-2">
                <button
                    onClick={handleRestore}
                    disabled={isProcessing}
                    className="text-orange-500 hover:underline font-bold text-xs uppercase tracking-widest"
                >
                    {t('sub_restore')}
                </button>
                <p className="text-[9px] text-zinc-500 leading-relaxed text-center max-w-sm">
                    {t('sub_terms')}
                </p>
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

                {/* Platform badge */}
                <div className="mt-3 flex justify-center">
                    <span className="text-[9px] bg-white/5 border border-white/10 text-zinc-500 px-3 py-1 rounded-full font-black uppercase tracking-widest">
                        {platform === 'ios' ? '🍎 iOS' : platform === 'android' ? '🤖 Android' : '🌐 Web'}
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
