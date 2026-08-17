import React from 'react';

interface ProgressRingProps {
  value: number; // 0-100
  size?: number;
  strokeWidth?: number;
  label?: React.ReactNode;
  sublabel?: React.ReactNode;
  isNight?: boolean;
  tone?: 'orange' | 'neutral';
}

/**
 * Replaces the manual gradient div-bar previously duplicated across
 * NativeFtDashboard.tsx and TeacherPage.tsx. Tinted-Glow-Rule compliant:
 * the arc is always brand orange, never a second accent color.
 */
export const ProgressRing: React.FC<ProgressRingProps> = ({
  value,
  size = 56,
  strokeWidth = 6,
  label,
  sublabel,
  isNight = true,
  tone = 'orange',
}) => {
  const clamped = Math.max(0, Math.min(100, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamped / 100);
  const arcColor = tone === 'orange' ? '#f97316' : (isNight ? '#a1a1aa' : '#71717a');

  return (
    <div className="relative inline-flex flex-col items-center justify-center" style={{ width: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
        role="img"
        aria-label={typeof label === 'string' ? `${label}: ${clamped}%` : `${clamped}%`}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className={isNight ? 'stroke-white/10' : 'stroke-zinc-200'}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={arcColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`font-black tracking-tight ${isNight ? 'text-white' : 'text-zinc-900'}`} style={{ fontSize: size * 0.28 }}>
          {label ?? `${clamped}%`}
        </span>
      </div>
      {sublabel && (
        <span className={`mt-1.5 text-[10px] font-medium text-center ${isNight ? 'text-zinc-500' : 'text-zinc-400'}`}>
          {sublabel}
        </span>
      )}
    </div>
  );
};
