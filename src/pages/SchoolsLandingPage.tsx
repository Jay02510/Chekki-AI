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
  Moon
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
    <div className={`min-h-screen ${isNight ? 'bg-[#030305] text-zinc-100' : 'bg-[#FAFAFB] text-zinc-900'} font-sans transition-colors duration-200 relative overflow-hidden flex flex-col`}>
      {/* Background radial glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-orange-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-orange-500/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Mini top bar */}
      <div className={`border-b ${isNight ? 'border-white/5 bg-black/10' : 'border-zinc-200 bg-white/50'} py-3 px-6 backdrop-blur-md sticky top-0 z-50`}>
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
            <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ml-2 ${isNight ? 'bg-zinc-800 text-zinc-400' : 'bg-zinc-100 text-zinc-500'}`}>
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
                  : 'border-zinc-200 hover:bg-zinc-100 text-zinc-600 hover:text-zinc-900'
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
                  : 'border-zinc-200 hover:bg-zinc-100 text-zinc-600 hover:text-zinc-900'
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
                : 'bg-zinc-100 border-zinc-200 hover:bg-zinc-200 text-zinc-900'
            }`}
          >
            {isKo ? '교사용 데모 로그인' : 'Try Demo Portal'}
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

      {/* --- BENTO GRID SECTION --- */}
      <section className="max-w-7xl mx-auto px-6 py-20 w-full flex-1">
        <div className="text-center mb-12">
          <h2 className={`font-display text-2xl sm:text-4xl font-black ${isNight ? 'text-white' : 'text-zinc-900'}`}>
            {isKo ? '영어 전문 교육을 위한 완벽한 시스템' : 'Designed Specially for English Academies'}
          </h2>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Bento Cell 1: Curriculum Pre-seeding (Large block, spans 2 columns) */}
          <div className={`md:col-span-2 p-8 border rounded-2xl flex flex-col justify-between transition-all ${
            isNight 
              ? 'bg-zinc-900/50 border-white/5 hover:border-white/10' 
              : 'bg-white border-zinc-200 hover:border-zinc-300'
          } hover:-translate-y-0.5 duration-200 shadow-sm relative overflow-hidden group`}>

            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="flex-1">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500 mb-6">
                  <GraduationCap size={20} weight="bold" />
                </div>
                <h3 className={`font-display text-xl md:text-2xl font-black mb-3 ${isNight ? 'text-white' : 'text-zinc-900'}`}>
                  {isKo ? '매주 맞춤 교재 단어장 연동 (Curriculum Seeding)' : 'Weekly Curriculum Pre-seeding'}
                </h3>
                <p className={`text-sm leading-relaxed max-w-xl ${isNight ? 'text-zinc-400' : 'text-zinc-600'}`}>
                  {isKo 
                    ? '선생님이 대시보드에 학년별/학급별 주간 단어와 핵심 리딩 문장을 입력해 두면, 학생이 올린 오답을 분석할 때 인공지능이 우리 학원 교재를 기반으로 100% 맞춤형 첨삭을 수행합니다.'
                    : "Seed each class's active spelling vocabulary lists, target phonics, and reading passages. Our grading engine aligns its OCR check straight to your weekly textbook targets."}
                </p>
              </div>
              <div className={`w-full md:w-48 lg:w-56 flex-shrink-0 rounded-2xl overflow-hidden p-2 transition-all duration-300 ${isNight ? 'bg-zinc-950/60 border border-white/10' : 'bg-slate-100/80 border border-slate-200/80'}`}>
                <img src="/assets/schools/schools_bento_curriculum.png" alt="Curriculum seeding interface" className="w-full h-auto object-contain filter drop-shadow-md" loading="lazy" />
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-zinc-900/10 flex items-center gap-2 text-xs font-bold text-orange-500">
              <span>{isKo ? 'AI 교정 일치율 극대화' : 'Near-perfect hand-written text resolution'}</span>
              <Sparkle size={12} weight="bold" />
            </div>
          </div>

          {/* Bento Cell 2: Roster approvals (1 column) */}
          <div className={`p-8 border rounded-2xl flex flex-col justify-between transition-all ${
            isNight 
              ? 'bg-zinc-900/50 border-white/5 hover:border-white/10' 
              : 'bg-white border-zinc-200 hover:border-zinc-300'
          } hover:-translate-y-0.5 duration-200 shadow-sm relative overflow-hidden group`}>
            <div>
              <div className="w-10 h-10 rounded-xl bg-brand-purple/10 border border-brand-purple/20 flex items-center justify-center text-brand-purple mb-4">
                <Users size={20} weight="bold" />
              </div>
              <h3 className={`font-display text-xl font-black mb-3 ${isNight ? 'text-white' : 'text-zinc-900'}`}>
                {isKo ? '6자리 학급 코드로 원스톱 가입' : 'Quick Class Join Code'}
              </h3>
              <p className={`text-xs sm:text-sm leading-relaxed ${isNight ? 'text-zinc-400' : 'text-zinc-600'}`}>
                {isKo 
                  ? '복잡한 이메일 추가 절차 없이, 선생님이 발급한 학급 코드(예: MERC82)만 학부모가 입력하면 신청 끝. 클릭 한 번으로 수락 및 이동 관리가 가능합니다.'
                  : 'Skip complex email invitations. Teachers distribute simple 6-letter class codes. Parents enter it inside Settings and link automatically.'}
              </p>
            </div>

            <div className={`mt-4 rounded-2xl overflow-hidden p-2 flex justify-center transition-all duration-300 ${isNight ? 'bg-zinc-950/60 border border-white/10' : 'bg-slate-100/80 border border-slate-200/80'}`}>
              <img src="/assets/schools/schools_bento_join_code.png" alt="Class join code entry UI" className="w-full max-w-[240px] h-auto object-contain filter drop-shadow-md" loading="lazy" />
            </div>
          </div>

          {/* Bento Cell 3: Analytics (1 column) */}
          <div className={`p-8 border rounded-2xl flex flex-col justify-between transition-all ${
            isNight 
              ? 'bg-zinc-900/50 border-white/5 hover:border-white/10' 
              : 'bg-white border-zinc-200 hover:border-zinc-300'
          } hover:-translate-y-0.5 duration-200 shadow-sm relative overflow-hidden group`}>
            <div>
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500 mb-4">
                <ChartBar size={20} weight="bold" />
              </div>
              <h3 className={`font-display text-xl font-black mb-3 ${isNight ? 'text-white' : 'text-zinc-900'}`}>
                {isKo ? '자동 취약 어휘 분석 리포트' : 'Classroom Diagnostics'}
              </h3>
              <p className={`text-xs sm:text-sm leading-relaxed ${isNight ? 'text-zinc-400' : 'text-zinc-600'}`}>
                {isKo 
                  ? '반 아이들의 오답 데이터가 실시간으로 분석 보드에 집계됩니다. 교사는 매주 학생들이 가장 많이 틀리는 어휘와 파닉스 단어 순위를 보고받아 보강 수업에 적용할 수 있습니다.'
                  : 'Mistake histories are parsed concurrently. Instantly view vocabulary struggle rates across your entire class list and focus lessons on actual blind spots.'}
              </p>
            </div>

            <div className={`mt-4 rounded-2xl overflow-hidden p-2 flex justify-center transition-all duration-300 ${isNight ? 'bg-zinc-950/60 border border-white/10' : 'bg-slate-100/80 border border-slate-200/80'}`}>
              <img src="/assets/schools/schools_bento_diagnostics.png" alt="Classroom diagnostics dashboard" className="w-full max-w-[240px] h-auto object-contain filter drop-shadow-md" loading="lazy" />
            </div>
          </div>

          {/* Bento Cell 4: Parent Sync (Large block, spans 2 columns) */}
          <div className={`md:col-span-2 p-8 border rounded-2xl flex flex-col justify-between transition-all ${
            isNight 
              ? 'bg-zinc-900/50 border-white/5 hover:border-white/10' 
              : 'bg-white border-zinc-200 hover:border-zinc-300'
          } hover:-translate-y-0.5 duration-200 shadow-sm relative overflow-hidden group`}>

            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="flex-1">
                <div className="w-10 h-10 rounded-xl bg-brand-pink/10 border border-brand-pink/20 flex items-center justify-center text-brand-pink mb-6">
                  <Sparkle size={20} weight="bold" />
                </div>
                <h3 className={`font-display text-xl md:text-2xl font-black mb-3 ${isNight ? 'text-white' : 'text-zinc-900'}`}>
                  {isKo ? '학부모 만족도를 높이는 전용 AI 오답 리포트' : 'Elevated Parent Care & Branding'}
                </h3>
                <p className={`text-sm leading-relaxed max-w-xl ${isNight ? 'text-zinc-400' : 'text-zinc-600'}`}>
                  {isKo 
                    ? '가정에서 숙제를 카메라로 찍으면 3초 만에 학원 진도에 맞게 자동 채점됩니다. 학부모님께는 학원 로고가 포함된 정교한 교정 결과와 원어민 발음 듣기, AI 튜터 챗봇 창이 노출되어 학원의 디지털 관리 신뢰도가 비약적으로 향상됩니다.'
                    : "Every homework graded in parents' app matches your academy dashboard. Deliver native pronunciation audio files, custom review tips, and personalized feedback matching the student's age."}
                </p>
                <div className="mt-8 pt-4 border-t border-zinc-900/10 flex items-center gap-1.5 text-xs font-bold text-brand-pink">
                  <CheckCircle size={14} weight="bold" />
                  <span>{isKo ? '밀착 학부모 케어로 재원율 증가' : 'Increase student retention with digital care'}</span>
                </div>
              </div>
              <div className={`w-full md:w-44 lg:w-52 flex-shrink-0 rounded-2xl overflow-hidden p-2 transition-all duration-300 ${isNight ? 'bg-zinc-950/60 border border-white/10' : 'bg-slate-100/80 border border-slate-200/80'}`}>
                <img src="/assets/schools/schools_bento_parent_care.png" alt="Parent homework report UI" className="w-full h-auto object-contain filter drop-shadow-md" loading="lazy" />
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
