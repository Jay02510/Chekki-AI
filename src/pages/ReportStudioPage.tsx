import React, { useState, useEffect, useCallback } from 'react';
import {
  Sparkle,
  Copy,
  CheckCircle,
  ArrowRight,
  Sun,
  Moon,
  Globe,
  FileText,
  UserCheck,
  Lightning,
  ShareNetwork,
  CaretLeft,
  CaretRight,
  ListChecks,
  WarningCircle,
  Clock,
  CurrencyCircleDollar,
  TrendUp,
  Buildings,
  X,
  PlayCircle,
  Play,
  Pause,
  MagnifyingGlassPlus,
  Slideshow,
  SquaresFour
} from '@phosphor-icons/react';
import { SAMPLE_REPORTS, SampleReport } from '../data/sampleReports';
import { REPORT_TRANSLATIONS } from '../data/reportTranslations';
import { NativeTeacherLogForm } from '../components/NativeTeacherLogForm';
import { NativeKtDashboard } from '../components/NativeKtDashboard';
import { NativeArchitecturePipeline } from '../components/NativeArchitecturePipeline';
import { NativeDirectorPortal } from '../components/NativeDirectorPortal';
import { NativeCurriculumPreseed } from '../components/NativeCurriculumPreseed';
import { ClassLogPayload, GeneratedReportOutput } from '../services/aiGenerator';
import { buildDemoReportOutput } from '../data/demoReportOutput';

interface SystemScreenshot {
  id: string;
  url: string;
  category: 'form' | 'automation' | 'database' | 'dashboard';
  titleEn: string;
  titleKo: string;
  subtitleEn: string;
  subtitleKo: string;
  descEn: string;
  descKo: string;
}

const SYSTEM_SCREENSHOTS: SystemScreenshot[] = [
  {
    id: 'native-hero-ui',
    url: '/images/report_studio_hero_ui.png',
    category: 'form',
    titleEn: 'Native FT Log & AI Script Workflow',
    titleKo: '원어민 평가 폼 & AI 알림톡 대본 워크플로우',
    subtitleEn: '<30s Mobile Input to Bilingual Script',
    subtitleKo: '30초 모바일 입력부터 이중언어 알림톡까지',
    descEn: 'Foreign teachers log daily class energy and activities on mobile, while Chekki AI generates bilingual parent KakaoTalk scripts instantly.',
    descKo: '원어민 강사가 모바일에서 30초 만에 수업 현황을 제출하면 Chekki AI가 한/영 이중언어 알림톡 대본을 즉시 작성합니다.'
  },
  {
    id: 'native-bento-features',
    url: '/images/report_studio_bento_features.png',
    category: 'dashboard',
    titleEn: '3-Stage Status & Phone Call Prep Drawer',
    titleKo: '3단계 검수 파이프라인 & 전화 상담 준비 드로어',
    subtitleEn: 'Human-in-the-Loop Review Pipeline',
    subtitleKo: '한국인 교사 수동 검수 및 1클릭 복사',
    descEn: 'Track report status from Pending to Sent. Flagged student exceptions open structured 3-part phone consultation talking points.',
    descKo: '검수대기 ➔ 수정완료 ➔ 발송완료 3단계 상태를 추적하고, 주의 필요 학생의 3단계 전화 상담 대본을 즉시 확인합니다.'
  }
];

interface Props {
  isNight?: boolean;
  setIsNight?: (val: boolean) => void;
}

