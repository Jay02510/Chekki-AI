import React from 'react';
import { UploadSimple, Camera, MagnifyingGlass, Microphone, Sparkle, PaperPlaneTilt, ChalkboardTeacher, Heart, ArrowsClockwise } from '@phosphor-icons/react';

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
  cadenceKo: string;
  cadenceEn: string;
  steps: [Step, Step, Step];
  payoffKo: string;
  payoffEn: string;
}

const TEACHER_LOOP: LoopDef = {
  labelKo: '교사를 위한 루프',
  labelEn: 'FOR TEACHERS',
  icon: <ChalkboardTeacher size={18} weight="bold" />,
  accent: 'orange',
  headlineKo: '숙제는 올리고, 통찰은 돌아옵니다',
  headlineEn: 'Upload homework. See what’s stuck.',
  cadenceKo: '매주',
  cadenceEn: 'Every week',
  steps: [
    { icon: <UploadSimple size={16} weight="bold" />, titleKo: '숙제 업로드', titleEn: 'Upload homework' },
    { icon: <Camera size={16} weight="bold" />, titleKo: '학부모가 스캔', titleEn: 'Parent scans it' },
    { icon: <MagnifyingGlass size={16} weight="bold" />, titleKo: '오답이 드러남', titleEn: 'Mistakes surface' },
  ],
  payoffKo: '수업 전에 어떤 학생이 무엇을 어려워하는지 이미 알고 들어가세요.',
  payoffEn: 'Walk into class already knowing which students need help, and with what.',
};

const PARENT_LOOP: LoopDef = {
  labelKo: '학부모를 위한 루프',
  labelEn: 'FOR PARENTS',
  icon: <Heart size={18} weight="bold" />,
  accent: 'purple',
  headlineKo: '교실 하루가 끝나면, 소식이 따라옵니다',
  headlineEn: 'Class happens. The update follows.',
  cadenceKo: '매일',
  cadenceEn: 'Every day',
  steps: [
    { icon: <Microphone size={16} weight="bold" />, titleKo: '교사가 하루 기록', titleEn: 'Teacher logs the day' },
    { icon: <Sparkle size={16} weight="bold" />, titleKo: 'AI가 초안 작성', titleEn: 'AI drafts the report' },
    { icon: <PaperPlaneTilt size={16} weight="bold" />, titleKo: 'KT 검토 후 발송', titleEn: 'KT reviews & sends' },
  ],
  payoffKo: '아이가 오늘 교실에서 어땠는지, 한국어로 바로 확인하세요.',
  payoffEn: "Know exactly how your child's day went — in Korean, same day.",
};

// Three nodes arranged in a triangle inscribed in a circle (viewBox 0-100),
// connected by outward-bowing curves so the whole shape reads as a loop —
// not three chips in a row with straight arrows between them.
const NODES = [
  { x: 50, y: 8 },
  { x: 82, y: 78 },
  { x: 18, y: 78 },
] as const;

const EDGES = [
  'M 50 8 Q 90 24 82 78',
  'M 82 78 Q 50 104 18 78',
  'M 18 78 Q 10 24 50 8',
];

function LoopCard({ loop, isNight, isKo }: { loop: LoopDef; isNight: boolean; isKo: boolean }) {
  const accentVar = loop.accent === 'orange' ? 'var(--color-brand)' : 'var(--color-brand-purple)';
  const accentText = loop.accent === 'orange' ? 'text-orange-500' : 'text-brand-purple';
  const accentBg = loop.accent === 'orange'
    ? (isNight ? 'bg-orange-500/15 text-orange-400 border-orange-500/30' : 'bg-orange-100 text-orange-600 border-orange-200')
    : (isNight ? 'bg-brand-purple/15 text-brand-purple border-brand-purple/30' : 'bg-brand-purple/10 text-brand-purple border-brand-purple/30');
  const cardBorder = loop.accent === 'orange'
    ? (isNight ? 'border-orange-500/25' : 'border-orange-200')
    : (isNight ? 'border-brand-purple/25' : 'border-brand-purple/30');
  const markerId = `loop-arrow-${loop.accent}`;

  return (
    <div className={`flex-1 min-w-0 p-5 sm:p-6 rounded-3xl border-2 space-y-5 ${cardBorder} ${isNight ? 'bg-white/[0.03]' : 'bg-white'}`}>
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

      {/* The loop itself: three step-nodes on a closed curved path, with a
          repeating cadence label at the center so it reads as "this keeps
          happening," not a one-time sequence. */}
      <div className="relative w-full max-w-[300px] mx-auto aspect-square pb-4">
        <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full overflow-visible" aria-hidden="true">
          <defs>
            <marker id={markerId} markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto-start-reverse">
              <path d="M0,0 L6,3 L0,6 Z" fill={accentVar} />
            </marker>
          </defs>
          {EDGES.map((d, i) => (
            <path
              key={i}
              d={d}
              fill="none"
              stroke={accentVar}
              strokeOpacity={isNight ? 0.55 : 0.4}
              strokeWidth={1.5}
              strokeLinecap="round"
              markerEnd={`url(#${markerId})`}
            />
          ))}
        </svg>

        <div className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-0.5 ${accentText}`}>
          <ArrowsClockwise size={16} weight="bold" />
          <span className="text-[9px] font-mono font-black uppercase tracking-wider whitespace-nowrap">
            {isKo ? loop.cadenceKo : loop.cadenceEn}
          </span>
        </div>

        {NODES.map((node, i) => {
          const step = loop.steps[i];
          return (
            <div
              key={i}
              className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1 w-20 text-center"
              style={{ left: `${node.x}%`, top: `${node.y}%` }}
            >
              <span className={`w-9 h-9 rounded-full flex items-center justify-center border shrink-0 ${accentBg}`}>
                {step.icon}
              </span>
              <span className={`text-[10px] font-bold leading-tight break-keep ${isNight ? 'text-zinc-200' : 'text-zinc-700'}`}>
                {isKo ? step.titleKo : step.titleEn}
              </span>
            </div>
          );
        })}
      </div>

      <p className={`text-sm font-bold leading-snug break-keep text-center ${accentText}`}>
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
          {isKo ? '두 개의 루프, 계속 돌아갑니다' : 'Two loops, always turning'}
        </h3>
      </div>

      <div className="flex flex-col md:flex-row items-stretch gap-4">
        <LoopCard loop={TEACHER_LOOP} isNight={isNight} isKo={isKo} />
        <LoopCard loop={PARENT_LOOP} isNight={isNight} isKo={isKo} />
      </div>
    </section>
  );
}
