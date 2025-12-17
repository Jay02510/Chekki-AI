
import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { ChekkiMascot } from './Icons';
import { ASSETS } from '../constants';

export const LoadingScreen: React.FC = () => {
  const { t } = useLanguage();
  const [textIndex, setTextIndex] = useState(0);
  const [videoError, setVideoError] = useState(false);

  const loadingTexts = [
    t('loading_step1'),
    t('loading_step2'),
    t('loading_step3'),
    t('loading_step4')
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setTextIndex((prev) => (prev + 1) % loadingTexts.length);
    }, 1500);
    return () => clearInterval(interval);
  }, [loadingTexts.length]);

  return (
    <div className="fixed inset-0 bg-zinc-950/95 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-6">
      {/* 
          UPDATED: 
          1. Significantly increased size (w-96 mobile, 500px desktop)
          2. Removed white rings/borders
          3. Cleaner rounded rectangle shape
      */}
      <div className="relative w-96 h-96 md:w-[500px] md:h-[500px] mb-12">
        {/* Subtle Background Glow */}
        <div className="absolute inset-4 bg-orange-500/20 rounded-[2.5rem] blur-3xl animate-pulse"></div>
        
        {/* Video Container - No borders/rings */}
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
      
      <div className="h-20 flex flex-col items-center justify-start z-20">
        <h2 className="text-xl md:text-3xl font-bold text-white mb-2 text-center font-korean animate-fade-in" key={textIndex}>
          {loadingTexts[textIndex]}
        </h2>
        
        <div className="mt-6 flex gap-3">
          <div className="w-3 h-3 bg-orange-500 rounded-full animate-bounce" style={{animationDelay: '0s'}}></div>
          <div className="w-3 h-3 bg-orange-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
          <div className="w-3 h-3 bg-orange-500 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
        </div>
      </div>
    </div>
  );
};
