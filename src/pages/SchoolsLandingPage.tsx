/*
 * Direction contract (impeccable surface seed eaa46e82)
 * THESIS: /schools is a director's questions, answered. Six real questions
 *   lead the page; each gets a short honest answer and a small proof. Refuses
 *   the feature-bento-plus-pricing-cards SaaS layout.
 * OWN-WORLD: the parent site's warm kitchen-table tokens (cream ground, white
 *   cards with 1px rule rings, cocoa ink, one Chekki orange, numbered
 *   roundels), set denser for staff: 15-16px body, tables, two columns.
 * STORY: a director learns grading uses their own answer key, FTs never write
 *   Korean, a KT checks every parent report, parents pay nothing, and what it
 *   costs; then starts the 7-day trial.
 * FIRST VIEWPORT: headline, one line, orange "start 7-day free trial" left;
 *   right, Chekki holding a laptop.
 * FORM: dealt structure 7 of 7 (objection ledger), locked by the user.
 *   Signature: the open question carries the orange line down its edge.
 * FINISH: unreviewed and undocumented is unfinished; this build ends with the
 *   finish review, the verdict, DESIGN.md, and every shipping raster carrying
 *   its provenance.
 */
import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  ArrowSquareOut,
  CaretDown,
  Check,
  List,
  Moon,
  Sun,
  X,
} from '@phosphor-icons/react';
import { PLAN_SEATS, PRICING_BILLING } from '../../api/_lib/pricingTiers';
import { useDialogA11y } from '../../hooks/useDialogA11y';
import { Roundel } from '../../components/metro';
import { langPath, switchLang, urlLang } from '../lib/lang';
import { useWarmTheme } from '../lib/theme';
import { track } from '../lib/track';
import { SCHOOLS_QA } from '../data/schoolsFaq';

// Every new school starts as a 7-day trial (api/set-initial-role.ts); the
// plan param only labels which plan the director was looking at.
const trialHref = (plan = 'trial') => `/teacher?activate=true&role=director&plan=${plan}`;

const goTo = (path: string) => (e: React.MouseEvent) => {
  e.preventDefault();
  window.scrollTo({ top: 0, behavior: 'instant' });
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
};

// Prices and seats come from api/_lib/pricingTiers.ts, the same table the
// backend grants seats from, so the page can't promise a plan it won't honor.
const PLANS = [
  { id: 'solo', name: 'Solo', ko: '공부방·개인 교습소', en: 'Tutors and study rooms', consult: false },
  { id: 'starter', name: 'Starter', ko: '선생님 3명 이하 소형 학원', en: 'Small academies, up to 3 teachers', consult: false },
  { id: 'school_pro', name: 'School Pro', ko: '여러 반을 운영하는 어학원', en: 'Academies running several classes', consult: true },
  { id: 'enterprise', name: 'Enterprise', ko: '여러 캠퍼스·프랜차이즈', en: 'Multi-campus and franchises', consult: true },
];

const won = (n: number) => `₩${n.toLocaleString('ko-KR')}`;

const SampleTag: React.FC<{ isKo: boolean }> = ({ isKo }) => (
  <span className="rounded bg-sunken px-2 py-0.5 text-[12px] font-bold text-ink-3">{isKo ? '예시 화면' : 'Sample'}</span>
);

const Points: React.FC<{ items: string[] }> = ({ items }) => (
  <ul className="mt-4 space-y-2">
    {items.map((x) => (
      <li key={x} className="flex items-start gap-2.5 text-[15px] leading-relaxed text-ink-2">
        <Check size={18} weight="bold" className="mt-0.5 shrink-0 text-line-ink" aria-hidden="true" />
        {x}
      </li>
    ))}
  </ul>
);

// One director question. Closed by default so the page reads as a short list;
// the answer and its sample screen open on tap. Controlled so links can open it.
const QFold: React.FC<{ i: number; title: string; open: boolean; onToggle: (open: boolean) => void; children: React.ReactNode }> = ({
  i,
  title,
  open,
  onToggle,
  children,
}) => (
  <details id={`q${i + 1}`} open={open} onToggle={(e) => onToggle(e.currentTarget.open)} className="group scroll-mt-20">
    <summary className="relative flex min-h-[72px] cursor-pointer list-none items-center gap-3 rounded-md py-4 before:absolute before:-left-3 before:bottom-4 before:top-4 before:w-[3px] before:rounded-full before:bg-line before:opacity-0 before:transition-opacity group-open:before:opacity-100 focus-visible:outline-2 focus-visible:-outline-offset-2 [&::-webkit-details-marker]:hidden">
      <h2 className="flex-1 text-[19px] font-extrabold leading-snug tracking-[-0.01em] text-ink group-hover:text-line-ink sm:text-[22px]">{title}</h2>
      <CaretDown size={20} weight="bold" className="shrink-0 text-ink-3 transition-transform duration-200 group-open:rotate-180" aria-hidden="true" />
    </summary>
    <div className="pb-10 pt-2">{children}</div>
  </details>
);

