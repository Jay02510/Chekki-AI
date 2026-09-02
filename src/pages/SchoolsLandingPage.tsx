import React, { useState, useEffect } from 'react';
import { db } from '../../services/database';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useReducedMotion } from 'framer-motion';
import {
  GraduationCap,
  Sparkle,
  Users,
  ChartBar,
  FileText,
  ArrowRight,
  CheckCircle,
  Sun,
  Moon,
  Globe,
  Bank,
  Copy,
  Receipt,
  X,
  List,
  ShieldCheck,
  Gift,
  Envelope,
  Lightning,
  CreditCard,
  Wallet,
  CaretDown
} from '@phosphor-icons/react';
import { SchoolLoopDiagram } from '../components/SchoolLoopDiagram';
import { PLAN_SEATS, PLAN_LABELS, PRICING_BILLING } from '../../api/_lib/pricingTiers';
import { useDialogA11y } from '../../hooks/useDialogA11y';
import { useToast } from '../../contexts/ToastContext';
import { copyToClipboard } from '../../utils/clipboard';

interface Props {
  isNight: boolean;
  setIsNight: (val: boolean) => void;
}

// Pricing/billing figures, seat counts, and plan names all come from
// api/_lib/pricingTiers.ts — the same tables api/set-initial-role.ts and
// api/request-school-invoice.ts use, so this modal can never show a plan
// the backend wouldn't actually honor.
const PRICING_TIERS = Object.fromEntries(
  Object.entries(PRICING_BILLING).map(([id, billing]) => [
    id,
    {
      id,
      nameEn: PLAN_LABELS[id]?.nameEn || id,
      nameKo: PLAN_LABELS[id]?.nameKo || id,
      seats: PLAN_SEATS[id] || { ft: 0, kt: 0 },
      ...billing,
    },
  ])
) as Record<string, { id: string; nameEn: string; nameKo: string; seats: { ft: number; kt: number } } & typeof PRICING_BILLING[string]>;

// Reused verbatim from the academy ("teacher") category of FaqPage.tsx's
// FAQ_DATA — real, already-shipped content, not new copy — so this page's
// objection-handling section doesn't duplicate/drift from the canonical
// FAQ answers. Trimmed to the 5 most conversion-relevant for a director
// deciding whether to try Chekki (trial terms, AI grading trust, core
// mechanics), not every teacher-workflow question.
const SCHOOL_FAQ_ITEMS = [
  {
    id: 't4',
    questionKo: '학원용 7일 무료 체험 신청 조건 및 승인 절차는 어떻게 되나요?',
    questionEn: 'What is required for the 7-Day Academy Free Trial?',
    answerKo: '학원명, 담당자 성함, 이메일/연락처 3가지 필수 정보만 입력하시면 즉시 신청됩니다. 신용카드 등록이나 사업자번호 없이 신청 후 1시간 내 7일 전용 교사 승인 코드가 발급됩니다.',
    answerEn: 'Only 3 basic fields are required: Academy Name, Contact Name, and Email/Phone. No credit card or tax documents required. Your 7-day access code is issued within 1 hour.',
  },
  {
    id: 't5',
    questionKo: '학생 손글씨 채점 시 일반 AI의 환각(Hallucination) 오답 우려는 없나요?',
    questionEn: 'Are there concerns about AI OCR hallucinations misgrading student handwriting?',
    answerKo: '체키는 학원 교재의 정답지 데이터(Ground-Truth)를 채점 기준으로 1차 대조하기 때문에, 일반 AI 파운데이션 모델의 환각 오류 없이 정밀한 채점 기준을 유지합니다.',
    answerEn: "Chekki cross-references scans against your academy's ground-truth answer key, keeping grading precise and eliminating false AI grading hallucinations.",
  },
  {
    id: 't2',
    questionKo: '가정에서 학부모가 스캔한 오답 데이터는 어떻게 선생님께 전송되나요?',
    questionEn: 'How do parent homework scans sync to the Teacher Dashboard?',
    answerKo: '학부모님이 원장님/선생님께 받은 초대 링크로 Chekki 앱에 연동하면 자동으로 동기화됩니다. 집에서 스캔한 빨간 테두리 오답과 점수가 교사 대시보드로 실시간 전송되어 개별 원생 활동에서 확인하실 수 있습니다.',
    answerEn: 'Parents link their account via the invite their teacher sends them. Homework scans and red-bordered mistake data silently sync straight to your teacher dashboard in real-time.',
  },
  {
    id: 't1',
    questionKo: '매주 학급 주간 단어와 정답지를 일일이 타이핑해야 하나요?',
    questionEn: 'Do teachers have to manually type weekly vocabulary words and answer keys?',
    answerKo: '아닙니다! 교재 사진이나 PDF 파일을 한 번에 최대 5장까지 드롭하면 AI가 단어, 파닉스 패턴, 읽기 지문, 학부모용 정답 가이드를 3초 만에 자동으로 추출하여 대시보드에 등록해 줍니다.',
    answerEn: 'No! Simply drop up to 5 textbook photos or multi-page PDFs at once. AI extracts target words, phonics rules, reading stories, and parent answer keys into your dashboard in seconds.',
  },
  {
    id: 't3',
    questionKo: '오답 맞춤 복습 프린트 및 학원 성적표는 어떻게 인쇄하나요?',
    questionEn: 'How do I generate printable review sheets and academy branded report cards?',
    answerKo: '교사 대시보드에서 1클릭으로 간편히 발급됩니다. "오답 맞춤 프린트 생성" 버튼을 누르면 학원 로고가 포함된 파닉스/단어 쓰기 맞춤 PDF가 생성되며, 원생 상세 정보에서 "맞춤 로고 성적표 인쇄"를 누르면 공식 학부모 리포트가 출력됩니다.',
    answerEn: 'With a single click! Click "Generate Review Sheet" for an automated custom PDF worksheet, or click "Print Branded Report" inside any student profile for an official academy report card.',
  },
];

