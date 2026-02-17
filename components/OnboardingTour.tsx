
import React, { useState, useEffect } from 'react';
import { ASSETS } from '../constants';
import { useLanguage } from '../contexts/LanguageContext';
import { useAnalytics } from '../contexts/AnalyticsContext';

interface Props {
  onComplete: () => void;
}

export const OnboardingTour: React.FC<Props> = ({ onComplete }) => {
  const [step, setStep] = useState(0);
  const { t } = useLanguage();
  const { track } = useAnalytics();

  useEffect(() => {
    track('onboarding_step_view', { step });
  }, [step]);

  const steps = [
    { icon: "📸💥", title: t('onb_1_title'), sub: t('onb_1_desc'), buttonText: t('onb_1_btn') },
    { icon: "✨🪄", title: t('onb_2_title'), sub: t('onb_2_desc'), buttonText: t('onb_2_btn') },
    { icon: "🏫🎓", title: t('onb_academy_title'), sub: t('onb_academy_desc'), buttonText: t('onb_2_btn') },
    { icon: "🔒🛡️", title: t('onb_3_title'), sub: t('onb_3_desc'), buttonText: t('onb_3_btn') }
  ];

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      track('onboarding_complete');
      onComplete();
    }
  };

  const handleSkip = () => {
      track('onboarding_skipped', { lastStep: step });
      onComplete();
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center p-4 backdrop-blur-2xl overflow-hidden">
      <div className="w-full max-w-[340px] md:max-w-md bg-zinc-900 rounded-[2.5rem] p-8 md:p-10 border border-white/10 relative overflow-hidden text-center animate-fade-in-up flex flex-col items-center shadow-[0_40px_100px_rgba(0,0,0,0.8)] max-h-[95dvh]">
        
        {/* Step Indicators */}
        <div className="flex justify-center gap-2 mb-8 md:mb-12 w-full shrink-0">
          {steps.map((_, i) => (
            <div key={i} className={`h-1.5 rounded-full transition-all duration-700 ${i === step ? 'w-10 bg-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.8)]' : 'w-2 bg-zinc-800'}`}></div>
          ))}
        </div>

        {/* Circular Mascot Container */}
        <div className="mb-8 md:mb-12 w-44 h-44 md:w-64 md:h-64 relative flex items-center justify-center shrink-0">
            <div className={`absolute inset-0 bg-gradient-to-br ${step === 2 ? 'from-indigo-500/10 to-purple-500/10' : 'from-orange-500/10 to-transparent'} rounded-full blur-2xl`}></div>
            <div className="relative z-10 w-full h-full bg-zinc-800/20 rounded-full border border-white/5 flex items-center justify-center shadow-inner overflow-hidden p-6 md:p-10">
                 {step === 2 ? (
                     <span className="text-6xl md:text-8xl animate-float">🏫</span>
                 ) : (
                     <img src={ASSETS.LOGO} alt="Chekki Mascot" className="w-full h-full object-contain animate-float" />
                 )}
            </div>
            {/* Subtle glow rings */}
            <div className="absolute inset-0 border border-white/5 rounded-full scale-110"></div>
            <div className="absolute inset-0 border border-white/5 rounded-full scale-125 opacity-50"></div>
        </div>

        {/* Text Content */}
        <div className="mb-8 md:mb-14 space-y-3 md:space-y-4 shrink-0 flex flex-col items-center">
          <span className="text-3xl md:text-4xl mb-1 block">{steps[step].icon}</span>
          <h2 className="text-xl md:text-3xl font-black text-white font-display leading-tight tracking-tight break-keep px-4">{steps[step].title}</h2>
          <p className="text-zinc-500 font-korean text-sm md:text-lg font-bold leading-relaxed max-w-[280px] mx-auto opacity-90 break-keep">{steps[step].sub}</p>
        </div>

        {/* Actions */}
        <div className="w-full shrink-0 mt-auto">
            <button onClick={handleNext} className="w-full py-4 md:py-6 bg-orange-500 hover:bg-orange-600 text-white font-black rounded-2xl md:rounded-[2rem] transition-all transform active:scale-95 shadow-[0_15px_30px_rgba(249,115,22,0.3)] font-display text-lg md:text-2xl">
              {steps[step].buttonText}
            </button>
            <button onClick={handleSkip} className="mt-4 md:mt-6 text-zinc-600 text-[10px] md:text-xs font-black uppercase tracking-[0.3em] hover:text-zinc-400 transition-colors py-2 px-4 block mx-auto">
              {t('onb_skip')}
            </button>
        </div>
      </div>
    </div>
  );
};
