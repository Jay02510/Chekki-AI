import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

export const PaywallModal: React.FC = () => {
  const { showPaywall, setShowPaywall, upgradeToPro } = useAuth();
  const { t, language } = useLanguage();
  
  const [betaCode, setBetaCode] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(false);

  if (!showPaywall) return null;

  const handleRedeem = async () => {
    if (!betaCode) return;
    setIsProcessing(true);
    setError(false);
    
    const success = await upgradeToPro(betaCode);
    if (!success) {
      setError(true);
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/95 backdrop-blur-2xl animate-fade-in" onClick={() => setShowPaywall(false)}></div>
      
      <div className="relative bg-zinc-900 rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-[0_0_100px_rgba(249,115,22,0.15)] border border-white/10 animate-fade-in-up flex flex-col">
        
        <div className="p-8 md:p-12 text-center relative overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-gradient-to-b from-orange-500/10 to-transparent pointer-events-none"></div>
            
            <div className="w-20 h-20 bg-orange-500/20 rounded-3xl flex items-center justify-center text-orange-500 text-4xl mb-8 mx-auto shadow-2xl border border-orange-500/20">
                🏷️
            </div>

            <h2 className="text-3xl md:text-4xl font-black text-white mb-3 font-display leading-tight tracking-tight">
                {t('pw_title')}
            </h2>
            <p className="text-zinc-400 text-sm md:text-lg font-medium font-korean max-w-sm mx-auto leading-relaxed break-keep">
                {t('pw_desc')}
            </p>
            
            <button onClick={() => setShowPaywall(false)} className="absolute top-6 right-6 text-zinc-500 hover:text-white transition-colors p-2">✕</button>
        </div>

        <div className="px-8 pb-12 flex flex-col gap-6">
            <div className="space-y-4 animate-fade-in">
                <div className="relative">
                    <input 
                        type="text" 
                        value={betaCode}
                        onChange={(e) => setBetaCode(e.target.value.toUpperCase())}
                        placeholder={language === 'ko' ? "초대 코드를 입력하세요" : "Enter Invite Code"}
                        className={`w-full bg-black/40 border-2 ${error ? 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'border-zinc-700 focus:border-orange-500'} rounded-2xl px-6 py-5 text-white text-center font-mono tracking-[0.3em] outline-none transition-all text-lg placeholder:tracking-normal placeholder:font-sans placeholder:text-zinc-600`}
                    />
                    {error && (
                        <p className="text-red-400 text-[10px] font-black uppercase tracking-widest mt-2 text-center animate-shake">
                            {language === 'ko' ? "유효하지 않은 코드입니다" : "Invalid or Expired Code"}
                        </p>
                    )}
                </div>

                <button 
                    onClick={handleRedeem}
                    disabled={isProcessing || !betaCode}
                    className="w-full py-5 rounded-2xl bg-white text-black hover:bg-zinc-200 disabled:bg-zinc-800 disabled:text-zinc-600 font-black text-lg transition-all transform active:scale-95 shadow-2xl flex items-center justify-center gap-3"
                >
                    {isProcessing ? (
                        <div className="w-6 h-6 border-3 border-zinc-400 border-t-zinc-900 rounded-full animate-spin"></div>
                    ) : (
                        <span>{language === 'ko' ? "프로 기능 시작하기" : "Unlock Pro Features"}</span>
                    )}
                </button>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
                <h4 className="text-zinc-300 font-black text-[10px] uppercase tracking-widest mb-4 text-center">Beta Pro Benefits</h4>
                <ul className="space-y-3">
                    {[
                        { icon: '🚀', text: language === 'ko' ? '제한 없는 일일 스캔' : 'Unlimited Daily Scans' },
                        { icon: '🪄', text: language === 'ko' ? 'AI 복습 문제 생성' : 'AI Practice Sheets' },
                        { icon: '🔊', text: language === 'ko' ? '원어민 발음 & 티칭 가이드' : 'Native Audio & Teaching Scripts' }
                    ].map((item, i) => (
                        <li key={i} className="flex items-center gap-3 text-xs text-zinc-400 font-bold">
                            <span className="text-lg">{item.icon}</span>
                            {item.text}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
      </div>
    </div>
  );
};