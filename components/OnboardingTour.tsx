
import React, { useState } from 'react';
import { ASSETS } from '../constants';
import { useLanguage } from '../contexts/LanguageContext';

interface Props {
  onComplete: () => void;
}

export const OnboardingTour: React.FC<Props> = ({ onComplete }) => {
  const [step, setStep] = useState(0);
  const { t, language } = useLanguage();

  const steps = [
    {
      icon: "📸",
      title: t('onb_1_title'),
      sub: t('onb_1_desc'),
      buttonText: t('onb_1_btn')
    },
    {
      icon: "✨",
      title: t('onb_2_title'),
      sub: t('onb_2_desc'),
      buttonText: t('onb_2_btn')
    },
    {
      icon: "🏫",
      title: language === 'ko' ? "우리 아이 학원과 함께" : "Academy Authorized",
      sub: language === 'ko' ? "학원 코드를 입력하면 프리미엄 기능을 무료로 이용할 수 있어요." : "Enter your Hagwon code to unlock all Pro features for free.",
      buttonText: t('onb_2_btn')
    },
    {
      icon: "🔒",
      title: t('onb_3_title'),
      sub: t('onb_3_desc'),
      buttonText: t('onb_3_btn')
    }
  ];

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      onComplete();
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center p-6 backdrop-blur-xl">
      <div className="w-full max-w-md bg-zinc-900 rounded-[2.5rem] p-8 md:p-10 border border-white/5 relative overflow-hidden text-center animate-fade-in-up flex flex-col items-center shadow-[0_0_100px_rgba(249,115,22,0.1)]">
        
        {/* Progress Bar */}
        <div className="flex justify-center gap-2 mb-10 w-full">
          {steps.map((_, i) => (
            <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${i === step ? 'w-10 bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]' : 'w-2 bg-zinc-800'}`}></div>
          ))}
        </div>

        {/* Mascot / Icon Area - INCREASED SIZE & REMOVED PADDING */}
        <div className="mb-10 w-64 h-64 md:w-72 md:h-72 relative flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-br from-brand-orange/20 to-brand-purple/20 rounded-full blur-2xl animate-pulse"></div>
            <div className="relative z-10 w-full h-full bg-zinc-800/50 rounded-full border-4 border-white/5 flex items-center justify-center p-0 animate-float shadow-2xl overflow-hidden">
                 {step === 2 ? (
                     <span className="text-8xl md:text-9xl">🏫</span>
                 ) : (
                     <img 
                        src={ASSETS.LOGO} 
                        alt="Chekki Mascot" 
                        className="w-full h-full object-contain scale-110" 
                     />
                 )}
            </div>
        </div>

        {/* Content */}
        <div className="mb-12 space-y-4">
          <div className="flex flex-col items-center gap-2">
            <span className="text-2xl mb-2">{steps[step].icon}</span>
            <h2 className="text-2xl md:text-3xl font-black text-white font-display leading-tight">
                {steps[step].title}
            </h2>
          </div>
          <p className="text-zinc-400 font-korean text-lg font-medium leading-relaxed max-w-[280px] mx-auto">
            {steps[step].sub}
          </p>
        </div>

        <button 
          onClick={handleNext}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white font-black py-5 rounded-2xl transition-all transform hover:scale-[1.02] active:scale-95 shadow-xl shadow-orange-500/25 font-korean text-xl"
        >
          {steps[step].buttonText}
        </button>

        {step < steps.length - 1 && (
            <button 
                onClick={onComplete}
                className="mt-6 text-zinc-600 text-[10px] font-black uppercase tracking-widest hover:text-zinc-400 transition-colors"
            >
                Skip Intro
            </button>
        )}
      </div>
    </div>
  );
};
