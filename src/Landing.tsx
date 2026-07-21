import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useReducedMotion } from "framer-motion";
import ChekkiAiBentoGrid from "./components/ChekkiAiBentoGrid";
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

      {/* NEW BENTO GRID FEATURES */}
      <ChekkiAiBentoGrid isNight={theme === 'dark'} isKo={lang === 'ko'} />

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
