import { useState } from 'react';
import { X } from '@phosphor-icons/react';
import { useDialogA11y } from '../../hooks/useDialogA11y';

interface Shot {
  url: string;
  label: string;
}

interface Props {
  title: string;
  shots: Shot[];
  isNight: boolean;
}

// Fixed-height, object-contain cards so portrait (mobile) and landscape
// (desktop) screenshots sit at the same visual size instead of producing
// a jagged row of mismatched heights.
export default function ScreenshotGallery({ title, shots, isNight }: Props) {
  const [active, setActive] = useState<Shot | null>(null);
  const dialogRef = useDialogA11y<HTMLDivElement>({ isOpen: !!active, onClose: () => setActive(null) });

  return (
    <section className={`py-24 px-4 md:px-8 max-w-7xl mx-auto w-full ${isNight ? 'text-white' : 'text-zinc-900'}`}>
      <h2 className="text-3xl md:text-4xl font-black tracking-tight text-center mb-12">{title}</h2>
      <div className="flex gap-6 overflow-x-auto snap-x snap-mandatory pb-4 -mx-4 px-4 md:mx-0 md:px-0">
        {shots.map((shot) => (
          <button
            key={shot.url}
            type="button"
            onClick={() => setActive(shot)}
            className="shrink-0 w-[280px] md:w-[320px] snap-start text-left cursor-zoom-in group"
          >
            <div
              className={`h-[200px] md:h-[220px] rounded-2xl border overflow-hidden flex items-center justify-center ${
                isNight ? 'bg-white/5 border-white/10' : 'bg-zinc-100 border-zinc-200'
              }`}
            >
              <img
                src={shot.url}
                alt={shot.label}
                loading="lazy"
                className="w-full h-full object-contain group-hover:scale-[1.03] transition-transform duration-300"
              />
            </div>
            <p className={`mt-3 text-sm text-center ${isNight ? 'text-white/60' : 'text-zinc-600'}`}>{shot.label}</p>
          </button>
        ))}
      </div>

      {active && (
        <div className="fixed inset-0 z-[350] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/85 backdrop-blur-md" onClick={() => setActive(null)} />
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label={active.label}
            tabIndex={-1}
            className="relative max-w-5xl w-full max-h-[90vh] flex flex-col items-center"
          >
            <button
              type="button"
              onClick={() => setActive(null)}
              aria-label="Close"
              className="absolute -top-4 -right-4 w-10 h-10 flex items-center justify-center rounded-full bg-white text-black shadow-lg cursor-pointer"
            >
              <X size={18} weight="bold" />
            </button>
            <img src={active.url} alt={active.label} className="max-w-full max-h-[80vh] object-contain rounded-xl shadow-2xl" />
            <p className="mt-4 text-white/80 text-sm">{active.label}</p>
          </div>
        </div>
      )}
    </section>
  );
}
