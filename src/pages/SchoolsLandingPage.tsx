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
 *   right, a card listing the six questions as roundel links.
 * FORM: dealt structure 7 of 7 (objection ledger), locked by the user.
 *   Signature: on wide screens a sticky roundel rail tracks the question
 *   being read.
 * FINISH: unreviewed and undocumented is unfinished; this build ends with the
 *   finish review, the verdict, DESIGN.md, and every shipping raster carrying
 *   its provenance.
 */
import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  ArrowSquareOut,
  ArrowDown,
  ChartBar,
  Check,
  FilePdf,
  GraduationCap,
  List,
  Moon,
  PlayCircle,
  Sun,
  X,
} from '@phosphor-icons/react';
import { PLAN_SEATS, PRICING_BILLING } from '../../api/_lib/pricingTiers';
import { useDialogA11y } from '../../hooks/useDialogA11y';
import { Roundel } from '../../components/metro';
import { langPath, switchLang, urlLang } from '../lib/lang';
import { useWarmTheme } from '../lib/theme';
import { track } from '../lib/track';

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

const SchoolsLandingPage: React.FC = () => {
  const isKo = urlLang() === 'ko';
  const [isNight, toggleTheme] = useWarmTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [yearly, setYearly] = useState(false);
  const [activeQ, setActiveQ] = useState(-1);

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

  const questions = isKo
    ? ['채점이 정확한가요?', '원어민 선생님이 한국어를 써야 하나요?', '집에서 한 숙제가 선생님께 보이나요?', '학부모님은 돈을 내나요?', '비용은 얼마인가요?', '어떻게 시작하나요?']
    : ['Can we trust the grading?', 'Do foreign teachers have to write Korean?', 'Do teachers see homework done at home?', 'Do parents pay anything?', 'What does it cost?', 'How do we start?'];
  const qId = (i: number) => `q${i + 1}`;

  // Sticky rail: the question whose section crosses the upper third is current.
  useEffect(() => {
    const els = questions.map((_, i) => document.getElementById(qId(i)));
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActiveQ(els.indexOf(e.target as HTMLElement));
        });
      },
      { rootMargin: '-30% 0px -60% 0px' }
    );
    els.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isKo]);

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
  const h2 = 'text-[24px] font-extrabold leading-tight tracking-[-0.02em] text-ink sm:text-[28px]';
  const input =
    'w-full min-h-12 rounded-md bg-sunken px-4 text-[16px] text-ink ring-1 ring-inset ring-rule placeholder:text-ink-3 focus:outline-none focus:ring-2 focus:ring-line';
  const label = 'mb-1.5 block text-[14px] font-semibold text-ink-2';

  const QHead: React.FC<{ i: number }> = ({ i }) => (
    <div className="flex items-start gap-3">
      <Roundel state="current" size={36} className="mt-0.5">
        {i + 1}
      </Roundel>
      <h2 className={h2}>{questions[i]}</h2>
    </div>
  );

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
            <a href="#q5" className="hover:text-ink">
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
            <a href="#q5" onClick={() => setMenuOpen(false)} className="rounded-md px-3 py-3 hover:bg-sunken">
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

      {/* HERO: the offer on the left, the director's questions on the right */}
      <section id="main-content" className="tile-ground">
        <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 pb-12 pt-10 md:grid-cols-[1.15fr_1fr] md:gap-12 md:pb-16 md:pt-16">
          <div>
            <h1 className="text-[34px] font-extrabold leading-[1.12] tracking-[-0.03em] text-ink sm:text-[46px]">
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
              <a href={trialHref()} onClick={startTrial('hero')} className={`${primaryBtn} min-h-14 px-7 text-[17px]`}>
                {isKo ? '7일 무료로 시작하기' : 'Start 7-day free trial'}
                <ArrowRight size={20} weight="bold" />
              </a>
              <p className="text-[14px] font-semibold text-ink-3 sm:max-w-[14rem]">
                {isKo ? '카드·사업자번호 없이 학원명과 이메일만 있으면 돼요' : 'No card or business number. Just your academy name and email.'}
              </p>
            </div>
          </div>

          <nav aria-labelledby="ask-title" className="rounded-lg bg-surface p-5 ring-1 ring-inset ring-rule sm:p-6">
            <h2 id="ask-title" className="text-[15px] font-bold text-ink-3">
              {isKo ? '원장님들이 먼저 묻는 것' : 'What directors ask first'}
            </h2>
            <ol className="mt-3 divide-y divide-rule">
              {questions.map((q, i) => (
                <li key={q}>
                  <a href={`#${qId(i)}`} className="group flex min-h-12 items-center gap-3 py-2.5 text-[16px] font-bold text-ink">
                    <Roundel state="next" size={30}>
                      {i + 1}
                    </Roundel>
                    <span className="flex-1 group-hover:text-line-ink">{q}</span>
                    <ArrowDown size={16} weight="bold" className="shrink-0 text-ink-3" aria-hidden="true" />
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        </div>
      </section>

      {/* QUESTIONS, with a sticky rail on wide screens */}
      <div className="mx-auto grid max-w-6xl gap-10 px-4 lg:grid-cols-[200px_1fr]">
        <nav aria-label={isKo ? '질문 목록' : 'Questions'} className="hidden lg:block">
          <ol className={`sticky top-24 mt-12 space-y-1 transition-[opacity,visibility] duration-500 ${activeQ < 0 ? 'invisible opacity-0' : 'visible opacity-100'}`}>
            {questions.map((q, i) => (
              <li key={q}>
                <a href={`#${qId(i)}`} aria-current={activeQ === i ? 'true' : undefined} className="flex min-h-11 items-center gap-2.5 rounded-md px-1 text-[14px] font-semibold text-ink-2 hover:text-ink">
                  <Roundel state={activeQ === i ? 'current' : activeQ > i ? 'done' : 'next'} size={26} className="transition-colors duration-300">
                    {i + 1}
                  </Roundel>
                  <span className={`leading-snug ${activeQ === i ? 'font-bold text-ink' : ''}`}>{q}</span>
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="min-w-0">
          {/* Q1: grading accuracy */}
          <section id={qId(0)} className="scroll-mt-20 border-b border-rule py-12 md:py-14">
            <div className="grid gap-8 md:grid-cols-[1fr_1.05fr]">
              <div>
                <QHead i={0} />
                <p className="mt-4 text-[17px] font-semibold leading-relaxed text-ink">
                  {isKo
                    ? '선생님이 올린 이번 주 정답지로 먼저 채점해요. 정답지에 있는 문항은 AI가 답을 추측하지 않아요.'
                    : "Chekki grades against the answer key your teacher uploaded this week. For anything on the key, the AI doesn't guess the answer."}
                </p>
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
          </section>

          {/* Q2: FT log, AI draft, KT sends */}
          <section id={qId(1)} className="scroll-mt-20 border-b border-rule py-12 md:py-14">
            <div className="grid gap-8 md:grid-cols-[1fr_1.05fr]">
              <div>
                <QHead i={1} />
                <p className="mt-4 text-[17px] font-semibold leading-relaxed text-ink">
                  {isKo
                    ? '아니요. 원어민 선생님은 영어로 짧은 수업 기록만 남겨요. 말로 해도 돼요. AI가 한국어 리포트 초안을 쓰고, 한국인 선생님이 고쳐서 보내요.'
                    : 'No. Foreign teachers leave a short class note in English, typed or spoken. The AI drafts the Korean report, and a Korean teacher edits and sends it.'}
                </p>
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
          </section>

          {/* Q3: home homework reaches the teacher */}
          <section id={qId(2)} className="scroll-mt-20 border-b border-rule py-12 md:py-14">
            <div className="grid gap-8 md:grid-cols-[1fr_1.05fr]">
              <div>
                <QHead i={2} />
                <p className="mt-4 text-[17px] font-semibold leading-relaxed text-ink">
                  {isKo
                    ? '네. 학부모님이 학원에서 받은 초대 링크로 연결하면, 집에서 찍은 숙제의 점수와 틀린 문제가 원생별로 선생님 화면에 쌓여요.'
                    : 'Yes. Once a parent joins with the invite link from your academy, scores and misses from homework scanned at home build up per student on the teacher’s screen.'}
                </p>
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
          </section>

          {/* Q4: what the parent sees, and what it costs them */}
          <section id={qId(3)} className="scroll-mt-20 border-b border-rule py-12 md:py-14">
            <div className="grid gap-8 md:grid-cols-[1fr_1.05fr]">
              <div>
                <QHead i={3} />
                <p className="mt-4 text-[17px] font-semibold leading-relaxed text-ink">
                  {isKo
                    ? '아니요. 학원에 연결된 학부모님은 채키 앱을 무료로 써요. 숙제를 찍으면 채점과 한국어 설명을 받고, 선생님이 보낸 수업 리포트도 앱에서 봐요.'
                    : 'No. Parents linked to your academy use the Chekki app for free. They scan homework to get it graded and explained in Korean, and read your class reports in the app.'}
                </p>
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
          </section>

          {/* Q5: pricing */}
          <section id={qId(4)} className="scroll-mt-20 border-b border-rule py-12 md:py-14">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <QHead i={4} />
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
          </section>

          {/* Q6: getting started */}
          <section id={qId(5)} className="scroll-mt-20 py-12 md:py-14">
            <QHead i={5} />
            {/* The orange line: vertical on phones, across from sm. Roundels sit on it. */}
            <ol className="relative mt-7 grid gap-6 before:absolute before:bottom-4 before:left-[14px] before:top-4 before:w-1 before:rounded-full before:bg-line sm:grid-cols-4 sm:gap-4 sm:before:bottom-auto sm:before:left-[12.5%] sm:before:right-[12.5%] sm:before:top-[14px] sm:before:h-1 sm:before:w-auto">
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
          </section>
        </div>
      </div>

      {/* EXTRAS: readiness check and free teaching resources */}
      <section className="bg-sunken">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-12 md:grid-cols-[1fr_1.4fr] md:py-14">
          <a
            href="https://ai-readiness.chekkiai.com?utm_source=chekki_schools&utm_medium=banner&utm_campaign=ai_readiness"
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col rounded-md bg-surface p-5 ring-1 ring-inset ring-rule hover:ring-ink-3"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-line-soft text-line-ink">
              <ChartBar size={22} weight="bold" aria-hidden="true" />
            </span>
            <h2 className="mt-3 text-[18px] font-extrabold text-ink">{isKo ? '우리 학원 AI 준비도 진단' : 'Is your academy ready for AI grading?'}</h2>
            <p className="mt-1 flex-1 text-[15px] leading-relaxed text-ink-2">
              {isKo ? '몇 가지 질문에 답하면 준비도 점수를 알려 줘요.' : 'Answer a few questions and get a readiness score.'}
            </p>
            <span className="mt-4 inline-flex items-center gap-1.5 text-[15px] font-bold text-line-ink">
              {isKo ? '진단해 보기' : 'Take the check'}
              <ArrowSquareOut size={16} weight="bold" />
            </span>
          </a>

          <div>
            <h2 className="text-[18px] font-extrabold text-ink">{isKo ? '선생님을 위한 무료 자료' : 'Free resources for teachers'}</h2>
            <ul className="mt-3 divide-y divide-rule rounded-md bg-surface ring-1 ring-inset ring-rule">
              {[
                { href: 'https://www.youtube.com/@ChekkiAI', Icon: PlayCircle, t: isKo ? '유튜브 채널' : 'YouTube channel', d: isKo ? '이중언어 교육과 학습 습관 영상' : 'Bilingual teaching and study habits' },
                { href: 'https://www.teacherspayteachers.com/store/chekki-ai', Icon: GraduationCap, t: 'TPT Store', d: isKo ? '출력해서 쓰는 워크시트와 수업 자료' : 'Printable worksheets and lesson plans' },
                { href: 'https://chekkiai.netlify.app/', Icon: FilePdf, t: isKo ? '문법 PPT' : 'Grammar slides', d: isKo ? '한국 학생들이 자주 틀리는 영문법 정리' : 'Grammar mistakes Korean students make most' },
              ].map(({ href, Icon, t, d }) => (
                <li key={href}>
                  <a href={href} target="_blank" rel="noopener noreferrer" className="flex min-h-16 items-center gap-3 px-4 py-3 hover:bg-sunken/60">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-line-soft text-line-ink">
                      <Icon size={20} weight="bold" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[15px] font-bold text-ink">{t}</span>
                      <span className="block text-[14px] text-ink-2">{d}</span>
                    </span>
                    <ArrowSquareOut size={18} weight="bold" className="shrink-0 text-ink-3" aria-hidden="true" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* CLOSE: cocoa panel, trial first, consultation second */}
      <section className="mx-auto max-w-6xl px-4 py-12 md:py-16">
        <div className="grid items-center gap-6 rounded-lg bg-sign p-6 text-on-sign md:grid-cols-[auto_1fr_auto] md:p-8">
          <img src="/images/chekki-holding-laptop.webp" alt="" width={112} height={112} className="hidden h-28 w-28 object-contain md:block" />
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

      <footer className="border-t border-rule bg-surface">
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
