
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    featureName?: 'pronunciation' | 'audio' | 'guide';
}

export const PremiumUpsellModal: React.FC<Props> = ({ isOpen, onClose, featureName = 'pronunciation' }) => {
    const { upgradeToPro, processPayment } = useAuth();
    const { language, t } = useLanguage();

    const [showCodeInput, setShowCodeInput] = useState(false);
    const [betaCode, setBetaCode] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState(false);

    if (!isOpen) return null;

    const handleRedeem = async () => {
        if (!betaCode) return;
        setIsProcessing(true);
        setError(false);
        const success = await upgradeToPro(betaCode);
        if (success) {
            onClose();
        } else {
            setError(true);
            setIsProcessing(false);
        }
    };

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
            <div className="absolute inset-0 bg-black/85 backdrop-blur-xl animate-fade-in" onClick={onClose}></div>

            <div className="relative bg-zinc-900 rounded-t-[2.5rem] md:rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-[0_0_80px_rgba(249,115,22,0.15)] border border-white/10 animate-fade-in-up">

                {/* Back Button */}
                <div className="p-4 flex items-center">
                    <button onClick={onClose} className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm font-bold active:scale-95">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
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
                        <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center text-white text-lg shrink-0 shadow-lg">
                            ⭐
                        </div>
                        <div className="flex-1">
                            <h4 className="text-white font-bold text-xs uppercase tracking-wide">Chekki Pro</h4>
                            <p className="text-[10px] text-zinc-400 font-medium">
                                {language === 'ko'
                                    ? '발음 연습, 원어민 음성, 티칭 가이드 등 모든 프리미엄 기능'
                                    : 'Pronunciation coach, native audio, teaching guides & more'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="px-6 pb-8 space-y-3">
                    <div className="space-y-3 animate-fade-in">
                        <button
                            onClick={async () => {
                                setIsProcessing(true);
                                const result = await processPayment();
                                if (result.success) {
                                    onClose();
                                } else {
                                    if (result.message) alert(result.message);
                                    setIsProcessing(false);
                                }
                            }}
                            disabled={isProcessing}
                            className="w-full py-4 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-black text-base shadow-xl disabled:opacity-50 active:scale-95 transition-all ring-2 ring-white/10 min-h-[52px] flex items-center justify-center gap-2"
                        >
                            {isProcessing ? (
                                <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : <span>💳</span>}
                            {language === 'ko' ? '카드 / 간편 결제' : 'Pay with Card / Easy Pay'}
                        </button>

                        <div className="flex items-center gap-3 py-2">
                            <div className="h-px flex-1 bg-white/5"></div>
                            <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">{language === 'ko' ? '또는' : 'OR'}</span>
                            <div className="h-px flex-1 bg-white/5"></div>
                        </div>

                        <div className="relative group">
                            <input
                                type="text"
                                value={betaCode}
                                onChange={(e) => setBetaCode(e.target.value.toUpperCase())}
                                placeholder={language === 'ko' ? "액세스 코드 입력" : "ENTER ACCESS CODE"}
                                className={`w-full bg-black/40 border ${error ? 'border-red-500' : 'border-zinc-700'} rounded-xl px-4 py-3 text-white text-center font-mono tracking-widest outline-none focus:border-orange-500 text-sm`}
                            />
                        </div>

                        <button
                            onClick={handleRedeem}
                            disabled={isProcessing || !betaCode}
                            className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-black text-xs uppercase tracking-[0.2em] transition-all border border-white/10"
                        >
                            {isProcessing && !betaCode ? '...' : (language === 'ko' ? '코드 사용하기' : 'Redeem Access')}
                        </button>

                        {error && (
                            <p className="text-center text-red-400 text-[10px] font-black uppercase tracking-widest">
                                {language === 'ko' ? '유효하지 않은 코드입니다' : 'Invalid code'}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
