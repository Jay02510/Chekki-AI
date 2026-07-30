import React, { useState, useEffect } from 'react';
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
  List
} from '@phosphor-icons/react';
import { NativeCurriculumPreseed } from '../components/NativeCurriculumPreseed';
import { NativeDirectorPortal } from '../components/NativeDirectorPortal';
import { NativeKtDashboard } from '../components/NativeKtDashboard';
import { NativeTeacherLogForm } from '../components/NativeTeacherLogForm';
import { NativeSchoolPackageFlow } from '../components/NativeSchoolPackageFlow';

interface Props {
  isNight: boolean;
  setIsNight: (val: boolean) => void;
}

const PRICING_TIERS = {
  trial: {
    id: 'trial',
    nameEn: '7-Day Free Teacher Trial',
    nameKo: '7일 무료 학원 체험',
    monthly: { krw: 0, usd: 0 },
    yearly: { krw: 0, usd: 0 },
    minSeats: 1,
    defaultTeachers: 1
  },
  solo: {
    id: 'solo',
    nameEn: 'Solo Tutor & Study Room (1 Seat)',
    nameKo: '공부방 / 개인 교습소 (1석 단독)',
    monthly: { krw: 39000, usd: 29 },
    yearly: { krw: 31000, usd: 23 },
    minSeats: 1,
    defaultTeachers: 1
  },
  starter: {
    id: 'starter',
    nameEn: 'Starter Academy Pack (Micro-School)',
    nameKo: '스타터 학원 패키지 (소형 어학원)',
    monthly: { krw: 69000, usd: 49 },
    yearly: { krw: 55000, usd: 39 },
    minSeats: 1,
    defaultTeachers: 3
  },
  school_pro: {
    id: 'school_pro',
    nameEn: 'Chekki Master School Pro (All-in-One Bundle)',
    nameKo: '체키 마스터 스쿨 프로 (완전 통합 패키지)',
    monthly: { krw: 290000, usd: 220 },
    yearly: { krw: 232000, usd: 175 },
    minSeats: 5,
    defaultTeachers: 10
  },
  enterprise: {
    id: 'enterprise',
    nameEn: 'Large Academy & Franchise',
    nameKo: '대형 학원 & 프랜차이즈 네트워크',
    monthly: { krw: 590000, usd: 450 },
    yearly: { krw: 472000, usd: 360 },
    minSeats: 10,
    defaultTeachers: 20
  }
};

