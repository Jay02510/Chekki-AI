
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

export const PaywallModal: React.FC = () => {
    const { showPaywall, setShowPaywall, upgradeToPro, user } = useAuth();
    const { t, language } = useLanguage();

    const [showCodeInput, setShowCodeInput] = useState(false);
    const [betaCode, setBetaCode] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState(false);

    if (!showPaywall) return null;

    const handleRedeem = async () => {
        if (!betaCode) return;
        setIsProcessing(true);
        setError(false);

        const success = await upgradeToPro(betaCode);
        if (success) {
            // Logic handled in AuthContext
        } else {
            setError(true);
            setIsProcessing(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 md:p-4">
            <div className="absolute inset-0 bg-black/90 backdrop-blur-xl animate-fade-in" onClick={() => setShowPaywall(false)}></div>

            <div className="relative bg-zinc-900 rounded-[2rem] md:rounded-[2.5rem] w-full max-w-4xl overflow-hidden shadow-[0_0_100px_rgba(249,115,22,0.2)] border border-white/10 animate-fade-in-up flex flex-col max-h-[92vh]">

                <div className="p-6 md:p-10 text-center relative overflow-hidden shrink-0">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-gradient-to-b from-orange-500/10 to-transparent pointer-events-none"></div>
                    <h2 className="text-2xl md:text-5xl font-black text-white mb-1 md:mb-2 font-display leading-tight">
                        {t('pw_title')}
                    </h2>
                    <p className="text-zinc-400 text-sm md:text-lg font-medium font-korean max-w-2xl mx-auto">
                        {t('pw_desc')}
                    </p>
                    <button onClick={() => setShowPaywall(false)} className="absolute top-4 right-6 md:top-6 md:right-8 text-zinc-500 hover:text-white transition-colors text-xl md:text-2xl p-1">✕</button>
                </div>

                {/* --- EARLY ACCESS ANNOUNCEMENT --- */}
                <div className="px-6 md:px-10 mb-6 shrink-0">
                    <div className="bg-orange-500/10 border border-orange-500/30 rounded-2xl p-6 flex flex-col md:flex-row items-center gap-6 shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                        <div className="w-16 h-16 rounded-2xl bg-orange-500 flex items-center justify-center text-white text-3xl shrink-0 shadow-lg shadow-orange-500/20 z-10">
                            ✨
                        </div>
                        <div className="flex-1 text-center md:text-left z-10">
                            <div className="flex flex-col md:flex-row items-center gap-2 mb-2">
                                <span className="bg-orange-500 text-white text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-widest">Invite Only</span>
                                <h4 className="text-white font-black text-xl md:text-2xl uppercase tracking-tight">Join our Early Access</h4>
                            </div>
                            <p className="text-sm md:text-base text-zinc-400 font-medium leading-relaxed max-w-xl">
                                {language === 'ko'
                                    ? "채키는 현재 '베타 기간'으로 모든 사용자분들께 무료로 제공되고 있습니다! 곧 정기 구독 서비스가 출시될 예정이며, 현재는 받은 초대 코드를 입력하여 곧바로 모든 기능을 사용해 보실 수 있습니다."
                                    : "Chekki is currently in a free beta period. Subscriptions are coming soon! For now, enter your invitation code to unlock all pro features immediately."}
                            </p>
                            <div className="mt-2 text-[10px] font-black text-orange-500/60 uppercase tracking-widest bg-orange-500/5 px-2 py-1 rounded-md inline-block border border-orange-500/10">
                                {t('subs_coming_soon')}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="px-6 md:px-10 pb-10 flex flex-col items-center flex-1 justify-center max-w-2xl mx-auto w-full">
                    <div className="w-full space-y-4 animate-fade-in-up">
                        <div className="relative">
                            <input
                                type="text"
                                value={betaCode}
                                onChange={(e) => {
                                    setBetaCode(e.target.value.toUpperCase());
                                    setError(false);
                                }}
                                autoFocus
                                placeholder={language === 'ko' ? "초대 코드 입력" : "ENTER INVITE CODE"}
                                className={`w-full bg-black/40 border-2 ${error ? 'border-red-500' : 'border-zinc-700'} rounded-2xl px-6 py-5 text-white text-center font-mono tracking-[0.3em] font-black outline-none focus:border-orange-500 text-lg md:text-2xl shadow-2xl transition-all placeholder:tracking-normal placeholder:font-sans placeholder:text-zinc-600`}
                            />
                            {error && (
                                <p className="absolute -bottom-6 left-0 right-0 text-center text-red-500 text-[10px] font-black uppercase tracking-widest animate-shake">
                                    {language === 'ko' ? "유효하지 않은 코드입니다" : "Invalid Invite Code"}
                                </p>
                            )}
                        </div>

                        <div className="flex flex-col gap-3 pt-4">
                            <button
                                onClick={handleRedeem}
                                disabled={isProcessing || !betaCode}
                                className="w-full py-5 rounded-2xl bg-orange-500 hover:bg-orange-600 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-black text-lg md:text-xl shadow-xl shadow-orange-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                            >
                                {isProcessing ? (
                                    <>
                                        <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        <span>VERIFYING...</span>
                                    </>
                                ) : (
                                    <span>REDEEM ACCESS</span>
                                )}
                            </button>

                            <button
                                onClick={() => setShowPaywall(false)}
                                className="w-full py-4 text-zinc-500 hover:text-zinc-300 font-black text-xs uppercase tracking-[0.2em] transition-colors"
                            >
                                Maybe Later
                            </button>
                        </div>
                    </div>

                    <div className="mt-12 flex flex-col items-center gap-4 w-full">
                        <div className="h-px w-12 bg-zinc-800"></div>
                        <div className="flex items-center gap-6">
                            <div className="flex flex-col items-center">
                                <span className="text-orange-500 text-xl mb-1">∞</span>
                                <span className="text-[8px] text-zinc-500 font-black uppercase tracking-widest">Unlimited</span>
                            </div>
                            <div className="flex flex-col items-center">
                                <span className="text-orange-500 text-xl mb-1">🪄</span>
                                <span className="text-[8px] text-zinc-500 font-black uppercase tracking-widest">AI Tools</span>
                            </div>
                            <div className="flex flex-col items-center">
                                <span className="text-orange-500 text-xl mb-1">🚀</span>
                                <span className="text-[8px] text-zinc-500 font-black uppercase tracking-widest">Priority</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
