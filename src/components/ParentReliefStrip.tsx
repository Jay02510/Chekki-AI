import { Question, Camera, CheckCircle, ArrowRight } from '@phosphor-icons/react';

interface Props {
  isNight: boolean;
  isKo: boolean;
}

export default function ParentReliefStrip({ isNight, isKo }: Props) {
  const steps = [
    {
      icon: <Question size={22} weight="bold" />,
      labelKo: '영어 숙제, 뭐가 맞는지 모르겠고',
      labelEn: "Stuck guessing at English homework",
    },
    {
      icon: <Camera size={22} weight="bold" />,
      labelKo: '숙제 사진 한 장 스캔하면',
      labelEn: 'Scan it',
    },
    {
      icon: <CheckCircle size={22} weight="bold" />,
      labelKo: '한국어로 바로 설명해드려요',
      labelEn: 'Answer explained in Korean, done',
    },
  ];

  return (
    <div className="hero-text mt-8 flex flex-wrap items-center gap-3">
      {steps.map((step, i) => (
        <div key={i} className="flex items-center gap-3">
          <div
            className={`flex items-center gap-2 px-4 py-2.5 rounded-full border text-sm font-bold break-keep ${
              isNight
                ? 'bg-white/5 border-white/10 text-white/80'
                : 'bg-white border-slate-200 text-slate-700 shadow-sm'
            }`}
          >
            <span className="text-brand shrink-0">{step.icon}</span>
            <span>{isKo ? step.labelKo : step.labelEn}</span>
          </div>
          {i < steps.length - 1 && (
            <ArrowRight size={16} weight="bold" className={isNight ? 'text-white/30' : 'text-slate-400'} />
          )}
        </div>
      ))}
    </div>
  );
}
