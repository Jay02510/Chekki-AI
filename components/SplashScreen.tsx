
import React, { useEffect, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { ChekkiMascot } from './Icons';
import { ASSETS } from '../constants';

interface Props {
  onFinish: () => void;
}

export const SplashScreen: React.FC<Props> = ({ onFinish }) => {
  const [isExiting, setIsExiting] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [featureIndex, setFeatureIndex] = useState(0);
  const { language } = useLanguage();

  const features = language === 'ko' ? [
    "🔍 AI 숙제 채점",
    "🔊 원어민 발음",
    "📝 오답 노트",
    "🪄 연습문제 생성"
  ] : [
    "🔍 AI Grading",
    "🔊 Pronunciation",
    "📝 Review Notes",
    "🪄 Practice Sheets"
  ];

  useEffect(() => {
    const featureInterval = setInterval(() => {
      setFeatureIndex(prev => (prev + 1) % features.length);
    }, 200); // Super fast rotation for high-energy feel

    const timer = setTimeout(() => {
      setIsExiting(true);
    }, 600); 

    const cleanup = setTimeout(() => {
      onFinish();
    }, 800);

    return () => {
      clearInterval(featureInterval);
      clearTimeout(timer);
      clearTimeout(cleanup);
    };
  }, [onFinish, features.length]);

  return (
    <div className={`fixed inset-0 z-[100] bg-zinc-950 flex flex-col items-center justify-center transition-opacity duration-200 ${isExiting ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
      
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-orange-500/10 rounded-full blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-emerald-500/10 rounded-full blur-[100px] animate-pulse"></div>
      </div>

      <div className="relative z-10 flex flex-col items-center">
        <div className="relative mb-6">
           <div className="w-48 h-48 bg-zinc-900 rounded-3xl flex items-center justify-center shadow-2xl border border-zinc-800 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent z-20"></div>
              {!videoError ? (
                <video autoPlay muted loop playsInline preload="auto" className="w-full h-full object-contain z-10" onError={() => setVideoError(true)}>
                  <source src={ASSETS.VIDEO_INTRO} type="video/mp4" />
                </video>
              ) : (
                <div className="w-full h-full p-4 animate-float">
                   <ChekkiMascot className="w-full h-full" mood="happy" />
                </div>
              )}
           </div>
        </div>

        <div className="text-center space-y-1 h-20">
          <h1 className="text-3xl font-black text-white tracking-tight font-display">
            Chekki<span className="text-orange-500">AI</span>
          </h1>
          <div className="relative h-5 overflow-hidden">
            {features.map((feat, index) => (
                <p key={index} className={`absolute inset-0 w-full text-center text-zinc-400 font-bold text-xs uppercase tracking-widest transition-all duration-200 transform ${index === featureIndex ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
                    {feat}
                </p>
            ))}
          </div>
        </div>

        <div className="mt-6 w-32 h-0.5 bg-zinc-800 rounded-full overflow-hidden relative">
          <div className="h-full bg-orange-500 animate-[width_0.8s_linear_forwards]" style={{ width: '0%' }}></div>
        </div>
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
