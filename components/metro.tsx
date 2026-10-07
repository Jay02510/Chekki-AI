import React, { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, CaretDown } from '@phosphor-icons/react';

// Seoul Metro signage primitives. See the direction contract in app.html.
// Bilingual pairs: the user's language is the primary line, the other
// language is the small line under it, like a station sign.

export type Bi = { ko: string; en: string };

export const pick = (bi: Bi, language: 'en' | 'ko') => {
  const primary = language === 'ko' ? bi.ko : bi.en;
  const other = language === 'ko' ? bi.en : bi.ko;
  return { primary, secondary: other === primary ? '' : other };
};

export type StopState = 'done' | 'current' | 'next' | 'off';

/** Station roundel: a ring on the line. `children` is the number or code. */
export const Roundel: React.FC<{
  state?: StopState | 'wrong' | 'right';
  size?: number;
  children?: React.ReactNode;
  className?: string;
}> = ({ state = 'next', size = 32, children, className = '' }) => {
  const ring =
    state === 'current'
      ? 'bg-line text-[#2b211a] border-line'
      : state === 'done'
        ? 'bg-sign text-on-sign border-sign dark:bg-ink dark:text-ground dark:border-ink'
        : state === 'wrong'
          ? 'bg-surface text-wrong border-wrong'
          : state === 'right'
            ? 'bg-surface text-right border-right'
            : state === 'off'
              ? 'bg-surface text-ink-3 border-rule'
              : 'bg-surface text-ink border-line';
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-extrabold num ${ring} ${className}`}
      style={{
        width: size,
        height: size,
        borderWidth: Math.max(3, Math.round(size / 9)),
        fontSize: Math.round(size * 0.42),
      }}
    >
      {children}
    </span>
  );
};

/** Charcoal station sign: previous stop, this stop, next stop. */
export const StationSign: React.FC<{
  language: 'en' | 'ko';
  prev?: Bi;
  current: Bi;
  next?: Bi;
  badge?: React.ReactNode;
}> = ({ language, prev, current, next, badge }) => {
  const c = pick(current, language);
  const p = prev && pick(prev, language);
  const n = next && pick(next, language);
  return (
    <section
      aria-label={c.primary}
      className="relative overflow-hidden rounded-md bg-sign text-on-sign"
    >
      {/* the line runs along the sign's foot */}
      <div className="absolute inset-x-0 bottom-0 h-1.5 bg-line" aria-hidden="true" />
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] items-center gap-x-6 gap-y-4 px-5 pt-6 pb-8 sm:px-8 sm:pt-8 sm:pb-10">
        <div className="order-2 sm:order-1 flex sm:block items-center justify-between gap-4 min-w-0">
          {p && (
            <div className="min-w-0">
              <p className="text-on-sign-2 text-[13px] font-semibold flex items-center gap-1.5">
                <ArrowLeft size={14} weight="bold" aria-hidden="true" className="shrink-0" />
                <span className="truncate">{p.primary}</span>
              </p>
              <p className="text-on-sign-2/80 text-xs sign-en truncate pl-[18px]">{p.secondary}</p>
            </div>
          )}
          {n && (
            <div className="min-w-0 text-right sm:hidden">
              <p className="text-on-sign-2 text-[13px] font-semibold flex items-center justify-end gap-1.5">
                <span className="truncate">{n.primary}</span>
                <ArrowRight size={14} weight="bold" aria-hidden="true" className="shrink-0" />
              </p>
              <p className="text-on-sign-2/80 text-xs sign-en truncate pr-[18px]">{n.secondary}</p>
            </div>
          )}
        </div>
        <div className="order-1 sm:order-2 flex items-center justify-center gap-4 text-center">
          {badge}
          <div className="min-w-0">
            <h1 className="sign-ko text-[26px] min-[400px]:text-[30px] sm:text-[44px] break-keep whitespace-nowrap">{c.primary}</h1>
            <p className="sign-en text-on-sign-2 text-[15px] sm:text-lg mt-1">{c.secondary}</p>
          </div>
        </div>
        <div className="order-3 hidden sm:block min-w-0 text-right">
          {n && (
            <>
              <p className="text-on-sign-2 text-[13px] font-semibold flex items-center justify-end gap-1.5">
                <span className="truncate">{n.primary}</span>
                <ArrowRight size={14} weight="bold" aria-hidden="true" className="shrink-0" />
              </p>
              <p className="text-on-sign-2/80 text-xs sign-en truncate pr-[18px]">{n.secondary}</p>
            </>
          )}
        </div>
      </div>
    </section>
  );
};

export type Stop = Bi & { state: StopState };

/**
 * The loop strip (노선도): the orange line with one roundel per stop. The
 * lit marker "arrives" at the current stop from the previous one on mount,
 * the world's one signature motion.
 */
export const LoopStrip: React.FC<{ stops: Stop[]; language: 'en' | 'ko'; className?: string }> = ({
  stops,
  language,
  className = '',
}) => {
  const currentIdx = Math.max(0, stops.findIndex((s) => s.state === 'current'));
  const [markerIdx, setMarkerIdx] = useState(Math.max(0, currentIdx - 1));
  useEffect(() => {
    const id = requestAnimationFrame(() => setMarkerIdx(currentIdx));
    return () => cancelAnimationFrame(id);
  }, [currentIdx]);

  const n = stops.length;
  const pos = (i: number) => (n === 1 ? 50 : (i / (n - 1)) * 100);
  const doneTo = stops.reduce((acc, s, i) => (s.state === 'done' || s.state === 'current' ? i : acc), 0);

  return (
    <ol
      className={`relative grid ${className}`}
      style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}
      aria-label={language === 'ko' ? '이번 주 진행 단계' : "This week's steps"}
    >
      {/* rail: grey for the whole line, orange up to the current stop */}
      <div
        className="absolute h-1.5 rounded-full bg-rule"
        style={{ top: 13, left: `calc(${100 / n / 2}%)`, right: `calc(${100 / n / 2}%)` }}
        aria-hidden="true"
      >
        <div
          className="h-full rounded-full bg-line transition-[width] duration-700 ease-[var(--ease-arrive)]"
          style={{ width: `${pos(Math.min(markerIdx, doneTo))}%` }}
        />
        <span
          className="absolute -top-[11px] h-7 w-7 -ml-3.5 rounded-full bg-line ring-4 ring-ground transition-[left] duration-700 ease-[var(--ease-arrive)]"
          style={{ left: `${pos(markerIdx)}%` }}
        />
      </div>
      {stops.map((s, i) => {
        const p = pick(s, language);
        const isCurrent = s.state === 'current';
        return (
          <li
            key={s.en}
            className="relative flex flex-col items-center text-center px-1"
            aria-current={isCurrent ? 'step' : undefined}
          >
            <Roundel state={isCurrent ? 'next' : s.state} size={32} className={isCurrent ? 'opacity-0' : ''}>
              {i + 1}
            </Roundel>
            <span
              className={`mt-2 text-[13px] sm:text-sm leading-tight break-keep ${
                isCurrent ? 'font-extrabold text-ink' : s.state === 'off' ? 'font-medium text-ink-3' : 'font-semibold text-ink-2'
              }`}
            >
              {p.primary}
            </span>
            <span className={`text-[11px] sign-en leading-tight mt-0.5 ${s.state === 'off' ? 'text-ink-3/80' : 'text-ink-3'}`}>
              {p.secondary}
            </span>
          </li>
        );
      })}
    </ol>
  );
};

/**
 * Foldable card: native <details>, so tap/keyboard/open state come free.
 * The whole header row is the tap target.
 */
export const Fold: React.FC<{
  title: React.ReactNode;
  sub?: React.ReactNode;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
  children: React.ReactNode;
}> = ({ title, sub, icon, badge, defaultOpen = false, className = '', children }) => (
  <details open={defaultOpen} className={`group rounded-lg bg-surface ring-1 ring-inset ring-rule ${className}`}>
    <summary className="flex min-h-16 cursor-pointer list-none items-center gap-3 px-5 py-4 [&::-webkit-details-marker]:hidden">
      {icon && (
        <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-line-soft text-line-ink">
          {icon}
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block text-[17px] font-extrabold text-ink break-keep">{title}</span>
        {sub && <span className="mt-0.5 block text-[13px] text-ink-3 break-keep">{sub}</span>}
      </span>
      {badge}
      <CaretDown size={18} weight="bold" className="shrink-0 text-ink-3 transition-transform duration-200 group-open:rotate-180" />
    </summary>
    <div className="border-t border-rule px-5 pb-5 pt-4">{children}</div>
  </details>
);
