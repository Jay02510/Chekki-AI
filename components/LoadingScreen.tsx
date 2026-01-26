
import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { ChekkiMascot } from './Icons';
import { ASSETS } from '../constants';

interface Props {
  onCancel?: () => void;
  isNight?: boolean;
}

export const LoadingScreen: React.FC<Props> = ({ onCancel, isNight = false }) => {
  const { t, language } = useLanguage();
  const [textIndex, setTextIndex] = useState(0);
  const [videoError, setVideoError] = useState(false);
  const [showCancel, setShowCancel] = useState(false);

  const loadingTexts = [
    t('loading_step0'),
    t('loading_step1'),
    t('loading_step2'),
    t('loading_step3'),
    t('loading_step4'),
    t('loading_tip'),
    t('loading_almost')
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setTextIndex((prev) => (prev + 1) % loadingTexts.length);
    }, 2000);

    const cancelTimer = setTimeout(() => setShowCancel(true), 15000);

    return () => {
      clearInterval(interval);
      clearTimeout(cancelTimer);
    };
  }, [loadingTexts.length]);

  return (
    <div className={`fixed inset-0 ${isNight ? 'bg-[#030305]' : 'bg-zinc-950'} z-[100] flex flex-col items-center justify-center p-8 overflow-hidden transition-colors duration-1000`}>
      <div className={`absolute inset-0 bg-gradient-to-br ${isNight ? 'from-indigo-900/10 to-purple-900/10' : 'from-orange-500/5 to-purple-500/5'} opacity-50`}></div>
      
      <div className="relative w-64 h-64 md:w-[400px] md:h-[400px] mb-12 shrink-0">
        <div className={`absolute inset-4 ${isNight ? 'bg-indigo-500/10' : 'bg-orange-500/20'} rounded-[3rem] blur-[80px] animate-pulse`}></div>
        
        <div className={`relative w-full h-full ${isNight ? 'bg-indigo-950/30' : 'bg-zinc-900/50'} backdrop-blur-3xl rounded-[2.5rem] border border-white/5 shadow-2xl z-10 overflow-hidden`}>
             {!videoError ? (
                <video 
                  autoPlay 
                  muted 
                  loop 
                  playsInline 
                  className="absolute inset-0 w-full h-full object-contain p-4 scale-110" 
                  onError={() => setVideoError(true)}
                >
                    <source src={isNight ? ASSETS.VIDEO_SLEEPY : ASSETS.VIDEO_ANALYZING} type="video/mp4" />
                </video>
             ) : (
                <div className="w-full h-full p-12 flex items-center justify-center">
                   <img 
                    src={isNight ? ASSETS.HERO_SLEEPY : ASSETS.MASCOT_HAPPY} 
                    alt="Chekki Mascot" 
                    className="w-full h-full object-contain" 
                   />
                </div>
             )}
        </div>
      </div>
      
      <div className="flex flex-col items-center justify-center z-20 max-w-lg w-full">
        <div className="h-16 flex items-center justify-center mb-4">
          <h2 className="text-xl md:text-2xl font-black text-white text-center font-korean animate-fade-in break-keep" key={textIndex}>
            {loadingTexts[textIndex]}
          </h2>
        </div>
        
        <div className="flex gap-2 mb-10">
          {[0, 1, 2].map(i => (
            <div 
              key={i} 
              className={`w-2 h-2 ${isNight ? 'bg-indigo-400' : 'bg-orange-500'} rounded-full animate-bounce`} 
              style={{ animationDelay: `${i * 0.15}s` }}
            ></div>
          ))}
        </div>

        {showCancel && onCancel && (
          <button 
            onClick={onCancel}
            className="px-6 py-2 rounded-full border border-white/10 text-zinc-500 hover:text-white hover:border-white/30 text-xs font-black uppercase tracking-widest transition-all animate-fade-in"
          >
            {t('btn_cancel_retry')}
          </button>
        )}
      </div>
    </div>
  );
};
