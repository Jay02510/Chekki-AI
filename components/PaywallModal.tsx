import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

export const PaywallModal: React.FC = () => {
  const { showPaywall, setShowPaywall, upgradeToPro } = useAuth();
  const { t } = useLanguage();

  if (!showPaywall) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowPaywall(false)}></div>

      {/* Modal */}
      <div className="relative bg-zinc-900 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-zinc-700 animate-fade-in-up">
        {/* Header Art */}
        <div className="bg-gradient-to-br from-orange-500 to-red-600 p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
          <span className="text-5xl mb-2 block animate-bounce-subtle">🚀</span>
          <h2 className="text-3xl font-extrabold text-white mb-2">{t('pw_title')}</h2>
          <p className="text-orange-100 font-medium">{t('pw_desc')}</p>
          <button 
            onClick={() => setShowPaywall(false)}
            className="absolute top-4 right-4 text-white/60 hover:text-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-8">
          <div className="space-y-4 mb-8">
            <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-800 border border-zinc-700 opacity-60">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🌱</span>
                <div>
                  <h3 className="font-bold text-zinc-300">{t('pw_free_title')}</h3>
                  <p className="text-xs text-zinc-500">{t('pw_free_limit')}</p>
                </div>
              </div>
              <span className="text-zinc-400 font-bold">{t('pw_current')}</span>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-800 border-2 border-orange-500 relative">
              <div className="absolute -top-3 right-4 bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">{t('pw_rec')}</div>
              <div className="flex items-center gap-3">
                <span className="text-2xl">⚡</span>
                <div>
                  <h3 className="font-bold text-white">{t('pw_pro_title')}</h3>
                  <p className="text-xs text-zinc-400">{t('pw_pro_limit')}</p>
                </div>
              </div>
              <span className="text-orange-500 font-bold">{t('pw_price')}</span>
            </div>
          </div>

          <button 
            onClick={upgradeToPro}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-orange-500/25 transition-all transform hover:scale-[1.02]"
          >
            {t('pw_btn')}
          </button>
          
          <p className="text-center text-zinc-500 text-xs mt-4">
            {t('pw_footer')}
          </p>
        </div>
      </div>
    </div>
  );
};