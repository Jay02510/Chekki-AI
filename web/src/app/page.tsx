"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useReducedMotion } from "motion/react";
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
  DownloadSimple
} from "@phosphor-icons/react";

export default function Home() {
  const reduce = useReducedMotion();
  const heroRef = useRef<HTMLElement>(null);
  const textRevealRef = useRef<HTMLHeadingElement>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    if (reduce) return;

    const ctx = gsap.context(() => {
      // Artistic Asymmetry GSAP Entrance
      gsap.from(".hero-text", {
        y: 60,
        opacity: 0,
        duration: 1.2,
        stagger: 0.15,
        ease: "power3.out"
      });

      gsap.from(".hero-mascot", {
        scale: 0.9,
        opacity: 0,
        duration: 1.5,
        delay: 0.2,
        ease: "power3.out"
      });

      // Scrubbing Text Reveal
      if (textRevealRef.current) {
        const words = textRevealRef.current.querySelectorAll(".reveal-word");
        gsap.fromTo(words, 
          { opacity: 0.1 },
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
    });

    return () => ctx.revert();
  }, [reduce]);

  // Handle Mobile Menu Scroll Lock
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
  }, [mobileMenuOpen]);

  return (
    <main className="overflow-x-hidden w-full max-w-full bg-[#050505] min-h-screen text-slate-50 selection:bg-brand selection:text-white">
      {/* Accessibility: Skip to Content */}
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-[9999] bg-brand text-white px-4 py-2 rounded-full font-bold outline-none focus-visible:ring-2 focus-visible:ring-white">
        Skip to content
      </a>

      {/* Global Noise Overlay */}
      <div className="fixed inset-0 z-[100] pointer-events-none opacity-[0.03] bg-noise mix-blend-overlay" />

      {/* Navigation - Fluid Island */}
      <div className="fixed top-6 left-0 w-full z-50 flex justify-center px-4">
        <header className="flex h-14 items-center justify-between px-6 max-w-4xl w-full mx-auto bg-white/5 backdrop-blur-2xl border border-white/10 rounded-full shadow-2xl">
          <div className="flex items-center gap-2">
            <span className="font-bold tracking-tight text-white">Chekki</span>
          </div>
          
          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="https://chekki-ai.vercel.app/app" target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-white/60 hover:text-white transition-colors outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-[#050505] rounded-sm">Web App</a>
            <a href="#educators" className="text-sm font-medium text-white/60 hover:text-white transition-colors outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-[#050505] rounded-sm">Educators</a>
          </nav>
          
          <div className="hidden md:flex items-center gap-4">
            <a href="https://www.instagram.com/chekki__ai" target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-white transition-colors outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-[#050505] rounded-sm">
              <InstagramLogo size={20} weight="fill" />
            </a>
            <a href="https://chekki-ai.vercel.app/app" target="_blank" rel="noopener noreferrer" className="group relative overflow-hidden items-center gap-3 px-4 py-1.5 bg-brand text-white font-semibold rounded-full text-xs uppercase tracking-wider transition-transform duration-700 ease-[var(--ease-premium)] active:scale-[0.96] flex outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#050505]">
              <span>Open App</span>
            </a>
          </div>

          {/* Mobile Hamburger Morph */}
          <button 
            className="md:hidden relative w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-[#050505]"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={20} weight="bold" /> : <List size={20} weight="bold" />}
          </button>
        </header>
      </div>

      {/* Mobile Menu Modal */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-black/80 backdrop-blur-3xl flex flex-col items-center justify-center">
          <nav className="flex flex-col items-center gap-8 text-2xl font-medium text-white">
            <a href="https://chekki-ai.vercel.app/app" target="_blank" rel="noopener noreferrer" onClick={() => setMobileMenuOpen(false)} className="hover:text-brand transition-colors outline-none focus-visible:ring-2 focus-visible:ring-brand rounded-sm">Web App</a>
            <a href="#educators" onClick={() => setMobileMenuOpen(false)} className="hover:text-brand transition-colors outline-none focus-visible:ring-2 focus-visible:ring-brand rounded-sm">For Educators</a>
            <a href="https://urlgeni.us/chekki" target="_blank" rel="noopener noreferrer" onClick={() => setMobileMenuOpen(false)} className="hover:text-brand transition-colors outline-none focus-visible:ring-2 focus-visible:ring-brand rounded-sm">Download App</a>
            <a href="https://www.instagram.com/chekki__ai" target="_blank" rel="noopener noreferrer" className="mt-8 text-brand outline-none focus-visible:ring-2 focus-visible:ring-brand rounded-full">
              <InstagramLogo size={40} weight="fill" />
            </a>
          </nav>
        </div>
      )}

      {/* ATTENTION: Hero Section - Artistic Asymmetry */}
      <section id="main-content" ref={heroRef} className="relative pt-40 pb-32 md:pb-48 px-4 md:px-8 max-w-7xl mx-auto w-full flex flex-col md:flex-row items-center justify-between gap-12 md:gap-8 min-h-[100dvh]">
        <div className="flex-1 flex flex-col items-start z-10 w-full">
          <div className="hero-text mb-6 inline-flex items-center rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em] font-medium bg-white/5 border border-white/10 text-white/70">
            For Parents & Educators
          </div>
          <h1 className="hero-text text-[clamp(2.5rem,5.5vw,6rem)] font-bold tracking-tighter leading-[1.05] text-white w-full max-w-4xl">
            Homework tracking, <br />
            made <span className="text-brand">transparent.</span>
          </h1>
          <p className="hero-text mt-8 text-lg md:text-xl text-white/60 leading-relaxed max-w-xl">
            Empower your child's education. Chekki helps Korean parents stay connected to their child's daily assignments without the stress.
          </p>
          <div className="hero-text mt-12 flex flex-col sm:flex-row items-center gap-6 w-full sm:w-auto">
            {/* Primary Magnetic CTA */}
            <a href="https://chekki-ai.vercel.app/app" target="_blank" rel="noopener noreferrer" className="group relative w-full sm:w-auto overflow-hidden pl-8 pr-2 py-2 bg-brand text-white font-bold rounded-full text-lg flex items-center justify-between gap-8 transition-transform duration-700 ease-[var(--ease-premium)] active:scale-[0.98] shadow-2xl shadow-brand/20 outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#050505]">
              <span className="relative z-10">Open Web App</span>
              <div className="w-12 h-12 rounded-full bg-black/20 flex items-center justify-center transition-transform duration-700 ease-[var(--ease-premium)] group-hover:scale-105 group-hover:translate-x-1 group-hover:-translate-y-[1px]">
                <ArrowRight weight="bold" />
              </div>
            </a>
            
            {/* Secondary Magnetic CTA */}
            <a href="https://urlgeni.us/chekki" target="_blank" rel="noopener noreferrer" className="group relative w-full sm:w-auto overflow-hidden pl-8 pr-2 py-2 bg-white/5 text-white font-bold rounded-full text-lg flex items-center justify-between gap-8 border border-white/10 transition-transform duration-700 ease-[var(--ease-premium)] active:scale-[0.98] hover:bg-white/10 outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#050505]">
              <span className="relative z-10">Download App</span>
              <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center transition-transform duration-700 ease-[var(--ease-premium)] group-hover:scale-105 group-hover:-translate-y-[2px]">
                <DownloadSimple weight="bold" />
              </div>
            </a>
          </div>
        </div>
        
        {/* Overlapping Artistic Asset */}
        <div className="hero-mascot flex-1 w-full relative h-[400px] md:h-[700px] flex justify-end">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[500px] aspect-square bg-brand/20 rounded-full blur-[120px]" />
          <Image
            src="https://res.cloudinary.com/dginphpy4/image/upload/v1771383933/Chekki_Futuristic_Background_i8foqe_e_background_removal_e_dropshadow_azimuth_220_elevation_60_spread_20_f_png_e_improve_e_sharpen_db97d3.png"
            alt="Chekki App Graphic"
            fill
            className="object-contain drop-shadow-2xl z-10"
            priority
          />
        </div>
      </section>

      {/* DESIRE: GSAP Scrubbing Text Reveal with Video Background */}
      <section className="py-32 md:py-64 px-4 bg-[#050505] border-y border-white/5 relative overflow-hidden flex items-center justify-center min-h-[100dvh]">
        {/* Cinematic Video Background */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[#050505]/80 z-10" />
          <video 
            autoPlay 
            loop 
            muted 
            playsInline 
            className="w-full h-full object-cover opacity-20 mix-blend-screen"
          >
            <source src="https://res.cloudinary.com/dginphpy4/video/upload/v1765769964/chekki-intro_y7hj7c.mp4" type="video/mp4" />
          </video>
        </div>

        <div className="max-w-5xl mx-auto text-center relative z-20">
          <h2 ref={textRevealRef} className="text-[clamp(2.5rem,5vw,5rem)] font-medium leading-[1.2] text-white tracking-tight">
            {`Bridging the cultural gap between school and home.`.split(" ").map((word, i) => (
              <span key={i} className="reveal-word inline-block mr-[0.3em]">{word}</span>
            ))}
          </h2>
        </div>
      </section>

      {/* INTEREST: Gapless Bento Grid with Double-Bezel Architecture */}
      <section id="educators" className="py-32 md:py-48 px-4 md:px-8 max-w-7xl mx-auto w-full">
        <div className="mb-24 flex flex-col items-start md:items-center md:text-center">
          <div className="mb-6 inline-flex items-center rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em] font-medium bg-white/5 border border-white/10 text-white/70">
            Educator Hub
          </div>
          <h2 className="text-[clamp(3rem,5vw,4.5rem)] font-bold tracking-tight text-white mb-6">
            Beyond the app.
          </h2>
          <p className="text-white/60 text-xl max-w-2xl">
            Chekki provides high-quality educational materials and insights for modern teaching, beautifully integrated into your workflow.
          </p>
        </div>

        {/* 4x3 Dense Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 auto-rows-[250px] md:auto-rows-[300px] gap-4 md:gap-6 grid-flow-dense">
          
          {/* 1. YouTube (col-span-2, row-span-2) - DOUBLE BEZEL */}
          <a href="https://www.youtube.com/@ChekkiAI" target="_blank" rel="noopener noreferrer" className="md:col-span-2 md:row-span-2 rounded-[2.5rem] bg-white/[0.02] border border-white/5 p-2 shadow-2xl group block outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-4 focus-visible:ring-offset-[#050505]">
            <div className="overflow-hidden rounded-[calc(2.5rem-0.5rem)] bg-[#0A0A0A] relative h-full flex flex-col justify-end p-8 md:p-12 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]">
              <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/40 to-[#050505]/20 z-10 pointer-events-none" />
              <div className="absolute inset-0 opacity-30 mix-blend-screen group-hover:scale-110 group-hover:opacity-50 transition-all duration-[1200ms] ease-[var(--ease-premium)] bg-[url('/assets/youtube_bg.png')] bg-cover bg-center" />
              <div className="relative z-20">
                <PlayCircle weight="fill" className="text-6xl text-brand mb-6 drop-shadow-xl" />
                <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">YouTube Channel</h3>
                <p className="text-white/60 text-lg max-w-md mb-8 hidden md:block">
                  Weekly insights on bilingual education, study habits, and classroom strategies.
                </p>
                <div className="relative inline-flex items-center gap-4 text-white font-semibold">
                  <span className="relative after:content-[''] after:absolute after:-bottom-1 after:left-0 after:w-full after:h-px after:bg-brand after:origin-left after:scale-x-0 group-hover:after:scale-x-100 after:transition-transform after:duration-500 after:ease-[var(--ease-premium)]">
                    Watch latest video
                  </span>
                  <ArrowRight className="transition-transform duration-500 ease-[var(--ease-premium)] group-hover:translate-x-1 text-brand" />
                </div>
              </div>
            </div>
          </a>

          {/* 2. TPT Store (col-span-1, row-span-2) - DOUBLE BEZEL */}
          <a href="https://www.teacherspayteachers.com/store/chekki-ai" target="_blank" rel="noopener noreferrer" className="md:col-span-1 md:row-span-2 rounded-[2.5rem] bg-white/[0.02] border border-white/5 p-2 shadow-xl group block outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-4 focus-visible:ring-offset-[#050505]">
            <div className="overflow-hidden rounded-[calc(2.5rem-0.5rem)] bg-[#0A0A0A] relative h-full flex flex-col justify-between p-8 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
              <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/40 to-[#050505]/20 z-10 pointer-events-none" />
              <div className="absolute inset-0 opacity-30 mix-blend-screen group-hover:scale-110 group-hover:opacity-50 transition-all duration-[1200ms] ease-[var(--ease-premium)] bg-[url('https://res.cloudinary.com/dginphpy4/image/upload/v1771381888/Chekki_Splash_1_nrpzaj.png')] bg-cover bg-center" />

              <div className="relative z-20 flex justify-between items-start">
                <div className="w-12 h-12 rounded-full bg-white/10 border border-white/20 flex items-center justify-center backdrop-blur-md">
                  <GraduationCap weight="fill" className="text-2xl text-blue-400" />
                </div>
              </div>
              <div className="relative z-20">
                <h3 className="text-2xl font-bold text-white mb-2">TPT Store</h3>
                <p className="text-white/60 text-sm mb-6">Downloadable worksheets & lesson plans.</p>
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center transition-transform duration-700 ease-[var(--ease-premium)] group-hover:bg-brand group-hover:text-white">
                  <ArrowRight weight="bold" />
                </div>
              </div>
            </div>
          </a>

          {/* 3. Spotify (col-span-1, row-span-1) - DOUBLE BEZEL */}
          <a href="https://open.spotify.com/show/2onH0XU5yky37cBxdqKaY8" target="_blank" rel="noopener noreferrer" className="md:col-span-1 md:row-span-1 rounded-[2.5rem] bg-green-500/10 border border-green-500/20 p-2 shadow-xl group block outline-none focus-visible:ring-2 focus-visible:ring-green-400 focus-visible:ring-offset-4 focus-visible:ring-offset-[#050505]">
            <div className="overflow-hidden rounded-[calc(2.5rem-0.5rem)] bg-[#0A0A0A] relative h-full flex flex-col justify-between p-6 md:p-8 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
              <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/20 rounded-full blur-[50px] group-hover:bg-green-500/30 transition-colors duration-700 z-10" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/40 to-[#050505]/20 z-10 pointer-events-none" />
              <div className="absolute inset-0 opacity-30 mix-blend-screen group-hover:scale-110 group-hover:opacity-50 transition-all duration-[1200ms] ease-[var(--ease-premium)] bg-[url('/assets/spotify_bg.png')] bg-cover bg-center" />
              <div className="relative z-20">
                <SpotifyLogo weight="fill" className="text-4xl text-green-500 mb-4" />
                <h3 className="text-xl font-bold text-white">Podcast</h3>
              </div>
              <div className="relative z-20 text-white/50 text-sm font-medium flex items-center gap-2 group-hover:text-green-400 transition-colors">
                Listen on Spotify <ArrowRight />
              </div>
            </div>
          </a>

          {/* 4. Etsy (col-span-1, row-span-1) - DOUBLE BEZEL */}
          <a href="https://www.etsy.com/shop/ChekkiAI?dd_referrer=" target="_blank" rel="noopener noreferrer" className="md:col-span-1 md:row-span-1 rounded-[2.5rem] bg-brand/10 border border-brand/20 p-2 shadow-xl group block outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-4 focus-visible:ring-offset-[#050505]">
            <div className="overflow-hidden rounded-[calc(2.5rem-0.5rem)] bg-[#0A0A0A] relative h-full flex flex-col justify-between p-6 md:p-8 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand/20 rounded-full blur-[50px] group-hover:bg-brand/30 transition-colors duration-700 z-10" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/40 to-[#050505]/20 z-10 pointer-events-none" />
              <div className="absolute inset-0 opacity-30 mix-blend-screen group-hover:scale-110 group-hover:opacity-50 transition-all duration-[1200ms] ease-[var(--ease-premium)] bg-[url('/assets/etsy_bg.png')] bg-cover bg-center" />
              <div className="relative z-20">
                <Storefront weight="fill" className="text-4xl text-brand mb-4" />
                <h3 className="text-xl font-bold text-white">Etsy Shop</h3>
              </div>
              <div className="relative z-20 text-white/50 text-sm font-medium flex items-center gap-2 group-hover:text-brand transition-colors">
                Shop merch <ArrowRight />
              </div>
            </div>
          </a>

          {/* 5. Free Grammar PPT (col-span-2, row-span-1) - DOUBLE BEZEL */}
          <a href="https://chekkiai.netlify.app/" target="_blank" rel="noopener noreferrer" className="md:col-span-2 md:row-span-1 rounded-[2.5rem] bg-white/[0.02] border border-white/5 p-2 shadow-xl group block outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-4 focus-visible:ring-offset-[#050505]">
            <div className="overflow-hidden rounded-[calc(2.5rem-0.5rem)] bg-[#0A0A0A] relative h-full flex flex-col md:flex-row items-start md:items-center justify-between p-6 md:p-8 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
              <div className="relative z-20 flex items-center gap-6">
                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                  <FilePdf weight="fill" className="text-3xl text-red-400" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white mb-1">Top Grammar Mistakes</h3>
                  <p className="text-white/50 text-sm">A free PPT explaining the top grammar mistakes Korean students struggle with.</p>
                </div>
              </div>
              <div className="relative z-20 mt-6 md:mt-0 w-12 h-12 rounded-full bg-white/5 flex items-center justify-center transition-transform duration-700 ease-[var(--ease-premium)] group-hover:scale-110 group-hover:bg-white/10">
                <ArrowRight weight="bold" className="text-white" />
              </div>
            </div>
          </a>

          {/* 6. Personal Portfolio (col-span-2, row-span-1) - DOUBLE BEZEL */}
          <a href="https://jason-portfolio-live.vercel.app/" target="_blank" rel="noopener noreferrer" className="md:col-span-2 md:row-span-1 rounded-[2.5rem] bg-white/[0.02] border border-white/5 p-2 shadow-xl group block outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-4 focus-visible:ring-offset-[#050505]">
            <div className="overflow-hidden rounded-[calc(2.5rem-0.5rem)] bg-[#0A0A0A] relative h-full flex flex-col md:flex-row items-start md:items-center justify-between p-6 md:p-8 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] overflow-hidden">
              <div className="absolute -bottom-16 -right-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-[60px] group-hover:bg-indigo-500/20 transition-colors duration-700" />
              <div className="relative z-20 flex items-center gap-6">
                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                  <UserCircle weight="fill" className="text-3xl text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white mb-1">Creator Portfolio</h3>
                  <p className="text-white/50 text-sm">Discover the builder behind Chekki.</p>
                </div>
              </div>
              <div className="relative z-20 mt-6 md:mt-0 w-12 h-12 rounded-full bg-indigo-500 flex items-center justify-center transition-transform duration-700 ease-[var(--ease-premium)] group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(99,102,241,0.5)]">
                <ArrowRight weight="bold" className="text-white" />
              </div>
            </div>
          </a>

        </div>
      </section>

      {/* ACTION: Massive Footer CTA */}
      <footer className="py-32 md:py-48 px-4 md:px-8 bg-[#020617] border-t border-white/5 flex flex-col items-center justify-center text-center relative overflow-hidden">
        {/* Subtle noise in footer too */}
        <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.05] bg-noise mix-blend-overlay" />
        
        {/* Ethereal Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[800px] aspect-square bg-brand/10 rounded-full blur-[150px] pointer-events-none" />
        
        <h2 className="relative z-10 text-[clamp(3rem,6vw,6rem)] font-bold tracking-tight text-white max-w-4xl leading-[1.05] mb-16">
          Ready to simplify <br /> homework?
        </h2>
        
        <div className="relative z-10 flex flex-col sm:flex-row gap-6">
          <a href="https://chekki-ai.vercel.app/app" target="_blank" rel="noopener noreferrer" className="group relative overflow-hidden pl-10 pr-3 py-3 bg-brand text-white font-bold rounded-full text-xl flex items-center justify-between gap-8 transition-transform duration-700 ease-[var(--ease-premium)] active:scale-[0.98] shadow-2xl shadow-brand/20 outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#020617]">
            <span className="relative z-20 tracking-wide">Start Using Chekki</span>
            <div className="relative z-20 w-14 h-14 rounded-full bg-black/20 flex items-center justify-center transition-transform duration-700 ease-[var(--ease-premium)] group-hover:scale-105 group-hover:translate-x-1 group-hover:-translate-y-[1px]">
              <ArrowRight weight="bold" className="text-2xl" />
            </div>
          </a>
          
          <a href="https://urlgeni.us/chekki" target="_blank" rel="noopener noreferrer" className="group relative overflow-hidden pl-10 pr-3 py-3 bg-white/10 backdrop-blur-md border border-white/20 text-white font-bold rounded-full text-xl flex items-center justify-between gap-8 transition-transform duration-700 ease-[var(--ease-premium)] active:scale-[0.98] shadow-2xl hover:bg-white/20 outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#020617]">
            <span className="relative z-20 tracking-wide">Download App</span>
            <div className="relative z-20 w-14 h-14 rounded-full bg-white/20 flex items-center justify-center transition-transform duration-700 ease-[var(--ease-premium)] group-hover:scale-105 group-hover:-translate-y-[2px]">
              <DownloadSimple weight="bold" className="text-2xl" />
            </div>
          </a>
        </div>
        
        <div className="relative z-10 mt-24 flex flex-col items-center gap-6">
          <div className="flex items-center gap-6 text-white/50 text-sm font-medium mb-4">
            <a href="/privacy" className="hover:text-white transition-colors outline-none focus-visible:ring-2 focus-visible:ring-white rounded-sm">Privacy Policy</a>
            <a href="/terms" className="hover:text-white transition-colors outline-none focus-visible:ring-2 focus-visible:ring-white rounded-sm">Terms of Service</a>
          </div>
          <a href="https://www.instagram.com/chekki__ai" target="_blank" rel="noopener noreferrer" className="w-16 h-16 rounded-full bg-black/20 border border-white/5 flex items-center justify-center text-white hover:bg-black/40 hover:scale-110 transition-all duration-500 ease-[var(--ease-premium)] outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#020617]">
            <InstagramLogo size={32} weight="fill" />
          </a>
          <p className="text-white/60 font-medium">
            © {new Date().getFullYear()} Chekki. Designed for parents & educators.
          </p>
        </div>
      </footer>
    </main>
  );
}
