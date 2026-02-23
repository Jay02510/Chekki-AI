
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

                {/* --- SUBSCRIPTION PLANS --- */}
                <div className="px-6 md:px-10 mb-8 shrink-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Standard Plan */}
                        <div className="bg-orange-500/10 border-2 border-orange-500/30 rounded-3xl p-6 relative overflow-hidden group hover:border-orange-500 transition-all cursor-pointer">
                            <div className="absolute top-0 right-0 bg-orange-500 text-white text-[9px] font-black px-3 py-1 rounded-bl-xl uppercase tracking-widest">Limited Offer</div>
                            <h3 className="text-white font-black text-xl mb-1">Standard Pro</h3>
                            <p className="text-zinc-500 text-xs mb-4">30 {language === 'ko' ? '일 이용권' : 'Days Access'}</p>
                            <div className="flex items-baseline gap-1 mb-6">
                                <span className="text-3xl font-black text-white">9,900원</span>
                                <span className="text-zinc-500 text-xs font-bold">/ {language === 'ko' ? '30일' : 'mo'}</span>
                            </div>
                            <ul className="space-y-2 mb-6">
                                <li className="flex items-center gap-2 text-[10px] text-zinc-300 font-bold uppercase tracking-wide">
                                    <span className="text-orange-500">✓</span> {language === 'ko' ? '제한 없는 AI 분석' : 'Unlimited AI Analysis'}
                                </li>
                                <li className="flex items-center gap-2 text-[10px] text-zinc-300 font-bold uppercase tracking-wide">
                                    <span className="text-orange-500">✓</span> {language === 'ko' ? '오답 노트 무제한 저장' : 'Unlimited Review Note'}
                                </li>
                                <li className="flex items-center gap-2 text-[10px] text-zinc-300 font-bold uppercase tracking-wide">
                                    <span className="text-orange-500">✓</span> {language === 'ko' ? '우선 순위 지원' : 'Priority Support'}
                                </li>
                            </ul>
                            <button className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-black rounded-xl text-xs uppercase tracking-widest transition-colors shadow-lg shadow-orange-500/20">
                                {language === 'ko' ? '지금 구독하기' : 'Subscribe Now'}
                            </button>
                        </div>

                        {/* Invite Code Option */}
                        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col justify-center items-center text-center">
                            <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-2xl mb-4">✨</div>
                            <h3 className="text-white font-black text-lg mb-2">Have a Code?</h3>
                            <p className="text-zinc-500 text-xs mb-6 max-w-[200px]">
                                {language === 'ko' ? '베타 초대 코드가 있다면 입력하여 무료로 시작하세요.' : 'Enter your invitation code to unlock pro features for free.'}
                            </p>
                            <button
                                onClick={() => setShowCodeInput(true)}
                                className="w-full py-3 bg-white/5 hover:bg-white/10 text-white border border-white/10 font-black rounded-xl text-xs uppercase tracking-widest transition-colors"
                            >
                                {language === 'ko' ? '코드 입력하기' : 'Enter Code'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* --- POLICY SUMMARIES --- */}
                <div className="px-6 md:px-10 mb-6 flex flex-wrap gap-4 justify-center md:justify-start">
                    <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
                        <span className="text-xs">📅</span>
                        <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">{language === 'ko' ? '서비스 기간: 30일' : 'Period: 30 Days'}</span>
                    </div>
                    <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
                        <span className="text-xs">🔄</span>
                        <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">{language === 'ko' ? '구독 해지: 상시 가능' : 'Cancel: Anytime'}</span>
                    </div>
                    <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
                        <span className="text-xs">💳</span>
                        <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">{language === 'ko' ? '환불: 7일 내 미사용 시' : 'Refund: Within 7 Days'}</span>
                    </div>
                </div>

                {showCodeInput && (
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
                                    onClick={() => setShowCodeInput(false)}
                                    className="w-full py-4 text-zinc-500 hover:text-zinc-300 font-black text-xs uppercase tracking-[0.2em] transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}

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
    );
};
