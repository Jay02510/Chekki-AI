import React, { useEffect, useId, useRef, useState } from 'react';
import { Roundel } from '../../components/metro';
import { track } from '../lib/track';

// A guided look at real screens: steps on one side, one screen at a time on a
// stage, numbered pins on the screen that open a short note. Screens of very
// different shapes (a wide card, a tall review page, a phone card) share one
// fixed-height stage; a tall screen scrolls inside it, and picking a note
// scrolls its pin into view.

export interface TourPin {
  /** Pin centre, as a percentage of the screen image. */
  x: number;
  y: number;
  text: string;
}

export interface TourScreen {
  src: string;
  /** CSS size of the capture (image pixels / capture scale). */
  w: number;
  h: number;
  pins: TourPin[];
}

export interface TourStep {
  title: string;
  sub: string;
  alt: string;
  screen: TourScreen;
  /** Narrow-screen capture with its own pins, swapped in under 640px. */
  phone?: TourScreen;
}

const useNarrow = () => {
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 640px)');
    const on = () => setNarrow(mq.matches);
    on();
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return narrow;
};

const Pin: React.FC<{
  n: number;
  pin: TourPin;
  open: boolean;
  tipId: string;
  label: string;
  onOpen: () => void;
  onClose: () => void;
  pinRef: (el: HTMLButtonElement | null) => void;
}> = ({ n, pin, open, tipId, label, onOpen, onClose, pinRef }) => {
  // Keep the note inside the screen: below pins near the top, and anchored
  // to the near edge for pins close to either side.
  const below = pin.y < 22;
  const side = pin.x < 30 ? 'left-0' : pin.x > 70 ? 'right-0' : 'left-1/2 -translate-x-1/2';
  const arrow = pin.x < 30 ? 'left-[18px]' : pin.x > 70 ? 'right-[18px]' : 'left-1/2 -translate-x-1/2';
  return (
    <div
      className="tour-pin absolute -translate-x-1/2 -translate-y-1/2"
      style={{ left: `${pin.x}%`, top: `${pin.y}%`, zIndex: open ? 3 : 2, animationDelay: `${180 + n * 60}ms` }}
    >
      <button
        ref={pinRef}
        type="button"
        aria-label={label}
        aria-describedby={tipId}
        aria-expanded={open}
        onMouseEnter={onOpen}
        onFocus={onOpen}
        onClick={onOpen}
        onKeyDown={(e) => e.key === 'Escape' && onClose()}
        className="relative grid h-11 w-11 place-items-center rounded-full focus-visible:outline-none"
      >
        <span
          className={`num grid h-7 w-7 place-items-center rounded-full text-[14px] font-extrabold text-[#2b211a] ring-2 ring-white shadow-[0_6px_16px_-6px_rgba(43,33,26,0.6)] transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            open ? 'scale-110 bg-line' : 'bg-line/90 hover:scale-110'
          } [button:focus-visible_&]:outline [button:focus-visible_&]:outline-2 [button:focus-visible_&]:outline-offset-2 [button:focus-visible_&]:outline-line-ink`}
        >
          {n}
        </span>
      </button>
      <div
        id={tipId}
        role="tooltip"
        className={`pointer-events-none absolute ${side} ${below ? 'top-full mt-1' : 'bottom-full mb-1'} w-max max-w-[min(250px,70vw)] rounded-md bg-sign px-3.5 py-2.5 text-[14px] font-semibold leading-snug text-on-sign shadow-[0_16px_36px_-14px_rgba(43,33,26,0.55)] transition-[opacity,transform] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] break-keep ${
          open ? 'opacity-100 translate-y-0' : `opacity-0 ${below ? '-translate-y-1' : 'translate-y-1'}`
        }`}
      >
        {pin.text}
        <span
          aria-hidden="true"
          className={`absolute ${arrow} ${below ? '-top-1' : '-bottom-1'} h-2.5 w-2.5 rotate-45 rounded-[2px] bg-sign`}
        />
      </div>
    </div>
  );
};

