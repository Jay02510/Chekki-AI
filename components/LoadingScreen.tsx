
import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { ChekkiMascot } from './Icons';
import { ASSETS } from '../constants';

interface Props {
  onCancel?: () => void;
}

export const LoadingScreen: React.FC<Props> = ({ onCancel }) => {
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
    }, 1800);

    // Show cancel button after 15 seconds so users aren't trapped
    const cancelTimer = setTimeout(() => setShowCancel(true), 15000);

    return () => {
      clearInterval(interval);
      clearTimeout(cancelTimer);
    };
  }, [loadingTexts.length]);

  return (
    <div className="fixed inset-0 bg-zinc-950/95 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-6">
      <div className="relative w-80 h-80 md:w-[450px] md:h-[450px] mb-12">
        <div className="absolute inset-4 bg-orange-500/20 rounded-[2.5rem] blur-3xl animate-pulse"></div>
        
        <div className="relative w-full h-full bg-zinc-900 rounded-[2.5rem] shadow-2xl z-10 overflow-hidden transform-gpu">
             {!videoError ? (
                <video 
                  autoPlay 
                  muted 
                  loop 
                  playsInline 
                  className="absolute inset-0 w-full h-full object-cover block scale-105" 
                  onError={() => setVideoError(true)}
                >
                    <source src={ASSETS.VIDEO_ANALYZING} type="video/mp4" />
                </video>
             ) : (
                <div className="w-full h-full p-8 flex items-center justify-center">
                   <ChekkiMascot className="w-full h-full" mood="thinking" />
                </div>
             )}
        </div>
      </div>
      
      <div className="h-32 flex flex-col items-center justify-start z-20">
        <h2 className="text-xl md:text-2xl font-bold text-white mb-4 text-center font-korean animate-fade-in max-w-md" key={textIndex}>
          {loadingTexts[textIndex]}
        </h2>
        
        <div className="flex gap-3 mb-8">
          <div className="w-2.5 h-2.5 bg-orange-500 rounded-full animate-bounce" style={{animationDelay: '0s'}}></div>
          <div className="w-2.5 h-2.5 bg-orange-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
          <div className="w-2.5 h-2.5 bg-orange-500 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
        </div>

        {showCancel && onCancel && (
          <button 
            onClick={onCancel}
            className="text-zinc-500 hover:text-white text-sm font-bold underline transition-colors animate-fade-in"
          >
            {t('btn_cancel_retry')}
          </button>
        )}
      </div>
    </div>
  );
};
