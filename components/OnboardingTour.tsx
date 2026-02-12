
import React, { useState } from 'react';
import { ASSETS } from '../constants';
import { useLanguage } from '../contexts/LanguageContext';

interface Props {
  onComplete: () => void;
}

export const OnboardingTour: React.FC<Props> = ({ onComplete }) => {
  const [step, setStep] = useState(0);
  const { t } = useLanguage();

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
      title: t('onb_academy_title'),
      sub: t('onb_academy_desc'),
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
    <div className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center p-6 backdrop-blur-2xl">
      <div className="w-full max-w-md bg-zinc-900 rounded-[3rem] p-10 md:p-14 border border-white/10 relative overflow-hidden text-center animate-fade-in-up flex flex-col items-center shadow-[0_0_120px_rgba(249,115,22,0.15)] ring-1 ring-white/5">
        
        <div className="flex justify-center gap-2.5 mb-12 w-full">
          {steps.map((_, i) => (
            <div key={i} className={`h-2 rounded-full transition-all duration-700 ${i === step ? 'w-12 bg-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.6)]' : 'w-2.5 bg-zinc-800'}`}></div>
          ))}
        </div>

        <div className="mb-12 w-64 h-64 md:w-80 md:h-80 relative flex items-center justify-center">
            <div className={`absolute inset-0 bg-gradient-to-br ${step === 2 ? 'from-indigo-500/20 to-purple-500/20' : 'from-brand-orange/20 to-brand-purple/20'} rounded-full blur-3xl animate-pulse`}></div>
            <div className="relative z-10 w-full h-full bg-zinc-800/40 rounded-full border-4 border-white/5 flex items-center justify-center animate-float shadow-2xl overflow-hidden backdrop-blur-sm">
                 {step === 2 ? (
                     <span className="text-8xl md:text-9xl transition-transform transform hover:scale-110">🏫</span>
                 ) : (
                     <img 
                        src={ASSETS.LOGO} 
                        alt="Chekki Mascot" 
                        className="w-full h-full object-contain scale-[1.3] md:scale-[1.4]" 
                     />
                 )}
            </div>
        </div>

        <div className="mb-14 space-y-5 md:space-y-6">
          <div className="flex flex-col items-center gap-3">
            <span className="text-3xl md:text-4xl mb-2">{steps[step].icon}</span>
            <h2 className="text-3xl md:text-4xl font-black text-white font-display leading-[1.1] tracking-tight break-keep">
                {steps[step].title}
            </h2>
          </div>
          <p className="text-zinc-400 font-korean text-lg md:text-xl font-medium leading-relaxed max-w-[320px] mx-auto opacity-90 break-keep">
            {steps[step].sub}
          </p>
        </div>

        <button 
          onClick={handleNext}
          className="w-full h-16 md:h-20 bg-orange-500 hover:bg-orange-600 text-white font-black py-4 rounded-2xl md:rounded-[2rem] transition-all transform hover:scale-[1.02] active:scale-95 shadow-2xl shadow-orange-500/30 font-korean text-xl md:text-2xl ring-2 ring-white/10"
        >
          {steps[step].buttonText}
        </button>

        {step < steps.length - 1 && (
            <button 
                onClick={onComplete}
                className="mt-8 text-zinc-500 text-xs md:text-sm font-black uppercase tracking-[0.3em] hover:text-zinc-300 transition-colors py-2 px-4 rounded-lg hover:bg-white/5"
            >
                {t('onb_skip')}
            </button>
        )}
      </div>
    </div>
  );
};
