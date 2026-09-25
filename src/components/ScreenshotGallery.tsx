import { useEffect, useRef, useState } from 'react';
import { CaretLeft, CaretRight, X } from '@phosphor-icons/react';
import { useDialogA11y } from '../../hooks/useDialogA11y';

interface Shot {
  url: string;
  label: string;
}

interface Props {
  title: string;
  shots: Shot[];
  isNight: boolean;
  /** 'phone' = tall portrait cards for mobile captures; 'wide' = landscape cards for desktop captures. */
  variant?: 'phone' | 'wide';
}

// Fixed-size, object-contain cards so screenshots of slightly different
// aspect ratios sit at the same visual size instead of a jagged row.
const CARD = {
  phone: { card: 'w-[220px] md:w-[250px]', frame: 'aspect-[9/19.5] rounded-[2rem]' },
  wide: { card: 'w-[85vw] max-w-[560px]', frame: 'h-[240px] md:h-[300px] rounded-2xl' },
};

export default function ScreenshotGallery({ title, shots, isNight, variant = 'phone' }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [current, setCurrent] = useState(0);
  const [active, setActive] = useState<number | null>(null);
  const dialogRef = useDialogA11y<HTMLDivElement>({ isOpen: active !== null, onClose: () => setActive(null) });
  const touchX = useRef<number | null>(null);

  const cardAt = (i: number) => trackRef.current?.children[i] as HTMLElement | undefined;

  const scrollToCard = (i: number) => {
    const idx = Math.max(0, Math.min(shots.length - 1, i));
    const track = trackRef.current;
    const card = cardAt(idx);
    if (track && card) track.scrollTo({ left: card.offsetLeft - track.offsetLeft, behavior: 'smooth' });
  };

  const onTrackScroll = () => {
    const track = trackRef.current;
    const first = cardAt(0);
    if (!track || !first) return;
    const step = first.offsetWidth + parseFloat(getComputedStyle(track).columnGap || '0');
    // At the far right edge the last cards can't snap to start, so treat the end as the last card.
    const atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;
    setCurrent(atEnd ? shots.length - 1 : Math.round(track.scrollLeft / step));
  };

  const step = (dir: 1 | -1) => setActive((a) => (a === null ? a : (a + dir + shots.length) % shots.length));

  const isOpen = active !== null;
  useEffect(() => {
    if (!isOpen) return;
    const n = shots.length;
    const onKey = (e: KeyboardEvent) => {
      const dir = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (dir) setActive((a) => (a === null ? a : (a + dir + n) % n));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, shots.length]);

  const arrowCls = `w-11 h-11 rounded-full border flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-default cursor-pointer ${
    isNight ? 'bg-white/5 border-white/10 text-white hover:bg-white/10' : 'bg-white border-zinc-200 text-zinc-900 hover:bg-zinc-50 shadow-sm'
  }`;
  const shot = active !== null ? shots[active] : null;

  return (
    <section className={`py-24 px-4 md:px-8 max-w-7xl mx-auto w-full ${isNight ? 'text-white' : 'text-zinc-900'}`}>
      <div className="flex items-end justify-between gap-4 mb-10">
        <h2 className="text-3xl md:text-4xl font-black tracking-tight">{title}</h2>
        <div className="hidden md:flex gap-2">
          <button type="button" aria-label="Previous" onClick={() => scrollToCard(current - 1)} disabled={current === 0} className={arrowCls}>
            <CaretLeft weight="bold" />
          </button>
          <button type="button" aria-label="Next" onClick={() => scrollToCard(current + 1)} disabled={current >= shots.length - 1} className={arrowCls}>
            <CaretRight weight="bold" />
          </button>
        </div>
      </div>

      <div
        ref={trackRef}
        onScroll={onTrackScroll}
        className="flex gap-5 md:gap-6 overflow-x-auto snap-x snap-mandatory pb-4 -mx-4 px-4 md:mx-0 md:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {shots.map((s, i) => (
          <button
            key={s.url}
            type="button"
            onClick={() => setActive(i)}
            className={`shrink-0 ${CARD[variant].card} snap-start text-left cursor-zoom-in group`}
          >
            <div
              className={`${CARD[variant].frame} border overflow-hidden flex items-center justify-center transition-[border-color,transform] duration-300 group-hover:-translate-y-1 ${
                isNight ? 'bg-[#0e0e0e] border-white/10 group-hover:border-brand/50' : 'bg-zinc-900 border-zinc-200 group-hover:border-brand/50 shadow-lg'
              }`}
            >
              <img src={s.url} alt={s.label} loading="lazy" className="w-full h-full object-contain" />
            </div>
            <p className={`mt-3 text-sm font-medium text-center ${isNight ? 'text-white/70' : 'text-zinc-600'}`}>{s.label}</p>
          </button>
        ))}
      </div>

      <div className="flex justify-center gap-2 mt-4">
        {shots.map((s, i) => (
          <button
            key={s.url}
            type="button"
            aria-label={s.label}
            aria-current={i === current}
            onClick={() => scrollToCard(i)}
            className={`h-2 rounded-full transition-all cursor-pointer ${
              i === current ? 'w-6 bg-brand' : `w-2 ${isNight ? 'bg-white/20' : 'bg-zinc-300'}`
            }`}
          />
        ))}
      </div>

      {shot && (
        <div className="fixed inset-0 z-[350] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/85 backdrop-blur-md" onClick={() => setActive(null)} />
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label={shot.label}
            tabIndex={-1}
            onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
            onTouchEnd={(e) => {
              if (touchX.current === null) return;
              const dx = e.changedTouches[0].clientX - touchX.current;
              if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1);
              touchX.current = null;
            }}
            className="relative max-w-5xl w-full max-h-[90vh] flex flex-col items-center"
          >
            <button
              type="button"
              onClick={() => setActive(null)}
              aria-label="Close"
              className="absolute -top-2 right-0 md:-top-4 md:-right-4 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white text-black shadow-lg cursor-pointer"
            >
              <X size={18} weight="bold" />
            </button>
            <div className="flex items-center gap-3 md:gap-6 w-full justify-center">
              <button type="button" aria-label="Previous" onClick={() => step(-1)} className="hidden md:flex shrink-0 w-12 h-12 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 cursor-pointer">
                <CaretLeft size={22} weight="bold" />
              </button>
              <img src={shot.url} alt={shot.label} className="min-w-0 max-w-full max-h-[80vh] object-contain rounded-xl shadow-2xl" />
              <button type="button" aria-label="Next" onClick={() => step(1)} className="hidden md:flex shrink-0 w-12 h-12 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 cursor-pointer">
                <CaretRight size={22} weight="bold" />
              </button>
            </div>
            <p className="mt-4 text-white/80 text-sm">
              {shot.label} <span className="text-white/40">· {active! + 1}/{shots.length}</span>
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
