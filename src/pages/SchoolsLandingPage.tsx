import React, { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
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
  Bank,
  Copy,
  Receipt,
  X
} from '@phosphor-icons/react';

interface Props {
  isNight: boolean;
  setIsNight: (val: boolean) => void;
}

const SchoolsLandingPage: React.FC<Props> = ({ isNight, setIsNight }) => {
  const { language, setLanguage } = useLanguage();
  const isKo = language === 'ko';

  // Demo request state
  const [academyName, setAcademyName] = useState('');
  const [contactName, setContactName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [showBankModal, setShowBankModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<{ id: string; nameEn: string; nameKo: string; price: number; minSeats?: number }>({
    id: 'medium',
    nameEn: 'Medium Academy Plan (3-5 Teachers)',
    nameKo: '중형 학원 플랜 (3~5인 강사)',
    price: 39000,
    minSeats: 3
  });
  const [teacherCount, setTeacherCount] = useState(3);
  const [studentCount, setStudentCount] = useState('');
  const [bizRegNumber, setBizRegNumber] = useState('');
  const [invoiceResult, setInvoiceResult] = useState<any>(null);
  const [isRequestingInvoice, setIsRequestingInvoice] = useState(false);
  const [copiedBank, setCopiedBank] = useState(false);

  const openPlanModal = (planId: string, nameEn: string, nameKo: string, price: number, defaultTeachers: number, minSeats: number = 1) => {
    setSelectedPlan({ id: planId, nameEn, nameKo, price, minSeats });
    setTeacherCount(defaultTeachers);
    setInvoiceResult(null);
    setShowBankModal(true);
  };

  const handleRequestBankInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!academyName || !contactName || !email) return;
    setIsRequestingInvoice(true);
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
          planId: selectedPlan.id,
          planName: isKo ? selectedPlan.nameKo : selectedPlan.nameEn,
          teacherCount,
          studentCount,
          billingCycle,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Invoice request failed');
      setInvoiceResult(data.invoice);
    } catch (err: any) {
      alert(err.message || (isKo ? '요청 처리 실패. 다시 시도해주세요.' : 'Request failed. Please try again.'));
    } finally {
      setIsRequestingInvoice(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!academyName || !contactName || !email) return;
    // Trigger the official bank invoice generation modal directly with the entered details
    openPlanModal(
      selectedPlan.id || 'medium',
      selectedPlan.nameEn || 'Medium Academy Plan (3-5 Teachers)',
      selectedPlan.nameKo || '중형 학원 플랜 (3~5인 강사)',
      selectedPlan.price || 39000,
      teacherCount || 3
    );
  };

  return (
    <div className={`min-h-screen ${isNight ? 'bg-[#030305] text-zinc-100' : 'bg-[#F3F4F6] text-zinc-900'} font-sans transition-colors duration-200 relative overflow-hidden flex flex-col`}>
      {/* Background radial glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-orange-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-orange-500/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Mini top bar */}
      <div className={`border-b ${isNight ? 'border-white/5 bg-black/10' : 'border-zinc-200/60 bg-white/60'} py-3 px-6 backdrop-blur-md sticky top-0 z-50`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              window.location.href = '/';
            }}
            className="flex items-center gap-[2px] text-xl font-bold tracking-tighter"
          >
            <span className={isNight ? 'text-white' : 'text-zinc-900'}>Chekki</span>
            <span className="text-orange-500 font-extrabold">ai</span>
            <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ml-2 ${isNight ? 'bg-zinc-800 text-zinc-400' : 'bg-zinc-200/70 text-zinc-600'}`}>
              {isKo ? '교육기관용' : 'Institutions'}
            </span>
          </a>

          <div className="flex items-center gap-3">
            {/* Language toggle */}
            <button
              onClick={() => setLanguage(language === 'ko' ? 'en' : 'ko')}
              className={`px-3 py-1.5 rounded-full text-[10px] font-black border tracking-wider transition-colors ${
                isNight 
                  ? 'border-white/10 hover:bg-white/5 text-zinc-400 hover:text-white' 
                  : 'border-zinc-300 hover:bg-zinc-200 text-zinc-700 hover:text-zinc-900'
              }`}
            >
              {language === 'ko' ? 'ENGLISH' : '한국어'}
            </button>

            {/* Dark mode toggle */}
            <button
              onClick={() => setIsNight(!isNight)}
              className={`p-2 rounded-full border transition-colors ${
                isNight 
                  ? 'border-white/10 hover:bg-white/5 text-zinc-400 hover:text-white' 
                  : 'border-zinc-300 hover:bg-zinc-200 text-zinc-700 hover:text-zinc-900'
              }`}
            >
              {isNight ? <Sun size={14} weight="bold" /> : <Moon size={14} weight="bold" />}
            </button>

            <a
              href="/teacher"
              onClick={(e) => {
                e.preventDefault();
                window.location.href = '/teacher';
              }}
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs px-4 py-2 rounded-full transition-all active:scale-[0.97]"
            >
              {isKo ? '교사용 로그인' : 'Teacher Portal'}
            </a>
          </div>
        </div>
      </div>

      {/* --- HERO SECTION --- */}
      <section className="relative px-6 pt-12 md:pt-20 pb-12 md:pb-16 max-w-7xl mx-auto w-full flex-1 flex flex-col-reverse md:flex-row items-center justify-between gap-10 md:gap-12">
        {/* Text Side */}
        <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left w-full z-10">
          {/* Eyebrow */}
          <span className="text-[10px] sm:text-xs font-black text-orange-500 uppercase tracking-[0.25em] mb-4 block">
            {isKo ? '학원 맞춤형 숙제 분석 플랫폼' : 'AUTOMATED GRADING FOR ACADEMIES'}
          </span>

          {/* Headline */}
          <h1 className={`font-display text-3xl sm:text-5xl md:text-5xl lg:text-6xl font-black tracking-tight leading-[1.08] mb-6 text-balance ${isNight ? 'text-white' : 'text-zinc-900'} break-keep`}>
            {isKo ? (
              <>선생님의 평가는 <span className="text-orange-500">더 섬세하게</span>,<br />학부모 피드백은 <span className="text-orange-500">더 정확하게</span>.</>
            ) : (
              <>Elevate Homework Grading.<br />Engage Parents with <span className="text-orange-500">AI Care</span>.</>
            )}
          </h1>

          {/* Subtext */}
          <p className={`text-base sm:text-lg max-w-xl leading-relaxed mb-8 ${isNight ? 'text-zinc-400' : 'text-zinc-600'} break-keep`}>
            {isKo 
              ? '학원만의 매주 진도 교재와 어휘 단어장을 연동하여 단 3초 만에 원생 손글씨 숙제를 채점하고 오답 리포트를 학부모님께 자동 발송하세요.'
              : 'Integrate your weekly textbooks, autograde student handwriting, and deliver detailed diagnostic reviews straight to parents instantly.'}
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto justify-center md:justify-start items-center">
            <a
              href="#demo"
              className="w-full sm:w-auto px-8 py-4 bg-orange-500 hover:bg-orange-600 text-white font-black text-sm rounded-3xl shadow-lg transition-all active:scale-[0.97] flex items-center justify-center gap-2 group cursor-pointer"
            >
              <span>{isKo ? '학원 도입 및 제휴 신청하기' : 'Request Partnership'}</span>
              <ArrowRight size={16} weight="bold" className="group-hover:translate-x-1 transition-transform" />
            </a>
            <a
              href="/teacher"
              onClick={(e) => {
                e.preventDefault();
                window.location.href = '/teacher';
              }}
              className={`w-full sm:w-auto px-8 py-4 font-black text-sm rounded-3xl border transition-all active:scale-[0.97] text-center ${
                isNight 
                  ? 'bg-white/5 border-white/10 hover:bg-white/10 text-white' 
                  : 'bg-white/80 border-zinc-300 hover:bg-white text-zinc-900 shadow-sm'
              }`}
            >
              {isKo ? '교사용 로그인' : 'Teacher Login'}
            </a>
          </div>
        </div>

        {/* Hero Image Side */}
        <div className="flex-1 w-full flex justify-center md:justify-end relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[380px] md:max-w-[460px] aspect-square bg-orange-500/15 rounded-full blur-[90px] pointer-events-none" />
          <img
            src="https://res.cloudinary.com/dginphpy4/image/upload/e_background_removal,f_png/v1771383933/Chekki_Futuristic_Background_i8foqe.png"
            alt="Chekki AI Mascot & Dashboard"
            className="w-full max-w-[360px] sm:max-w-[420px] md:max-w-[480px] h-auto object-contain drop-shadow-[0_20px_50px_rgba(249,115,22,0.25)] relative z-10"
            loading="lazy"
          />
        </div>
      </section>

      {/* --- BENTO GRID FEATURES --- */}
      <section className="py-16 md:py-24 px-4 md:px-8 max-w-7xl mx-auto w-full">
        <div className="mb-12 text-center">
          <h2 className={`font-display text-2xl sm:text-4xl font-black tracking-tight mb-4 ${isNight ? 'text-white' : 'text-zinc-900'}`}>
            {isKo ? '학원 운영을 위해 설계된 핵심 기능' : 'Designed Specially for English Academies'}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Bento Cell 1: Curriculum Pre-seeding (Large block, spans 2 columns) */}
          <div className={`md:col-span-2 p-6 md:p-8 border rounded-3xl flex flex-col justify-between transition-all ${
            isNight 
              ? 'bg-[#050505] border-white/10 hover:border-white/20' 
              : 'bg-white border-slate-200/80 hover:border-slate-300 shadow-sm'
          } hover:-translate-y-0.5 duration-200 relative overflow-hidden group`}>

            <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-center justify-between">
              <div className="flex-1">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500 mb-5">
                  <GraduationCap size={20} weight="bold" />
                </div>
                <h3 className={`font-display text-xl md:text-2xl font-black mb-3 ${isNight ? 'text-white' : 'text-zinc-900'}`}>
                  {isKo ? '주간 교재 키워드 등록 (99.9% AI 정밀 채점)' : 'Weekly Curriculum Seeding (99.9% AI Accuracy)'}
                </h3>
                <p className={`text-sm leading-relaxed ${isNight ? 'text-zinc-400' : 'text-zinc-600'}`}>
                  {isKo 
                    ? '선생님이 학급별 주간 단어와 파닉스를 대시보드에 등록해 두면, 가정에서 학부모가 스캔한 오답 항목이 우리 학원 교재 정답 기준에 맞춰 99.9% 정확하게 분석됩니다.'
                    : 'Seed your class active vocabulary lists and phonics targets once. Our AI evaluates home scans against your exact answer key with 99.9% accuracy, eliminating false OCR grading errors.'}
                </p>
              </div>
              <div className={`w-full md:w-64 lg:w-72 flex-shrink-0 p-2 sm:p-2.5 rounded-2xl border transition-all duration-300 ${
                isNight 
                  ? 'bg-gradient-to-b from-zinc-900/90 to-zinc-950/90 border-white/10 ring-1 ring-white/5 shadow-xl' 
                  : 'bg-gradient-to-b from-slate-50 to-slate-100/80 border-slate-200/90 ring-1 ring-black/[0.03] shadow-[0_4px_20px_rgba(0,0,0,0.06)]'
              }`}>
                <div className="flex items-center gap-1.5 px-2 pb-1.5 border-b border-slate-200/50 dark:border-white/5 mb-1.5">
                  <div className="w-2 h-2 rounded-full bg-red-400/80" />
                  <div className="w-2 h-2 rounded-full bg-amber-400/80" />
                  <div className="w-2 h-2 rounded-full bg-emerald-400/80" />
                </div>
                <div className="rounded-xl overflow-hidden bg-white dark:bg-zinc-950 p-1 flex justify-center items-center">
                  <img src={isNight ? "/assets/schools/schools_bento_curriculum.png" : "/assets/schools/schools_bento_curriculum_light.png"} alt="Curriculum seeding interface" className="w-full h-auto object-contain filter drop-shadow-sm" loading="lazy" />
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-zinc-200/60 dark:border-white/10 flex items-center gap-2 text-xs font-bold text-orange-500">
              <span>{isKo ? '교재 기반 정답지로 환각 현상 0%' : 'Ground-truth answer keys eliminate AI hallucination'}</span>
              <Sparkle size={12} weight="bold" />
            </div>
          </div>

          {/* Bento Cell 2: Roster approvals (1 column) */}
          <div className={`p-6 md:p-8 border rounded-3xl flex flex-col justify-between transition-all ${
            isNight 
              ? 'bg-[#050505] border-white/10 hover:border-white/20' 
              : 'bg-white border-slate-200/80 hover:border-slate-300 shadow-sm'
          } hover:-translate-y-0.5 duration-200 relative overflow-hidden group`}>
            <div>
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-500 mb-5">
                <Users size={20} weight="bold" />
              </div>
              <h3 className={`font-display text-xl font-black mb-3 ${isNight ? 'text-white' : 'text-zinc-900'}`}>
                {isKo ? '6자리 코드로 가정 숙제 자동 연동' : '6-Digit Join Code & Auto-Sync'}
              </h3>
              <p className={`text-xs sm:text-sm leading-relaxed ${isNight ? 'text-zinc-400' : 'text-zinc-600'}`}>
                {isKo 
                  ? '학부모가 앱에서 6자리 학급 코드를 입력하면 연동 완료. 집에서 스캔한 빨간 테두리 오답과 점수가 선생님 대시보드로 실시간 자동 전송됩니다.'
                  : 'Parents enter a simple 6-letter class code once. Homework scans and red-bordered mistake data silently sync straight to your teacher dashboard.'}
              </p>
            </div>

            <div className={`mt-6 p-2 sm:p-2.5 rounded-2xl border transition-all duration-300 ${
              isNight 
                ? 'bg-gradient-to-b from-zinc-900/90 to-zinc-950/90 border-white/10 ring-1 ring-white/5 shadow-xl' 
                : 'bg-gradient-to-b from-slate-50 to-slate-100/80 border-slate-200/90 ring-1 ring-black/[0.03] shadow-[0_4px_20px_rgba(0,0,0,0.06)]'
            }`}>
              <div className="flex items-center gap-1.5 px-2 pb-1.5 border-b border-slate-200/50 dark:border-white/5 mb-1.5">
                <div className="w-2 h-2 rounded-full bg-red-400/80" />
                <div className="w-2 h-2 rounded-full bg-amber-400/80" />
                <div className="w-2 h-2 rounded-full bg-emerald-400/80" />
              </div>
              <div className="rounded-xl overflow-hidden bg-white dark:bg-zinc-950 p-1 flex justify-center items-center">
                <img src={isNight ? "/assets/schools/schools_bento_join_code.png" : "/assets/schools/schools_bento_join_code_light.png"} alt="Class join code entry UI" className="w-full max-w-[220px] h-auto object-contain filter drop-shadow-sm" loading="lazy" />
              </div>
            </div>
          </div>

          {/* Bento Cell 3: Analytics (1 column) */}
          <div className={`p-6 md:p-8 border rounded-3xl flex flex-col justify-between transition-all ${
            isNight 
              ? 'bg-[#050505] border-white/10 hover:border-white/20' 
              : 'bg-white border-slate-200/80 hover:border-slate-300 shadow-sm'
          } hover:-translate-y-0.5 duration-200 relative overflow-hidden group`}>
            <div>
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500 mb-5">
                <ChartBar size={20} weight="bold" />
              </div>
              <h3 className={`font-display text-xl font-black mb-3 ${isNight ? 'text-white' : 'text-zinc-900'}`}>
                {isKo ? '교실 밖 학습 진단 (Visibility Beyond the Classroom)' : 'Visibility Beyond the Classroom'}
              </h3>
              <p className={`text-xs sm:text-sm leading-relaxed ${isNight ? 'text-zinc-400' : 'text-zinc-600'}`}>
                {isKo 
                  ? '선생님이 옆에 없을 때 아이들이 집에서 무엇을 어려워했는지 한눈에 확인하세요. 가정 스캔 데이터를 기반으로 다음 수업의 핵심 복습 포인트를 정확히 집어냅니다.'
                  : "See how your students perform when you're not around. Chekki tracks home scan difficulty rates so you know the exact phonics rules and vocabulary items to reinforce in your next lesson."}
              </p>
            </div>

            <div className={`mt-6 p-2 sm:p-2.5 rounded-2xl border transition-all duration-300 ${
              isNight 
                ? 'bg-gradient-to-b from-zinc-900/90 to-zinc-950/90 border-white/10 ring-1 ring-white/5 shadow-xl' 
                : 'bg-gradient-to-b from-slate-50 to-slate-100/80 border-slate-200/90 ring-1 ring-black/[0.03] shadow-[0_4px_20px_rgba(0,0,0,0.06)]'
            }`}>
              <div className="flex items-center gap-1.5 px-2 pb-1.5 border-b border-slate-200/50 dark:border-white/5 mb-1.5">
                <div className="w-2 h-2 rounded-full bg-red-400/80" />
                <div className="w-2 h-2 rounded-full bg-amber-400/80" />
                <div className="w-2 h-2 rounded-full bg-emerald-400/80" />
              </div>
              <div className="rounded-xl overflow-hidden bg-white dark:bg-zinc-950 p-1 flex justify-center items-center">
                <img src={isNight ? "/assets/schools/schools_bento_diagnostics.png" : "/assets/schools/schools_bento_diagnostics_light.png"} alt="Classroom diagnostics dashboard" className="w-full max-w-[220px] h-auto object-contain filter drop-shadow-sm" loading="lazy" />
              </div>
            </div>
          </div>

          {/* Bento Cell 4: Parent Sync (Large block, spans 2 columns) */}
          <div className={`md:col-span-2 p-6 md:p-8 border rounded-3xl transition-all ${
            isNight 
              ? 'bg-[#050505] border-white/10 hover:border-white/20' 
              : 'bg-white border-slate-200/80 hover:border-slate-300 shadow-sm'
          } hover:-translate-y-0.5 duration-200 relative overflow-hidden group`}>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 items-center">
              <div className="md:col-span-7 flex flex-col justify-between h-full">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-500 mb-4">
                    <Sparkle size={20} weight="bold" />
                  </div>
                  <h3 className={`font-display text-xl md:text-2xl font-black mb-3 ${isNight ? 'text-white' : 'text-zinc-900'}`}>
                    {isKo ? '1초 만에 자동 생성되는 학부모 칭찬 & 성장 리포트' : '1-Click Parent Growth & Progress Report Cards'}
                  </h3>
                  <p className={`text-sm leading-relaxed mb-4 ${isNight ? 'text-zinc-400' : 'text-zinc-600'}`}>
                    {isKo 
                      ? '매월 10시간 이상 걸리던 수동 평가서 작성을 대체합니다. 가정 스캔 데이터를 기반으로 아이의 긍정적 성장과 칭찬 포인트가 담긴 PDF 리포트를 1초 만에 학부모님께 발송하세요.'
                      : 'Eliminate 5-10 hours a month of manual report writing. Chekki auto-compiles home scan data into encouraging, branded growth reports with 1 click.'}
                  </p>
                </div>
                <div className="pt-3 border-t border-zinc-200/60 dark:border-white/10 flex items-center gap-1.5 text-xs font-bold text-pink-500">
                  <CheckCircle size={14} weight="bold" />
                  <span>{isKo ? '선생님 행정 부담 90% 감소 & 재원율 증가' : 'Reduces teacher admin work by 90% & boosts retention'}</span>
                </div>
              </div>

              <div className="md:col-span-5 flex items-center justify-center">
                <div className={`w-full max-w-[240px] md:max-w-[260px] p-2 sm:p-2.5 rounded-2xl border transition-all duration-300 ${
                  isNight 
                    ? 'bg-gradient-to-b from-zinc-900/90 to-zinc-950/90 border-white/10 ring-1 ring-white/5 shadow-xl' 
                    : 'bg-gradient-to-b from-slate-50 to-slate-100/80 border-slate-200/90 ring-1 ring-black/[0.03] shadow-[0_4px_20px_rgba(0,0,0,0.06)]'
                }`}>
                  <div className="flex items-center gap-1.5 px-2 pb-1.5 border-b border-slate-200/50 dark:border-white/5 mb-1.5">
                    <div className="w-2 h-2 rounded-full bg-red-400/80" />
                    <div className="w-2 h-2 rounded-full bg-amber-400/80" />
                    <div className="w-2 h-2 rounded-full bg-emerald-400/80" />
                  </div>
                  <div className="rounded-xl overflow-hidden bg-white dark:bg-zinc-950 p-1 flex justify-center items-center">
                    <img src={isNight ? "/assets/schools/schools_bento_parent_care_dark.png" : "/assets/schools/schools_bento_parent_care_light.png"} alt="Parent homework report UI" className="w-full h-auto object-contain filter drop-shadow-sm" loading="lazy" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- REVIEWS / TESTIMONIALS --- */}
      <section className={`py-20 border-t border-b ${isNight ? 'border-white/5 bg-white/[0.01]' : 'border-zinc-200 bg-zinc-50/50'}`}>
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className={`font-display text-2xl sm:text-3xl font-black ${isNight ? 'text-white' : 'text-zinc-900'}`}>
              {isKo ? '원장님들과 영어 강사들의 실사용 리뷰' : 'Proven to save hours for teachers weekly'}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className={`p-6 rounded-2xl border ${isNight ? 'bg-zinc-950/80 border-white/5' : 'bg-white border-zinc-200'}`}>
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
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                    {isKo ? '강남 대형 어학원 초등부 원장' : 'Director of Elementary Division'}
                  </p>
                </div>
              </div>
            </div>

            <div className={`p-6 rounded-2xl border ${isNight ? 'bg-zinc-950/80 border-white/5' : 'bg-white border-zinc-200'}`}>
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
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                    {isKo ? '초등 영어 파닉스반 담임 교사' : 'Phonics Lead Teacher'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- PRICING SECTION --- */}
      <section id="pricing" className={`py-20 px-4 md:px-8 max-w-7xl mx-auto w-full ${isNight ? 'text-white' : 'text-zinc-900'}`}>
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-[10px] sm:text-xs font-black text-orange-500 uppercase tracking-[0.25em] mb-3 block">
            {isKo ? '투명한 요금 정책' : 'PREDICTABLE SCHOOL PRICING'}
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-black tracking-tight mb-4">
            {isKo ? '교사 수에 맞춘 합리적인 월정액 요금제' : 'Transparent Monthly Teacher Tiers'}
          </h2>
          <p className={`text-sm leading-relaxed mb-8 ${isNight ? 'text-zinc-400' : 'text-zinc-600'}`}>
            {isKo 
              ? '프리랜서 1인 강사부터 대형 어학원까지 복잡한 스캔 건수 제한 없는 예측 가능한 월정액 플랜입니다. 모든 플랜에는 소속 학부모 전원 무료 Chekki Pro 앱 이용권(월 ₩9,900 상당)이 포함됩니다.'
              : 'No usage-based line-item surprises. Simple per-teacher monthly tiers. Every school plan includes FREE Chekki Pro home accounts for all enrolled parents (₩9,900/mo value per family).'}
          </p>

          {/* Monthly / Yearly Billing Toggle */}
          <div className="inline-flex items-center p-1.5 bg-[#0a0a0c] border border-white/10 rounded-full shadow-inner mb-10">
            <button
              type="button"
              onClick={() => setBillingCycle('monthly')}
              className={`px-5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                billingCycle === 'monthly'
                  ? 'bg-orange-500 text-white shadow-md'
                  : 'text-zinc-400 hover:text-white'
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
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <span>{isKo ? '연간 결제' : 'Yearly Billing'}</span>
              <span className="px-2 py-0.5 bg-emerald-500 text-black text-[9px] font-black uppercase rounded-full">
                {isKo ? '20% 할인' : 'Save 20%'}
              </span>
            </button>
          </div>

          {/* 14-Day Free Teacher Trial Banner */}
          <div className="max-w-2xl mx-auto p-4 bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-orange-500/10 border border-orange-500/30 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 text-left">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold text-lg flex-shrink-0">
                🎁
              </div>
              <div>
                <h4 className="text-sm font-black text-white">
                  {isKo ? '1인 강사 14일 무제한 무료 체험' : '14-Day FREE Teacher Trial'}
                </h4>
                <p className="text-xs text-zinc-400">
                  {isKo ? '결제 수단 등록 없이 강사 1인 14일간 모든 채점 기능 체험' : 'No credit card required. Experience all AI autograding features.'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => openPlanModal('trial', '14-Day Free Teacher Trial', '강사 1인 14일 무료 체험', 0, 1, 1)}
              className="w-full sm:w-auto px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-black text-xs rounded-xl transition-all shadow-md active:scale-[0.97] whitespace-nowrap cursor-pointer"
            >
              {isKo ? '무료 체험 신청하기' : 'Start Free Trial'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto items-stretch">
          {/* Card 1: Freelancer & Solo Tutor */}
          <div 
            onClick={() => openPlanModal('freelancer', 'Freelancer & Solo Tutor Plan (1 Teacher)', '프리랜서 & 개인 튜터 플랜 (1인 강사)', billingCycle === 'yearly' ? 28000 : 35000, 1, 1)}
            className={`p-6 border rounded-3xl flex flex-col justify-between transition-all cursor-pointer group ${
              isNight 
                ? 'bg-[#050505] border-white/10 hover:border-orange-500/50 hover:bg-zinc-900/30' 
                : 'bg-white border-zinc-200 hover:border-orange-500/50 hover:shadow-xl shadow-sm'
            }`}
          >
            <div>
              <div className="flex justify-between items-center mb-3">
                <span className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-black tracking-wider uppercase rounded-full">
                  {isKo ? '프리랜서 & 1인 강사' : 'SOLO TUTORS & FREELANCERS'}
                </span>
              </div>
              <h3 className={`text-base font-black mb-1 ${isNight ? 'text-white' : 'text-zinc-900'}`}>
                {isKo ? '프리랜서 / 개인 튜터' : 'Freelancer & Solo Tutor'}
              </h3>
              <div className="flex items-baseline gap-1 mb-3">
                <span className={`font-display text-3xl font-black ${isNight ? 'text-white' : 'text-zinc-900'}`}>
                  {isKo ? (billingCycle === 'yearly' ? '₩28,000' : '₩35,000') : (billingCycle === 'yearly' ? '$20' : '$25')}
                </span>
                <span className={`text-[11px] font-bold ${isNight ? 'text-zinc-400' : 'text-zinc-500'}`}>
                  {isKo ? (billingCycle === 'yearly' ? '/월 (연간 결제)' : '/월 (강사 1인)') : (billingCycle === 'yearly' ? '/mo (billed yearly)' : '/mo per teacher')}
                </span>
              </div>
              <p className={`text-xs mb-5 leading-relaxed ${isNight ? 'text-zinc-400' : 'text-zinc-600'}`}>
                {isKo 
                  ? '🎯 대상: 개인 방문 튜터, 프리랜서 강사 및 1인 공부방 (최대 30인 원생)' 
                  : '🎯 Target: Freelance private tutors, 1-on-1 educators, and home classrooms (up to 30 students).'}
              </p>
              <ul className={`space-y-2.5 text-xs mb-6 border-t pt-4 ${isNight ? 'border-white/5 text-zinc-300' : 'border-zinc-100 text-zinc-700'}`}>
                <li className="flex items-center gap-2">
                  <CheckCircle size={14} weight="bold" className="text-emerald-500 flex-shrink-0" />
                  <span>{isKo ? '강사 1인 전용 포털 계정' : '1 Teacher Portal Seat'}</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={14} weight="bold" className="text-emerald-500 flex-shrink-0" />
                  <span>{isKo ? '담당 학부모 30인 무료 포함' : 'Up to 30 Student/Parent Seats'}</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={14} weight="bold" className="text-emerald-500 flex-shrink-0" />
                  <span>{isKo ? '99.9% AI 손글씨 숙제 자동 채점' : '99.9% AI Handwriting Autograding'}</span>
                </li>
                <li className="flex items-center gap-2 font-bold text-orange-500">
                  <Sparkle size={14} weight="bold" className="flex-shrink-0" />
                  <span>{isKo ? '맞춤 학원 로고 & PDF 성적표 브랜드' : 'Custom Academy Logo on PDF Reports'}</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={14} weight="bold" className="text-emerald-500 flex-shrink-0" />
                  <span>{isKo ? '1초 학부모 칭찬 & 성과 리포트' : '1-Click Parent Progress Reports'}</span>
                </li>
                <li className="flex items-center gap-2 font-bold text-orange-500">
                  <Sparkle size={14} weight="bold" className="flex-shrink-0" />
                  <span>{isKo ? '소속 학부모 Chekki Pro 앱 무료' : 'FREE Chekki Pro App for Parents'}</span>
                </li>
              </ul>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                openPlanModal('freelancer', 'Freelancer & Solo Tutor Plan (1 Teacher)', '프리랜서 & 개인 튜터 플랜 (1인 강사)', billingCycle === 'yearly' ? 28000 : 35000, 1, 1);
              }}
              className={`w-full py-3 font-bold text-xs rounded-2xl border text-center transition-all active:scale-[0.98] cursor-pointer ${
                isNight 
                  ? 'bg-white/10 hover:bg-white/15 text-white border-white/10' 
                  : 'bg-zinc-900 hover:bg-zinc-800 text-white border-zinc-900 shadow-sm'
              }`}
            >
              {isKo ? '청구서 발행 신청' : 'Get Bank Invoice'}
            </button>
          </div>

          {/* Card 2: Small School (1–2 Teachers) */}
          <div 
            onClick={() => openPlanModal('small', 'Small School Plan (1-2 Teachers)', '소형 학원 플랜 (1~2인 강사)', billingCycle === 'yearly' ? 39000 : 49000, 2, 1)}
            className={`p-6 border rounded-3xl flex flex-col justify-between transition-all cursor-pointer group ${
              isNight 
                ? 'bg-[#050505] border-white/10 hover:border-orange-500/50 hover:bg-zinc-900/30' 
                : 'bg-white border-zinc-200 hover:border-orange-500/50 hover:shadow-xl shadow-sm'
            }`}
          >
            <div>
              <div className="flex justify-between items-center mb-3">
                <span className="px-2.5 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-500 text-[10px] font-black tracking-wider uppercase rounded-full">
                  {isKo ? '소형 학원 (1~2인 강사)' : 'SMALL SCHOOL (1-2 TEACHERS)'}
                </span>
              </div>
              <h3 className={`text-base font-black mb-1 ${isNight ? 'text-white' : 'text-zinc-900'}`}>
                {isKo ? '소형 학원 & 공부방' : 'Small School & Study Room'}
              </h3>
              <div className="flex items-baseline gap-1 mb-3">
                <span className={`font-display text-3xl font-black ${isNight ? 'text-white' : 'text-zinc-900'}`}>
                  {isKo ? (billingCycle === 'yearly' ? '₩39,000' : '₩49,000') : (billingCycle === 'yearly' ? '$28' : '$35')}
                </span>
                <span className={`text-[11px] font-bold ${isNight ? 'text-zinc-400' : 'text-zinc-500'}`}>
                  {isKo ? (billingCycle === 'yearly' ? '/월 (연간 결제)' : '/월 (강사 1인당)') : (billingCycle === 'yearly' ? '/mo (billed yearly)' : '/mo per teacher')}
                </span>
              </div>
              <p className={`text-xs mb-5 leading-relaxed ${isNight ? 'text-zinc-400' : 'text-zinc-600'}`}>
                {isKo 
                  ? '🎯 대상: 강사 1~2인 규모 소형 어학원, 부티크 학원 및 공부방 (최대 75인 원생)' 
                  : '🎯 Target: Small neighborhood academies, study rooms, and boutique centers (up to 75 students).'}
              </p>
              <ul className={`space-y-2.5 text-xs mb-6 border-t pt-4 ${isNight ? 'border-white/5 text-zinc-300' : 'border-zinc-100 text-zinc-700'}`}>
                <li className="flex items-center gap-2">
                  <CheckCircle size={14} weight="bold" className="text-emerald-500 flex-shrink-0" />
                  <span>{isKo ? '강사 1~2인 포털 계정 (최대 75인 원생)' : '1–2 Teacher Seats (Up to 75 students)'}</span>
                </li>
                <li className="flex items-center gap-2 font-bold text-orange-500">
                  <Sparkle size={14} weight="bold" className="flex-shrink-0" />
                  <span>{isKo ? '맞춤 학원 로고 & PDF 성적표 브랜드' : 'Custom Academy Logo on PDF Reports'}</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={14} weight="bold" className="text-emerald-500 flex-shrink-0" />
                  <span>{isKo ? '6자리 학급 코드로 자동 가정 연동' : '6-Digit Class Join Code & Sync'}</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={14} weight="bold" className="text-emerald-500 flex-shrink-0" />
                  <span>{isKo ? '수업 전 오답 진단 대시보드' : 'Zero-Prep Class Diagnostic Dashboard'}</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={14} weight="bold" className="text-emerald-500 flex-shrink-0" />
                  <span>{isKo ? '1초 학부모 성장 발송 리포트' : '1-Click Parent Progress Reports'}</span>
                </li>
                <li className="flex items-center gap-2 font-bold text-orange-500">
                  <Sparkle size={14} weight="bold" className="flex-shrink-0" />
                  <span>{isKo ? '소속 학부모 Chekki Pro 앱 무료' : 'FREE Chekki Pro App for Parents'}</span>
                </li>
              </ul>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                openPlanModal('small', 'Small School Plan (1-2 Teachers)', '소형 학원 플랜 (1~2인 강사)', billingCycle === 'yearly' ? 39000 : 49000, 2, 1);
              }}
              className={`w-full py-3 font-bold text-xs rounded-2xl border text-center transition-all active:scale-[0.98] cursor-pointer ${
                isNight 
                  ? 'bg-white/10 hover:bg-white/15 text-white border-white/10' 
                  : 'bg-zinc-900 hover:bg-zinc-800 text-white border-zinc-900 shadow-sm'
              }`}
            >
              {isKo ? '청구서 발행 신청' : 'Get Bank Invoice'}
            </button>
          </div>

          {/* Card 3: Medium School (3–5 Teachers) [MOST POPULAR] */}
          <div 
            onClick={() => openPlanModal('medium', 'Medium Academy Plan (3-5 Teachers)', '중형 학원 플랜 (3~5인 강사)', billingCycle === 'yearly' ? 31000 : 39000, 3, 3)}
            className="p-6 border border-orange-500/60 bg-[#0a0705] rounded-3xl flex flex-col justify-between transition-all relative shadow-2xl shadow-orange-500/10 scale-[1.02] cursor-pointer group hover:border-orange-500"
          >
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-orange-500 text-white text-[9px] font-black tracking-widest uppercase rounded-full shadow-lg">
              {isKo ? '가장 인기 있는 플랜' : 'MOST POPULAR'}
            </div>
            <div>
              <div className="flex justify-between items-center mb-3 pt-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-orange-400">
                  {isKo ? '중형 학원 (3~5인 강사)' : '3–5 TEACHERS'}
                </span>
              </div>
              <h3 className="text-base font-black mb-1 text-white">
                {isKo ? '중형 어학원 플랜' : 'Medium Academy Plan'}
              </h3>
              <div className="flex items-baseline gap-1 mb-3">
                <span className="font-display text-3xl font-black text-white">
                  {isKo ? (billingCycle === 'yearly' ? '₩31,000' : '₩39,000') : (billingCycle === 'yearly' ? '$22' : '$28')}
                </span>
                <span className="text-[11px] text-zinc-400 font-bold">
                  {isKo ? (billingCycle === 'yearly' ? '/월 (연간 결제)' : '/월 (강사 1인당)') : (billingCycle === 'yearly' ? '/mo (billed yearly)' : '/mo per teacher')}
                </span>
              </div>
              <p className="text-xs text-zinc-400 mb-5 leading-relaxed">
                {isKo 
                  ? '🎯 대상: 체계적인 멀티 강사 수강 관리 및 학부모 소통이 필요한 중형 학원 (최대 200인 원생)' 
                  : '🎯 Target: Established growing academies needing multi-teacher roster management (up to 200 students).'}
              </p>
              <ul className="space-y-2.5 text-xs text-zinc-300 mb-6 border-t border-white/10 pt-4">
                <li className="flex items-center gap-2">
                  <CheckCircle size={14} weight="bold" className="text-emerald-400 flex-shrink-0" />
                  <span>{isKo ? '소형 플랜의 모든 기능 포함' : 'Includes all Small School features'}</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={14} weight="bold" className="text-emerald-400 flex-shrink-0" />
                  <span>{isKo ? '강사 3~5인 포털 계정 (최대 200인 원생)' : '3–5 Teacher Seats (Up to 200 students)'}</span>
                </li>
                <li className="flex items-center gap-2 font-bold text-orange-400">
                  <Sparkle size={14} weight="bold" className="flex-shrink-0" />
                  <span>{isKo ? '맞춤 학원 로고 & PDF 성적표 브랜드' : 'Custom Academy Logo on PDF Reports'}</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={14} weight="bold" className="text-emerald-400 flex-shrink-0" />
                  <span>{isKo ? '중앙 반별 학급 관리 시스템' : 'Centralized Class Roster Management'}</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={14} weight="bold" className="text-emerald-400 flex-shrink-0" />
                  <span>{isKo ? '우선 기술 지원 & 온보딩 가이드' : 'Priority Technical Support & Onboarding'}</span>
                </li>
                <li className="flex items-center gap-2 font-bold text-orange-400">
                  <Sparkle size={14} weight="bold" className="flex-shrink-0" />
                  <span>{isKo ? '소속 학부모 Chekki Pro 앱 무료' : 'FREE Chekki Pro App for Parents'}</span>
                </li>
              </ul>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                openPlanModal('medium', 'Medium Academy Plan (3-5 Teachers)', '중형 학원 플랜 (3~5인 강사)', billingCycle === 'yearly' ? 31000 : 39000, 3, 3);
              }}
              className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-2xl text-center shadow-lg shadow-orange-500/20 transition-all active:scale-[0.98] cursor-pointer"
            >
              {isKo ? '청구서 발행 신청' : 'Get Bank Invoice'}
            </button>
          </div>

          {/* Card 4: Large School & Franchise (6+ Teachers) */}
          <div 
            onClick={() => openPlanModal('large', 'Large Academy Plan (6+ Teachers)', '대형 학원 플랜 (6인 이상)', billingCycle === 'yearly' ? 23000 : 29000, 6, 6)}
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
              <h3 className={`text-base font-black mb-1 ${isNight ? 'text-white' : 'text-zinc-900'}`}>
                {isKo ? '대형 학원 / 프랜차이즈' : 'Large Academy & Franchise'}
              </h3>
              <div className="flex items-baseline gap-1 mb-3">
                <span className={`font-display text-3xl font-black ${isNight ? 'text-white' : 'text-zinc-900'}`}>
                  {isKo ? (billingCycle === 'yearly' ? '₩23,000' : '₩29,000') : (billingCycle === 'yearly' ? '$17' : '$22')}
                </span>
                <span className={`text-[11px] font-bold ${isNight ? 'text-zinc-400' : 'text-zinc-500'}`}>
                  {isKo ? (billingCycle === 'yearly' ? '/월 (연간 결제)' : '/월 (강사 1인당)') : (billingCycle === 'yearly' ? '/mo (billed yearly)' : '/mo per teacher')}
                </span>
              </div>
              <p className={`text-xs mb-5 leading-relaxed ${isNight ? 'text-zinc-400' : 'text-zinc-600'}`}>
                {isKo 
                  ? '🎯 대상: 여러 직영/가맹 캠퍼스를 보유한 대형 학원 및 프랜차이즈 (6인 이상 강사)' 
                  : '🎯 Target: Multi-branch campuses, franchise networks, and large academies (6+ teachers).'}
              </p>
              <ul className={`space-y-2.5 text-xs mb-6 border-t pt-4 ${isNight ? 'border-white/5 text-zinc-300' : 'border-zinc-100 text-zinc-700'}`}>
                <li className="flex items-center gap-2">
                  <CheckCircle size={14} weight="bold" className="text-emerald-500 flex-shrink-0" />
                  <span>{isKo ? '중형 플랜의 모든 기능 포함' : 'Includes all Medium Academy features'}</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={14} weight="bold" className="text-emerald-500 flex-shrink-0" />
                  <span>{isKo ? '강사 6인 이상 (원생 수 무제한)' : '6+ Teacher Seats (Unlimited Students)'}</span>
                </li>
                <li className="flex items-center gap-2 font-bold text-orange-500">
                  <Sparkle size={14} weight="bold" className="flex-shrink-0" />
                  <span>{isKo ? '맞춤 학원 로고 & PDF 성적표 브랜드' : 'Custom Academy Logo on PDF Reports'}</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={14} weight="bold" className="text-emerald-500 flex-shrink-0" />
                  <span>{isKo ? '강사 수에 따른 최적의 볼륨 할인' : 'Maximum Volume Discounted Pricing'}</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={14} weight="bold" className="text-emerald-500 flex-shrink-0" />
                  <span>{isKo ? '전담 성공 매니저 배정 & 1:1 세팅' : 'Dedicated Success Manager & 1:1 Setup'}</span>
                </li>
                <li className="flex items-center gap-2 font-bold text-orange-500">
                  <Sparkle size={14} weight="bold" className="flex-shrink-0" />
                  <span>{isKo ? '소속 학부모 Chekki Pro 앱 무료' : 'FREE Chekki Pro App for Parents'}</span>
                </li>
              </ul>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                openPlanModal('large', 'Large Academy Plan (6+ Teachers)', '대형 학원 플랜 (6인 이상)', billingCycle === 'yearly' ? 23000 : 29000, 6, 6);
              }}
              className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-2xl text-center transition-all active:scale-[0.98] shadow-md cursor-pointer"
            >
              {isKo ? '청구서 발행 신청' : 'Get Bank Invoice'}
            </button>
          </div>
        </div>
      </section>

      {/* --- GET IN TOUCH & CONSULTATION SECTION --- */}
      <section id="demo" className={`py-20 px-6 max-w-4xl mx-auto w-full text-center rounded-3xl my-12 border ${
        isNight ? 'bg-gradient-to-b from-zinc-950 to-[#050505] border-white/10' : 'bg-gradient-to-b from-orange-50/50 to-white border-zinc-200 shadow-md'
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
              else openPlanModal('medium', 'Medium Academy Plan (3-5 Teachers)', '중형 학원 플랜 (3~5인 강사)', 39000, 3, 3);
            }}
            className="w-full sm:w-auto px-8 py-4 bg-orange-500 hover:bg-orange-600 text-white font-black text-sm rounded-2xl shadow-lg shadow-orange-500/20 transition-all active:scale-[0.97] flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>{isKo ? '요금제 플랜 선택하기' : 'Select a Plan'}</span>
            <ArrowRight size={16} weight="bold" />
          </button>
          <button
            type="button"
            onClick={() => openPlanModal('custom', 'Custom Academy Setup', '맞춤 학원 도입 상담', 0, 1, 1)}
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

      {/* --- CORPORATE BANK TRANSFER & TAX INVOICE MODAL --- */}
      {showBankModal && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 overflow-y-auto">
          <div 
            className="fixed inset-0 bg-black/85 backdrop-blur-md" 
            onClick={() => setShowBankModal(false)} 
          />
          <div className="relative w-full max-w-lg p-1 bg-white/5 border border-white/10 rounded-[2.5rem] shadow-2xl animate-fade-in text-left my-8">
            <div className="bg-[#0c0c0e] rounded-[calc(2.5rem-0.25rem)] p-6 sm:p-8 text-zinc-200">
              <button
                onClick={() => setShowBankModal(false)}
                className="absolute top-6 right-6 p-2 text-zinc-400 hover:text-white rounded-full bg-white/5 hover:bg-white/10 transition-all active:scale-[0.95]"
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
                      <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 font-mono">
                        {isKo ? '신청 접수 완료' : 'APPLICATION SUBMITTED'}
                      </span>
                      <h3 className="text-xl font-black text-white">
                        {isKo ? '학원 정보 접수 & 청구서 발송' : 'Invoice & Onboarding Requested'}
                      </h3>
                    </div>
                  </div>

                  <p className="text-xs text-zinc-300 leading-relaxed bg-emerald-500/10 border border-emerald-500/20 p-3.5 rounded-xl">
                    {isKo 
                      ? `✅ 학원 등록 정보가 Chekki AI 운영팀에 전달되었습니다! 아래 입금 계좌로 수강료를 입금해 주시면, 24시간 이내에 입력해주신 이메일(${invoiceResult.email})로 국세청 전자 세금계산서와 교사 인증 코드가 자동 발송됩니다.`
                      : `✅ Your academy details have been registered with Chekki AI! A confirmation & tax invoice email has been sent to ${invoiceResult.email}. Please refer to the bank account details below to complete your payment.`}
                  </p>

                  {/* Summary Card */}
                  <div className="p-5 bg-[#050505] border border-white/10 rounded-2xl space-y-3">
                    <div className="flex justify-between items-center text-xs pb-3 border-b border-white/5 font-mono">
                      <span className="text-zinc-500">{isKo ? '청구 코드' : 'Invoice ID'}:</span>
                      <span className="font-bold text-orange-400">{invoiceResult.invoiceId}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-zinc-400">{isKo ? '학원 / 기관명' : 'Academy Name'}:</span>
                      <span className="font-bold text-white">{invoiceResult.academyName}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-zinc-400">{isKo ? '선택 플랜' : 'Selected Plan'}:</span>
                      <span className="font-bold text-white">{isKo ? selectedPlan.nameKo : selectedPlan.nameEn}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-zinc-400">{isKo ? '신청 강사 수' : 'Teacher Seats'}:</span>
                      <span className="font-bold text-white">{invoiceResult.teacherCount} {isKo ? '명' : 'seats'}</span>
                    </div>
                    {invoiceResult.studentCount && (
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-zinc-400">{isKo ? '추정 재원생 수' : 'Enrolled Students'}:</span>
                        <span className="font-bold text-white">{invoiceResult.studentCount} {isKo ? '명' : 'students'}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-zinc-400">{isKo ? '수신 이메일' : 'Tax Invoice Email'}:</span>
                      <span className="font-bold text-white font-mono">{invoiceResult.email}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm pt-2 border-t border-white/5 font-bold">
                      <span className="text-zinc-300">{isKo ? '총 입금 금액' : 'Total Amount'}:</span>
                      <span className="text-xl font-black text-emerald-400 font-mono">
                        ₩{(invoiceResult.totalAmount || 0).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Corporate Bank Account Details */}
                  <div className="p-5 bg-orange-500/10 border border-orange-500/30 rounded-2xl space-y-3">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-orange-400 flex items-center gap-1.5 font-mono">
                      <Bank size={14} weight="bold" />
                      <span>{isKo ? '체키AI 법인 계좌 정보' : 'Chekki AI Corporate Bank Account'}</span>
                    </span>

                    <div className="space-y-1.5 text-xs">
                      <p className="text-zinc-400">{isKo ? '은행' : 'Bank'}: <strong className="text-white">신한은행 (Shinhan Bank)</strong></p>
                      <p className="text-zinc-400">{isKo ? '예금주' : 'Holder'}: <strong className="text-white">BENJAMIN JASON</strong></p>
                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-orange-500/20">
                        <p className="font-mono text-lg font-black text-white select-all">110-623-147138</p>
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
                      className="w-1/3 py-3.5 bg-white/10 hover:bg-white/15 text-white font-bold text-xs rounded-2xl border border-white/10 transition-all active:scale-[0.98] cursor-pointer"
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
                /* Bank Transfer Request Form */
                <form onSubmit={handleRequestBankInvoice} className="space-y-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center flex-shrink-0">
                      <Bank size={20} weight="bold" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-orange-400 uppercase tracking-widest block font-mono">
                        {isKo ? '학원 정보 입력 & 청구서 신청' : 'ACADEMY DETAILS & INVOICE'}
                      </span>
                      <h3 className="text-xl font-black text-white">
                        {isKo ? '학원 정보 입력 및 세금계산서 신청' : 'School Details & Bank Invoice'}
                      </h3>
                      <p className="text-xs text-zinc-400 font-bold">
                        {isKo ? selectedPlan.nameKo : selectedPlan.nameEn}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1 text-left">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-1">
                      {isKo ? '교육기관명 / 학원명 *' : 'Academy / Organization Name *'}
                    </label>
                    <input
                      type="text"
                      required
                      value={academyName}
                      onChange={(e) => setAcademyName(e.target.value)}
                      placeholder="E.g. POLY Seocho / Chekki English Studio"
                      className="w-full bg-[#050505] border border-white/10 focus:border-orange-500 outline-none text-xs p-3.5 rounded-xl transition-all text-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1 text-left">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-1">
                        {isKo ? '담당자 성함 *' : 'Contact Name *'}
                      </label>
                      <input
                        type="text"
                        required
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        placeholder="John Doe"
                        className="w-full bg-[#050505] border border-white/10 focus:border-orange-500 outline-none text-xs p-3.5 rounded-xl transition-all text-white"
                      />
                    </div>
                    <div className="space-y-1 text-left">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-1">
                        {isKo ? '필요 강사 수 *' : 'Teacher Seats *'}
                      </label>
                      <input
                        type="number"
                        min={selectedPlan.minSeats || 1}
                        disabled={selectedPlan.id === 'freelancer'}
                        required
                        value={teacherCount}
                        onChange={(e) => setTeacherCount(Math.max(selectedPlan.minSeats || 1, Number(e.target.value)))}
                        className="w-full bg-[#050505] border border-white/10 focus:border-orange-500 outline-none text-xs p-3.5 rounded-xl transition-all text-white font-mono disabled:opacity-60"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1 text-left">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-1">
                        {isKo ? '세금계산서 수신 이메일 *' : 'Tax Invoice Email *'}
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="billing@academy.com"
                        className="w-full bg-[#050505] border border-white/10 focus:border-orange-500 outline-none text-xs p-3.5 rounded-xl transition-all text-white"
                      />
                    </div>
                    <div className="space-y-1 text-left">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-1">
                        {isKo ? '재원생 수 (선택)' : 'Enrolled Students'}
                      </label>
                      <input
                        type="text"
                        value={studentCount}
                        onChange={(e) => setStudentCount(e.target.value)}
                        placeholder="E.g. 50"
                        className="w-full bg-[#050505] border border-white/10 focus:border-orange-500 outline-none text-xs p-3.5 rounded-xl transition-all text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1 text-left">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-1">
                        {isKo ? '사업자등록번호 (선택)' : 'Biz Reg Number (Optional)'}
                      </label>
                      <input
                        type="text"
                        value={bizRegNumber}
                        onChange={(e) => setBizRegNumber(e.target.value)}
                        placeholder="123-45-67890"
                        className="w-full bg-[#050505] border border-white/10 focus:border-orange-500 outline-none text-xs p-3.5 rounded-xl transition-all text-white font-mono"
                      />
                    </div>
                    <div className="space-y-1 text-left">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-1">
                        {isKo ? '연락처 (선택)' : 'Phone Number'}
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="010-0000-0000"
                        className="w-full bg-[#050505] border border-white/10 focus:border-orange-500 outline-none text-xs p-3.5 rounded-xl transition-all text-white"
                      />
                    </div>
                  </div>

                  {selectedPlan.price > 0 && (
                    <div className="p-4 bg-white/5 border border-white/5 rounded-2xl flex justify-between items-center text-xs mt-2">
                      <span className="text-zinc-400 font-bold">{isKo ? '월 정액 청구 금액' : 'Total Monthly Amount'}:</span>
                      <span className="text-lg font-black text-emerald-400 font-mono">
                        ₩{(selectedPlan.price * teacherCount).toLocaleString()}
                      </span>
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
                        <span>{isKo ? '신청서 제출 및 청구서 발송 요청' : 'Submit Request & Get Bank Invoice'}</span>
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
      <footer className={`py-12 border-t ${isNight ? 'border-white/5 bg-black/30' : 'border-zinc-200 bg-white'} px-6 text-center`}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-xs text-zinc-500 font-medium">
            © {new Date().getFullYear()} ChekkiAI. All rights reserved.
          </p>
          <div className="flex gap-6 text-xs text-zinc-500 font-black tracking-wider uppercase">
            <a
              href="/"
              onClick={(e) => {
                e.preventDefault();
                window.history.pushState({}, '', '/');
                window.dispatchEvent(new PopStateEvent('popstate'));
              }}
              className="hover:text-orange-500 transition-colors"
            >
              {isKo ? '메인 서비스로 이동' : 'Main Service'}
            </a>
            <span className="text-zinc-800">|</span>
            <a
              href="/teacher"
              onClick={(e) => {
                e.preventDefault();
                window.history.pushState({}, '', '/teacher');
                window.dispatchEvent(new PopStateEvent('popstate'));
              }}
              className="hover:text-orange-500 transition-colors"
            >
              {isKo ? '교사용 포털' : 'Teacher Portal'}
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default SchoolsLandingPage;
