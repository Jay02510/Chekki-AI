import React from 'react';
import { UploadSimple, Camera, MagnifyingGlass, Microphone, Sparkle, PaperPlaneTilt, ArrowRight, ChalkboardTeacher, Heart } from '@phosphor-icons/react';

interface Props {
  isNight: boolean;
  isKo: boolean;
}

interface Step {
  icon: React.ReactNode;
  titleKo: string;
  titleEn: string;
}

interface LoopDef {
  labelKo: string;
  labelEn: string;
  icon: React.ReactNode;
  accent: 'orange' | 'purple';
  headlineKo: string;
  headlineEn: string;
  steps: Step[];
  payoffKo: string;
  payoffEn: string;
}

const TEACHER_LOOP: LoopDef = {
  labelKo: '교사를 위한 루프',
  labelEn: 'FOR TEACHERS',
  icon: <ChalkboardTeacher size={18} weight="bold" />,
  accent: 'orange',
  headlineKo: '이번 주 숙제, 한 번만 업로드하세요',
  headlineEn: 'Upload this week\'s homework once',
  steps: [
    { icon: <UploadSimple size={18} weight="bold" />, titleKo: '이번 주 숙제 업로드', titleEn: "Upload this week's homework" },
    { icon: <Camera size={18} weight="bold" />, titleKo: '학부모가 집에서 스캔', titleEn: 'Parent scans it at home' },
    { icon: <MagnifyingGlass size={18} weight="bold" />, titleKo: '오답 패턴이 한눈에', titleEn: 'Mistakes surface automatically' },
  ],
  payoffKo: '수업 전에 어떤 학생이 무엇을 어려워하는지 이미 알고 들어가세요.',
  payoffEn: 'Walk into class already knowing which students need help, and with what.',
};

const PARENT_LOOP: LoopDef = {
  labelKo: '학부모를 위한 루프',
  labelEn: 'FOR PARENTS',
  icon: <Heart size={18} weight="bold" />,
  accent: 'purple',
  headlineKo: '교실에서 있었던 일, 그날 바로 전해드려요',
  headlineEn: "What happened in class, the same day",
  steps: [
    { icon: <Microphone size={18} weight="bold" />, titleKo: '교사가 하루 기록 제출', titleEn: 'Teacher fills out the daily log' },
    { icon: <Sparkle size={18} weight="bold" />, titleKo: 'AI가 리포트 초안 작성', titleEn: 'AI drafts the report' },
    { icon: <PaperPlaneTilt size={18} weight="bold" />, titleKo: 'KT 검토 후 한국어로 발송', titleEn: 'KT reviews & sends in Korean' },
  ],
  payoffKo: '아이가 오늘 교실에서 어땠는지, 한국어로 바로 확인하세요.',
  payoffEn: "Know exactly how your child's day went — in Korean, same day.",
};

function LoopCard({ loop, isNight, isKo }: { loop: LoopDef; isNight: boolean; isKo: boolean }) {
  const accentText = loop.accent === 'orange' ? 'text-orange-500' : 'text-brand-purple';
  const accentBg = loop.accent === 'orange'
    ? (isNight ? 'bg-orange-500/15 text-orange-400 border-orange-500/30' : 'bg-orange-100 text-orange-600 border-orange-200')
    : (isNight ? 'bg-brand-purple/15 text-brand-purple border-brand-purple/30' : 'bg-brand-purple/10 text-brand-purple border-brand-purple/30');
  const cardBorder = loop.accent === 'orange'
    ? (isNight ? 'border-orange-500/25' : 'border-orange-200')
    : (isNight ? 'border-brand-purple/25' : 'border-brand-purple/30');

  return (
    <div className={`flex-1 min-w-0 p-5 sm:p-6 rounded-3xl border-2 space-y-4 ${cardBorder} ${isNight ? 'bg-white/[0.03]' : 'bg-white'}`}>
      <div className="flex items-center gap-2">
        <span className={`w-8 h-8 rounded-full flex items-center justify-center border shrink-0 ${accentBg}`}>
          {loop.icon}
        </span>
        <span className={`text-[10px] font-mono font-black uppercase tracking-widest ${accentText}`}>
          {isKo ? loop.labelKo : loop.labelEn}
        </span>
      </div>

      <h4 className={`font-display text-lg sm:text-xl font-black leading-tight break-keep ${isNight ? 'text-white' : 'text-zinc-900'}`}>
        {isKo ? loop.headlineKo : loop.headlineEn}
      </h4>

      <div className="flex items-center flex-wrap gap-1.5">
        {loop.steps.map((step, i) => (
          <React.Fragment key={i}>
            <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-[11px] font-bold ${
              isNight ? 'bg-white/5 border-white/10 text-zinc-200' : 'bg-zinc-50 border-zinc-200 text-zinc-700'
            }`}>
              <span className={accentText}>{step.icon}</span>
              <span className="break-keep">{isKo ? step.titleKo : step.titleEn}</span>
            </div>
            {i < loop.steps.length - 1 && (
              <ArrowRight size={12} weight="bold" className={isNight ? 'text-zinc-600' : 'text-zinc-400'} />
            )}
          </React.Fragment>
        ))}
      </div>

      <p className={`text-sm font-bold leading-snug break-keep ${accentText}`}>
        {isKo ? loop.payoffKo : loop.payoffEn}
      </p>
    </div>
  );
}

export function SchoolLoopDiagram({ isNight, isKo }: Props) {
  return (
    <section className="py-8 md:py-10 px-4 md:px-8 max-w-6xl mx-auto w-full space-y-5">
      <div className="text-center max-w-xl mx-auto space-y-1.5">
        <span className="px-3 py-1 bg-orange-500/10 border border-orange-500/30 text-orange-500 text-[10px] font-mono font-black uppercase tracking-widest rounded-full inline-block">
          {isKo ? '체키 작동 방식' : 'HOW CHEKKI WORKS'}
        </span>
        <h3 className={`font-display text-2xl sm:text-3xl font-black break-keep ${isNight ? 'text-white' : 'text-zinc-900'}`}>
          {isKo ? '하나의 학원, 두 개의 루프' : 'One academy, two loops running at once'}
        </h3>
      </div>

      <div className="flex flex-col md:flex-row items-stretch gap-4">
        <LoopCard loop={TEACHER_LOOP} isNight={isNight} isKo={isKo} />
        <LoopCard loop={PARENT_LOOP} isNight={isNight} isKo={isKo} />
      </div>
    </section>
  );
}
