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
import {
  generateGeneralClassSummary,
  generateStudentExceptionReport,
  generatePhoneConsultationPrep,
  ClassLogPayload,
  GeneratedReportOutput,
} from '../services/aiGenerator';

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
    descEn: 'Foreign teachers log daily class energy and activities on mobile, while Gemini 2.5 Flash AI generates bilingual parent KakaoTalk scripts instantly.',
    descKo: '원어민 강사가 모바일에서 30초 만에 수업 현황을 제출하면 Gemini AI가 한/영 이중언어 알림톡 대본을 즉시 작성합니다.'
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
  },
  {
    id: 'fillout-form',
    url: 'https://res.cloudinary.com/dec04iaht/image/upload/q_auto/f_auto/v1780757946/Screenshot_2026-06-03_at_5.35.38_PM_wywtjr.png',
    category: 'form',
    titleEn: 'FT Fillout Form',
    titleKo: 'FT Fillout 양식',
    subtitleEn: 'Dynamic Assessment Form',
    subtitleKo: '설문 취합 및 평가 템플릿',
    descEn: 'Foreign teachers log daily class observations, student engagement, and homework status in 45 seconds on mobile or laptop.',
    descKo: '원어민 교사가 모바일이나 노트북에서 45초 만에 일일 수업 평가, 학습 태도, 숙제 현황을 제출하는 스마트 폼입니다.'
  },
  {
    id: 'make-scenario-1',
    url: 'https://res.cloudinary.com/dec04iaht/image/upload/q_auto/f_auto/v1780757338/Screenshot_2026-06-06_at_11.10.34_PM_eij0wx.png',
    category: 'automation',
    titleEn: 'Make.com Report Generator Engine',
    titleKo: '성적 보고서 빌드 메커니즘 (Make.com)',
    subtitleEn: 'Report Generator Scenario',
    subtitleKo: 'Make.com 자동 생성 시나리오',
    descEn: 'Automated Make.com scenario triggers AI normalization instantly when FT submits logs.',
    descKo: '원어민 입력 제출 즉시 백엔드 Make.com 시나리오가 실행되어 AI 이중언어 보고서를 정교하게 생성합니다.'
  },
  {
    id: 'make-scenario-2',
    url: 'https://res.cloudinary.com/dec04iaht/image/upload/q_auto/f_auto/v1780757338/Screenshot_2026-06-06_at_11.13.31_PM_nkcfga.png',
    category: 'automation',
    titleEn: 'Make.com Consultation Router',
    titleKo: '대화형 분석 전송 오퍼레이터 (Make.com)',
    subtitleEn: 'Automated Consult Routing',
    subtitleKo: 'Make.com 상담 지원 워크플로우',
    descEn: 'Routes flagged student exception cases to counselors with ready-to-use phone scripts.',
    descKo: '학습 및 주의 필요 학생 이슈를 감지하여 상담 실장님께 맞춤 전화 대본을 자동으로 라우팅합니다.'
  },
  {
    id: 'airtable-db',
    url: 'https://res.cloudinary.com/dec04iaht/image/upload/q_auto/f_auto/v1780757340/Screenshot_2026-06-06_at_11.35.34_PM_susvx4.png',
    category: 'database',
    titleEn: 'Airtable Relational Database',
    titleKo: 'Airtable 데이터베이스',
    subtitleEn: 'Relational Database Backend',
    subtitleKo: '관계형 데이터 백엔드',
    descEn: 'Centralized database linking student records, teacher logs, and generated bilingual scripts.',
    descKo: '원생 정보, 강사 평가 기록, 생성된 이중언어 상담 대본이 안전하게 통합 관리되는 관계형 DB입니다.'
  },
  {
    id: 'softr-admin',
    url: 'https://res.cloudinary.com/dec04iaht/image/upload/q_auto/f_auto/v1780757340/Screenshot_2026-06-06_at_11.34.00_PM_atnp3r.png',
    category: 'dashboard',
    titleEn: 'Director Admin Portal (Softr)',
    titleKo: '원장 대시보드 오버뷰 (Softr)',
    subtitleEn: 'Softr Administration Portal',
    subtitleKo: 'Softr 최고 관리자 어드민 포털',
    descEn: 'High-level administration portal for directors to monitor all classes, FT logs, and report status.',
    descKo: '원장님이 전 학급 원어민 강사 코멘트 제출 현황 및 학부모 리포트를 한눈에 파악하는 통합 어드민 포털입니다.'
  },
  {
    id: 'kt-dashboard-main',
    url: 'https://res.cloudinary.com/dec04iaht/image/upload/q_auto/f_auto/v1780757340/Screenshot_2026-06-06_at_11.32.00_PM_tnqzky.png',
    category: 'dashboard',
    titleEn: 'Bilingual Parent Dashboard (Main)',
    titleKo: '학부모 대시보드 메인',
    subtitleEn: 'Bilingual Progress View',
    subtitleKo: '이중언어 맞춤 종합 도표',
    descEn: 'Parent-facing digital report showing student progress graphs and teacher evaluations.',
    descKo: '학부모님이 원생의 어휘 성취도 그래프와 이중언어 평가를 간편하게 확인하는 반응형 웹 대시보드입니다.'
  },
  {
    id: 'kt-dashboard-detail',
    url: 'https://res.cloudinary.com/dec04iaht/image/upload/q_auto/f_auto/v1780757340/Screenshot_2026-06-06_at_11.32.40_PM_frctym.png',
    category: 'dashboard',
    titleEn: 'Detailed Observation Report',
    titleKo: '학부모 대시보드 상세',
    subtitleEn: 'Detailed Observation Cards',
    subtitleKo: '정성 관찰 상세 리포트',
    descEn: 'Detailed qualitative observations detailing specific vocabulary items, behavior, and teacher advice.',
    descKo: '원생의 세부 타겟 어휘, 파닉스 완성도, 수업 태도 및 가정 연계 지침을 상세히 제공하는 리포트입니다.'
  }
];

interface Props {
  isNight?: boolean;
  setIsNight?: (val: boolean) => void;
}

