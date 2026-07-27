import React, { useState } from 'react';
import { CaretRight, Sparkle, Database, Article, CheckCircle, ArrowRight, DeviceMobile, Cpu, ChatsCircle } from '@phosphor-icons/react';

interface Props {
  isNight?: boolean;
}

export const NativeArchitecturePipeline: React.FC<Props> = ({ isNight = true }) => {
  const [activeStep, setActiveStep] = useState<number>(0);

  const pipelineSteps = [
    {
      id: 'step-form',
      stepNum: '01',
      title: 'Foreign Teacher Log',
      subtitle: '<30s Daily Mobile Form',
      icon: DeviceMobile,
      color: 'from-orange-500 to-amber-500',
      borderColor: 'border-orange-500',
      badgeColor: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      desc: 'Foreign Teachers complete a quick 30-second mobile form selecting Class, Topic, Energy Level, Activities, and flagged Student Exceptions.',
      highlights: [
        'Quick 30-second checkmark entry on any phone or laptop',
        'Auto-saves progress locally so work is never lost',
        'Flagged student exception cases trigger phone consultation prep'
      ]
    },
    {
      id: 'step-ai',
      stepNum: '02',
      title: 'Chekki AI Processor',
      subtitle: 'Instant Bilingual Generator',
      icon: Cpu,
      color: 'from-blue-500 to-purple-500',
      borderColor: 'border-purple-500',
      badgeColor: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      desc: 'Translates raw English teacher notes into polite Korean honorifics (존댓말) KakaoTalk scripts & counselor phone talking points in under 2 seconds.',
      highlights: [
        'Polite Korean (존댓말) KakaoTalk scripts tailored for parents',
        'Original English teacher summary attached directly below',
        '3-part phone consultation script generated for flagged students'
      ]
    },
    {
      id: 'step-db',
      stepNum: '03',
      title: 'Secure Cloud Database',
      subtitle: 'Real-Time Auto Sync',
      icon: Database,
      color: 'from-emerald-500 to-teal-500',
      borderColor: 'border-emerald-500',
      badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      desc: 'Safely stores all class logs, AI report drafts, and teacher edit histories with school-level privacy protection.',
      highlights: [
        'Multi-teacher class roster and campus isolation',
        'Offline auto-save ensures 0% data loss during internet drops',
        'Historical report archive for parent consultation lookups'
      ]
    },
    {
      id: 'step-kt',
      stepNum: '04',
      title: 'Korean Teacher Dashboard',
      subtitle: 'Human-in-the-Loop Edit & Copy',
      icon: ChatsCircle,
      color: 'from-pink-500 to-rose-500',
      borderColor: 'border-pink-500',
      badgeColor: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
      desc: 'Korean Teachers review and edit AI drafts directly on their dashboard before 1-click copying to parents via KakaoTalk.',
      highlights: [
        'Strict Human-in-the-Loop: No automatic parent messages sent without review',
        'Live editable text area for instant wording adjustments',
        '1-Click Copy formatted KakaoTalk script with automatic status update'
      ]
    }
  ];

  const currentStep = pipelineSteps[activeStep];
  const StepIcon = currentStep.icon;

  return (
    <div
      className={`p-6 sm:p-8 rounded-3xl border shadow-2xl space-y-8 font-sans transition-all ${
        isNight ? 'bg-[#060608] border-white/15 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-900'
      }`}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-orange-500 font-mono block mb-1">
            HOW CHEKKI AI WORKS
          </span>
          <h3 className="text-xl sm:text-2xl font-black tracking-tight">
            Simple 4-Step Class Report User Flow
          </h3>
        </div>
        <span className="px-3.5 py-1.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20 text-xs font-bold self-start sm:self-auto">
          ⚡ 30-Second FT Input ➔ 1-Click KakaoTalk Copy
        </span>
      </div>

      {/* Pipeline Step Cards Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {pipelineSteps.map((step, idx) => {
          const Icon = step.icon;
          const isActive = activeStep === idx;
          return (
            <button
              key={step.id}
              type="button"
              onClick={() => setActiveStep(idx)}
              className={`p-5 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between space-y-4 ${
                isActive
                  ? isNight
                    ? `bg-[#0c0a10] ${step.borderColor} shadow-xl shadow-orange-500/10 scale-[1.02]`
                    : `bg-orange-50/80 ${step.borderColor} shadow-md scale-[1.02]`
                  : isNight
                  ? 'bg-white/5 border-white/10 hover:border-white/20 text-zinc-400'
                  : 'bg-zinc-50 border-zinc-200 hover:border-zinc-300 text-zinc-600'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-black text-orange-500">
                  STEP {step.stepNum}
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${step.badgeColor}`}>
                  Stage {idx + 1}
                </span>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Icon size={20} className={isActive ? 'text-orange-500' : 'text-zinc-400'} weight="bold" />
                  <h4 className={`font-black text-sm ${isActive ? (isNight ? 'text-white' : 'text-zinc-900') : ''}`}>
                    {step.title}
                  </h4>
                </div>
                <p className="text-[11px] text-zinc-500 font-mono">{step.subtitle}</p>
              </div>

              {isActive && (
                <div className="w-full h-1 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full animate-pulse" />
              )}
            </button>
          );
        })}
      </div>

      {/* Active Step User Flow Summary Card */}
      <div
        className={`p-6 sm:p-8 rounded-3xl border space-y-6 transition-all ${
          isNight ? 'bg-[#08080c] border-white/10' : 'bg-zinc-50 border-zinc-200'
        }`}
      >
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${currentStep.color} flex items-center justify-center text-white shadow-lg shrink-0`}>
            <StepIcon size={24} weight="bold" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-orange-500 uppercase">
                Step {currentStep.stepNum} Overview
              </span>
              <span className="text-xs text-zinc-500">•</span>
              <span className="text-xs font-mono text-emerald-400">{currentStep.title}</span>
            </div>
            <h4 className="text-base sm:text-lg font-black text-white">{currentStep.desc}</h4>
          </div>
        </div>

        {/* User-Friendly Bullet Highlights */}
        <div className="space-y-3 pt-4 border-t border-white/10">
          <span className="text-xs font-bold text-zinc-400 block uppercase tracking-wider">Key Benefits & Features:</span>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {currentStep.highlights.map((item, idx) => (
              <div key={idx} className={`p-4 rounded-2xl border flex items-start gap-2.5 text-xs ${isNight ? 'bg-white/[0.02] border-white/5 text-zinc-200' : 'bg-white border-zinc-200 text-zinc-800'}`}>
                <CheckCircle size={16} weight="fill" className="text-emerald-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed font-medium">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
