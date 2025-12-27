
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
      // Logic handled in AuthContext (closes modal)
    } else {
      setError(true);
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-xl animate-fade-in" onClick={() => setShowPaywall(false)}></div>
      
      <div className="relative bg-zinc-900 rounded-[2.5rem] w-full max-w-4xl overflow-hidden shadow-[0_0_100px_rgba(249,115,22,0.2)] border border-white/10 animate-fade-in-up">
        
        {/* Header Branding */}
        <div className="p-8 md:p-12 text-center relative overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-gradient-to-b from-orange-500/10 to-transparent pointer-events-none"></div>
            <h2 className="text-3xl md:text-5xl font-black text-white mb-4 font-display leading-tight">
                {language === 'ko' ? '모든 학습 마법을 깨워보세요' : 'Unlock Full Learning Magic'}
            </h2>
            <p className="text-zinc-400 text-lg md:text-xl font-medium font-korean max-w-2xl mx-auto">
                {language === 'ko' ? '하루 3번의 제한 없이, 채키의 모든 프리미엄 기능을 무제한으로 사용하세요.' : 'Remove daily limits and access Chekki’s premium AI tools forever.'}
            </p>
            <button onClick={() => setShowPaywall(false)} className="absolute top-6 right-8 text-zinc-500 hover:text-white transition-colors text-2xl">✕</button>
        </div>

        <div className="px-8 pb-12 grid md:grid-cols-2 gap-8">
            {/* Free Tier */}
            <div className="bg-zinc-950/50 border border-white/5 rounded-[2rem] p-8 flex flex-col opacity-60">
                <div className="mb-6">
                    <h3 className="text-xl font-bold text-zinc-400 mb-1">Free Explorer</h3>
                    <div className="text-3xl font-black text-white font-display">₩0 <span className="text-sm font-medium text-zinc-500">/ forever</span></div>
                </div>
                <ul className="space-y-4 mb-10 flex-1">
                    <li className="flex items-center gap-3 text-sm text-zinc-400">
                        <span className="text-zinc-600">✓</span> 3 Scans per Day
                    </li>
                    <li className="flex items-center gap-3 text-sm text-zinc-400">
                        <span className="text-zinc-600">✓</span> Basic Answer Key
                    </li>
                    <li className="flex items-center gap-3 text-sm text-zinc-700 line-through">
                        <span>✕</span> AI Practice Generator
                    </li>
                    <li className="flex items-center gap-3 text-sm text-zinc-700 line-through">
                        <span>✕</span> Advanced Reasoning Model
                    </li>
                </ul>
                <button disabled className="w-full py-4 rounded-2xl bg-zinc-800 text-zinc-500 font-bold cursor-not-allowed">
                    Current Plan
                </button>
            </div>

            {/* Pro Tier */}
            <div className={`relative bg-gradient-to-b from-zinc-800 to-zinc-900 border-2 rounded-[2rem] p-8 flex flex-col shadow-2xl scale-[1.05] z-10 transition-all duration-300 ${error ? 'border-red-500' : 'border-orange-500'}`}>
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-orange-500 text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg">
                    Most Popular
                </div>
                
                <div className="mb-6">
                    <h3 className="text-xl font-bold text-orange-500 mb-1">Chekki Pro</h3>
                    <div className="text-3xl font-black text-white font-display">₩9,900 <span className="text-sm font-medium text-zinc-500">/ month</span></div>
                </div>

                <ul className="space-y-4 mb-10 flex-1">
                    <li className="flex items-center gap-3 text-sm text-zinc-200">
                        <span className="text-orange-500 text-lg">✨</span> <strong>Unlimited Scans</strong>
                    </li>
                    <li className="flex items-center gap-3 text-sm text-zinc-200">
                        <span className="text-orange-500 text-lg">🪄</span> <strong>AI Practice Sheet Generator</strong>
                    </li>
                    <li className="flex items-center gap-3 text-sm text-zinc-200">
                        <span className="text-orange-500 text-lg">🚀</span> <strong>Deep Reasoning Mode</strong> (Gemini 3 Pro)
                    </li>
                    <li className="flex items-center gap-3 text-sm text-zinc-200">
                        <span className="text-orange-500 text-lg">🔊</span> Native Audio Pronunciation
                    </li>
                    <li className="flex items-center gap-3 text-sm text-zinc-200">
                        <span className="text-orange-500 text-lg">☕</span> Mom's Lounge Exclusive Badges
                    </li>
                </ul>

                {!showCodeInput ? (
                    <>
                        <button 
                            onClick={() => upgradeToPro()}
                            className="w-full py-5 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-black text-xl shadow-xl shadow-orange-500/20 transform active:scale-95 transition-all"
                        >
                            {language === 'ko' ? '지금 업그레이드 하기' : 'Upgrade Now'}
                        </button>
                        <button 
                            onClick={() => setShowCodeInput(true)}
                            className="text-center text-[10px] text-zinc-500 mt-4 uppercase tracking-widest font-bold hover:text-white transition-colors"
                        >
                            Have an access code?
                        </button>
                    </>
                ) : (
                    <div className="space-y-3 animate-fade-in">
                        <input 
                            type="text" 
                            value={betaCode}
                            onChange={(e) => setBetaCode(e.target.value.toUpperCase())}
                            placeholder="ENTER BETA CODE"
                            className={`w-full bg-black/40 border ${error ? 'border-red-500' : 'border-zinc-700'} rounded-xl px-4 py-3 text-white text-center font-mono tracking-widest outline-none focus:border-orange-500`}
                        />
                        <div className="flex gap-2">
                             <button 
                                onClick={handleRedeem}
                                disabled={isProcessing}
                                className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg disabled:opacity-50"
                            >
                                {isProcessing ? 'Verifying...' : 'Redeem'}
                            </button>
                            <button 
                                onClick={() => { setShowCodeInput(false); setError(false); }}
                                className="px-4 py-3 rounded-xl bg-zinc-800 text-zinc-400 font-bold text-sm"
                            >
                                Back
                            </button>
                        </div>
                        {error && <p className="text-[10px] text-red-500 text-center font-bold">Invalid or expired code.</p>}
                    </div>
                )}
                
                <p className="text-center text-[9px] text-zinc-600 mt-4 uppercase tracking-[0.2em] font-bold">
                    No commitment. Cancel anytime.
                </p>
            </div>
        </div>
      </div>
    </div>
  );
};
