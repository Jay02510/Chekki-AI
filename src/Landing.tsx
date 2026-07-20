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
  ChartBar,
  MicrophoneStage,
  CheckCircle
} from "@phosphor-icons/react";

export default function Landing() {
  const reduce = useReducedMotion();
  const heroRef = useRef<HTMLElement>(null);
  const textRevealRef = useRef<HTMLHeadingElement>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [lang, setLang] = useState<'en' | 'ko'>('en');
  
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
      gsap.fromTo(
        ".bento-card",
        { y: 30, opacity: 0.8 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          stagger: 0.1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: "#features",
            start: "top 95%",
          }
        }
      );
    });
    return () => ctx.revert();
  }, [reduce]);

  return (
    <main className="overflow-x-hidden w-full max-w-full bg-[#F3F4F6] dark:bg-[#050505] min-h-screen text-slate-900 dark:text-slate-50 transition-colors duration-200 selection:bg-brand selection:text-white">
      {/* Global Noise */}
      <div className="fixed inset-0 z-[100] pointer-events-none opacity-[0.03] bg-noise mix-blend-overlay" />

      {/* Navigation */}
      <div className="fixed top-6 left-0 w-full z-50 flex justify-center px-4">
        <header className="relative flex h-14 items-center justify-between px-6 max-w-4xl w-full mx-auto bg-white/80 dark:bg-white/5 backdrop-blur-2xl border border-black/5 dark:border-white/10 rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.05)] dark:shadow-2xl transition-colors duration-200">
          <div className="flex items-center gap-[2px] text-2xl tracking-tighter cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <span className="font-bold text-slate-900 dark:text-white leading-none">Chekki</span>
            <span className="font-extrabold text-brand leading-none">ai</span>
          </div>
          
          <nav className="hidden md:flex items-center gap-8">
            <a href="/app" className="text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-white/60 dark:hover:text-white transition-colors outline-none focus-visible:ring-2 focus-visible:ring-brand rounded-sm">
              {lang === 'en' ? 'Web App' : '웹 앱'}
            </a>
            <a href="/schools" className="text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-white/60 dark:hover:text-white transition-colors outline-none focus-visible:ring-2 focus-visible:ring-brand rounded-sm">
              {lang === 'en' ? 'For Schools' : '교육기관용'}
            </a>
            <a href="#features" className="text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-white/60 dark:hover:text-white transition-colors outline-none focus-visible:ring-2 focus-visible:ring-brand rounded-sm">
              {lang === 'en' ? 'Features' : '주요 기능'}
            </a>
            <a href="#ecosystem" className="text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-white/60 dark:hover:text-white transition-colors outline-none focus-visible:ring-2 focus-visible:ring-brand rounded-sm">
              {lang === 'en' ? 'Ecosystem' : '생태계'}
            </a>
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
              <span>{lang === 'en' ? 'Open App' : '앱 실행'}</span>
            </a>
          </div>

          {/* Mobile menu */}
          <button 
            className="md:hidden relative w-10 h-10 flex items-center justify-center rounded-full bg-black/5 dark:bg-white/10 text-slate-900 dark:text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={20} weight="bold" /> : <List size={20} weight="bold" />}
          </button>

          {/* Mobile dropdown menu */}
          {mobileMenuOpen && (
            <div className="absolute top-[calc(100%+0.5rem)] left-0 right-0 w-full bg-white/95 dark:bg-[#111]/95 backdrop-blur-2xl border border-black/5 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col md:hidden z-50 origin-top animate-fade-in-up">
              <div className="flex flex-col p-2 gap-1">
                <a href="/app" onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 text-base font-bold text-slate-900 dark:text-white rounded-2xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                  {lang === 'en' ? 'Web App' : '웹 앱'}
                </a>
                <a href="/schools" onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 text-base font-bold text-slate-900 dark:text-white rounded-2xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                  {lang === 'en' ? 'For Schools' : '교육기관용'}
                </a>
                <a href="#features" onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 text-base font-bold text-slate-900 dark:text-white rounded-2xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                  {lang === 'en' ? 'Features' : '주요 기능'}
                </a>
                <a href="#ecosystem" onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 text-base font-bold text-slate-900 dark:text-white rounded-2xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                  {lang === 'en' ? 'Ecosystem' : '생태계'}
                </a>
              </div>
            </div>
          )}
        </header>
      </div>

      {/* ATTENTION: Hero Section - Artistic Asymmetry */}
      <section id="main-content" ref={heroRef} className="relative py-32 md:py-40 px-4 md:px-8 max-w-7xl mx-auto w-full flex flex-col-reverse md:flex-row items-center justify-between gap-12 md:gap-8 min-h-[80dvh]">
        <div className="flex-1 flex flex-col items-start z-10 w-full">
          <div className="hero-element mb-6 inline-flex items-center rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em] font-medium bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-slate-600 dark:text-white/70">
            {lang === 'en' ? 'For Parents & Educators' : '아이와 엄마를 위한 영어 학습 파트너'}
          </div>
          <h1 className="text-balance hero-element text-[clamp(2.5rem,5.5vw,6rem)] font-bold tracking-tighter leading-[1.05] text-slate-900 dark:text-white w-full max-w-4xl [word-break:keep-all]">
            {lang === 'en' ? (
              <>Homework tracking, <br />made <span className="text-brand">transparent.</span></>
            ) : (
              <>매일 밤 힘들었던 영어 숙제, <br /><span className="text-brand">이제 엄마도 마음 편하게.</span></>
            )}
          </h1>
          <p className="hero-element mt-8 text-lg md:text-xl text-slate-600 dark:text-white/60 leading-relaxed max-w-xl [word-break:keep-all]">
            {lang === 'en' 
              ? "End the daily homework battle. Chekki instantly auto-grades English worksheets, tracks mistakes, and acts as a 24/7 private tutor. No typing. No prompting. Just answers."
              : "퇴근 후 지친 저녁, 아이 영어 숙제 봐주느라 더 이상 애태우지 마세요. 체키가 사진 한 장으로 1초 만에 채점하고 오답을 챙겨주는 든든한 AI 튜터가 되어드릴게요."}
          </p>
          <div className="hero-element mt-12 flex flex-col sm:flex-row items-center gap-6 w-full sm:w-auto">
            {/* Primary Magnetic CTA */}
            <a href="/app" className="group relative w-full sm:w-auto overflow-hidden pl-8 pr-2 py-2 bg-brand text-white font-bold rounded-full text-lg flex items-center justify-between gap-8 transition-transform duration-700 ease-[var(--ease-premium)] active:scale-[0.98] shadow-2xl shadow-brand/20 outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#050505]">
              <span className="relative z-10">{lang === 'en' ? 'Open Web App' : '웹 앱 시작하기'}</span>
              <div className="w-12 h-12 rounded-full bg-black/20 flex items-center justify-center transition-transform duration-700 ease-[var(--ease-premium)] group-hover:scale-[1.02] group-hover:translate-x-1 group-hover:-translate-y-[1px]">
                <ArrowRight weight="bold" />
              </div>
            </a>
            
            {/* Secondary Magnetic CTA */}
            <a href="https://urlgeni.us/chekki" target="_blank" rel="noopener noreferrer" className="group relative w-full sm:w-auto overflow-hidden pl-8 pr-2 py-2 bg-black/5 dark:bg-white/5 text-slate-900 dark:text-white font-bold rounded-full text-lg flex items-center justify-between gap-8 border border-black/10 dark:border-white/10 transition-transform duration-700 ease-[var(--ease-premium)] active:scale-[0.98] hover:bg-black/10 dark:hover:bg-white/10 outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#050505]">
              <span className="relative z-10">{lang === 'en' ? 'Download App' : '앱 다운로드'}</span>
              <div className="w-12 h-12 rounded-full bg-black/10 dark:bg-white/10 flex items-center justify-center transition-transform duration-700 ease-[var(--ease-premium)] group-hover:scale-[1.02] group-hover:-translate-y-[2px]">
                <DownloadSimple weight="bold" />
              </div>
            </a>
          </div>
        </div>
        
        {/* Overlapping Artistic Asset */}
        <div className="hero-element flex-1 w-full relative h-[350px] md:h-[700px] flex justify-center md:justify-end">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[350px] md:max-w-[500px] aspect-square bg-brand/20 rounded-full blur-[100px] md:blur-[120px]" />
          <img
            src="https://res.cloudinary.com/dginphpy4/image/upload/e_background_removal,f_png/v1771383933/Chekki_Futuristic_Background_i8foqe.png"
            alt="Chekki App Graphic"
            className="absolute inset-0 w-full h-full object-contain drop-shadow-[0_20px_50px_rgba(249,115,22,0.3)] z-10"
          />
        </div>
      </section>

      {/* DESIRE: GSAP Scrubbing Text Reveal with Video Background */}
      <section className="py-16 md:py-20 px-4 bg-[#F3F4F6] dark:bg-[#050505] border-y border-black/5 dark:border-white/5 relative overflow-hidden flex flex-col items-center justify-center">
        {/* Cinematic Video Background */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[#F3F4F6]/90 dark:bg-[#050505]/80 z-10" />
          <video 
            autoPlay 
            loop 
            muted 
            playsInline 
            className={`w-full h-full object-cover opacity-30 dark:opacity-20 ${theme === 'light' ? 'mix-blend-multiply' : 'mix-blend-screen'}`}
          >
            <source src="/chekki-hero.mp4" type="video/mp4" />
          </video>
        </div>

        <div className="max-w-5xl mx-auto text-center relative z-20 flex flex-col items-center">
          <h2 ref={textRevealRef} className="text-balance text-[clamp(2rem,4.5vw,4.5rem)] font-bold leading-[1.2] text-slate-900 dark:text-white tracking-tight [word-break:keep-all]">
            {(lang === 'en' ? `Bridging the cultural gap between school and home.` : `학원 숙제 고민부터 집에서의 영어 공부까지, 엄마의 마음으로 함께합니다.`).split(" ").map((word, i) => (
              <span key={i} className="reveal-word inline-block mr-[0.3em]">{word}</span>
            ))}
          </h2>

          <div className="mt-8">
            <a
              href="/schools"
              className="inline-flex items-center gap-3 px-8 py-4 bg-brand hover:bg-brand-hover text-white font-bold text-base rounded-full shadow-xl shadow-brand/20 transition-all duration-300 active:scale-[0.97] group"
            >
              <span>{lang === 'en' ? 'Chekki for English Academies' : '학원·교육기관 전용 체키 보러가기'}</span>
              <ArrowRight size={20} weight="bold" className="group-hover:translate-x-1 transition-transform" />
            </a>
          </div>
        </div>
      </section>

      {/* GAPLESS BENTO FEATURES */}
      <section id="features" className="py-16 md:py-24 px-4 md:px-8 max-w-7xl mx-auto w-full">
        <div className="mb-16 flex flex-col items-center text-center">
          <div className="mb-4 inline-flex items-center rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em] font-bold bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-slate-600 dark:text-white/70">
            {lang === 'en' ? 'Pain Points Solved' : '엄마의 고민 해결'}
          </div>
          <h2 className="text-balance text-[clamp(2.5rem,5vw,4rem)] font-bold tracking-tight text-slate-900 dark:text-white mb-6 [word-break:keep-all]">
            {lang === 'en' ? (
              'End the daily homework battle.'
            ) : (
              <>아이와의 영어 숙제 스트레스, <br className="hidden sm:inline" />이제 내려놓으세요.</>
            )}
          </h2>
          <p className="text-xl text-slate-600 dark:text-white/60 max-w-2xl mx-auto [word-break:keep-all]">
            {lang === 'en' 
              ? 'We built Chekki to solve the exact challenges parents face when helping their children with English assignments.' 
              : '아이 영어 숙제를 지도하며 느끼셨을 답답함과 지침, 엄마의 마음을 담아 가장 따뜻하고 쉽게 해결해 드립니다.'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-6 auto-rows-[380px] gap-4">
          {/* Card 1: Setup */}
          <div 
            className="bento-card col-span-1 md:col-span-2 row-span-1 rounded-[2.5rem] bg-white dark:bg-[#0A0A0A] border border-black/5 dark:border-white/10 p-3 shadow-xl dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] flex flex-col group hover:border-brand/30 transition-colors duration-200 overflow-hidden relative"
          >
            {/* Front Content */}
            <div className="flex flex-col h-full transition-all duration-200 opacity-100 scale-100 group-hover:opacity-0 group-hover:scale-95 group-hover:pointer-events-none">
              <div className="flex-1 rounded-[2rem] bg-transparent relative overflow-hidden flex items-center justify-center p-6 md:p-8">
                <img src={theme === 'light' ? '/assets/bento_light_reveal_only.png' : '/assets/bento_reveal_only.png'} className="w-full h-full object-contain filter drop-shadow-md group-hover:scale-105 transition-transform duration-700 ease-[var(--ease-premium)]" />
                <div className="absolute bottom-4 right-4 bg-slate-800/10 dark:bg-white/10 backdrop-blur-md rounded-full p-2 animate-pulse">
                  <ArrowRight className="text-slate-800 dark:text-white" />
                </div>
              </div>
              <div className="min-h-[120px] px-5 py-6 flex flex-col justify-center">
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white leading-tight flex items-center justify-between [word-break:keep-all]">
                  {lang === 'en' ? 'Exhausted after work?' : '퇴근 후 지친 몸으로 숙제 검사하기 힘드시죠?'}
                </h3>
              </div>
            </div>

            {/* Back Content (Revealed) */}
            <div className="absolute inset-0 p-8 flex flex-col justify-center bg-brand/5 dark:bg-brand/10 backdrop-blur-2xl transition-all duration-200 opacity-0 translate-y-8 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto">
              <div className="w-12 h-12 rounded-full bg-brand/20 text-brand flex items-center justify-center mb-6">
                <GraduationCap weight="fill" className="text-2xl" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4 [word-break:keep-all]">
                {lang === 'en' ? 'Zero Clutter UX' : '복잡함 없는 쉬운 화면'}
              </h3>
              <p className="text-slate-600 dark:text-white/80 text-sm md:text-base leading-relaxed [word-break:keep-all]">
                {lang === 'en' ? 'No typing. No prompting. No endless scrolling. Our Reveal-Only interface hides all complex teaching instructions until you need them, saving your tired eyes and brain.' : '타이핑이나 어려운 입력 필요 없이 카메라만 가져다 대세요. 꼭 필요한 정답과 설명만 쏙 보여드려 피곤한 엄마의 눈과 마음을 편안하게 해드려요.'}
              </p>
            </div>
          </div>

          {/* Card 2: Assistant */}
          <div 
            className="bento-card col-span-1 md:col-span-4 row-span-1 rounded-[2.5rem] bg-white dark:bg-[#0A0A0A] border border-black/5 dark:border-white/10 p-3 shadow-xl dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] flex flex-col md:flex-row group hover:border-brand/30 transition-colors duration-200 overflow-hidden relative"
          >
            {/* Front Content */}
            <div className="flex flex-col md:flex-row h-full w-full transition-all duration-200 opacity-100 scale-100 group-hover:opacity-0 group-hover:scale-95 group-hover:pointer-events-none">
              <div className="md:w-1/2 min-h-[140px] md:h-full px-5 py-6 md:py-10 flex flex-col justify-center order-2 md:order-1">
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white leading-tight flex items-center gap-2 [word-break:keep-all]">
                  {lang === 'en' ? 'Only have a few minutes?' : '저녁 준비하느라 바쁜데 시간이 부족하신가요?'}
                  <ArrowRight className="text-brand animate-pulse shrink-0" />
                </h3>
              </div>
              <div className="md:w-1/2 flex-1 md:h-full rounded-[2rem] bg-transparent relative overflow-hidden flex items-center justify-center order-1 md:order-2 p-6 md:p-8">
                <img src={theme === 'light' ? '/assets/bento_light_speed_mode.png' : '/assets/bento_speed_mode.png'} className="w-full h-full object-contain filter drop-shadow-md group-hover:scale-[1.02] transition-transform duration-700 ease-[var(--ease-premium)]" />
              </div>
            </div>

            {/* Back Content (Revealed) */}
            <div className="absolute inset-0 p-8 flex flex-col justify-center bg-blue-500/5 dark:bg-blue-500/10 backdrop-blur-2xl transition-all duration-200 opacity-0 translate-y-8 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4 [word-break:keep-all]">
                {lang === 'en' ? 'Speed vs. Tutor Mode' : '바쁠 땐 1초 채점, 필요할 땐 AI 선생님'}
              </h3>
              <p className="text-slate-600 dark:text-white/80 text-sm md:text-base leading-relaxed max-w-lg [word-break:keep-all]">
                {lang === 'en' ? 'Toggle "Speed Mode" to rapidly visually grade a 20-question worksheet with zero taps. Switch to "Tutor Mode" when your child is stuck, and let the native AI audio explain the concept for you.' : '바쁜 저녁에는 "1초 채점 모드"로 눈으로 슥 채점하고, 아이가 모르는 문제가 생기면 "튜터 모드"로 전환해 다정한 원어민 AI 선생님에게 맡겨주세요.'}
              </p>
            </div>
          </div>

          {/* Card 3: Dashboard */}
          <div 
            className="bento-card col-span-1 md:col-span-3 row-span-1 rounded-[2.5rem] bg-white dark:bg-[#0A0A0A] border border-black/5 dark:border-white/10 p-3 shadow-xl dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] flex flex-col group hover:border-brand/30 transition-colors duration-200 overflow-hidden relative"
          >
            {/* Front Content */}
            <div className="flex flex-col h-full transition-all duration-200 opacity-100 scale-100 group-hover:opacity-0 group-hover:scale-95 group-hover:pointer-events-none">
              <div className="flex-1 rounded-[2rem] bg-transparent relative overflow-hidden flex items-center justify-center p-6 md:p-8">
                <img src={theme === 'light' ? '/assets/bento_light_dashboard.png' : '/assets/onboarding_icon_dashboard_1782545238800.png'} className="w-full h-full object-contain filter drop-shadow-md group-hover:scale-105 transition-transform duration-700 ease-[var(--ease-premium)]" />
                <div className="absolute bottom-4 right-4 bg-slate-800/10 dark:bg-white/10 backdrop-blur-md rounded-full p-2 animate-pulse">
                  <ArrowRight className="text-slate-800 dark:text-white" />
                </div>
              </div>
              <div className="min-h-[120px] px-5 py-6 flex flex-col justify-center">
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white leading-tight flex items-center justify-between [word-break:keep-all]">
                  {lang === 'en' ? 'Anxious they might fall behind?' : '우리 아이만 학원에서 뒤쳐질까 봐 걱정되시나요?'}
                </h3>
              </div>
            </div>

            {/* Back Content (Revealed) */}
            <div className="absolute inset-0 p-8 flex flex-col justify-center bg-orange-500/5 dark:bg-orange-500/10 backdrop-blur-2xl transition-all duration-200 opacity-0 translate-y-8 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto">
              <div className="w-12 h-12 rounded-full bg-orange-500/20 text-orange-500 flex items-center justify-center mb-6">
                <ChartBar weight="fill" className="text-2xl" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4 [word-break:keep-all]">
                {lang === 'en' ? 'Mistake Tracking Dashboard' : '똑똑한 오답 정리 & 맞춤 케어'}
              </h3>
              <p className="text-slate-600 dark:text-white/80 text-sm md:text-base leading-relaxed [word-break:keep-all]">
                {lang === 'en' ? 'Replace expensive homework tutors. Chekki automatically saves every struggled question into a stress-free dashboard, acting as a 24/7 private tutor.' : '비싼 과외 없이도 괜찮아요. 아이가 헷갈려했던 오답만 쏙쏙 모아 자동으로 정리해주니, 언제든 아이의 약점을 꼼꼼하게 챙겨줄 수 있어요.'}
              </p>
            </div>
          </div>

          {/* Card 3.5: Grading Status */}
          <div 
            className="bento-card col-span-1 md:col-span-3 row-span-1 rounded-[2.5rem] bg-white dark:bg-[#0A0A0A] border border-black/5 dark:border-white/10 p-3 shadow-xl dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] flex flex-col group hover:border-brand/30 transition-colors duration-200 overflow-hidden relative"
          >
            {/* Front Content */}
            <div className="flex flex-col h-full transition-all duration-200 opacity-100 scale-100 group-hover:opacity-0 group-hover:scale-95 group-hover:pointer-events-none">
              <div className="flex-1 rounded-[2rem] bg-transparent relative overflow-hidden flex items-center justify-center p-6 md:p-8">
                <img src={theme === 'light' ? '/assets/bento_light_grading_status.png' : '/assets/onboarding_icon_grading_status.png'} className="w-full h-full object-contain filter drop-shadow-md group-hover:scale-105 transition-transform duration-700 ease-[var(--ease-premium)]" />
                <div className="absolute bottom-4 right-4 bg-slate-800/10 dark:bg-white/10 backdrop-blur-md rounded-full p-2 animate-pulse">
                  <ArrowRight className="text-slate-800 dark:text-white" />
                </div>
              </div>
              <div className="min-h-[120px] px-5 py-6 flex flex-col justify-center">
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white leading-tight flex items-center justify-between [word-break:keep-all]">
                  {lang === 'en' ? 'Tired of checking every question?' : '틀린 문제를 일일이 찾기 번거로우신가요?'}
                </h3>
              </div>
            </div>

            {/* Back Content (Revealed) */}
            <div className="absolute inset-0 p-8 flex flex-col justify-center bg-emerald-500/5 dark:bg-emerald-500/10 backdrop-blur-2xl transition-all duration-200 opacity-0 translate-y-8 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center mb-6">
                <CheckCircle weight="fill" className="text-2xl" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4 [word-break:keep-all]">
                {lang === 'en' ? 'Grading Status at a Glance' : '직관적인 정·오답 표시'}
              </h3>
              <p className="text-slate-600 dark:text-white/80 text-sm md:text-base leading-relaxed [word-break:keep-all]">
                {lang === 'en' ? 'Spot correct and incorrect answers instantly on the list. Green and red box outlines show status at a glance, so you don\'t have to click each card.' : '학습지 리스트에서 초록색(정답)과 빨간색(오답) 테두리로 채점 결과를 한눈에 확인하세요. 이제 틀린 오답을 찾으려 카드를 일일이 열어볼 필요가 없습니다.'}
              </p>
            </div>
          </div>

          {/* Card 4: Audio Practice Room */}
          <div 
            className="bento-card col-span-1 md:col-span-2 row-span-1 rounded-[2.5rem] bg-white dark:bg-[#0A0A0A] border border-black/5 dark:border-white/10 p-3 shadow-xl dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] flex flex-col group hover:border-brand/30 transition-colors duration-200 overflow-hidden relative"
          >
            {/* Front Content */}
            <div className="flex flex-col h-full transition-all duration-200 opacity-100 scale-100 group-hover:opacity-0 group-hover:scale-95 group-hover:pointer-events-none">
              <div className="flex-1 rounded-[2rem] bg-slate-100/60 dark:bg-[#050505] relative overflow-hidden flex items-center justify-center p-8">
                {/* Animated voice mock UI */}
                <div className="w-full max-w-[220px] flex flex-col items-center gap-4">
                  <div className="bg-black/5 dark:bg-white/10 rounded-xl p-4 text-center w-full">
                    <p className="text-sm font-bold text-slate-800 dark:text-white mb-2">{lang === 'en' ? '"She plays soccer."' : '"She plays soccer."'}</p>
                    <div className="flex items-center justify-center gap-1 h-6">
                      {[1, 2, 3, 4, 3, 2, 1].map((bar, i) => (
                        <div key={i} className="w-1.5 bg-emerald-400 rounded-full animate-pulse" style={{ height: `${bar * 20}%`, animationDelay: `${i * 0.1}s` }} />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="absolute bottom-4 right-4 bg-slate-800/10 dark:bg-white/10 backdrop-blur-md rounded-full p-2 animate-pulse">
                  <ArrowRight className="text-slate-800 dark:text-white" />
                </div>
              </div>
              <div className="min-h-[120px] px-5 py-6 flex flex-col justify-center">
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white leading-tight flex items-center justify-between [word-break:keep-all]">
                  {lang === 'en' ? 'Worried about pronunciation?' : '엄마표 영어 발음 지도, 자신 없으셨나요?'}
                </h3>
              </div>
            </div>

            {/* Back Content (Revealed) */}
            <div className="absolute inset-0 p-8 flex flex-col justify-center bg-emerald-500/5 dark:bg-emerald-500/10 backdrop-blur-2xl transition-all duration-200 opacity-0 translate-y-8 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center mb-6">
                <MicrophoneStage weight="fill" className="text-2xl" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4 [word-break:keep-all]">
                {lang === 'en' ? 'Interactive Audio Practice' : '자연스러운 원어민 발음 연습'}
              </h3>
              <p className="text-slate-600 dark:text-white/80 text-sm md:text-base leading-relaxed [word-break:keep-all]">
                {lang === 'en' 
                  ? "From paper to pronunciation. Chekki turns grammar mistakes into interactive speaking exercises, using native AI to evaluate their speech in real-time."
                  : "종이로 풀던 오답을 말하기 연습으로 이어줍니다. AI가 다정하게 아이의 발음을 듣고 교정해 주어, 엄마가 대신 가르쳐주지 않아도 스스로 자신감이 붙어요."}
              </p>
            </div>
          </div>

          {/* Card 5: Pronunciation Check — Full Width */}
          <div 
            className="bento-card col-span-1 md:col-span-4 rounded-[2.5rem] bg-white dark:bg-[#0A0A0A] border border-black/5 dark:border-white/10 p-6 md:p-10 shadow-xl dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] flex flex-col md:flex-row items-center justify-between gap-8 group hover:border-emerald-500/30 transition-colors duration-200 relative"
          >
            {/* Left: Text */}
            <div className="flex-1 flex flex-col items-start justify-center z-10 relative">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[10px] uppercase tracking-[0.2em] font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 w-fit">
                <MicrophoneStage size={14} weight="bold" />
                <span>{lang === 'en' ? 'No Typing. Just Speaking.' : '엄마 대신 듣고 말해주는 AI'}</span>
              </div>
              <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 dark:text-white leading-[1.25] mb-4 [word-break:keep-all]">
                {lang === 'en' 
                  ? <><span className="text-emerald-500">Speak it right,</span><br/>not just write it right.</>
                  : <><span className="text-emerald-500">틀린 문법도 원어민 발음으로,</span><br/>아이가 스스로 재미있게 말하도록.</>}
              </h3>
              <p className="text-slate-600 dark:text-white/60 text-sm sm:text-base leading-relaxed max-w-lg mb-6 [word-break:keep-all]">
                {lang === 'en'
                  ? "Traditional worksheets can't hear you. Chekki leverages advanced native device speech recognition to ensure your child isn't just fixing grammar, but mastering spoken English — privately and instantly."
                  : "눈으로만 푸는 문제집은 이제 그만! 체키는 아이의 작은 목소리에도 귀 기울여, 문법 오답을 다정한 원어민 발음 연습으로 바꿔줍니다."}
              </p>
              <a href="/app" className="group relative overflow-hidden pl-7 pr-2 py-2 w-max bg-emerald-500 text-white font-bold rounded-full text-sm flex items-center justify-between gap-6 transition-transform duration-300 active:scale-[0.98] shadow-lg shadow-emerald-500/20 outline-none">
                <span className="relative z-10">{lang === 'en' ? 'Try the Practice Room' : '발음 연습실 체험해보기'}</span>
                <div className="w-8 h-8 rounded-full bg-black/20 flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
                  <MicrophoneStage weight="bold" />
                </div>
              </a>
            </div>

            {/* Right: Visual */}
            <div className="md:w-[45%] shrink-0 rounded-[2rem] bg-transparent relative overflow-hidden flex items-center justify-center p-6 md:p-8 min-h-[240px]">
              {/* Glow */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-emerald-500/20 rounded-full blur-[80px]" />
              {/* Mock audio card */}
              <div className="relative z-10 w-full max-w-[280px] bg-white dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-2xl p-6 flex flex-col gap-6 text-center shadow-lg dark:shadow-none animate-fade-in">
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                  {lang === 'en' ? 'Read aloud' : '소리 내어 읽어보세요'}
                </p>
                <p className="text-xl font-bold text-slate-800 dark:text-white">She plays soccer.</p>
                
                <div className="w-20 h-20 mx-auto rounded-full bg-emerald-500/20 flex items-center justify-center relative">
                  <div className="absolute inset-0 rounded-full border-2 border-emerald-400 animate-ping opacity-50" />
                  <MicrophoneStage size={32} className="text-emerald-400" weight="fill" />
                </div>
                
                <div className="bg-emerald-50 dark:bg-emerald-500/20 border border-emerald-100 dark:border-emerald-500/30 rounded-xl py-3 px-4 flex items-center justify-center gap-2">
                  <CheckCircle size={20} className="text-emerald-400" weight="fill" />
                  <span className="text-sm font-bold text-emerald-400">{lang === 'en' ? 'Perfect Match' : '참 잘했어요!'}</span>
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
        
        <h2 className="text-balance relative z-10 text-[clamp(3.5rem,6vw,6rem)] font-bold tracking-tight max-w-4xl leading-[1.05] mb-16 [word-break:keep-all]">
          {lang === 'en' ? <>Ready to end the <br /> homework fights?</> : <>매일 밤 힘들었던 영어 숙제, <br /> 이제 마음 편히 끝내볼까요?</>}
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
            <a href="/schools" className="hover:text-white transition-colors">{lang === 'en' ? 'For Schools' : '교육기관용'}</a>
            <a href="/privacy.html" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="/terms.html" className="hover:text-white transition-colors">Terms of Service</a>
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
