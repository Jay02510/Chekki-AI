
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

export const PaywallModal: React.FC = () => {
  const { showPaywall, setShowPaywall, upgradeToPro } = useAuth();
  const { t } = useLanguage();
  const [betaCode, setBetaCode] = useState('');
  const [error, setError] = useState(false);

  if (!showPaywall) return null;

  const handleUpgrade = async () => {
    const success = await upgradeToPro(betaCode);
    if (!success) {
        setError(true);
        setTimeout(() => setError(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowPaywall(false)}></div>
      <div className="relative bg-zinc-900 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-zinc-700 animate-fade-in-up">
        <div className="bg-gradient-to-br from-orange-500 to-red-600 p-8 text-center relative">
          <h2 className="text-3xl font-extrabold text-white mb-2">{t('pw_title')}</h2>
          <p className="text-orange-100 font-medium">Unlock unlimited AI power for your child.</p>
          <button onClick={() => setShowPaywall(false)} className="absolute top-4 right-4 text-white/60">✕</button>
        </div>
        <div className="p-8">
          <div className="bg-zinc-800 border-2 border-orange-500 rounded-xl p-4 mb-6">
              <h3 className="font-bold text-white mb-2">PRO FEATURES</h3>
              <ul className="text-xs text-zinc-400 space-y-2">
                  <li>✨ Unlimited Worksheet Scans</li>
                  <li>🪄 AI Practice Sheet Generator</li>
                  <li>🔊 Native Audio & Pronunciation Check</li>
              </ul>
          </div>
          
          <div className="space-y-4">
            <div className="relative">
                <input 
                    type="text" 
                    value={betaCode}
                    onChange={(e) => setBetaCode(e.target.value)}
                    placeholder="Enter Beta Access Code" 
                    className={`w-full bg-black/20 border ${error ? 'border-red-500' : 'border-zinc-700'} rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-orange-500 transition-colors uppercase`}
                />
                {error && <p className="text-[10px] text-red-500 mt-1 ml-1 font-bold">Invalid Code</p>}
            </div>
            <button onClick={handleUpgrade} className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-xl shadow-lg transform active:scale-95 transition-all">
                {betaCode ? 'Redeem Code & Upgrade' : 'Start Subscription (Demo)'}
            </button>
            <p className="text-center text-zinc-500 text-[10px] uppercase tracking-widest">
                Testing a Beta version? Use code: <strong>CHEKKIBETA</strong>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