export default function ReportStudioPage({ isNight = true, setIsNight }: Props) {
  const [lang, setLang] = useState<'ko' | 'en'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('chekki_lang');
      if (saved === 'en' || saved === 'ko') return saved;
    }
    return 'ko';
  });

  // Theme Persistence
  useEffect(() => {
    if (typeof window !== 'undefined' && setIsNight) {
      const savedTheme = localStorage.getItem('chekki_theme');
      if (savedTheme === 'light') {
        setIsNight(false);
      } else if (savedTheme === 'dark') {
        setIsNight(true);
      }
    }
  }, [setIsNight]);

  const handleLangToggle = () => {
    const next = lang === 'ko' ? 'en' : 'ko';
    setLang(next);
    if (typeof window !== 'undefined') {
      localStorage.setItem('chekki_lang', next);
    }
  };
  const [customAcademyName] = useState<string>('Apex English Academy (Seocho)');
  
  // Interactive Screenshots, Gallery & Lightbox State
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const [activeCarouselIdx, setActiveCarouselIdx] = useState<number>(0);
  const [galleryDisplayMode] = useState<'carousel' | 'grid'>('carousel');
  const [autoPlayCarousel] = useState<boolean>(false);

  // Native Engine Demo States
  const [nativeDemoTab, setNativeDemoTab] = useState<'ft-form' | 'kt-dashboard' | 'director-portal' | 'curriculum-preseed'>('ft-form');
  const [isSubmittingNativeLog, setIsSubmittingNativeLog] = useState(false);
  const [nativeOutput, setNativeOutput] = useState<GeneratedReportOutput | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const handleNativeLogSubmit = (payload: ClassLogPayload) => {
    setIsSubmittingNativeLog(true);
    // Canned, offline example output — no live AI call from this public page.
    setTimeout(() => {
      setNativeOutput(buildDemoReportOutput(payload));
      setNativeDemoTab('kt-dashboard');
      setIsSubmittingNativeLog(false);
    }, 600);
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  // Auto-play timer for Carousel mode
  useEffect(() => {
    if (!autoPlayCarousel || galleryDisplayMode !== 'carousel') return;
    const timer = setInterval(() => {
      setActiveCarouselIdx((prev) => (prev + 1) % SYSTEM_SCREENSHOTS.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [autoPlayCarousel, galleryDisplayMode]);

  // Lightbox keyboard navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (lightboxIdx !== null) {
      if (e.key === 'Escape') setLightboxIdx(null);
      if (e.key === 'ArrowRight') setLightboxIdx((prev) => (prev !== null ? (prev + 1) % SYSTEM_SCREENSHOTS.length : 0));
      if (e.key === 'ArrowLeft') setLightboxIdx((prev) => (prev !== null ? (prev - 1 + SYSTEM_SCREENSHOTS.length) % SYSTEM_SCREENSHOTS.length : 0));
    } else if (galleryDisplayMode === 'carousel') {
      if (e.key === 'ArrowRight') setActiveCarouselIdx((prev) => (prev + 1) % SYSTEM_SCREENSHOTS.length);
      if (e.key === 'ArrowLeft') setActiveCarouselIdx((prev) => (prev - 1 + SYSTEM_SCREENSHOTS.length) % SYSTEM_SCREENSHOTS.length);
    }
  }, [lightboxIdx, galleryDisplayMode]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // ROI Calculator State
  const [ftCount, setFtCount] = useState<number>(3);
  const [studentCount, setStudentCount] = useState<number>(100);

  const t = REPORT_TRANSLATIONS[lang];
  const isKo = lang === 'ko';
  const demoT = t.interactiveDemo;
  const activeReport = SAMPLE_REPORTS[0];

  // ROI Math
  const weeklyHoursSaved = Math.round(ftCount * 3.5);
  const hourlyRateKRW = 15000;
  const monthlyLaborSavingsKRW = weeklyHoursSaved * 4 * hourlyRateKRW;
  const annualLaborSavingsKRW = monthlyLaborSavingsKRW * 12;

  const handleCopyKakaoScript = () => {
    let scriptText = '';
    if (nativeOutput && nativeOutput.bilingualClassSummary) {
      scriptText = `[체키AI 학부모 알림톡 대본]\n\n${nativeOutput.bilingualClassSummary}`;
    } else {
      scriptText = `[체키AI 학부모 상담 대본]
학생: ${activeReport.studentNameKo} (${activeReport.studentNameEn}) - ${activeReport.gradeKo}
과목: ${activeReport.subject}
담당: ${activeReport.teacherName}

[1. 인사말]
${activeReport.parentScriptKo.greeting}

[2. 학습 성과]
${activeReport.parentScriptKo.academicProgress}

[3. 수업 태도]
${activeReport.parentScriptKo.behaviorAndAttitude}

[4. 가정 연계 지도]
${activeReport.parentScriptKo.actionItems}

[5. 맺음말]
${activeReport.parentScriptKo.closing}`.trim();
    }

    navigator.clipboard.writeText(scriptText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const openOnboardingModal = (planId: 'starter' | 'pro' | 'enterprise' = 'pro') => {

    if (typeof window !== 'undefined') {
      sessionStorage.setItem('chekki_selected_plan', planId === 'starter' ? 'starter' : planId === 'enterprise' ? 'enterprise' : 'school_pro');
      sessionStorage.setItem('chekki_teacher_seats', planId === 'starter' ? '3' : planId === 'enterprise' ? '20' : '10');
      window.location.href = '/teacher?activate=true';
    }
  };

  return (
    <div
      className={`min-h-screen ${
        isNight ? 'bg-[#030305] text-zinc-100' : 'bg-[#F8FAFC] text-zinc-900'
      } font-sans transition-colors duration-300 relative overflow-x-hidden flex flex-col`}
    >
      {/* Background Ambient Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-orange-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Floating Island Pill Navigation */}
      <div className="fixed top-6 left-0 w-full z-50 flex justify-center px-4">
        <header
          className={`flex h-14 items-center gap-4 md:gap-8 px-6 backdrop-blur-2xl border rounded-full shadow-2xl transition-all duration-300 ${
            isNight
              ? 'bg-white/10 border-white/15 text-white shadow-black/40'
              : 'bg-white/90 border-slate-200/90 text-slate-900 shadow-slate-200/60'
          }`}
        >
          {/* Logo - Matching exact landing page style without B2B badge */}
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              window.location.href = isKo ? '/?lang=ko' : '/?lang=en';
            }}
            className="flex items-center gap-2 shrink-0 hover:opacity-85 transition-opacity cursor-pointer"
            title={isKo ? '메인 랜딩페이지로 이동' : 'Back to Main Landing Page'}
          >
            <span className="font-extrabold text-lg tracking-tight">
              Chekki<span className="text-orange-500">AI</span>
            </span>
          </a>

          {/* Right Actions */}
          <div className="flex items-center gap-3 ml-auto">
            {/* Language Toggle */}
            <button
              type="button"
              onClick={handleLangToggle}
              className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 transition-all cursor-pointer ${
                isNight
                  ? 'bg-white/5 border-white/15 text-white/90 hover:bg-white/15'
                  : 'bg-slate-100 border-slate-300 text-slate-800 hover:bg-slate-200'
              }`}
            >
              <Globe size={14} weight="bold" className="text-orange-500" />
              <span>{t.nav.language}</span>
            </button>

            {/* Theme Toggle */}
            {setIsNight && (
              <button
                type="button"
                onClick={() => {
                  const next = !isNight;
                  setIsNight(next);
                  if (typeof window !== 'undefined') {
                    localStorage.setItem('chekki_theme', next ? 'dark' : 'light');
                  }
                }}
                className={`p-2 rounded-full border transition-colors cursor-pointer ${
                  isNight
                    ? 'border-white/10 hover:bg-white/10 text-white/70 hover:text-white'
                    : 'border-slate-300 hover:bg-slate-100 text-slate-700 hover:text-slate-900'
                }`}
                title="Toggle Theme"
              >
                {isNight ? <Sun size={16} weight="bold" /> : <Moon size={16} weight="bold" />}
              </button>
            )}

            {/* Single Unified Educator Portal Login Button */}
            <a
              href="/teacher"
              onClick={(e) => {
                e.preventDefault();
                window.location.href = '/teacher';
              }}
              className="px-4 py-1.5 rounded-full text-xs font-bold bg-orange-500 hover:bg-orange-600 text-white shadow-md shadow-orange-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span>{isKo ? '로그인' : 'Log In'}</span>
            </a>
          </div>
        </header>
      </div>

      {/* Main Content Workspace */}
      <main className="pt-28 md:pt-36 pb-20 max-w-7xl mx-auto w-full flex-1 flex flex-col space-y-24 px-4 md:px-8">
        
        {/* ========================================================================= */}
        {/* 1. HERO SECTION */}
        {/* ========================================================================= */}
        <section className="text-center max-w-4xl mx-auto space-y-6 pt-6">
          <h1 className="font-display text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.08] break-keep">
            {t.hero.headline}
          </h1>

          <p className={`text-base sm:text-lg max-w-2xl mx-auto leading-relaxed ${isNight ? 'text-zinc-400' : 'text-zinc-600'} break-keep`}>
            {t.hero.subheadline}
          </p>

          {/* Dual CTAs - Button-in-Button Architecture & Emil Kowalski Scale Physics */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <button
              type="button"
              onClick={() => openOnboardingModal('pro')}
              className="w-full sm:w-auto pl-7 pr-4 py-3.5 bg-orange-500 hover:bg-orange-600 text-white font-black text-sm rounded-full shadow-xl shadow-orange-500/25 transition-all duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.97] flex items-center justify-center gap-3 cursor-pointer group"
            >
              <span>{t.hero.primaryCta}</span>
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0 transition-transform duration-200 ease-out group-hover:translate-x-1">
                <ArrowRight size={14} weight="bold" />
              </div>
            </button>
            <a
              href="#interactive"
              className={`w-full sm:w-auto pl-7 pr-4 py-3.5 font-black text-sm rounded-full border transition-all duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.97] text-center flex items-center justify-center gap-3 group ${
                isNight
                  ? 'bg-white/5 border-white/10 hover:bg-white/10 text-white'
                  : 'bg-white border-zinc-300 hover:bg-zinc-50 text-zinc-900 shadow-sm'
              }`}
            >
              <span>{isKo ? '⚡ 1분 실시간 생성기 체험' : '⚡ Try Live Generator'}</span>
              <div className="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center shrink-0 transition-transform duration-200 ease-out group-hover:scale-110">
                <Sparkle size={18} weight="fill" className="text-orange-500" />
              </div>
            </a>
          </div>

          {/* Trust Badge */}
          <p className={`text-xs ${isNight ? 'text-zinc-500' : 'text-zinc-400'} pt-2 font-mono`}>
            🔒 {t.hero.badge}
          </p>
        </section>

        {/* ========================================================================= */}
        {/* 3. PAIN VS DREAM COMPARISON GRID (#features) */}
        {/* ========================================================================= */}
        <section id="features" className="space-y-12">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="font-display text-2xl sm:text-4xl font-black tracking-tight mb-4">
              {t.painVsDream.heading}
            </h2>
            <p className={`text-sm sm:text-base ${isNight ? 'text-zinc-400' : 'text-zinc-600'}`}>
              {t.painVsDream.subheading}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
            {/* Left: Traditional Bottlenecks */}
            <div
              className={`p-8 rounded-3xl border flex flex-col justify-between space-y-6 ${
                isNight ? 'bg-[#050505] border-red-500/20' : 'bg-red-50/40 border-red-200'
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center font-bold">
                    ⚠️
                  </div>
                  <div>
                    <h3 className={`font-black text-lg ${isNight ? 'text-white' : 'text-zinc-900'}`}>
                      {t.painVsDream.bottleneckTitle}
                    </h3>
                    <p className="text-xs text-red-500 font-bold">{t.painVsDream.bottleneckSubtitle}</p>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-red-500/10">
                  {t.painVsDream.bottleneckPoints.map((item, idx) => (
                    <div key={idx} className="space-y-1">
                      <h4 className="text-xs font-black text-red-400 flex items-center gap-2">
                        <span>❌</span> {item.title}
                      </h4>
                      <p className={`text-xs leading-relaxed ${isNight ? 'text-zinc-400' : 'text-zinc-600'}`}>
                        {item.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className={`p-4 rounded-2xl border text-xs font-bold text-red-400 ${isNight ? 'bg-red-500/10 border-red-500/20' : 'bg-red-100 border-red-200'}`}>
                {t.painVsDream.bottleneckAlert}
              </div>
            </div>

            {/* Right: ChekkiAI Automated Pipeline */}
            <div
              className={`p-8 rounded-3xl border flex flex-col justify-between space-y-6 ${
                isNight ? 'bg-[#060b07] border-emerald-500/30' : 'bg-emerald-50/40 border-emerald-200'
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                    ⚡
                  </div>
                  <div>
                    <h3 className={`font-black text-lg ${isNight ? 'text-white' : 'text-zinc-900'}`}>
                      {t.painVsDream.standardTitle}
                    </h3>
                    <p className="text-xs text-emerald-400 font-bold">{t.painVsDream.standardSubtitle}</p>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-emerald-500/10">
                  {t.painVsDream.standardPoints.map((item, idx) => (
                    <div key={idx} className="space-y-1">
                      <h4 className="text-xs font-black text-emerald-400 flex items-center gap-2">
                        <span>✅</span> {item.title}
                      </h4>
                      <p className={`text-xs leading-relaxed ${isNight ? 'text-zinc-300' : 'text-zinc-700'}`}>
                        {item.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className={`p-4 rounded-2xl border text-xs font-bold text-emerald-400 ${isNight ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-emerald-100 border-emerald-200'}`}>
                {t.painVsDream.standardResult}
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 4. INTERACTIVE REPORT GENERATOR DEMO WORKSPACE (#interactive) */}
        {/* ========================================================================= */}
        <section id="interactive" className="space-y-8 pt-8">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest block font-mono">
              UNIFIED NATIVE ENGINE DEMO
            </span>
            <h2 className="font-display text-2xl sm:text-4xl font-black tracking-tight">
              {demoT.heading}
            </h2>
            <p className={`text-sm sm:text-base ${isNight ? 'text-zinc-400' : 'text-zinc-600'}`}>
              {demoT.subheading}
            </p>

            {/* Guided Step-by-Step Interactive Onboarding Stepper Bar */}
            <div className="space-y-4 max-w-4xl mx-auto pt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-sans">
                {/* STEP 1 */}
                <button
                  type="button"
                  onClick={() => setNativeDemoTab('ft-form')}
                  className={`p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-2 ${
                    nativeDemoTab === 'ft-form'
                      ? 'bg-orange-500/15 border-orange-500 shadow-xl shadow-orange-500/10 scale-[1.02]'
                      : isNight
                      ? 'bg-white/5 border-white/10 hover:bg-white/10'
                      : 'bg-white border-zinc-200 hover:bg-zinc-50 shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-black uppercase ${
                      nativeDemoTab === 'ft-form' 
                        ? 'bg-orange-500 text-white' 
                        : isNight ? 'bg-white/10 text-zinc-400' : 'bg-zinc-200 text-zinc-700'
                    }`}>
                      STEP 01
                    </span>
                    <span className="text-xs">📱</span>
                  </div>
                  <h4 className={`font-bold text-xs sm:text-sm ${isNight ? 'text-white' : 'text-zinc-900'}`}>Foreign Teacher 30s Log</h4>
                  <p className={`text-[11px] leading-normal ${isNight ? 'text-zinc-400' : 'text-zinc-600'}`}>
                    {isKo ? '원어민 강사가 모바일에서 30초 만에 출석 및 이슈 제출' : 'FT submits quick 30s mobile checkmark log'}
                  </p>
                </button>

                {/* STEP 2 */}
                <button
                  type="button"
                  onClick={() => setNativeDemoTab('kt-dashboard')}
                  className={`p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-2 ${
                    nativeDemoTab === 'kt-dashboard'
                      ? 'bg-orange-500/15 border-orange-500 shadow-xl shadow-orange-500/10 scale-[1.02]'
                      : isNight
                      ? 'bg-white/5 border-white/10 hover:bg-white/10'
                      : 'bg-white border-zinc-200 hover:bg-zinc-50 shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-black uppercase ${
                      nativeDemoTab === 'kt-dashboard' 
                        ? 'bg-orange-500 text-white' 
                        : isNight ? 'bg-white/10 text-zinc-400' : 'bg-zinc-200 text-zinc-700'
                    }`}>
                      STEP 02
                    </span>
                    <span className="text-xs">⚡</span>
                  </div>
                  <h4 className={`font-bold text-xs sm:text-sm ${isNight ? 'text-white' : 'text-zinc-900'}`}>Bilingual KakaoTalk Generator</h4>
                  <p className={`text-[11px] leading-normal ${isNight ? 'text-zinc-400' : 'text-zinc-600'}`}>
                    {isKo ? 'AI가 원어민 메모를 정갈한 존댓말 알림톡으로 1초 변환' : 'AI turns notes into polite Korean honorific script'}
                  </p>
                </button>

                {/* STEP 3 */}
                <button
                  type="button"
                  onClick={() => setNativeDemoTab('director-portal')}
                  className={`p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-2 ${
                    nativeDemoTab === 'director-portal'
                      ? 'bg-orange-500/15 border-orange-500 shadow-xl shadow-orange-500/10 scale-[1.02]'
                      : isNight
                      ? 'bg-white/5 border-white/10 hover:bg-white/10'
                      : 'bg-white border-zinc-200 hover:bg-zinc-50 shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-black uppercase ${
                      nativeDemoTab === 'director-portal' 
                        ? 'bg-orange-500 text-white' 
                        : isNight ? 'bg-white/10 text-zinc-400' : 'bg-zinc-200 text-zinc-700'
                    }`}>
                      STEP 03
                    </span>
                    <span className="text-xs">🏢</span>
                  </div>
                  <h4 className={`font-bold text-xs sm:text-sm ${isNight ? 'text-white' : 'text-zinc-900'}`}>Director Admin Overview</h4>
                  <p className={`text-[11px] leading-normal ${isNight ? 'text-zinc-400' : 'text-zinc-600'}`}>
                    {isKo ? '원장님 전용 반별 인원 관리, 교사 배정 & 학생 이슈 총괄' : 'Campus oversight, rosters & flagged student exception tracking'}
                  </p>
                </button>
              </div>

              {/* Guided Onboarding Controls Bar */}
              <div className={`p-3.5 rounded-2xl border flex items-center justify-between text-xs font-mono ${
                isNight ? 'bg-white/[0.02] border-white/10' : 'bg-zinc-100 border-zinc-200'
              }`}>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                  <span className={`font-bold ${isNight ? 'text-zinc-300' : 'text-zinc-800'}`}>
                    {nativeDemoTab === 'ft-form' && (isKo ? '🎯 1단계: 원어민 모바일 작성 체험' : '🎯 Step 1: Submit sample 30s Foreign Teacher log below')}
                    {nativeDemoTab === 'kt-dashboard' && (isKo ? '⚡ 2단계: AI 알림톡 대본 검수 & 복사' : '⚡ Step 2: Review generated KakaoTalk script & 1-click copy')}
                    {nativeDemoTab === 'director-portal' && (isKo ? '🏢 3단계: 원장님 대시보드 총괄 관리 (Director Admin Overview)' : '🏢 Step 3: View Director Admin Overview & Student Rosters')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {nativeDemoTab !== 'ft-form' && (
                    <button
                      type="button"
                      onClick={() => setNativeDemoTab(nativeDemoTab === 'director-portal' ? 'kt-dashboard' : 'ft-form')}
                      className="px-3 py-1.5 rounded-xl border border-white/10 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                    >
                      ← {isKo ? '이전 단계' : 'Prev Step'}
                    </button>
                  )}
                  {nativeDemoTab !== 'director-portal' && (
                    <button
                      type="button"
                      onClick={() => setNativeDemoTab(nativeDemoTab === 'ft-form' ? 'kt-dashboard' : 'director-portal')}
                      className="px-3 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold transition-colors cursor-pointer flex items-center gap-1 shadow-md"
                    >
                      <span>{isKo ? '다음 단계' : 'Next Step'}</span>
                      <ArrowRight size={14} weight="bold" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Conditional View Rendering based on Native Demo Tab */}
          {nativeDemoTab === 'ft-form' && (
            <NativeTeacherLogForm
              isNight={isNight}
              onSubmitLog={(logData) => {
                handleNativeLogSubmit(logData);
                setNativeDemoTab('kt-dashboard');
              }}
              isSubmitting={isSubmittingNativeLog}
            />
          )}

          {nativeDemoTab === 'kt-dashboard' && (
            <NativeKtDashboard
              isNight={isNight}
              generatedOutput={nativeOutput}
              className="Apex Seocho 7A"
              academyName={customAcademyName}
            />
          )}

          {nativeDemoTab === 'director-portal' && (
            <NativeDirectorPortal
              isNight={isNight}
              academyName={customAcademyName}
            />
          )}

          {nativeDemoTab === 'curriculum-preseed' && (
            <NativeCurriculumPreseed
              isNight={isNight}
            />
          )}
        </section>

        {/* Sticky Mobile Copy Bar */}
        <div className="sm:hidden fixed bottom-4 left-4 right-4 z-40">
          <button
            type="button"
            onClick={handleCopyKakaoScript}
            className={`w-full py-3.5 px-6 rounded-2xl font-black text-xs flex items-center justify-center gap-2 shadow-2xl transition-all ${
              copied
                ? 'bg-emerald-600 text-white'
                : 'bg-orange-500 text-white shadow-orange-500/40 active:scale-95'
            }`}
          >
            {copied ? <CheckCircle size={18} weight="bold" /> : <Copy size={18} weight="bold" />}
            <span>{copied ? demoT.copiedText : demoT.copyScriptBtn}</span>
          </button>
        </div>



        {/* ========================================================================= */}
        {/* 5. DYNAMIC ROI & TIME SAVINGS CALCULATOR (#calculator) */}
        {/* ========================================================================= */}
        <section id="calculator" className="space-y-8 pt-8">
          <div className="text-center max-w-3xl mx-auto">
            <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest block font-mono mb-2">
              COST & TIME SAVINGS CALCULATOR
            </span>
            <h2 className="font-display text-2xl sm:text-4xl font-black tracking-tight mb-4">
              {t.calculator.heading}
            </h2>
            <p className={`text-sm sm:text-base ${isNight ? 'text-zinc-400' : 'text-zinc-600'}`}>
              {t.calculator.subheading}
            </p>
          </div>

          <div
            className={`p-8 md:p-10 rounded-3xl border grid grid-cols-1 lg:grid-cols-12 gap-8 items-center ${
              isNight ? 'bg-[#050505] border-white/10' : 'bg-white border-zinc-200 shadow-sm'
            }`}
          >
            {/* Controls (6 cols) */}
            <div className="lg:col-span-6 space-y-8">
              {/* FT Slider */}
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs font-bold font-mono">
                  <span>{t.calculator.foreignTeachersLabel}</span>
                  <span className="text-lg font-black text-orange-500">{ftCount} FTs</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={ftCount}
                  onChange={(e) => setFtCount(parseInt(e.target.value))}
                  className="w-full accent-orange-500 cursor-pointer"
                />
              </div>

              {/* Student Count Slider */}
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs font-bold font-mono">
                  <span>{t.calculator.studentCountLabel}</span>
                  <span className="text-lg font-black text-orange-500">{studentCount} Students</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="500"
                  step="10"
                  value={studentCount}
                  onChange={(e) => setStudentCount(parseInt(e.target.value))}
                  className="w-full accent-orange-500 cursor-pointer"
                />
              </div>

              <p className={`text-xs leading-relaxed ${isNight ? 'text-zinc-500' : 'text-zinc-400'} font-mono`}>
                ℹ️ {t.calculator.disclaimerText}
              </p>
            </div>

            {/* Calculated Output Display (6 cols) */}
            <div
              className={`lg:col-span-6 p-8 rounded-2xl border space-y-6 ${
                isNight ? 'bg-gradient-to-b from-orange-500/10 to-purple-900/10 border-orange-500/30' : 'bg-gradient-to-b from-orange-50 to-amber-50 border-orange-200'
              }`}
            >
              <div>
                <span className="text-[11px] font-bold text-orange-500 uppercase tracking-widest block mb-1 font-mono">
                  {t.calculator.weeklyTranslationHours}
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="font-display text-4xl sm:text-5xl font-black text-orange-500">
                    {weeklyHoursSaved}
                  </span>
                  <span className="text-xs font-bold text-zinc-400">{t.calculator.hoursUnit}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-orange-500/20">
                <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest block mb-1 font-mono">
                  {t.calculator.annualCostSavings}
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="font-display text-3xl sm:text-4xl font-black text-emerald-400">
                    ₩{annualLaborSavingsKRW.toLocaleString()}
                  </span>
                  <span className="text-xs font-bold text-zinc-400">/ year</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => openOnboardingModal('pro')}
                className="w-full py-3.5 bg-orange-500 hover:bg-orange-600 text-white font-black text-xs rounded-xl shadow-md transition-all cursor-pointer active:scale-95"
              >
                {t.calculator.ctaText}
              </button>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 5.5. PRICING TIERS SECTION (#pricing) */}
        {/* ========================================================================= */}
        <section id="pricing" className="space-y-8 pt-8">
          <div className="text-center max-w-3xl mx-auto">
            <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest block font-mono mb-2">
              {isKo ? '요금 안내' : 'ACADEMY PRICING'}
            </span>
            <h2 className="font-display text-2xl sm:text-4xl font-black tracking-tight mb-4">
              {t.pricing.heading}
            </h2>
            <p className={`text-sm sm:text-base ${isNight ? 'text-zinc-400' : 'text-zinc-600'}`}>
              {t.pricing.subheading}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 items-stretch">
            {/* Solo Plan */}
            <div
              className={`p-1.5 rounded-[2rem] border transition-all duration-300 ${
                isNight ? 'bg-white/5 border-white/10' : 'bg-black/5 border-zinc-200 shadow-sm'
              }`}
            >
              <div
                className={`p-5 rounded-[calc(2rem-0.375rem)] h-full flex flex-col justify-between space-y-4 ${
                  isNight ? 'bg-[#050505]' : 'bg-white'
                }`}
              >
                <div className="space-y-3">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-blue-400 block">
                    {t.pricing.soloTitle}
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className={`font-display text-3xl font-black ${isNight ? 'text-white' : 'text-zinc-900'}`}>
                      {t.pricing.soloPrice}
                    </span>
                    <span className="text-[10px] font-bold text-zinc-500">{t.pricing.soloPeriod}</span>
                  </div>
                  <p className={`text-[11px] leading-relaxed ${isNight ? 'text-zinc-400' : 'text-zinc-600'}`}>
                    {t.pricing.soloDesc}
                  </p>

                  <div className="space-y-2 pt-3 border-t border-white/5 text-[11px] font-medium">
                    {t.pricing.soloFeatures.map((feat, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <CheckCircle size={14} weight="bold" className="text-blue-400 shrink-0" />
                        <span className={isNight ? 'text-zinc-300' : 'text-zinc-700'}>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => openOnboardingModal('starter')}
                  className={`w-full py-3 rounded-2xl text-xs font-black transition-all cursor-pointer border ${
                    isNight
                      ? 'bg-white/5 border-white/10 hover:bg-white/10 text-white'
                      : 'bg-zinc-100 border-zinc-300 hover:bg-zinc-200 text-zinc-900'
                  }`}
                >
                  {t.pricing.soloCta}
                </button>
              </div>
            </div>

            {/* Starter Plan */}
            <div
              className={`p-1.5 rounded-[2rem] border transition-all duration-300 ${
                isNight ? 'bg-white/5 border-white/10' : 'bg-black/5 border-zinc-200 shadow-sm'
              }`}
            >
              <div
                className={`p-5 rounded-[calc(2rem-0.375rem)] h-full flex flex-col justify-between space-y-4 ${
                  isNight ? 'bg-[#050505]' : 'bg-white'
                }`}
              >
                <div className="space-y-3">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-pink-400 block">
                    {t.pricing.starterTitle}
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className={`font-display text-3xl font-black ${isNight ? 'text-white' : 'text-zinc-900'}`}>
                      {t.pricing.starterPrice}
                    </span>
                    <span className="text-[10px] font-bold text-zinc-500">{t.pricing.starterPeriod}</span>
                  </div>
                  <p className={`text-[11px] leading-relaxed ${isNight ? 'text-zinc-400' : 'text-zinc-600'}`}>
                    {t.pricing.starterDesc}
                  </p>

                  <div className="space-y-2 pt-3 border-t border-white/5 text-[11px] font-medium">
                    {t.pricing.starterFeatures.map((feat, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <CheckCircle size={14} weight="bold" className="text-orange-500 shrink-0" />
                        <span className={isNight ? 'text-zinc-300' : 'text-zinc-700'}>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => openOnboardingModal('starter')}
                  className={`w-full py-3 rounded-2xl text-xs font-black transition-all cursor-pointer border ${
                    isNight
                      ? 'bg-white/5 border-white/10 hover:bg-white/10 text-white'
                      : 'bg-zinc-100 border-zinc-300 hover:bg-zinc-200 text-zinc-900'
                  }`}
                >
                  {t.pricing.starterCta}
                </button>
              </div>
            </div>

            {/* Pro Plan (Featured) */}
            <div
              className={`p-1.5 rounded-[2rem] border relative transition-all duration-300 shadow-2xl ${
                isNight
                  ? 'bg-gradient-to-b from-orange-500/20 to-pink-500/20 border-orange-500/50 shadow-orange-500/10'
                  : 'bg-gradient-to-b from-orange-500/10 to-pink-500/10 border-orange-500 shadow-lg'
              }`}
            >
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-orange-500 to-pink-500 text-white text-[9px] font-black uppercase tracking-widest shadow-md">
                {t.pricing.proBadge}
              </div>

              <div
                className={`p-5 rounded-[calc(2rem-0.375rem)] h-full flex flex-col justify-between space-y-4 ${
                  isNight ? 'bg-[#0a080c]' : 'bg-white'
                }`}
              >
                <div className="space-y-3 pt-1">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-orange-500 block">
                    {t.pricing.proTitle}
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className="font-display text-3xl font-black text-orange-500">
                      {t.pricing.proPrice}
                    </span>
                    <span className="text-[10px] font-bold text-zinc-500">{t.pricing.proPeriod}</span>
                  </div>
                  <p className={`text-[11px] leading-relaxed ${isNight ? 'text-zinc-300' : 'text-zinc-600'}`}>
                    {t.pricing.proDesc}
                  </p>

                  <div className="space-y-2 pt-3 border-t border-orange-500/20 text-[11px] font-medium">
                    {t.pricing.proFeatures.map((feat, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <CheckCircle size={14} weight="fill" className="text-orange-500 shrink-0" />
                        <span className={`font-bold ${isNight ? 'text-zinc-100' : 'text-zinc-900'}`}>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => openOnboardingModal('pro')}
                  className="w-full py-3 rounded-2xl text-xs font-black transition-all cursor-pointer bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white shadow-xl shadow-orange-500/20 active:scale-[0.98]"
                >
                  {t.pricing.proCta}
                </button>
              </div>
            </div>

            {/* Enterprise Plan */}
            <div
              className={`p-1.5 rounded-[2rem] border transition-all duration-300 ${
                isNight ? 'bg-white/5 border-white/10' : 'bg-black/5 border-zinc-200 shadow-sm'
              }`}
            >
              <div
                className={`p-5 rounded-[calc(2rem-0.375rem)] h-full flex flex-col justify-between space-y-4 ${
                  isNight ? 'bg-[#050505]' : 'bg-white'
                }`}
              >
                <div className="space-y-3">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-purple-400 block">
                    {t.pricing.enterpriseTitle}
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className={`font-display text-3xl font-black ${isNight ? 'text-white' : 'text-zinc-900'}`}>
                      {t.pricing.enterprisePrice}
                    </span>
                    <span className="text-[10px] font-bold text-zinc-500">{t.pricing.enterprisePeriod}</span>
                  </div>
                  <p className={`text-[11px] leading-relaxed ${isNight ? 'text-zinc-400' : 'text-zinc-600'}`}>
                    {t.pricing.enterpriseDesc}
                  </p>

                  <div className="space-y-2 pt-3 border-t border-white/5 text-[11px] font-medium">
                    {t.pricing.enterpriseFeatures.map((feat, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <CheckCircle size={14} weight="bold" className="text-purple-400 shrink-0" />
                        <span className={isNight ? 'text-zinc-300' : 'text-zinc-700'}>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => openOnboardingModal('enterprise')}
                  className={`w-full py-3 rounded-2xl text-xs font-black transition-all cursor-pointer border ${
                    isNight
                      ? 'bg-purple-500/20 border-purple-500/30 hover:bg-purple-500/30 text-purple-300'
                      : 'bg-purple-50 border-purple-200 hover:bg-purple-100 text-purple-800'
                  }`}
                >
                  {t.pricing.enterpriseCta}
                </button>
              </div>
            </div>
          </div>
        </section>



      </main>

      {/* High-Resolution Multi-Slide System Screenshot Lightbox Inspector */}
      {/* High-Resolution Multi-Slide System Screenshot Lightbox Inspector */}
      {lightboxIdx !== null && (
        <div
          className="fixed inset-0 z-[500] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-4 md:p-8 animate-fadeIn cursor-pointer"
          onClick={() => setLightboxIdx(null)}
        >
          <div
            className="relative max-w-7xl w-full bg-zinc-950 border border-white/15 rounded-3xl overflow-hidden shadow-2xl space-y-4 p-4 md:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Lightbox Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-full bg-orange-500 text-white font-mono text-xs font-black">
                  {lightboxIdx + 1} / {SYSTEM_SCREENSHOTS.length}
                </span>
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-orange-400 block">
                    CHEKKIAI PRODUCTION SYSTEM INSPECTOR
                  </span>
                  <h3 className="text-base md:text-lg font-black text-white">
                    {isKo ? SYSTEM_SCREENSHOTS[lightboxIdx].titleKo : SYSTEM_SCREENSHOTS[lightboxIdx].titleEn}
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setLightboxIdx((prev) => (prev !== null ? (prev - 1 + SYSTEM_SCREENSHOTS.length) % SYSTEM_SCREENSHOTS.length : 0))}
                  className="p-2.5 rounded-full bg-white/10 hover:bg-orange-500 text-white transition-colors cursor-pointer"
                  title={isKo ? '이전 이미지 (Left Arrow)' : 'Previous Image'}
                >
                  <CaretLeft size={18} weight="bold" />
                </button>
                <button
                  type="button"
                  onClick={() => setLightboxIdx((prev) => (prev !== null ? (prev + 1) % SYSTEM_SCREENSHOTS.length : 0))}
                  className="p-2.5 rounded-full bg-white/10 hover:bg-orange-500 text-white transition-colors cursor-pointer"
                  title={isKo ? '다음 이미지 (Right Arrow)' : 'Next Image'}
                >
                  <CaretRight size={18} weight="bold" />
                </button>
                <button
                  type="button"
                  onClick={() => setLightboxIdx(null)}
                  className="p-2.5 rounded-full bg-white/10 hover:bg-red-500 text-white transition-colors cursor-pointer ml-2"
                  title={isKo ? '닫기 (Esc)' : 'Close'}
                >
                  <X size={18} weight="bold" />
                </button>
              </div>
            </div>

            {/* Lightbox Image Stage */}
            <div className="relative rounded-2xl overflow-hidden bg-black max-h-[72vh] flex items-center justify-center">
              <img
                src={SYSTEM_SCREENSHOTS[lightboxIdx].url}
                alt={SYSTEM_SCREENSHOTS[lightboxIdx].titleEn}
                className="max-h-[72vh] w-auto object-contain rounded-xl shadow-2xl"
              />
            </div>

            {/* Lightbox Footer Caption */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-2 border-t border-white/10">
              <p className="text-xs text-zinc-300 max-w-4xl leading-relaxed">
                <span className="text-orange-400 font-bold font-mono mr-2">
                  [{isKo ? SYSTEM_SCREENSHOTS[lightboxIdx].subtitleKo : SYSTEM_SCREENSHOTS[lightboxIdx].subtitleEn}]
                </span>
                {isKo ? SYSTEM_SCREENSHOTS[lightboxIdx].descKo : SYSTEM_SCREENSHOTS[lightboxIdx].descEn}
              </p>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
