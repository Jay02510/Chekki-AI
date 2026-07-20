import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { ChekkiMascot } from './Icons';
import { ASSETS } from '../constants';

interface Props {
  onCancel?: () => void;
  isNight?: boolean;
}

export const LoadingScreen: React.FC<Props> = ({ onCancel, isNight = false }) => {
  const { t } = useLanguage();
  const [textIndex, setTextIndex] = useState(0);
  const [videoError, setVideoError] = useState(false);
  const [showCancel, setShowCancel] = useState(true);
  const videoRef = React.useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    setVideoError(false);
    if (videoRef.current) {
      videoRef.current.defaultMuted = true;
      videoRef.current.muted = true;
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn('Video autoplay failed or was blocked by browser:', err);
          setVideoError(true);
        });
      }
    }
  }, [isNight]);

  // Stable memoized dependency
  const loadingTexts = useMemo(
    () => [
      t('loading_step0'),
      t('loading_step1'),
      t('loading_step2'),
      t('loading_step3'),
      t('loading_thorough'),
      t('loading_step4'),
      t('loading_tip'),
      t('loading_subliminal'),
      t('loading_almost'),
    ],
    [t]
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setTextIndex((prev) => (prev + 1) % loadingTexts.length);
    }, 2000);

    return () => {
      clearInterval(interval);
    };
  }, [loadingTexts]);

  // Memoized once — particle positions never re-randomise on re-render
  const particles = useMemo(
    () =>
      Array.from({ length: 12 }, () => ({
        top: Math.random() * 100,
        left: Math.random() * 100,
        delay: Math.random() * 5,
      })),
    []
  );

  return (
    <div
      className={`fixed inset-0 ${isNight ? 'bg-[#030305]' : 'bg-[#FAFAFB]'} z-[100] flex flex-col items-center justify-center p-8 overflow-hidden transition-colors duration-1000`}
    >
      <div
        className={`absolute inset-0 bg-gradient-to-br ${isNight ? 'from-indigo-900/20 to-purple-900/20' : 'from-orange-500/10 to-purple-500/10'} opacity-50`}
      ></div>

      <div className="absolute inset-0 pointer-events-none">
        {particles.map((p, i) => (
          <div
            key={i}
            className={`absolute w-1 h-1 rounded-full ${isNight ? 'bg-indigo-400' : 'bg-orange-400'} animate-pulse`}
            style={{
              top: `${p.top}%`,
              left: `${p.left}%`,
              animationDelay: `${p.delay}s`,
              opacity: 0.3,
            }}
          ></div>
        ))}
      </div>

      <div className="relative w-64 h-64 md:w-80 md:h-80 mb-12 shrink-0 group">
        <div
          className={`absolute -inset-8 ${isNight ? 'bg-indigo-500/10' : 'bg-orange-500/20'} rounded-full blur-[100px] animate-pulse group-hover:opacity-100 transition-opacity`}
        ></div>
        <div
          className={`absolute -inset-1 border-2 ${isNight ? 'border-indigo-500/20' : 'border-orange-500/30'} rounded-3xl animate-[spin_10s_linear_infinite] opacity-40`}
        ></div>

        <div
          className={`relative w-full h-full ${isNight ? 'bg-indigo-950/30 border-white/10 ring-white/5' : 'bg-white/80 border-zinc-200 ring-black/5'} backdrop-blur-3xl rounded-3xl border shadow-[0_50px_100px_rgba(0,0,0,0.1)] ${isNight ? 'shadow-[0_50px_100px_rgba(0,0,0,0.8)]' : ''} z-10 overflow-hidden ring-1`}
        >
          {!videoError ? (
            <video
              ref={videoRef}
              autoPlay
              muted
              loop
              playsInline
              controls={false}
              className="absolute inset-0 w-full h-full object-cover"
              onError={() => setVideoError(true)}
              style={{ WebkitTransform: 'translateZ(0)' }} // Hardware acceleration to force inline play
            >
              <source
                src={isNight ? ASSETS.VIDEO_SLEEPY : ASSETS.VIDEO_ANALYZING}
                type="video/mp4"
              />
            </video>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <img
                src={isNight ? ASSETS.HERO_SLEEPY : ASSETS.MASCOT_HAPPY}
                alt="Chekki Mascot"
                className="w-full h-full object-contain"
              />
            </div>
          )}

          <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden opacity-40">
            <div
              className={`w-full h-1.5 bg-gradient-to-r from-transparent ${isNight ? 'via-indigo-400/85 shadow-[0_0_15px_#6366f1]' : 'via-orange-500/85 shadow-[0_0_15px_#f97316]'} to-transparent absolute top-0 animate-[scan_4s_linear_infinite]`}
            ></div>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center z-20 max-w-lg w-full px-4">
        <div className="h-24 flex items-center justify-center mb-6">
          <h2
            className={`text-2xl md:text-3xl font-black ${isNight ? 'text-white' : 'text-zinc-900'} text-center font-korean animate-fade-in-up tracking-tight drop-shadow-md break-keep text-balance`}
            key={textIndex}
          >
            {loadingTexts[textIndex]}
          </h2>
        </div>

        {/* Progress Bar */}
        <div className="w-64 bg-zinc-200/20 dark:bg-zinc-800/40 h-2 rounded-full overflow-hidden mb-6 relative z-20 border border-white/5 shadow-inner">
          <div
            className={`h-full ${isNight ? 'bg-brand-purple shadow-[0_0_10px_#7F77DD]' : 'bg-orange-500 shadow-[0_0_10px_#f97316]'} transition-all duration-1000 ease-out`}
            style={{ width: `${Math.min(100, ((textIndex + 1) / loadingTexts.length) * 100)}%` }}
          />
        </div>

        <div className="flex gap-3 mb-12">
          {[0, 1, 2].map((i) => (
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
            className={`px-8 py-3 rounded-2xl border transition-all animate-fade-in shadow-xl backdrop-blur-md min-h-[48px] text-[10px] font-black uppercase tracking-wide ${isNight ? 'border-white/10 bg-white/5 text-zinc-500 hover:text-white hover:border-white/30 hover:bg-white/10' : 'border-zinc-200 bg-white text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50'}`}
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
