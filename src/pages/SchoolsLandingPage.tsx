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

  const [showBankModal, setShowBankModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<{ id: string; nameEn: string; nameKo: string; price: number }>({
    id: 'medium',
    nameEn: 'Medium Academy Plan (3-5 Teachers)',
    nameKo: '중형 학원 플랜 (3~5인 강사)',
    price: 39000
  });
  const [teacherCount, setTeacherCount] = useState(3);
  const [bizRegNumber, setBizRegNumber] = useState('');
  const [invoiceResult, setInvoiceResult] = useState<any>(null);
  const [isRequestingInvoice, setIsRequestingInvoice] = useState(false);
  const [copiedBank, setCopiedBank] = useState(false);

  const openPlanModal = (planId: string, nameEn: string, nameKo: string, price: number, defaultTeachers: number) => {
    setSelectedPlan({ id: planId, nameEn, nameKo, price });
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
    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitSuccess(true);
      setAcademyName('');
      setContactName('');
      setPhone('');
      setEmail('');
    }, 1500);
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
      <section className="relative px-6 pt-16 md:pt-24 pb-12 text-center max-w-4xl mx-auto flex-1 flex flex-col justify-center">
        {/* Eyebrow */}
        <span className="text-[10px] sm:text-xs font-black text-orange-500 uppercase tracking-[0.25em] mb-4 block">
          {isKo ? '학원 맞춤형 숙제 분석 플랫폼' : 'AUTOMATED GRADING FOR ACADEMIES'}
        </span>

        {/* Headline */}
        <h1 className={`font-display text-3xl sm:text-5xl md:text-6xl font-black tracking-tight leading-[1.08] mb-6 text-balance ${isNight ? 'text-white' : 'text-zinc-900'} break-keep`}>
          {isKo ? (
            <>선생님의 평가는 <span className="text-orange-500">더 섬세하게</span>,<br />학부모 피드백은 <span className="text-orange-500">더 정확하게</span>.</>
          ) : (
            <>Elevate Homework Grading.<br />Engage Parents with <span className="text-orange-500">AI Care</span>.</>
          )}
        </h1>

        {/* Subtext */}
        <p className={`text-base sm:text-lg max-w-2xl mx-auto leading-relaxed mb-8 ${isNight ? 'text-zinc-400' : 'text-zinc-600'} break-keep`}>
          {isKo 
            ? '학원만의 매주 진도 교재와 어휘 단어장을 연동하여 단 3초 만에 원생 손글씨 숙제를 채점하고 오답 리포트를 학부모님께 자동 발송하세요.'
            : 'Integrate your weekly textbooks, autograde student handwriting, and deliver detailed diagnostic reviews straight to parents instantly.'}
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <a
            href="#demo"
            className="w-full sm:w-auto px-8 py-4 bg-orange-500 hover:bg-orange-600 text-white font-black text-sm rounded-3xl shadow-lg transition-all active:scale-[0.97] flex items-center justify-center gap-2 group"
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
            className={`w-full sm:w-auto px-8 py-4 font-black text-sm rounded-3xl border transition-all active:scale-[0.97] ${
              isNight 
                ? 'bg-white/5 border-white/10 hover:bg-white/10 text-white' 
                : 'bg-white/80 border-zinc-300 hover:bg-white text-zinc-900 shadow-sm'
            }`}
          >
            {isKo ? '교사용 로그인' : 'Teacher Login'}
          </a>
        </div>

        {/* Hero UI Image - Using main Chekki asset */}
        <div className="mt-12 w-full max-w-2xl mx-auto">
          <div className="relative flex justify-center items-center">
            <img
              src="https://res.cloudinary.com/dginphpy4/image/upload/e_background_removal,f_png/v1771383933/Chekki_Futuristic_Background_i8foqe.png"
              alt="Chekki AI Mascot & Dashboard"
              className="w-full max-w-[480px] h-auto object-contain drop-shadow-[0_20px_50px_rgba(249,115,22,0.25)]"
              loading="lazy"
            />
          </div>
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
              <div className="w-full md:w-56 lg:w-64 flex-shrink-0 rounded-2xl overflow-hidden p-1 flex justify-center items-center">
                <img src={isNight ? "/assets/schools/schools_bento_curriculum.png" : "/assets/schools/schools_bento_curriculum_light.png"} alt="Curriculum seeding interface" className="w-full h-auto object-contain filter drop-shadow-md" loading="lazy" />
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

            <div className="mt-6 rounded-2xl overflow-hidden p-1 flex justify-center items-center">
              <img src={isNight ? "/assets/schools/schools_bento_join_code.png" : "/assets/schools/schools_bento_join_code_light.png"} alt="Class join code entry UI" className="w-full max-w-[220px] h-auto object-contain filter drop-shadow-md" loading="lazy" />
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

            <div className="mt-6 rounded-2xl overflow-hidden p-1 flex justify-center items-center">
              <img src={isNight ? "/assets/schools/schools_bento_diagnostics.png" : "/assets/schools/schools_bento_diagnostics_light.png"} alt="Classroom diagnostics dashboard" className="w-full max-w-[220px] h-auto object-contain filter drop-shadow-md" loading="lazy" />
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
                <div className="w-full max-w-[240px] md:max-w-[260px] flex justify-center items-center">
                  <img src={isNight ? "/assets/schools/schools_bento_parent_care_dark.png" : "/assets/schools/schools_bento_parent_care_light.png"} alt="Parent homework report UI" className="w-full h-auto object-contain filter drop-shadow-md" loading="lazy" />
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
                <div className="w-10 h-10 rounded-full bg-brand-purple/20 text-brand-purple flex items-center justify-center font-bold text-sm">
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
      <section className={`py-20 px-4 md:px-8 max-w-7xl mx-auto w-full ${isNight ? 'text-white' : 'text-zinc-900'}`}>
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-[10px] sm:text-xs font-black text-orange-500 uppercase tracking-[0.25em] mb-3 block">
            {isKo ? '투명한 요금 정책' : 'PREDICTABLE SCHOOL PRICING'}
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-black tracking-tight mb-4">
            {isKo ? '교사 수에 맞춘 합리적인 월정액 요금제' : 'Transparent Monthly Teacher Tiers'}
          </h2>
          <p className={`text-sm leading-relaxed ${isNight ? 'text-zinc-400' : 'text-zinc-600'}`}>
            {isKo 
              ? '복잡한 스캔 건수 계산 없이, 교사 수에 맞춘 예측 가능한 월정액 플랜입니다. 모든 학교/학원 플랜에는 소속 원생 학부모 전원 무료 Chekki Pro 앱 이용권(월 ₩9,900 상당)이 포함됩니다.'
              : 'No usage-based line-item surprises. Simple per-teacher monthly tiers. Every school plan includes FREE Chekki Pro home accounts for all enrolled parents (₩9,900/mo value per family).'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Plan 1: Small Academy */}
          <div className={`p-8 border rounded-3xl flex flex-col justify-between transition-all ${
            isNight 
              ? 'bg-[#050505] border-white/10 hover:border-white/20' 
              : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
          }`}>
            <div>
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-black uppercase tracking-wider text-zinc-400">
                  {isKo ? '개인 강사 / 튜터 / 공부방 (1~2인 강사)' : 'Tutors, Freelancers & 1-2 Teachers'}
                </span>
              </div>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="font-display text-4xl font-black text-white">{isKo ? '₩49,000' : '$35'}</span>
                <span className="text-xs text-zinc-500 font-bold">{isKo ? '/월 (강사 1인당)' : '/mo per teacher'}</span>
              </div>
              <p className="text-xs text-zinc-400 mb-6 leading-relaxed">
                {isKo ? '개인 튜터, 프리랜서 강사 및 소형 공부방을 위한 전용 단독 플랜 (강사당 30인 학부모 석)' : 'Perfect for independent tutors, freelance teachers, and small study rooms (30 student seats/teacher).'}
              </p>
              <ul className="space-y-3 text-xs text-zinc-300 mb-8 border-t border-white/5 pt-6">
                <li className="flex items-center gap-2">
                  <CheckCircle size={14} weight="bold" className="text-emerald-400" />
                  <span>{isKo ? '무제한 학급 개설 & 주간 키워드 등록' : 'Unlimited Class Creation & Curriculums'}</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={14} weight="bold" className="text-emerald-400" />
                  <span>{isKo ? '수업 전 오답 분석 (Zero-Prep 대시보드)' : 'Zero-Prep Class Analytics Dashboard'}</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={14} weight="bold" className="text-emerald-400" />
                  <span>{isKo ? '1초 만에 생성되는 학부모 칭찬 리포트' : '1-Click Parent Progress Reports'}</span>
                </li>
                <li className="flex items-center gap-2 font-bold text-orange-400">
                  <Sparkle size={14} weight="bold" />
                  <span>{isKo ? '담당 학부모 최대 30인 Chekki Pro 무료 제공' : 'FREE Chekki Pro for Up to 30 Class Parents'}</span>
                </li>
              </ul>
            </div>
            <button
              type="button"
              onClick={() => openPlanModal('small', 'Tutor & Freelancer Plan (1-2 Teachers)', '개인 튜터 & 공부방 플랜 (1~2인 강사)', 49000, 1)}
              className="w-full py-3.5 bg-white/5 hover:bg-white/10 text-white font-bold text-xs rounded-2xl border border-white/10 text-center transition-all active:scale-[0.98] cursor-pointer"
            >
              {isKo ? '계좌이체 & 세금계산서 신청' : 'Request Bank Invoice'}
            </button>
          </div>

          {/* Plan 2: Medium Academy (POPULAR) */}
          <div className="p-8 border border-orange-500/50 bg-[#0a0705] rounded-3xl flex flex-col justify-between transition-all relative shadow-2xl shadow-orange-500/10 scale-[1.02]">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 bg-orange-500 text-white text-[10px] font-black tracking-widest uppercase rounded-full shadow-lg">
              {isKo ? '가장 인기 있는 플랜' : 'MOST POPULAR'}
            </div>
            <div>
              <div className="flex justify-between items-center mb-4 pt-2">
                <span className="text-xs font-black uppercase tracking-wider text-orange-400">
                  {isKo ? '중형 학원 (3~5인 강사)' : '3–5 Teachers'}
                </span>
              </div>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="font-display text-4xl font-black text-white">{isKo ? '₩39,000' : '$28'}</span>
                <span className="text-xs text-zinc-500 font-bold">{isKo ? '/월 (강사 1인당)' : '/mo per teacher'}</span>
              </div>
              <p className="text-xs text-zinc-400 mb-6 leading-relaxed">
                {isKo ? '체계적인 원생 관리와 브랜드 리포트가 필요한 중형 어학원 전용' : 'Optimized for growing academies needing multi-teacher coordination & branding.'}
              </p>
              <ul className="space-y-3 text-xs text-zinc-300 mb-8 border-t border-white/10 pt-6">
                <li className="flex items-center gap-2">
                  <CheckCircle size={14} weight="bold" className="text-emerald-400" />
                  <span>{isKo ? '소형 플랜의 모든 기능 포함' : 'Includes all Small Academy features'}</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={14} weight="bold" className="text-emerald-400" />
                  <span>{isKo ? '학원 로고 삽입 맞춤 PDF 리포트' : 'Custom Academy Logo on PDF Reports'}</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={14} weight="bold" className="text-emerald-400" />
                  <span>{isKo ? '우선 기술 지원 & 온보딩 가이드' : 'Priority Technical Support & Onboarding'}</span>
                </li>
                <li className="flex items-center gap-2 font-bold text-orange-400">
                  <Sparkle size={14} weight="bold" />
                  <span>{isKo ? '소속 학부모 전원 Chekki Pro 무료 제공' : 'FREE Chekki Pro for All Class Parents'}</span>
                </li>
              </ul>
            </div>
            <button
              type="button"
              onClick={() => openPlanModal('medium', 'Medium Academy Plan (3-5 Teachers)', '중형 학원 플랜 (3~5인 강사)', 39000, 3)}
              className="w-full py-3.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-2xl text-center shadow-lg shadow-orange-500/20 transition-all active:scale-[0.98] cursor-pointer"
            >
              {isKo ? '계좌이체 & 세금계산서 신청' : 'Request Bank Invoice'}
            </button>
          </div>

          {/* Plan 3: Large Academy & Franchise */}
          <div className={`p-8 border rounded-3xl flex flex-col justify-between transition-all ${
            isNight 
              ? 'bg-[#050505] border-white/10 hover:border-white/20' 
              : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
          }`}>
            <div>
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-black uppercase tracking-wider text-purple-400">
                  {isKo ? '대형 학원 & 프랜차이즈 (6인 이상)' : '6+ Teachers'}
                </span>
              </div>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="font-display text-4xl font-black text-white">{isKo ? '₩29,000' : '$22'}</span>
                <span className="text-xs text-zinc-500 font-bold">{isKo ? '/월 (강사 1인당)' : '/mo per teacher'}</span>
              </div>
              <p className="text-xs text-zinc-400 mb-6 leading-relaxed">
                {isKo ? '대형 어학원 및 여러 캠퍼스를 보유한 교육 기관을 위한 볼륨 할인 플랜' : 'Volume-discounted solution for multi-branch campuses and large academies.'}
              </p>
              <ul className="space-y-3 text-xs text-zinc-300 mb-8 border-t border-white/5 pt-6">
                <li className="flex items-center gap-2">
                  <CheckCircle size={14} weight="bold" className="text-emerald-400" />
                  <span>{isKo ? '중형 플랜의 모든 기능 포함' : 'Includes all Medium Academy features'}</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={14} weight="bold" className="text-emerald-400" />
                  <span>{isKo ? '원장 전용 전 캠퍼스 통합 대시보드' : 'Multi-Campus Director Dashboard'}</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={14} weight="bold" className="text-emerald-400" />
                  <span>{isKo ? '전담 매니저 배정 & 1:1 세팅 지원' : 'Dedicated Account Success Manager'}</span>
                </li>
                <li className="flex items-center gap-2 font-bold text-orange-400">
                  <Sparkle size={14} weight="bold" />
                  <span>{isKo ? '소속 학부모 전원 Chekki Pro 무료 제공' : 'FREE Chekki Pro for All Class Parents'}</span>
                </li>
              </ul>
            </div>
            <button
              type="button"
              onClick={() => openPlanModal('large', 'Large Academy Plan (6+ Teachers)', '대형 학원 플랜 (6인 이상)', 29000, 6)}
              className="w-full py-3.5 bg-white/5 hover:bg-white/10 text-white font-bold text-xs rounded-2xl border border-white/10 text-center transition-all active:scale-[0.98] cursor-pointer"
            >
              {isKo ? '계좌이체 & 세금계산서 신청' : 'Request Bank Invoice'}
            </button>
          </div>
        </div>
      </section>

      {/* --- SIGNUP / PARTNERSHIP DEMO FORM --- */}
      <section id="demo" className="max-w-xl mx-auto px-6 py-24 w-full text-center">
        <h2 className={`font-display text-3xl font-black tracking-tight mb-3 ${isNight ? 'text-white' : 'text-zinc-900'}`}>
          {isKo ? 'ChekkiAI 도입 문의' : 'Apply for Partnership'}
        </h2>
        <p className={`text-sm leading-relaxed mb-8 ${isNight ? 'text-zinc-400' : 'text-zinc-600'}`}>
          {isKo 
            ? '정보를 남겨주시면 담당 파트너가 24시간 내에 제휴 설명서 및 데모 어카운트 구성을 위해 연락드리겠습니다.'
            : 'Fill out the form below. Our school operations team will contact you within 24 hours to set up your academy dashboard demo.'}
        </p>

        {submitSuccess ? (
          <div className={`p-8 border rounded-2xl text-center space-y-4 ${
            isNight ? 'bg-emerald-500/5 border-emerald-500/10' : 'bg-emerald-50 border-emerald-200'
          }`}>
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto text-xl">
              ✓
            </div>
            <h3 className={`font-display text-lg font-black ${isNight ? 'text-white' : 'text-zinc-900'}`}>
              {isKo ? '도입 신청 완료!' : 'Application Submitted!'}
            </h3>
            <p className={`text-xs sm:text-sm leading-relaxed ${isNight ? 'text-zinc-400' : 'text-zinc-600'}`}>
              {isKo 
                ? '입력해주신 연락처/이메일로 제휴 파트너가 곧 연락드리겠습니다. 감사합니다.'
                : 'We have received your request and will follow up shortly to provision your demo account.'}
            </p>
            <button
              onClick={() => setSubmitSuccess(false)}
              className="text-xs text-orange-500 font-bold hover:underline mt-2 block mx-auto"
            >
              {isKo ? '새 신청서 작성' : 'Submit another request'}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className={`block text-xs font-black ${isNight ? 'text-zinc-400' : 'text-zinc-600'} uppercase tracking-widest`}>
                  {isKo ? '교육기관명/학원명 *' : 'Academy Name *'}
                </label>
                <input
                  type="text"
                  required
                  value={academyName}
                  onChange={(e) => setAcademyName(e.target.value)}
                  placeholder="E.g. POLY Seocho"
                  className={`w-full ${isNight ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-white border-zinc-200 text-zinc-900'} border rounded-xl px-4 py-3 focus:border-orange-500 outline-none text-sm`}
                />
              </div>

              <div className="space-y-1.5">
                <label className={`block text-xs font-black ${isNight ? 'text-zinc-400' : 'text-zinc-600'} uppercase tracking-widest`}>
                  {isKo ? '담당자 성함 *' : 'Contact Person *'}
                </label>
                <input
                  type="text"
                  required
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="E.g. John Doe"
                  className={`w-full ${isNight ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-white border-zinc-200 text-zinc-900'} border rounded-xl px-4 py-3 focus:border-orange-500 outline-none text-sm`}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className={`block text-xs font-black ${isNight ? 'text-zinc-400' : 'text-zinc-600'} uppercase tracking-widest`}>
                {isKo ? '이메일 주소 *' : 'Email Address *'}
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="director@academy.com"
                className={`w-full ${isNight ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-white border-zinc-200 text-zinc-900'} border rounded-xl px-4 py-3 focus:border-orange-500 outline-none text-sm`}
              />
            </div>

            <div className="space-y-1.5">
              <label className={`block text-xs font-black ${isNight ? 'text-zinc-400' : 'text-zinc-600'} uppercase tracking-widest`}>
                {isKo ? '연락처 (선택)' : 'Phone Number (Optional)'}
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="010-0000-0000"
                className={`w-full ${isNight ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-white border-zinc-200 text-zinc-900'} border rounded-xl px-4 py-3 focus:border-orange-500 outline-none text-sm`}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-black text-sm rounded-3xl shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 mt-2"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <span>{isKo ? '문의 및 데모 신청 접수' : 'Submit Demo Request'}</span>
              )}
            </button>
          </form>
        )}
      </section>

      {/* --- CORPORATE BANK TRANSFER & TAX INVOICE MODAL --- */}
      {showBankModal && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/85 backdrop-blur-md" 
            onClick={() => setShowBankModal(false)} 
          />
          <div className="relative w-full max-w-lg p-1 bg-white/5 border border-white/10 rounded-[2.5rem] shadow-2xl animate-fade-in text-left">
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
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                      <Receipt size={24} weight="bold" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 font-mono">
                        {isKo ? '신청 접수 완료' : 'INVOICE CREATED'}
                      </span>
                      <h3 className="text-xl font-black text-white">
                        {isKo ? '계좌이체 & 세금계산서 청구서' : 'Bank Transfer Invoice'}
                      </h3>
                    </div>
                  </div>

                  {/* Summary Card */}
                  <div className="p-5 bg-[#050505] border border-white/10 rounded-2xl space-y-3">
                    <div className="flex justify-between items-center text-xs pb-3 border-b border-white/5 font-mono">
                      <span className="text-zinc-500">{isKo ? '청구 코드' : 'Invoice ID'}:</span>
                      <span className="font-bold text-orange-400">{invoiceResult.invoiceId}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-zinc-400">{isKo ? '선택 플랜' : 'Selected Plan'}:</span>
                      <span className="font-bold text-white">{isKo ? selectedPlan.nameKo : selectedPlan.nameEn}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-zinc-400">{isKo ? '신청 교사 수' : 'Teacher Seats'}:</span>
                      <span className="font-bold text-white">{invoiceResult.teacherCount} {isKo ? '명' : 'seats'}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm pt-2 border-t border-white/5 font-bold">
                      <span className="text-zinc-300">{isKo ? '총 입금 금액' : 'Total Amount'}:</span>
                      <span className="text-xl font-black text-emerald-400 font-mono">
                        ₩{(invoiceResult.totalAmount || 0).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Corporate Bank Account Details */}
                  <div className="p-5 bg-orange-500/5 border border-orange-500/20 rounded-2xl space-y-3">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-orange-400 flex items-center gap-1.5 font-mono">
                      <Bank size={14} weight="bold" />
                      <span>{isKo ? '입금 계좌 정보' : 'Corporate Bank Account'}</span>
                    </span>

                    <div className="space-y-1 text-xs">
                      <p className="text-zinc-400">{isKo ? '은행' : 'Bank'}: <strong className="text-white">신한은행 (Shinhan Bank)</strong></p>
                      <p className="text-zinc-400">{isKo ? '예금주' : 'Holder'}: <strong className="text-white">(주)체키AI (Chekki AI Inc.)</strong></p>
                      <div className="flex items-center justify-between gap-2 pt-2">
                        <p className="font-mono text-base font-black text-white select-all">110-524-889012</p>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText('110-524-889012');
                            setCopiedBank(true);
                            setTimeout(() => setCopiedBank(false), 2000);
                          }}
                          className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-[10px] rounded-xl flex items-center gap-1 transition-all active:scale-[0.95]"
                        >
                          <Copy size={12} weight="bold" />
                          <span>{copiedBank ? (isKo ? '복사됨!' : 'Copied!') : (isKo ? '계좌 복사' : 'Copy')}</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  <p className="text-[11px] text-zinc-400 leading-relaxed text-center bg-white/5 p-3 rounded-xl border border-white/5">
                    {isKo 
                      ? '💡 입금 확인 후 24시간 내에 국세청 전자 세금계산서가 발행되며, 교사 인증 코드가 이메일로 즉시 발송됩니다.'
                      : '💡 Electronic tax invoice will be issued within 24 hours of payment verification. Teacher authorization codes will be emailed immediately.'}
                  </p>

                  <button
                    type="button"
                    onClick={() => { setShowBankModal(false); setInvoiceResult(null); }}
                    className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-2xl shadow-xl shadow-orange-500/20 transition-all active:scale-[0.98]"
                  >
                    {isKo ? '확인 및 닫기' : 'Done & Close'}
                  </button>
                </div>
              ) : (
                /* Bank Transfer Request Form */
                <form onSubmit={handleRequestBankInvoice} className="space-y-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center">
                      <Bank size={20} weight="bold" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-white">
                        {isKo ? '계좌이체 & 세금계산서 신청' : 'Request Bank Invoice'}
                      </h3>
                      <p className="text-xs text-orange-400 font-bold">
                        {isKo ? selectedPlan.nameKo : selectedPlan.nameEn}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1 text-left">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-1">
                      {isKo ? '교육기관명 / 학원명 *' : 'Academy Name *'}
                    </label>
                    <input
                      type="text"
                      required
                      value={academyName}
                      onChange={(e) => setAcademyName(e.target.value)}
                      placeholder="E.g. POLY Seocho"
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
                        {isKo ? '필요 교사 수 *' : 'Teacher Seats *'}
                      </label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={teacherCount}
                        onChange={(e) => setTeacherCount(Math.max(1, Number(e.target.value)))}
                        className="w-full bg-[#050505] border border-white/10 focus:border-orange-500 outline-none text-xs p-3.5 rounded-xl transition-all text-white font-mono"
                      />
                    </div>
                  </div>

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

                  <div className="p-4 bg-white/5 border border-white/5 rounded-2xl flex justify-between items-center text-xs mt-2">
                    <span className="text-zinc-400 font-bold">{isKo ? '예상 월 청구액' : 'Total Monthly Amount'}:</span>
                    <span className="text-lg font-black text-emerald-400 font-mono">
                      ₩{(selectedPlan.price * teacherCount).toLocaleString()}
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={isRequestingInvoice}
                    className="group w-full py-4 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-black text-xs rounded-2xl shadow-xl shadow-orange-500/20 transition-all duration-300 active:scale-[0.97] flex items-center justify-center gap-2 mt-4"
                  >
                    {isRequestingInvoice ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>{isKo ? '청구서 생성 및 계좌 정보 받기' : 'Generate Bank Invoice'}</span>
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