const SchoolsLandingPage: React.FC<Props> = ({ isNight, setIsNight }) => {
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
  const [schoolDemoTab, setSchoolDemoTab] = useState<'syllabus' | 'ft-log' | 'director'>('syllabus');

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
  }, [mobileMenuOpen]);

  // State for form inputs
  const [academyName, setAcademyName] = useState('');
  const [contactName, setContactName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [currency, setCurrency] = useState<'KRW' | 'USD'>('KRW');
  const [showBankModal, setShowBankModal] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('school_pro');
  const [teacherCount, setTeacherCount] = useState(3);
  const [studentCount, setStudentCount] = useState('');
  const [bizRegNumber, setBizRegNumber] = useState('');
  const [invoiceResult, setInvoiceResult] = useState<any>(null);
  const [isRequestingInvoice, setIsRequestingInvoice] = useState(false);
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

  const handleTeacherCountChange = (count: number) => {
    const safeCount = Math.max(1, count);
    setTeacherCount(safeCount);
    
    if (safeCount <= 3) {
      setSelectedPlanId('report_studio');
    } else if (safeCount <= 10) {
      setSelectedPlanId('school_pro');
    } else {
      setSelectedPlanId('enterprise');
    }
  };

  const openPlanModal = (planId: string, defaultTeachers: number, minSeats: number = 1) => {
    setSelectedPlanId(planId);
    setTeacherCount(defaultTeachers);
    setInvoiceResult(null);
    setShowBankModal(true);
  };

  const handleRequestBankInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!academyName || !contactName || !email) return;
    setIsRequestingInvoice(true);
    const unitPrice = getPlanUnitPrice(selectedPlanId, billingCycle);
    const months = billingCycle === 'yearly' ? 12 : 1;
    const totalAmount = selectedPlanId === 'trial' ? 0 : unitPrice * months;
    try {
      const res = await fetch('/api/request-school-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          academyName,
          contactName,
          email,
          phone,
          bizRegNumber,
          planId: selectedPlanId,
          planName: isKo ? activePlan.nameKo : activePlan.nameEn,
          teacherCount,
          studentCount,
          billingCycle,
          unitPrice,
          months,
          totalAmount,
        }),
      });
      const data = await res.json();
      if (res.ok && data.invoice) {
        setInvoiceResult({
          ...data.invoice,
          academyName: academyName,
          email: email,
          teacherCount: teacherCount,
          studentCount: studentCount,
          billingCycle: billingCycle,
          months: months,
          totalAmount: data.invoice?.totalAmount || totalAmount,
          invoiceId: data.invoice?.invoiceId || `INV-${Math.floor(100000 + Math.random() * 900000)}`
        });
      } else {
        throw new Error(data.error || 'Server response error');
      }
    } catch (err: any) {
      console.warn('Invoice request fallback to local confirmation:', err);
      setInvoiceResult({
        invoiceId: `INV-${Math.floor(100000 + Math.random() * 900000)}`,
        academyName: academyName,
        email: email,
        teacherCount: teacherCount,
        studentCount: studentCount,
        billingCycle: billingCycle,
        months: months,
        totalAmount: totalAmount,
        status: 'pending_payment'
      });
    } finally {
      setIsRequestingInvoice(false);
    }
  };

  return (
    <div className={`min-h-screen ${isNight ? 'bg-[#030305] text-zinc-100' : 'bg-[#F8FAFC] text-zinc-900'} font-sans transition-colors duration-200 relative overflow-hidden flex flex-col`}>
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
              className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 transition-all cursor-pointer ${
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
              className={`p-2 rounded-full border transition-colors cursor-pointer ${
                isNight 
                  ? 'border-white/10 hover:bg-white/10 text-white/70 hover:text-white' 
                  : 'border-slate-300 hover:bg-slate-100 text-slate-700 hover:text-slate-900'
              }`}
              title="Toggle Light / Dark Mode"
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
              <span>{isKo ? '교사용 로그인' : 'Teacher Portal'}</span>
            </a>
          </div>

          {/* Mobile Hamburger Morph */}
          <button
            className={`md:hidden relative w-9 h-9 flex items-center justify-center rounded-full outline-none ${
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
          <span className="text-[10px] sm:text-xs font-black text-orange-500 uppercase tracking-[0.25em] mb-4 block">
            {isKo ? '전국 어학원·영유 전용 AI 자동 채점 & 학부모 리포트 플랫폼' : 'AUTOMATED ACADEMY GRADING & PARENT CARE'}
          </span>

          {/* Headline */}
          <h1 className={`font-display text-3xl sm:text-5xl md:text-5xl lg:text-6xl font-black tracking-tight leading-[1.08] mb-6 text-balance ${isNight ? 'text-white' : 'text-zinc-900'} break-keep`}>
            {isKo ? (
              <>강사 행정 업무 <span className="text-orange-500">90% 감축</span>,<br />학부모 피드백 만족도 <span className="text-orange-500">200% 상승</span>.</>
            ) : (
              <>Cut Grading Admin by <span className="text-orange-500">90%</span>.<br />Delight Parents with <span className="text-orange-500">Instant AI Reports</span>.</>
            )}
          </h1>

          {/* Subtext */}
          <p className={`text-base sm:text-lg max-w-xl leading-relaxed mb-8 ${isNight ? 'text-zinc-400' : 'text-zinc-600'} break-keep`}>
            {isKo 
              ? '교재 PDF/이미지 등록 한 번으로 끝. 3초 원생 손글씨 채점부터 매월 칭찬 성장 리포트 자동 발송까지, 선생님의 단순 채점·행정 업무를 완벽히 자동화하세요.'
              : 'Upload weekly textbooks once, autograde student handwriting in 3 seconds, and deliver encouraging progress reports to parents in 1 click.'}
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto justify-center md:justify-start items-center">
            <a
              href="#demo"
              className="w-full sm:w-auto px-8 py-4 bg-orange-500 hover:bg-orange-600 text-white font-black text-sm rounded-3xl shadow-lg transition-all active:scale-[0.97] flex items-center justify-center gap-2 group cursor-pointer"
            >
              <span>{isKo ? '7일 무료 원장님 체험 시작하기' : 'Start 7-Day Free Academy Trial'}</span>
              <ArrowRight size={16} weight="bold" className="group-hover:translate-x-1 transition-transform" />
            </a>
            <a
              href="/reports"
              onClick={(e) => {
                e.preventDefault();
                window.location.href = '/reports';
              }}
              className={`w-full sm:w-auto px-8 py-4 font-black text-sm rounded-3xl border transition-all active:scale-[0.97] text-center ${
                isNight 
                  ? 'bg-white/5 border-white/10 hover:bg-white/10 text-white' 
                  : 'bg-white border-zinc-300 hover:bg-zinc-50 text-zinc-900 shadow-sm'
              }`}
            >
              {isKo ? '리포트 스튜디오 체험' : 'Try Report Studio'}
            </a>
          </div>
        </div>

        {/* Right: Teacher Mascot Image Side (Holding Laptop) */}
        <div className="flex-1 w-full flex justify-center items-center relative z-10 md:-translate-x-4">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[380px] md:max-w-[460px] aspect-square bg-orange-500/15 rounded-full blur-[90px] pointer-events-none" />
          <img
            src="https://res.cloudinary.com/dginphpy4/image/upload/e_background_removal,f_png/v1784647907/Chekki_Holding_Laptop_2_vhwcgy.jpg"
            alt="Chekki AI Mascot holding laptop"
            className="w-full max-w-[340px] sm:max-w-[400px] md:max-w-[460px] h-auto object-contain drop-shadow-[0_20px_50px_rgba(249,115,22,0.3)] relative z-10 hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        </div>
      </section>

      {/* --- CHEKKI SCHOOL PACKAGE 3-STEP FLOW INTERACTIVE PREVIEW --- */}
      <section id="demo" className="py-12 md:py-16 px-4 md:px-8 max-w-7xl mx-auto w-full">
        <NativeSchoolPackageFlow isNight={isNight} isKo={isKo} />
      </section>

      {/* --- BENTO GRID FEATURES --- */}
      <section className="py-16 md:py-24 px-4 md:px-8 max-w-7xl mx-auto w-full">
        <div className="mb-12 text-center">
          <h2 className={`font-display text-2xl sm:text-4xl font-black tracking-tight mb-4 ${isNight ? 'text-white' : 'text-zinc-900'}`}>
            {isKo ? '선생님의 대표적인 고충을 해결하는 AI 자동화 기능' : 'Solving Top Teacher Painpoints With AI Automation'}
          </h2>
          <p className={`text-sm md:text-base max-w-2xl mx-auto ${isNight ? 'text-zinc-400' : 'text-zinc-600'}`}>
            {isKo 
              ? '마우스를 올려 카드별 선생님의 고충과 채키의 명확한 해결책을 확인해보세요.' 
              : 'Hover over any card below to see how Chekki solves top teacher painpoints.'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Bento Cell 1: Curriculum Pre-seeding (Spans 2 columns) */}
          <div className={`md:col-span-2 p-6 md:p-8 border rounded-3xl flex flex-col justify-between transition-all duration-500 ${
            isNight 
              ? 'bg-[#050505] border-white/10 hover:border-orange-500/50 hover:bg-[#0F0814]' 
              : 'bg-white border-zinc-200/90 hover:border-orange-500/50 hover:bg-orange-50/40 shadow-sm'
          } group relative overflow-hidden cursor-pointer min-h-[280px]`}>
            <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500">
                    <GraduationCap size={20} weight="bold" />
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                    isNight ? 'bg-orange-500/20 text-orange-300 border-orange-500/30' : 'bg-orange-100 text-orange-700 border-orange-200'
                  }`}>
                    Hover Solution
                  </span>
                </div>

                {/* Content Container - Grid Stack */}
                <div className="grid grid-cols-1 grid-rows-1 my-2 relative z-10">
                  {/* Default View: Teacher Painpoint */}
                  <div className="col-start-1 row-start-1 transition-all duration-500 ease-out group-hover:opacity-0 group-hover:-translate-y-1 group-hover:pointer-events-none">
                    <span className="text-[10px] font-bold text-orange-500 uppercase tracking-widest block mb-1">Teacher Painpoint</span>
                    <h3 className={`font-display text-lg md:text-xl font-black mb-2 ${isNight ? 'text-white' : 'text-zinc-900'}`}>
                      {isKo 
                        ? '"매주 학급별 주간 단어, 파닉스, 정답지를 일일이 타이핑하느라 야근하시나요?"' 
                        : '"Exhausted by manually typing weekly active vocabulary lists, phonics targets, and answer keys?"'}
                    </h3>
                    <p className={`text-xs md:text-sm leading-relaxed ${isNight ? 'text-zinc-400' : 'text-zinc-600'}`}>
                      {isKo 
                        ? '수업 준비만으로도 바쁜데 정답지 입력에 매주 몇 시간씩 허비되는 대표적인 선생님 행정 스트레스.'
                        : 'Teachers waste hours typing answer keys each week instead of focusing on student interactions.'}
                    </p>
                  </div>

                  {/* Hover View: Chekki Solution */}
                  <div className="col-start-1 row-start-1 transition-all duration-500 ease-out opacity-0 translate-y-1 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto">
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block mb-1">Chekki Solution</span>
                    <h3 className={`font-display text-lg md:text-xl font-black mb-2 ${isNight ? 'text-orange-400' : 'text-orange-600'}`}>
                      {isKo ? '다중 교재 AI 스캔 & 페이지별 픽앤치즈 (99.9% 정밀 채점)' : 'Multi-Page AI Unit Scan & Page Picker (99.9% Accuracy)'}
                    </h3>
                    <p className={`text-xs md:text-sm leading-relaxed ${isNight ? 'text-zinc-300' : 'text-zinc-700'}`}>
                      {isKo 
                        ? '단원 전체 사진이나 PDF(최대 5장)를 한 번에 드롭하세요! AI가 페이지별로 단어, 파닉스, 정답 가이드를 추출하며 픽앤치즈 서랍에서 원하는 항목만 1클릭 적용합니다.'
                        : 'Drop up to 5 textbook photos or unit PDFs at once. Gemini AI extracts vocabulary, phonics rules, and parent answer keys page-by-page with interactive 1-click chip controls.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Side image container */}
              <div className="w-full md:w-1/2 flex justify-center items-center overflow-hidden rounded-2xl p-2">
                <img 
                  src={isNight ? "/assets/schools/schools_bento_curriculum.png" : "/assets/schools/schools_bento_curriculum_light.png"} 
                  alt="Curriculum seeding interface" 
                  className="w-full h-auto object-cover rounded-xl group-hover:scale-[1.03] transition-all duration-500 ease-out filter drop-shadow-md" 
                  loading="lazy" 
                />
              </div>
            </div>

            <div className={`mt-6 pt-4 border-t ${isNight ? 'border-white/10' : 'border-zinc-100'} flex items-center gap-2 text-xs font-bold text-orange-500`}>
              <span>{isKo ? '다중 페이지 AI 스캔 & 1클릭 칩 조작으로 교인 작성 시간 95% 단축' : 'Multi-page AI unit scans cut curriculum setup time by 95%'}</span>
              <Sparkle size={12} weight="bold" />
            </div>
          </div>

          {/* Bento Cell 2: Roster approvals (1 column) */}
          <div className={`p-6 md:p-8 border rounded-3xl flex flex-col justify-between transition-all duration-500 ${
            isNight 
              ? 'bg-[#050505] border-white/10 hover:border-purple-500/50 hover:bg-[#0F0814]' 
              : 'bg-white border-zinc-200/90 hover:border-purple-500/50 hover:bg-purple-50/40 shadow-sm'
          } group relative overflow-hidden cursor-pointer min-h-[280px]`}>
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-500">
                  <Users size={20} weight="bold" />
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                  isNight ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' : 'bg-purple-100 text-purple-700 border-purple-200'
                }`}>
                  Hover Solution
                </span>
              </div>

              {/* Content Container - Grid Stack */}
              <div className="grid grid-cols-1 grid-rows-1 my-2 relative z-10">
                {/* Default View: Teacher Painpoint */}
                <div className="col-start-1 row-start-1 transition-all duration-500 ease-out group-hover:opacity-0 group-hover:-translate-y-1 group-hover:pointer-events-none">
                  <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest block mb-1">Teacher Painpoint</span>
                  <h3 className={`font-display text-lg font-black mb-2 ${isNight ? 'text-white' : 'text-zinc-900'}`}>
                    {isKo 
                      ? '"매일 학생별 숙제 제출 여부를 일일이 확인하고 챙기느라 지치셨나요?"' 
                      : '"Tired of chasing parents individually to track daily homework completion?"'}
                  </h3>
                </div>

                {/* Hover View: Chekki Solution */}
                <div className="col-start-1 row-start-1 transition-all duration-500 ease-out opacity-0 translate-y-1 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block mb-1">Chekki Solution</span>
                  <h3 className={`font-display text-lg font-black mb-2 ${isNight ? 'text-purple-300' : 'text-purple-600'}`}>
                    {isKo ? '6자리 코드로 가정 숙제 자동 연동' : '6-Digit Join Code & Auto-Sync'}
                  </h3>
                  <p className={`text-xs sm:text-sm leading-relaxed ${isNight ? 'text-zinc-300' : 'text-zinc-700'}`}>
                    {isKo 
                      ? '학부모가 6자리 학급 코드만 입력하면 끝. 집에서 스캔한 빨간 테두리 오답과 점수가 교사 대시보드로 실시간 자동 전송됩니다.'
                      : 'Parents enter a 6-letter class code once. Homework scans & mistake data silently sync straight to your teacher dashboard.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Clean image container */}
            <div className="mt-6 w-full flex justify-center items-center overflow-hidden rounded-2xl p-2">
              <img 
                src={isNight ? "/assets/schools/schools_bento_join_code.png" : "/assets/schools/schools_bento_join_code_light.png"} 
                alt="Class join code entry UI" 
                className="w-full max-w-[280px] h-auto object-contain rounded-xl group-hover:scale-[1.03] transition-all duration-500 ease-out filter drop-shadow-md" 
                loading="lazy" 
              />
            </div>
          </div>

          {/* Bento Cell 3: Analytics (1 column) */}
          <div className={`p-6 md:p-8 border rounded-3xl flex flex-col justify-between transition-all duration-500 ${
            isNight 
              ? 'bg-[#050505] border-white/10 hover:border-orange-500/50 hover:bg-[#0F0814]' 
              : 'bg-white border-zinc-200/90 hover:border-orange-500/50 hover:bg-orange-50/40 shadow-sm'
          } group relative overflow-hidden cursor-pointer min-h-[280px]`}>
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500">
                  <ChartBar size={20} weight="bold" />
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                  isNight ? 'bg-orange-500/20 text-orange-300 border-orange-500/30' : 'bg-orange-100 text-orange-700 border-orange-200'
                }`}>
                  Hover Solution
                </span>
              </div>

              {/* Content Container - Grid Stack */}
              <div className="grid grid-cols-1 grid-rows-1 my-2 relative z-10">
                {/* Default View: Teacher Painpoint */}
                <div className="col-start-1 row-start-1 transition-all duration-500 ease-out group-hover:opacity-0 group-hover:-translate-y-1 group-hover:pointer-events-none">
                  <span className="text-[10px] font-bold text-orange-500 uppercase tracking-widest block mb-1">Teacher Painpoint</span>
                  <h3 className={`font-display text-lg font-black mb-2 ${isNight ? 'text-white' : 'text-zinc-900'}`}>
                    {isKo 
                      ? '"아이들이 집에서 혼자 숙제할 때 어떤 파닉스와 단어에서 막히는지 파악하기 어려우셨나요?"' 
                      : '"Blind to where students struggle during home practice until test day?"'}
                  </h3>
                </div>

                {/* Hover View: Chekki Solution */}
                <div className="col-start-1 row-start-1 transition-all duration-500 ease-out opacity-0 translate-y-1 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto">
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

            {/* Clean image container */}
            <div className="mt-6 w-full flex justify-center items-center overflow-hidden rounded-2xl p-2">
              <img 
                src={isNight ? "/assets/schools/schools_bento_diagnostics.png" : "/assets/schools/schools_bento_diagnostics_light.png"} 
                alt="Classroom diagnostics dashboard" 
                className="w-full max-w-[280px] h-auto object-contain rounded-xl group-hover:scale-[1.03] transition-all duration-500 ease-out filter drop-shadow-md" 
                loading="lazy" 
              />
            </div>
          </div>

          {/* Bento Cell 4: Parent Sync (Spans 2 columns) */}
          <div className={`md:col-span-2 p-6 md:p-8 border rounded-3xl transition-all duration-500 ${
            isNight 
              ? 'bg-[#050505] border-white/10 hover:border-pink-500/50 hover:bg-[#0F0814]' 
              : 'bg-white border-zinc-200/90 hover:border-pink-500/50 hover:bg-pink-50/40 shadow-sm'
          } group relative overflow-hidden cursor-pointer min-h-[280px]`}>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 items-center">
              <div className="md:col-span-7 flex flex-col justify-between h-full">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-500">
                      <Sparkle size={20} weight="bold" />
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                      isNight ? 'bg-pink-500/20 text-pink-300 border-pink-500/30' : 'bg-pink-100 text-pink-700 border-pink-200'
                    }`}>
                      Hover Solution
                    </span>
                  </div>

                  {/* Content Container - Grid Stack */}
                  <div className="grid grid-cols-1 grid-rows-1 my-2 relative z-10">
                    {/* Default View: Teacher Painpoint */}
                    <div className="col-start-1 row-start-1 transition-all duration-500 ease-out group-hover:opacity-0 group-hover:-translate-y-1 group-hover:pointer-events-none">
                      <span className="text-[10px] font-bold text-pink-500 uppercase tracking-widest block mb-1">Teacher Painpoint</span>
                      <h3 className={`font-display text-lg md:text-xl font-black mb-2 ${isNight ? 'text-white' : 'text-zinc-900'}`}>
                        {isKo 
                          ? '"매월 학부모 평가서 작성에 10시간 넘는 행정 시간을 쓰느라 스트레스 받으시나요?"' 
                          : '"Dread spending 5-10+ hours every month writing manual parent evaluation report cards?"'}
                      </h3>
                    </div>

                    {/* Hover View: Chekki Solution */}
                    <div className="col-start-1 row-start-1 transition-all duration-500 ease-out opacity-0 translate-y-1 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto">
                      <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block mb-1">Chekki Solution</span>
                      <h3 className={`font-display text-lg md:text-xl font-black mb-2 ${isNight ? 'text-pink-400' : 'text-pink-600'}`}>
                        {isKo ? '1초 만에 자동 생성되는 학부모 칭찬 & 성장 리포트' : '1-Click Parent Growth & Progress Report Cards'}
                      </h3>
                      <p className={`text-xs md:text-sm leading-relaxed ${isNight ? 'text-zinc-300' : 'text-zinc-700'}`}>
                        {isKo 
                          ? '가정 스캔 데이터를 기반으로 아이의 긍정적 성장과 칭찬 포인트가 담긴 PDF 리포트를 1초 만에 학부모님께 발송하세요.'
                          : 'Eliminate 5-10 hours a month of manual report writing. Chekki auto-compiles home scan data into encouraging growth reports in 1 click.'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className={`pt-3 border-t ${isNight ? 'border-white/10' : 'border-zinc-100'} flex items-center gap-1.5 text-xs font-bold text-pink-500 mt-6`}>
                  <CheckCircle size={14} weight="bold" />
                  <span>{isKo ? '선생님 행정 부담 90% 감소 & 재원율 증가' : 'Reduces teacher admin work by 90% & boosts retention'}</span>
                </div>
              </div>

              {/* Clean side image container */}
              <div className="md:col-span-5 flex items-center justify-center overflow-hidden rounded-2xl p-2">
                <img 
                  src={isNight ? "/assets/schools/schools_bento_parent_care_dark.png" : "/assets/schools/schools_bento_parent_care_light.png"} 
                  alt="Parent homework report UI" 
                  className="w-full max-w-[300px] h-auto object-contain rounded-xl group-hover:scale-[1.03] transition-all duration-500 ease-out filter drop-shadow-md" 
                  loading="lazy" 
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- REPORT STUDIO FEATURE SHOWCASE & LIVE DEMO CTA --- */}
      <section className="relative px-6 py-12 max-w-5xl mx-auto w-full">
        <div className={`p-8 md:p-10 border rounded-3xl relative overflow-hidden transition-all duration-500 shadow-xl ${
          isNight 
            ? 'bg-gradient-to-br from-zinc-950 via-zinc-900 to-orange-950/30 border-white/10' 
            : 'bg-gradient-to-br from-white via-orange-50/40 to-white border-zinc-200'
        }`}>
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
            <div className="space-y-4 max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 text-orange-500 border border-orange-500/20 text-xs font-black uppercase tracking-widest">
                <Sparkle size={14} weight="fill" />
                <span>{isKo ? '학부모 상담 알림톡 리포트' : 'Bilingual Parent Updates'}</span>
              </div>

              <h2 className={`font-display text-2xl sm:text-3xl font-black tracking-tight ${isNight ? 'text-white' : 'text-zinc-900'}`}>
                {isKo ? (
                  <>학부모 상담 <span className="text-orange-500">알림톡 대본 리포트</span>를 체험해보세요.</>
                ) : (
                  <>Try <span className="text-orange-500">Chekki Report Generator</span>.</>
                )}
              </h2>

              <p className={`text-xs sm:text-sm leading-relaxed ${isNight ? 'text-zinc-400' : 'text-zinc-600'}`}>
                {isKo 
                  ? '원어민 강사 코멘트를 30초 만에 정갈한 학부모 상담 알림톡 대본으로 변환해보세요.'
                  : 'Turn Foreign Teacher class logs into polished Korean KakaoTalk updates in seconds.'}
              </p>
            </div>

            <div className="shrink-0 w-full md:w-auto">
              <a
                href="/reports"
                onClick={(e) => {
                  e.preventDefault();
                  window.scrollTo({ top: 0, behavior: 'instant' });
                  window.history.pushState({}, '', '/reports');
                  window.dispatchEvent(new PopStateEvent('popstate'));
                }}
                className="w-full md:w-auto px-8 py-4 bg-orange-500 hover:bg-orange-600 text-white font-black text-sm rounded-2xl shadow-lg shadow-orange-500/20 transition-all duration-300 active:scale-[0.97] flex items-center justify-center gap-2 cursor-pointer group"
              >
                <Sparkle size={16} weight="fill" className="group-hover:rotate-12 transition-transform" />
                <span>{isKo ? '리포트 생성기 체험하기 →' : 'Try Report Generator →'}</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* --- REVIEWS / TESTIMONIALS --- */}
      <section className={`py-20 border-t border-b transition-colors ${
        isNight ? 'border-white/5 bg-white/[0.01]' : 'border-zinc-200/80 bg-zinc-100/50'
      }`}>
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className={`font-display text-2xl sm:text-3xl font-black ${isNight ? 'text-white' : 'text-zinc-900'}`}>
              {isKo ? '원장님들과 영어 강사들의 실사용 리뷰' : 'Proven to Save Hours for Teachers Weekly'}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className={`p-6 rounded-2xl border transition-colors ${
              isNight ? 'bg-zinc-950/80 border-white/5' : 'bg-white border-zinc-200/80 shadow-sm'
            }`}>
              <p className={`text-sm leading-relaxed mb-6 font-medium italic ${isNight ? 'text-zinc-300' : 'text-zinc-700'}`}>
                {isKo 
                  ? '"매달 나가는 종이 오답노트 작성 시간이 90% 이상 줄어들었습니다. 아이들의 취약 어휘 통계가 자동으로 모이니 보강 준비가 훨씬 수월해졌고 학부모님들의 피드백 만족도가 정말 대단해요."'
                  : '"Creating monthly review worksheets took forever. Chekki automatically tracks and compiles vocabulary mistakes in the background. Highly recommend it to any academy director."'}
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-500/20 text-orange-500 flex items-center justify-center font-bold text-sm">
                  정
                </div>
                <div>
                  <h4 className={`font-display text-sm font-black ${isNight ? 'text-white' : 'text-zinc-900'}`}>
                    {isKo ? '정유선 원장' : 'Yuseon Jeong'}
                  </h4>
                  <p className={`text-[10px] font-bold uppercase tracking-wider ${isNight ? 'text-zinc-500' : 'text-zinc-500'}`}>
                    {isKo ? '강남 대형 어학원 초등부 원장' : 'Director of Elementary Division'}
                  </p>
                </div>
              </div>
            </div>

            <div className={`p-6 rounded-2xl border transition-colors ${
              isNight ? 'bg-zinc-950/80 border-white/5' : 'bg-white border-zinc-200/80 shadow-sm'
            }`}>
              <p className={`text-sm leading-relaxed mb-6 font-medium italic ${isNight ? 'text-zinc-300' : 'text-zinc-700'}`}>
                {isKo 
                  ? '"숙제 검사에 걸리던 잡무가 완전히 사라졌습니다. 학부모님들께서 스스로 아이의 주간 진도를 앱에서 확인하시고, 승인 처리도 학급 코드로 깔끔하게 끝나서 원생 관리가 편해졌습니다."'
                  : '"Parents check target curriculums on their own app. Approval flow with class codes works beautifully. It saves countless administrative phone calls."'}
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-500/20 text-purple-500 flex items-center justify-center font-bold text-sm">
                  K
                </div>
                <div>
                  <h4 className={`font-display text-sm font-black ${isNight ? 'text-white' : 'text-zinc-900'}`}>
                    {isKo ? 'Kelly Kim 강사' : 'Kelly Kim'}
                  </h4>
                  <p className={`text-[10px] font-bold uppercase tracking-wider ${isNight ? 'text-zinc-500' : 'text-zinc-500'}`}>
                    {isKo ? '초등 영어 파닉스반 담임 교사' : 'Phonics Lead Teacher'}
                  </p>
                </div>
              </div>
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
          <div className={`inline-flex items-center p-1.5 border rounded-full shadow-inner mb-10 transition-colors ${
            isNight ? 'bg-[#0a0a0c] border-white/10' : 'bg-zinc-200/70 border-zinc-300/80'
          }`}>
            <button
              type="button"
              onClick={() => setBillingCycle('monthly')}
              className={`px-5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                billingCycle === 'monthly'
                  ? 'bg-orange-500 text-white shadow-md'
                  : isNight ? 'text-zinc-400 hover:text-white' : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              {isKo ? '월간 결제' : 'Monthly Billing'}
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle('yearly')}
              className={`px-5 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                billingCycle === 'yearly'
                  ? 'bg-orange-500 text-white shadow-md'
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
                🎁
              </div>
              <div>
                <h4 className={`text-sm font-black ${isNight ? 'text-white' : 'text-zinc-900'}`}>
                  {isKo ? '강사 1인 + 원생 30명 7일 무제한 무료 체험' : '7-Day FREE Trial (1 Teacher + Up to 30 Students)'}
                </h4>
                <p className={`text-xs ${isNight ? 'text-zinc-400' : 'text-zinc-600'}`}>
                  {isKo 
                    ? '신용카드 등록 없이 7일간 무료. 학부모는 Chekki 모바일 앱(무료) 다운로드 후 6자리 코드로 연동됩니다.' 
                    : 'No credit card required. 1 Teacher seat + 30 Students for 7 days. Parents download the free Chekki app to sync scans.'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => openPlanModal('trial', 1, 1)}
              className="w-full sm:w-auto px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-black text-xs rounded-xl transition-all shadow-md active:scale-[0.97] whitespace-nowrap cursor-pointer"
            >
              {isKo ? '지금 무료 시작하기' : 'Start Free Trial'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-7xl mx-auto items-stretch">
          {/* Card 1: Starter Academy Pack (3 Seats) */}
          <div 
            onClick={() => openPlanModal('starter', 3, 1)}
            className={`p-6 border rounded-3xl flex flex-col justify-between transition-all cursor-pointer group ${
              isNight 
                ? 'bg-[#050505] border-white/10 hover:border-orange-500/50 hover:bg-zinc-900/30' 
                : 'bg-white border-zinc-200 hover:border-orange-500/50 hover:shadow-xl shadow-sm'
            }`}
          >
            <div>
              <div className="flex justify-between items-center mb-3">
                <span className="px-2.5 py-1 bg-pink-500/10 border border-pink-500/20 text-pink-500 text-[10px] font-black tracking-wider uppercase rounded-full">
                  {isKo ? '스타터 패키지 (소형 어학원)' : 'STARTER ACADEMY PACK'}
                </span>
              </div>
              <h3 className={`text-lg font-black mb-1 ${isNight ? 'text-white' : 'text-zinc-900'}`}>
                {isKo ? '스타터 패키지 (소형 어학원)' : 'Starter Academy Pack (Micro-School)'}
              </h3>
              <div className="mb-3">
                <div className="flex items-baseline gap-1">
                  <span className={`font-display text-3xl font-black ${isNight ? 'text-white' : 'text-zinc-900'}`}>
                    {formatPrice(getPlanUnitPrice('starter', billingCycle))}
                  </span>
                  <span className={`text-[11px] font-bold ${isNight ? 'text-zinc-400' : 'text-zinc-500'}`}>
                    {isKo ? '/월 (캠퍼스당)' : '/month per campus'}
                  </span>
                </div>
                {billingCycle === 'yearly' ? (
                  <p className="text-[11px] font-extrabold text-emerald-500 mt-1">
                    {isKo ? `연간 ${formatPrice(getPlanUnitPrice('starter', 'yearly') * 12)} 일시 청구 (20% 할인)` : `Billed annually at ${formatPrice(getPlanUnitPrice('starter', 'yearly') * 12)}/yr`}
                  </p>
                ) : (
                  <p className={`text-[11px] font-bold mt-1 ${isNight ? 'text-zinc-500' : 'text-zinc-400'}`}>
                    {isKo ? '월간 정기 결제' : 'Billed monthly'}
                  </p>
                )}
              </div>
              <p className={`text-xs mb-5 leading-relaxed ${isNight ? 'text-zinc-400' : 'text-zinc-600'}`}>
                {isKo 
                  ? '원어민/한국인 교사 모바일 평가 폼 & 카카오톡 알림톡 자동 생성을 위한 소형 학원용 패키지.' 
                  : 'Streamlined teacher logs & KakaoTalk report generation for foreign & Korean teachers.'}
              </p>
              <ul className={`space-y-3 text-xs mb-6 border-t pt-4 ${isNight ? 'border-white/5 text-zinc-300' : 'border-zinc-100 text-zinc-700'}`}>
                <li className="flex items-center gap-2">
                  <CheckCircle size={15} weight="bold" className="text-emerald-500 flex-shrink-0" />
                  <span>{isKo ? '교사 계정 최대 3석 (원어민 1명 + 한국인 2명)' : 'Up to 3 Teacher Seats (1 FT + 2 KTs)'}</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={15} weight="bold" className="text-emerald-500 flex-shrink-0" />
                  <span>{isKo ? '30초 원어민 강사 모바일 평가 폼' : '30-Second Foreign Teacher Mobile Log Form'}</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={15} weight="bold" className="text-emerald-500 flex-shrink-0" />
                  <span>{isKo ? '한/영 이중언어 알림톡 대본 자동 생성' : 'Bilingual KakaoTalk Script Generator'}</span>
                </li>
                <li className="flex items-center gap-2 font-bold text-xs text-orange-400">
                  <Sparkle size={15} weight="bold" className="flex-shrink-0" />
                  <span>{isKo ? '한국인 교사 실시간 편집 워크스페이스' : 'Live Editable Textarea for KT Review'}</span>
                </li>
                <li className="flex items-center gap-2 font-bold text-xs text-orange-400">
                  <Sparkle size={15} weight="bold" className="flex-shrink-0" />
                  <span>{isKo ? '학원 맞춤 로고 탑재 PDF 성적표 출력' : 'Custom Academy Logo on PDF Reports'}</span>
                </li>
              </ul>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                openPlanModal('starter', 3, 1);
              }}
              className={`w-full py-3 font-bold text-xs rounded-2xl border text-center transition-all active:scale-[0.98] cursor-pointer ${
                isNight 
                  ? 'bg-white/10 hover:bg-white/15 text-white border-white/10' 
                  : 'bg-zinc-900 hover:bg-zinc-800 text-white border-zinc-900 shadow-sm'
              }`}
            >
              {isKo ? '스타터 패키지 시작' : 'Choose Starter Pack'}
            </button>
          </div>

          {/* Card 2: Chekki School Pro (All-in-One Master Bundle) [MOST POPULAR] */}
          <div 
            onClick={() => openPlanModal('school_pro', 10, 1)}
            className={`p-6 border rounded-3xl flex flex-col justify-between transition-all relative scale-[1.02] cursor-pointer group ${
              isNight 
                ? 'bg-[#0a0705] border-orange-500/80 text-white shadow-2xl shadow-orange-500/10 hover:border-orange-500' 
                : 'bg-gradient-to-b from-orange-500/[0.08] to-white border-2 border-orange-500 text-zinc-900 shadow-xl hover:border-orange-600'
            }`}
          >
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-orange-500 text-white text-[9px] font-black tracking-widest uppercase rounded-full shadow-lg">
              {isKo ? '가장 인기 있는 완전 통합 패키지' : 'MOST POPULAR (ALL-IN-ONE BUNDLE)'}
            </div>
            <div>
              <div className="flex justify-between items-center mb-3 pt-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-orange-500">
                  {isKo ? '완전 통합 어학원 패키지' : 'ALL-IN-ONE SCHOOL PACKAGE'}
                </span>
              </div>
              <h3 className={`text-lg font-black mb-1 ${isNight ? 'text-white' : 'text-zinc-900'}`}>
                {isKo ? '체키 스쿨 프로 (통합 패키지)' : 'Chekki School Pro (Master Bundle)'}
              </h3>
              <div className="mb-3">
                <div className="flex items-baseline gap-1">
                  <span className={`font-display text-3xl font-black ${isNight ? 'text-white' : 'text-zinc-900'}`}>
                    {formatPrice(getPlanUnitPrice('school_pro', billingCycle))}
                  </span>
                  <span className={`text-[11px] font-bold ${isNight ? 'text-zinc-400' : 'text-zinc-500'}`}>
                    {isKo ? '/월 (캠퍼스당)' : '/month per campus'}
                  </span>
                </div>
                {billingCycle === 'yearly' ? (
                  <p className="text-[11px] font-extrabold text-emerald-500 mt-1">
                    {isKo ? `연간 ${formatPrice(getPlanUnitPrice('school_pro', 'yearly') * 12)} 일시 청구 (20% 할인)` : `Billed annually at ${formatPrice(getPlanUnitPrice('school_pro', 'yearly') * 12)}/yr`}
                  </p>
                ) : (
                  <p className={`text-[11px] font-bold mt-1 ${isNight ? 'text-zinc-500' : 'text-zinc-400'}`}>
                    {isKo ? '월간 정기 결제' : 'Billed monthly'}
                  </p>
                )}
              </div>
              <p className={`text-xs mb-5 leading-relaxed ${isNight ? 'text-zinc-400' : 'text-zinc-600'}`}>
                {isKo 
                  ? '교재 목차 선제 탑재, 99.9% 손글씨 AI 채점 & 학부모 앱 연동까지 완벽하게 통합된 학원용 풀 패키지.' 
                  : 'Complete academy package featuring textbook pre-seeding, homework autograding & parent app sync.'}
              </p>
              <ul className={`space-y-2.5 text-xs mb-6 border-t pt-4 ${isNight ? 'border-white/10 text-zinc-300' : 'border-zinc-200 text-zinc-700'}`}>
                <li className="flex items-center gap-2">
                  <CheckCircle size={14} weight="bold" className="text-emerald-500 flex-shrink-0" />
                  <span>{isKo ? '교사 계정 최대 10석 & 학부모 전원 무제한' : 'Up to 10 Teacher Seats & Unlimited Parents'}</span>
                </li>
                <li className="flex items-center gap-2 font-bold text-orange-500">
                  <Sparkle size={14} weight="bold" className="flex-shrink-0" />
                  <span>{isKo ? '리포트 스튜디오의 모든 기능 포함' : 'Includes Everything in Report Studio'}</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={14} weight="bold" className="text-emerald-500 flex-shrink-0" />
                  <span>{isKo ? '1클릭 교재 목차 스캔 & 어휘 선제 탑재' : '1-Click Textbook Syllabus Pre-seeding & Sync'}</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={14} weight="bold" className="text-emerald-500 flex-shrink-0" />
                  <span>{isKo ? '매일 숙제 스캔 & 99.9% AI 손글씨 정밀 채점' : 'Daily Homework Scanning & Autograding'}</span>
                </li>
                <li className="flex items-center gap-2 font-bold text-orange-500">
                  <Sparkle size={14} weight="bold" className="flex-shrink-0" />
                  <span>{isKo ? '학부모 Chekki Pro 앱 무제한 무료 (6자리 코드)' : 'FREE Chekki Pro App for All Parents (via code)'}</span>
                </li>
              </ul>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                openPlanModal('school_pro', 10, 1);
              }}
              className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-2xl text-center shadow-lg shadow-orange-500/20 transition-all active:scale-[0.98] cursor-pointer"
            >
              {isKo ? '체키 스쿨 프로 시작' : 'Choose Chekki School Pro'}
            </button>
          </div>

          {/* Card 3: Large Academy & Franchise (Enterprise) */}
          <div 
            onClick={() => openPlanModal('enterprise', 20, 10)}
            className={`p-6 border rounded-3xl flex flex-col justify-between transition-all cursor-pointer group ${
              isNight 
                ? 'bg-[#050505] border-white/10 hover:border-purple-500/50 hover:bg-zinc-900/30' 
                : 'bg-white border-zinc-200 hover:border-purple-500/50 hover:shadow-xl shadow-sm'
            }`}
          >
            <div>
              <div className="flex justify-between items-center mb-3">
                <span className="px-2.5 py-1 bg-purple-500/10 border border-purple-500/20 text-purple-500 text-[10px] font-black tracking-wider uppercase rounded-full">
                  {isKo ? '대형 학원 & 프랜차이즈' : 'LARGE ACADEMY & FRANCHISE'}
                </span>
              </div>
              <h3 className={`text-lg font-black mb-1 ${isNight ? 'text-white' : 'text-zinc-900'}`}>
                {isKo ? '대형 학원 / 프랜차이즈' : 'Large Academy & Franchise'}
              </h3>
              <div className="mb-3">
                <div className="flex items-baseline gap-1">
                  <span className={`font-display text-3xl font-black ${isNight ? 'text-white' : 'text-zinc-900'}`}>
                    {formatPrice(getPlanUnitPrice('enterprise', billingCycle))}
                  </span>
                  <span className={`text-[11px] font-bold ${isNight ? 'text-zinc-400' : 'text-zinc-500'}`}>
                    {isKo ? '/월 (캠퍼스당)' : '/month per campus'}
                  </span>
                </div>
                {billingCycle === 'yearly' ? (
                  <p className="text-[11px] font-extrabold text-emerald-500 mt-1">
                    {isKo ? `연간 ${formatPrice(getPlanUnitPrice('enterprise', 'yearly') * 12)} 일시 청구 (20% 할인)` : `Billed annually at ${formatPrice(getPlanUnitPrice('enterprise', 'yearly') * 12)}/yr`}
                  </p>
                ) : (
                  <p className={`text-[11px] font-bold mt-1 ${isNight ? 'text-zinc-500' : 'text-zinc-400'}`}>
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
                <li className="flex items-center gap-2 font-bold text-purple-400">
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
                <li className="flex items-center gap-2 font-bold text-purple-400">
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
              className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-2xl text-center transition-all active:scale-[0.98] shadow-md cursor-pointer"
            >
              {isKo ? '맞춤 요금 도입 문의' : 'Contact Enterprise Team'}
            </button>
          </div>
        </div>
      </section>

      {/* --- GET IN TOUCH & CONSULTATION SECTION --- */}
      <section id="demo" className={`py-20 px-6 max-w-4xl mx-auto w-full text-center rounded-3xl my-12 border transition-colors ${
        isNight ? 'bg-gradient-to-b from-zinc-950 to-[#050505] border-white/10' : 'bg-gradient-to-b from-orange-50/70 to-white border-zinc-200 shadow-md'
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

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button
            type="button"
            onClick={() => {
              const pricingEl = document.getElementById('pricing');
              if (pricingEl) pricingEl.scrollIntoView({ behavior: 'smooth' });
              else openPlanModal('medium', 3, 3);
            }}
            className="w-full sm:w-auto px-8 py-4 bg-orange-500 hover:bg-orange-600 text-white font-black text-sm rounded-2xl shadow-lg shadow-orange-500/20 transition-all active:scale-[0.97] flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>{isKo ? '지금 시작하기' : 'Start Now'}</span>
            <ArrowRight size={16} weight="bold" />
          </button>
          <button
            type="button"
            onClick={() => openPlanModal('custom', 1, 1)}
            className={`w-full sm:w-auto px-8 py-4 font-bold text-sm rounded-2xl border transition-all active:scale-[0.97] cursor-pointer ${
              isNight 
                ? 'bg-white/5 hover:bg-white/10 text-white border-white/10' 
                : 'bg-white hover:bg-zinc-50 text-zinc-900 border-zinc-300 shadow-sm'
            }`}
          >
            {isKo ? '1:1 학원 맞춤 상담 신청' : 'Schedule 1:1 Consultation'}
          </button>
        </div>
      </section>

      {/* --- CORPORATE BANK TRANSFER & TAX INVOICE MODAL WITH FULL THEME SUPPORT --- */}
      {showBankModal && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 overflow-y-auto">
          <div 
            className={`fixed inset-0 backdrop-blur-md transition-opacity ${isNight ? 'bg-black/85' : 'bg-zinc-900/60'}`} 
            onClick={() => setShowBankModal(false)} 
          />
          <div className={`relative w-full max-w-lg p-1 border rounded-[2.5rem] shadow-2xl animate-fade-in text-left my-8 transition-colors ${
            isNight ? 'bg-white/5 border-white/10' : 'bg-white/90 border-zinc-200'
          }`}>
            <div className={`rounded-[calc(2.5rem-0.25rem)] p-6 sm:p-8 transition-colors ${
              isNight ? 'bg-[#0c0c0e] text-zinc-200' : 'bg-white text-zinc-900'
            }`}>
              <button
                onClick={() => setShowBankModal(false)}
                className={`absolute top-6 right-6 p-2 rounded-full transition-all active:scale-[0.95] ${
                  isNight 
                    ? 'text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10' 
                    : 'text-zinc-500 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200'
                }`}
              >
                <X size={18} weight="bold" />
              </button>

              {invoiceResult ? (
                /* Invoice Created Confirmation View */
                <div className="space-y-6 animate-fade-in">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
                      <Receipt size={24} weight="bold" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500 font-mono">
                        {isKo ? '신청 접수 완료' : 'APPLICATION SUBMITTED'}
                      </span>
                      <h3 className={`text-xl font-black ${isNight ? 'text-white' : 'text-zinc-900'}`}>
                        {isKo ? '학원 구독 등록 & 입금 안내' : 'Subscription & Setup Requested'}
                      </h3>
                    </div>
                  </div>

                  <p className={`text-xs leading-relaxed p-3.5 rounded-xl border ${
                    isNight 
                      ? 'text-zinc-300 bg-emerald-500/10 border-emerald-500/20' 
                      : 'text-zinc-700 bg-emerald-50 border-emerald-200'
                  }`}>
                    {isKo 
                      ? `✅ 학원 등록 정보가 Chekki AI 운영팀에 성공적으로 전달되었습니다! 아래 지정 계좌로 구독료를 입금해 주시면, 입금 확인 후 입력해주신 이메일(${invoiceResult.email})로 교사 인증 코드 및 사용 가이드가 즉시 발송됩니다.`
                      : `✅ Your academy details have been registered with Chekki AI! Please refer to the bank account details below to complete your subscription payment. Authorization codes will be sent to ${invoiceResult.email}.`}
                  </p>

                  {/* Summary Card */}
                  <div className={`p-5 border rounded-2xl space-y-3 ${
                    isNight ? 'bg-[#050505] border-white/10' : 'bg-zinc-50 border-zinc-200'
                  }`}>
                    <div className={`flex justify-between items-center text-xs pb-3 border-b font-mono ${
                      isNight ? 'border-white/5' : 'border-zinc-200'
                    }`}>
                      <span className={isNight ? 'text-zinc-500' : 'text-zinc-500'}>{isKo ? '신청 코드' : 'Request Ref ID'}:</span>
                      <span className="font-bold text-orange-500">{invoiceResult.invoiceId}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className={isNight ? 'text-zinc-400' : 'text-zinc-600'}>{isKo ? '학원 / 기관명' : 'Academy Name'}:</span>
                      <span className={`font-bold ${isNight ? 'text-white' : 'text-zinc-900'}`}>{invoiceResult.academyName}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className={isNight ? 'text-zinc-400' : 'text-zinc-600'}>{isKo ? '선택 플랜' : 'Selected Plan'}:</span>
                      <span className={`font-bold ${isNight ? 'text-white' : 'text-zinc-900'}`}>{isKo ? activePlan.nameKo : activePlan.nameEn}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className={isNight ? 'text-zinc-400' : 'text-zinc-600'}>{isKo ? '결제 주기' : 'Billing Cycle'}:</span>
                      <span className={`font-bold ${isNight ? 'text-white' : 'text-zinc-900'}`}>
                        {billingCycle === 'yearly' ? (isKo ? '연간 결제 (12개월, 20% 할인 반영)' : 'Yearly (12 Months, 20% Off)') : (isKo ? '월간 결제' : 'Monthly')}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className={isNight ? 'text-zinc-400' : 'text-zinc-600'}>{isKo ? '포함 교사 수' : 'Included Teacher Seats'}:</span>
                      <span className={`font-bold ${isNight ? 'text-white' : 'text-zinc-900'}`}>{activePlan.defaultTeachers || invoiceResult.teacherCount || 10} {isKo ? '명 (전체 캠퍼스)' : 'seats (Campus Bundle)'}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className={isNight ? 'text-zinc-400' : 'text-zinc-600'}>{isKo ? '수신 이메일' : 'Contact Email'}:</span>
                      <span className={`font-bold font-mono ${isNight ? 'text-white' : 'text-zinc-900'}`}>{invoiceResult.email}</span>
                    </div>
                    <div className={`flex justify-between items-center text-sm pt-2 border-t font-bold ${
                      isNight ? 'border-white/5 text-zinc-300' : 'border-zinc-200 text-zinc-700'
                    }`}>
                      <span>{isKo ? '총 입금 금액' : 'Total Payment Amount'}:</span>
                      <span className="text-xl font-black text-emerald-500 font-mono">
                        {formatPrice(getPlanUnitPrice(selectedPlanId, billingCycle) * (billingCycle === 'yearly' ? 12 : 1))}
                      </span>
                    </div>
                  </div>

                  {/* Corporate Bank Account Details */}
                  <div className={`p-5 border rounded-2xl space-y-3 ${
                    isNight ? 'bg-orange-500/10 border-orange-500/30' : 'bg-orange-50 border-orange-200'
                  }`}>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-orange-500 flex items-center gap-1.5 font-mono">
                      <Bank size={14} weight="bold" />
                      <span>{isKo ? '체키AI 입금 계좌 정보' : 'Chekki AI Bank Account Details'}</span>
                    </span>

                    <div className="space-y-1.5 text-xs">
                      <p className={isNight ? 'text-zinc-400' : 'text-zinc-600'}>
                        {isKo ? '은행' : 'Bank'}: <strong className={isNight ? 'text-white' : 'text-zinc-900'}>신한은행 (Shinhan Bank)</strong>
                      </p>
                      <p className={isNight ? 'text-zinc-400' : 'text-zinc-600'}>
                        {isKo ? '예금주' : 'Holder'}: <strong className={isNight ? 'text-white' : 'text-zinc-900'}>BENJAMIN JASON</strong>
                      </p>
                      <div className={`flex items-center justify-between gap-2 pt-2 border-t ${
                        isNight ? 'border-orange-500/20' : 'border-orange-200'
                      }`}>
                        <p className={`font-mono text-lg font-black select-all ${isNight ? 'text-white' : 'text-zinc-900'}`}>110-623-147138</p>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText('110-623-147138');
                            setCopiedBank(true);
                            setTimeout(() => setCopiedBank(false), 2000);
                          }}
                          className="px-3.5 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all active:scale-[0.95] shadow-md cursor-pointer"
                        >
                          <Copy size={14} weight="bold" />
                          <span>{copiedBank ? (isKo ? '복사 완료!' : 'Copied!') : (isKo ? '계좌번호 복사' : 'Copy Account')}</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className={`w-1/3 py-3.5 font-bold text-xs rounded-2xl border transition-all active:scale-[0.98] cursor-pointer ${
                        isNight ? 'bg-white/10 hover:bg-white/15 text-white border-white/10' : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border-zinc-200'
                      }`}
                    >
                      {isKo ? '청구서 인쇄' : 'Print Invoice'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowBankModal(false); setInvoiceResult(null); }}
                      className="w-2/3 py-3.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-2xl shadow-xl shadow-orange-500/20 transition-all active:scale-[0.98] cursor-pointer"
                    >
                      {isKo ? '확인 및 닫기' : 'Done & Close'}
                    </button>
                  </div>
                </div>
              ) : (
                /* Bank Transfer & Onboarding Form */
                <form onSubmit={handleRequestBankInvoice} className="space-y-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-500 flex items-center justify-center flex-shrink-0">
                      <Bank size={20} weight="bold" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-orange-500 uppercase tracking-widest block font-mono">
                        {selectedPlanId === 'trial' 
                          ? (isKo ? '7일 무료 체험 신청 (신용카드 등록 X)' : '7-DAY FREE TRIAL (NO CREDIT CARD)')
                          : (isKo ? 'B2B 플랜 결제 & 세금계산서 청구' : 'B2B TAX INVOICE & PLAN APPLICATION')}
                      </span>
                      <h3 className={`text-xl font-black ${isNight ? 'text-white' : 'text-zinc-900'}`}>
                        {selectedPlanId === 'trial'
                          ? (isKo ? '강사 1인 + 원생 30명 7일 무료 시작' : '1 Teacher + 30 Students 7-Day Free Trial')
                          : (isKo ? `${activePlan.nameKo} 도입 신청` : `${activePlan.nameEn} Subscription`)}
                      </h3>
                      <p className="text-xs text-orange-500 font-bold">
                        {isKo ? '학부모용 Chekki 모바일 앱 100% 무료 포함' : 'Includes 100% FREE Chekki Parent Mobile App'}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 text-left">
                    <div>
                      <label className={`text-[10px] font-bold uppercase tracking-widest pl-1 block mb-1 ${isNight ? 'text-zinc-400' : 'text-zinc-600'}`}>
                        {isKo ? '교육기관명 / 학원명 *' : 'Academy / Organization Name *'}
                      </label>
                      <input
                        type="text"
                        required
                        value={academyName}
                        onChange={(e) => setAcademyName(e.target.value)}
                        placeholder={isKo ? '예: 대치 럭스 어학원 / 영어유치원 서초점' : 'E.g. Apex Seocho / Chekki English Academy'}
                        className={`w-full border focus:border-orange-500 outline-none text-xs p-3.5 rounded-xl transition-all ${
                          isNight 
                            ? 'bg-[#050505] border-white/10 text-white placeholder-zinc-500' 
                            : 'bg-zinc-50 border-zinc-300 text-zinc-900 placeholder-zinc-400 focus:bg-white'
                        }`}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={`text-[10px] font-bold uppercase tracking-widest pl-1 block mb-1 ${isNight ? 'text-zinc-400' : 'text-zinc-600'}`}>
                          {isKo ? '담당자 성함 *' : 'Contact Name *'}
                        </label>
                        <input
                          type="text"
                          required
                          value={contactName}
                          onChange={(e) => setContactName(e.target.value)}
                          placeholder={isKo ? '김민지 원장/선생님' : 'Jane Doe'}
                          className={`w-full border focus:border-orange-500 outline-none text-xs p-3.5 rounded-xl transition-all ${
                            isNight 
                              ? 'bg-[#050505] border-white/10 text-white placeholder-zinc-500' 
                              : 'bg-zinc-50 border-zinc-300 text-zinc-900 placeholder-zinc-400 focus:bg-white'
                          }`}
                        />
                      </div>
                      <div>
                        <label className={`text-[10px] font-bold uppercase tracking-widest pl-1 block mb-1 ${isNight ? 'text-zinc-400' : 'text-zinc-600'}`}>
                          {isKo ? '연락처 (핸드폰) *' : 'Phone Number *'}
                        </label>
                        <input
                          type="tel"
                          required
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="010-0000-0000"
                          className={`w-full border focus:border-orange-500 outline-none text-xs p-3.5 rounded-xl transition-all ${
                            isNight 
                              ? 'bg-[#050505] border-white/10 text-white placeholder-zinc-500' 
                              : 'bg-zinc-50 border-zinc-300 text-zinc-900 placeholder-zinc-400 focus:bg-white'
                          }`}
                        />
                      </div>
                    </div>

                    <div>
                      <label className={`text-[10px] font-bold uppercase tracking-widest pl-1 block mb-1 ${isNight ? 'text-zinc-400' : 'text-zinc-600'}`}>
                        {isKo ? '이메일 (청구서/체험 승인 안내용) *' : 'Contact Email (For Invoice / Trial) *'}
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="teacher@academy.com"
                        className={`w-full border focus:border-orange-500 outline-none text-xs p-3.5 rounded-xl transition-all ${
                          isNight 
                            ? 'bg-[#050505] border-white/10 text-white placeholder-zinc-500' 
                            : 'bg-zinc-50 border-zinc-300 text-zinc-900 placeholder-zinc-400 focus:bg-white'
                        }`}
                      />
                    </div>
                  </div>

                  <p className="text-[10px] text-zinc-500 text-center font-mono">
                    {selectedPlanId === 'trial' 
                      ? (isKo ? '💡 신청 후 1시간 내 이메일/문자로 7일 무료 체험 코드가 발급됩니다.' : 'Trial access code will be emailed within 1 hour after request.')
                      : (isKo ? '💡 신청 접수 후 등록된 이메일로 법인 계좌 정보와 전자 세금계산서가 발송됩니다.' : 'Payment instructions & tax invoice will be sent to your email.')}
                  </p>

                  {selectedPlanId !== 'trial' && getPlanUnitPrice(selectedPlanId, billingCycle) > 0 && (
                    <div className={`p-4 border rounded-2xl space-y-2 mt-2 ${
                      isNight ? 'bg-white/5 border-white/5' : 'bg-zinc-100/70 border-zinc-200'
                    }`}>
                      <div className="flex justify-between items-center text-xs">
                        <span className={isNight ? 'text-zinc-400' : 'text-zinc-600'}>
                          {isKo ? '월 기준 청구 금액 (캠퍼스 패키지)' : 'Monthly Effective Rate'}:
                        </span>
                        <span className="font-bold font-mono">
                          {formatPrice(getPlanUnitPrice(selectedPlanId, billingCycle))} / {isKo ? '월' : 'mo'}
                        </span>
                      </div>
                      {billingCycle === 'yearly' && (
                        <div className="flex justify-between items-center text-xs">
                          <span className={isNight ? 'text-zinc-400' : 'text-zinc-600'}>
                            {isKo ? '결제 주기 (20% 할인 반영)' : 'Billing Cycle (20% Off)'}:
                          </span>
                          <span className="font-bold text-emerald-500 font-mono">
                            {isKo ? '연간 일시 결제 (12개월)' : 'Yearly (12 Months)'}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between items-center text-xs pt-2 border-t border-zinc-200 dark:border-white/10">
                        <span className={`font-black ${isNight ? 'text-white' : 'text-zinc-900'}`}>
                          {isKo 
                            ? (billingCycle === 'yearly' ? '총 연간 청구 금액 (세금계산서)' : '총 월간 청구 금액') 
                            : (billingCycle === 'yearly' ? 'Total Billed (1 Year)' : 'Total Billed (1 Month)')}:
                        </span>
                        <span className="text-lg font-black text-emerald-500 font-mono">
                          {formatPrice(getPlanUnitPrice(selectedPlanId, billingCycle) * (billingCycle === 'yearly' ? 12 : 1))}
                        </span>
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isRequestingInvoice}
                    className="group w-full py-4 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-black text-xs rounded-2xl shadow-xl shadow-orange-500/20 transition-all duration-300 active:scale-[0.97] flex items-center justify-center gap-2 mt-4 cursor-pointer"
                  >
                    {isRequestingInvoice ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>
                          {selectedPlanId === 'trial'
                            ? (isKo ? '7일 무료 체험 시작하기' : 'Start 7-Day Free Trial')
                            : (isKo ? '청구서 발행 및 도입 신청' : 'Submit Plan & Invoice Request')}
                        </span>
                        <ArrowRight size={14} weight="bold" />
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- FOOTER --- */}
      <footer className={`py-12 border-t ${isNight ? 'border-white/5 bg-black/30' : 'border-zinc-200 bg-white'} px-6 text-center transition-colors`}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-xs text-zinc-500 font-medium">
            © {new Date().getFullYear()} ChekkiAI. All rights reserved.
          </p>
          <div className="flex flex-wrap justify-center md:justify-end items-center gap-4 md:gap-6 text-xs text-zinc-500 font-black tracking-wider uppercase">
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
              {isKo ? '메인 서비스로 이동' : 'Main Service'}
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
          </div>
        </div>
      </footer>
    </div>
  );
};

export default SchoolsLandingPage;
