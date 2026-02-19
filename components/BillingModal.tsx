import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

interface Props {
  onClose: () => void;
}

export const BillingModal: React.FC<Props> = ({ onClose }) => {
  const { user, upgradeToPro, cancelSubscription, setShowPaywall } = useAuth();
  const { language, t } = useLanguage();
  const isPro = user?.plan === 'pro';

  const formatDate = (isoStr?: string) => {
    if (!isoStr) return "N/A";
    return new Date(isoStr).toLocaleDateString(language === 'ko' ? 'ko-KR' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="relative bg-zinc-900 rounded-[2rem] w-full max-w-2xl shadow-2xl border border-white/5 overflow-hidden animate-fade-in-up">
        
        <div className="bg-zinc-950 px-8 py-6 border-b border-white/5 flex justify-between items-center">
          <div className="flex items-center gap-3">
             <span className="text-2xl">✨</span>
             <h2 className="text-2xl font-black text-white font-display">Subscription Status</h2>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">✕</button>
        </div>

        <div className="p-8 space-y-8">
            <div className={`relative p-8 rounded-[1.5rem] border-2 transition-all duration-500 ${isPro ? 'bg-orange-500/5 border-orange-500/30' : 'bg-zinc-950/50 border-white/5'}`}>
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-1">Your Current Status</p>
                        <h3 className={`text-3xl font-black ${isPro ? 'text-white' : 'text-zinc-400'} font-display`}>
                            {isPro ? 'Beta Pro Access' : 'Free Explorer'}
                        </h3>
                    </div>
                    {isPro && (
                        <div className="bg-orange-500 text-white text-[9px] font-black px-3 py-1 rounded-full animate-pulse shadow-lg">ACTIVE</div>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-black/30 rounded-xl border border-white/5">
                        <p className="text-[10px] font-bold text-zinc-500 uppercase mb-1">Account Type</p>
                        <p className="text-sm text-white font-bold">{isPro ? 'Beta Tester' : 'Standard'}</p>
                    </div>
                    <div className="p-4 bg-black/30 rounded-xl border border-white/5">
                        <p className="text-[10px] font-bold text-zinc-500 uppercase mb-1">Access Granted</p>
                        <p className="text-sm text-white font-bold">{isPro ? formatDate(user?.subscriptionStartedAt) : 'N/A'}</p>
                    </div>
                </div>

                {!isPro && (
                    <button 
                        onClick={() => { onClose(); setShowPaywall(true); }}
                        className="mt-8 w-full bg-white text-black font-black py-4 rounded-2xl hover:bg-zinc-200 transition-all shadow-xl active:scale-95"
                    >
                        Enter Beta Code
                    </button>
                )}

                <div className="mt-8 pt-6 border-t border-white/5">
                    <div className="bg-indigo-500/10 rounded-2xl p-5 border border-indigo-500/20">
                        <div className="flex items-center gap-3 mb-2">
                            <span className="text-xl">🚀</span>
                            <h4 className="text-indigo-400 font-black text-sm uppercase tracking-widest">Coming Soon</h4>
                        </div>
                        <p className="text-zinc-400 text-xs font-medium leading-relaxed font-korean opacity-80 break-keep">
                            {language === 'ko' 
                                ? "정식 출시 후 다양한 정기 구독 플랜이 도입될 예정입니다. 현재는 베타 테스트 기간으로, 코드를 소지하신 분들께 모든 기능을 무료로 제공하고 있습니다." 
                                : "Official subscription plans will be introduced upon full launch. During this beta period, we are offering full access to invited users with valid codes."}
                        </p>
                    </div>
                </div>
            </div>

            <div className="text-center pb-4">
                <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-[0.2em]">
                    Pre-Launch Version 1.0.0
                </p>
            </div>
        </div>
      </div>
    </div>
  );
};