const SchoolsLandingPage: React.FC<Props> = ({ isNight, setIsNight }) => {
  const [openFaqId, setOpenFaqId] = useState<string | null>(null);
  const { showToast } = useToast();
  const [language, setLanguage] = useState<'ko' | 'en'>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const paramLang = params.get('lang');
      if (paramLang === 'en' || paramLang === 'ko') {
        localStorage.setItem('chekki_lang', paramLang);
        return paramLang;
      }
      const saved = localStorage.getItem('chekki_lang');
      if (saved === 'en' || saved === 'ko') return saved;
    }
    return 'ko';
  });

  const handleLangToggle = () => {
    const next = language === 'ko' ? 'en' : 'ko';
    setLanguage(next);
    if (typeof window !== 'undefined') {
      localStorage.setItem('chekki_lang', next);
    }
  };

  const isKo = language === 'ko';
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleTheme = () => {
    const next = !isNight;
    setIsNight(next);
    if (typeof window !== 'undefined') {
      localStorage.setItem('chekki_theme', next ? 'dark' : 'light');
    }
  };

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
  }, [mobileMenuOpen]);

  // Pricing Tier Details Modal & Instant Payment State
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showConsultationModal, setShowConsultationModal] = useState(false);
  const [consultationSubmitted, setConsultationSubmitted] = useState(false);
  const [consultationError, setConsultationError] = useState(false);
  const [consultationMessage, setConsultationMessage] = useState('');
  const [isSubmittingConsultation, setIsSubmittingConsultation] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('school_pro');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [currency, setCurrency] = useState<'KRW' | 'USD'>('KRW');

  // Payment Form States
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'kakaopay' | 'tosspay' | 'bank'>('bank');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentError, setPaymentError] = useState(false);

  const consultationDialogRef = useDialogA11y<HTMLDivElement>({
    isOpen: showConsultationModal,
    onClose: () => setShowConsultationModal(false),
  });
  const pricingDialogRef = useDialogA11y<HTMLDivElement>({
    isOpen: showPricingModal,
    onClose: () => setShowPricingModal(false),
  });
  const paymentDialogRef = useDialogA11y<HTMLDivElement>({
    isOpen: showPaymentModal,
    onClose: () => setShowPaymentModal(false),
  });

  const openPlanModal = (planId: string, _defaultTeachers: number = 1, _minSeats: number = 1) => {
    setSelectedPlanId(planId);
    setShowPricingModal(true);
    db.logUserEvent('schools_pricing_viewed', { plan_id: planId });
  };

  // State for form inputs (Pre-filled from localStorage if available)
  const [academyName, setAcademyName] = useState(() => typeof window !== 'undefined' ? localStorage.getItem('chekki_academy_name') || '' : '');
  const [contactName, setContactName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState(() => typeof window !== 'undefined' ? localStorage.getItem('chekki_director_email') || '' : '');
  const [studentCount, setStudentCount] = useState('');
  const [bizRegNumber, setBizRegNumber] = useState('');
  const [copiedBank, setCopiedBank] = useState(false);

  const activePlan = PRICING_TIERS[selectedPlanId as keyof typeof PRICING_TIERS] || PRICING_TIERS.school_pro;

  const getPlanUnitPrice = (planId: string, cycle: 'monthly' | 'yearly') => {
    const tier = PRICING_TIERS[planId as keyof typeof PRICING_TIERS];
    if (!tier) return 0;
    return currency === 'KRW' ? tier[cycle].krw : tier[cycle].usd;
  };

  const formatPrice = (price: number) => {
    return currency === 'KRW' ? `₩${price.toLocaleString()}` : `$${price}`;
  };

  // Scroll-driven entrance motion — mirrors the pattern in src/Landing.tsx
  // (gsap.context + ScrollTrigger, power3.out, no bounce/overshoot per
  // DESIGN.md's motion rules) so this page doesn't invent a second motion
  // vocabulary. One-shot reveals only (toggleActions play-none-none-none),
  // fully skipped under prefers-reduced-motion.
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    if (reduceMotion) return;

    const ctx = gsap.context(() => {
      gsap.from('.hero-text', {
        y: 40,
        opacity: 0,
        duration: 1,
        stagger: 0.12,
        ease: 'power3.out',
      });
      gsap.from('.hero-mascot', {
        scale: 0.94,
        opacity: 0,
        duration: 1.1,
        delay: 0.15,
        ease: 'power3.out',
      });

      gsap.utils.toArray<HTMLElement>('.bento-card').forEach((el, i) => {
        gsap.from(el, {
          y: 32,
          opacity: 0,
          duration: 0.7,
          delay: (i % 3) * 0.08,
          ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 88%', toggleActions: 'play none none none' },
        });
      });

      gsap.utils.toArray<HTMLElement>('.pricing-card').forEach((el, i) => {
        gsap.from(el, {
          y: 28,
          opacity: 0,
          duration: 0.6,
          delay: (i % 4) * 0.06,
          ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 90%', toggleActions: 'play none none none' },
        });
      });

      gsap.from('.cta-reveal', {
        y: 24,
        opacity: 0,
        duration: 0.7,
        ease: 'power3.out',
        scrollTrigger: { trigger: '.cta-reveal', start: 'top 85%', toggleActions: 'play none none none' },
      });
    });

    return () => ctx.revert();
  }, [reduceMotion]);

  return (
    <div className={`min-h-dvh ${isNight ? 'bg-brand-dark text-zinc-100' : 'bg-slate-50 text-zinc-900'} font-sans transition-colors duration-200 relative overflow-hidden flex flex-col`}>
      {/* Background radial glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-orange-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-orange-500/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Navigation - Floating Island Pill */}
      <div className="fixed top-6 left-0 w-full z-50 flex justify-center px-4">
        <header className={`flex h-14 items-center gap-4 md:gap-8 px-6 backdrop-blur-2xl border rounded-full shadow-2xl transition-colors duration-500 ${
          isNight 
            ? 'bg-white/10 border-white/15 text-white shadow-black/40' 
            : 'bg-white/90 border-slate-200/90 text-slate-900 shadow-slate-200/60'
        }`}>
          {/* Logo */}
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              window.location.href = isKo ? '/?lang=ko' : '/?lang=en';
            }}
            className="flex items-center gap-2 shrink-0 hover:opacity-80 transition-opacity cursor-pointer"
            title={isKo ? '메인 랜딩페이지로 이동' : 'Back to Main Landing Page'}
          >
            <span className="font-extrabold text-lg tracking-tight">
              Chekki<span className="text-brand">AI</span>
            </span>
          </a>

          {/* Right Action Cluster */}
          <div className="hidden md:flex items-center gap-3">
            {/* KO / EN LANGUAGE TOGGLE */}
            <button
              type="button"
              onClick={handleLangToggle}
              className={`px-3 py-1 min-h-11 rounded-full text-xs font-bold border flex items-center gap-1.5 transition-[color,background-color,border-color,box-shadow,transform] cursor-pointer ${
                isNight 
                  ? 'bg-white/5 border-white/15 text-white/90 hover:bg-white/15' 
                  : 'bg-slate-100 border-slate-300 text-slate-800 hover:bg-slate-200'
              }`}
              title="Switch Language / 언어 변경"
            >
              <Globe size={14} weight="bold" className="text-brand" />
              <span>{language === 'ko' ? '한국어' : 'English'}</span>
            </button>

            {/* Sun / Moon Theme Toggle */}
            <button
              type="button"
              onClick={() => {
                const next = !isNight;
                setIsNight(next);
                if (typeof window !== 'undefined') {
                  localStorage.setItem('chekki_theme', next ? 'dark' : 'light');
                }
              }}
              className={`min-w-11 min-h-11 flex items-center justify-center rounded-full border transition-colors cursor-pointer ${
                isNight
                  ? 'border-white/10 hover:bg-white/10 text-white/70 hover:text-white'
                  : 'border-slate-300 hover:bg-slate-100 text-slate-700 hover:text-slate-900'
              }`}
              title="Toggle Light / Dark Mode"
              aria-label="Toggle light / dark mode"
            >
              {isNight ? <Sun size={16} weight="bold" /> : <Moon size={16} weight="bold" />}
            </button>

            <a
              href="/teacher"
              onClick={(e) => {
                e.preventDefault();
                window.location.href = '/teacher';
              }}
              className="group relative overflow-hidden items-center gap-2 px-4 py-1.5 bg-brand text-white font-bold rounded-full text-xs uppercase tracking-wider transition-transform duration-700 active:scale-[0.96] flex"
            >
              <span>{isKo ? '교사 포털 로그인' : 'Teacher Portal'}</span>
            </a>
          </div>

          {/* Mobile Hamburger Morph */}
          <button
            type="button"
            aria-label={mobileMenuOpen ? (isKo ? '메뉴 닫기' : 'Close menu') : (isKo ? '메뉴 열기' : 'Open menu')}
            aria-expanded={mobileMenuOpen}
            className={`md:hidden relative w-11 h-11 flex items-center justify-center rounded-full outline-none ${
              isNight ? 'bg-white/10 text-white' : 'bg-slate-200 text-slate-900'
            }`}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={18} weight="bold" /> : <List size={18} weight="bold" />}
          </button>
        </header>
      </div>

      {/* Mobile Menu Modal */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-black/90 backdrop-blur-3xl flex flex-col items-center justify-center">
          <nav className="flex flex-col items-center gap-6 text-xl font-bold text-white">
            <button
              type="button"
              onClick={handleLangToggle}
              className="px-4 py-2 rounded-full bg-brand text-white text-sm font-bold flex items-center gap-2 mb-4"
            >
              <Globe size={18} />
              <span>{isKo ? '언어 변경 (Current: 한국어)' : 'Switch Language (Current: English)'}</span>
            </button>
            <a
              href="/teacher"
              onClick={() => setMobileMenuOpen(false)}
              className="mt-4 px-8 py-3 rounded-full bg-brand text-white text-base font-bold shadow-lg"
            >
              {isKo ? '교사용 로그인' : 'Teacher Portal'}
            </a>
          </nav>
        </div>
      )}

      {/* --- HERO SECTION (TEXT ON LEFT, IMAGE ON RIGHT FOR TEACHER LANDING) --- */}
      <section className="relative px-6 pt-28 md:pt-36 pb-12 md:pb-16 max-w-7xl mx-auto w-full flex-1 flex flex-col md:flex-row items-center justify-between gap-10 md:gap-12">
        {/* Left: Text Side */}
        <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left w-full z-10">
          {/* Eyebrow */}
          <span className="hero-text text-[10px] sm:text-xs font-black text-orange-500 uppercase tracking-[0.25em] mb-4 block">
            {isKo ? '전국 어학원·영유 전용 스마트 자동 채점 & 학부모 리포트 플랫폼' : 'AUTOMATED ACADEMY GRADING & PARENT CARE'}
          </span>

          {/* Headline */}
          <h1 className={`hero-text font-display text-3xl sm:text-5xl md:text-5xl lg:text-6xl font-black tracking-tight leading-[1.08] mb-6 text-balance ${isNight ? 'text-white' : 'text-zinc-900'} break-keep`}>
            {isKo ? (
              <>숙제 채점, 학부모 안내. <span className="text-orange-500">모두 자동으로.</span></>
            ) : (
              <>Homework graded. Parents updated. <span className="text-orange-500">Automatically.</span></>
            )}
          </h1>

          {/* Subtext */}
          <p className={`hero-text text-base sm:text-lg max-w-xl leading-relaxed mb-8 ${isNight ? 'text-zinc-400' : 'text-zinc-600'} break-keep`}>
            {isKo
              ? '정답지는 한 번만 등록하세요. 가정 숙제 스캔은 그 정답지 기준으로 자동 채점되고, 보강할 내용은 다음 수업 전에 미리 파악되며, 학부모 리포트까지 한 번에 정리됩니다.'
              : "Upload the week's answer key once, autograde every home scan against it, and know exactly what to reteach — before the parent report even goes out."}
          </p>

          {/* CTAs */}
          <div className="hero-text flex flex-col sm:flex-row gap-4 w-full sm:w-auto justify-center md:justify-start items-center">
            <button
              type="button"
              onClick={() => {
                sessionStorage.setItem('chekki_selected_plan', 'school_pro');
                sessionStorage.setItem('chekki_teacher_seats', '10');
                window.location.href = '/teacher?activate=true&role=director&plan=school_pro';
              }}
              className="w-full sm:w-auto px-8 py-4 bg-orange-500 hover:bg-orange-600 text-black font-black text-sm rounded-3xl shadow-lg shadow-orange-500/25 transition-[color,background-color,border-color,box-shadow,transform] active:scale-[0.97] flex items-center justify-center gap-2 group cursor-pointer"
            >
              <span>{isKo ? '⚡ 60초 무료 캠퍼스 구축 시작하기 →' : 'Start Free 60-Second Campus Setup →'}</span>
              <ArrowRight size={16} weight="bold" className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* Right: Teacher Mascot Image Side (Holding Laptop) */}
        <div className="hero-mascot flex-1 w-full flex justify-center items-center relative z-10 md:-translate-x-4">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[380px] md:max-w-[460px] aspect-square bg-orange-500/15 rounded-full blur-[90px] pointer-events-none" />
          <img
            src="https://res.cloudinary.com/dginphpy4/image/upload/e_background_removal,f_png/v1784647907/Chekki_Holding_Laptop_2_vhwcgy.jpg"
            alt="Chekki AI Mascot holding laptop"
            className="w-full max-w-[340px] sm:max-w-[400px] md:max-w-[460px] h-auto object-contain drop-shadow-[0_20px_50px_rgba(249,115,22,0.3)] relative z-10 hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        </div>
      </section>

      {/* --- CORE LOOP DIAGRAM: establishes the mental model --- */}
      <SchoolLoopDiagram isNight={isNight} isKo={isKo} />
      {/* Interactive live-preview widget removed — its 'syllabus' tab
          (NativeCurriculumPreseed) was demo-only marketing theater sitting
          under a "real components, not mockups" label that wasn't true for
          that tab, and promoted curriculum/syllabus scanning we've since
          disabled in the live app. Replaced by real screenshots in the bento
          cards below instead of an interactive tour. */}

      {/* --- BENTO GRID FEATURES --- */}
      <section className="py-16 md:py-24 px-4 md:px-8 max-w-7xl mx-auto w-full">
        <div className="mb-12 text-center">
          <h2 className={`font-display text-2xl sm:text-4xl font-black tracking-tight mb-4 ${isNight ? 'text-white' : 'text-zinc-900'}`}>
            {isKo ? '선생님의 대표적인 고충을 해결하는 AI 자동화 기능' : 'Solving Top Teacher Painpoints With AI Automation'}
          </h2>
          <p className={`text-sm md:text-base max-w-2xl mx-auto ${isNight ? 'text-zinc-400' : 'text-zinc-600'}`}>
            {isKo
              ? '카드마다 선생님의 고충과 채키의 명확한 해결책을 바로 확인하세요.'
              : 'Each card shows a teacher painpoint and exactly how Chekki solves it.'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Bento Cell 1: Curriculum Pre-seeding (Spans 2 columns) */}
          <div className={`bento-card md:col-span-2 p-6 md:p-8 border rounded-3xl flex flex-col justify-between transition-[color,background-color,border-color,box-shadow,transform] duration-500 ${
            isNight 
              ? 'bg-brand-dark border-white/10 hover:border-orange-500/50 hover:bg-brand-dark-elevated' 
              : 'bg-white border-zinc-200/90 hover:border-orange-500/50 hover:bg-orange-50/40 shadow-sm'
          } group relative overflow-hidden cursor-pointer min-h-[280px]`}>
            <div>
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500 mb-4">
                <GraduationCap size={20} weight="bold" />
              </div>

              <div className="space-y-3 relative z-10 max-w-2xl">
                <div>
                  <span className="text-[10px] font-bold text-orange-500 uppercase tracking-widest block mb-1">Teacher Painpoint</span>
                  <h3 className={`font-display text-lg md:text-xl font-black mb-2 ${isNight ? 'text-white' : 'text-zinc-900'}`}>
                    {isKo
                      ? '"매일 학생별 정답지를 손으로 채점하느라 밤늦게까지 남으시나요?"'
                      : '"Grading every student\'s notebook by hand, every single night?"'}
                  </h3>
                  <p className={`text-xs md:text-sm leading-relaxed ${isNight ? 'text-zinc-400' : 'text-zinc-600'}`}>
                    {isKo
                      ? '숙제 채점에 매일 몇 시간씩 쓰는 대신, 수업 준비와 학생들에게 집중하세요.'
                      : 'Grading eats hours every week that could go toward lesson prep and actual teaching.'}
                  </p>
                </div>

                <div className={`pt-3 border-t ${isNight ? 'border-white/10' : 'border-zinc-100'}`}>
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block mb-1">Chekki Solution</span>
                  <h3 className={`font-display text-lg md:text-xl font-black mb-2 ${isNight ? 'text-orange-400' : 'text-orange-600'}`}>
                    {isKo ? '이번 주 숙제, 한 번만 업로드' : 'Upload This Week\'s Homework, Once'}
                  </h3>
                  <p className={`text-xs md:text-sm leading-relaxed ${isNight ? 'text-zinc-300' : 'text-zinc-700'}`}>
                    {isKo
                      ? '이번 주 숙제 사진 한 장이면 충분해요. AI가 정답지를 추출하고, 학생별 오답까지 자동으로 채점합니다.'
                      : "Snap a photo of this week's completed worksheet once. AI extracts the answer key and grades every student's scan against it automatically."}
                  </p>
                </div>
              </div>
            </div>

            <div className={`mt-6 pt-4 border-t ${isNight ? 'border-white/10' : 'border-zinc-100'} flex items-center gap-2 text-xs font-bold text-orange-500`}>
              <span>{isKo ? '한 번 업로드로 매주 반복되는 수기 채점 시간을 없애세요' : 'One upload replaces every week of hand-grading'}</span>
              <Sparkle size={12} weight="bold" />
            </div>
          </div>

          {/* Bento Cell 2: Roster approvals (1 column) */}
          <div className={`bento-card p-6 md:p-8 border rounded-3xl transition-[color,background-color,border-color,box-shadow,transform] duration-500 ${
            isNight
              ? 'bg-brand-dark border-white/10 hover:border-orange-500/50 hover:bg-brand-dark-elevated'
              : 'bg-white border-zinc-200/90 hover:border-orange-500/50 hover:bg-orange-50/40 shadow-sm'
          } group relative overflow-hidden cursor-pointer min-h-[280px]`}>
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500 mb-4">
              <Users size={20} weight="bold" />
            </div>

            <div className="space-y-3 relative z-10">
              <div>
                <span className="text-[10px] font-bold text-orange-500 uppercase tracking-widest block mb-1">Teacher Painpoint</span>
                <h3 className={`font-display text-lg font-black mb-2 ${isNight ? 'text-white' : 'text-zinc-900'}`}>
                  {isKo
                    ? '"매일 학생별 숙제 제출 여부를 일일이 확인하고 챙기느라 지치셨나요?"'
                    : '"Tired of chasing parents individually to track daily homework completion?"'}
                </h3>
              </div>

              <div className={`pt-3 border-t ${isNight ? 'border-white/10' : 'border-zinc-100'}`}>
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block mb-1">Chekki Solution</span>
                <h3 className={`font-display text-lg font-black mb-2 ${isNight ? 'text-orange-400' : 'text-orange-600'}`}>
                  {isKo ? '초대 링크로 가정 숙제 자동 연동' : 'Invite-Link Join & Auto-Sync'}
                </h3>
                <p className={`text-xs sm:text-sm leading-relaxed ${isNight ? 'text-zinc-300' : 'text-zinc-700'}`}>
                  {isKo
                    ? '학부모는 원장님이 보내주신 초대 링크만 누르면 끝. 집에서 스캔한 빨간 테두리 오답과 점수가 교사 대시보드로 실시간 자동 전송됩니다.'
                    : "Parents tap the invite link their academy sends — no typing required. Homework scans & mistake data silently sync straight to your teacher dashboard."}
                </p>
              </div>
            </div>
          </div>

          {/* Bento Cell 3: Analytics (1 column) */}
          <div className={`bento-card p-6 md:p-8 border rounded-3xl flex flex-col justify-between transition-[color,background-color,border-color,box-shadow,transform] duration-500 ${
            isNight 
              ? 'bg-brand-dark border-white/10 hover:border-orange-500/50 hover:bg-brand-dark-elevated' 
              : 'bg-white border-zinc-200/90 hover:border-orange-500/50 hover:bg-orange-50/40 shadow-sm'
          } group relative overflow-hidden cursor-pointer min-h-[280px]`}>
            <div>
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500 mb-4">
                <ChartBar size={20} weight="bold" />
              </div>

              <div className="space-y-3 relative z-10">
                <div>
                  <span className="text-[10px] font-bold text-orange-500 uppercase tracking-widest block mb-1">Teacher Painpoint</span>
                  <h3 className={`font-display text-lg font-black mb-2 ${isNight ? 'text-white' : 'text-zinc-900'}`}>
                    {isKo
                      ? '"아이들이 집에서 혼자 숙제할 때 어떤 파닉스와 단어에서 막히는지 파악하기 어려우셨나요?"'
                      : '"Blind to where students struggle during home practice until test day?"'}
                  </h3>
                </div>

                <div className={`pt-3 border-t ${isNight ? 'border-white/10' : 'border-zinc-100'}`}>
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block mb-1">Chekki Solution</span>
                  <h3 className={`font-display text-lg font-black mb-2 ${isNight ? 'text-orange-400' : 'text-orange-600'}`}>
                    {isKo ? '교실 밖 학습 진단 (Visibility Beyond Classroom)' : 'Visibility Beyond the Classroom'}
                  </h3>
                  <p className={`text-xs sm:text-sm leading-relaxed ${isNight ? 'text-zinc-300' : 'text-zinc-700'}`}>
                    {isKo
                      ? '가정 스캔 취약 데이터를 분석하여 다음 수업 시간에 보강해야 할 핵심 파닉스 규칙과 단어를 사전에 파악합니다.'
                      : 'Track home scan difficulty rates so you know the exact phonics rules and vocabulary items to reinforce in your next lesson.'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Bento Cell 4: Parent Sync (Spans 2 columns) */}
          <div className={`bento-card md:col-span-2 p-6 md:p-8 border rounded-3xl transition-[color,background-color,border-color,box-shadow,transform] duration-500 ${
            isNight 
              ? 'bg-brand-dark border-white/10 hover:border-pink-500/50 hover:bg-brand-dark-elevated' 
              : 'bg-white border-zinc-200/90 hover:border-orange-500/50 hover:bg-orange-50/40 shadow-sm'
          } group relative overflow-hidden cursor-pointer min-h-[280px]`}>
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500 mb-4">
              <Sparkle size={20} weight="bold" />
            </div>

            <div className="space-y-3 relative z-10">
              <div>
                <span className="text-[10px] font-bold text-orange-500 uppercase tracking-widest block mb-1">Teacher Painpoint</span>
                <h3 className={`font-display text-lg md:text-xl font-black mb-2 ${isNight ? 'text-white' : 'text-zinc-900'}`}>
                  {isKo
                    ? '"매일 저녁 학부모님께 보낼 리포트 쓰느라 퇴근이 늦으시나요?"'
                    : '"Staying late every day to write the parent update?"'}
                </h3>
              </div>

              <div className={`pt-3 border-t ${isNight ? 'border-white/10' : 'border-zinc-100'}`}>
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block mb-1">Chekki Solution</span>
                <h3 className={`font-display text-lg md:text-xl font-black mb-2 ${isNight ? 'text-orange-400' : 'text-orange-600'}`}>
                  {isKo ? '30초 기록, AI 초안, KT 검토 후 발송' : '30-Second Log, AI Draft, KT-Reviewed Send'}
                </h3>
                <p className={`text-xs md:text-sm leading-relaxed ${isNight ? 'text-zinc-300' : 'text-zinc-700'}`}>
                  {isKo
                    ? '교사는 하루 기록만 30초면 끝. AI가 한국어 리포트 초안을 작성하고, KT가 검토 후 학부모님께 전달합니다.'
                    : "Teacher logs the day in 30 seconds. AI drafts the Korean update, KT reviews it, then sends it on to parents."}
                </p>
              </div>
            </div>

            <div className={`pt-3 border-t ${isNight ? 'border-white/10' : 'border-zinc-100'} flex items-center gap-1.5 text-xs font-bold text-orange-500 mt-6`}>
              <CheckCircle size={14} weight="bold" />
              <span>{isKo ? '매일 밤 리포트 작성 시간을 없애세요' : 'No more writing parent updates every evening'}</span>
            </div>
          </div>
        </div>
      </section>

      {/* --- PRICING SECTION --- */}
      <section id="pricing" className={`py-20 px-4 md:px-8 max-w-7xl mx-auto w-full transition-colors ${isNight ? 'text-white' : 'text-zinc-900'}`}>
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-[10px] sm:text-xs font-black text-orange-500 uppercase tracking-[0.25em] mb-3 block">
            {isKo ? '합리적인 학원 요금 정책' : 'ACADEMY PRICING'}
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-black tracking-tight mb-4">
            {isKo ? '교사 수에 맞춘 합리적인 월정액 요금제' : 'Simple Monthly Teacher Tiers'}
          </h2>
          <p className={`text-sm leading-relaxed mb-8 ${isNight ? 'text-zinc-400' : 'text-zinc-600'}`}>
            {isKo 
              ? '추가 개설비 없이 복잡한 스캔 건수 제한 없는 월정액 플랜입니다. 연간 결제 시 20% 할인이 자동 적용됩니다.'
              : 'No hidden setup fees. Simple per-teacher monthly tiers. Save 20% when billed annually.'}
          </p>

          {/* Monthly / Yearly Billing Toggle with Theme Adaptation */}
          <div className={`inline-flex items-center p-1.5 border rounded-full shadow-inner mb-6 transition-colors ${
            isNight ? 'bg-brand-dark border-white/10' : 'bg-zinc-200/70 border-zinc-300/80'
          }`}>
            <button
              type="button"
              onClick={() => setBillingCycle('monthly')}
              className={`px-5 py-2 rounded-full text-xs font-bold transition-[color,background-color,border-color,box-shadow,transform] cursor-pointer ${
                billingCycle === 'monthly'
                  ? 'bg-orange-500 text-black shadow-md'
                  : isNight ? 'text-zinc-400 hover:text-white' : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              {isKo ? '월간 결제' : 'Monthly Billing'}
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle('yearly')}
              className={`px-5 py-2 rounded-full text-xs font-bold transition-[color,background-color,border-color,box-shadow,transform] flex items-center gap-1.5 cursor-pointer ${
                billingCycle === 'yearly'
                  ? 'bg-orange-500 text-black shadow-md'
                  : isNight ? 'text-zinc-400 hover:text-white' : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              <span>{isKo ? '연간 결제' : 'Yearly Billing'}</span>
              <span className="px-2 py-0.5 bg-emerald-500 text-black text-[9px] font-black uppercase rounded-full">
                {isKo ? '20% 할인' : 'Save 20%'}
              </span>
            </button>
          </div>


          {/* 14-Day Free Teacher Trial Banner with Theme Adaptation */}
          <div className={`max-w-2xl mx-auto p-4 border rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 text-left transition-colors ${
            isNight 
              ? 'bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-orange-500/10 border-orange-500/30' 
              : 'bg-gradient-to-r from-orange-50 via-amber-50 to-orange-50 border-orange-200 shadow-sm'
          }`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-500 flex items-center justify-center font-bold text-lg flex-shrink-0">
                <Gift size={20} weight="bold" />
              </div>
              <div>
                <h4 className={`text-sm font-black ${isNight ? 'text-white' : 'text-zinc-900'}`}>
                  {isKo ? '강사 1인 + 원생 30명 7일 무제한 무료 체험' : '7-Day FREE Trial (1 Teacher + Up to 30 Students)'}
                </h4>
                <p className={`text-xs ${isNight ? 'text-zinc-400' : 'text-zinc-600'}`}>
                  {isKo 
                    ? '신용카드 등록 없이 7일간 무료. 학부모는 Chekki 모바일 앱(무료) 다운로드 후 초대 링크로 연동됩니다.'
                    : 'No credit card required. 1 Teacher seat + 30 Students for 7 days. Parents download the free Chekki app to sync scans.'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => openPlanModal('trial', 1, 1)}
              className="w-full sm:w-auto px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-black font-black text-xs rounded-xl transition-[color,background-color,border-color,box-shadow,transform] shadow-md active:scale-[0.97] whitespace-nowrap cursor-pointer"
            >
              {isKo ? '지금 무료 시작하기' : 'Start Free Trial'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-7xl mx-auto items-stretch">
          {/* Card 1: Solo Tutor & Study Room (1 Seat) */}
          <div 
            onClick={() => openPlanModal('solo', 1, 1)}
            className={`pricing-card p-5 border rounded-3xl flex flex-col justify-between transition-[color,background-color,border-color,box-shadow,transform] cursor-pointer group ${
              isNight 
                ? 'bg-brand-dark border-white/10 hover:border-orange-500/50 hover:bg-zinc-900/30' 
                : 'bg-white border-zinc-200 hover:border-orange-500/50 hover:shadow-xl shadow-sm'
            }`}
          >
            <div>
              <div className="flex justify-between items-center mb-3">
                <span className="px-2.5 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black tracking-wider uppercase rounded-full">
                  {isKo ? '공부방 / 개인 교습소' : 'SOLO & STUDY ROOM'}
                </span>
              </div>
              <h3 className={`text-base font-black mb-1 ${isNight ? 'text-white' : 'text-zinc-900'}`}>
                {isKo ? '공부방 / 개인 교습소 (좌석 1개)' : 'Solo Tutor & Study Room (1 Seat)'}
              </h3>
              <div className="mb-3">
                <div className="flex items-baseline gap-1">
                  <span className={`font-display text-2xl font-black ${isNight ? 'text-white' : 'text-zinc-900'}`}>
                    {formatPrice(getPlanUnitPrice('solo', billingCycle))}
                  </span>
                  <span className={`text-[10px] font-bold ${isNight ? 'text-zinc-400' : 'text-zinc-500'}`}>
                    {isKo ? '/월' : '/month'}
                  </span>
                </div>
                {billingCycle === 'yearly' ? (
                  <p className="text-[10px] font-extrabold text-emerald-500 mt-1">
                    {isKo ? `연간 ${formatPrice(getPlanUnitPrice('solo', 'yearly') * 12)} (20% 할인)` : `Billed annually at ${formatPrice(getPlanUnitPrice('solo', 'yearly') * 12)}/yr`}
                  </p>
                ) : (
                  <p className={`text-[10px] font-bold mt-1 ${isNight ? 'text-zinc-500' : 'text-zinc-400'}`}>
                    {isKo ? '월간 정기 결제' : 'Billed monthly'}
                  </p>
                )}
              </div>
              <p className={`text-[11px] mb-4 leading-relaxed ${isNight ? 'text-zinc-400' : 'text-zinc-600'}`}>
                {isKo 
                  ? '1인 개인 튜터 및 공부방 선생님을 위한 알뜰형 패키지.' 
                  : 'Tailored for individual tutors, freelance teachers & home study rooms.'}
              </p>
              <ul className={`space-y-2.5 text-[11px] mb-5 border-t pt-3 ${isNight ? 'border-white/5 text-zinc-300' : 'border-zinc-100 text-zinc-700'}`}>
                <li className="flex items-center gap-1.5">
                  <CheckCircle size={14} weight="bold" className="text-emerald-500 flex-shrink-0" />
                  <span>{isKo ? '교사 계정 좌석 1개 (단독 관리)' : '1 Teacher Seat (Full Access)'}</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle size={14} weight="bold" className="text-emerald-500 flex-shrink-0" />
                  <span>{isKo ? '원생 최대 20명 관리' : 'Up to 20 Active Students'}</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle size={14} weight="bold" className="text-emerald-500 flex-shrink-0" />
                  <span>{isKo ? '한/영 이중언어 알림톡 자동 생성' : 'Bilingual KakaoTalk Generator'}</span>
                </li>
                <li className="flex items-center gap-1.5 font-bold text-orange-400">
                  <Sparkle size={14} weight="bold" className="flex-shrink-0" />
                  <span>{isKo ? '숙제 채점 & PDF 성적표' : 'Autograding & PDF Reports'}</span>
                </li>
              </ul>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                openPlanModal('solo', 1, 1);
              }}
              className={`w-full py-2.5 font-bold text-xs rounded-xl border text-center transition-[color,background-color,border-color,box-shadow,transform] active:scale-[0.98] cursor-pointer ${
                isNight 
                  ? 'bg-white/10 hover:bg-white/15 text-white border-white/10' 
                  : 'bg-zinc-900 hover:bg-zinc-800 text-white border-zinc-900 shadow-sm'
              }`}
            >
              {isKo ? '솔로 플랜 견적 요청' : 'Request a Quote'}
            </button>
          </div>

          {/* Card 2: Starter Academy Pack (3 Seats) */}
          <div 
            onClick={() => openPlanModal('starter', 3, 1)}
            className={`pricing-card p-5 border rounded-3xl flex flex-col justify-between transition-[color,background-color,border-color,box-shadow,transform] cursor-pointer group ${
              isNight 
                ? 'bg-brand-dark border-white/10 hover:border-orange-500/50 hover:bg-zinc-900/30' 
                : 'bg-white border-zinc-200 hover:border-orange-500/50 hover:shadow-xl shadow-sm'
            }`}
          >
            <div>
              <div className="flex justify-between items-center mb-3">
                <span className="px-2.5 py-1 bg-pink-500/10 border border-pink-500/20 text-pink-500 text-[10px] font-black tracking-wider uppercase rounded-full">
                  {isKo ? '스타터 패키지' : 'STARTER ACADEMY PACK'}
                </span>
              </div>
              <h3 className={`text-base font-black mb-1 ${isNight ? 'text-white' : 'text-zinc-900'}`}>
                {isKo ? '스타터 패키지 (소형 어학원)' : 'Starter Academy Pack'}
              </h3>
              <div className="mb-3">
                <div className="flex items-baseline gap-1">
                  <span className={`font-display text-2xl font-black ${isNight ? 'text-white' : 'text-zinc-900'}`}>
                    {formatPrice(getPlanUnitPrice('starter', billingCycle))}
                  </span>
                  <span className={`text-[10px] font-bold ${isNight ? 'text-zinc-400' : 'text-zinc-500'}`}>
                    {isKo ? '/월 (캠퍼스당)' : '/month per campus'}
                  </span>
                </div>
                {billingCycle === 'yearly' ? (
                  <p className="text-[10px] font-extrabold text-emerald-500 mt-1">
                    {isKo ? `연간 ${formatPrice(getPlanUnitPrice('starter', 'yearly') * 12)} (20% 할인)` : `Billed annually at ${formatPrice(getPlanUnitPrice('starter', 'yearly') * 12)}/yr`}
                  </p>
                ) : (
                  <p className={`text-[10px] font-bold mt-1 ${isNight ? 'text-zinc-500' : 'text-zinc-400'}`}>
                    {isKo ? '월간 정기 결제' : 'Billed monthly'}
                  </p>
                )}
              </div>
              <p className={`text-[11px] mb-4 leading-relaxed ${isNight ? 'text-zinc-400' : 'text-zinc-600'}`}>
                {isKo 
                  ? '원어민/한국인 교사 모바일 평가 폼 & 카카오톡 알림톡 자동 생성을 위한 소형 학원용 패키지.' 
                  : 'Streamlined teacher logs & KakaoTalk report generation for foreign & Korean teachers.'}
              </p>
              <ul className={`space-y-2.5 text-[11px] mb-5 border-t pt-3 ${isNight ? 'border-white/5 text-zinc-300' : 'border-zinc-100 text-zinc-700'}`}>
                <li className="flex items-center gap-1.5">
                  <CheckCircle size={14} weight="bold" className="text-emerald-500 flex-shrink-0" />
                  <span>{isKo ? '교사 계정 좌석 최대 3개 (원어민 1 + 한국인 2)' : 'Up to 3 Teacher Seats (1 FT + 2 KTs)'}</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle size={14} weight="bold" className="text-emerald-500 flex-shrink-0" />
                  <span>{isKo ? '30초 원어민 모바일 평가 폼' : '30-Second Foreign Teacher Log'}</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle size={14} weight="bold" className="text-emerald-500 flex-shrink-0" />
                  <span>{isKo ? '한/영 이중언어 알림톡 생성' : 'Bilingual KakaoTalk Script Generator'}</span>
                </li>
                <li className="flex items-center gap-1.5 font-bold text-orange-400">
                  <Sparkle size={14} weight="bold" className="flex-shrink-0" />
                  <span>{isKo ? '한국인 교사 편집 워크스페이스' : 'Live Editable Textarea for KT Review'}</span>
                </li>
              </ul>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                openPlanModal('starter', 3, 1);
              }}
              className={`w-full py-2.5 font-bold text-xs rounded-xl border text-center transition-[color,background-color,border-color,box-shadow,transform] active:scale-[0.98] cursor-pointer ${
                isNight 
                  ? 'bg-white/10 hover:bg-white/15 text-white border-white/10' 
                  : 'bg-zinc-900 hover:bg-zinc-800 text-white border-zinc-900 shadow-sm'
              }`}
            >
              {isKo ? '스타터 패키지 견적 요청' : 'Request a Quote'}
            </button>
          </div>

          {/* Card 3: Chekki School Pro (All-in-One Master Bundle) [MOST POPULAR] */}
          <div 
            onClick={() => openPlanModal('school_pro', 10, 1)}
            className={`pricing-card p-5 border rounded-3xl flex flex-col justify-between transition-[color,background-color,border-color,box-shadow,transform] relative scale-[1.02] cursor-pointer group ${
              isNight 
                ? 'bg-[#0a0705] border-orange-500/80 text-white shadow-2xl shadow-orange-500/10 hover:border-orange-500' 
                : 'bg-gradient-to-b from-orange-500/[0.08] to-white border-2 border-orange-500 text-zinc-900 shadow-xl hover:border-orange-600'
            }`}
          >
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-orange-500 text-black text-[9px] font-black tracking-widest uppercase rounded-full shadow-lg">
              {isKo ? 'MOST POPULAR' : 'MOST POPULAR'}
            </div>
            <div>
              <div className="flex justify-between items-center mb-3 pt-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-orange-500">
                  {isKo ? '통합 어학원 패키지' : 'ALL-IN-ONE SCHOOL PACKAGE'}
                </span>
              </div>
              <h3 className={`text-base font-black mb-1 ${isNight ? 'text-white' : 'text-zinc-900'}`}>
                {isKo ? '체키 마스터 스쿨 프로' : 'Chekki Master School Pro'}
              </h3>
              <div className="mb-3">
                <div className="flex items-baseline gap-1">
                  <span className={`font-display text-2xl font-black ${isNight ? 'text-white' : 'text-zinc-900'}`}>
                    {formatPrice(getPlanUnitPrice('school_pro', billingCycle))}
                  </span>
                  <span className={`text-[10px] font-bold ${isNight ? 'text-zinc-400' : 'text-zinc-500'}`}>
                    {isKo ? '/월 (캠퍼스당)' : '/month per campus'}
                  </span>
                </div>
                {billingCycle === 'yearly' ? (
                  <p className="text-[10px] font-extrabold text-emerald-500 mt-1">
                    {isKo ? `연간 ${formatPrice(getPlanUnitPrice('school_pro', 'yearly') * 12)} (20% 할인)` : `Billed annually at ${formatPrice(getPlanUnitPrice('school_pro', 'yearly') * 12)}/yr`}
                  </p>
                ) : (
                  <p className={`text-[10px] font-bold mt-1 ${isNight ? 'text-zinc-500' : 'text-zinc-400'}`}>
                    {isKo ? '월간 정기 결제' : 'Billed monthly'}
                  </p>
                )}
              </div>
              <p className={`text-[11px] mb-4 leading-relaxed ${isNight ? 'text-zinc-400' : 'text-zinc-600'}`}>
                {isKo 
                  ? '교재 목차 탑재, 정답지 기반 AI 채점 & 학부모 앱 연동까지 통합된 학원 풀 패키지.'
                  : 'Complete academy package featuring textbook pre-seeding, autograding & parent app sync.'}
              </p>
              <ul className={`space-y-2.5 text-[11px] mb-5 border-t pt-3 ${isNight ? 'border-white/10 text-zinc-300' : 'border-zinc-200 text-zinc-700'}`}>
                <li className="flex items-center gap-1.5">
                  <CheckCircle size={14} weight="bold" className="text-emerald-500 flex-shrink-0" />
                  <span>{isKo ? '교사 계정 좌석 최대 10개 & 학부모 무제한' : 'Up to 10 Teacher Seats & Unlimited Parents'}</span>
                </li>
                <li className="flex items-center gap-1.5 font-bold text-orange-500">
                  <Sparkle size={14} weight="bold" className="flex-shrink-0" />
                  <span>{isKo ? 'AI 학부모 리포트 생성 (강사 로그 → 검수 → 발송)' : 'AI Parent Report Generation (Teacher Log → Review → Send)'}</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle size={14} weight="bold" className="text-emerald-500 flex-shrink-0" />
                  <span>{isKo ? '1클릭 교재 목차 스캔 & 어휘 선제 탑재' : '1-Click Textbook Syllabus Pre-seeding'}</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle size={14} weight="bold" className="text-emerald-500 flex-shrink-0" />
                  <span>{isKo ? '매일 숙제 스캔 & 정답지 기반 AI 정밀 채점' : 'Daily Homework Scanning & Ground-Truth-Matched AI Grading'}</span>
                </li>
              </ul>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                openPlanModal('school_pro', 10, 1);
              }}
              className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-black font-bold text-xs rounded-xl text-center shadow-lg shadow-orange-500/20 transition-[color,background-color,border-color,box-shadow,transform] active:scale-[0.98] cursor-pointer"
            >
              {isKo ? '마스터 스쿨 프로 견적 요청' : 'Request a Quote'}
            </button>
          </div>

          {/* Card 4: Large Academy & Franchise (Enterprise) */}
          <div 
            onClick={() => openPlanModal('enterprise', 20, 10)}
            className={`pricing-card p-5 border rounded-3xl flex flex-col justify-between transition-[color,background-color,border-color,box-shadow,transform] cursor-pointer group ${
              isNight 
                ? 'bg-brand-dark border-white/10 hover:border-zinc-500/50 hover:bg-zinc-900/30'
                : 'bg-white border-zinc-200 hover:border-zinc-400/50 hover:shadow-xl shadow-sm'
            }`}
          >
            <div>
              <div className="flex justify-between items-center mb-3">
                <span className="px-2.5 py-1 bg-zinc-500/10 border border-zinc-500/20 text-zinc-400 text-[10px] font-black tracking-wider uppercase rounded-full">
                  {isKo ? '대형 학원 & 프랜차이즈' : 'LARGE ACADEMY & FRANCHISE'}
                </span>
              </div>
              <h3 className={`text-base font-black mb-1 ${isNight ? 'text-white' : 'text-zinc-900'}`}>
                {isKo ? '대형 학원 / 프랜차이즈' : 'Large Academy & Franchise'}
              </h3>
              <div className="mb-3">
                <div className="flex items-baseline gap-1">
                  <span className={`font-display text-2xl font-black ${isNight ? 'text-white' : 'text-zinc-900'}`}>
                    {formatPrice(getPlanUnitPrice('enterprise', billingCycle))}
                  </span>
                  <span className={`text-[10px] font-bold ${isNight ? 'text-zinc-400' : 'text-zinc-500'}`}>
                    {isKo ? '/월 (캠퍼스당)' : '/month per campus'}
                  </span>
                </div>
                {billingCycle === 'yearly' ? (
                  <p className="text-[10px] font-extrabold text-emerald-500 mt-1">
                    {isKo ? `연간 ${formatPrice(getPlanUnitPrice('enterprise', 'yearly') * 12)} (20% 할인)` : `Billed annually at ${formatPrice(getPlanUnitPrice('enterprise', 'yearly') * 12)}/yr`}
                  </p>
                ) : (
                  <p className={`text-[10px] font-bold mt-1 ${isNight ? 'text-zinc-500' : 'text-zinc-400'}`}>
                    {isKo ? '월간 정기 결제' : 'Billed monthly'}
                  </p>
                )}
              </div>
              <p className={`text-xs mb-5 leading-relaxed ${isNight ? 'text-zinc-400' : 'text-zinc-600'}`}>
                {isKo 
                  ? '여러 직영/가맹 캠퍼스를 보유하고 맞춤 LMS 및 원생 관리 API 연동이 필요한 대형 브랜드용.' 
                  : 'Tailored for large multi-branch campuses & franchise networks needing custom LMS & API sync.'}
              </p>
              <ul className={`space-y-2.5 text-xs mb-6 border-t pt-4 ${isNight ? 'border-white/5 text-zinc-300' : 'border-zinc-100 text-zinc-700'}`}>
                <li className="flex items-center gap-2">
                  <CheckCircle size={14} weight="bold" className="text-emerald-500 flex-shrink-0" />
                  <span>{isKo ? '무제한 교사 계정 & 다중 캠퍼스 솔루션' : 'Unlimited Teacher Seats & Multi-Campus'}</span>
                </li>
                <li className="flex items-center gap-2 font-bold text-orange-400">
                  <Sparkle size={14} weight="bold" className="flex-shrink-0" />
                  <span>{isKo ? '체키 스쿨 프로의 모든 기능 포함' : 'Includes Everything in Chekki School Pro'}</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={14} weight="bold" className="text-emerald-500 flex-shrink-0" />
                  <span>{isKo ? '학원 전용 LMS / 원생 관리 API 연동' : 'Custom LMS & Student Management API Sync'}</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={14} weight="bold" className="text-emerald-500 flex-shrink-0" />
                  <span>{isKo ? '전담 1:1 담당자 & 직통 핫라인 지원' : 'Dedicated Success Manager & Priority SLA'}</span>
                </li>
                <li className="flex items-center gap-2 font-bold text-orange-400">
                  <Sparkle size={14} weight="bold" className="flex-shrink-0" />
                  <span>{isKo ? '학원 전용 맞춤 브랜딩 앱 제작 옵션' : 'Custom Branded Parent Mobile App Option'}</span>
                </li>
              </ul>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                openPlanModal('enterprise', 20, 10);
              }}
              className={`w-full py-3 font-bold text-xs rounded-2xl text-center transition-[color,background-color,border-color,box-shadow,transform] active:scale-[0.98] shadow-md cursor-pointer ${
                isNight
                  ? 'bg-white/10 hover:bg-white/15 text-white border border-white/10'
                  : 'bg-zinc-900 hover:bg-zinc-800 text-white'
              }`}
            >
              {isKo ? '맞춤 요금 도입 문의' : 'Contact Enterprise Team'}
            </button>
          </div>
        </div>
      </section>

      {/* --- FAQ: OBJECTION HANDLING BEFORE THE FINAL CTA ---
          Reuses SCHOOL_FAQ_ITEMS (verbatim from FaqPage.tsx's teacher
          category) so a director evaluating the trial doesn't have to
          leave this page to find answers to the questions that actually
          block a decision (trial terms, AI grading trust, core sync
          mechanics) — those previously only lived on the separate /faq
          page. */}
      <section className="py-16 px-4 md:px-8 max-w-3xl mx-auto w-full">
        <div className="mb-10 text-center">
          <span className="text-[10px] sm:text-xs font-black text-orange-500 uppercase tracking-[0.25em] mb-3 block">
            {isKo ? '자주 묻는 질문' : 'FREQUENTLY ASKED'}
          </span>
          <h2 className={`font-display text-2xl sm:text-3xl font-black tracking-tight ${isNight ? 'text-white' : 'text-zinc-900'}`}>
            {isKo ? '도입 전, 원장님들이 가장 많이 묻는 질문' : 'What Directors Ask Before Signing Up'}
          </h2>
        </div>
        <div className="space-y-3">
          {SCHOOL_FAQ_ITEMS.map((faq) => {
            const isOpen = openFaqId === faq.id;
            return (
              <div
                key={faq.id}
                className={`border rounded-2xl transition-[color,background-color,border-color,box-shadow,transform] duration-300 overflow-hidden ${
                  isOpen
                    ? isNight ? 'bg-brand-dark-elevated border-orange-500/40 shadow-lg' : 'bg-orange-50/40 border-orange-200 shadow-md'
                    : isNight ? 'bg-brand-dark border-white/10 hover:border-white/20' : 'bg-white border-zinc-200 hover:border-zinc-300 shadow-sm'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setOpenFaqId(isOpen ? null : faq.id)}
                  aria-expanded={isOpen}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 cursor-pointer"
                >
                  <h3 className={`text-sm font-bold leading-snug ${isNight ? 'text-white' : 'text-zinc-900'}`}>
                    {isKo ? faq.questionKo : faq.questionEn}
                  </h3>
                  <CaretDown
                    size={16}
                    weight="bold"
                    className={`shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180 text-orange-500' : 'text-zinc-400'}`}
                  />
                </button>
                {isOpen && (
                  <div className={`px-5 pb-5 text-xs leading-relaxed border-t pt-3 ${isNight ? 'border-white/5 text-zinc-300' : 'border-zinc-200/80 text-zinc-700'}`}>
                    {isKo ? faq.answerKo : faq.answerEn}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* --- GET IN TOUCH & CONSULTATION SECTION --- */}
      <section id="talk-to-us" className={`cta-reveal py-20 px-6 max-w-4xl mx-auto w-full text-center rounded-3xl my-12 border transition-colors ${
        isNight ? 'bg-gradient-to-b from-zinc-950 to-brand-dark border-white/10' : 'bg-gradient-to-b from-orange-50/70 to-white border-zinc-200 shadow-md'
      }`}>
        <span className="text-[10px] sm:text-xs font-black text-orange-500 uppercase tracking-[0.25em] mb-3 block">
          {isKo ? '학원 도입 & 맞춤 상담' : 'CUSTOM ONBOARDING & CONSULTATION'}
        </span>
        <h2 className={`font-display text-2xl sm:text-4xl font-black tracking-tight mb-4 ${isNight ? 'text-white' : 'text-zinc-900'}`}>
          {isKo ? '우리 학원에 맞는 플랜과 세팅이 궁금하신가요?' : 'Need Help Choosing the Right Academy Plan?'}
        </h2>
        <p className={`text-sm max-w-2xl mx-auto leading-relaxed mb-8 ${isNight ? 'text-zinc-400' : 'text-zinc-600'}`}>
          {isKo 
            ? 'ChekkiAI 전문 팀이 학원 규모 및 운영 방식에 맞춘 1:1 온보딩 상담과 청구서 발행을 도와드립니다.'
            : 'Get in touch with our operations team for a 1:1 onboarding consultation, custom multi-teacher setups, or bank invoice inquiries.'}
        </p>

        <div className="flex justify-center items-center">
          <button
            type="button"
            onClick={() => {
              setConsultationSubmitted(false);
              setShowConsultationModal(true);
            }}
            className="w-full sm:w-auto px-10 py-4 bg-orange-500 hover:bg-orange-600 text-black font-black text-sm rounded-2xl shadow-xl shadow-orange-500/20 transition-[color,background-color,border-color,box-shadow,transform] active:scale-[0.97] flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>{isKo ? '1:1 학원 맞춤 상담 신청하기' : 'Schedule 1:1 Consultation'}</span>
            <ArrowRight size={16} weight="bold" />
          </button>
        </div>
      </section>

      {/* --- 1:1 CONSULTATION MODAL FORM --- */}
      {showConsultationModal && (
        <div className="fixed inset-0 z-[450] flex items-center justify-center p-4 overflow-y-auto">
          <div 
            className={`fixed inset-0 backdrop-blur-md transition-opacity ${isNight ? 'bg-black/85' : 'bg-zinc-900/60'}`} 
            onClick={() => setShowConsultationModal(false)} 
          />
          <div
            ref={consultationDialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="consultation-modal-title"
            tabIndex={-1}
            className={`relative w-full max-w-lg p-1 border rounded-[2.5rem] shadow-2xl animate-fade-in text-left my-8 transition-colors ${
            isNight ? 'bg-white/5 border-white/10' : 'bg-white/90 border-zinc-200'
          }`}>
            <div className={`rounded-[calc(2.5rem-0.25rem)] p-6 sm:p-8 space-y-6 transition-colors ${
              isNight ? 'bg-brand-dark text-zinc-200' : 'bg-white text-zinc-900'
            }`}>
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-500 flex items-center justify-center font-bold text-lg">
                    <Envelope size={18} weight="bold" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-orange-500 font-mono">
                      {isKo ? '1:1 맞춤 온보딩 & 청구서 문의' : '1:1 CUSTOM CONSULTATION'}
                    </span>
                    <h3 id="consultation-modal-title" className={`text-lg sm:text-xl font-black ${isNight ? 'text-white' : 'text-zinc-900'}`}>
                      {isKo ? '학원 도입 1:1 맞춤 상담 신청' : 'Schedule 1:1 Consultation'}
                    </h3>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowConsultationModal(false)}
                  aria-label={isKo ? '상담 신청 닫기' : 'Close consultation form'}
                  className={`min-w-11 min-h-11 flex items-center justify-center rounded-full transition-[color,background-color,border-color,box-shadow,transform] cursor-pointer ${
                    isNight
                      ? 'text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10'
                      : 'text-zinc-400 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200'
                  }`}
                >
                  <X size={18} weight="bold" />
                </button>
              </div>

              {consultationSubmitted ? (
                <div className="py-8 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto text-2xl font-bold border border-emerald-500/30">
                    <CheckCircle size={32} weight="bold" />
                  </div>
                  <h4 className={`text-lg font-black ${isNight ? 'text-white' : 'text-zinc-900'}`}>
                    {isKo ? '상담 신청이 완료되었습니다!' : 'Consultation Request Sent!'}
                  </h4>
                  <p className={`text-xs max-w-sm mx-auto leading-relaxed ${isNight ? 'text-zinc-400' : 'text-zinc-600'}`}>
                    {isKo 
                      ? '24시간 이내에 입력하신 연락처/이메일로 담당자가 학원 맞춤 구축 가이드 및 상담을 진행해 드립니다.' 
                      : 'Our operations team will contact you within 24 hours via phone/email to guide your custom setup.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowConsultationModal(false)}
                    className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-black font-bold text-xs rounded-xl transition-[color,background-color,border-color,box-shadow,transform] shadow-md cursor-pointer"
                  >
                    {isKo ? '확인' : 'Close'}
                  </button>
                </div>
              ) : (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setIsSubmittingConsultation(true);
                    setConsultationError(false);
                    try {
                      const response = await fetch('/api/request-school-invoice', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          contactName,
                          academyName,
                          phone,
                          email,
                          consultationMessage,
                          type: '1:1-consultation',
                        }),
                      });
                      if (!response.ok) throw new Error(`Request failed with ${response.status}`);
                      db.logUserEvent('schools_consultation_submitted');
                      setConsultationSubmitted(true);
                    } catch (err) {
                      console.error('Consultation request failed:', err);
                      setConsultationError(true);
                    } finally {
                      setIsSubmittingConsultation(false);
                    }
                  }}
                  className="space-y-4 text-left"
                >
                  <p className={`text-xs leading-relaxed ${isNight ? 'text-zinc-400' : 'text-zinc-600'}`}>
                    {isKo
                      ? '원장님의 학원 명과 연락처를 입력해주시면 Chekki 운영팀에서 1:1 상담을 도와드립니다.'
                      : 'Please leave your contact info below. Our team will reach out to schedule your 1:1 session.'}
                  </p>

                  {consultationError && (
                    <div role="alert" className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400 flex items-center justify-between gap-3">
                      <span>
                        {isKo
                          ? '신청 접수에 실패했습니다. 다시 시도해주세요.'
                          : "Your request didn't go through. Please try again."}
                      </span>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label htmlFor="consult-contact-name" className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 font-mono">
                      {isKo ? '원장님 / 담당자 성함 *' : 'Contact Name *'}
                    </label>
                    <input
                      id="consult-contact-name"
                      type="text"
                      required
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      placeholder={isKo ? '예: 김원장' : 'E.g. Director Kim'}
                      className={`w-full p-3 rounded-xl border text-xs focus:outline-none focus:border-orange-500 transition-[color,background-color,border-color,box-shadow,transform] ${
                        isNight ? 'bg-brand-dark border-white/10 text-white' : 'bg-zinc-50 border-zinc-300 text-zinc-900'
                      }`}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="consult-academy-name" className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 font-mono">
                      {isKo ? '학원 / 어학원 명 *' : 'Academy Name *'}
                    </label>
                    <input
                      id="consult-academy-name"
                      type="text"
                      required
                      value={academyName}
                      onChange={(e) => setAcademyName(e.target.value)}
                      placeholder={isKo ? '예: 서초 에이펙스 어학원' : 'E.g. Apex Academy Seocho'}
                      className={`w-full p-3 rounded-xl border text-xs focus:outline-none focus:border-orange-500 transition-[color,background-color,border-color,box-shadow,transform] ${
                        isNight ? 'bg-brand-dark border-white/10 text-white' : 'bg-zinc-50 border-zinc-300 text-zinc-900'
                      }`}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label htmlFor="consult-phone" className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 font-mono">
                        {isKo ? '전화번호 *' : 'Phone Number *'}
                      </label>
                      <input
                        id="consult-phone"
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="010-0000-0000"
                        className={`w-full p-3 rounded-xl border text-xs focus:outline-none focus:border-orange-500 transition-[color,background-color,border-color,box-shadow,transform] ${
                          isNight ? 'bg-brand-dark border-white/10 text-white' : 'bg-zinc-50 border-zinc-300 text-zinc-900'
                        }`}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="consult-email" className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 font-mono">
                        {isKo ? '이메일 주소 *' : 'Email Address *'}
                      </label>
                      <input
                        id="consult-email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="director@academy.com"
                        className={`w-full p-3 rounded-xl border text-xs focus:outline-none focus:border-orange-500 transition-[color,background-color,border-color,box-shadow,transform] ${
                          isNight ? 'bg-brand-dark border-white/10 text-white' : 'bg-zinc-50 border-zinc-300 text-zinc-900'
                        }`}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="consult-message" className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 font-mono">
                      {isKo ? '문의 사항 및 요청 내용' : 'Message / Request Details'}
                    </label>
                    <textarea
                      id="consult-message"
                      rows={3}
                      value={consultationMessage}
                      onChange={(e) => setConsultationMessage(e.target.value)}
                      placeholder={isKo ? '예: 강사 5명, 원생 150명 규모 세팅 및 계좌이체 청구서 발행 문의' : 'E.g. 5 teachers, 150 students, bank invoice setup'}
                      className={`w-full p-3 rounded-xl border text-xs focus:outline-none focus:border-orange-500 transition-[color,background-color,border-color,box-shadow,transform] font-sans ${
                        isNight ? 'bg-brand-dark border-white/10 text-white' : 'bg-zinc-50 border-zinc-300 text-zinc-900'
                      }`}
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSubmittingConsultation}
                      className="w-full py-4 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-black font-bold text-xs rounded-xl shadow-lg shadow-orange-500/20 transition-[color,background-color,border-color,box-shadow,transform] cursor-pointer active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                      {isSubmittingConsultation ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <span>{isKo ? '1:1 상담 신청하기' : 'Submit Consultation Request'}</span>
                      )}
                    </button>
                    <p className="text-[10px] text-zinc-400 text-center mt-2 font-mono flex items-center justify-center gap-1">
                      <Envelope size={12} weight="bold" /> support@chekkiai.com
                    </p>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}



      {/* --- PRICING TIER DETAILS & BENEFITS MODAL --- */}
      {showPricingModal && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 overflow-y-auto">
          <div 
            className={`fixed inset-0 backdrop-blur-md transition-opacity ${isNight ? 'bg-black/85' : 'bg-zinc-900/60'}`} 
            onClick={() => setShowPricingModal(false)} 
          />
          <div
            ref={pricingDialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="pricing-modal-title"
            tabIndex={-1}
            className={`relative w-full max-w-2xl p-1 border rounded-[2.5rem] shadow-2xl animate-fade-in text-left my-8 transition-colors ${
            isNight ? 'bg-white/5 border-white/10' : 'bg-white/90 border-zinc-200'
          }`}>
            <div className={`rounded-[calc(2.5rem-0.25rem)] p-6 sm:p-8 space-y-6 transition-colors ${
              isNight ? 'bg-brand-dark text-zinc-200' : 'bg-white text-zinc-900'
            }`}>
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-500 flex items-center justify-center font-bold text-xl">
                    <Lightning size={22} weight="bold" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-orange-500 font-mono">
                      {isKo ? '요금제 상세 스펙 & 핵심 기능 안내' : 'PLAN SPECIFICATIONS & INCLUDED FEATURES'}
                    </span>
                    <h3 id="pricing-modal-title" className={`text-xl sm:text-2xl font-black ${isNight ? 'text-white' : 'text-zinc-900'}`}>
                      {isKo ? activePlan.nameKo : activePlan.nameEn}
                    </h3>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPricingModal(false)}
                  aria-label={isKo ? '요금제 상세 닫기' : 'Close plan details'}
                  className={`min-w-11 min-h-11 flex items-center justify-center rounded-full transition-[color,background-color,border-color,box-shadow,transform] active:scale-[0.95] cursor-pointer ${
                    isNight
                      ? 'text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10'
                      : 'text-zinc-400 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200'
                  }`}
                >
                  <X size={18} weight="bold" />
                </button>
              </div>

              {/* Price & Seats Overview */}
              <div className={`p-4 sm:p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                isNight ? 'bg-brand-dark border-white/10' : 'bg-orange-50/50 border-orange-200'
              }`}>
                <div>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block font-mono">
                    {isKo ? '구독 금액 (월/연간 선택 가능)' : 'Subscription Rate'}
                  </span>
                  <p className="text-2xl sm:text-3xl font-black text-orange-500 font-display">
                    {formatPrice(getPlanUnitPrice(selectedPlanId, billingCycle))}
                    <span className="text-xs font-normal text-zinc-400"> {billingCycle === 'yearly' ? (isKo ? '/월 (연간 20% 할인)' : '/mo (billed annually)') : (isKo ? '/월' : '/month')}</span>
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-orange-500/20 text-orange-400 font-bold text-xs rounded-xl border border-orange-500/30 self-start">
                    FT {activePlan.seats.ft} / KT {activePlan.seats.kt} {isKo ? '좌석' : 'Seats'}
                  </span>
                  <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 font-bold text-xs rounded-xl border border-emerald-500/30 self-start">
                    {selectedPlanId === 'solo' ? (isKo ? '원생 20명 포함' : '20 Students') : (isKo ? '무제한 원생 수용' : 'Unlimited Students')}
                  </span>
                </div>
              </div>

              {/* Comprehensive Feature Grid Specs */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 font-mono">
                  {isKo ? '📋 학원에 제공되는 전용 AI 도구 및 서비스 목록:' : '📋 Included AI Tools & Operations Package:'}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  <div className={`p-3 rounded-xl border ${isNight ? 'bg-white/5 border-white/5' : 'bg-zinc-50 border-zinc-200'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle size={16} weight="bold" className="text-emerald-400 shrink-0" />
                      <p className={`font-bold ${isNight ? 'text-white' : 'text-zinc-900'}`}>{isKo ? '종이 워크시트 AI 채점기' : 'Paper Worksheet AI Autograder'}</p>
                    </div>
                    <p className={`text-[11px] leading-relaxed ${isNight ? 'text-zinc-400' : 'text-zinc-600'}`}>
                      {isKo ? '카메라 촬영 시 정답지 기반 그린 잉크 오버레이 자동 생성' : 'Instant camera capture with ground-truth-matched green ink score overlay generation'}
                    </p>
                  </div>

                  <div className={`p-3 rounded-xl border ${isNight ? 'bg-white/5 border-white/5' : 'bg-zinc-50 border-zinc-200'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle size={16} weight="bold" className="text-emerald-400 shrink-0" />
                      <p className={`font-bold ${isNight ? 'text-white' : 'text-zinc-900'}`}>{isKo ? '교재 목차 Scope Pre-seeder' : 'Syllabus Scope Pre-seeder'}</p>
                    </div>
                    <p className={`text-[11px] leading-relaxed ${isNight ? 'text-zinc-400' : 'text-zinc-600'}`}>
                      {isKo ? '시중 영어 교재 수록 어휘 및 파닉스 범위를 학급별 선제 탑재' : 'Pre-populates multi-week textbook vocabulary & phonics target lists'}
                    </p>
                  </div>

                  <div className={`p-3 rounded-xl border ${isNight ? 'bg-white/5 border-white/5' : 'bg-zinc-50 border-zinc-200'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle size={16} weight="bold" className="text-emerald-400 shrink-0" />
                      <p className={`font-bold ${isNight ? 'text-white' : 'text-zinc-900'}`}>{isKo ? 'KT 카카오 알림톡 대본 1클릭 복사' : 'Bilingual KakaoTalk Comment Generator'}</p>
                    </div>
                    <p className={`text-[11px] leading-relaxed ${isNight ? 'text-zinc-400' : 'text-zinc-600'}`}>
                      {isKo ? '원어민 30초 로그 ➔ 한국인 교사 분할 화면 검수 & 카톡 1클릭 전송' : 'Turns 30-sec native teacher logs into split-screen Korean parent updates'}
                    </p>
                  </div>

                  <div className={`p-3 rounded-xl border ${isNight ? 'bg-white/5 border-white/5' : 'bg-zinc-50 border-zinc-200'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle size={16} weight="bold" className="text-emerald-400 shrink-0" />
                      <p className={`font-bold ${isNight ? 'text-white' : 'text-zinc-900'}`}>{isKo ? '원장님 통합 관제 HQ 포털' : 'Director Central HQ Portal'}</p>
                    </div>
                    <p className={`text-[11px] leading-relaxed ${isNight ? 'text-zinc-400' : 'text-zinc-600'}`}>
                      {isKo ? '교사 초청 링크 1클릭 발급, 반별 출석 & 수업 보고 실시간 통계' : '1-click staff invite link generator, class attendance & real-time analytics'}
                    </p>
                  </div>

                  <div className={`p-3 rounded-xl border ${isNight ? 'bg-white/5 border-white/5' : 'bg-zinc-50 border-zinc-200'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle size={16} weight="bold" className="text-emerald-400 shrink-0" />
                      <p className={`font-bold ${isNight ? 'text-white' : 'text-zinc-900'}`}>{isKo ? '학부모 전용 모바일 앱 100% 무료' : 'FREE Parent Mobile App Included'}</p>
                    </div>
                    <p className={`text-[11px] leading-relaxed ${isNight ? 'text-zinc-400' : 'text-zinc-600'}`}>
                      {isKo ? '학부모님 추가 요금 없이 1초 성적 확인 앱 무료 제공' : 'Zero cost for parents to view digital grade updates and monthly reports'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Security & Money Back Guarantee Badge */}
              <div className="flex items-center justify-between text-[11px] text-zinc-400 border-t border-white/10 pt-3">
                <span className="flex items-center gap-1 font-bold text-emerald-400">
                  <ShieldCheck size={14} weight="bold" />
                  {isKo ? '7일 이내 100% 전액 환불 보장' : '7-Day 100% Money-Back Guarantee'}
                </span>
                <span>{isKo ? '위약금 없음 • 언제든 해지 가능' : 'No hidden fees • Cancel anytime'}</span>
              </div>

              {/* Proceed to Free Setup First Action Button */}
              <button
                type="button"
                onClick={() => {
                  setShowPricingModal(false);
                  sessionStorage.setItem('chekki_selected_plan', selectedPlanId);
                  sessionStorage.setItem('chekki_teacher_seats', activePlan.defaultTeachers?.toString() || '10');
                  window.location.href = `/teacher?activate=true&role=director&plan=${encodeURIComponent(selectedPlanId)}`;
                }}
                className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-black font-black text-sm rounded-2xl shadow-xl shadow-orange-500/25 transition-[color,background-color,border-color,box-shadow,transform] flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
              >
                <span>{isKo ? `⚡ 60초 무료 캠퍼스 구축 시작하기 (${activePlan.nameKo} 전용) →` : `⚡ Start Free 60-Second Setup (${activePlan.nameEn}) →`}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- INSTANT PLAN CHECKOUT & PAYMENT MODAL --- */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 overflow-y-auto">
          <div 
            className={`fixed inset-0 backdrop-blur-md transition-opacity ${isNight ? 'bg-black/85' : 'bg-zinc-900/60'}`} 
            onClick={() => setShowPaymentModal(false)} 
          />
          <div
            ref={paymentDialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="payment-modal-title"
            tabIndex={-1}
            className={`relative w-full max-w-lg p-1 border rounded-[2.5rem] shadow-2xl animate-fade-in text-left my-8 transition-colors ${
            isNight ? 'bg-white/5 border-white/10' : 'bg-white/90 border-zinc-200'
          }`}>
            <div className={`rounded-[calc(2.5rem-0.25rem)] p-6 sm:p-8 space-y-6 transition-colors ${
              isNight ? 'bg-brand-dark text-zinc-200' : 'bg-white text-zinc-900'
            }`}>
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-500 flex items-center justify-center font-bold text-lg">
                    <CreditCard size={18} weight="bold" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-orange-500 font-mono">
                      {isKo ? '견적 요청 & 계좌이체 안내' : 'REQUEST A QUOTE'}
                    </span>
                    <h3 id="payment-modal-title" className={`text-xl font-black ${isNight ? 'text-white' : 'text-zinc-900'}`}>
                      {isKo ? `${activePlan.nameKo} 견적 요청` : `Get a Quote — ${activePlan.nameEn}`}
                    </h3>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  aria-label={isKo ? '견적 요청 창 닫기' : 'Close quote request'}
                  className={`min-w-11 min-h-11 flex items-center justify-center rounded-full transition-[color,background-color,border-color,box-shadow,transform] active:scale-[0.95] cursor-pointer ${
                    isNight
                      ? 'text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10'
                      : 'text-zinc-400 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200'
                  }`}
                >
                  <X size={18} weight="bold" />
                </button>
              </div>

              {/* Order Summary Box */}
              <div className={`p-4 rounded-2xl border ${isNight ? 'bg-brand-dark border-white/10' : 'bg-orange-50/50 border-orange-200'}`}>
                <div className="flex justify-between items-center text-xs pb-2 border-b border-white/10 mb-2">
                  <span className="text-zinc-400 font-bold">{isKo ? '선택한 플랜' : 'Selected Plan'}:</span>
                  <span className="font-bold text-orange-400">{isKo ? activePlan.nameKo : activePlan.nameEn}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-zinc-400">{isKo ? '최종 결제 금액' : 'Total Amount'}:</span>
                  <span className="text-2xl font-black text-emerald-400 font-mono">
                    {formatPrice(getPlanUnitPrice(selectedPlanId, billingCycle))}
                    <span className="text-xs font-normal text-zinc-400"> {billingCycle === 'yearly' ? '/월' : '/월'}</span>
                  </span>
                </div>
              </div>

              {/* Payment Method Selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block font-mono">
                  {isKo ? '결제 수단 선택 (현재 계좌이체/세금계산서 지원) *' : 'Select Payment Method *'}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('bank')}
                    className={`p-3 rounded-xl border text-xs font-bold transition-[color,background-color,border-color,box-shadow,transform] flex items-center justify-center gap-2 cursor-pointer border-emerald-500 bg-emerald-500/10 text-emerald-400 shadow-md col-span-2`}
                  >
                    <Bank size={14} weight="bold" /> {isKo ? '계좌이체 / 전자세금계산서 청구 (공식)' : 'Corporate Bank Transfer & Tax Invoice'}
                  </button>
                  <button
                    type="button"
                    disabled
                    className="p-2.5 rounded-xl border text-[11px] font-bold opacity-50 bg-white/5 border-white/10 text-zinc-400 flex items-center justify-center gap-1.5 cursor-not-allowed"
                  >
                    <CreditCard size={14} weight="bold" /> {isKo ? '신용카드 (출시 예정)' : 'Credit Card (Coming Soon)'}
                  </button>
                  <button
                    type="button"
                    disabled
                    className="p-2.5 rounded-xl border text-[11px] font-bold opacity-50 bg-white/5 border-white/10 text-zinc-400 flex items-center justify-center gap-1.5 cursor-not-allowed"
                  >
                    <Wallet size={14} weight="bold" /> {isKo ? '카카오페이 (출시 예정)' : 'KakaoPay (Coming Soon)'}
                  </button>
                </div>
              </div>

              {/* Payment Method Details & Fields */}
              <div className="space-y-3 text-xs">
                <div>
                  <label htmlFor="payment-academy-name" className="text-[11px] font-bold text-zinc-400 block mb-1">
                    {isKo ? '학원 / 기관명 *' : 'Academy Name *'}
                  </label>
                  <input
                    id="payment-academy-name"
                    type="text"
                    required
                    value={academyName}
                    onChange={(e) => setAcademyName(e.target.value)}
                    placeholder={isKo ? '예: 대치 럭스 어학원' : 'E.g. Chekki Seocho Academy'}
                    className={`w-full p-3 rounded-xl border outline-none ${
                      isNight ? 'bg-brand-dark border-white/10 text-white' : 'bg-zinc-50 border-zinc-300 text-zinc-900'
                    }`}
                  />
                </div>
                <div>
                  <label htmlFor="payment-email" className="text-[11px] font-bold text-zinc-400 block mb-1">
                    {isKo ? '원장님 이메일 (결제 영수증 & 승인 안내) *' : 'Director Email *'}
                  </label>
                  <input
                    id="payment-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="director@academy.com"
                    className={`w-full p-3 rounded-xl border outline-none ${
                      isNight ? 'bg-brand-dark border-white/10 text-white' : 'bg-zinc-50 border-zinc-300 text-zinc-900'
                    }`}
                  />
                </div>

                {/* Specific Fields by Payment Type */}
                {paymentMethod === 'card' && (
                  <div className={`p-4 rounded-2xl border space-y-3 ${isNight ? 'bg-amber-500/10 border-amber-500/30' : 'bg-amber-50 border-amber-200'}`}>
                    <div className="flex items-center gap-2">
                      <span className="text-amber-400 text-lg">🔧</span>
                      <div>
                        <p className="text-xs font-bold text-amber-400">
                          {isKo ? '카드 결제 게이트웨이 연동 준비 중' : 'Card Payment Gateway — Coming Soon'}
                        </p>
                        <p className={`text-[11px] mt-0.5 ${isNight ? 'text-zinc-400' : 'text-zinc-600'}`}>
                          {isKo
                            ? '현재 카드 결제는 준비 중입니다. 아래 계좌이체 방법을 이용해 주시면 24시간 내 계정을 활성화해 드립니다.'
                            : 'Card payment integration is in progress. Please use bank transfer below — we will activate your account within 24 hours of confirming the deposit.'}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('bank')}
                      className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl transition-[color,background-color,border-color,box-shadow,transform] cursor-pointer"
                    >
                      {isKo ? '→ 계좌이체로 전환하기' : '→ Switch to Bank Transfer'}
                    </button>
                  </div>
                )}

                {(paymentMethod === 'kakaopay' || paymentMethod === 'tosspay') && (
                  <div className={`p-4 rounded-2xl border space-y-3 ${isNight ? 'bg-amber-500/10 border-amber-500/30' : 'bg-amber-50 border-amber-200'}`}>
                    <div className="flex items-center gap-2">
                      <span className="text-amber-400 text-lg">🔧</span>
                      <div>
                        <p className="text-xs font-bold text-amber-400">
                          {paymentMethod === 'kakaopay'
                            ? (isKo ? '카카오페이 연동 준비 중' : 'KakaoPay Integration — Coming Soon')
                            : (isKo ? '토스페이 연동 준비 중' : 'TossPay Integration — Coming Soon')}
                        </p>
                        <p className={`text-[11px] mt-0.5 ${isNight ? 'text-zinc-400' : 'text-zinc-600'}`}>
                          {isKo
                            ? '간편결제 연동을 준비 중입니다. 지금은 계좌이체를 이용해 주세요.'
                            : 'Digital payment integration is in progress. Please use bank transfer in the meantime.'}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('bank')}
                      className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl transition-[color,background-color,border-color,box-shadow,transform] cursor-pointer"
                    >
                      {isKo ? '→ 계좌이체로 전환하기' : '→ Switch to Bank Transfer'}
                    </button>
                  </div>
                )}

                {paymentMethod === 'bank' && (
                  <div className={`p-4 rounded-2xl border space-y-2.5 ${isNight ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-emerald-50 border-emerald-200'}`}>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 font-mono flex items-center gap-1">
                      <Bank size={14} /> 입금 계좌 및 세금계산서 청구 안내
                    </span>
                    <div className="text-[11px] space-y-1">
                      <p className={isNight ? 'text-zinc-300' : 'text-zinc-700'}>은행: <strong>신한은행 (Shinhan Bank)</strong></p>
                      <p className={isNight ? 'text-zinc-300' : 'text-zinc-700'}>예금주: <strong>BENJAMIN JASON</strong></p>
                      <div className="flex justify-between items-center pt-1 font-mono">
                        <strong className="text-base text-emerald-400">110-623-147138</strong>
                        <button
                          type="button"
                          onClick={async () => {
                            const ok = await copyToClipboard('110-623-147138');
                            if (ok) {
                              setCopiedBank(true);
                              setTimeout(() => setCopiedBank(false), 2000);
                            } else {
                              showToast({
                                type: 'error',
                                message: isKo ? '복사에 실패했습니다. 계좌번호를 직접 입력해주세요.' : 'Copy failed — please enter the account number manually.',
                              });
                            }
                          }}
                          className="px-2.5 py-1 bg-emerald-500 text-white font-bold text-[10px] rounded-lg cursor-pointer"
                        >
                          {copiedBank ? '복사됨!' : '계좌복사'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Complete Payment & Submit Request */}
              {paymentMethod === 'bank' && !paymentSuccess && paymentError && (
                <div role="alert" className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400 flex items-center justify-between gap-3 mb-3">
                  <span>
                    {isKo
                      ? '요청 접수에 실패했습니다. 다시 시도해주세요.'
                      : "Your request didn't go through. Please try again."}
                  </span>
                </div>
              )}
              {paymentMethod === 'bank' && !paymentSuccess && (
                <button
                  type="button"
                  disabled={isProcessingPayment}
                  onClick={async () => {
                    if (!academyName || !email) {
                      showToast({ type: 'error', message: isKo ? '학원명과 이메일을 입력해주세요.' : 'Please fill out your academy name and email.' });
                      return;
                    }
                    // Record the bank transfer request — account will be activated
                    // manually by ops team after confirming the deposit.
                    setIsProcessingPayment(true);
                    setPaymentError(false);
                    try {
                      const response = await fetch('/api/request-school-invoice', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          academyName,
                          contactName,
                          email,
                          phone,
                          planId: selectedPlanId,
                          planName: isKo ? activePlan.nameKo : activePlan.nameEn,
                          teacherCount: activePlan.defaultTeachers,
                          billingCycle,
                          type: 'bank-transfer',
                        }),
                      });
                      if (!response.ok) throw new Error(`Request failed with ${response.status}`);
                      setPaymentSuccess(true);
                      // Store pending (not active) state — ops team activates after deposit confirmed
                      sessionStorage.setItem('chekki_payment_pending', 'true');
                      sessionStorage.setItem('chekki_paid_school', academyName);
                    } catch (err) {
                      console.error('[Payment] Invoice request failed:', err);
                      setPaymentError(true);
                      showToast({
                        type: 'error',
                        message: isKo
                          ? '요청 전송에 실패했습니다. 다시 시도하거나 support@chekkiai.com으로 문의해 주세요.'
                          : 'Failed to submit your request. Please try again or contact support@chekkiai.com.',
                      });
                    } finally {
                      setIsProcessingPayment(false);
                    }
                  }}
                  className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-black text-sm rounded-2xl shadow-xl shadow-emerald-500/25 transition-[color,background-color,border-color,box-shadow,transform] flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
                >
                  {isProcessingPayment ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>{isKo ? '요청 전송 중...' : 'Submitting request...'}</span>
                    </div>
                  ) : (
                    <span>📋 {isKo ? '계좌이체 신청 완료 & 입금 안내 받기 →' : 'Submit Bank Transfer Request →'}</span>
                  )}
                </button>
              )}

              {/* Pending Confirmation State (shown after bank transfer submission) */}
              {paymentSuccess && (
                <div className={`p-5 rounded-2xl border text-center space-y-3 ${
                  isNight ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-emerald-50 border-emerald-200'
                }`}>
                  <div className="text-3xl">⏳</div>
                  <h4 className={`text-base font-black ${isNight ? 'text-white' : 'text-zinc-900'}`}>
                    {isKo ? '계좌이체 신청이 완료되었습니다!' : 'Bank Transfer Request Submitted!'}
                  </h4>
                  <p className={`text-xs leading-relaxed max-w-sm mx-auto ${isNight ? 'text-zinc-400' : 'text-zinc-600'}`}>
                    {isKo
                      ? `입금 확인 후 영업일 기준 1-2일 내에 ${email} 주소로 계정 활성화 안내를 보내드립니다. 입금 전에는 대시보드에 접속되지 않습니다.`
                      : `Once we confirm your deposit, we'll send account activation instructions to ${email} within 1–2 business days. Your dashboard will not be accessible until payment is confirmed.`}
                  </p>
                  <p className={`text-[11px] font-mono font-bold ${isNight ? 'text-emerald-400' : 'text-emerald-700'}`}>
                    ✉️ support@chekkiai.com
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- FOOTER --- */}
      <footer className={`py-12 border-t ${isNight ? 'border-white/5 bg-black/30 text-zinc-400' : 'border-zinc-200 bg-white text-zinc-600'} px-6 transition-colors`}>
        <div className="max-w-7xl mx-auto flex flex-col gap-6 items-center text-center">
          {/* Business Info section for KC INCIS / PortOne Inspection */}
          <div className="text-xs space-y-1.5 font-medium max-w-3xl opacity-80">
            <p className="font-bold text-sm mb-1">
              {isKo ? '사업자 정보' : 'Business Information'}
            </p>
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-1.5 text-xs">
              <span><strong>{isKo ? '상호명:' : 'Company:'}</strong> 채키 AI (Chekki AI)</span>
              <span><strong>{isKo ? '대표자:' : 'Representative:'}</strong> Benjamin Jason</span>
              <span><strong>{isKo ? '사업자등록번호:' : 'Biz Reg No:'}</strong> 814-14-03096</span>
              <span><strong>{isKo ? '고객센터:' : 'Email:'}</strong> support@chekkiai.com</span>
            </div>
          </div>

          <div className="flex flex-wrap justify-center items-center gap-4 md:gap-6 text-xs font-black tracking-wider uppercase">
            <a
              href="/"
              onClick={(e) => {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'instant' });
                window.history.pushState({}, '', '/');
                window.dispatchEvent(new PopStateEvent('popstate'));
              }}
              className="hover:text-orange-500 transition-colors"
            >
              {isKo ? '메인 서비스' : 'Main Service'}
            </a>
            <span className={isNight ? 'text-zinc-800' : 'text-zinc-300'}>|</span>
            <a
              href="/teacher"
              onClick={(e) => {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'instant' });
                window.history.pushState({}, '', '/teacher');
                window.dispatchEvent(new PopStateEvent('popstate'));
              }}
              className="hover:text-orange-500 transition-colors"
            >
              {isKo ? '교사용 포털' : 'Teacher Portal'}
            </a>
            <span className={isNight ? 'text-zinc-800' : 'text-zinc-300'}>|</span>
            <a
              href="/faq"
              onClick={(e) => {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'instant' });
                window.history.pushState({}, '', '/faq');
                window.dispatchEvent(new PopStateEvent('popstate'));
              }}
              className="hover:text-orange-500 transition-colors"
            >
              {isKo ? '자주 묻는 질문 (FAQ)' : 'FAQ'}
            </a>
            <span className={isNight ? 'text-zinc-800' : 'text-zinc-300'}>|</span>
            <a
              href="/privacy"
              onClick={(e) => {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'instant' });
                window.history.pushState({}, '', '/privacy');
                window.dispatchEvent(new PopStateEvent('popstate'));
              }}
              className="hover:text-orange-500 transition-colors"
            >
              {isKo ? '개인정보처리방침' : 'Privacy Policy'}
            </a>
            <span className={isNight ? 'text-zinc-800' : 'text-zinc-300'}>|</span>
            <a
              href="/terms"
              onClick={(e) => {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'instant' });
                window.history.pushState({}, '', '/terms');
                window.dispatchEvent(new PopStateEvent('popstate'));
              }}
              className="hover:text-orange-500 transition-colors"
            >
              {isKo ? '이용약관' : 'Terms of Service'}
            </a>
            <span className={isNight ? 'text-zinc-800' : 'text-zinc-300'}>|</span>
            <a
              href="/refund"
              onClick={(e) => {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'instant' });
                window.history.pushState({}, '', '/refund');
                window.dispatchEvent(new PopStateEvent('popstate'));
              }}
              className="hover:text-orange-500 transition-colors"
            >
              {isKo ? '환불정책' : 'Refund Policy'}
            </a>
            <span className={isNight ? 'text-zinc-800' : 'text-zinc-300'}>|</span>
            <a
              href="/support"
              onClick={(e) => {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'instant' });
                window.history.pushState({}, '', '/support');
                window.dispatchEvent(new PopStateEvent('popstate'));
              }}
              className="hover:text-orange-500 transition-colors"
            >
              {isKo ? '고객지원' : 'Customer Support'}
            </a>
          </div>

          <p className="text-xs text-zinc-400 font-medium pt-2">
            © {new Date().getFullYear()} ChekkiAI. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default SchoolsLandingPage;
