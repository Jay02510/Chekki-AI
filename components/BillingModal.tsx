
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

interface Props {
  onClose: () => void;
}

export const BillingModal: React.FC<Props> = ({ onClose }) => {
  const { user, upgradeToPro, cancelSubscription, setShowPaywall } = useAuth();
  const { language } = useLanguage();
  const isPro = user?.plan === 'pro';
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

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
             <span className="text-2xl">💳</span>
             <h2 className="text-2xl font-black text-white font-display">Billing & Subscription</h2>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">✕</button>
        </div>

        <div className="p-8 space-y-8">
            {/* Current Plan Card */}
            <div className={`relative p-8 rounded-[1.5rem] border-2 transition-all duration-500 ${isPro ? 'bg-orange-500/5 border-orange-500/30' : 'bg-zinc-950/50 border-white/5'}`}>
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-1">Your Current Plan</p>
                        <h3 className={`text-3xl font-black ${isPro ? 'text-white' : 'text-zinc-400'} font-display`}>
                            {isPro ? 'Chekki Pro' : 'Free Explorer'}
                        </h3>
                    </div>
                    {isPro && (
                        <div className="bg-orange-500 text-white text-[9px] font-black px-3 py-1 rounded-full animate-pulse shadow-lg">ACTIVE</div>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-black/30 rounded-xl border border-white/5">
                        <p className="text-[10px] font-bold text-zinc-500 uppercase mb-1">Billing Period</p>
                        <p className="text-sm text-white font-bold">{isPro ? 'Monthly' : 'None'}</p>
                    </div>
                    <div className="p-4 bg-black/30 rounded-xl border border-white/5">
                        <p className="text-[10px] font-bold text-zinc-500 uppercase mb-1">Next Payment</p>
                        <p className="text-sm text-white font-bold">{isPro ? formatDate(user?.nextBillingDate) : 'N/A'}</p>
                    </div>
                </div>

                {!isPro ? (
                    <button 
                        onClick={() => { onClose(); setShowPaywall(true); }}
                        className="mt-8 w-full bg-white text-black font-black py-4 rounded-2xl hover:bg-zinc-200 transition-all shadow-xl active:scale-95"
                    >
                        Upgrade to Pro
                    </button>
                ) : (
                   <div className="mt-8">
                        {!showCancelConfirm ? (
                            <button 
                                onClick={() => setShowCancelConfirm(true)}
                                className="text-zinc-500 hover:text-red-400 text-xs font-bold transition-colors underline underline-offset-4"
                            >
                                Cancel Subscription
                            </button>
                        ) : (
                            <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-center justify-between animate-fade-in">
                                <p className="text-xs text-red-200 font-bold">Are you sure you want to cancel?</p>
                                <div className="flex gap-3">
                                    <button onClick={() => { cancelSubscription(); setShowCancelConfirm(false); }} className="px-4 py-2 bg-red-600 text-white text-[10px] font-bold rounded-lg hover:bg-red-700">Confirm</button>
                                    <button onClick={() => setShowCancelConfirm(false)} className="px-4 py-2 bg-zinc-800 text-white text-[10px] font-bold rounded-lg">Keep Pro</button>
                                </div>
                            </div>
                        )}
                   </div>
                )}
            </div>

            {/* Invoices List */}
            <div>
                <h4 className="text-xs font-black text-zinc-500 uppercase tracking-[0.2em] mb-4">Invoice History</h4>
                <div className="bg-zinc-950/50 border border-white/5 rounded-2xl overflow-hidden">
                    {isPro ? (
                        <div className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors border-b border-white/5">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-zinc-900 rounded-lg flex items-center justify-center">📄</div>
                                <div>
                                    <p className="text-sm font-bold text-white">Pro Plan Subscription</p>
                                    <p className="text-[10px] text-zinc-500">{formatDate(user?.subscriptionStartedAt)}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-black text-emerald-400">₩9,900</p>
                                <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Paid</span>
                            </div>
                        </div>
                    ) : (
                        <div className="py-12 text-center text-zinc-600 text-sm italic">
                            No payment history yet.
                        </div>
                    )}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
