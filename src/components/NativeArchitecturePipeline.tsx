import React, { useState } from 'react';
import { Sparkle, DeviceMobile, Cpu, ChatsCircle, CheckCircle } from '@phosphor-icons/react';

interface Props {
  isNight?: boolean;
}

export const NativeArchitecturePipeline: React.FC<Props> = ({ isNight = true }) => {
  const [activeStep, setActiveStep] = useState<number>(0);

  const pipelineSteps = [
    {
      id: 'step-ft',
      stepNum: '01',
      title: 'Foreign Teacher 30s Log',
      icon: DeviceMobile,
      color: 'from-orange-500 to-amber-500',
      badgeColor: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      shortDesc: 'Foreign Teacher submits a 30-second mobile log with quiz score and student spotlight tag.'
    },
    {
      id: 'step-ai',
      stepNum: '02',
      title: 'Bilingual KakaoTalk Generator',
      icon: Cpu,
      color: 'from-blue-500 to-purple-500',
      badgeColor: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      shortDesc: 'AI turns raw English notes into polite Korean (존댓말) KakaoTalk updates in seconds.'
    },
    {
      id: 'step-kt',
      stepNum: '03',
      title: 'KT Review & 1-Click Copy',
      icon: ChatsCircle,
      color: 'from-pink-500 to-rose-500',
      badgeColor: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
      shortDesc: 'Korean Teacher reviews draft, edits nuances if needed, and 1-click copies into KakaoTalk.'
    }
  ];

  return (
    <div
      className={`p-6 sm:p-8 rounded-3xl border shadow-xl space-y-6 font-sans transition-all ${
        isNight ? 'bg-[#060608] border-white/10 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-900'
      }`}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-orange-500 font-mono block mb-1">
            HOW CHEKKI WORKS
          </span>
          <h3 className="text-xl sm:text-2xl font-black tracking-tight">
            From 30-Second FT Log to Ready-to-Copy KakaoTalk Message
          </h3>
        </div>
        <span className="px-3.5 py-1.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20 text-xs font-bold self-start sm:self-auto">
          ⚡ 3 Simple Steps
        </span>
      </div>

      {/* 3 Step Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {pipelineSteps.map((step, idx) => {
          const IconComp = step.icon;
          const isActive = activeStep === idx;
          return (
            <div
              key={step.id}
              onClick={() => setActiveStep(idx)}
              className={`p-5 rounded-2xl border transition-all cursor-pointer space-y-3 ${
                isActive
                  ? isNight
                    ? 'bg-white/10 border-orange-500 shadow-lg shadow-orange-500/10'
                    : 'bg-orange-50/80 border-orange-500 shadow-md'
                  : isNight
                  ? 'bg-white/5 border-white/10 hover:border-white/20'
                  : 'bg-zinc-50 border-zinc-200 hover:border-zinc-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold border ${step.badgeColor}`}>
                  STEP {step.stepNum}
                </span>
                <IconComp size={20} className="text-orange-500" />
              </div>
              <h4 className="font-bold text-sm tracking-tight">{step.title}</h4>
              <p className={`text-xs leading-relaxed ${isNight ? 'text-zinc-400' : 'text-zinc-600'}`}>
                {step.shortDesc}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
