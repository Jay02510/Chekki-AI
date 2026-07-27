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
      title: 'Foreign Teacher Form',
      subtitle: '<30s Daily Class Log',
      icon: DeviceMobile,
      color: 'from-orange-500 to-amber-500',
      borderColor: 'border-orange-500',
      badgeColor: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      desc: 'Native React form captures Class, Textbook, Topic, Energy Level, Activities, General Comments, and Student Exceptions.',
      dataPayload: {
        className: 'POLY Seocho 7A',
        date: '2026-07-27',
        textbook: 'Bricks Reading 150',
        lessonTopic: 'Unit 4: Photosynthesis',
        energyLevel: 'High Energy and Engaged',
        activities: ['Reading', 'Speaking', 'Worksheet'],
        exceptions: [
          { studentName: 'Min-jun', details: 'Struggled with target word Chloroplast' }
        ]
      }
    },
    {
      id: 'step-ai',
      stepNum: '02',
      title: 'Gemini 2.5 Flash Engine',
      subtitle: '3-Branch Dual AI Router',
      icon: Cpu,
      color: 'from-blue-500 to-purple-500',
      borderColor: 'border-purple-500',
      badgeColor: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      desc: 'Bypasses Make.com completely. Executes exact system prompts for Bilingual Summaries, Student Exceptions, and Phone Consultation Talking Points in sub-seconds.',
      dataPayload: {
        prompt1: 'Bilingual KO+EN Class Summary (3-4 sentences)',
        prompt2: 'Polite Korean Student Exception Update (존댓말)',
        prompt3: '3-4 Actionable Phone Consultation Talking Points',
        latency: '1.2 seconds',
        costPerReport: '$0.001'
      }
    },
    {
      id: 'step-db',
      stepNum: '03',
      title: 'Firestore Cloud DB',
      subtitle: 'Real-Time Multi-Tenant Storage',
      icon: Database,
      color: 'from-emerald-500 to-teal-500',
      borderColor: 'border-emerald-500',
      badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      desc: 'Persists class logs, AI drafts, and KT edit versions under schoolId isolation. Offline cache fallback ensures 0% data loss.',
      dataPayload: {
        collectionLogs: 'classLogs/{logId}',
        collectionReports: 'generatedReports/{reportId}',
        security: 'Isolated by request.auth.token.schoolId',
        offlinePersistence: 'LocalStorage + IndexedDB Cache'
      }
    },
    {
      id: 'step-kt',
      stepNum: '04',
      title: 'KT Review Dashboard',
      subtitle: 'Human-in-the-Loop Copy Workspace',
      icon: ChatsCircle,
      color: 'from-pink-500 to-rose-500',
      borderColor: 'border-pink-500',
      badgeColor: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
      desc: 'Korean Teachers review and edit AI text directly. Status changes from 🔴 PENDING ➔ 🟡 EDITED ➔ 🟢 SENT upon 1-Click KakaoTalk copy.',
      dataPayload: {
        humanInTheLoop: 'Strictly No Auto-Send (KT Edits First)',
        kakaoCopy: '1-Click Copy formatted KO + EN text to Clipboard',
        phoneDrawer: 'Slide-over 3-part phone consultation talking points'
      }
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
            NATIVE ARCHITECTURE PIPELINE FLOW
          </span>
          <h3 className="text-xl sm:text-2xl font-black tracking-tight">
            End-to-End Native System Data Flow
          </h3>
        </div>
        <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-mono font-bold self-start sm:self-auto">
          ⚡ Replaces Make.com, Airtable & Softr
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
                  Node {idx + 1}
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

      {/* Active Step Deep-Dive Inspector Card */}
      <div
        className={`p-6 sm:p-8 rounded-3xl border space-y-6 transition-all ${
          isNight ? 'bg-[#08080c] border-white/10' : 'bg-zinc-50 border-zinc-200'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${currentStep.color} flex items-center justify-center text-white shadow-lg`}>
            <StepIcon size={24} weight="bold" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-orange-500 uppercase">
                Step {currentStep.stepNum} Inspector
              </span>
              <span className="text-xs text-zinc-500">•</span>
              <span className="text-xs font-mono text-emerald-400">{currentStep.title}</span>
            </div>
            <h4 className="text-lg font-black text-white">{currentStep.desc}</h4>
          </div>
        </div>

        {/* Payload / JSON Data Inspector */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
            <span>LIVE DATA PAYLOAD & SCHEMA AT THIS NODE</span>
            <span className="text-orange-400">JSON Output ⚡</span>
          </div>
          <pre
            className={`p-4 rounded-2xl border font-mono text-xs overflow-x-auto leading-relaxed ${
              isNight ? 'bg-[#030305] border-white/10 text-emerald-400' : 'bg-zinc-900 text-emerald-400 border-zinc-800'
            }`}
          >
            {JSON.stringify(currentStep.dataPayload, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
};
