import React from 'react';
import { ProgressRing } from './ProgressRing';

interface StatTileBadge {
  text: string;
  tone: 'orange' | 'emerald' | 'neutral';
}

interface StatTileProps {
  label: string;
  value: React.ReactNode;
  sublabel?: string;
  icon?: React.ReactNode;
  badge?: StatTileBadge;
  ring?: { value: number };
  sparkline?: number[];
  isNight?: boolean;
}

const badgeToneClasses: Record<StatTileBadge['tone'], string> = {
  orange: 'bg-orange-500/10 border-orange-500/20 text-orange-500',
  emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500',
  neutral: 'bg-white/5 border-white/10 text-zinc-400',
};

function Sparkline({ points, isNight }: { points: number[]; isNight: boolean }) {
  if (points.length < 2) return null;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const w = 100;
  const h = 28;
  const step = w / (points.length - 1);
  const coords = points
    .map((p, i) => `${(i * step).toFixed(1)},${(h - ((p - min) / range) * h).toFixed(1)}`)
    .join(' ');

  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="mt-3">
      <polyline
        points={coords}
        fill="none"
        className="stroke-orange-500/60"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Codifies the double-bezel stat-card shell (outer translucent-border shell
 * + inset inner panel) that was previously hand-typed 3x independently
 * across NativeFtDashboard.tsx and TeacherPage.tsx. Single source of truth
 * for that construction going forward.
 */
export const StatTile: React.FC<StatTileProps> = ({
  label,
  value,
  sublabel,
  icon,
  badge,
  ring,
  sparkline,
  isNight = true,
}) => {
  return (
    <div
      className={`p-1 rounded-[2rem] text-left transition-colors ${
        isNight ? 'bg-white/5 border border-white/10 shadow-2xl' : 'bg-white border border-zinc-200 shadow-md'
      }`}
    >
      <div
        className={`rounded-[calc(2rem-0.25rem)] p-6 flex flex-col justify-between h-full transition-colors ${
          isNight ? 'bg-brand-dark' : 'bg-white'
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <span
            className={`text-[10px] font-bold uppercase tracking-[0.2em] flex items-center gap-1.5 ${
              isNight ? 'text-zinc-400' : 'text-zinc-500'
            }`}
          >
            {icon}
            <span>{label}</span>
          </span>
          {badge && (
            <span
              className={`px-2.5 py-1 rounded-full text-[10px] font-black font-mono border ${badgeToneClasses[badge.tone]}`}
            >
              {badge.text}
            </span>
          )}
        </div>

        {ring ? (
          <div className="flex items-center gap-4">
            <ProgressRing value={ring.value} isNight={isNight} />
            <div>
              <h4 className={`text-2xl font-black tracking-tight ${isNight ? 'text-white' : 'text-zinc-900'}`}>
                {value}
              </h4>
              {sublabel && <p className="text-xs text-zinc-500 mt-1">{sublabel}</p>}
            </div>
          </div>
        ) : (
          <div>
            <h4 className={`text-2xl font-black tracking-tight ${isNight ? 'text-white' : 'text-zinc-900'}`}>
              {value}
            </h4>
            {sublabel && <p className="text-xs text-zinc-500 mt-1">{sublabel}</p>}
            {sparkline && sparkline.length > 1 && <Sparkline points={sparkline} isNight={isNight} />}
          </div>
        )}
      </div>
    </div>
  );
};
