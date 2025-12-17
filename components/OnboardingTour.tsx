
import React, { useState } from 'react';
import { ChekkiMascot } from './Icons';
import { useLanguage } from '../contexts/LanguageContext';

interface Props {
  onComplete: () => void;
}

export const OnboardingTour: React.FC<Props> = ({ onComplete }) => {
  const [step, setStep] = useState(0);
  const { t } = useLanguage();

  const steps = [
    {
      mood: "winking" as const,
      title: t('onb_1_title'),
      sub: t('onb_1_desc'),
      buttonText: t('onb_1_btn')
    },
    {
      mood: "happy" as const, // Changed to happy to be safe
      title: t('onb_2_title'),
      sub: t('onb_2_desc'),
      buttonText: t('onb_2_btn')
    },
    {
      mood: "happy" as const,
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
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-6 backdrop-blur-md">
      <div className="w-full max-w-md bg-zinc-900 rounded-3xl p-8 border border-zinc-800 relative overflow-hidden text-center animate-fade-in-up flex flex-col items-center">
        
        <div className="flex justify-center gap-2 mb-8 w-full">
          {steps.map((_, i) => (
            <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${i === step ? 'w-8 bg-orange-500' : 'w-2 bg-zinc-700'}`}></div>
          ))}
        </div>

        <div className="mb-8 w-48 h-48 bg-zinc-800 rounded-full flex items-center justify-center shadow-2xl shadow-orange-500/10 border-4 border-zinc-800 animate-bounce-subtle overflow-hidden p-6">
          <ChekkiMascot className="w-full h-full drop-shadow-xl" mood={steps[step].mood} />
        </div>

        <div className="mb-10 space-y-3">
          <h2 className="text-2xl font-black text-white font-korean leading-tight">
            {steps[step].title}
          </h2>
          <p className="text-zinc-400 font-korean text-lg font-medium">
            {steps[step].sub}
          </p>
        </div>

        <button 
          onClick={handleNext}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-2xl transition-all transform hover:scale-[1.02] shadow-lg shadow-orange-500/25 font-korean text-lg"
        >
          {steps[step].buttonText}
        </button>
      </div>
    </div>
  );
};
