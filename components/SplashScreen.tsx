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
  const { language, t } = useLanguage();

  const features = language === 'ko' ? [
    { main: "🎯 실시간 정답 오버레이", sub: "사진 한 장으로 마법처럼 나타나는 답안" },
    { main: "💌 다정한 티칭 스크립트", sub: "엄마의 목소리로 가르치는 법을 알려드려요" },
    { main: "🔊 원어민 발음 & 스피킹", sub: "발음 교정부터 디지털 도장 보상까지" },
    { main: "🪄 연습문제 무제한 생성", sub: "AI가 만드는 우리 아이 맞춤형 학습지" }
  ] : [
    { main: "🎯 Instant Answer Overlays", sub: "Magic answers appearing on your paper" },
    { main: "💌 Bilingual Teaching Scripts", sub: "Know exactly what to say to your child" },
    { main: "🔊 Native Voice & Speaking", sub: "Digital stamps for perfect pronunciation" },
    { main: "🪄 AI Practice Generator", sub: "Custom worksheets built in seconds" }
  ];

  useEffect(() => {
    const featureInterval = setInterval(() => {
      setFeatureIndex(prev => (prev + 1) % features.length);
    }, 650); 

    const exitTimer = setTimeout(() => {
      setIsExiting(true);
    }, 3200); 

    const cleanupTimer = setTimeout(() => {
      onFinish();
    }, 3600);

    return () => {
      clearInterval(featureInterval);
      clearTimeout(exitTimer);
      clearTimeout(cleanupTimer);
    };
  }, [onFinish, features.length]);

  return (
    <div className={`fixed inset-0 z-[100] bg-[#050505] flex flex-col items-center justify-center transition-opacity duration-700 ${isExiting ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
      
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-orange-500/10 rounded-full blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-[100px] animate-pulse"></div>
      </div>

      <div className="relative z-10 flex flex-col items-center w-full max-w-sm px-6">
        <div className="relative mb-10">
           <div className="w-56 h-56 md:w-72 md:h-72 bg-zinc-900 rounded-[3rem] flex items-center justify-center shadow-2xl border border-white/5 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent z-20 pointer-events-none"></div>
              {!videoError ? (
                <video 
                  autoPlay 
                  muted 
                  loop 
                  playsInline 
                  preload="auto" 
                  className="w-full h-full object-contain z-10 scale-125" 
                  onError={() => setVideoError(true)}
                >
                  <source src={ASSETS.VIDEO_INTRO} type="video/mp4" />
                </video>
              ) : (
                <div className="w-full h-full flex items-center justify-center animate-float">
                   <img 
                    src={ASSETS.MASCOT_HAPPY} 
                    alt="Chekki Logo Mascot" 
                    className="w-full h-full object-contain drop-shadow-2xl scale-125" 
                   />
                </div>
              )}
           </div>
           
           <div className="absolute -inset-6 bg-orange-500/20 blur-3xl rounded-full -z-10 animate-pulse"></div>
        </div>

        <div className="text-center space-y-4 w-full min-h-[120px]">
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter font-display leading-none">
            Chekki<span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-pink-500">AI</span>
          </h1>
          
          <div className="relative h-16 w-full overflow-hidden">
            {features.map((feat, index) => (
                <div 
                  key={index} 
                  className={`absolute inset-0 w-full flex flex-col items-center justify-center transition-all duration-500 transform ${index === featureIndex ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95'}`}
                >
                    <p className="text-zinc-200 font-black text-sm md:text-base uppercase tracking-widest mb-1">{feat.main}</p>
                    <p className="text-zinc-500 font-bold text-[9px] md:text-xs uppercase tracking-[0.1em] opacity-80">{feat.sub}</p>
                </div>
            ))}
          </div>
        </div>

        <div className="mt-12 w-48 h-1.5 bg-zinc-800 rounded-full overflow-hidden relative border border-white/5">
          <div className="h-full bg-gradient-to-r from-orange-500 to-pink-500 animate-[width_3.2s_linear_forwards]" style={{ width: '0%' }}></div>
        </div>
        
        <div className="mt-8 flex flex-col items-center gap-1">
          <p className="text-[10px] text-zinc-700 font-black uppercase tracking-[0.3em]">
            Chekki AI Labs
          </p>
          <p className="text-[8px] text-zinc-800 font-black uppercase tracking-widest">
            {language === 'ko' ? "채점은 채키가, 칭찬은 엄마가" : "Grading by Chekki, Praise by Mom"}
          </p>
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