import { useEffect, useRef, useState } from 'react';
import ChekkiAiBentoGrid from './components/ChekkiAiBentoGrid';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useReducedMotion } from 'framer-motion';
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
  TiktokLogo,
  DownloadSimple,
  Sun,
  Moon,
  Globe,
  Buildings,
} from '@phosphor-icons/react';

export default function Home() {
  const reduce = useReducedMotion();
  const heroRef = useRef<HTMLElement>(null);
  const textRevealRef = useRef<HTMLHeadingElement>(null);
  const [mounted, setMounted] = useState(false);
  const [isNight, setIsNight] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isKo, setIsKo] = useState<boolean>(true);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('chekki_lang');
      if (saved) {
        setIsKo(saved === 'ko');
      }
    }
  }, []);

  const toggleLanguage = () => {
    const next = !isKo;
    setIsKo(next);
    if (typeof window !== 'undefined') {
      localStorage.setItem('chekki_lang', next ? 'ko' : 'en');
    }
  };

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    if (reduce) return;

    const ctx = gsap.context(() => {
      // Artistic Entrance
      gsap.from('.hero-text', {
        y: 60,
        opacity: 0,
        duration: 1.2,
        stagger: 0.15,
        ease: 'power3.out',
      });

      gsap.from('.hero-mascot', {
        scale: 0.9,
        opacity: 0,
        duration: 1.5,
        delay: 0.2,
        ease: 'power3.out',
      });

      // Scrubbing Text Reveal
      if (textRevealRef.current) {
        const words = textRevealRef.current.querySelectorAll('.reveal-word');
        gsap.fromTo(
          words,
          { opacity: 0.1 },
          {
            opacity: 1,
            ease: 'none',
            stagger: 0.1,
            scrollTrigger: {
              trigger: textRevealRef.current,
              start: 'top 80%',
              end: 'bottom 50%',
              scrub: true,
            },
          }
        );
      }
    });

    return () => ctx.revert();
  }, [reduce]);

  // Handle Mobile Menu Scroll Lock
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
  }, [mobileMenuOpen]);

  return (
    <main className={`overflow-x-hidden w-full max-w-full min-h-screen transition-colors duration-500 selection:bg-brand selection:text-white ${
      isNight ? 'bg-[#050505] text-slate-50' : 'bg-slate-50 text-slate-900'
    }`}>
      {/* Accessibility: Skip to Content */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-[9999] bg-brand text-white px-4 py-2 rounded-full font-bold outline-none focus-visible:ring-2 focus-visible:ring-white"
      >
        Skip to content
      </a>

      {/* Global Noise Overlay */}
      <div className="fixed inset-0 z-[100] pointer-events-none opacity-[0.03] bg-noise mix-blend-overlay" />

      {/* Navigation - Floating Island Pill */}
      <div className="fixed top-6 left-0 w-full z-50 flex justify-center px-4">
        <header className={`flex h-14 items-center gap-4 md:gap-8 px-6 backdrop-blur-2xl border rounded-full shadow-2xl transition-colors duration-500 ${
          isNight 
            ? 'bg-white/10 border-white/15 text-white shadow-black/40' 
            : 'bg-white/90 border-slate-200/90 text-slate-900 shadow-slate-200/60'
        }`}>
          {/* Logo */}
          <a href="#" className="flex items-center gap-2 shrink-0">
            <span className="font-extrabold text-lg tracking-tight">
              Chekki<span className="text-brand">AI</span>
            </span>
          </a>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-6">
            <a
              href={isKo ? '/schools?lang=ko' : '/schools?lang=en'}
              className={`text-sm font-medium transition-colors ${
                isNight ? 'text-white/70 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {isKo ? '학원/교사 안내' : 'For Schools'}
            </a>
          </nav>

          {/* Right Action Cluster */}
          <div className="hidden md:flex items-center gap-3">
            {/* KO / EN LANGUAGE TOGGLE */}
            <button
              type="button"
              onClick={toggleLanguage}
              className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 transition-all cursor-pointer ${
                isNight 
                  ? 'bg-white/5 border-white/15 text-white/90 hover:bg-white/15' 
                  : 'bg-slate-100 border-slate-300 text-slate-800 hover:bg-slate-200'
              }`}
              title="Switch Language / 언어 변경"
            >
              <Globe size={14} weight="bold" className="text-brand" />
              <span>{isKo ? '한국어' : 'English'}</span>
            </button>

            {/* Sun / Moon Theme Toggle */}
            <button
              type="button"
              onClick={() => setIsNight(!isNight)}
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
              href="https://chekki-ai.vercel.app/app"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative overflow-hidden items-center gap-2 px-4 py-1.5 bg-brand text-white font-bold rounded-full text-xs uppercase tracking-wider transition-transform duration-700 active:scale-[0.96] flex"
            >
              <span>{isKo ? '앱 열기' : 'Open App'}</span>
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
              onClick={() => setIsKo(!isKo)}
              className="px-4 py-2 rounded-full bg-brand text-white text-sm font-bold flex items-center gap-2 mb-4"
            >
              <Globe size={18} />
              <span>{isKo ? '언어 변경 (Current: 한국어)' : 'Switch Language (Current: English)'}</span>
            </button>

            <a
              href="https://chekki-ai.vercel.app/app"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setMobileMenuOpen(false)}
              className="hover:text-brand transition-colors"
            >
              {isKo ? '웹앱 시작하기' : 'Web App'}
            </a>
            


            <a
              href="/schools"
              onClick={() => setMobileMenuOpen(false)}
              className="text-brand font-black hover:scale-105 transition-transform"
            >
              {isKo ? '🏫 학원/교사 전용 안내 (Schools)' : '🏫 For Schools & Teachers'}
            </a>

            <a
              href="https://urlgeni.us/chekki"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setMobileMenuOpen(false)}
              className="hover:text-brand transition-colors"
            >
              {isKo ? '모바일 앱 다운로드' : 'Download App'}
            </a>
          </nav>
        </div>
      )}

      {/* HERO SECTION */}
      <section
        id="main-content"
        ref={heroRef}
        className="relative pt-32 md:pt-40 pb-32 md:pb-48 px-4 md:px-8 max-w-7xl mx-auto w-full flex flex-col md:flex-row items-center justify-between gap-12 md:gap-8 min-h-[100dvh]"
      >
        <div className="flex-1 flex flex-col items-start z-10 w-full">
          <div className={`hero-text mb-6 inline-flex items-center rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em] font-bold border ${
            isNight ? 'bg-white/5 border-white/10 text-white/70' : 'bg-slate-200/60 border-slate-300 text-slate-700'
          }`}>
            {isKo ? '학부모 & 교사를 위한 AI 서비스' : 'For Parents & Educators'}
          </div>

          <h1 className={`hero-text text-[clamp(2.5rem,5.5vw,5.5rem)] font-bold tracking-tighter leading-[1.05] w-full max-w-4xl ${
            isNight ? 'text-white' : 'text-slate-900'
          }`}>
            {isKo ? (
              <>숙제 검사는 스마트하게, <br />채점은 <span className="text-brand">투명하게.</span></>
            ) : (
              <>Homework tracking, <br />made <span className="text-brand">transparent.</span></>
            )}
          </h1>

          <p className={`hero-text mt-8 text-lg md:text-xl leading-relaxed max-w-xl ${
            isNight ? 'text-white/60' : 'text-slate-600'
          }`}>
            {isKo 
              ? '복잡하고 스트레스 받는 숙제 채점, 이제 체키가 대신합니다. 원어민 교재 답안과 손글씨 AI 스캔으로 학부모와 학원 모두에게 최상의 학습 경험을 제공합니다.'
              : 'Empower your child\'s education. Chekki helps Korean parents stay connected to their child\'s daily assignments without the stress.'}
          </p>

          {/* Clean 2-CTA layout in Hero (Open Web App + Download App) */}
          <div className="hero-text mt-12 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <a
              href="https://chekki-ai.vercel.app/app"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative w-full sm:w-auto overflow-hidden pl-8 pr-2 py-2 bg-brand text-white font-bold rounded-full text-lg flex items-center justify-between gap-8 transition-transform duration-700 active:scale-[0.98] shadow-2xl shadow-brand/20"
            >
              <span className="relative z-10">{isKo ? '웹앱 시작하기' : 'Open Web App'}</span>
              <div className="w-12 h-12 rounded-full bg-black/20 flex items-center justify-center transition-transform group-hover:translate-x-1">
                <ArrowRight weight="bold" />
              </div>
            </a>

            <a
              href="https://urlgeni.us/chekki"
              target="_blank"
              rel="noopener noreferrer"
              className={`group relative w-full sm:w-auto overflow-hidden pl-8 pr-2 py-2 font-bold rounded-full text-lg flex items-center justify-between gap-8 border transition-all active:scale-[0.98] ${
                isNight 
                  ? 'bg-white/5 border-white/10 text-white hover:bg-white/10' 
                  : 'bg-white border-slate-300 text-slate-900 hover:bg-slate-100 shadow-sm'
              }`}
            >
              <span className="relative z-10">{isKo ? '앱 다운로드' : 'Download App'}</span>
              <div className="w-12 h-12 rounded-full bg-slate-500/10 flex items-center justify-center">
                <DownloadSimple weight="bold" />
              </div>
            </a>
          </div>
        </div>

        {/* Hero Transparent Mascot Image */}
        <div className="hero-mascot flex-1 w-full relative h-[400px] md:h-[650px] flex justify-center md:justify-end items-center">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[480px] aspect-square bg-brand/20 rounded-full blur-[120px]" />
          <img
            src="https://res.cloudinary.com/dginphpy4/image/upload/e_background_removal,f_png/v1771383933/Chekki_Futuristic_Background_i8foqe.png"
            alt="Chekki Mascot"
            className="w-full max-w-[440px] md:max-w-[500px] h-auto object-contain drop-shadow-[0_20px_50px_rgba(249,115,22,0.3)] relative z-10 group-hover:scale-105 transition-transform duration-700"
          />
        </div>
      </section>

      {/* GSAP Scrubbing Text Reveal with Video Background + FOR SCHOOLS BUTTON IN SECOND SECTION */}
      <section className={`py-32 md:py-48 px-4 border-y relative overflow-hidden flex flex-col items-center justify-center min-h-[100dvh] ${
        isNight ? 'bg-[#050505] border-white/5' : 'bg-slate-100 border-slate-200'
      }`}>
        {/* Cinematic Video Background */}
        <div className="absolute inset-0 z-0">
          <div className={`absolute inset-0 z-10 ${isNight ? 'bg-[#050505]/80' : 'bg-slate-100/80'}`} />
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover opacity-20 mix-blend-screen"
          >
            <source
              src="https://res.cloudinary.com/dginphpy4/video/upload/v1765769964/chekki-intro_y7hj7c.mp4"
              type="video/mp4"
            />
          </video>
        </div>

        <div className="max-w-5xl mx-auto text-center relative z-20">
          <h2
            ref={textRevealRef}
            className={`text-[clamp(2.5rem,5vw,5rem)] font-medium leading-[1.2] tracking-tight ${
              isNight ? 'text-white' : 'text-slate-900'
            }`}
          >
            {(isKo 
              ? '학교와 가정, 학원 사이의 문화적 장벽을 연결합니다.' 
              : 'Bridging the cultural gap between school and home.'
            ).split(' ').map((word, i) => (
              <span key={i} className="reveal-word inline-block mr-[0.3em]">
                {word}
              </span>
            ))}
          </h2>

          {/* FOR SCHOOLS CTA BUTTON IN THE SECOND SECTION (PER USER REQUEST) */}
          <div className="mt-12 flex justify-center">
            <a
              href="/schools"
              className="group relative overflow-hidden px-8 py-4 bg-brand hover:bg-brand/90 text-white font-bold rounded-full text-lg flex items-center gap-3 transition-transform duration-500 active:scale-95 shadow-2xl shadow-brand/30"
            >
              <Buildings size={22} weight="fill" />
              <span>{isKo ? '학원 및 교사 전용 안내 페이지' : 'Explore Chekki For Schools & Educators'}</span>
              <ArrowRight weight="bold" className="group-hover:translate-x-1 transition-transform" />
            </a>
          </div>
        </div>
      </section>

      {/* PROMPT-PAL STYLE AI BENTO GRID WITH PAIN-POINT TO SOLUTION EXPLANATIONS */}
      <ChekkiAiBentoGrid isNight={isNight} isKo={isKo} />

      {/* BEYOND THE APP - EDUCATOR HUB */}
      <section id="educators" className="py-32 md:py-48 px-4 md:px-8 max-w-7xl mx-auto w-full">
        <div className="mb-24 flex flex-col items-start md:items-center md:text-center">
          <h2 className={`text-[clamp(3rem,5vw,4.5rem)] font-bold tracking-tight mb-6 ${
            isNight ? 'text-white' : 'text-slate-900'
          }`}>
            {isKo ? '앱을 넘어선 교육 생태계.' : 'Beyond the app.'}
          </h2>
          <p className={`text-xl max-w-2xl ${isNight ? 'text-white/60' : 'text-slate-600'}`}>
            {isKo 
              ? '체키는 교육자와 학부모를 위한 고품질 학습 자료와 커리큘럼 인사이트를 제공합니다.' 
              : 'Chekki provides high-quality educational materials and insights for modern teaching, beautifully integrated into your workflow.'}
          </p>
        </div>

        {/* Clean 3-Card High-Impact Educator Hub */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* 1. YouTube */}
          <a
            href="https://www.youtube.com/@ChekkiAI"
            target="_blank"
            rel="noopener noreferrer"
            className={`rounded-[2.5rem] p-2 shadow-2xl group block outline-none border transition-all ${
              isNight ? 'bg-white/[0.02] border-white/5 hover:border-brand/40' : 'bg-white border-slate-300 hover:border-brand/60 shadow-slate-200'
            }`}
          >
            <div className="overflow-hidden rounded-[calc(2.5rem-0.5rem)] bg-[#090a10] relative h-[320px] flex flex-col justify-end p-8 text-white">
              <div className="absolute inset-0 bg-gradient-to-t from-[#090a10] via-[#090a10]/50 to-transparent z-10 pointer-events-none" />
              <div className="absolute inset-0 opacity-60 group-hover:scale-110 group-hover:opacity-85 transition-all duration-[1200ms] bg-[url('/assets/youtube_bg.png')] bg-cover bg-center mix-blend-screen" />
              <div className="relative z-20">
                <PlayCircle weight="fill" className="text-5xl text-brand mb-4 drop-shadow-xl" />
                <h3 className="text-2xl font-bold text-white mb-2">YouTube Channel</h3>
                <p className="text-white/70 text-sm mb-6 leading-relaxed">
                  {isKo ? '이중언어 교육 및 학습 습관 형성을 위한 매주 업데이트' : 'Weekly insights on bilingual education & study habits.'}
                </p>
                <div className="relative inline-flex items-center gap-3 text-sm text-white font-semibold">
                  <span>{isKo ? '영상 시청하기' : 'Watch videos'}</span>
                  <ArrowRight className="transition-transform duration-500 group-hover:translate-x-1 text-brand" />
                </div>
              </div>
            </div>
          </a>

          {/* 2. TPT Store */}
          <a
            href="https://www.teacherspayteachers.com/store/chekki-ai"
            target="_blank"
            rel="noopener noreferrer"
            className={`rounded-[2.5rem] p-2 shadow-xl group block outline-none border transition-all ${
              isNight ? 'bg-white/[0.02] border-white/5 hover:border-brand/40' : 'bg-white border-slate-300 hover:border-brand/60 shadow-slate-200'
            }`}
          >
            <div className="overflow-hidden rounded-[calc(2.5rem-0.5rem)] bg-[#090a10] relative h-[320px] flex flex-col justify-end p-8 text-white">
              <div className="absolute inset-0 bg-gradient-to-t from-[#090a10] via-[#090a10]/50 to-transparent z-10 pointer-events-none" />
              <div className="absolute inset-0 opacity-60 group-hover:scale-110 group-hover:opacity-85 transition-all duration-[1200ms] bg-[url('https://res.cloudinary.com/dginphpy4/image/upload/v1771381888/Chekki_Splash_1_nrpzaj.png')] bg-cover bg-center mix-blend-screen" />
              <div className="relative z-20">
                <GraduationCap weight="fill" className="text-5xl text-blue-400 mb-4 drop-shadow-xl" />
                <h3 className="text-2xl font-bold text-white mb-2">TPT Store</h3>
                <p className="text-white/70 text-sm mb-6 leading-relaxed">
                  {isKo ? '출력 가능한 영유 교재 및 워크시트 자료' : 'Downloadable worksheets & lesson plan resources.'}
                </p>
                <div className="relative inline-flex items-center gap-3 text-sm text-white font-semibold">
                  <span>{isKo ? '교재 둘러보기' : 'Browse worksheets'}</span>
                  <ArrowRight className="transition-transform duration-500 group-hover:translate-x-1 text-blue-400" />
                </div>
              </div>
            </div>
          </a>

          {/* 3. Free Grammar PPT */}
          <a
            href="https://chekkiai.netlify.app/"
            target="_blank"
            rel="noopener noreferrer"
            className={`rounded-[2.5rem] p-2 shadow-xl group block outline-none border transition-all ${
              isNight ? 'bg-white/[0.02] border-white/5 hover:border-red-500/40' : 'bg-white border-slate-300 hover:border-red-500/50 shadow-slate-200'
            }`}
          >
            <div className="overflow-hidden rounded-[calc(2.5rem-0.5rem)] bg-[#090a10] relative h-[320px] flex flex-col justify-end p-8 text-white">
              <div className="absolute inset-0 bg-gradient-to-t from-[#090a10] via-[#090a10]/50 to-transparent z-10 pointer-events-none" />
              <div className="absolute inset-0 opacity-60 group-hover:scale-110 group-hover:opacity-85 transition-all duration-[1200ms] bg-[url('/assets/grammar_bg.png')] bg-cover bg-center mix-blend-screen" />
              <div className="relative z-20">
                <FilePdf weight="fill" className="text-5xl text-red-500 mb-4 drop-shadow-xl" />
                <h3 className="text-2xl font-bold text-white mb-2">Top Grammar PPT</h3>
                <p className="text-white/70 text-sm mb-6 leading-relaxed">
                  {isKo ? '한국 학생들이 가장 많이 틀리는 영문법 무료 정리 PPT' : 'Free downloadable PPT on top grammar mistakes.'}
                </p>
                <div className="relative inline-flex items-center gap-3 text-sm text-white font-semibold">
                  <span>{isKo ? '무료 자료 받기' : 'Download free PPT'}</span>
                  <ArrowRight className="transition-transform duration-500 group-hover:translate-x-1 text-red-400" />
                </div>
              </div>
            </div>
          </a>
        </div>
      </section>

      {/* FOOTER CTA */}
      <footer className={`py-32 md:py-48 px-4 md:px-8 border-t flex flex-col items-center justify-center text-center relative overflow-hidden transition-colors duration-500 ${
        isNight ? 'bg-[#020617] border-white/5' : 'bg-slate-900 border-slate-800 text-white'
      }`}>
        <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.05] bg-noise mix-blend-overlay" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[800px] aspect-square bg-brand/10 rounded-full blur-[150px] pointer-events-none" />

        <h2 className="relative z-10 text-[clamp(3rem,6vw,6rem)] font-bold tracking-tight text-white max-w-4xl leading-[1.05] mb-16">
          {isKo ? (
            <>스마트한 숙제 관리, <br />지금 시작하세요.</>
          ) : (
            <>Ready to simplify <br /> homework?</>
          )}
        </h2>

        <div className="relative z-10 flex flex-col sm:flex-row gap-6">
          <a
            href="https://chekki-ai.vercel.app/app"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative overflow-hidden pl-10 pr-3 py-3 bg-brand text-white font-bold rounded-full text-xl flex items-center justify-between gap-8 transition-transform duration-700 active:scale-[0.98] shadow-2xl shadow-brand/20"
          >
            <span className="relative z-20 tracking-wide">{isKo ? '체키 시작하기' : 'Start Using Chekki'}</span>
            <div className="relative z-20 w-14 h-14 rounded-full bg-black/20 flex items-center justify-center transition-transform duration-700 group-hover:scale-105 group-hover:translate-x-1">
              <ArrowRight weight="bold" className="text-2xl" />
            </div>
          </a>

          <a
            href="/schools"
            className="group relative overflow-hidden pl-10 pr-3 py-3 bg-orange-500/20 border border-orange-500/40 text-orange-300 font-bold rounded-full text-xl flex items-center justify-between gap-8 transition-transform duration-700 active:scale-[0.98] shadow-2xl hover:bg-orange-500/30"
          >
            <span className="relative z-20 tracking-wide">{isKo ? '학원/교사 안내' : 'For Schools'}</span>
            <div className="relative z-20 w-14 h-14 rounded-full bg-orange-500/30 flex items-center justify-center">
              <Buildings weight="fill" className="text-2xl text-orange-400" />
            </div>
          </a>
        </div>

        <div className="relative z-10 mt-24 flex flex-col items-center gap-6">
          <div className="flex items-center gap-6 text-white/50 text-sm font-medium mb-4">
            <a
              href="/faq"
              onClick={(e) => {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'instant' });
                window.history.pushState({}, '', '/faq');
                window.dispatchEvent(new PopStateEvent('popstate'));
              }}
              className="hover:text-white transition-colors"
            >
              FAQ
            </a>
            <a
              href="/privacy"
              onClick={(e) => {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'instant' });
                window.history.pushState({}, '', '/privacy');
                window.dispatchEvent(new PopStateEvent('popstate'));
              }}
              className="hover:text-white transition-colors"
            >
              Privacy Policy
            </a>
            <a
              href="/terms"
              onClick={(e) => {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'instant' });
                window.history.pushState({}, '', '/terms');
                window.dispatchEvent(new PopStateEvent('popstate'));
              }}
              className="hover:text-white transition-colors"
            >
              Terms of Service
            </a>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="https://www.instagram.com/chekki__ai"
              target="_blank"
              rel="noopener noreferrer"
              className="w-16 h-16 rounded-full bg-black/20 border border-white/5 flex items-center justify-center text-white hover:bg-black/40 hover:scale-110 transition-all duration-500"
            >
              <InstagramLogo size={32} weight="fill" />
            </a>
            <a
              href="https://www.tiktok.com/@chekkiai"
              target="_blank"
              rel="noopener noreferrer"
              className="w-16 h-16 rounded-full bg-black/20 border border-white/5 flex items-center justify-center text-white hover:bg-black/40 hover:scale-110 transition-all duration-500"
            >
              <TiktokLogo size={32} weight="fill" />
            </a>
          </div>
          <p className="text-white/60 font-medium">
            © {new Date().getFullYear()} Chekki. Designed for parents & educators.
          </p>
        </div>
      </footer>
    </main>
  );
}