export default function ReportStudioPage({ isNight = true, setIsNight }: Props) {
  const [lang, setLang] = useState<'ko' | 'en'>('ko');
  const [selectedReportId, setSelectedReportId] = useState<string>(SAMPLE_REPORTS[0].id);
  const [customInput, setCustomInput] = useState<string>(SAMPLE_REPORTS[0].rawInput);
  const [customAcademyName, setCustomAcademyName] = useState<string>('POLY Academy (Seocho)');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [showModal, setShowModal] = useState<boolean>(false);
  
  // Interactive Screenshots, Gallery & Lightbox State
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const [activeCarouselIdx, setActiveCarouselIdx] = useState<number>(0);
  const [galleryDisplayMode, setGalleryDisplayMode] = useState<'carousel' | 'grid'>('carousel');
  const [autoPlayCarousel, setAutoPlayCarousel] = useState<boolean>(false);

  const [studioOutputView, setStudioOutputView] = useState<'script' | 'dashboard'>('script');
  const [selectedArchCategory, setSelectedArchCategory] = useState<'all' | 'form' | 'automation' | 'database' | 'dashboard'>('all');

  // Native Engine Demo States
  const [nativeDemoTab, setNativeDemoTab] = useState<'ft-form' | 'kt-dashboard' | 'preset-generator'>('ft-form');
  const [isSubmittingNativeLog, setIsSubmittingNativeLog] = useState(false);
  const [nativeOutput, setNativeOutput] = useState<GeneratedReportOutput | null>(null);

  const handleNativeLogSubmit = async (payload: ClassLogPayload) => {
    setIsSubmittingNativeLog(true);
    try {
      // 1. Generate General Summary (Gemini Prompt #1)
      const summary = await generateGeneralClassSummary(payload);

      // 2. Generate Student Exceptions & Phone Prep (Gemini Prompts #2 & #3)
      const studentReports = await Promise.all(
        payload.exceptions.map(async (ex) => {
          const updateText = await generateStudentExceptionReport(
            ex.studentName,
            payload.lessonTopic,
            payload.textbook,
            ex.details
          );
          const points = await generatePhoneConsultationPrep(ex.studentName, ex.details);
          return {
            studentName: ex.studentName,
            koreanUpdate: updateText,
            phoneTalkingPoints: points,
          };
        })
      );

      setNativeOutput({
        bilingualClassSummary: summary,
        studentReports,
      });

      // Switch tab to KT Dashboard to show reviewed editing workspace
      setNativeDemoTab('kt-dashboard');
    } catch (err) {
      console.error('Native AI generation error:', err);
    } finally {
      setIsSubmittingNativeLog(false);
    }
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

  // Form State (for both embedded & modal forms)
  const [directorName, setDirectorName] = useState('');
  const [academyName, setAcademyName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [location, setLocation] = useState('');
  const [currentMethod, setCurrentMethod] = useState('');
  const [preferredTime, setPreferredTime] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const t = REPORT_TRANSLATIONS[lang];
  const isKo = lang === 'ko';
  const demoT = t.interactiveDemo;
  const activeReport = SAMPLE_REPORTS.find((r) => r.id === selectedReportId) || SAMPLE_REPORTS[0];

  // ROI Math
  const weeklyHoursSaved = Math.round(ftCount * 3.5);
  const hourlyRateKRW = 15000;
  const monthlyLaborSavingsKRW = weeklyHoursSaved * 4 * hourlyRateKRW;
  const annualLaborSavingsKRW = monthlyLaborSavingsKRW * 12;

  const handleSelectPreset = (report: SampleReport) => {
    setSelectedReportId(report.id);
    setCustomInput(report.rawInput);
  };

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
    }, 450);
  };

  const handleCopyKakaoScript = () => {
    const scriptText = `[체키AI 학부모 상담 대본]
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

    navigator.clipboard.writeText(scriptText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!directorName || !academyName || !email || !phone) return;

    setIsSubmitting(true);
    try {
      await fetch('/api/request-school-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          directorName,
          academyName,
          phone,
          email,
          location,
          ftCount,
          studentCount,
          currentMethod,
          preferredTime,
          type: 'report-studio-setup',
        }),
      });
    } catch (err) {
      console.warn('Backend endpoint fallback; proceeding with client success state.');
    } finally {
      setIsSubmitting(false);
      setSubmitted(true);
    }
  };

  const openOnboardingModal = () => {
    setSubmitted(false);
    setShowModal(true);
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

          {/* Desktop Nav Links (Streamlined to core items) */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-bold">
            <a href="#interactive" className="hover:text-orange-500 transition-colors">
              {t.nav.interactive}
            </a>
            <a href="#pricing" className="hover:text-orange-500 transition-colors">
              {t.nav.pricing}
            </a>
            <a href="#calculator" className="hover:text-orange-500 transition-colors">
              {t.nav.calculator}
            </a>
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-3 ml-auto">
            {/* Language Toggle */}
            <button
              type="button"
              onClick={() => setLang(lang === 'ko' ? 'en' : 'ko')}
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
                onClick={() => setIsNight(!isNight)}
                className={`p-2 rounded-full border transition-colors cursor-pointer ${
                  isNight
                    ? 'border-white/10 hover:bg-white/10 text-white/70 hover:text-white'
                    : 'border-slate-300 hover:bg-slate-100 text-slate-700 hover:text-slate-900'
                }`}
              >
                {isNight ? <Sun size={16} weight="bold" /> : <Moon size={16} weight="bold" />}
              </button>
            )}

            <button
              type="button"
              onClick={openOnboardingModal}
              className="px-4 py-1.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-full text-xs transition-all shadow-md active:scale-95 cursor-pointer"
            >
              {lang === 'ko' ? '맞춤 구축 신청' : 'Request Setup'}
            </button>
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
              onClick={openOnboardingModal}
              className="w-full sm:w-auto pl-7 pr-4 py-3.5 bg-orange-500 hover:bg-orange-600 text-white font-black text-sm rounded-full shadow-xl shadow-orange-500/25 transition-all duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.97] flex items-center justify-center gap-3 cursor-pointer group"
            >
              <span>{t.hero.primaryCta}</span>
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0 transition-transform duration-200 ease-out group-hover:translate-x-1">
                <ArrowRight size={14} weight="bold" />
              </div>
            </button>
            <a
              href="#video-demo"
              className={`w-full sm:w-auto pl-7 pr-4 py-3.5 font-black text-sm rounded-full border transition-all duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.97] text-center flex items-center justify-center gap-3 group ${
                isNight
                  ? 'bg-white/5 border-white/10 hover:bg-white/10 text-white'
                  : 'bg-white border-zinc-300 hover:bg-zinc-50 text-zinc-900 shadow-sm'
              }`}
            >
              <span>{t.hero.secondaryCta}</span>
              <div className="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center shrink-0 transition-transform duration-200 ease-out group-hover:scale-110">
                <PlayCircle size={18} weight="fill" className="text-orange-500" />
              </div>
            </a>
          </div>

          {/* Trust Badge */}
          <p className={`text-xs ${isNight ? 'text-zinc-500' : 'text-zinc-400'} pt-2 font-mono`}>
            🔒 {t.hero.badge}
          </p>
        </section>

        {/* ========================================================================= */}
        {/* 2. 1-MINUTE DEMO VIDEO SHOWCASE FRAME (#video-demo) */}
        {/* ========================================================================= */}
        <section id="video-demo" className="space-y-6 max-w-5xl mx-auto w-full pt-4">
          <div className="text-center space-y-2">
            <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest block font-mono">
              {t.videoDemo.tagline}
            </span>
            <h2 className="font-display text-2xl sm:text-4xl font-black tracking-tight">
              {t.videoDemo.heading}
            </h2>
            <p className={`text-xs sm:text-sm max-w-xl mx-auto ${isNight ? 'text-zinc-400' : 'text-zinc-600'}`}>
              {t.videoDemo.subheading}
            </p>
          </div>

          {/* High-End HTML5 Video Player */}
          <div
            className={`rounded-3xl border p-3 md:p-4 shadow-2xl relative overflow-hidden transition-all ${
              isNight
                ? 'bg-[#050505] border-white/15 shadow-orange-500/10'
                : 'bg-white border-zinc-300 shadow-xl'
            }`}
          >
            <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black shadow-inner flex items-center justify-center">
              <video
                controls
                playsInline
                preload="metadata"
                poster="https://res.cloudinary.com/dec04iaht/image/upload/q_auto/f_auto/v1780757946/Screenshot_2026-06-03_at_5.35.38_PM_wywtjr.png"
                className="w-full h-full object-cover rounded-2xl"
              >
                <source
                  src="https://res.cloudinary.com/dginphpy4/video/upload/v1765769964/chekki-intro_y7hj7c.mp4"
                  type="video/mp4"
                />
                Your browser does not support HTML5 video playback.
              </video>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-3 px-2 text-xs">
              <span className={`font-mono text-[11px] ${isNight ? 'text-zinc-400' : 'text-zinc-600'}`}>
                📹 1-Minute ChekkiAI Platform Workflow Demo
              </span>
              <a
                href="https://embed.app.guidde.com/playbooks/fXwhH7ayipdTFcXASDJx5K"
                target="_blank"
                rel="noopener noreferrer"
                className="text-orange-500 hover:text-orange-400 font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>{isKo ? '🔗 Guidde 대화형 가이드 새 창에서 보기' : '🔗 Open Guidde Interactive Playbook'}</span>
                <ArrowRight size={14} weight="bold" />
              </a>
            </div>
          </div>
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

            {/* Native Workspace Tab Switcher */}
            <div className="flex flex-wrap justify-center items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setNativeDemoTab('ft-form')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                  nativeDemoTab === 'ft-form'
                    ? 'bg-orange-500 border-orange-500 text-white shadow-md scale-[1.02]'
                    : isNight
                    ? 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'
                    : 'bg-white border-zinc-200 text-zinc-600 hover:text-zinc-900 shadow-sm'
                }`}
              >
                ⚡ 1. FT Daily Log Form (&lt;30s)
              </button>

              <button
                type="button"
                onClick={() => setNativeDemoTab('kt-dashboard')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                  nativeDemoTab === 'kt-dashboard'
                    ? 'bg-orange-500 border-orange-500 text-white shadow-md scale-[1.02]'
                    : isNight
                    ? 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'
                    : 'bg-white border-zinc-200 text-zinc-600 hover:text-zinc-900 shadow-sm'
                }`}
              >
                💬 2. KT Review & Live Copy Workspace (Human-in-the-Loop)
              </button>

              <button
                type="button"
                onClick={() => setNativeDemoTab('preset-generator')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                  nativeDemoTab === 'preset-generator'
                    ? 'bg-orange-500 border-orange-500 text-white shadow-md scale-[1.02]'
                    : isNight
                    ? 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'
                    : 'bg-white border-zinc-200 text-zinc-600 hover:text-zinc-900 shadow-sm'
                }`}
              >
                🏫 3. Sample Case Simulator
              </button>
            </div>
          </div>

          {/* Conditional View Rendering based on Native Demo Tab */}
          {nativeDemoTab === 'ft-form' && (
            <NativeTeacherLogForm
              isNight={isNight}
              onSubmitLog={handleNativeLogSubmit}
              isSubmitting={isSubmittingNativeLog}
            />
          )}

          {nativeDemoTab === 'kt-dashboard' && (
            <NativeKtDashboard
              isNight={isNight}
              generatedOutput={nativeOutput}
              className="POLY Seocho 7A"
              academyName={customAcademyName}
            />
          )}

          {nativeDemoTab === 'preset-generator' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Controls (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Live Academy Co-Branding Simulator */}
              <div className="space-y-2 p-4 rounded-2xl border bg-gradient-to-r from-orange-500/10 to-pink-500/10 border-orange-500/30">
                <label className="text-xs font-black uppercase tracking-wider text-orange-500 block font-mono flex items-center justify-between">
                  <span>{lang === 'ko' ? '🏫 학원명 입혀보기 (라이브 브랜딩)' : '🏫 Test Your Academy Brand'}</span>
                  <span className="text-[10px] text-emerald-400 font-bold">Live Preview</span>
                </label>
                <input
                  type="text"
                  value={customAcademyName}
                  onChange={(e) => setCustomAcademyName(e.target.value)}
                  placeholder={lang === 'ko' ? '예: POLY 서초 어학원' : 'e.g. POLY Seocho Academy'}
                  className={`w-full p-3.5 rounded-xl border text-xs sm:text-sm font-bold focus:outline-none transition-all font-mono ${
                    isNight
                      ? 'bg-[#050505] border-white/10 text-orange-400 focus:border-orange-500'
                      : 'bg-white border-zinc-300 text-orange-600 focus:border-orange-500 shadow-sm'
                  }`}
                />
              </div>

              {/* Preset Selector */}
              <div className="space-y-3">
                <label className="text-xs font-black uppercase tracking-wider text-orange-500 block font-mono flex items-center justify-between">
                  <span>{demoT.selectPreset}</span>
                  <span className="text-[10px] text-zinc-500 font-normal">Airtable Source</span>
                </label>
                <div className="space-y-2.5">
                  {SAMPLE_REPORTS.map((report) => (
                    <button
                      key={report.id}
                      type="button"
                      onClick={() => handleSelectPreset(report)}
                      className={`w-full text-left p-4 rounded-2xl border text-xs sm:text-sm font-medium transition-all flex items-center justify-between cursor-pointer ${
                        selectedReportId === report.id
                          ? isNight
                            ? 'bg-[#0f0b08] border-orange-500 text-white shadow-lg shadow-orange-500/10'
                            : 'bg-orange-50/80 border-orange-500 text-zinc-900 shadow-md'
                          : isNight
                          ? 'bg-[#050505] border-white/10 text-zinc-300 hover:border-white/30'
                          : 'bg-white border-zinc-200 text-zinc-700 hover:border-zinc-300 shadow-sm'
                      }`}
                    >
                      <div>
                        <div className="font-bold flex items-center gap-2">
                          <span>{report.studentNameKo}</span>
                          <span className="text-xs font-normal opacity-70">({report.studentNameEn})</span>
                        </div>
                        <div className="text-[11px] opacity-70 mt-1">
                          {report.gradeKo} • {report.subject}
                        </div>
                      </div>
                      {selectedReportId === report.id && (
                        <div className="w-2.5 h-2.5 rounded-full bg-orange-500 flex-shrink-0 animate-pulse" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Raw Foreign Teacher Input */}
              <div className="space-y-2.5">
                <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider font-mono text-zinc-400">
                  <span>{demoT.customInputLabel}</span>
                  <span className="text-orange-500 text-[10px] font-normal">Fillout Form Log ✏️</span>
                </div>
                <textarea
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  rows={4}
                  className={`w-full p-4 rounded-2xl border text-xs sm:text-sm leading-relaxed focus:outline-none transition-colors font-mono ${
                    isNight
                      ? 'bg-[#050505] border-white/10 text-zinc-100 focus:border-orange-500'
                      : 'bg-white border-zinc-200 text-zinc-900 focus:border-orange-500 shadow-inner'
                  }`}
                  placeholder={demoT.inputPlaceholder}
                />
              </div>

              {/* Micro-Note / Custom Nuance Field */}
              <div className="space-y-1.5 p-3.5 rounded-2xl border bg-orange-500/5 border-orange-500/20">
                <label className="text-[11px] font-bold text-orange-400 block font-mono flex items-center justify-between">
                  <span>💡 {lang === 'ko' ? '커스텀 단어 / 마이크로 메모 (AI 문장 중복 방지)' : 'Micro Keyword (Guarantees Unique AI Phrasing)'}</span>
                  <span className="text-[10px] text-zinc-500">Optional ⚡</span>
                </label>
                <input
                  type="text"
                  value={customAcademyName.includes('POLY') ? 'Phonics p.14 & Photosynthesis Vocab' : 'Lesson Unit 3 Review'}
                  onChange={(e) => {}}
                  className={`w-full p-2.5 rounded-xl border text-xs font-mono focus:outline-none ${
                    isNight ? 'bg-[#050505] border-white/10 text-zinc-200' : 'bg-white border-zinc-300 text-zinc-800'
                  }`}
                  placeholder="e.g. Phonics p.14 or Vocab: Stomata"
                />
              </div>

              {/* Generate Action Button */}
              <button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white font-black text-sm rounded-2xl shadow-lg shadow-orange-500/20 hover:scale-[1.01] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isGenerating ? (
                  <>
                    <Sparkle size={18} className="animate-spin text-white" />
                    <span>{demoT.generatingLabel}</span>
                  </>
                ) : (
                  <>
                    <Sparkle size={18} weight="fill" />
                    <span>{demoT.generateBtn}</span>
                  </>
                )}
              </button>

              {/* Director Note Card */}
              <div
                className={`p-4 rounded-2xl border text-xs leading-relaxed ${
                  isNight ? 'bg-[#0a0a0c] border-white/10 text-zinc-400' : 'bg-zinc-100 border-zinc-200 text-zinc-600'
                }`}
              >
                <span className={`font-bold block mb-1 ${isNight ? 'text-white' : 'text-zinc-900'}`}>
                  💡 {demoT.directorNoteLabel}:
                </span>
                <p>{demoT.directorNoteBody}</p>
              </div>
            </div>

            {/* Right Output Dashboard (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Header bar with Copy Action */}
              <div
                className={`p-6 rounded-3xl border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-colors ${
                  isNight ? 'bg-[#050505] border-white/10' : 'bg-white border-zinc-200 shadow-sm'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest bg-orange-500/20 text-orange-400 border border-orange-500/30">
                      {customAcademyName || 'B2B Academy'}
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400 font-bold">1-Click Live AI Report</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <UserCheck size={20} className="text-orange-500" weight="bold" />
                    <h3 className={`font-black text-lg ${isNight ? 'text-white' : 'text-zinc-900'}`}>
                      {activeReport.studentNameKo} ({activeReport.studentNameEn})
                    </h3>
                  </div>
                  <p className={`text-xs mt-1 ${isNight ? 'text-zinc-400' : 'text-zinc-600'}`}>
                    {activeReport.gradeKo} • {activeReport.subject} • {activeReport.teacherName}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                  {/* View Mode Toggle Pill */}
                  <div className={`p-1 rounded-xl border flex items-center gap-1 text-[11px] font-bold ${
                    isNight ? 'bg-white/5 border-white/10' : 'bg-zinc-100 border-zinc-200'
                  }`}>
                    <button
                      type="button"
                      onClick={() => setStudioOutputView('script')}
                      className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                        studioOutputView === 'script'
                          ? 'bg-orange-500 text-white font-black shadow-sm'
                          : isNight ? 'text-zinc-400 hover:text-white' : 'text-zinc-600 hover:text-zinc-900'
                      }`}
                    >
                      💬 KakaoTalk Script
                    </button>
                    <button
                      type="button"
                      onClick={() => setStudioOutputView('dashboard')}
                      className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                        studioOutputView === 'dashboard'
                          ? 'bg-orange-500 text-white font-black shadow-sm'
                          : isNight ? 'text-zinc-400 hover:text-white' : 'text-zinc-600 hover:text-zinc-900'
                      }`}
                    >
                      📊 Softr Dashboard Preview
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleCopyKakaoScript}
                    className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      copied
                        ? 'bg-emerald-600 text-white shadow-lg'
                        : 'bg-orange-500 hover:bg-orange-600 text-white shadow-md active:scale-95'
                    }`}
                  >
                    {copied ? (
                      <>
                        <CheckCircle size={15} weight="bold" />
                        <span>{demoT.copiedText}</span>
                      </>
                    ) : (
                      <>
                        <Copy size={15} weight="bold" />
                        <span>{demoT.copyScriptBtn}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Conditional View Rendering: Softr Production Dashboard Screenshot Preview */}
              {studioOutputView === 'dashboard' ? (
                <div className={`p-6 rounded-3xl border space-y-6 ${
                  isNight ? 'bg-[#050505] border-white/10' : 'bg-white border-zinc-200 shadow-sm'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 font-mono">
                      LIVE SOFTR PARENT DASHBOARD PREVIEW
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono">Click screenshot to inspect</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div
                      onClick={() => setLightboxIdx(5)}
                      className="group relative rounded-2xl overflow-hidden border border-white/10 cursor-pointer shadow-lg hover:border-orange-500 transition-all"
                    >
                      <img
                        src={SYSTEM_SCREENSHOTS.find(s => s.id === 'kt-dashboard-main')!.url}
                        alt="Parent Dashboard Main"
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-4 flex flex-col justify-end">
                        <span className="text-xs font-black text-white">{isKo ? '📊 학부모 대시보드 (메인)' : '📊 Bilingual Parent Dashboard (Main)'}</span>
                        <span className="text-[10px] text-orange-400 font-mono">{isKo ? '이중언어 종합 도표 🔍' : 'Bilingual Progress View 🔍'}</span>
                      </div>
                    </div>

                    <div
                      onClick={() => setLightboxIdx(6)}
                      className="group relative rounded-2xl overflow-hidden border border-white/10 cursor-pointer shadow-lg hover:border-orange-500 transition-all"
                    >
                      <img
                        src={SYSTEM_SCREENSHOTS.find(s => s.id === 'kt-dashboard-detail')!.url}
                        alt="Parent Dashboard Detail"
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-4 flex flex-col justify-end">
                        <span className="text-xs font-black text-white">{isKo ? '📝 정성 관찰 상세 리포트' : '📝 Detailed Observation Report'}</span>
                        <span className="text-[10px] text-emerald-400 font-mono">{isKo ? '상세 레포트 보기 🔍' : 'Detailed Report View 🔍'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}

              {/* Branch A: Normalized Academic Summary (Airtable DB) */}
              <div
                className={`p-6 rounded-3xl border space-y-3 ${
                  isNight ? 'bg-[#050505] border-white/10' : 'bg-white border-zinc-200 shadow-sm'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase tracking-widest text-orange-500 font-mono">
                    Branch A • {demoT.translatedSummary}
                  </span>
                  {activeReport.flaggedIssue && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      ⚠️ {activeReport.flaggedIssue}
                    </span>
                  )}
                </div>
                <p className={`text-xs sm:text-sm leading-relaxed ${isNight ? 'text-zinc-300' : 'text-zinc-700'}`}>
                  {activeReport.translatedSummaryKo}
                </p>
              </div>

              {/* Branch B: 5-Part Parent Script (KakaoTalk Phone Script) */}
              <div
                className={`p-6 rounded-3xl border space-y-5 ${
                  isNight ? 'bg-[#050505] border-white/10' : 'bg-white border-zinc-200 shadow-sm'
                }`}
              >
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 font-mono block">
                  Branch B • {demoT.scriptSectionsHeading}
                </span>

                {/* Section 1: Greeting */}
                <div className={`p-4 rounded-2xl border space-y-1 ${isNight ? 'bg-white/[0.02] border-white/5' : 'bg-zinc-50 border-zinc-200'}`}>
                  <span className="text-[11px] font-bold text-orange-500 block">{demoT.scriptSections.greeting}</span>
                  <p className={`text-xs sm:text-sm leading-relaxed ${isNight ? 'text-zinc-200' : 'text-zinc-800'}`}>
                    {activeReport.parentScriptKo.greeting}
                  </p>
                </div>

                {/* Section 2: Academic Progress */}
                <div className={`p-4 rounded-2xl border space-y-1 ${isNight ? 'bg-white/[0.02] border-white/5' : 'bg-zinc-50 border-zinc-200'}`}>
                  <span className="text-[11px] font-bold text-blue-400 block">{demoT.scriptSections.academicProgress}</span>
                  <p className={`text-xs sm:text-sm leading-relaxed ${isNight ? 'text-zinc-200' : 'text-zinc-800'}`}>
                    {activeReport.parentScriptKo.academicProgress}
                  </p>
                </div>

                {/* Section 3: Behavior & Attitude */}
                <div className={`p-4 rounded-2xl border space-y-1 ${isNight ? 'bg-white/[0.02] border-white/5' : 'bg-zinc-50 border-zinc-200'}`}>
                  <span className="text-[11px] font-bold text-purple-400 block">{demoT.scriptSections.behaviorAndAttitude}</span>
                  <p className={`text-xs sm:text-sm leading-relaxed ${isNight ? 'text-zinc-200' : 'text-zinc-800'}`}>
                    {activeReport.parentScriptKo.behaviorAndAttitude}
                  </p>
                </div>

                {/* Section 4: Action Items */}
                <div className={`p-4 rounded-2xl border space-y-1 ${isNight ? 'bg-amber-500/5 border-amber-500/20' : 'bg-amber-50 border-amber-200'}`}>
                  <span className="text-[11px] font-bold text-amber-500 block">{demoT.scriptSections.actionItems}</span>
                  <p className={`text-xs sm:text-sm leading-relaxed ${isNight ? 'text-zinc-200' : 'text-zinc-800'}`}>
                    {activeReport.parentScriptKo.actionItems}
                  </p>
                </div>

                {/* Section 5: Closing */}
                <div className={`p-4 rounded-2xl border space-y-1 ${isNight ? 'bg-white/[0.02] border-white/5' : 'bg-zinc-50 border-zinc-200'}`}>
                  <span className="text-[11px] font-bold text-emerald-400 block">{demoT.scriptSections.closing}</span>
                  <p className={`text-xs sm:text-sm leading-relaxed ${isNight ? 'text-zinc-200' : 'text-zinc-800'}`}>
                    {activeReport.parentScriptKo.closing}
                  </p>
                </div>
              </div>
            </div>
          </div>
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
                onClick={openOnboardingModal}
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
              TRANSPARENT B2B PRICING
            </span>
            <h2 className="font-display text-2xl sm:text-4xl font-black tracking-tight mb-4">
              {t.pricing.heading}
            </h2>
            <p className={`text-sm sm:text-base ${isNight ? 'text-zinc-400' : 'text-zinc-600'}`}>
              {t.pricing.subheading}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            {/* Starter Plan */}
            <div
              className={`p-1.5 rounded-[2rem] border transition-all duration-300 ${
                isNight ? 'bg-white/5 border-white/10' : 'bg-black/5 border-zinc-200 shadow-sm'
              }`}
            >
              <div
                className={`p-6 md:p-8 rounded-[calc(2rem-0.375rem)] h-full flex flex-col justify-between space-y-6 ${
                  isNight ? 'bg-[#050505]' : 'bg-white'
                }`}
              >
                <div className="space-y-4">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-500 block">
                    {t.pricing.starterTitle}
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className={`font-display text-4xl font-black ${isNight ? 'text-white' : 'text-zinc-900'}`}>
                      {t.pricing.starterPrice}
                    </span>
                    <span className="text-xs font-bold text-zinc-500">{t.pricing.starterPeriod}</span>
                  </div>
                  <p className={`text-xs leading-relaxed ${isNight ? 'text-zinc-400' : 'text-zinc-600'}`}>
                    {t.pricing.starterDesc}
                  </p>

                  <div className="space-y-2.5 pt-4 border-t border-white/5 text-xs font-medium">
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
                  onClick={openOnboardingModal}
                  className={`w-full py-3.5 rounded-2xl text-xs font-black transition-all cursor-pointer border ${
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
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-orange-500 to-pink-500 text-white text-[10px] font-black uppercase tracking-widest shadow-md">
                {t.pricing.proBadge}
              </div>

              <div
                className={`p-6 md:p-8 rounded-[calc(2rem-0.375rem)] h-full flex flex-col justify-between space-y-6 ${
                  isNight ? 'bg-[#0a080c]' : 'bg-white'
                }`}
              >
                <div className="space-y-4">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-orange-500 block">
                    {t.pricing.proTitle}
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className="font-display text-4xl font-black text-orange-500">
                      {t.pricing.proPrice}
                    </span>
                    <span className="text-[11px] font-bold text-zinc-500">{t.pricing.proPeriod}</span>
                  </div>
                  <p className={`text-xs leading-relaxed ${isNight ? 'text-zinc-300' : 'text-zinc-600'}`}>
                    {t.pricing.proDesc}
                  </p>

                  <div className="space-y-2.5 pt-4 border-t border-orange-500/20 text-xs font-medium">
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
                  onClick={openOnboardingModal}
                  className="w-full py-4 rounded-2xl text-xs font-black transition-all cursor-pointer bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white shadow-xl shadow-orange-500/20 active:scale-[0.98]"
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
                className={`p-6 md:p-8 rounded-[calc(2rem-0.375rem)] h-full flex flex-col justify-between space-y-6 ${
                  isNight ? 'bg-[#050505]' : 'bg-white'
                }`}
              >
                <div className="space-y-4">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-purple-400 block">
                    {t.pricing.enterpriseTitle}
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className={`font-display text-4xl font-black ${isNight ? 'text-white' : 'text-zinc-900'}`}>
                      {t.pricing.enterprisePrice}
                    </span>
                    <span className="text-xs font-bold text-zinc-500">{t.pricing.enterprisePeriod}</span>
                  </div>
                  <p className={`text-xs leading-relaxed ${isNight ? 'text-zinc-400' : 'text-zinc-600'}`}>
                    {t.pricing.enterpriseDesc}
                  </p>

                  <div className="space-y-2.5 pt-4 border-t border-white/5 text-xs font-medium">
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
                  onClick={openOnboardingModal}
                  className={`w-full py-3.5 rounded-2xl text-xs font-black transition-all cursor-pointer border ${
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

        {/* ========================================================================= */}
        {/* 6. REAL PRODUCTION SYSTEM ARCHITECTURE & HIGH-END SCREENSHOT SHOWCASE */}
        {/* ========================================================================= */}
        <section className="space-y-8 pt-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-6">
            <div className="space-y-2">
              <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest block font-mono">
                REAL PRODUCTION ARCHITECTURE & UI SHOWCASE
              </span>
              <h2 className="font-display text-2xl sm:text-4xl font-black tracking-tight">
                {t.howItWorks.heading}
              </h2>
              <p className={`text-xs sm:text-sm ${isNight ? 'text-zinc-400' : 'text-zinc-600'}`}>
                {t.howItWorks.subheading}
              </p>
            </div>

            {/* Display Mode Switcher */}
            <div className="flex items-center gap-2 shrink-0 self-start md:self-auto">
              <button
                type="button"
                onClick={() => setGalleryDisplayMode('carousel')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                  galleryDisplayMode === 'carousel'
                    ? 'bg-orange-500 border-orange-500 text-white shadow-md'
                    : isNight
                    ? 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'
                    : 'bg-white border-zinc-200 text-zinc-600 hover:text-zinc-900 shadow-sm'
                }`}
              >
                <Slideshow size={16} weight="bold" />
                <span>{isKo ? '🎠 슬라이드쇼 뷰' : 'Carousel View'}</span>
              </button>

              <button
                type="button"
                onClick={() => setGalleryDisplayMode('grid')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                  galleryDisplayMode === 'grid'
                    ? 'bg-orange-500 border-orange-500 text-white shadow-md'
                    : isNight
                    ? 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'
                    : 'bg-white border-zinc-200 text-zinc-600 hover:text-zinc-900 shadow-sm'
                }`}
              >
                <SquaresFour size={16} weight="bold" />
                <span>{isKo ? '📱 그리드 뷰' : 'Grid View'}</span>
              </button>
            </div>
          </div>

          {/* Interactive Native Data Pipeline Visualizer */}
          <NativeArchitecturePipeline isNight={isNight} />

          {galleryDisplayMode === 'carousel' ? (
            /* =================================================================== */
            /* MODE A: HIGH-END INTERACTIVE CAROUSEL SHOWCASE */
            /* =================================================================== */
            <div className="space-y-6">
              {/* Step Navigation Ribbon */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                {SYSTEM_SCREENSHOTS.map((shot, idx) => (
                  <button
                    key={shot.id}
                    type="button"
                    onClick={() => setActiveCarouselIdx(idx)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer border flex items-center gap-2 ${
                      activeCarouselIdx === idx
                        ? 'bg-orange-500/20 border-orange-500 text-orange-400 shadow-md scale-[1.02]'
                        : isNight
                        ? 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'
                        : 'bg-white border-zinc-200 text-zinc-600 hover:text-zinc-900'
                    }`}
                  >
                    <span className="w-5 h-5 rounded-full bg-orange-500/30 text-orange-400 text-[10px] font-mono flex items-center justify-center font-black">
                      {idx + 1}
                    </span>
                    <span>{isKo ? shot.titleKo : shot.titleEn}</span>
                  </button>
                ))}
              </div>

              {/* Main Showcase Hero Window (Browser Mockup Frame) */}
              <div
                className={`rounded-3xl border overflow-hidden shadow-2xl relative transition-all ${
                  isNight
                    ? 'bg-[#050507] border-white/15 shadow-orange-500/10'
                    : 'bg-white border-zinc-300 shadow-xl'
                }`}
              >
                {/* Browser Frame Header */}
                <div className={`px-4 py-3 border-b flex items-center justify-between font-mono text-xs ${
                  isNight ? 'bg-black/60 border-white/10 text-zinc-400' : 'bg-zinc-100 border-zinc-200 text-zinc-600'
                }`}>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block" />
                      <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
                      <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
                    </div>
                    <span className="text-[11px] opacity-70 ml-2 font-mono hidden sm:inline">
                      chekki.ai/production/architecture#{SYSTEM_SCREENSHOTS[activeCarouselIdx].id}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setAutoPlayCarousel(!autoPlayCarousel)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-colors flex items-center gap-1 cursor-pointer ${
                        autoPlayCarousel
                          ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                          : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'
                      }`}
                    >
                      {autoPlayCarousel ? <Pause size={12} weight="bold" /> : <Play size={12} weight="bold" />}
                      <span>{autoPlayCarousel ? (isKo ? '자동 슬라이드 중' : 'Auto ON') : (isKo ? '자동 재생' : 'Auto Play')}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setLightboxIdx(activeCarouselIdx)}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-orange-500 hover:bg-orange-600 text-white transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <MagnifyingGlassPlus size={14} weight="bold" />
                      <span>{isKo ? '크게보기' : 'Inspect HD'}</span>
                    </button>
                  </div>
                </div>

                {/* Main Screenshot Container */}
                <div className="relative aspect-[16/10] sm:aspect-[16/9] w-full bg-black/90 group overflow-hidden">
                  <img
                    src={SYSTEM_SCREENSHOTS[activeCarouselIdx].url}
                    alt={SYSTEM_SCREENSHOTS[activeCarouselIdx].titleEn}
                    className="w-full h-full object-contain transition-opacity duration-300"
                  />

                  {/* Left Carousel Arrow */}
                  <button
                    type="button"
                    onClick={() => setActiveCarouselIdx((prev) => (prev - 1 + SYSTEM_SCREENSHOTS.length) % SYSTEM_SCREENSHOTS.length)}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/70 border border-white/20 text-white backdrop-blur-md hover:bg-orange-500 transition-all cursor-pointer shadow-lg active:scale-90"
                    title={isKo ? '이전 이미지 (←)' : 'Previous Image'}
                  >
                    <CaretLeft size={20} weight="bold" />
                  </button>

                  {/* Right Carousel Arrow */}
                  <button
                    type="button"
                    onClick={() => setActiveCarouselIdx((prev) => (prev + 1) % SYSTEM_SCREENSHOTS.length)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/70 border border-white/20 text-white backdrop-blur-md hover:bg-orange-500 transition-all cursor-pointer shadow-lg active:scale-90"
                    title={isKo ? '다음 이미지 (→)' : 'Next Image'}
                  >
                    <CaretRight size={20} weight="bold" />
                  </button>

                  {/* Caption Bar Overlay inside Container */}
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black via-black/80 to-transparent p-6 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
                    <div className="space-y-1 max-w-2xl">
                      <div className="flex items-center gap-2 font-mono">
                        <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest bg-orange-500 text-white">
                          STEP {activeCarouselIdx + 1} / {SYSTEM_SCREENSHOTS.length}
                        </span>
                        <span className="text-[11px] text-orange-400 font-bold uppercase tracking-wider">
                          {isKo ? SYSTEM_SCREENSHOTS[activeCarouselIdx].subtitleKo : SYSTEM_SCREENSHOTS[activeCarouselIdx].subtitleEn}
                        </span>
                      </div>

                      <h3 className="font-black text-xl sm:text-2xl text-white">
                        {isKo ? SYSTEM_SCREENSHOTS[activeCarouselIdx].titleKo : SYSTEM_SCREENSHOTS[activeCarouselIdx].titleEn}
                      </h3>

                      <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                        {isKo ? SYSTEM_SCREENSHOTS[activeCarouselIdx].descKo : SYSTEM_SCREENSHOTS[activeCarouselIdx].descEn}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setLightboxIdx(activeCarouselIdx)}
                      className="px-5 py-2.5 rounded-xl font-bold text-xs bg-white text-zinc-900 hover:bg-orange-500 hover:text-white transition-all shadow-xl shrink-0 cursor-pointer flex items-center gap-1.5"
                    >
                      <MagnifyingGlassPlus size={16} weight="bold" />
                      <span>{isKo ? '전체화면 감상' : 'Full Screen'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Bottom Thumbnail Strip */}
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-3 pt-2">
                {SYSTEM_SCREENSHOTS.map((shot, idx) => (
                  <button
                    key={shot.id}
                    type="button"
                    onClick={() => setActiveCarouselIdx(idx)}
                    className={`relative rounded-xl overflow-hidden aspect-video border transition-all cursor-pointer group ${
                      activeCarouselIdx === idx
                        ? 'border-orange-500 ring-2 ring-orange-500/50 scale-105 shadow-lg'
                        : 'border-white/10 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={shot.url}
                      alt={shot.titleEn}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-[10px] font-black text-white font-mono">
                      {idx + 1}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* =================================================================== */
            /* MODE B: BENTO GRID VIEW WITH CATEGORY FILTERS */
            /* =================================================================== */
            <div className="space-y-6">
              {/* Category Filters */}
              <div className="flex flex-wrap justify-center items-center gap-2">
                {[
                  { id: 'all', label: isKo ? '전체 보기 (7)' : 'All Systems (7)' },
                  { id: 'form', label: isKo ? '1. FT Fillout 양식' : '1. FT Fillout Form' },
                  { id: 'automation', label: isKo ? '2. Make.com 워크플로우' : '2. Make.com Engine' },
                  { id: 'database', label: isKo ? '3. Airtable 관계형 DB' : '3. Airtable Backend' },
                  { id: 'dashboard', label: isKo ? '4. Softr 학부모 포털' : '4. Softr Parent Portal' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setSelectedArchCategory(tab.id as any)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                      selectedArchCategory === tab.id
                        ? 'bg-orange-500 border-orange-500 text-white shadow-md'
                        : isNight
                        ? 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'
                        : 'bg-white border-zinc-200 text-zinc-600 hover:text-zinc-900 shadow-sm'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Grid of Production Screenshots */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {SYSTEM_SCREENSHOTS.filter(s => selectedArchCategory === 'all' || s.category === selectedArchCategory).map((shot) => {
                  const globalIdx = SYSTEM_SCREENSHOTS.findIndex(s => s.id === shot.id);
                  return (
                    <div
                      key={shot.id}
                      onClick={() => setLightboxIdx(globalIdx)}
                      className={`group rounded-3xl border overflow-hidden transition-all duration-300 cursor-pointer hover:scale-[1.02] shadow-xl ${
                        isNight ? 'bg-[#060608] border-white/10 hover:border-orange-500/50' : 'bg-white border-zinc-200 hover:border-orange-500'
                      }`}
                    >
                      <div className="relative aspect-video overflow-hidden bg-black/40">
                        <img
                          src={shot.url}
                          alt={shot.titleEn}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                        <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md text-[10px] font-mono text-orange-400 font-bold border border-white/10 flex items-center gap-1">
                          <MagnifyingGlassPlus size={12} weight="bold" />
                          <span>{isKo ? '확대보기' : 'Inspect UI'}</span>
                        </div>
                      </div>

                      <div className="p-5 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-orange-500">
                            {isKo ? shot.subtitleKo : shot.subtitleEn}
                          </span>
                          <span className="text-[10px] text-zinc-500 font-mono">Real Production</span>
                        </div>

                        <h3 className={`font-black text-base ${isNight ? 'text-white' : 'text-zinc-900'}`}>
                          {isKo ? shot.titleKo : shot.titleEn}
                        </h3>

                        <p className={`text-xs leading-relaxed ${isNight ? 'text-zinc-400' : 'text-zinc-600'}`}>
                          {isKo ? shot.descKo : shot.descEn}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>

        {/* ========================================================================= */}
        {/* 7. EMBEDDED ACADEMY ONBOARDING FORM (#onboarding-form) */}
        {/* ========================================================================= */}
        <section id="onboarding-form" className="space-y-8 pt-8">
          <div
            className={`p-8 md:p-12 rounded-3xl border max-w-4xl mx-auto w-full space-y-8 ${
              isNight ? 'bg-gradient-to-b from-[#0a0a0c] to-[#050505] border-white/10' : 'bg-white border-zinc-200 shadow-xl'
            }`}
          >
            <div className="text-center space-y-3">
              <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest block font-mono">
                CUSTOM ACADEMY ONBOARDING
              </span>
              <h2 className="font-display text-2xl sm:text-4xl font-black tracking-tight">
                {t.onboardingForm.heading}
              </h2>
              <p className={`text-xs sm:text-sm max-w-2xl mx-auto leading-relaxed ${isNight ? 'text-zinc-400' : 'text-zinc-600'}`}>
                {t.onboardingForm.subheading}
              </p>
            </div>

            {submitted ? (
              <div className="p-8 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto text-3xl">
                  🎉
                </div>
                <h3 className="font-black text-xl text-white">{t.onboardingForm.successTitle}</h3>
                <p className="text-xs sm:text-sm text-zinc-300 max-w-lg mx-auto leading-relaxed">
                  {t.onboardingForm.successMessage}
                </p>
              </div>
            ) : (
              <form onSubmit={handleFormSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-400 block">{t.onboardingForm.directorName} *</label>
                  <input
                    type="text"
                    required
                    value={directorName}
                    onChange={(e) => setDirectorName(e.target.value)}
                    className={`w-full p-3.5 rounded-xl border text-xs focus:outline-none focus:border-orange-500 ${
                      isNight ? 'bg-[#050505] border-white/10 text-white' : 'bg-zinc-50 border-zinc-300 text-zinc-900'
                    }`}
                    placeholder="김원장"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-400 block">{t.onboardingForm.academyName} *</label>
                  <input
                    type="text"
                    required
                    value={academyName}
                    onChange={(e) => setAcademyName(e.target.value)}
                    className={`w-full p-3.5 rounded-xl border text-xs focus:outline-none focus:border-orange-500 ${
                      isNight ? 'bg-[#050505] border-white/10 text-white' : 'bg-zinc-50 border-zinc-300 text-zinc-900'
                    }`}
                    placeholder="청담 이스트 어학원"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-400 block">{t.onboardingForm.phone} *</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={`w-full p-3.5 rounded-xl border text-xs focus:outline-none focus:border-orange-500 ${
                      isNight ? 'bg-[#050505] border-white/10 text-white' : 'bg-zinc-50 border-zinc-300 text-zinc-900'
                    }`}
                    placeholder="010-1234-5678"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-400 block">{t.onboardingForm.email} *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`w-full p-3.5 rounded-xl border text-xs focus:outline-none focus:border-orange-500 ${
                      isNight ? 'bg-[#050505] border-white/10 text-white' : 'bg-zinc-50 border-zinc-300 text-zinc-900'
                    }`}
                    placeholder="director@academy.com"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-400 block">{t.onboardingForm.location}</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className={`w-full p-3.5 rounded-xl border text-xs focus:outline-none focus:border-orange-500 ${
                      isNight ? 'bg-[#050505] border-white/10 text-white' : 'bg-zinc-50 border-zinc-300 text-zinc-900'
                    }`}
                    placeholder="서울 강남구 대치동"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-400 block">{t.onboardingForm.currentMethod}</label>
                  <input
                    type="text"
                    value={currentMethod}
                    onChange={(e) => setCurrentMethod(e.target.value)}
                    className={`w-full p-3.5 rounded-xl border text-xs focus:outline-none focus:border-orange-500 ${
                      isNight ? 'bg-[#050505] border-white/10 text-white' : 'bg-zinc-50 border-zinc-300 text-zinc-900'
                    }`}
                    placeholder="카카오 알림톡 / 종이 성적표 / 전화 상담"
                  />
                </div>

                <div className="md:col-span-2 pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white font-black text-sm rounded-2xl shadow-xl shadow-orange-500/25 transition-all active:scale-[0.98] cursor-pointer"
                  >
                    {isSubmitting ? t.onboardingForm.submitting : t.onboardingForm.submitBtn}
                  </button>
                </div>
              </form>
            )}
          </div>
        </section>
      </main>

      {/* ========================================================================= */}
      {/* 8. POP-UP MODAL OVERLAY (`showModal`) */}
      {/* ========================================================================= */}
      {showModal && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 overflow-y-auto bg-black/80 backdrop-blur-md">
          <div
            className={`w-full max-w-xl p-6 sm:p-8 rounded-3xl border shadow-2xl relative transition-all ${
              isNight ? 'bg-[#0a0a0c] border-white/15 text-white' : 'bg-white border-zinc-200 text-zinc-900'
            }`}
          >
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-white/10 transition-colors"
            >
              <X size={20} />
            </button>

            <div className="mb-6 space-y-1">
              <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest font-mono block">
                CHEKKI ACADEMY ONBOARDING
              </span>
              <h3 className="font-display text-2xl font-black">{t.onboardingForm.modalTitle}</h3>
              <p className={`text-xs ${isNight ? 'text-zinc-400' : 'text-zinc-600'}`}>
                {t.onboardingForm.modalSubtitle}
              </p>
            </div>

            {submitted ? (
              <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-3">
                <span className="text-3xl block">🎉</span>
                <h4 className="font-black text-lg text-white">{t.onboardingForm.successTitle}</h4>
                <p className="text-xs text-zinc-300 leading-relaxed">{t.onboardingForm.successMessage}</p>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="mt-4 px-6 py-2.5 bg-emerald-500 text-white font-bold text-xs rounded-xl"
                >
                  닫기 (Close)
                </button>
              </div>
            ) : (
              <form onSubmit={handleFormSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-400 block">{t.onboardingForm.directorName} *</label>
                    <input
                      type="text"
                      required
                      value={directorName}
                      onChange={(e) => setDirectorName(e.target.value)}
                      className={`w-full p-3 rounded-xl border text-xs focus:outline-none ${
                        isNight ? 'bg-[#050505] border-white/10 text-white' : 'bg-zinc-50 border-zinc-300 text-zinc-900'
                      }`}
                      placeholder="김원장"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-400 block">{t.onboardingForm.academyName} *</label>
                    <input
                      type="text"
                      required
                      value={academyName}
                      onChange={(e) => setAcademyName(e.target.value)}
                      className={`w-full p-3 rounded-xl border text-xs focus:outline-none ${
                        isNight ? 'bg-[#050505] border-white/10 text-white' : 'bg-zinc-50 border-zinc-300 text-zinc-900'
                      }`}
                      placeholder="청담 이스트 어학원"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-400 block">{t.onboardingForm.phone} *</label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className={`w-full p-3 rounded-xl border text-xs focus:outline-none ${
                        isNight ? 'bg-[#050505] border-white/10 text-white' : 'bg-zinc-50 border-zinc-300 text-zinc-900'
                      }`}
                      placeholder="010-1234-5678"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-400 block">{t.onboardingForm.email} *</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`w-full p-3 rounded-xl border text-xs focus:outline-none ${
                        isNight ? 'bg-[#050505] border-white/10 text-white' : 'bg-zinc-50 border-zinc-300 text-zinc-900'
                      }`}
                      placeholder="director@academy.com"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 bg-orange-500 hover:bg-orange-600 text-white font-black text-xs rounded-xl shadow-lg transition-all cursor-pointer active:scale-95 mt-2"
                >
                  {isSubmitting ? t.onboardingForm.submitting : t.onboardingForm.submitBtn}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
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

              <div className="flex items-center gap-2 shrink-0 font-mono text-[11px] text-zinc-500">
                <span>Use ← → Arrow Keys to Navigate</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
