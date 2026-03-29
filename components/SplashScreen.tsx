
import React, { useEffect, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { ChekkiMascot } from './Icons';
import { ASSETS } from '../constants';
import { Capacitor } from '@capacitor/core';
import { APP_VERSION } from '../src/version';

interface Props {
  onFinish: () => void;
}

export const SplashScreen: React.FC<Props> = ({ onFinish }) => {
  const [isExiting, setIsExiting] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [featureIndex, setFeatureIndex] = useState(0);
  const { language, t } = useLanguage();

  const features = language === 'ko' ? [
    t('feat_overlay'),
    t('feat_script'),
    t('feat_pronounce'),
    t('feat_practice')
  ] : [
    t('feat_overlay'),
    t('feat_script'),
    t('feat_pronounce'),
    t('feat_practice')
  ];

  useEffect(() => {
    // Feature rotation timer
    const featureInterval = setInterval(() => {
      setFeatureIndex(prev => (prev + 1) % features.length);
    }, 450);

    // Safety timeout
    const isIPad = /iPad|Macintosh/i.test(navigator.userAgent) && (navigator.maxTouchPoints > 1);
    const timeoutDuration = isIPad ? 2200 : 2800; // Faster for iPad to avoid 'stuck' feeling

    const exitTimer = setTimeout(() => {
      setIsExiting(true);
    }, timeoutDuration);

    const cleanupTimer = setTimeout(() => {
      onFinish();
    }, timeoutDuration + 300);

    return () => {
      clearInterval(featureInterval);
      clearTimeout(exitTimer);
      clearTimeout(cleanupTimer);
    };
  }, [onFinish, features.length]);

  return (
    <div className={`fixed inset-0 z-[100] bg-[#050505] flex flex-col items-center justify-center transition-opacity duration-500 ${isExiting ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-orange-500/10 rounded-full blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-[100px] animate-pulse"></div>
      </div>

      <div className="relative z-10 flex flex-col items-center">
        <div className="relative mb-8">
          <div className="w-64 h-64 md:w-80 md:h-80 bg-zinc-900 rounded-[3rem] flex items-center justify-center shadow-2xl border border-white/5 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent z-20 pointer-events-none"></div>
            {!videoError ? (
              <video
                autoPlay
                muted
                loop
                playsInline
                preload="auto"
                className="w-full h-full object-contain z-10 scale-110"
                onError={() => setVideoError(true)}
              >
                {/* Use Cloudinary on native for reliability, local on web for optimized loading */}
                <source src={Capacitor.isNativePlatform() ? ASSETS.VIDEO_INTRO : '/chekki-intro.mp4'} type="video/mp4" />
              </video>
            ) : (
              <div className="w-full h-full flex items-center justify-center animate-float">
                <img
                  src={ASSETS.MASCOT_HAPPY}
                  alt="Chekki Logo Mascot"
                  className="w-full h-full object-contain drop-shadow-2xl scale-110"
                />
              </div>
            )}
          </div>

          <div className="absolute -inset-4 bg-orange-500/20 blur-2xl rounded-full -z-10 animate-pulse"></div>
        </div>

        <div className="text-center space-y-2 h-24">
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter font-display leading-none">
            Chekki<span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-pink-500">AI</span>
          </h1>
          <div className="relative h-6 overflow-hidden mt-1">
            {features.map((feat, index) => (
              <p key={index} className={`absolute inset-0 w-full text-center text-zinc-500 font-bold text-[10px] md:text-xs uppercase tracking-[0.2em] transition-all duration-300 transform ${index === featureIndex ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                {feat}
              </p>
            ))}
          </div>
        </div>

        <div className="mt-8 w-40 h-1 bg-zinc-800 rounded-full overflow-hidden relative">
          <div className="h-full bg-gradient-to-r from-orange-500 to-pink-500 animate-[width_2.8s_linear_forwards]" style={{ width: '0%' }}></div>
        </div>

        <p className="mt-4 text-[9px] text-zinc-700 font-black uppercase tracking-widest">
          Version {APP_VERSION}
        </p>
      </div>

      <style>{`
        @keyframes width {
          0% { width: 0%; }
          100% { width: 100%; }
        }
      `}</style>
    </div>
  );
};