export const ScreenTour: React.FC<{
  isKo: boolean;
  steps: TourStep[];
  /** Tracking name, e.g. "schools" or "parent". */
  name: string;
  /** Line under the stage, e.g. "실제 화면". */
  footnote?: string;
}> = ({ isKo, steps, name, footnote }) => {
  const [step, setStep] = useState(0);
  const [active, setActive] = useState(0);
  const narrow = useNarrow();
  const uid = useId();
  const pinEls = useRef<(HTMLButtonElement | null)[]>([]);
  const tabEls = useRef<(HTMLButtonElement | null)[]>([]);
  const stageRef = useRef<HTMLDivElement>(null);
  const [moreBelow, setMoreBelow] = useState(false);

  const s = steps[step];
  const screen = narrow && s.phone ? s.phone : s.screen;

  const choose = (i: number) => {
    if (i === step) return;
    setStep(i);
    setActive(0);
    track('screen_tour_step', { tour: name, step: i + 1 });
  };

  // Show a note and bring its pin into view inside the stage (not the page).
  const reveal = (i: number) => {
    setActive(i);
    const stage = stageRef.current;
    const pin = pinEls.current[i];
    if (!stage || !pin) return;
    const top = pin.getBoundingClientRect().top - stage.getBoundingClientRect().top + stage.scrollTop;
    stage.scrollTo({ top: Math.max(0, top - stage.clientHeight / 2), behavior: 'smooth' });
  };

  const checkScroll = () => {
    const el = stageRef.current;
    if (el) setMoreBelow(el.scrollTop + el.clientHeight < el.scrollHeight - 8);
  };

  useEffect(() => {
    stageRef.current?.scrollTo({ top: 0 });
    checkScroll();
  }, [step, narrow]);

  const onTabKey = (e: React.KeyboardEvent, i: number) => {
    const next = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
    if (!next) return;
    e.preventDefault();
    const j = (i + next + steps.length) % steps.length;
    choose(j);
    tabEls.current[j]?.focus();
  };

  const noteLabel = (n: number) => (isKo ? `설명 ${n}` : `Note ${n}`);

  const notes = (
    <ol className="space-y-1">
      {screen.pins.map((p, i) => (
        <li key={i}>
          <button
            type="button"
            onMouseEnter={() => setActive(i)}
            onFocus={() => setActive(i)}
            onClick={() => reveal(i)}
            className={`flex w-full items-start gap-3 rounded-md px-3 py-2.5 text-start transition-colors ${
              active === i ? 'bg-line-soft text-ink' : 'text-ink-2 hover:bg-sunken'
            }`}
          >
            <span
              className={`num mt-px grid h-6 w-6 shrink-0 place-items-center rounded-full text-[13px] font-extrabold ${
                active === i ? 'bg-line text-[#2b211a]' : 'bg-surface text-ink-2 ring-1 ring-inset ring-rule'
              }`}
            >
              {i + 1}
            </span>
            <span className="text-[15px] font-semibold leading-relaxed">{p.text}</span>
          </button>
        </li>
      ))}
    </ol>
  );

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-10">
      <div>
        <div role="tablist" aria-orientation="vertical" aria-label={isKo ? '화면 선택' : 'Choose a screen'} className="relative grid grid-cols-3 gap-2 lg:block lg:space-y-1">
          {/* The orange line joining the stops, desktop only. */}
          <span aria-hidden="true" className="absolute bottom-8 left-[33px] top-8 hidden w-[3px] rounded-full bg-line/35 lg:block" />
          {steps.map((t, i) => {
            const on = i === step;
            return (
              <div key={t.title} className="relative">
                <button
                  ref={(el) => { tabEls.current[i] = el; }}
                  role="tab"
                  id={`${uid}-tab-${i}`}
                  aria-selected={on}
                  aria-controls={`${uid}-panel`}
                  tabIndex={on ? 0 : -1}
                  onClick={() => choose(i)}
                  onKeyDown={(e) => onTabKey(e, i)}
                  className={`flex h-full w-full flex-col items-center gap-2 rounded-md px-2 py-3 text-center transition-colors lg:flex-row lg:items-start lg:gap-4 lg:px-4 lg:py-4 lg:text-start ${
                    on ? 'bg-surface ring-1 ring-inset ring-rule' : 'hover:bg-sunken'
                  }`}
                >
                  <Roundel state={on ? 'current' : 'next'} size={36} className="relative">
                    {i + 1}
                  </Roundel>
                  <span className="min-w-0">
                    <span className={`block text-[14px] font-extrabold leading-snug sm:text-[15px] lg:text-[18px] ${on ? 'text-ink' : 'text-ink-2'}`}>{t.title}</span>
                    <span className="mt-1 hidden text-[15px] leading-relaxed text-ink-2 lg:block">{t.sub}</span>
                  </span>
                </button>
                {on && <div className="hidden pb-2 pl-[58px] pr-1 pt-2 lg:block">{notes}</div>}
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <div
          id={`${uid}-panel`}
          role="tabpanel"
          aria-labelledby={`${uid}-tab-${step}`}
          className="relative overflow-hidden rounded-lg bg-sunken ring-1 ring-inset ring-rule"
        >
          <div
            ref={stageRef}
            onScroll={checkScroll}
            className="h-[min(560px,72svh)] overflow-y-auto overscroll-contain p-4 [scrollbar-width:thin] sm:p-5 lg:h-[640px]"
          >
            <div className="flex min-h-full items-center justify-center">
              <figure
                key={`${step}-${screen.src}`}
                className="tour-screen relative mx-auto"
                style={{ width: `min(${screen.w}px, 100%)` }}
              >
                <img
                  src={screen.src}
                  alt={s.alt}
                  width={screen.w}
                  height={screen.h}
                  decoding="async"
                  className="block h-auto w-full rounded-md bg-surface ring-1 ring-rule shadow-[0_28px_60px_-30px_rgba(43,33,26,0.45)]"
                />
                {screen.pins.map((p, i) => (
                  <Pin
                    key={i}
                    n={i + 1}
                    pin={p}
                    open={active === i}
                    tipId={`${uid}-tip-${i}`}
                    label={noteLabel(i + 1)}
                    onOpen={() => setActive(i)}
                    onClose={() => setActive(-1)}
                    pinRef={(el) => (pinEls.current[i] = el)}
                  />
                ))}
              </figure>
            </div>
          </div>
          {/* A tall screen continues below the fold of the stage. */}
          <div
            aria-hidden="true"
            className={`pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-sunken to-transparent transition-opacity duration-300 ${moreBelow ? 'opacity-100' : 'opacity-0'}`}
          />
        </div>
        {footnote && <p className="mt-2.5 text-[13px] font-semibold text-ink-3">{footnote}</p>}
        <div className="mt-4 lg:hidden">{notes}</div>
      </div>
    </div>
  );
};
