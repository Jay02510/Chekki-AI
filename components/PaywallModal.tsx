
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
      
      <div className="relative bg-zinc-900 rounded-[2.5rem] w-full max-w-4xl overflow-hidden shadow-[0_0_100px_rgba(249,115,22,0.2)] border border-white/10 animate-fade-in-up flex flex-col max-h-[90vh]">
        
        {/* Header Branding */}
        <div className="p-8 md:p-10 text-center relative overflow-hidden shrink-0">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-gradient-to-b from-orange-500/10 to-transparent pointer-events-none"></div>
            <h2 className="text-3xl md:text-5xl font-black text-white mb-2 font-display leading-tight">
                {t('pw_title')}
            </h2>
            <p className="text-zinc-400 text-base md:text-lg font-medium font-korean max-w-2xl mx-auto">
                {t('pw_desc')}
            </p>
            <button onClick={() => setShowPaywall(false)} className="absolute top-6 right-8 text-zinc-500 hover:text-white transition-colors text-2xl">✕</button>
        </div>

        <div className="px-8 pb-10 grid md:grid-cols-2 gap-6 overflow-y-auto custom-scrollbar flex-1">
            {/* Free Tier */}
            <div className="bg-zinc-950/50 border border-white/5 rounded-[2rem] p-6 flex flex-col opacity-60">
                <div className="mb-6">
                    <h3 className="text-lg font-bold text-zinc-400 mb-1">Free Explorer</h3>
                    <div className="text-2xl font-black text-white font-display">₩0 <span className="text-xs font-medium text-zinc-500">/ forever</span></div>
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                    <li className="flex items-center gap-3 text-xs text-zinc-400">
                        <span className="text-zinc-600">✓</span> 3 Scans per Day
                    </li>
                    <li className="flex items-center gap-3 text-xs text-zinc-400">
                        <span className="text-zinc-600">✓</span> Basic Answer Key
                    </li>
                    <li className="flex items-center gap-3 text-xs text-zinc-700 line-through">
                        <span>✕</span> AI Practice Generator
                    </li>
                </ul>
                <button disabled className="w-full py-4 rounded-xl bg-zinc-800 text-zinc-500 font-bold cursor-not-allowed text-sm">
                    Current Plan
                </button>
            </div>

            {/* Pro Tier */}
            <div className={`relative bg-gradient-to-b from-zinc-800 to-zinc-900 border-2 rounded-[2rem] p-6 flex flex-col shadow-2xl transition-all duration-300 ${error ? 'border-red-500' : 'border-orange-500'}`}>
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-orange-500 text-white text-[9px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg whitespace-nowrap">
                    Recommended for EK Families
                </div>
                
                <div className="mb-6 pt-2">
                    <h3 className="text-lg font-bold text-orange-500 mb-1">Chekki Pro</h3>
                    <div className="text-2xl font-black text-white font-display">₩9,900 <span className="text-xs font-medium text-zinc-500">/ month</span></div>
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                    <li className="flex items-center gap-3 text-xs text-zinc-200">
                        <span className="text-orange-500 text-base">✨</span> <strong>Unlimited Scans</strong>
                    </li>
                    <li className="flex items-center gap-3 text-xs text-zinc-200">
                        <span className="text-orange-500 text-base">🪄</span> <strong>AI Practice Sheet Generator</strong>
                    </li>
                    <li className="flex items-center gap-3 text-xs text-zinc-200">
                        <span className="text-orange-500 text-base">🚀</span> <strong>Deep Reasoning Mode</strong>
                    </li>
                </ul>

                {!showCodeInput ? (
                    <div className="space-y-3">
                        <button 
                            onClick={() => upgradeToPro()}
                            className="w-full py-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-black text-lg shadow-xl shadow-orange-500/20 transform active:scale-95 transition-all"
                        >
                            {t('pay_method_easy')}
                        </button>
                        <button 
                            onClick={() => upgradeToPro()}
                            className="w-full py-4 rounded-xl border border-white/20 hover:bg-white/5 text-white font-bold text-sm transition-all"
                        >
                            {t('pay_method_card')}
                        </button>
                        <button 
                            onClick={() => setShowCodeInput(true)}
                            className="w-full text-center text-[9px] text-zinc-500 uppercase tracking-widest font-bold hover:text-white transition-colors py-2"
                        >
                            Have an access code?
                        </button>
                    </div>
                ) : (
                    <div className="space-y-3 animate-fade-in">
                        <input 
                            type="text" 
                            value={betaCode}
                            onChange={(e) => setBetaCode(e.target.value.toUpperCase())}
                            placeholder="ENTER BETA CODE"
                            className={`w-full bg-black/40 border ${error ? 'border-red-500' : 'border-zinc-700'} rounded-xl px-4 py-3 text-white text-center font-mono tracking-widest outline-none focus:border-orange-500 text-xs`}
                        />
                        <div className="flex gap-2">
                             <button 
                                onClick={handleRedeem}
                                disabled={isProcessing}
                                className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg disabled:opacity-50"
                            >
                                {isProcessing ? 'Verifying...' : 'Redeem'}
                            </button>
                            <button 
                                onClick={() => { setShowCodeInput(false); setError(false); }}
                                className="px-4 py-3 rounded-xl bg-zinc-800 text-zinc-400 font-bold text-xs"
                            >
                                Back
                            </button>
                        </div>
                        {error && <p className="text-[9px] text-red-500 text-center font-bold">Invalid or expired code.</p>}
                    </div>
                )}
                
                <div className="mt-4 pt-4 border-t border-white/5 flex flex-col items-center gap-1">
                    <p className="text-[8px] text-zinc-500 uppercase font-black tracking-widest">{t('pay_secure_notice')}</p>
                </div>
            </div>
        </div>
        
        {/* Compliance Footer */}
        <div className="bg-zinc-950 p-6 text-center border-t border-white/5 shrink-0">
             <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-[9px] text-zinc-600 font-bold uppercase tracking-widest">
                <span>{t('biz_info_title')}</span>
                <span>{t('biz_reg_num')}</span>
                <span>{t('biz_rep')}</span>
             </div>
        </div>
      </div>
    </div>
  );
};