const SchoolsLandingPage: React.FC = () => {
  const isKo = urlLang() === 'ko';
  const [isNight, toggleTheme] = useWarmTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [yearly, setYearly] = useState(false);
  const [showBar, setShowBar] = useState(false);

  // Grading-time calculator: the director's own numbers, nothing claimed.
  const [students, setStudents] = useState(60);
  const [sheets, setSheets] = useState(3);
  const [minutes, setMinutes] = useState(2);
  const [calcUsed, setCalcUsed] = useState(false);
  const weeklyHours = (students * sheets * minutes) / 60;
  const fmtHours = (h: number) => (h >= 10 ? Math.round(h) : Math.round(h * 10) / 10).toLocaleString(isKo ? 'ko-KR' : 'en-US');
  const numField = (set: (n: number) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    set(Math.min(9999, Math.max(0, Number(e.target.value) || 0)));
    if (!calcUsed) {
      setCalcUsed(true);
      track('schools_calculator_used');
    }
  };

  // Phones: a sticky trial bar once the hero button scrolls away, hidden
  // again when the closing panel (which has its own button) is on screen.
  useEffect(() => {
    const hero = document.getElementById('hero-cta');
    const close = document.getElementById('close-cta');
    if (!hero || !close) return;
    let heroGone = false;
    let closeSeen = false;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.target === hero) heroGone = !e.isIntersecting && e.boundingClientRect.top < 0;
        else closeSeen = e.isIntersecting;
      });
      setShowBar(heroGone && !closeSeen);
    });
    io.observe(hero);
    io.observe(close);
    return () => io.disconnect();
  }, []);
  const [openQs, setOpenQs] = useState<boolean[]>(() => Array(6).fill(false));
  const setQ = (i: number, v: boolean) => setOpenQs((prev) => (prev[i] === v ? prev : prev.map((o, j) => (j === i ? v : o))));
  // Links to a question (header "Pricing", #q5 URLs) open it, then scroll to it.
  const openQ = (i: number) => (e?: React.MouseEvent) => {
    e?.preventDefault();
    setQ(i, true);
    track('schools_question_opened', { q: i + 1 });
    requestAnimationFrame(() => document.getElementById(`q${i + 1}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };

  // Consultation sheet
  const [consultOpen, setConsultOpen] = useState(false);
  const [consultPlan, setConsultPlan] = useState('school_pro');
  const [consultSent, setConsultSent] = useState(false);
  const [consultError, setConsultError] = useState(false);
  const [sending, setSending] = useState(false);
  const [contactName, setContactName] = useState('');
  const [academyName, setAcademyName] = useState(() => {
    try {
      return localStorage.getItem('chekki_academy_name') || '';
    } catch {
      return '';
    }
  });
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [pilot, setPilot] = useState(false);

  const consultRef = useDialogA11y<HTMLDivElement>({ isOpen: consultOpen, onClose: () => setConsultOpen(false) });

  useEffect(() => {
    document.body.style.overflow = menuOpen || consultOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen, consultOpen]);

  const openConsult = (plan: string, where: string) => {
    setConsultPlan(plan);
    setConsultSent(false);
    setConsultError(false);
    setConsultOpen(true);
    track('schools_consultation_opened', { plan_id: plan, where });
  };

  const startTrial = (where: string, plan = 'trial') => () => track('schools_start_trial', { where, plan_id: plan });

  const questions = SCHOOLS_QA.map((x) => (isKo ? x.qKo : x.qEn));
  const answer = (i: number) => (isKo ? SCHOOLS_QA[i].aKo : SCHOOLS_QA[i].aEn);

  useEffect(() => {
    const fromHash = () => {
      const m = /^#q([1-6])$/.exec(window.location.hash);
      if (m) openQ(Number(m[1]) - 1)();
    };
    fromHash();
    window.addEventListener('hashchange', fromHash);
    return () => window.removeEventListener('hashchange', fromHash);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const submitConsult = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setConsultError(false);
    try {
      const res = await fetch('/api/request-school-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactName,
          academyName,
          phone,
          email,
          consultationMessage: message,
          type: '1:1-consultation',
          planId: consultPlan,
          interestedInPilot: pilot,
        }),
      });
      if (!res.ok) throw new Error(`Request failed with ${res.status}`);
      track('schools_consultation_submitted', { plan_id: consultPlan });
      setConsultSent(true);
    } catch (err) {
      console.error('Consultation request failed:', err);
      setConsultError(true);
    } finally {
      setSending(false);
    }
  };

  const primaryBtn =
    'btn-press inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-line px-6 text-[16px] font-extrabold text-[#2b211a]';
  const outlineBtn =
    'btn-press inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-surface px-5 text-[15px] font-bold text-ink ring-1 ring-inset ring-rule hover:ring-ink-3';
  const iconBtn =
    'flex h-11 w-11 items-center justify-center rounded-md text-ink-2 ring-1 ring-inset ring-rule hover:text-ink hover:ring-ink-3';
  const input =
    'w-full min-h-12 rounded-md bg-sunken px-4 text-[16px] text-ink ring-1 ring-inset ring-rule placeholder:text-ink-3 focus:outline-none focus:ring-2 focus:ring-line';
  const label = 'mb-1.5 block text-[14px] font-semibold text-ink-2';

  const seatText = (id: string) => {
    const s = PLAN_SEATS[id];
    if (isKo) return s.kt ? `원어민 ${s.ft} · 한국인 ${s.kt}` : `원어민 ${s.ft}`;
    return s.kt ? `${s.ft} FT · ${s.kt} KT` : `${s.ft} FT`;
  };

  return (
    <main className="font-warm min-h-dvh w-full overflow-x-clip bg-ground text-ink break-keep">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-line focus:px-4 focus:py-2 focus:font-bold focus:text-[#2b211a]"
      >
        {isKo ? '본문으로 건너뛰기' : 'Skip to content'}
      </a>

      <header className="sticky top-0 z-50 border-b border-rule bg-ground">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-2 px-4">
          <a href={langPath('/schools')} className="mr-auto flex items-baseline gap-2">
            <span className="text-[19px] font-extrabold tracking-[-0.02em] text-ink">
              Chekki<span className="text-line">AI</span>
            </span>
            <span className="text-[14px] font-bold text-ink-3">{isKo ? '학원용' : 'for schools'}</span>
          </a>
          <nav className="hidden items-center gap-5 pr-2 text-[15px] font-semibold text-ink-2 md:flex">
            <a href={langPath('/')} className="hover:text-ink">
              {isKo ? '학부모용' : 'For parents'}
            </a>
            <a href="#q5" onClick={openQ(4)} className="hover:text-ink">
              {isKo ? '요금' : 'Pricing'}
            </a>
            <a href={langPath('/faq')} className="hover:text-ink">
              FAQ
            </a>
          </nav>
          <button
            type="button"
            onClick={() => switchLang(isKo ? 'en' : 'ko')}
            className={`${iconBtn} text-[14px] font-bold`}
            aria-label={isKo ? 'Switch to English' : '한국어로 보기'}
          >
            {isKo ? 'EN' : '한'}
          </button>
          <button
            type="button"
            onClick={toggleTheme}
            className={iconBtn}
            aria-label={isNight ? (isKo ? '밝은 화면으로' : 'Light mode') : isKo ? '어두운 화면으로' : 'Dark mode'}
          >
            {isNight ? <Sun size={20} weight="bold" /> : <Moon size={20} weight="bold" />}
          </button>
          <a href="/teacher" className="hidden min-h-11 items-center rounded-md px-4 text-[15px] font-bold text-ink ring-1 ring-inset ring-rule hover:ring-ink-3 sm:inline-flex">
            {isKo ? '로그인' : 'Log in'}
          </a>
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className={`${iconBtn} md:hidden`}
            aria-label={isKo ? '메뉴 열기' : 'Open menu'}
            aria-expanded={menuOpen}
          >
            <List size={20} weight="bold" />
          </button>
        </div>
      </header>

      {menuOpen && (
        <div className="fixed inset-0 z-[60] flex flex-col bg-ground p-4 animate-fade-in md:hidden" role="dialog" aria-modal="true" aria-label={isKo ? '메뉴' : 'Menu'}>
          <div className="flex justify-end">
            <button type="button" onClick={() => setMenuOpen(false)} className={iconBtn} aria-label={isKo ? '메뉴 닫기' : 'Close menu'}>
              <X size={20} weight="bold" />
            </button>
          </div>
          <nav className="mt-6 flex flex-col gap-1 text-[20px] font-bold">
            <a href={trialHref()} onClick={startTrial('menu')} className="rounded-md px-3 py-3 text-line-ink hover:bg-sunken">
              {isKo ? '7일 무료로 시작하기' : 'Start 7-day free trial'}
            </a>
            <a href="/teacher" className="rounded-md px-3 py-3 hover:bg-sunken">
              {isKo ? '선생님·원장님 로그인' : 'Teacher and director log in'}
            </a>
            <a href="#q5" onClick={(e) => { setMenuOpen(false); openQ(4)(e); }} className="rounded-md px-3 py-3 hover:bg-sunken">
              {isKo ? '요금' : 'Pricing'}
            </a>
            <a href={langPath('/')} className="rounded-md px-3 py-3 hover:bg-sunken">
              {isKo ? '학부모용 안내' : 'For parents'}
            </a>
            <a href={langPath('/faq')} className="rounded-md px-3 py-3 hover:bg-sunken">
              {isKo ? '자주 묻는 질문' : 'FAQ'}
            </a>
            <a href="https://blog.naver.com/chekkiai" target="_blank" rel="noopener noreferrer" className="rounded-md px-3 py-3 hover:bg-sunken">
              {isKo ? '블로그' : 'Blog'}
            </a>
          </nav>
        </div>
      )}

      {/* HERO: the offer on the left, Chekki on the right */}
      <section id="main-content" className="tile-ground">
        <div className="mx-auto grid max-w-6xl items-center gap-4 px-4 pb-8 pt-8 md:grid-cols-[1.15fr_1fr] md:gap-12 md:pb-16 md:pt-16">
          <div>
            <h1 className="text-[34px] font-extrabold leading-[1.12] tracking-[-0.03em] text-ink sm:text-[42px]">
              {isKo ? (
                <>
                  정답지는 한 번만.
                  <br />
                  채점과 학부모 리포트는 채키가.
                </>
              ) : (
                <>
                  Upload the answer key once.
                  <br />
                  Chekki grades and drafts the parent reports.
                </>
              )}
            </h1>
            <p className="mt-4 max-w-xl text-[17px] leading-relaxed text-ink-2">
              {isKo
                ? '집에서 한 영어 숙제를 학원 정답지로 채점하고, 원어민 선생님의 수업 기록을 한국어 리포트로 바꿔요. 학부모님께 가기 전에는 한국인 선생님이 꼭 확인해요.'
                : "Homework scanned at home is graded against your own answer key, and your foreign teachers' class notes become Korean parent reports. A Korean teacher checks each one before it goes out."}
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
              <a id="hero-cta" href={trialHref()} onClick={startTrial('hero')} className={`${primaryBtn} min-h-14 px-7 text-[17px]`}>
                {isKo ? '7일 무료로 시작하기' : 'Start 7-day free trial'}
                <ArrowRight size={20} weight="bold" />
              </a>
              <p className="text-[14px] font-semibold text-ink-3 sm:max-w-[14rem]">
                {isKo ? '카드·사업자번호 없이 학원명과 이메일만 있으면 돼요' : 'No card or business number. Just your academy name and email.'}
              </p>
            </div>
          </div>

          <img
            src="/images/chekki-holding-laptop.webp"
            alt=""
            width={920}
            height={920}
            fetchPriority="high"
            className="mx-auto w-full max-w-[150px] md:max-w-[400px]"
          />
        </div>
      </section>

      {/* QUESTIONS */}
      <div className="mx-auto max-w-6xl px-4 py-8 md:py-12">
        <h2 className="text-[22px] font-extrabold leading-snug tracking-[-0.02em] text-ink sm:text-[26px]">
          {isKo ? '원장님들이 먼저 묻는 것' : 'What directors ask first'}
        </h2>
        <p className="mt-1.5 text-[15px] text-ink-3">{isKo ? '궁금한 질문을 눌러 보세요.' : 'Tap a question to see the answer.'}</p>

        <div className="mt-6 divide-y divide-rule border-y border-rule">
          {/* Q1: grading accuracy */}
          <QFold i={0} title={questions[0]} open={openQs[0]} onToggle={(v) => setQ(0, v)}>
            <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
              <div>
                <p className="text-[17px] font-semibold leading-relaxed text-ink">{answer(0)}</p>
                <Points
                  items={
                    isKo
                      ? ['교재 사진이나 PDF를 한 번에 5장까지 올리면 단어, 파닉스, 정답을 뽑아 채워 줘요. 확인하고 저장만 하면 돼요.', '정답지에 없는 문항만 AI가 판단해요.', '손글씨가 많이 흐리면 잘못 읽을 수 있어요. 정답지를 올릴수록 정확해져요.']
                      : ['Upload up to 5 photos or PDF pages at once. Chekki pulls out the words, phonics and answers; you check and save.', 'Only questions that are not on the key are judged by the AI.', 'Very faint handwriting can be misread. The more keys you upload, the more accurate it gets.']
                  }
                />
              </div>

              <figure className="rounded-md bg-surface p-4 ring-1 ring-inset ring-rule sm:p-5" aria-label={isKo ? '예시: 정답지로 채점한 숙제' : 'Sample: homework graded against the key'}>
                <figcaption className="flex items-center justify-between gap-3">
                  <span className="text-[14px] font-bold text-ink">{isKo ? 'Unit 5 정답지 · 지호의 숙제' : "Unit 5 key · Jiho's homework"}</span>
                  <SampleTag isKo={isKo} />
                </figcaption>
                <table className="mt-3 w-full text-left text-[15px]">
                  <thead>
                    <tr className="border-b border-rule text-[13px] font-bold text-ink-3">
                      <th className="py-2 pr-2 font-bold" scope="col">#</th>
                      <th className="py-2 pr-2 font-bold" scope="col">{isKo ? '정답지' : 'Key'}</th>
                      <th className="py-2 pr-2 font-bold" scope="col">{isKo ? '아이 답' : 'Child wrote'}</th>
                      <th className="py-2 text-end font-bold" scope="col">{isKo ? '결과' : 'Result'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-rule">
                    {[
                      ['hat', 'hat', true],
                      ['bed', 'ded', false],
                      ['sun', 'sun', true],
                      ['dog', 'dog', true],
                    ].map(([key, kid, ok], i) => (
                      <tr key={i}>
                        <td className="num py-2.5 pr-2 font-semibold text-ink-3">{i + 1}</td>
                        <td className="py-2.5 pr-2 font-semibold text-ink-2">{key}</td>
                        <td className={`py-2.5 pr-2 font-bold ${ok ? 'text-ink' : 'text-wrong'}`}>{kid}</td>
                        <td className={`py-2.5 text-end text-[14px] font-bold ${ok ? 'text-correct' : 'text-wrong'}`}>
                          {ok ? (isKo ? '맞음' : 'Right') : isKo ? '틀림' : 'Wrong'}
                        </td>
                      </tr>
                    ))}
                    <tr>
                      <td className="num py-2.5 pr-2 font-semibold text-ink-3">5</td>
                      <td className="py-2.5 pr-2 text-[14px] font-semibold text-ink-3">{isKo ? '정답지에 없음' : 'Not on key'}</td>
                      <td className="py-2.5 pr-2 font-bold text-ink">I like my dog.</td>
                      <td className="py-2.5 text-end">
                        <span className="rounded bg-line-soft px-2 py-0.5 text-[13px] font-bold text-line-ink">{isKo ? 'AI 판단' : 'AI judged'}</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </figure>
            </div>
          </QFold>

          {/* Q2: FT log, AI draft, KT sends */}
          <QFold i={1} title={questions[1]} open={openQs[1]} onToggle={(v) => setQ(1, v)}>
            <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
              <div>
                <p className="text-[17px] font-semibold leading-relaxed text-ink">{answer(1)}</p>
                <Points
                  items={
                    isKo
                      ? ['한국인 선생님이 확인하기 전에는 학부모님께 아무것도 가지 않아요.', '한국인 선생님은 반 단위로 한꺼번에 검토해요.', '카카오톡에 붙여 넣을 문구도 같이 만들어 줘요.']
                      : ['Nothing reaches a parent until a Korean teacher has checked it.', 'Korean teachers review a whole class at once.', 'A KakaoTalk-ready copy is made alongside.']
                  }
                />
              </div>

              <figure className="rounded-md bg-surface p-4 ring-1 ring-inset ring-rule sm:p-5" aria-label={isKo ? '예시: 수업 기록에서 학부모 리포트까지' : 'Sample: from class note to parent report'}>
                <figcaption className="flex items-center justify-between gap-3">
                  <span className="text-[14px] font-bold text-ink">{isKo ? '3반 · 오늘 수업' : "Class 3 · today's lesson"}</span>
                  <SampleTag isKo={isKo} />
                </figcaption>
                <ol className="relative mt-4 space-y-4 before:absolute before:bottom-6 before:left-[15px] before:top-6 before:w-1 before:rounded-full before:bg-line">
                  <li className="relative flex gap-3">
                    <Roundel state="done" size={34} className="text-[12px]">
                      FT
                    </Roundel>
                    <div className="min-w-0 flex-1 rounded-md bg-sunken p-3">
                      <p className="text-[13px] font-bold text-ink-3">{isKo ? '원어민 선생님 기록 (영어)' : 'Foreign teacher note'}</p>
                      <p className="mt-1 text-[15px] leading-relaxed text-ink">Read “The Big Hat” together. Jiho still mixes up b and d. Please practice at home.</p>
                    </div>
                  </li>
                  <li className="relative flex gap-3">
                    <Roundel state="done" size={34} className="text-[12px]">
                      AI
                    </Roundel>
                    <div className="min-w-0 flex-1 rounded-md bg-sunken p-3">
                      <p className="text-[13px] font-bold text-ink-3">{isKo ? '한국어 초안' : 'Korean draft'}</p>
                      <p lang="ko" className="mt-1 text-[15px] leading-relaxed text-ink">
                        오늘은 ‘The Big Hat’을 함께 읽었어요. 지호는 아직 b와 d를 헷갈려 해요. 집에서 한 번 더 봐 주세요.
                      </p>
                    </div>
                  </li>
                  <li className="relative flex items-center gap-3">
                    <Roundel state="current" size={34} className="text-[12px]">
                      KT
                    </Roundel>
                    <div className="flex min-w-0 flex-1 flex-wrap items-center justify-between gap-2 rounded-md bg-line-soft p-3">
                      <p className="text-[15px] font-bold text-ink">{isKo ? '한국인 선생님 확인 대기' : 'Waiting for the Korean teacher'}</p>
                      <span className="rounded-md bg-line px-3 py-1.5 text-[14px] font-bold text-[#2b211a]" aria-hidden="true">
                        {isKo ? '확인하고 보내기' : 'Check and send'}
                      </span>
                    </div>
                  </li>
                </ol>
              </figure>
            </div>
          </QFold>

          {/* Q3: home homework reaches the teacher */}
          <QFold i={2} title={questions[2]} open={openQs[2]} onToggle={(v) => setQ(2, v)}>
            <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
              <div>
                <p className="text-[17px] font-semibold leading-relaxed text-ink">{answer(2)}</p>
                <Points
                  items={
                    isKo
                      ? ['반 전체가 많이 틀린 것을 모아 보여 줘요. 다음 수업에서 무엇을 다시 볼지 바로 알 수 있어요.', '학부모님은 받은 링크만 누르면 연결돼요. 따로 입력할 코드가 없어요.']
                      : ['Misses are pooled across the class, so you know what to reteach next lesson.', 'Parents just tap the link they were sent. There is no code to type.']
                  }
                />
              </div>

              <figure className="rounded-md bg-surface p-4 ring-1 ring-inset ring-rule sm:p-5" aria-label={isKo ? '예시: 반에서 많이 틀린 것' : 'Sample: what the class missed most'}>
                <figcaption className="flex items-center justify-between gap-3">
                  <span className="text-[14px] font-bold text-ink">{isKo ? '3반 · 이번 주 집에서 많이 틀린 것' : 'Class 3 · most missed at home this week'}</span>
                  <SampleTag isKo={isKo} />
                </figcaption>
                <ul className="mt-4 space-y-3.5">
                  {[
                    { t: isKo ? 'b와 d 구분' : 'b vs d', n: 7 },
                    { t: isKo ? '-ck로 끝나는 단어' : 'Words ending in -ck', n: 5 },
                    { t: 'was / were', n: 3 },
                  ].map(({ t, n }) => (
                    <li key={t}>
                      <div className="flex items-baseline justify-between gap-3 text-[15px]">
                        <span className="font-bold text-ink">{t}</span>
                        <span className="num font-semibold text-ink-2">{isKo ? `12명 중 ${n}명` : `${n} of 12`}</span>
                      </div>
                      <div className="mt-1.5 h-2 rounded-full bg-sunken">
                        <div className="h-2 rounded-full bg-line" style={{ width: `${(n / 12) * 100}%` }} />
                      </div>
                    </li>
                  ))}
                </ul>
                <p className="mt-4 rounded-md bg-line-soft p-3 text-[14px] font-semibold text-ink">
                  {isKo ? '금요일 수업 전에 b와 d를 한 번 더 짚어 보세요.' : 'Go over b and d again before Friday’s class.'}
                </p>
              </figure>
            </div>
          </QFold>

          {/* Q4: what the parent sees, and what it costs them */}
          <QFold i={3} title={questions[3]} open={openQs[3]} onToggle={(v) => setQ(3, v)}>
            <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
              <div>
                <p className="text-[17px] font-semibold leading-relaxed text-ink">{answer(3)}</p>
                <a href={langPath('/')} className="mt-3 inline-flex min-h-11 items-center gap-1.5 text-[15px] font-bold text-line-ink">
                  {isKo ? '학부모님이 보는 화면 보기' : 'See what parents get'}
                  <ArrowRight size={16} weight="bold" />
                </a>
              </div>

              <figure className="rounded-md bg-surface p-4 ring-1 ring-inset ring-rule sm:p-5" aria-label={isKo ? '예시: 학부모 앱의 수업 리포트' : 'Sample: a class report in the parent app'}>
                <figcaption className="flex items-center justify-between gap-3">
                  <span className="text-[14px] font-bold text-ink">{isKo ? '학부모 앱 · 지호의 수업 리포트' : "Parent app · Jiho's class report"}</span>
                  <SampleTag isKo={isKo} />
                </figcaption>
                <div className="mt-3 rounded-md bg-sunken p-4">
                  <p className="text-[13px] font-bold text-ink-3">{isKo ? '3반 · 오늘 수업' : 'Class 3 · today'}</p>
                  <p lang="ko" className="mt-1 text-[15px] leading-relaxed text-ink">
                    오늘은 ‘The Big Hat’을 함께 읽었어요. 지호는 아직 b와 d를 헷갈려 해요. 집에서 한 번 더 봐 주세요.
                  </p>
                  <p className="mt-3 flex items-center gap-1.5 text-[13px] font-bold text-correct">
                    <Check size={14} weight="bold" aria-hidden="true" />
                    {isKo ? '한국인 선생님이 확인하고 보냈어요' : 'Checked and sent by the Korean teacher'}
                  </p>
                </div>
                <div className="mt-3 flex items-baseline justify-between gap-3 border-t border-rule pt-3">
                  <span className="text-[15px] font-semibold text-ink-2">{isKo ? '학부모님 요금' : 'Cost to the parent'}</span>
                  <span className="num text-[20px] font-extrabold text-ink">₩0</span>
                </div>
              </figure>
            </div>
          </QFold>

          {/* Q5: pricing */}
          <QFold i={4} title={questions[4]} open={openQs[4]} onToggle={(v) => setQ(4, v)}>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="inline-flex rounded-md bg-sunken p-0.5" role="group" aria-label={isKo ? '결제 주기' : 'Billing'}>
                {[false, true].map((y) => (
                  <button
                    key={String(y)}
                    type="button"
                    aria-pressed={yearly === y}
                    onClick={() => setYearly(y)}
                    className={`min-h-10 rounded px-4 text-[14px] font-bold ${yearly === y ? 'bg-sign text-on-sign dark:bg-ink dark:text-ground' : 'text-ink-2 hover:text-ink'}`}
                  >
                    {y ? (isKo ? '연 결제 · 약 20% 할인' : 'Yearly · about 20% off') : isKo ? '월 결제' : 'Monthly'}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 overflow-hidden rounded-md bg-surface ring-1 ring-inset ring-rule">
              <div className="hidden grid-cols-[1.4fr_1fr_1fr_auto] gap-4 border-b border-rule bg-sunken px-5 py-2.5 text-[13px] font-bold text-ink-3 sm:grid">
                <span>{isKo ? '요금제' : 'Plan'}</span>
                <span>{isKo ? '선생님 좌석' : 'Teacher seats'}</span>
                <span>{isKo ? '요금 (월)' : 'Price per month'}</span>
                <span className="w-32" />
              </div>
              <ul className="divide-y divide-rule">
                {PLANS.map((p) => {
                  const bill = PRICING_BILLING[p.id];
                  const monthly = yearly ? bill.yearly.krw : bill.monthly.krw;
                  return (
                    <li key={p.id} className="grid gap-x-4 gap-y-2 px-5 py-4 sm:grid-cols-[1.4fr_1fr_1fr_auto] sm:items-center">
                      <div>
                        <p className="text-[17px] font-extrabold text-ink">{p.name}</p>
                        <p className="text-[14px] text-ink-2">{isKo ? p.ko : p.en}</p>
                      </div>
                      <p className="text-[15px] font-semibold text-ink-2">
                        <span className="text-[13px] font-bold text-ink-3 sm:hidden">{isKo ? '좌석 ' : 'Seats '}</span>
                        {seatText(p.id)}
                      </p>
                      <div>
                        <p className="num text-[20px] font-extrabold text-ink">
                          {won(monthly)}
                          <span className="text-[14px] font-semibold text-ink-3">{isKo ? '/월' : '/mo'}</span>
                        </p>
                        {yearly && <p className="num text-[13px] font-semibold text-ink-3">{isKo ? `연 ${won(monthly * 12)} 결제` : `${won(monthly * 12)} billed yearly`}</p>}
                      </div>
                      {p.consult ? (
                        <button type="button" onClick={() => openConsult(p.id, 'pricing')} className={`${outlineBtn} w-full sm:w-32`}>
                          {isKo ? '상담 신청' : 'Talk to us'}
                        </button>
                      ) : (
                        <a
                          href={trialHref(p.id)}
                          onClick={() => {
                            track('schools_pricing_viewed', { plan_id: p.id });
                            startTrial('pricing', p.id)();
                          }}
                          className={`${outlineBtn} w-full sm:w-32`}
                        >
                          {isKo ? '체험 시작' : 'Start trial'}
                        </a>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
            <div className="mt-4 space-y-1.5 text-[14px] leading-relaxed text-ink-2">
              <p>
                {isKo
                  ? '모든 학원은 7일 무료 체험(원어민 1 · 한국인 1 좌석)으로 시작해요. 체험 후 원장님 화면에서 요금제를 고르면 청구서를 보내 드려요. 계좌이체와 전자세금계산서로 결제해요.'
                  : 'Every academy starts with a 7-day free trial (1 FT and 1 KT seat). After the trial, pick a plan from the director dashboard and we send an invoice, paid by bank transfer with a tax invoice.'}
              </p>
              <p>
                {isKo ? '학부모님 앱은 무료예요. 환불은 ' : 'The parent app is free. Refunds follow our '}
                <a href="/refund" onClick={goTo('/refund')} className="font-bold text-line-ink underline">
                  {isKo ? '환불정책' : 'refund policy'}
                </a>
                {isKo ? '을 따라요.' : '.'}
              </p>
            </div>
          </QFold>

          {/* Q6: getting started */}
          <QFold i={5} title={questions[5]} open={openQs[5]} onToggle={(v) => setQ(5, v)}>
            {/* The orange line: vertical on phones, across from sm. Roundels sit on it. */}
            <ol className="relative mt-2 grid gap-6 before:absolute before:bottom-4 before:left-[14px] before:top-4 before:w-1 before:rounded-full before:bg-line sm:grid-cols-4 sm:gap-4 sm:before:bottom-auto sm:before:left-[12.5%] sm:before:right-[12.5%] sm:before:top-[14px] sm:before:h-1 sm:before:w-auto">
              {(isKo
                ? [
                    ['가입하기', '학원명과 원장님 이메일로 가입해요. 7일 체험이 바로 시작돼요.'],
                    ['선생님 초대', '반을 만들고 선생님을 초대해요. 이메일 링크로 들어와요.'],
                    ['학부모 초대', '아이마다 초대 링크를 보내요. 누르면 앱과 연결돼요.'],
                    ['정답지 올리기', '이번 주 숙제와 정답지를 사진이나 PDF로 올려요.'],
                  ]
                : [
                    ['Sign up', 'Use your academy name and email. The 7-day trial starts right away.'],
                    ['Invite teachers', 'Create classes and invite teachers by email link.'],
                    ['Invite parents', 'Send each child an invite link. One tap links the app.'],
                    ['Upload the key', "Add this week's homework and answer key as photos or PDF."],
                  ]
              ).map(([t, d], i) => (
                <li key={t} className="relative flex gap-3 sm:flex-col sm:items-center sm:text-center">
                  <Roundel state={i === 0 ? 'current' : 'next'} size={32}>
                    {i + 1}
                  </Roundel>
                  <div className="sm:px-1">
                    <h3 className="text-[16px] font-extrabold text-ink">{t}</h3>
                    <p className="mt-1 text-[14px] leading-relaxed text-ink-2">{d}</p>
                  </div>
                </li>
              ))}
            </ol>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
              <a href={trialHref()} onClick={startTrial('steps')} className={primaryBtn}>
                {isKo ? '7일 무료로 시작하기' : 'Start 7-day free trial'}
                <ArrowRight size={18} weight="bold" />
              </a>
              <a href={langPath('/faq')} className="inline-flex min-h-11 items-center gap-1.5 px-1 text-[15px] font-bold text-line-ink">
                {isKo ? '다른 질문 보기' : 'More questions'}
                <ArrowRight size={16} weight="bold" />
              </a>
            </div>
          </QFold>
        </div>
      </div>

      {/* CALCULATOR: how much hand-grading the academy does today */}
      <section className="mx-auto max-w-6xl px-4 pb-12 md:pb-16">
        <div className="grid gap-6 rounded-lg bg-surface p-5 ring-1 ring-inset ring-rule sm:p-6 md:grid-cols-[1.3fr_1fr] md:p-8">
          <div>
            <h2 className="text-[22px] font-extrabold leading-snug tracking-[-0.02em] text-ink sm:text-[26px]">
              {isKo ? '우리 학원은 채점에 얼마나 쓰고 있을까요?' : 'How much time does grading take at your academy?'}
            </h2>
            <p className="mt-1.5 text-[15px] text-ink-3">{isKo ? '우리 학원 숫자로 바꿔 보세요.' : 'Put in your own numbers.'}</p>
            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              {[
                { id: 'calc-students', label: isKo ? '원생 수' : 'Students', value: students, set: setStudents },
                { id: 'calc-sheets', label: isKo ? '학생당 주간 숙제 장수' : 'Sheets per student a week', value: sheets, set: setSheets },
                { id: 'calc-minutes', label: isKo ? '한 장 채점 시간 (분)' : 'Minutes to grade a sheet', value: minutes, set: setMinutes },
              ].map((f) => (
                <div key={f.id}>
                  <label htmlFor={f.id} className={label}>
                    {f.label}
                  </label>
                  <input id={f.id} type="number" inputMode="numeric" min={0} value={f.value} onChange={numField(f.set)} className={`${input} num`} />
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-col justify-center border-t border-rule pt-6 md:border-l md:border-t-0 md:pl-8 md:pt-0" aria-live="polite">
            <p className="text-[15px] font-semibold text-ink-2">{isKo ? '매주 손 채점에 쓰는 시간' : 'Hand-grading every week'}</p>
            <p className="num mt-1 text-[40px] font-extrabold leading-none tracking-[-0.02em] text-ink">
              {isKo ? `약 ${fmtHours(weeklyHours)}시간` : `~${fmtHours(weeklyHours)} hours`}
            </p>
            <p className="num mt-2 text-[15px] font-semibold text-ink-2">
              {isKo ? `4주면 약 ${fmtHours(weeklyHours * 4)}시간` : `about ${fmtHours(weeklyHours * 4)} hours every 4 weeks`}
            </p>
            <p className="mt-4 text-[14px] leading-relaxed text-ink-2">
              {isKo
                ? '채키를 쓰면 이 채점은 학부모님이 집에서 숙제를 찍을 때 학원 정답지로 이뤄져요.'
                : 'With Chekki, this grading happens when parents scan homework at home, against your answer key.'}
            </p>
          </div>
        </div>
      </section>

      {/* EXTRAS: one quiet row of free links */}
      <section className="mx-auto max-w-6xl px-4">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-1 border-t border-rule pt-6 text-[15px]">
          <h2 className="font-semibold text-ink-3">{isKo ? '선생님을 위한 무료 자료' : 'Free for teachers'}</h2>
          {[
            { href: 'https://ai-readiness.chekkiai.com?utm_source=chekki_schools&utm_medium=banner&utm_campaign=ai_readiness', t: isKo ? 'AI 준비도 진단' : 'AI readiness check' },
            { href: 'https://www.youtube.com/@ChekkiAI', t: isKo ? '유튜브 채널' : 'YouTube channel' },
            { href: 'https://www.teacherspayteachers.com/store/chekki-ai', t: isKo ? 'TPT 워크시트' : 'TPT worksheets' },
            { href: 'https://chekkiai.netlify.app/', t: isKo ? '문법 PPT' : 'Grammar slides' },
          ].map(({ href, t }) => (
            <a key={href} href={href} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-1 font-bold text-ink-2 hover:text-line-ink">
              {t}
              <ArrowSquareOut size={14} weight="bold" aria-hidden="true" />
            </a>
          ))}
        </div>
      </section>

      {/* CLOSE: cocoa panel, trial first, consultation second */}
      <section id="close-cta" className="mx-auto max-w-6xl px-4 py-12 md:py-16">
        <div className="grid items-center gap-6 rounded-lg bg-sign p-6 text-on-sign md:grid-cols-[auto_1fr_auto] md:p-8">
          <img src="/images/chekki-wave.webp" alt="" width={112} height={112} className="hidden h-28 w-28 object-contain md:block" />
          <div>
            <h2 className="text-[24px] font-extrabold tracking-[-0.02em] sm:text-[28px]">
              {isKo ? '이번 주 정답지 한 장으로 시작해 보세요' : "Start with this week's answer key"}
            </h2>
            <p className="mt-2 text-[15px] leading-relaxed text-on-sign-2">
              {isKo
                ? '학원 규모가 크거나 먼저 이야기해 보고 싶다면 상담을 신청하세요.'
                : 'Running a large academy, or want to talk first? Ask for a call.'}
            </p>
          </div>
          <div className="flex flex-col gap-2.5 sm:flex-row md:flex-col">
            <a href={trialHref()} onClick={startTrial('close')} className={primaryBtn}>
              {isKo ? '7일 무료로 시작하기' : 'Start 7-day free trial'}
            </a>
            <button
              type="button"
              onClick={() => openConsult('school_pro', 'close')}
              className="btn-press inline-flex min-h-12 items-center justify-center rounded-md px-5 text-[15px] font-bold text-on-sign ring-1 ring-inset ring-on-sign-2/50 hover:ring-on-sign"
            >
              {isKo ? '상담 신청하기' : 'Ask for a call'}
            </button>
          </div>
        </div>
      </section>

      <footer className="border-t border-rule bg-surface pb-20 md:pb-0">
        <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-10 text-[13px] text-ink-3">
          <div className="flex flex-wrap gap-x-5 gap-y-2 font-semibold text-ink-2">
            <a href={langPath('/')} className="hover:text-ink">{isKo ? '학부모용' : 'For parents'}</a>
            <a href="/teacher" className="hover:text-ink">{isKo ? '선생님·원장님 로그인' : 'Teacher log in'}</a>
            <a href={langPath('/faq')} className="hover:text-ink">FAQ</a>
            <a href="https://blog.naver.com/chekkiai" target="_blank" rel="noopener noreferrer" className="hover:text-ink">
              {isKo ? '블로그' : 'Blog'}
            </a>
            <a href="/privacy" onClick={goTo('/privacy')} className="hover:text-ink">{isKo ? '개인정보처리방침' : 'Privacy Policy'}</a>
            <a href="/terms" onClick={goTo('/terms')} className="hover:text-ink">{isKo ? '이용약관' : 'Terms of Service'}</a>
            <a href="/refund" onClick={goTo('/refund')} className="hover:text-ink">{isKo ? '환불정책' : 'Refund Policy'}</a>
            <a href="/support" onClick={goTo('/support')} className="hover:text-ink">{isKo ? '고객지원' : 'Customer Support'}</a>
          </div>
          {/* Business info is required for KC INCIS / PortOne inspection */}
          <div className="space-y-1">
            <p className="font-bold text-ink-2">{isKo ? '사업자 정보' : 'Business information'}</p>
            <p>
              {isKo ? '상호명' : 'Company'}: 채키 AI (Chekki AI) · {isKo ? '대표자' : 'Representative'}: Benjamin Jason ·{' '}
              {isKo ? '사업자등록번호' : 'Biz Reg No'}: 814-14-03096 · {isKo ? '고객센터' : 'Email'}: support@chekkiai.com
            </p>
          </div>
          <p>© {new Date().getFullYear()} Chekki AI</p>
        </div>
      </footer>

      {/* PHONES: sticky trial bar */}
      <div
        aria-hidden={!showBar}
        className={`fixed inset-x-0 bottom-0 z-40 border-t border-rule bg-ground px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 transition-[transform,visibility] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] md:hidden ${
          showBar && !consultOpen && !menuOpen ? 'visible translate-y-0' : 'invisible translate-y-full'
        }`}
      >
        <a href={trialHref()} onClick={startTrial('sticky')} tabIndex={showBar ? undefined : -1} className={`${primaryBtn} w-full`}>
          {isKo ? '7일 무료로 시작하기' : 'Start 7-day free trial'}
          <ArrowRight size={18} weight="bold" />
        </a>
      </div>

      {/* CONSULTATION: bottom sheet on phones, centred card from sm */}
      {consultOpen && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-4">
          <div className="absolute inset-0 bg-[#2b211a]/55" onClick={() => setConsultOpen(false)} aria-hidden="true" />
          <div
            ref={consultRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="consult-title"
            tabIndex={-1}
            className="modal-enter relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-lg bg-surface shadow-[0_24px_60px_-20px_rgba(43,33,26,0.45)] sm:max-w-lg sm:rounded-lg"
          >
            <div className="flex items-center justify-between gap-3 border-b border-rule px-5 py-3 sm:px-6">
              <h2 id="consult-title" className="text-[20px] font-extrabold tracking-[-0.02em] text-ink">
                {isKo ? '상담 신청' : 'Ask for a call'}
              </h2>
              <button
                type="button"
                onClick={() => setConsultOpen(false)}
                className="flex h-11 w-11 items-center justify-center rounded-md text-ink-3 hover:bg-sunken"
                aria-label={isKo ? '닫기' : 'Close'}
              >
                <X size={20} weight="bold" />
              </button>
            </div>

            {consultSent ? (
              <div className="px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-6 text-center sm:px-6">
                <img src="/images/chekki-thumbs.webp" alt="" width={112} height={112} className="mx-auto h-28 w-28 object-contain" />
                <h3 className="mt-3 text-[20px] font-extrabold text-ink">{isKo ? '신청을 받았어요' : 'Got it'}</h3>
                <p className="mx-auto mt-2 max-w-sm text-[15px] leading-relaxed text-ink-2">
                  {isKo ? '남겨 주신 전화번호나 이메일로 연락드릴게요.' : "We'll get back to you by phone or email."}
                </p>
                <button type="button" onClick={() => setConsultOpen(false)} className={`${primaryBtn} mt-6 w-full`}>
                  {isKo ? '확인' : 'Done'}
                </button>
              </div>
            ) : (
              <form onSubmit={submitConsult} className="flex min-h-0 flex-1 flex-col">
                <div className="custom-scrollbar space-y-4 overflow-y-auto px-5 py-5 sm:px-6">
                  <p className="text-[15px] leading-relaxed text-ink-2">
                    {isKo
                      ? '학원 규모와 궁금한 점을 남겨 주시면 맞춤 세팅과 요금을 안내해 드려요.'
                      : "Tell us about your academy and we'll suggest a setup and plan."}
                  </p>
                  {consultError && (
                    <p role="alert" className="rounded-md bg-wrong-soft p-3 text-[14px] font-semibold text-wrong">
                      {isKo
                        ? '보내지 못했어요. 잠시 후 다시 시도하거나 support@chekkiai.com으로 메일 주세요.'
                        : "That didn't go through. Try again in a moment, or email support@chekkiai.com."}
                    </p>
                  )}
                  <div>
                    <label htmlFor="consult-name" className={label}>{isKo ? '성함' : 'Your name'}</label>
                    <input id="consult-name" required autoComplete="name" value={contactName} onChange={(e) => setContactName(e.target.value)} className={input} />
                  </div>
                  <div>
                    <label htmlFor="consult-academy" className={label}>{isKo ? '학원 이름' : 'Academy name'}</label>
                    <input id="consult-academy" required autoComplete="organization" value={academyName} onChange={(e) => setAcademyName(e.target.value)} className={input} />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="consult-phone" className={label}>{isKo ? '전화번호' : 'Phone'}</label>
                      <input id="consult-phone" type="tel" required autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="010-0000-0000" className={input} />
                    </div>
                    <div>
                      <label htmlFor="consult-email" className={label}>{isKo ? '이메일' : 'Email'}</label>
                      <input id="consult-email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={input} />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="consult-message" className={label}>
                      {isKo ? '궁금한 점 (선택)' : 'Anything we should know (optional)'}
                    </label>
                    <textarea
                      id="consult-message"
                      rows={3}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder={isKo ? '예: 선생님 5명, 원생 150명, 세금계산서 발행' : 'E.g. 5 teachers, 150 students, tax invoice'}
                      className={`${input} py-3`}
                    />
                  </div>
                  <label className="flex min-h-11 cursor-pointer items-center gap-3 text-[15px] text-ink">
                    <input type="checkbox" checked={pilot} onChange={(e) => setPilot(e.target.checked)} className="h-5 w-5 accent-[var(--m-line)]" />
                    {isKo ? '파일럿 파트너 요금에 관심 있어요' : "I'm interested in pilot partner pricing"}
                  </label>
                </div>
                <div className="border-t border-rule px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 sm:px-6">
                  <button type="submit" disabled={sending} className={`${primaryBtn} w-full disabled:opacity-50`}>
                    {sending ? (
                      <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#2b211a]/30 border-t-[#2b211a]" aria-label={isKo ? '보내는 중' : 'Sending'} />
                    ) : isKo ? (
                      '상담 신청하기'
                    ) : (
                      'Send request'
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </main>
  );
};

export default SchoolsLandingPage;
