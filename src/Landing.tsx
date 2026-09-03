import { useEffect, useRef, useState } from 'react';
import ChekkiAiBentoGrid from './components/ChekkiAiBentoGrid';
import ParentReliefStrip from './components/ParentReliefStrip';
import ReliabilityStats from './components/ReliabilityStats';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useReducedMotion } from 'framer-motion';
import { copyToClipboard } from '../utils/clipboard';
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
  CheckCircle,
  Sparkle,
} from '@phosphor-icons/react';

export default function Home() {
  const reduce = useReducedMotion();
  const heroRef = useRef<HTMLElement>(null);
  const textRevealRef = useRef<HTMLHeadingElement>(null);
  const [mounted, setMounted] = useState(false);
  const [isNight, setIsNight] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('chekki_theme');
      if (saved === 'light') return false;
      if (saved === 'dark') return true;
    }
    return true;
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isKo, setIsKo] = useState<boolean>(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [copiedInvite, setCopiedInvite] = useState(false);

  const toggleTheme = () => {
    const next = !isNight;
    setIsNight(next);
    if (typeof window !== 'undefined') {
      localStorage.setItem('chekki_theme', next ? 'dark' : 'light');
    }
  };

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      const savedLang = localStorage.getItem('chekki_lang');
      if (savedLang) {
        setIsKo(savedLang === 'ko');
      }
      const savedTheme = localStorage.getItem('chekki_theme');
      if (savedTheme === 'light') {
        setIsNight(false);
      } else if (savedTheme === 'dark') {
        setIsNight(true);
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

      // AI Bento Grid (external component, targeted by its stable #ai-bento id)
      gsap.from('#ai-bento', {
        y: 40,
        opacity: 0,
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '#ai-bento',
          start: 'top 80%',
          toggleActions: 'play none none none',
        },
      });

      // Educator Hub cards
      gsap.from('.edu-card', {
        y: 40,
        opacity: 0,
        duration: 0.7,
        stagger: 0.08,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '#educators',
          start: 'top 75%',
          toggleActions: 'play none none none',
        },
      });

      // Pricing cards
      gsap.from('.pricing-card', {
        y: 40,
        opacity: 0,
        duration: 0.6,
        stagger: 0.06,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '#pricing',
          start: 'top 75%',
          toggleActions: 'play none none none',
        },
      });

      // Footer CTA
      gsap.from('.footer-cta', {
        y: 30,
        opacity: 0,
        duration: 0.7,
        stagger: 0.1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: 'footer',
          start: 'top 80%',
          toggleActions: 'play none none none',
        },
      });
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
    <main className={`overflow-x-hidden w-full max-w-full min-h-dvh transition-colors duration-500 selection:bg-brand selection:text-white ${
      isNight ? 'bg-brand-dark text-slate-50' : 'bg-slate-50 text-slate-900'
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
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex items-center gap-2 shrink-0 cursor-pointer"
          >
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
              onClick={toggleTheme}
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
              href="/app"
              onClick={(e) => {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'instant' });
                window.history.pushState({}, '', '/app');
                window.dispatchEvent(new PopStateEvent('popstate'));
              }}
              className="group relative overflow-hidden items-center gap-2 px-4 py-1.5 bg-brand text-white font-bold rounded-full text-xs uppercase tracking-wider transition-transform duration-700 active:scale-[0.96] flex cursor-pointer"
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
              href="/app"
              onClick={(e) => {
                e.preventDefault();
                setMobileMenuOpen(false);
                window.scrollTo({ top: 0, behavior: 'instant' });
                window.history.pushState({}, '', '/app');
                window.dispatchEvent(new PopStateEvent('popstate'));
              }}
              className="hover:text-brand transition-colors cursor-pointer"
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
        className="relative pt-28 md:pt-36 pb-16 md:pb-24 px-4 md:px-8 max-w-7xl mx-auto w-full flex flex-col md:flex-row items-center justify-between gap-12 md:gap-8 min-h-[85dvh]"
      >
        <div className="flex-1 flex flex-col items-start z-10 w-full">
          <div className={`hero-text mb-6 inline-flex items-center rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em] font-bold border ${
            isNight ? 'bg-white/5 border-white/10 text-white/70' : 'bg-slate-200/60 border-slate-300 text-slate-700'
          }`}>
            {isKo ? '학부모 & 교사를 위한 스마트 플랫폼' : 'For Parents & Educators'}
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
              ? '복잡하고 스트레스 받는 숙제 채점, 이제 체키가 대신합니다. 원어민 교재 답안과 손글씨 정밀 스캔으로 학부모와 학원 모두에게 최상의 학습 경험을 제공합니다.'
              : 'Empower your child\'s education. Chekki helps Korean parents stay connected to their child\'s daily assignments without the stress.'}
          </p>

          {/* Clean 2-CTA layout in Hero (Open Web App + Download App) */}
          <div className="hero-text mt-12 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <a
              href="/app"
              onClick={(e) => {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'instant' });
                window.history.pushState({}, '', '/app');
                window.dispatchEvent(new PopStateEvent('popstate'));
              }}
              className="group relative w-full sm:w-auto overflow-hidden pl-8 pr-2 py-2 bg-brand text-white font-bold rounded-full text-lg flex items-center justify-between gap-8 transition-transform duration-700 active:scale-[0.98] shadow-2xl shadow-brand/20 cursor-pointer"
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

          <ParentReliefStrip isNight={isNight} isKo={isKo} />
          <ReliabilityStats isNight={isNight} isKo={isKo} />
        </div>

        {/* Hero Transparent Mascot Image */}
        <div className="hero-mascot group flex-1 w-full relative h-[400px] md:h-[650px] flex justify-center md:justify-end items-center">
          <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[480px] aspect-square rounded-full blur-[120px] ${isNight ? 'bg-brand/20' : 'bg-brand/35'}`} />
          <img
            src="/assets/chekki-mascot.webp"
            alt="Chekki Mascot"
            className="w-full max-w-[440px] md:max-w-[500px] h-auto object-contain drop-shadow-[0_20px_50px_rgba(249,115,22,0.3)] relative z-10 group-hover:scale-105 transition-transform duration-700"
          />
        </div>
      </section>

      {/* GSAP Scrubbing Text Reveal with Video Background + FOR SCHOOLS BUTTON IN SECOND SECTION */}
      <section className={`py-32 md:py-48 px-4 border-y relative overflow-hidden flex flex-col items-center justify-center min-h-[100dvh] ${
        isNight ? 'bg-brand-dark border-white/5' : 'bg-slate-100 border-slate-200'
      }`}>
        {/* Cinematic Video Background */}
        <div className="absolute inset-0 z-0">
          <div className={`absolute inset-0 z-10 ${isNight ? 'bg-brand-dark/80' : 'bg-slate-100/80'}`} />
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
              ? '영어 숙제, 더 이상 추측하지 마세요.'
              : "Never guess at English homework again."
            ).split(' ').map((word, i) => (
              <span key={i} className="reveal-word inline-block mr-[0.3em]">
                {word}
              </span>
            ))}
          </h2>

          <p className={`mt-8 text-base md:text-lg max-w-2xl mx-auto leading-relaxed relative z-20 ${
            isNight ? 'text-white/60' : 'text-slate-600'
          }`}>
            {isKo
              ? '아이가 집에서 놓친 문제는 선생님에게, 수업에서 있었던 일은 다시 부모님에게. 체키와 연동된 학원이라면, 이 흐름이 자동으로 이어집니다.'
              : "What your child misses at home reaches the teacher. What happens in class comes back to you — in Korean. At a Chekki-connected academy, that loop runs on its own."}
          </p>

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
            className={`edu-card rounded-[2.5rem] p-2 shadow-2xl group block outline-none border transition-[border-color] ${
              isNight ? 'bg-white/[0.02] border-white/5 hover:border-brand/40' : 'bg-white border-slate-300 hover:border-brand/60 shadow-slate-200'
            }`}
          >
            <div className="overflow-hidden rounded-[calc(2.5rem-0.5rem)] bg-brand-dark relative h-[320px] flex flex-col justify-end p-8 text-white">
              <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-brand-dark/50 to-transparent z-10 pointer-events-none" />
              <div className="absolute inset-0 opacity-60 group-hover:scale-110 group-hover:opacity-85 transition-[transform,opacity] duration-[1200ms] bg-[url('/assets/youtube_bg.png')] bg-cover bg-center mix-blend-screen" />
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
            className={`edu-card rounded-[2.5rem] p-2 shadow-xl group block outline-none border transition-[border-color] ${
              isNight ? 'bg-white/[0.02] border-white/5 hover:border-brand/40' : 'bg-white border-slate-300 hover:border-brand/60 shadow-slate-200'
            }`}
          >
            <div className="overflow-hidden rounded-[calc(2.5rem-0.5rem)] bg-brand-dark relative h-[320px] flex flex-col justify-end p-8 text-white">
              <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-brand-dark/50 to-transparent z-10 pointer-events-none" />
              <div className="absolute inset-0 opacity-60 group-hover:scale-110 group-hover:opacity-85 transition-[transform,opacity] duration-[1200ms] bg-[url('https://res.cloudinary.com/dginphpy4/image/upload/v1771381888/Chekki_Splash_1_nrpzaj.png')] bg-cover bg-center mix-blend-screen" />
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
            className={`edu-card rounded-[2.5rem] p-2 shadow-xl group block outline-none border transition-[border-color] ${
              isNight ? 'bg-white/[0.02] border-white/5 hover:border-red-500/40' : 'bg-white border-slate-300 hover:border-red-500/50 shadow-slate-200'
            }`}
          >
            <div className="overflow-hidden rounded-[calc(2.5rem-0.5rem)] bg-brand-dark relative h-[320px] flex flex-col justify-end p-8 text-white">
              <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-brand-dark/50 to-transparent z-10 pointer-events-none" />
              <div className="absolute inset-0 opacity-60 group-hover:scale-110 group-hover:opacity-85 transition-[transform,opacity] duration-[1200ms] bg-[url('/assets/grammar_bg.png')] bg-cover bg-center mix-blend-screen" />
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

      {/* --- B2C PARENT MOBILE APP PRICING SECTION --- */}
      <section id="pricing" className="py-24 px-4 md:px-8 max-w-7xl mx-auto w-full relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <span className="px-3 py-1 bg-brand/10 border border-brand/30 text-brand text-xs font-mono font-black uppercase tracking-widest rounded-full inline-block">
            {isKo ? '학부모용 모바일 구독 안내' : 'CHEKKI PARENT MOBILE APP PRICING'}
          </span>
          <h2 className={`text-3xl sm:text-5xl font-black tracking-tight ${isNight ? 'text-white' : 'text-slate-900'}`}>
            {isKo ? '엄마표 영어 숙제 지도, 부담 없는 구독 플랜' : 'Simple & Flexible Parent Subscriptions'}
          </h2>
          <p className="text-sm sm:text-base text-zinc-400 max-w-2xl mx-auto">
            {isKo
              ? 'iOS App Store & Google Play Store 구독 또는 다니는 학원의 초대로 100% 무료 이용이 가능합니다.'
              : 'Available via iOS App Store & Google Play Store subscriptions, or 100% FREE if your school invites you.'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto items-stretch">
          {/* Tier 1: School Director Invite (FREE) */}
          <div className={`pricing-card p-8 border rounded-3xl flex flex-col justify-between transition-[border-color] relative ${
            isNight ? 'bg-white/5 border-emerald-500/30' : 'bg-white border-zinc-200'
          }`}>
            <div>
              <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-black uppercase rounded-full font-mono">
                {isKo ? '학원 초대 연동' : 'SCHOOL INVITE USER'}
              </span>
              <h3 className={`text-xl font-black mt-4 mb-2 ${isNight ? 'text-white' : 'text-zinc-900'}`}>
                {isKo ? '학원 연동 무제한 무료' : 'School Invite Free Access'}
              </h3>
              <div className="mb-4">
                <span className="text-4xl font-black text-emerald-400 font-mono">₩0</span>
                <span className="text-xs text-zinc-400 ml-2">{isKo ? '/평생 무료' : '/Forever Free'}</span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed mb-6">
                {isKo
                  ? '아이가 다니는 어학원/공부방 원장님이 체키 스쿨 프로를 도입하면, 원장님의 초대 링크로 100% 무료 전면 개방됩니다.'
                  : "100% FREE if your child's English academy uses Chekki School Pro. Just tap the invite link your academy sends you."}
              </p>
              <ul className={`space-y-3 text-xs border-t border-white/10 pt-4 ${isNight ? 'text-zinc-300' : 'text-zinc-600'}`}>
                <li className="flex items-center gap-2 font-bold text-emerald-400">
                  <CheckCircle size={16} weight="fill" className="flex-shrink-0" />
                  <span>{isKo ? '📸 프롬프트 작성 0회 • 사진 1장 즉시 채점' : '📸 No Typing Needed • Just Snap 1 Photo'}</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={16} weight="fill" className="text-emerald-400 flex-shrink-0" />
                  <span>{isKo ? '🎙️ 원어민 100% 풀 음성 지원 (정답 & 지문 읽기)' : '🎙️ Fully Voiced Answers & Native Audio'}</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={16} weight="fill" className="text-emerald-400 flex-shrink-0" />
                  <span>{isKo ? '✍️ 손글씨 정밀 채점 & 오답 빨간상자 표시' : '✍️ Precision Handwriting Grading & Red-Box Autograding'}</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={16} weight="fill" className="text-emerald-400 flex-shrink-0" />
                  <span>{isKo ? '🇰🇷 엄마용 5초 한국어 칭찬 & 답변 코칭 가이드' : '🇰🇷 5-Second Warm Korean Parent Coaching Tips'}</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={16} weight="fill" className="text-emerald-400 flex-shrink-0" />
                  <span>{isKo ? '⚡ 2차 재도전 스캔으로 100점 학습 마스터' : '⚡ 2nd Rescan Loop to 100% Mastery'}</span>
                </li>
              </ul>
            </div>
            <button
              type="button"
              onClick={() => setShowInviteModal(true)}
              className="w-full mt-6 py-3.5 bg-emerald-500 hover:bg-emerald-600 text-black font-black text-xs rounded-2xl transition-[background-color,transform] cursor-pointer shadow-lg shadow-emerald-500/20 active:scale-95"
            >
              {isKo ? '💌 원장님께 체키 추천/초대하기' : '💌 Invite School Director'}
            </button>
          </div>

          {/* Tier 2: Monthly Parent Subscription */}
          <div className={`pricing-card p-8 border rounded-3xl flex flex-col justify-between transition-[border-color] relative ${
            isNight ? 'bg-white/5 border-white/10 hover:border-orange-500/50' : 'bg-white border-zinc-200'
          }`}>
            <div>
              <span className="px-3 py-1 bg-orange-500/20 text-orange-400 border border-orange-500/30 text-[10px] font-black uppercase rounded-full font-mono">
                {isKo ? 'App Store / Play Store 월간' : 'MONTHLY PARENT PASS'}
              </span>
              <h3 className={`text-xl font-black mt-4 mb-2 ${isNight ? 'text-white' : 'text-zinc-900'}`}>
                {isKo ? '월간 학부모 패스' : 'Monthly Parent Pass'}
              </h3>
              <div className="mb-4">
                <span className={`text-4xl font-black font-mono ${isNight ? 'text-white' : 'text-zinc-900'}`}>₩9,900</span>
                <span className="text-xs text-zinc-400 ml-2">{isKo ? '/월 (월간 정기결제)' : '/month'}</span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed mb-6">
                {isKo 
                  ? '집에서 프롬프트 입력 없이 사진 한 장으로 5초 이내 채점과 원어민 음성 답변을 이용하는 월간 요금제.'
                  : 'Zero prompts or typing required. Instant photo-based autograding & native voice answers.'}
              </p>
              <ul className={`space-y-3 text-xs border-t border-white/10 pt-4 ${isNight ? 'text-zinc-300' : 'text-zinc-600'}`}>
                <li className="flex items-center gap-2 font-bold text-orange-400">
                  <CheckCircle size={16} weight="fill" className="flex-shrink-0" />
                  <span>{isKo ? '📸 프롬프트 작성 0회 • 모든 교재 무제한 스캔' : '📸 No Prompts Required • Unlimited Scans'}</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={16} weight="fill" className="text-orange-400 flex-shrink-0" />
                  <span>{isKo ? '🎙️ 원어민 100% 풀 음성 (단어, 지문 & 정답)' : '🎙️ Fully Voiced Native Audio (Words & Answers)'}</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={16} weight="fill" className="text-orange-400 flex-shrink-0" />
                  <span>{isKo ? '✍️ 손글씨 자동 채점 & 오답 박스' : '✍️ Precision Handwriting Autograding & Red-Box'}</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={16} weight="fill" className="text-orange-400 flex-shrink-0" />
                  <span>{isKo ? '🇰🇷 엄마용 5초 한국어 칭찬 가이드' : '🇰🇷 5-Second Warm Korean Coaching Tips'}</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={16} weight="fill" className="text-orange-400 flex-shrink-0" />
                  <span>{isKo ? '언제든 앱스토어에서 1클릭 해지 가능' : 'Cancel Anytime in App Store'}</span>
                </li>
              </ul>
            </div>
            <button
              type="button"
              onClick={() => {
                window.location.href = '/subscribe';
              }}
              className="w-full mt-6 py-3 px-4 bg-white/10 hover:bg-white/20 text-white font-black text-xs rounded-2xl border border-white/20 transition-[background-color,transform] cursor-pointer flex items-center justify-between group active:scale-95"
            >
              <span>{isKo ? '월간 구독 시작하기' : 'Subscribe Monthly (₩9,900)'}</span>
              <span className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform">
                <ArrowRight size={14} weight="bold" />
              </span>
            </button>
          </div>

          {/* Tier 3: Yearly Parent Subscription (Best Value) */}
          <div className={`pricing-card p-8 border-2 rounded-3xl flex flex-col justify-between transition-colors relative scale-[1.02] ${
            isNight ? 'bg-[#0f0904] border-orange-500 shadow-2xl shadow-orange-500/20' : 'bg-orange-50 border-orange-500'
          }`}>
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 bg-orange-500 text-black text-[9px] font-black uppercase tracking-widest rounded-full shadow-md font-mono">
              {isKo ? '최고의 가치 • 17% 할인' : 'BEST VALUE • SAVE 17%'}
            </div>
            <div>
              <span className="px-3 py-1 bg-orange-500/20 text-orange-400 border border-orange-500/30 text-[10px] font-black uppercase rounded-full font-mono mt-2 inline-block">
                {isKo ? 'App Store / Play Store 연간' : 'ANNUAL PARENT PASS'}
              </span>
              <h3 className={`text-xl font-black mt-4 mb-2 ${isNight ? 'text-white' : 'text-zinc-900'}`}>
                {isKo ? '연간 학부모 패스 (BEST)' : 'Annual Parent Pass'}
              </h3>
              <div className="mb-4">
                <span className="text-4xl font-black text-orange-400 font-mono">₩99,000</span>
                <span className="text-xs text-zinc-400 ml-2">{isKo ? '/연 (월 8,250원 꼴)' : '/year (₩8,250/mo)'}</span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed mb-6">
                {isKo 
                  ? '1년 내내 숙제 실랑이 없이 완벽한 영어 습관을 형성하는 가장 경제적인 연간 요금제.'
                  : 'Best value annual pass for building lasting English homework habits all year long.'}
              </p>
              <ul className={`space-y-3 text-xs border-t border-white/10 pt-4 ${isNight ? 'text-zinc-200' : 'text-zinc-600'}`}>
                <li className="flex items-center gap-2 font-bold text-orange-400">
                  <Sparkle size={16} weight="fill" className="flex-shrink-0" />
                  <span>{isKo ? '📸 프롬프트 작성 0회 • 모든 교재 무제한 스캔' : '📸 Zero Typing/Prompts Needed • Unlimited Scans'}</span>
                </li>
                <li className="flex items-center gap-2 font-bold text-orange-400">
                  <Sparkle size={16} weight="fill" className="flex-shrink-0" />
                  <span>{isKo ? '🎙️ 원어민 100% 풀 음성 지원 (정답 & 음성 드릴)' : '🎙️ Fully Voiced Native Audio & Phonics Drills'}</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={16} weight="fill" className="text-orange-400 flex-shrink-0" />
                  <span>{isKo ? '✍️ 손글씨 정밀 채점 & 오답 빨간상자 표시' : '✍️ Precision Handwriting Grading & Red-Box Autograding'}</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={16} weight="fill" className="text-orange-400 flex-shrink-0" />
                  <span>{isKo ? '🇰🇷 엄마용 5초 한국어 칭찬 가이드' : '🇰🇷 5-Second Warm Korean Parent Coaching Tips'}</span>
                </li>
                <li className="flex items-center gap-2 font-bold text-emerald-400">
                  <CheckCircle size={16} weight="fill" className="flex-shrink-0" />
                  <span>{isKo ? '⚡ 2차 재도전 스캔으로 100점 마스터' : '⚡ 2nd Rescan Loop to 100% Mastery'}</span>
                </li>
              </ul>
            </div>
            <button
              type="button"
              onClick={() => {
                window.location.href = '/subscribe';
              }}
              className="w-full mt-6 py-3 px-4 bg-orange-500 hover:bg-orange-600 text-black font-black text-xs rounded-2xl shadow-xl shadow-orange-500/30 transition-[background-color,transform] cursor-pointer flex items-center justify-between group active:scale-95"
            >
              <span>{isKo ? '연간 패스 선택하기 (₩99,000)' : 'Subscribe Yearly (₩99,000)'}</span>
              <span className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform">
                <ArrowRight size={14} weight="bold" />
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER CTA */}
      <footer className={`py-32 md:py-48 px-4 md:px-8 border-t flex flex-col items-center justify-center text-center relative overflow-hidden transition-colors duration-500 ${
        isNight ? 'bg-[#020617] border-white/5' : 'bg-slate-900 border-slate-800 text-white'
      }`}>
        <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.05] bg-noise mix-blend-overlay" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[800px] aspect-square bg-brand/10 rounded-full blur-[150px] pointer-events-none" />

        <h2 className="footer-cta relative z-10 text-[clamp(3rem,6vw,6rem)] font-bold tracking-tight text-white max-w-4xl leading-[1.05] mb-16">
          {isKo ? (
            <>스마트한 숙제 관리, <br />지금 시작하세요.</>
          ) : (
            <>Ready to simplify <br /> homework?</>
          )}
        </h2>

        <div className="footer-cta relative z-10 flex flex-col sm:flex-row gap-6">
          <a
            href="/app"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'instant' });
              window.history.pushState({}, '', '/app');
              window.dispatchEvent(new PopStateEvent('popstate'));
            }}
            className="group relative overflow-hidden pl-10 pr-3 py-3 bg-brand text-white font-bold rounded-full text-xl flex items-center justify-between gap-8 transition-transform duration-700 active:scale-[0.98] shadow-2xl shadow-brand/40 hover:bg-brand/90 cursor-pointer"
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

        <div className="relative z-10 mt-16 max-w-4xl w-full flex flex-col items-center gap-8 border-t border-white/10 pt-10">
          {/* Business Info for KC INCIS / PortOne Inspection */}
          <div className="text-center text-xs text-white/50 space-y-1.5 font-medium max-w-2xl">
            <p className="font-bold text-white/80 text-sm mb-2">
              {isKo ? '사업자 정보' : 'Business Information'}
            </p>
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-1.5 text-xs">
              <span><strong className="text-white/70">{isKo ? '상호명:' : 'Company:'}</strong> 채키 AI (Chekki AI)</span>
              <span><strong className="text-white/70">{isKo ? '대표자:' : 'Representative:'}</strong> Benjamin Jason</span>
              <span><strong className="text-white/70">{isKo ? '사업자등록번호:' : 'Biz Reg No:'}</strong> 814-14-03096</span>
              <span><strong className="text-white/70">{isKo ? '고객센터:' : 'Email:'}</strong> support@chekkiai.com</span>
            </div>
          </div>

          {/* Legal Policies & Links */}
          <div className="flex flex-wrap justify-center gap-4 md:gap-6 text-xs text-white/60 font-bold uppercase tracking-wider">
            <a
              href="/faq"
              onClick={(e) => {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'instant' });
                window.history.pushState({}, '', '/faq');
                window.dispatchEvent(new PopStateEvent('popstate'));
              }}
              className="hover:text-orange-400 transition-colors"
            >
              {isKo ? '자주 묻는 질문 (FAQ)' : 'FAQ'}
            </a>
            <span className="text-white/20">|</span>
            <a
              href="/privacy"
              onClick={(e) => {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'instant' });
                window.history.pushState({}, '', '/privacy');
                window.dispatchEvent(new PopStateEvent('popstate'));
              }}
              className="hover:text-orange-400 transition-colors"
            >
              {isKo ? '개인정보처리방침' : 'Privacy Policy'}
            </a>
            <span className="text-white/20">|</span>
            <a
              href="/terms"
              onClick={(e) => {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'instant' });
                window.history.pushState({}, '', '/terms');
                window.dispatchEvent(new PopStateEvent('popstate'));
              }}
              className="hover:text-orange-400 transition-colors"
            >
              {isKo ? '이용약관' : 'Terms of Service'}
            </a>
            <span className="text-white/20">|</span>
            <a
              href="/refund"
              onClick={(e) => {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'instant' });
                window.history.pushState({}, '', '/refund');
                window.dispatchEvent(new PopStateEvent('popstate'));
              }}
              className="hover:text-orange-400 transition-colors"
            >
              {isKo ? '환불정책' : 'Refund Policy'}
            </a>
            <span className="text-white/20">|</span>
            <a
              href="/support"
              onClick={(e) => {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'instant' });
                window.history.pushState({}, '', '/support');
                window.dispatchEvent(new PopStateEvent('popstate'));
              }}
              className="hover:text-orange-400 transition-colors"
            >
              {isKo ? '고객지원' : 'Customer Support'}
            </a>
          </div>

          <div className="flex items-center gap-4 pt-2">
            <a
              href="https://www.instagram.com/chekki__ai"
              target="_blank"
              rel="noopener noreferrer"
              className="w-12 h-12 rounded-full bg-black/20 border border-white/5 flex items-center justify-center text-white hover:bg-black/40 hover:scale-110 transition-[background-color,transform] duration-500"
            >
              <InstagramLogo size={24} weight="fill" />
            </a>
            <a
              href="https://www.tiktok.com/@chekkiai"
              target="_blank"
              rel="noopener noreferrer"
              className="w-12 h-12 rounded-full bg-black/20 border border-white/5 flex items-center justify-center text-white hover:bg-black/40 hover:scale-110 transition-[background-color,transform] duration-500"
            >
              <TiktokLogo size={24} weight="fill" />
            </a>
          </div>
          <p className="text-white/40 text-xs font-medium">
            © {new Date().getFullYear()} Chekki. Designed for parents & educators.
          </p>
        </div>
      </footer>

      {/* INVITE DIRECTOR MODAL */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-zinc-900 border border-emerald-500/40 rounded-3xl p-6 sm:p-8 max-w-lg w-full text-zinc-100 shadow-2xl relative space-y-6">
            <button
              type="button"
              onClick={() => setShowInviteModal(false)}
              className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white rounded-full bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X size={20} weight="bold" />
            </button>

            <div className="text-center space-y-2">
              <div className="w-14 h-14 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center text-2xl mx-auto border border-emerald-500/30">
                💌
              </div>
              <h3 className="text-xl font-black text-white">
                {isKo ? '원장님께 체키 스쿨 프로 추천하기' : 'Invite Your School Director'}
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                {isKo
                  ? '원장님이 체키 스쿨 프로를 도입하면 학원 수강생 학부모님은 원장님 초대로 100% 무료 이용이 가능합니다.'
                  : 'If your academy director adopts Chekki School Pro, all parents get 100% free access via a personal invite!'}
              </p>
            </div>

            {/* Invite Message Box */}
            <div className="bg-zinc-950 border border-white/10 rounded-2xl p-4 space-y-2">
              <p className="text-[10px] font-mono font-bold uppercase text-emerald-400 tracking-wider">
                {isKo ? '📋 추천 카카오톡 / 문자 메시지' : '📋 PREVIEW INVITATION MESSAGE'}
              </p>
              <p className="text-xs text-zinc-300 leading-relaxed font-sans">
                {isKo
                  ? '안녕하세요 원장님! Chekki AI로 아이 숙제를 스캔해서 채점 결과를 바로 받아보고 있어요. Chekki School Pro를 도입하시면 선생님들 채점 시간이 크게 줄고, 저희 같은 학부모들은 전원 무료로 이용할 수 있대요. 한번 살펴봐 주시겠어요? https://www.chekkiai.com/schools'
                  : "Hello Director! We've been using Chekki AI to scan and grade my child's homework — it's been great. Chekki School Pro brings this to your whole academy: teachers save hours on grading, and every parent gets it free. Worth a look: https://www.chekkiai.com/schools"}
              </p>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <button
                type="button"
                onClick={async () => {
                  const inviteMsg = isKo
                    ? '안녕하세요 원장님! Chekki AI로 아이 숙제를 스캔해서 채점 결과를 바로 받아보고 있어요. Chekki School Pro를 도입하시면 선생님들 채점 시간이 크게 줄고, 저희 같은 학부모들은 전원 무료로 이용할 수 있대요. 한번 살펴봐 주시겠어요? https://www.chekkiai.com/schools'
                    : "Hello Director! We've been using Chekki AI to scan and grade my child's homework — it's been great. Chekki School Pro brings this to your whole academy: teachers save hours on grading, and every parent gets it free. Worth a look: https://www.chekkiai.com/schools";
                  const copied = await copyToClipboard(inviteMsg);
                  if (copied) {
                    setCopiedInvite(true);
                    setTimeout(() => setCopiedInvite(false), 2500);
                  }
                }}
                className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-black font-black text-xs rounded-2xl shadow-lg shadow-emerald-500/20 transition-[background-color,transform] cursor-pointer flex items-center justify-center gap-2 active:scale-95"
              >
                {copiedInvite ? (
                  <>
                    <CheckCircle size={18} weight="fill" />
                    <span>{isKo ? '추천 메시지가 복사되었습니다!' : 'Invitation Copied!'}</span>
                  </>
                ) : (
                  <>
                    <span>{isKo ? '✨ 1초 추천 메시지 복사하기' : '✨ Copy Invitation Text'}</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  window.location.href = '/schools';
                }}
                className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xs rounded-2xl transition-[background-color] cursor-pointer text-center"
              >
                {isKo ? '🏫 학원용 안내 페이지 직접 둘러보기 (/schools)' : '🏫 View School Features (/schools)'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
