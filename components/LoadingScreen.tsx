
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
      <div className={`absolute inset-0 bg-gradient-to-br ${isNight ? 'from-indigo-900/20 to-purple-900/20' : 'from-orange-500/10 to-purple-500/10'} opacity-50`}></div>
      
      {/* --- FLOATING LIGHT PARTICLES --- */}
      <div className="absolute inset-0 pointer-events-none">
         {[...Array(12)].map((_, i) => (
           <div 
            key={i}
            className={`absolute w-1 h-1 rounded-full ${isNight ? 'bg-indigo-400' : 'bg-orange-400'} animate-pulse`}
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              opacity: 0.3
            }}
           ></div>
         ))}
      </div>

      <div className="relative w-72 h-72 md:w-[480px] md:h-[480px] mb-12 shrink-0 group">
        {/* Futuristic Outer Glow Ring */}
        <div className={`absolute -inset-8 ${isNight ? 'bg-indigo-500/10' : 'bg-orange-500/20'} rounded-full blur-[100px] animate-pulse group-hover:opacity-100 transition-opacity`}></div>
        <div className={`absolute -inset-1 border-2 ${isNight ? 'border-indigo-500/20' : 'border-orange-500/30'} rounded-[3.5rem] animate-[spin_10s_linear_infinite] opacity-40`}></div>
        
        <div className={`relative w-full h-full ${isNight ? 'bg-indigo-950/30' : 'bg-zinc-900/50'} backdrop-blur-3xl rounded-[3.5rem] border border-white/10 shadow-[0_50px_100px_rgba(0,0,0,0.8)] z-10 overflow-hidden ring-1 ring-white/5`}>
             {!videoError ? (
                <video 
                  autoPlay 
                  muted 
                  loop 
                  playsInline 
                  className="absolute inset-0 w-full h-full object-cover scale-105" 
                  onError={() => setVideoError(true)}
                >
                    <source src={isNight ? ASSETS.VIDEO_SLEEPY : ASSETS.VIDEO_ANALYZING} type="video/mp4" />
                </video>
             ) : (
                <div className="w-full h-full flex items-center justify-center">
                   <img 
                    src={isNight ? ASSETS.HERO_SLEEPY : ASSETS.MASCOT_HAPPY} 
                    alt="Chekki Mascot" 
                    className="w-full h-full object-contain scale-125" 
                   />
                </div>
             )}
             
             {/* Digital Scanline Overlay */}
             <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden opacity-30">
                <div className={`w-full h-1 bg-gradient-to-r from-transparent ${isNight ? 'via-indigo-400' : 'via-orange-400'} to-transparent absolute top-0 animate-[scan_4s_linear_infinite]`}></div>
             </div>
        </div>
      </div>
      
      <div className="flex flex-col items-center justify-center z-20 max-w-lg w-full">
        <div className="h-20 flex items-center justify-center mb-6">
          <h2 className="text-2xl md:text-3xl font-black text-white text-center font-korean animate-fade-in-up tracking-tight drop-shadow-md" key={textIndex}>
            {loadingTexts[textIndex]}
          </h2>
        </div>
        
        <div className="flex gap-3 mb-12">
          {[0, 1, 2].map(i => (
            <div 
              key={i} 
              className={`w-2.5 h-2.5 ${isNight ? 'bg-indigo-500 shadow-[0_0_10px_#6366f1]' : 'bg-orange-500 shadow-[0_0_10px_#f97316]'} rounded-full animate-bounce`} 
              style={{ animationDelay: `${i * 0.2}s` }}
            ></div>
          ))}
        </div>

        {showCancel && onCancel && (
          <button 
            onClick={onCancel}
            className="px-8 py-3 rounded-2xl border border-white/10 bg-white/5 text-zinc-500 hover:text-white hover:border-white/30 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest transition-all animate-fade-in shadow-xl backdrop-blur-md"
          >
            {t('btn_cancel_retry')}
          </button>
        )}
      </div>

      <style>{`
        @keyframes scan {
          0% { top: -10%; }
          100% { top: 110%; }
        }
      `}</style>
    </div>
  );
};
