
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
    { icon: "📸", title: t('onb_1_title'), sub: t('onb_1_desc'), buttonText: t('onb_1_btn') },
    { icon: "✨", title: t('onb_2_title'), sub: t('onb_2_desc'), buttonText: t('onb_2_btn') },
    { icon: "🏫", title: t('onb_academy_title'), sub: t('onb_academy_desc'), buttonText: t('onb_2_btn') },
    { icon: "🔒", title: t('onb_3_title'), sub: t('onb_3_desc'), buttonText: t('onb_3_btn') }
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
    <div className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center p-3 md:p-6 backdrop-blur-2xl overflow-hidden">
      <div className="w-full max-w-[320px] md:max-w-md bg-zinc-900 rounded-[2rem] p-6 md:p-10 border border-white/10 relative overflow-hidden text-center animate-fade-in-up flex flex-col items-center shadow-[0_0_100px_rgba(249,115,22,0.15)] my-auto">
        
        <div className="flex justify-center gap-1.5 mb-6 md:mb-8 w-full shrink-0">
          {steps.map((_, i) => (
            <div key={i} className={`h-1 rounded-full transition-all duration-700 ${i === step ? 'w-8 bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.6)]' : 'w-1.5 bg-zinc-800'}`}></div>
          ))}
        </div>

        <div className="mb-6 md:mb-8 w-24 h-24 md:w-48 md:h-48 relative flex items-center justify-center shrink-0">
            <div className={`absolute inset-0 bg-gradient-to-br ${step === 2 ? 'from-indigo-500/20 to-purple-500/20' : 'from-brand-orange/20 to-brand-purple/20'} rounded-full blur-2xl animate-pulse`}></div>
            <div className="relative z-10 w-full h-full bg-zinc-800/40 rounded-full border border-white/5 flex items-center justify-center animate-float shadow-xl overflow-hidden backdrop-blur-sm">
                 {step === 2 ? (
                     <span className="text-4xl md:text-7xl transition-transform transform hover:scale-110">🏫</span>
                 ) : (
                     <img src={ASSETS.LOGO} alt="Chekki Mascot" className="w-full h-full object-contain scale-[1.1]" />
                 )}
            </div>
        </div>

        <div className="mb-6 md:mb-10 space-y-2 md:space-y-3 shrink-0">
          <div className="flex flex-col items-center gap-1 md:gap-1.5">
            <span className="text-xl md:text-2xl mb-0.5">{steps[step].icon}</span>
            <h2 className="text-lg md:text-2xl font-black text-white font-display leading-tight tracking-tight break-keep">{steps[step].title}</h2>
          </div>
          <p className="text-zinc-400 font-korean text-xs md:text-base font-medium leading-relaxed max-w-[240px] mx-auto opacity-90 break-keep">{steps[step].sub}</p>
        </div>

        <div className="w-full shrink-0">
            <button onClick={handleNext} className="w-full py-3.5 md:py-5 bg-orange-500 hover:bg-orange-600 text-white font-black rounded-xl md:rounded-[1.5rem] transition-all transform active:scale-95 shadow-xl font-korean text-sm md:text-lg">
              {steps[step].buttonText}
            </button>
            {step < steps.length - 1 && (
                <button onClick={handleSkip} className="mt-3 md:mt-5 text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em] hover:text-zinc-300 transition-colors py-1 px-2">
                  {t('onb_skip')}
                </button>
            )}
        </div>
      </div>
    </div>
  );
};
