import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useReducedMotion } from "framer-motion";
import { 
  PlayCircle, 
  GraduationCap, 
  ArrowRight, 
  List, 
  X,
  Storefront,
  SpotifyLogo,
  FilePdf,
  UserCircle,
  InstagramLogo,
  DownloadSimple,
  Moon,
  Sun,
  TiktokLogo,
  GameController,
  ShareNetwork,
  ChartBar
} from "@phosphor-icons/react";

export default function Landing() {
  const reduce = useReducedMotion();
  const heroRef = useRef<HTMLElement>(null);
  const textRevealRef = useRef<HTMLHeadingElement>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [lang, setLang] = useState<'en' | 'ko'>('en');
  const [flippedCard, setFlippedCard] = useState<number | null>(null);

  // Initialize theme
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = savedTheme === 'dark' || (!savedTheme && prefersDark) ? 'dark' : 'light';
    setTheme(initialTheme);
    
    if (initialTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    if (reduce) return;

    const ctx = gsap.context(() => {
      // Hero animations
      gsap.from(".hero-element", {
        y: 40,
        opacity: 0,
        duration: 1.2,
        stagger: 0.1,
        ease: "power3.out",
        delay: 0.1
      });

      // Trust Text Reveal
      if (textRevealRef.current) {
        const words = textRevealRef.current.querySelectorAll(".reveal-word");
        gsap.fromTo(words, 
          { opacity: 0.2 },
          {
            opacity: 1,
            ease: "none",
            stagger: 0.1,
            scrollTrigger: {
              trigger: textRevealRef.current,
              start: "top 80%",
              end: "bottom 50%",
              scrub: true
            }
          }
        );
      }

      // Bento Cards Scroll Animation
      gsap.from(".bento-card", {
        y: 60,
        opacity: 0,
        duration: 1,
        stagger: 0.15,
        ease: "power3.out",
        scrollTrigger: {
          trigger: "#features",
          start: "top 75%",
        }
      });
    });
    return () => ctx.revert();
  }, [reduce]);

  return (
    <main className="overflow-x-hidden w-full max-w-full bg-[#FAFAFA] dark:bg-[#050505] min-h-screen text-slate-900 dark:text-slate-50 transition-colors duration-500 selection:bg-brand selection:text-white">
      {/* Global Noise */}
      <div className="fixed inset-0 z-[100] pointer-events-none opacity-[0.03] bg-noise mix-blend-overlay" />

      {/* Navigation */}
      <div className="fixed top-6 left-0 w-full z-50 flex justify-center px-4">
        <header className="flex h-14 items-center justify-between px-6 max-w-4xl w-full mx-auto bg-white/80 dark:bg-white/5 backdrop-blur-2xl border border-black/5 dark:border-white/10 rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.05)] dark:shadow-2xl transition-colors duration-500">
          <div className="flex items-center gap-[2px] text-2xl tracking-tighter cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <span className="font-bold text-slate-900 dark:text-white leading-none">Chekki</span>
            <span className="font-extrabold text-brand leading-none">ai</span>
          </div>
          
          <nav className="hidden md:flex items-center gap-8">
            <a href="/app" className="text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-white/60 dark:hover:text-white transition-colors outline-none focus-visible:ring-2 focus-visible:ring-brand rounded-sm">Web App</a>
            <a href="#features" className="text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-white/60 dark:hover:text-white transition-colors outline-none focus-visible:ring-2 focus-visible:ring-brand rounded-sm">Features</a>
            <a href="#ecosystem" className="text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-white/60 dark:hover:text-white transition-colors outline-none focus-visible:ring-2 focus-visible:ring-brand rounded-sm">Ecosystem</a>
          </nav>
          
          <div className="hidden md:flex items-center gap-4">
            <button 
              onClick={() => setLang(lang === 'en' ? 'ko' : 'en')}
              className="text-slate-500 hover:text-slate-900 dark:text-white/60 dark:hover:text-white transition-colors h-8 px-2 flex items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-xs font-bold"
              aria-label="Toggle language"
            >
              {lang === 'en' ? 'KO' : 'EN'}
            </button>
            <button 
              onClick={toggleTheme}
              className="text-slate-500 hover:text-slate-900 dark:text-white/60 dark:hover:text-white transition-colors w-8 h-8 flex items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? <Moon size={20} weight="bold" /> : <Sun size={20} weight="bold" />}
            </button>
            <a href="/app" className="group relative overflow-hidden items-center gap-3 px-4 py-1.5 bg-brand text-white font-semibold rounded-full text-xs uppercase tracking-wider transition-transform duration-700 ease-[var(--ease-premium)] active:scale-[0.96] flex outline-none focus-visible:ring-2 focus-visible:ring-brand">
              <span>Open App</span>
            </a>
          </div>

          {/* Mobile menu */}
          <button 
            className="md:hidden relative w-10 h-10 flex items-center justify-center rounded-full bg-black/5 dark:bg-white/10 text-slate-900 dark:text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={20} weight="bold" /> : <List size={20} weight="bold" />}
          </button>
        </header>
      </div>

      {/* ATTENTION: Hero Section - Artistic Asymmetry */}
      <section id="main-content" ref={heroRef} className="relative py-32 md:py-40 px-4 md:px-8 max-w-7xl mx-auto w-full flex flex-col md:flex-row items-center justify-between gap-12 md:gap-8 min-h-[80dvh]">
        <div className="flex-1 flex flex-col items-start z-10 w-full">
          <div className="hero-element mb-6 inline-flex items-center rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em] font-medium bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-slate-600 dark:text-white/70">
            {lang === 'en' ? 'For Parents & Educators' : '학부모 및 교육자를 위한'}
          </div>
          <h1 className="text-balance hero-element text-[clamp(2.5rem,5.5vw,6rem)] font-bold tracking-tighter leading-[1.05] text-slate-900 dark:text-white w-full max-w-4xl">
            {lang === 'en' ? (
              <>Homework tracking, <br />made <span className="text-brand">transparent.</span></>
            ) : (
              <>복잡했던 숙제 관리, <br /><span className="text-brand">가장 투명하게.</span></>
            )}
          </h1>
          <p className="hero-element mt-8 text-lg md:text-xl text-slate-600 dark:text-white/60 leading-relaxed max-w-xl">
            {lang === 'en' 
              ? "Empower your child's education. Chekki helps Korean parents track homework, auto-grade worksheets, and share interactive progress reports directly with tutors — no typing, no prompting."
              : "자녀의 학습을 주도적으로 이끌어주세요. 체키는 숙제를 추적하고, 학습지를 자동 채점하며, 인터랙티브 리포트를 선생님께 바로 공유합니다 — 입력도, 프롬프트도 없이."}
          </p>
          <div className="hero-element mt-12 flex flex-col sm:flex-row items-center gap-6 w-full sm:w-auto">
            {/* Primary Magnetic CTA */}
            <a href="/app" className="group relative w-full sm:w-auto overflow-hidden pl-8 pr-2 py-2 bg-brand text-white font-bold rounded-full text-lg flex items-center justify-between gap-8 transition-transform duration-700 ease-[var(--ease-premium)] active:scale-[0.98] shadow-2xl shadow-brand/20 outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#050505]">
              <span className="relative z-10">{lang === 'en' ? 'Open Web App' : '웹 앱 열기'}</span>
              <div className="w-12 h-12 rounded-full bg-black/20 flex items-center justify-center transition-transform duration-700 ease-[var(--ease-premium)] group-hover:scale-105 group-hover:translate-x-1 group-hover:-translate-y-[1px]">
                <ArrowRight weight="bold" />
              </div>
            </a>
            
            {/* Secondary Magnetic CTA */}
            <a href="https://urlgeni.us/chekki" target="_blank" rel="noopener noreferrer" className="group relative w-full sm:w-auto overflow-hidden pl-8 pr-2 py-2 bg-black/5 dark:bg-white/5 text-slate-900 dark:text-white font-bold rounded-full text-lg flex items-center justify-between gap-8 border border-black/10 dark:border-white/10 transition-transform duration-700 ease-[var(--ease-premium)] active:scale-[0.98] hover:bg-black/10 dark:hover:bg-white/10 outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#050505]">
              <span className="relative z-10">{lang === 'en' ? 'Download App' : '앱 다운로드'}</span>
              <div className="w-12 h-12 rounded-full bg-black/10 dark:bg-white/10 flex items-center justify-center transition-transform duration-700 ease-[var(--ease-premium)] group-hover:scale-105 group-hover:-translate-y-[2px]">
                <DownloadSimple weight="bold" />
              </div>
            </a>
          </div>
        </div>
        
        {/* Overlapping Artistic Asset */}
        <div className="hero-element flex-1 w-full relative h-[400px] md:h-[700px] flex justify-end">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[500px] aspect-square bg-brand/20 rounded-full blur-[120px]" />
          <img
            src="https://res.cloudinary.com/dginphpy4/image/upload/e_background_removal,f_png/v1771383933/Chekki_Futuristic_Background_i8foqe.png"
            alt="Chekki App Graphic"
            className="absolute inset-0 w-full h-full object-contain drop-shadow-[0_20px_50px_rgba(249,115,22,0.3)] z-10"
          />
        </div>
      </section>

      {/* DESIRE: GSAP Scrubbing Text Reveal with Video Background */}
      <section className="py-32 md:py-40 px-4 bg-[#FAFAFA] dark:bg-[#050505] border-y border-black/5 dark:border-white/5 relative overflow-hidden flex items-center justify-center min-h-[70dvh]">
        {/* Cinematic Video Background */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[#FAFAFA]/90 dark:bg-[#050505]/80 z-10" />
          <video 
            autoPlay 
            loop 
            muted 
            playsInline 
            className={`w-full h-full object-cover opacity-30 dark:opacity-20 ${theme === 'light' ? 'mix-blend-multiply' : 'mix-blend-screen'}`}
          >
            <source src="https://res.cloudinary.com/dginphpy4/video/upload/v1765769964/chekki-intro_y7hj7c.mp4" type="video/mp4" />
          </video>
        </div>

        <div className="max-w-5xl mx-auto text-center relative z-20">
          <h2 ref={textRevealRef} className="text-balance text-[clamp(2.5rem,5vw,5rem)] font-medium leading-[1.2] text-slate-900 dark:text-white tracking-tight">
            {(lang === 'en' ? `Bridging the cultural gap between school and home.` : `학교와 가정, 두 문화 사이의 간극을 잇습니다.`).split(" ").map((word, i) => (
              <span key={i} className="reveal-word inline-block mr-[0.3em]">{word}</span>
            ))}
          </h2>
        </div>
      </section>

      {/* GAPLESS BENTO FEATURES */}
      <section id="features" className="py-32 md:py-40 px-4 md:px-8 max-w-7xl mx-auto w-full">
        <div className="mb-16 flex flex-col items-center text-center">
          <div className="mb-4 inline-flex items-center rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em] font-bold bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-slate-600 dark:text-white/70">
            {lang === 'en' ? 'Pain Points Solved' : '문제 해결'}
          </div>
          <h2 className="text-balance text-[clamp(2.5rem,5vw,4rem)] font-bold tracking-tight text-slate-900 dark:text-white mb-6">
            {lang === 'en' ? 'End the daily homework battle.' : '매일 반복되던 숙제 전쟁, 이제 끝내세요.'}
          </h2>
          <p className="text-xl text-slate-600 dark:text-white/60 max-w-2xl mx-auto">
            {lang === 'en' 
              ? 'We built Chekki to solve the exact challenges parents face when helping their children with English assignments.' 
              : '체키는 영어 숙제를 지도할 때 부모님들이 겪는 실제 어려움을 정확히 해결하기 위해 만들어졌습니다.'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 auto-rows-[380px] gap-4">
          {/* Card 1: Setup */}
          <div 
            className="bento-card col-span-1 row-span-1 rounded-[2.5rem] bg-white dark:bg-[#0A0A0A] border border-black/5 dark:border-white/10 p-3 shadow-xl dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] flex flex-col group hover:border-brand/30 transition-colors duration-500 cursor-pointer overflow-hidden relative"
            onClick={() => setFlippedCard(flippedCard === 1 ? null : 1)}
          >
            {/* Front Content */}
            <div className={`flex flex-col h-full transition-all duration-500 ${flippedCard === 1 ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'}`}>
              <div className="flex-1 rounded-[2rem] bg-[#050505] relative overflow-hidden flex items-center justify-center p-8">
                <img src="/assets/onboarding_icon_setup_1782545212856.png" className="w-full h-full object-contain filter drop-shadow-2xl group-hover:scale-110 transition-transform duration-700 ease-[var(--ease-premium)]" />
                <div className="absolute bottom-4 right-4 bg-white/10 backdrop-blur-md rounded-full p-2 animate-pulse">
                  <ArrowRight className="text-white" />
                </div>
              </div>
              <div className="min-h-[120px] px-5 py-6 flex flex-col justify-center">
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white leading-tight flex items-center justify-between">
                  {lang === 'en' ? 'Worried about your English?' : '"내 영어 실력으로 가르칠 수 있을까?" 걱정되시나요?'}
                </h3>
              </div>
            </div>

            {/* Back Content (Revealed) */}
            <div className={`absolute inset-0 p-8 flex flex-col justify-center bg-brand/5 dark:bg-brand/10 backdrop-blur-2xl transition-all duration-500 ${flippedCard === 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8 pointer-events-none'}`}>
              <div className="w-12 h-12 rounded-full bg-brand/20 text-brand flex items-center justify-center mb-6">
                <GraduationCap weight="fill" className="text-2xl" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                {lang === 'en' ? 'Overcome the Language Barrier' : '언어 장벽 극복'}
              </h3>
              <p className="text-slate-600 dark:text-white/80 text-sm md:text-base leading-relaxed">
                {lang === 'en' ? 'Don\'t let complex phonics instructions stress you out. Get instant, step-by-step bilingual scripts so you can confidently guide your child without tears.' : '복잡한 파닉스 설명에 스트레스 받지 마세요. 한국어와 영어로 된 단계별 티칭 스크립트로 아이를 다정하게 지도할 수 있습니다.'}
              </p>
              <div className="absolute top-6 right-6 text-brand">
                <X weight="bold" className="text-xl" />
              </div>
            </div>
          </div>

          {/* Card 2: Assistant */}
          <div 
            className="bento-card col-span-1 md:col-span-2 row-span-1 rounded-[2.5rem] bg-white dark:bg-[#0A0A0A] border border-black/5 dark:border-white/10 p-3 shadow-xl dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] flex flex-col md:flex-row group hover:border-brand/30 transition-colors duration-500 cursor-pointer overflow-hidden relative"
            onClick={() => setFlippedCard(flippedCard === 2 ? null : 2)}
          >
            {/* Front Content */}
            <div className={`flex flex-col md:flex-row h-full w-full transition-all duration-500 ${flippedCard === 2 ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'}`}>
              <div className="md:w-1/2 min-h-[140px] h-full px-5 py-6 md:py-10 flex flex-col justify-center order-2 md:order-1">
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white leading-tight flex items-center gap-2">
                  {lang === 'en' ? 'Exhausted after work?' : '퇴근 후 피곤하신가요?'}
                  <ArrowRight className="text-brand animate-pulse" />
                </h3>
              </div>
              <div className="md:w-1/2 h-48 md:h-full rounded-[2rem] bg-[#050505] relative overflow-hidden flex items-center justify-center order-1 md:order-2 p-8">
                <img src="/assets/onboarding_icon_grader_1782545224150.png" className="w-full h-full object-contain filter drop-shadow-2xl group-hover:scale-105 transition-transform duration-700 ease-[var(--ease-premium)]" />
              </div>
            </div>

            {/* Back Content (Revealed) */}
            <div className={`absolute inset-0 p-8 flex flex-col justify-center bg-blue-500/5 dark:bg-blue-500/10 backdrop-blur-2xl transition-all duration-500 ${flippedCard === 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8 pointer-events-none'}`}>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                {lang === 'en' ? 'Instant AI Grading' : '1초 AI 자동 채점'}
              </h3>
              <p className="text-slate-600 dark:text-white/80 text-sm md:text-base leading-relaxed max-w-lg">
                {lang === 'en' ? 'Skip the 20-minute hunt for answer keys. Zero typing. Zero prompting. Just snap a photo, and get accurate digital answers overlaid directly on tonight\'s worksheet in seconds.' : '20분씩 답지를 찾는 수고는 이제 그만. 타이핑도, 프롬프트 입력도 필요 없습니다. 사진 한 장만 찍으면 오늘 밤 숙제 위에 정확한 정답이 몇 초 만에 마법처럼 나타납니다.'}
              </p>
              <div className="absolute top-6 right-6 text-blue-500">
                <X weight="bold" className="text-xl" />
              </div>
            </div>
          </div>

          {/* Card 3: Dashboard */}
          <div 
            className="bento-card col-span-1 md:col-span-2 row-span-1 rounded-[2.5rem] bg-white dark:bg-[#0A0A0A] border border-black/5 dark:border-white/10 p-3 shadow-xl dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] flex flex-col md:flex-row group hover:border-brand/30 transition-colors duration-500 cursor-pointer overflow-hidden relative"
            onClick={() => setFlippedCard(flippedCard === 3 ? null : 3)}
          >
            {/* Front Content */}
            <div className={`flex flex-col md:flex-row h-full w-full transition-all duration-500 ${flippedCard === 3 ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'}`}>
              <div className="md:w-1/2 h-48 md:h-full rounded-[2rem] bg-[#050505] relative overflow-hidden flex items-center justify-center p-8">
                <img src="/assets/onboarding_icon_dashboard_1782545238800.png" className="w-full h-full object-contain filter drop-shadow-2xl group-hover:scale-105 transition-transform duration-700 ease-[var(--ease-premium)]" />
              </div>
              <div className="md:w-1/2 min-h-[140px] h-full px-5 py-6 md:py-10 flex flex-col justify-center">
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white leading-tight flex items-center gap-2">
                  {lang === 'en' ? 'Anxious they might fall behind?' : '우리 아이만 뒤쳐질까 봐 불안하신가요?'}
                  <ArrowRight className="text-orange-500 animate-pulse" />
                </h3>
              </div>
            </div>

            {/* Back Content (Revealed) */}
            <div className={`absolute inset-0 p-8 flex flex-col justify-center bg-orange-500/5 dark:bg-orange-500/10 backdrop-blur-2xl transition-all duration-500 ${flippedCard === 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8 pointer-events-none'}`}>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                {lang === 'en' ? 'Mistake Tracking Dashboard' : '오답 추적 대시보드'}
              </h3>
              <p className="text-slate-600 dark:text-white/80 text-sm md:text-base leading-relaxed max-w-lg">
                {lang === 'en' ? 'Replace expensive homework tutors. Chekki automatically saves every struggled question into a stress-free dashboard, acting as a 24/7 private tutor.' : '비싼 숙제 과외 선생님 대신 채키를 활용하세요. 아이가 어려워했던 문제를 대시보드에 자동 저장하여 24시간 개인 튜터 역할을 합니다.'}
              </p>
              <div className="absolute top-6 right-6 text-orange-500">
                <X weight="bold" className="text-xl" />
              </div>
            </div>
          </div>

          {/* Card 4: Interactive Quiz */}
          <div 
            className="bento-card col-span-1 row-span-1 rounded-[2.5rem] bg-white dark:bg-[#0A0A0A] border border-black/5 dark:border-white/10 p-3 shadow-xl dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] flex flex-col group hover:border-brand/30 transition-colors duration-500 cursor-pointer overflow-hidden relative"
            onClick={() => setFlippedCard(flippedCard === 4 ? null : 4)}
          >
            {/* Front Content */}
            <div className={`flex flex-col h-full transition-all duration-500 ${flippedCard === 4 ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'}`}>
              <div className="flex-1 rounded-[2rem] bg-[#050505] relative overflow-hidden flex items-center justify-center p-8">
                {/* Animated quiz mock UI */}
                <div className="w-full max-w-[220px] flex flex-col gap-2">
                  <div className="bg-white/10 rounded-xl p-3">
                    <p className="text-[10px] text-white/50 font-mono uppercase tracking-widest mb-1">{lang === 'en' ? 'Fix the sentence' : '문장을 고치세요'}</p>
                    <p className="text-sm font-bold text-white">{lang === 'en' ? '"She is play soccer."' : '"She is play soccer."'}</p>
                  </div>
                  {[
                    { label: lang === 'en' ? 'She plays soccer.' : 'She plays soccer.', correct: false },
                    { label: lang === 'en' ? 'She is playing soccer.' : 'She is playing soccer.', correct: true },
                    { label: lang === 'en' ? 'She are playing soccer.' : 'She are playing soccer.', correct: false },
                  ].map((opt, i) => (
                    <div key={i} className={`px-3 py-2 rounded-xl text-xs font-medium border-2 transition-colors ${
                      opt.correct 
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                        : 'bg-white/5 border-white/10 text-white/60'
                    }`}>{opt.label}</div>
                  ))}
                </div>
                <div className="absolute bottom-4 right-4 bg-white/10 backdrop-blur-md rounded-full p-2 animate-pulse">
                  <ArrowRight className="text-white" />
                </div>
              </div>
              <div className="min-h-[120px] px-5 py-6 flex flex-col justify-center">
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white leading-tight flex items-center justify-between">
                  {lang === 'en' ? 'Struggling to explain "why"?' : '"왜 틀렸는지" 설명하기 어려우신가요?'}
                </h3>
              </div>
            </div>

            {/* Back Content (Revealed) */}
            <div className={`absolute inset-0 p-8 flex flex-col justify-center bg-orange-500/5 dark:bg-orange-500/10 backdrop-blur-2xl transition-all duration-500 ${flippedCard === 4 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8 pointer-events-none'}`}>
              <div className="w-12 h-12 rounded-full bg-orange-500/20 text-orange-500 flex items-center justify-center mb-6">
                <GameController weight="fill" className="text-2xl" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                {lang === 'en' ? 'Interactive Practice Quizzes' : '인터랙티브 복습 퀴즈'}
              </h3>
              <p className="text-slate-600 dark:text-white/80 text-sm md:text-base leading-relaxed">
                {lang === 'en' 
                  ? "Turn every mistake into a game. Chekki auto-generates multiple-choice quizzes from your child's error bank — with Korean explanations for each answer, so you both understand why."
                  : "틀린 문제를 게임으로 바꿔보세요. 체키는 오답 목록에서 자동으로 객관식 퀴즈를 생성하고, 각 정답마다 한국어 설명을 제공하여 아이와 함께 이해할 수 있습니다."}
              </p>
              <div className="absolute top-6 right-6 text-orange-500">
                <X weight="bold" className="text-xl" />
              </div>
            </div>
          </div>

          {/* Card 5: Share with Tutor — Full Width */}
          <div 
            className="bento-card col-span-1 md:col-span-3 rounded-[2.5rem] bg-white dark:bg-[#0A0A0A] border border-black/5 dark:border-white/10 p-3 shadow-xl dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] flex flex-col md:flex-row group hover:border-emerald-500/30 transition-colors duration-500 overflow-hidden relative min-h-[320px]"
          >
            {/* Left: Text */}
            <div className="flex-1 px-8 py-10 md:py-12 flex flex-col justify-center z-10 relative">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em] font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 w-fit">
                <ShareNetwork size={12} weight="bold" />
                {lang === 'en' ? 'Pro Feature' : 'Pro 기능'}
              </div>
              <h3 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white leading-tight mb-5">
                {lang === 'en' 
                  ? <><span className="text-emerald-500">"Teacher,</span> here's exactly<br/>what they're struggling with."</>
                  : <><span className="text-emerald-500">"선생님,</span><br/>아이가 어려워하는 부분이 바로 이겁니다."</>}
              </h3>
              <p className="text-slate-600 dark:text-white/60 text-base leading-relaxed max-w-lg mb-8">
                {lang === 'en'
                  ? "No more vague parent-teacher conversations. Share a precise, AI-generated progress report and quiz results directly with your child's tutor or classroom teacher — in one tap."
                  : "막연한 학부모-교사 대화는 이제 그만. AI가 생성한 정확한 학습 리포트와 퀴즈 결과를 클릭 한 번으로 아이의 튜터나 선생님에게 바로 공유하세요."}
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <a href="/app" className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white font-bold rounded-full text-sm hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20">
                  <ShareNetwork size={16} weight="bold" />
                  {lang === 'en' ? 'Try the Report Feature' : '리포트 기능 체험하기'}
                </a>
                <div className="flex items-center gap-2 px-4 py-3 rounded-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10">
                  <ChartBar size={16} className="text-emerald-500" weight="bold" />
                  <span className="text-xs font-bold text-slate-600 dark:text-white/70">{lang === 'en' ? 'Mistake trends over time' : '오답 트렌드 추적'}</span>
                </div>
              </div>
            </div>

            {/* Right: Visual */}
            <div className="md:w-[45%] shrink-0 rounded-[2rem] bg-[#050505] relative overflow-hidden flex items-center justify-center p-8 min-h-[220px]">
              {/* Glow */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-emerald-500/20 rounded-full blur-[80px]" />
              {/* Mock report card */}
              <div className="relative z-10 w-full max-w-[280px] bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">{lang === 'en' ? 'Progress Report' : '학습 리포트'}</p>
                    <p className="text-sm font-bold text-white">{lang === 'en' ? 'Jun 2025 · Grammar' : '2025년 6월 · 문법'}</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                    <ShareNetwork size={16} className="text-emerald-400" />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  {[
                    { label: lang === 'en' ? 'Subject-verb agreement' : '주어-동사 일치', pct: 45, color: 'bg-red-500' },
                    { label: lang === 'en' ? 'Pronouns' : '대명사', pct: 72, color: 'bg-orange-500' },
                    { label: lang === 'en' ? 'Verb tenses' : '동사 시제', pct: 88, color: 'bg-emerald-500' },
                  ].map((item, i) => (
                    <div key={i}>
                      <div className="flex justify-between mb-1">
                        <span className="text-[10px] text-white/60 font-medium">{item.label}</span>
                        <span className="text-[10px] font-bold text-white/80">{item.pct}%</span>
                      </div>
                      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div className={`h-full ${item.color} rounded-full transition-all`} style={{ width: `${item.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="pt-2 border-t border-white/5">
                  <p className="text-[10px] text-white/40 font-medium">
                    {lang === 'en' ? '3 quizzes completed · Shared with tutor ✓' : '퀴즈 3회 완료 · 튜터에게 공유 완료 ✓'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CHEKKI ECOSYSTEM SECTION */}
      <section id="ecosystem" className="py-24 px-4 md:px-8 max-w-7xl mx-auto w-full border-t border-black/5 dark:border-white/5 mt-8">
        <div className="mb-16 flex flex-col items-center text-center">
          <div className="mb-4 inline-flex items-center rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em] font-bold bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-slate-600 dark:text-white/70">
            Chekki Ecosystem
          </div>
          <h2 className="text-balance text-[clamp(2.5rem,5vw,4rem)] font-bold tracking-tight text-slate-900 dark:text-white mb-6">
            Beyond the app
          </h2>
          <p className="text-xl text-slate-600 dark:text-white/60 max-w-2xl mx-auto">
            Explore our YouTube channel, podcast, Etsy shop, and free educational resources.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a href="https://www.youtube.com/@ChekkiAI" target="_blank" rel="noopener noreferrer" className="rounded-3xl bg-white dark:bg-[#0A0A0A] border border-black/5 dark:border-white/10 p-8 shadow-xl dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] flex items-center gap-6 group hover:border-brand/50 transition-colors">
            <div className="w-16 h-16 rounded-2xl bg-brand/10 text-brand flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <PlayCircle weight="fill" className="text-4xl" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">YouTube Channel</h3>
              <p className="text-slate-600 dark:text-white/60 text-sm">Watch our latest guides and educational content.</p>
            </div>
          </a>
          
          <a href="https://open.spotify.com/show/2onH0XU5yky37cBxdqKaY8" target="_blank" rel="noopener noreferrer" className="rounded-3xl bg-white dark:bg-[#0A0A0A] border border-black/5 dark:border-white/10 p-8 shadow-xl dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] flex items-center gap-6 group hover:border-green-500/50 transition-colors">
            <div className="w-16 h-16 rounded-2xl bg-green-500/10 text-green-500 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <SpotifyLogo weight="fill" className="text-4xl" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">Podcast</h3>
              <p className="text-slate-600 dark:text-white/60 text-sm">Listen to insights on bilingual education and AI.</p>
            </div>
          </a>

          <a href="https://www.etsy.com/shop/ChekkiAI?dd_referrer=" target="_blank" rel="noopener noreferrer" className="rounded-3xl bg-white dark:bg-[#0A0A0A] border border-black/5 dark:border-white/10 p-8 shadow-xl dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] flex items-center gap-6 group hover:border-brand/50 transition-colors">
            <div className="w-16 h-16 rounded-2xl bg-brand/10 text-brand flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <Storefront weight="fill" className="text-4xl" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">Etsy Shop</h3>
              <p className="text-slate-600 dark:text-white/60 text-sm">Get premium digital resources and templates.</p>
            </div>
          </a>

          <a href="https://www.teacherspayteachers.com/store/chekki-ai" target="_blank" rel="noopener noreferrer" className="rounded-3xl bg-white dark:bg-[#0A0A0A] border border-black/5 dark:border-white/10 p-8 shadow-xl dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] flex items-center gap-6 group hover:border-blue-500/50 transition-colors">
            <div className="w-16 h-16 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <Storefront weight="fill" className="text-4xl" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">TPT Store</h3>
              <p className="text-slate-600 dark:text-white/60 text-sm">Download educational resources for your classroom.</p>
            </div>
          </a>

          <a href="https://www.tiktok.com/@chekkiai" target="_blank" rel="noopener noreferrer" className="rounded-3xl bg-white dark:bg-[#0A0A0A] border border-black/5 dark:border-white/10 p-8 shadow-xl dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] flex items-center gap-6 group hover:border-pink-500/50 transition-colors">
            <div className="w-16 h-16 rounded-2xl bg-pink-500/10 text-pink-500 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <TiktokLogo weight="fill" className="text-4xl" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">TikTok</h3>
              <p className="text-slate-600 dark:text-white/60 text-sm">Follow us for quick tips and community highlights.</p>
            </div>
          </a>

          <a href="https://chekkiai.netlify.app/" target="_blank" rel="noopener noreferrer" className="rounded-3xl bg-white dark:bg-[#0A0A0A] border border-black/5 dark:border-white/10 p-8 shadow-xl dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] flex items-center gap-6 group hover:border-red-500/50 transition-colors">
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <FilePdf weight="fill" className="text-4xl" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">Free Educational Resources</h3>
              <p className="text-slate-600 dark:text-white/60 text-sm">Download our Top 100 Grammar Mistakes guide.</p>
            </div>
          </a>
        </div>
      </section>

      {/* CTA FOOTER - DEEP DARK MODE */}
      <footer className="py-32 md:py-48 px-4 md:px-8 bg-[#020617] text-white flex flex-col items-center justify-center text-center relative overflow-hidden border-t-8 border-brand">
        <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.05] bg-noise mix-blend-overlay" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[800px] aspect-square bg-brand/10 rounded-full blur-[150px] pointer-events-none" />
        
        <h2 className="text-balance relative z-10 text-[clamp(3.5rem,6vw,6rem)] font-bold tracking-tight max-w-4xl leading-[1.05] mb-16">
          {lang === 'en' ? <>Ready to end the <br /> homework fights?</> : <>매일 밤 숙제 전쟁, <br /> 이제 끝낼 준비 되셨나요?</>}
        </h2>
        
        <div className="bento-card relative z-10 flex flex-col items-center gap-6">
          <a href="/app" className="group relative overflow-hidden px-10 py-5 bg-gradient-to-b from-slate-700 to-slate-900 border border-slate-500 rounded-full text-xl flex items-center justify-center gap-4 transition-transform duration-700 ease-[var(--ease-premium)] active:scale-[0.98] shadow-[0_0_40px_rgba(234,88,12,0.3)] hover:shadow-[0_0_60px_rgba(234,88,12,0.5)] outline-none focus-visible:ring-2 focus-visible:ring-brand ring-1 ring-white/10">
            <span className="relative z-20 font-bold tracking-wide">Get Started Now</span>
          </a>
          <a href="#features" className="text-white/60 hover:text-white underline underline-offset-4 decoration-white/20 transition-colors">
            or learn more about our AI-powered features
          </a>
        </div>
        
        <div className="bento-card relative z-10 mt-32 flex flex-col items-center gap-6">
          <div className="flex items-center gap-6 text-white/50 text-sm font-medium mb-4">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
          </div>
          <a href="https://www.instagram.com/chekki__ai" target="_blank" rel="noopener noreferrer" className="text-brand hover:text-brand-hover transition-colors">
            <InstagramLogo size={32} weight="fill" />
          </a>
          <p className="text-white/40 font-medium text-sm">
            © {new Date().getFullYear()} Chekki. Designed for parents & educators.
          </p>
        </div>
      </footer>
    </main>
  );
}
