
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
  const { t, language } = useLanguage();

  // Features to cycle through during loading
  const features = language === 'ko' ? [
    "🔍 AI 숙제 채점 (AI Grading)",
    "🔊 원어민 발음 (Native Audio)",
    "📝 오답 노트 (Review Note)",
    "🪄 연습문제 생성 (Practice Gen)"
  ] : [
    "🔍 AI Auto-Grading",
    "🔊 Native Pronunciation",
    "📝 Review Notes",
    "🪄 Practice Generator"
  ];

  useEffect(() => {
    // Cycle features every 1200ms (slower for readability)
    const featureInterval = setInterval(() => {
      setFeatureIndex(prev => (prev + 1) % features.length);
    }, 1200);

    // Start exit sequence at 4.5s
    const timer = setTimeout(() => {
      setIsExiting(true);
    }, 4500); 

    // Finish at 5s
    const cleanup = setTimeout(() => {
      onFinish();
    }, 5000);

    return () => {
      clearInterval(featureInterval);
      clearTimeout(timer);
      clearTimeout(cleanup);
    };
  }, [onFinish, features.length]);

  return (
    <div className={`fixed inset-0 z-[100] bg-zinc-950 flex flex-col items-center justify-center transition-opacity duration-500 ${isExiting ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
      
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-orange-500/10 rounded-full blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-emerald-500/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="relative z-10 flex flex-col items-center">
        
        <div className="relative mb-8 transform transition-transform animate-bounce-subtle">
           {/* Video Container */}
           <div className="w-64 h-64 bg-zinc-900 rounded-3xl flex items-center justify-center shadow-2xl border border-zinc-800 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent z-20 pointer-events-none"></div>
              
              {!videoError ? (
                <div className="w-full h-full flex items-center justify-center bg-black/40">
                    <video 
                      autoPlay 
                      muted 
                      loop 
                      playsInline 
                      preload="auto"
                      className="w-full h-full object-contain z-10"
                      onError={() => {
                        setVideoError(true);
                      }}
                    >
                      <source src={ASSETS.VIDEO_INTRO} type="video/mp4" />
                    </video>
                </div>
              ) : (
                <div className="w-full h-full p-6 animate-float">
                   <ChekkiMascot className="w-full h-full drop-shadow-2xl filter brightness-110" mood="happy" />
                </div>
              )}
           </div>
           <div className="absolute -top-4 -right-4 text-2xl animate-pulse">✨</div>
           <div className="absolute -bottom-2 -left-4 text-xl animate-pulse" style={{animationDelay: '0.5s'}}>✨</div>
        </div>

        <div className="text-center space-y-2 h-24">
          <h1 className="text-4xl font-black text-white tracking-tight animate-fade-in-up font-display">
            Chekki<span className="text-orange-500">AI</span>
          </h1>
          
          {/* Dynamic Feature Text */}
          <div className="relative h-6 overflow-hidden">
            {features.map((feat, index) => (
                <p 
                    key={index}
                    className={`absolute inset-0 w-full text-center text-zinc-400 font-bold tracking-wide font-korean transition-all duration-500 transform ${
                        index === featureIndex 
                            ? 'opacity-100 translate-y-0 scale-100' 
                            : 'opacity-0 translate-y-4 scale-95'
                    }`}
                >
                    {feat}
                </p>
            ))}
          </div>
        </div>

        {/* Progress bar matches duration (5s) */}
        <div className="mt-8 w-48 h-1 bg-zinc-800 rounded-full overflow-hidden relative">
          <div className="h-full bg-orange-500 animate-[width_5s_ease-in-out_forwards]" style={{ width: '0%' }}></div>
        </div>
        
        <p className="mt-2 text-[10px] text-zinc-600 font-mono uppercase tracking-widest animate-pulse">
            Loading Resources...
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
