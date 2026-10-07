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

  const features = [t('feat_overlay'), t('feat_script'), t('feat_pronounce'), t('feat_practice')];

  useEffect(() => {
    // Feature rotation timer
    const featureInterval = setInterval(() => {
      setFeatureIndex((prev) => (prev + 1) % features.length);
    }, 450);

    // Safety timeout
    const isIPad = /iPad|Macintosh/i.test(navigator.userAgent) && navigator.maxTouchPoints > 1;
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
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-ground px-6 transition-opacity duration-200 ${isExiting ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
    >
      <div className="w-full max-w-xs">
        <div className="relative aspect-square w-full overflow-hidden rounded-md bg-sign">
          {!videoError ? (
            <video
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              className="h-full w-full object-cover"
              onError={() => setVideoError(true)}
            >
              {/* Cloudinary on native for reliability, local on web */}
              <source src={Capacitor.isNativePlatform() ? ASSETS.VIDEO_INTRO : '/chekki-intro.mp4'} type="video/mp4" />
            </video>
          ) : (
            <img src={ASSETS.MASCOT_HAPPY} alt="" className="h-full w-full object-contain" />
          )}
          <div className="absolute inset-x-0 bottom-0 h-1.5 bg-line" aria-hidden="true" />
        </div>

        <div className="mt-6 text-center">
          <h1 className="sign-ko text-[34px] text-ink">Chekki</h1>
          <p className="mt-1 text-[15px] font-semibold text-ink-2 break-keep">채점은 채키가, 칭찬은 엄마가</p>
          <p className="sign-en text-[13px] text-ink-3">Grading by Chekki, praise by Mom</p>
        </div>

        <div className="relative mx-auto mt-6 h-1.5 w-40 overflow-hidden rounded-full bg-rule" aria-hidden="true">
          <div className="h-full rounded-full bg-line animate-[width_2.8s_linear_forwards]" style={{ width: '0%' }} />
        </div>
        <p className="num mt-3 text-center text-xs text-ink-3">v{APP_VERSION}</p>
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
