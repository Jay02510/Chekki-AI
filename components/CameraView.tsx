
import React, { useRef, useState, useEffect } from 'react';
import { compressImage } from '../utils/imageUtils';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { ChekkiMascot } from './Icons';
import { ASSETS } from '../constants';
import { FeedbackModal } from './FeedbackModal';
import { LegalModal } from './LegalModal';
import { FlyerModal } from './FlyerModal';

interface Props {
  onImageSelected: (base64: string) => void;
  isNight?: boolean;
}

export const CameraView: React.FC<Props> = ({ onImageSelected, isNight = false }) => {
  const { user, openLoginModal, isAuthenticated } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [imgError, setImgError] = useState(false);
  const [mascotLoaded, setMascotLoaded] = useState(false);
  
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showLegal, setShowLegal] = useState<'privacy' | 'terms' | null>(null);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showFlyerModal, setShowFlyerModal] = useState(false);
  
  const { t, language } = useLanguage();

  const processFile = async (file: File) => {
    setIsProcessing(true);
    try {
      const base64Url = await compressImage(file);
      const base64Data = base64Url.split(',')[1];
      onImageSelected(base64Data);
    } catch (e) {
      console.error("Image processing failed."); 
      alert("Error processing image. Please try another photo.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) processFile(e.target.files[0]);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation(); setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) processFile(e.dataTransfer.files[0]);
  };

  const ClarityGuide = () => (
    <div className="flex flex-wrap justify-center gap-3 mt-8 mb-4 px-2">
      {[
        { icon: '☀️', text: language === 'ko' ? '밝은 곳에서' : 'Good Lighting' },
        { icon: '📏', text: language === 'ko' ? '수평 맞춰서' : 'Hold Flat' },
        { icon: '🔍', text: language === 'ko' ? '초점 선명하게' : 'Stay Sharp' }
      ].map((tip, i) => (
        <div key={i} className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-xl shrink-0 backdrop-blur-sm transition-colors hover:border-white/30">
          <span className="text-sm">{tip.icon}</span>
          <span className="text-[10px] font-black text-zinc-400 whitespace-nowrap uppercase tracking-widest">{tip.text}</span>
        </div>
      ))}
    </div>
  );

  const DropZone = ({ size = "large" }: { size?: "large" | "compact" }) => (
    <div className={`relative w-full ${size === 'large' ? 'min-h-[400px] md:min-h-[500px]' : 'h-[500px]'} flex items-center justify-center py-12`}>
      {/* Visual ring background */}
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[95%] h-[95%] border-2 ${isNight ? 'border-indigo-500/5' : 'border-white/5'} rounded-[3.5rem] animate-[pulse_5s_ease-in-out_infinite] pointer-events-none`}></div>
      
      <div 
        role="button"
        id="magic-drop-zone-inner"
        className={`relative w-full h-full max-w-2xl mx-auto ${isNight ? 'bg-indigo-950/20' : 'bg-zinc-900/30'} backdrop-blur-3xl rounded-[3rem] border-2 transition-all duration-500 flex flex-col items-center justify-center p-10 md:p-16 group cursor-pointer
          ${dragActive ? 'border-orange-500 shadow-[0_0_80px_rgba(249,115,22,0.25)] scale-[1.02]' : 'border-white/10 shadow-[0_40px_100px_rgba(0,0,0,0.4)] hover:border-white/30 hover:shadow-[0_40px_100px_rgba(0,0,0,0.6)]'}`}
        onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
          {/* MASCORT SPEECH BUBBLE (The "Magic Cloud") */}
          {!isAuthenticated && (
            <div className="absolute top-0 -translate-y-1/2 z-40 animate-[bounce_3s_ease-in-out_infinite]">
                <div className="relative">
                    <div className="bg-orange-500 text-white text-[10px] font-black px-6 py-2.5 rounded-full uppercase tracking-widest shadow-[0_20px_40px_rgba(249,115,22,0.6)] flex items-center gap-3 border-2 border-white/20 whitespace-nowrap">
                        <span className="w-2 h-2 bg-white rounded-full animate-pulse shadow-sm"></span>
                        {t('guest_scan_badge')}
                    </div>
                    {/* Speech bubble tail */}
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-orange-500 rotate-45 border-r-2 border-b-2 border-white/20 -z-10"></div>
                </div>
            </div>
          )}

          <div className="relative z-10 flex flex-col items-center text-center w-full">
            <div className={`${size === 'large' ? 'w-40 h-40 md:w-64 md:h-64' : 'w-48 h-48'} mb-8 relative transition-all duration-700 group-hover:scale-105 group-hover:-rotate-2`}>
                {isProcessing ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className={`w-14 h-14 md:w-20 md:h-20 border-[6px] ${isNight ? 'border-indigo-500' : 'border-orange-500'} border-t-transparent rounded-full animate-spin shadow-2xl`}></div>
                  </div>
                ) : (
                  <div className="w-full h-full animate-float flex items-center justify-center">
                    {!imgError ? (
                       <img 
                        src={isNight ? ASSETS.HERO_SLEEPY : ASSETS.MASCOT_HAPPY} 
                        alt="Chekki Mascot" 
                        className={`w-full h-full object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)] filter brightness-110 ${isNight ? 'scale-[1.6] md:scale-[1.8]' : ''} transition-opacity duration-700 ${mascotLoaded ? 'opacity-100' : 'opacity-0'}`} 
                        onLoad={() => setMascotLoaded(true)}
                        onError={() => setImgError(true)}
                        loading="eager"
                       />
                    ) : (
                       <ChekkiMascot className="w-full h-full drop-shadow-2xl" mood={isNight ? "sleeping" : "happy"} />
                    )}
                  </div>
                )}
            </div>
            
            <div className="space-y-4 max-w-md">
                <h3 className="text-3xl md:text-5xl font-black text-white font-display tracking-tight break-keep drop-shadow-sm">
                {isProcessing ? t('processing') : t('drop_title')}
                </h3>
                <p className="text-zinc-500 font-bold font-korean text-base md:text-xl break-keep opacity-90 leading-relaxed">{t('drop_subtitle')}</p>
            </div>
            
            <ClarityGuide />

            <div className="mt-10 flex flex-col items-center gap-4 group/btn">
                <div className={`w-16 h-16 md:w-20 md:h-20 rounded-full ${isNight ? 'bg-indigo-600' : 'bg-orange-500'} flex items-center justify-center shadow-[0_20px_50px_rgba(249,115,22,0.4)] transition-all duration-300 group-hover:scale-110 group-hover:shadow-orange-500/60 border-4 border-white/20 active:scale-90`}>
                    <svg className="w-8 h-8 md:w-10 md:h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                </div>
                <span className="text-[10px] md:text-xs font-black text-zinc-500 uppercase tracking-[0.3em] group-hover:text-white transition-colors">{t('btn_upload')}</span>
            </div>
          </div>
          <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileChange} disabled={isProcessing} />
      </div>
    </div>
  );

  const VideoWalkthroughModal = () => (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/95 backdrop-blur-2xl" onClick={() => setShowVideoModal(false)}></div>
      <div className="relative w-full max-w-5xl aspect-video bg-black rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/10 animate-fade-in-up">
         <video src={ASSETS.VIDEO_WALKTHROUGH} controls autoPlay className="w-full h-full" />
         <button onClick={() => setShowVideoModal(false)} className="absolute top-8 right-8 bg-black/50 hover:bg-black text-white p-3 rounded-full transition-colors z-10 border border-white/10 backdrop-blur-md">✕</button>
      </div>
    </div>
  );

  const BetaBanner = () => (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-12 animate-fade-in-up w-full">
        {/* Feedback Card */}
        <button 
          onClick={() => setShowFeedbackModal(true)}
          className="group bg-white/5 hover:bg-white/10 border border-white/10 p-6 rounded-[2.5rem] flex items-center gap-5 transition-all shadow-xl backdrop-blur-md ring-1 ring-white/5 hover:ring-orange-500/40 text-left h-full"
        >
           <div className={`w-12 h-12 rounded-2xl flex-shrink-0 ${isNight ? 'bg-indigo-500/20' : 'bg-orange-500/20'} flex items-center justify-center text-2xl shadow-inner`}>✨</div>
           <div className="min-w-0">
              <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${isNight ? 'text-indigo-400' : 'text-orange-500'} mb-1`}>Feedback</p>
              <p className="text-base font-bold text-zinc-200 font-korean group-hover:text-white transition-colors leading-tight">
                {language === 'ko' ? "의견 보내기" : "Share Ideas"}
              </p>
           </div>
        </button>

        {/* Walkthrough Card */}
        <button 
          onClick={() => setShowVideoModal(true)}
          className="group bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/20 p-6 rounded-[2.5rem] flex items-center gap-5 transition-all shadow-xl backdrop-blur-md ring-1 ring-indigo-500/20 hover:ring-indigo-500/40 text-left h-full"
        >
          <div className="w-12 h-12 rounded-2xl flex-shrink-0 bg-indigo-500 flex items-center justify-center text-xl shadow-lg">▶️</div>
          <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 mb-1">Quick Guide</p>
              <p className="text-base font-bold text-white font-korean leading-tight">{t('btn_walkthrough')}</p>
          </div>
        </button>

        {/* Marketing Card */}
        <button 
          onClick={() => setShowFlyerModal(true)}
          className="group bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 p-6 rounded-[2.5rem] flex items-center gap-5 transition-all shadow-xl backdrop-blur-md ring-1 ring-orange-500/20 hover:ring-orange-500/40 text-left h-full"
        >
          <div className="w-12 h-12 rounded-2xl flex-shrink-0 bg-orange-500 flex items-center justify-center text-xl shadow-lg">📢</div>
          <div className="min-w-0">
              <p className={`text-[10px] font-black uppercase tracking-[0.2em] text-orange-400 mb-1`}>Resource</p>
              <p className="text-base font-bold text-white font-korean leading-tight">{t('res_title')}</p>
          </div>
        </button>
    </div>
  );

  if (isAuthenticated && user) {
    const remaining = user.plan === 'pro' ? '∞' : Math.max(0, user.maxScansPerDay - user.scansUsedToday);
    return (
      <div className="min-h-full pt-12 md:pt-32 pb-16 px-4 md:px-8 max-w-7xl mx-auto flex flex-col items-center animate-fade-in relative">
        {showFeedbackModal && <FeedbackModal onClose={() => setShowFeedbackModal(false)} />}
        {showVideoModal && <VideoWalkthroughModal />}
        {showFlyerModal && <FlyerModal onClose={() => setShowFlyerModal(false)} />}
        
        <div className="w-full max-w-4xl flex flex-col items-center text-center mb-12 gap-8">
           <div className="space-y-3">
              {user.schoolName && (
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-2 shadow-xl backdrop-blur-sm">
                      <span className="text-sm">🏫</span>
                      <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">{user.schoolName}</span>
                  </div>
              )}
              <h1 className="text-4xl md:text-7xl font-black text-white font-display break-keep leading-[1.1]">
                {t('dash_welcome')} <span className={`text-transparent bg-clip-text bg-gradient-to-r ${isNight ? 'from-indigo-400 to-purple-500' : 'from-orange-400 to-pink-500'}`}>{user.name}!</span>
              </h1>
              <p className="text-zinc-400 font-bold font-korean text-lg md:text-2xl max-w-2xl mx-auto leading-relaxed break-keep opacity-80">{t('dash_subtitle')}</p>
           </div>
           
           <div className="bg-[#0F1014] border border-white/10 rounded-full py-3 px-8 flex items-center gap-4 shadow-2xl ring-1 ring-white/5">
                <div className="text-[11px] text-zinc-500 uppercase font-black tracking-[0.2em]">{language === 'ko' ? "오늘 남은 마법" : "Magic Left Today"}</div>
                <div className="w-px h-6 bg-white/10"></div>
                <div className="font-bold text-white text-2xl font-display leading-none">{remaining}</div>
           </div>
        </div>
        
        <div className="w-full max-w-5xl mx-auto">
           <BetaBanner />
           <DropZone size="large" />
        </div>
        <p className="mt-10 text-zinc-600 text-xs font-black uppercase tracking-[0.3em] text-center opacity-60">{t('supported_formats')}</p>
      </div>
    );
  }

  return (
    <div className="min-h-full flex flex-col pt-12 md:pt-28 pb-16 overflow-x-hidden scroll-smooth">
      {showFeedbackModal && <FeedbackModal onClose={() => setShowFeedbackModal(false)} />}
      {showLegal && <LegalModal type={showLegal} onClose={() => setShowLegal(null)} />}
      {showVideoModal && <VideoWalkthroughModal />}
      {showFlyerModal && <FlyerModal onClose={() => setShowFlyerModal(false)} />}
      
      {/* Hero Section */}
      <div className="relative max-w-7xl mx-auto px-6 grid lg:grid-cols-[1.1fr_0.9fr] gap-12 lg:gap-8 items-center mb-24">
        <div className={`absolute top-0 left-1/4 -translate-x-1/2 w-[900px] h-[600px] ${isNight ? 'bg-indigo-900/20' : 'bg-brand-purple/10'} rounded-full blur-[140px] -z-10 pointer-events-none opacity-40 mix-blend-screen`}></div>
        <div className="w-full flex flex-col items-start text-left z-10 animate-fade-in-up order-2 lg:order-1">
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full border border-white/10 bg-white/5 mb-8 backdrop-blur-md shadow-2xl self-start ring-1 ring-white/10">
            <span className={`w-2 h-2 rounded-full ${isNight ? 'bg-indigo-500 shadow-[0_0_10px_#6366f1]' : 'bg-orange-500 shadow-[0_0_10px_#f97316]'} animate-pulse`}></span>
            <span className="text-[10px] md:text-xs font-black text-zinc-200 tracking-[0.2em] uppercase">{t('hero_badge')}</span>
          </div>
          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-white font-display mb-8 tracking-tighter text-left drop-shadow-2xl whitespace-pre-line leading-[1] break-keep">
            {isNight ? (
              <span className={`text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-600`}>{t('hero_title_night')}</span>
            ) : (
              language === 'ko' ? (
                  <>숙제 전쟁 끝, <br/> <span className={`text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-pink-500`}>웃으며 공부하세요</span></>
              ) : (
                  <>Stress Free <br/> <span className={`text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-pink-500`}>Homework Prep.</span></>
              )
            )}
          </h1>
          <p className="text-xl md:text-2xl text-zinc-400 max-w-xl leading-relaxed mb-12 font-korean text-left font-medium break-keep opacity-80">
            {isNight ? t('hero_desc_night') : t('hero_desc')}
          </p>
          
          <div className="flex flex-wrap gap-5 justify-start items-center">
            {/* Primary Action */}
            <button onClick={openLoginModal} className="group bg-white text-black px-12 py-6 rounded-2xl font-black text-xl md:text-2xl transition-all transform active:scale-95 shadow-[0_20px_50px_rgba(255,255,255,0.15)] font-display flex items-center gap-4 overflow-hidden ring-2 ring-white/10 hover:ring-white/50 hover:shadow-white/30">
              <span className="font-korean whitespace-nowrap">{t('hero_cta_btn')}</span> 
              <span className="text-3xl transition-transform group-hover:translate-x-2">→</span>
            </button>

            {/* Discovery Shortcut */}
            <button 
              onClick={() => {
                const dropZone = document.getElementById('magic-drop-zone');
                dropZone?.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }} 
              className="group px-10 py-6 rounded-2xl border-2 border-white/10 bg-white/5 hover:bg-white/10 text-white font-black text-base md:text-xl transition-all flex items-center gap-4 backdrop-blur-xl ring-1 ring-white/5 active:scale-95"
            >
              <span className="text-orange-500 transition-transform group-hover:rotate-[360deg] duration-700">✨</span> {t('hero_guest_cta')}
            </button>
          </div>
        </div>
        
        {/* Mascot Hero Graphic */}
        <div className="w-full flex justify-center lg:justify-end items-center animate-fade-in-up order-1 lg:order-2">
            <div className="relative w-full max-w-[300px] md:max-w-[480px] aspect-square flex items-center justify-center">
                <div className={`absolute inset-0 bg-gradient-to-tr ${isNight ? 'from-indigo-500/20 to-purple-500/20' : 'from-brand-orange/20 to-brand-purple/20'} rounded-full blur-[100px] animate-pulse`}></div>
                <div className="w-full h-full relative z-10 transition-transform scale-100 md:scale-105">
                   <img src={isNight ? ASSETS.HERO_SLEEPY : ASSETS.HERO_IMAGE} alt="Chekki Hero" className="w-full h-full object-contain drop-shadow-[0_40px_80px_rgba(0,0,0,0.5)] animate-float filter brightness-110" />
                </div>
            </div>
        </div>
      </div>

      {/* Upload Zone / Landing Context */}
      <div id="magic-drop-zone" className="max-w-5xl mx-auto px-6 mb-32 w-full relative pt-16">
         <DropZone size="large" />
         <p className="mt-10 text-zinc-600 text-[10px] md:text-xs font-black uppercase tracking-[0.4em] text-center opacity-40">{t('supported_formats')}</p>
      </div>

      {/* Differentiation Section */}
      <div className="max-w-7xl mx-auto px-6 mb-32">
          <h2 className="text-4xl md:text-7xl font-black text-white text-center mb-16 font-display break-keep tracking-tight">{t('diff_title')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="bg-zinc-900/40 border border-white/10 p-12 rounded-[3.5rem] backdrop-blur-2xl shadow-2xl transition-all hover:border-white/20">
                  <div className="text-5xl mb-8">✍️</div>
                  <h3 className="text-2xl md:text-3xl font-bold text-white mb-4 font-korean">{t('diff_ocr')}</h3>
                  <p className="text-zinc-400 text-lg leading-relaxed font-korean break-keep opacity-80">{t('diff_ocr_desc')}</p>
              </div>
              <div className="bg-zinc-900/40 border border-white/10 p-12 rounded-[3.5rem] backdrop-blur-2xl shadow-2xl transition-all hover:border-white/20">
                  <div className="text-5xl mb-8">💌</div>
                  <h3 className="text-2xl md:text-3xl font-bold text-white mb-4 font-korean">{t('diff_script')}</h3>
                  <p className="text-zinc-400 text-lg leading-relaxed font-korean break-keep opacity-80">{t('diff_script_desc')}</p>
              </div>
          </div>
      </div>

      {/* Safety Section */}
      <div className="bg-white/5 border-y border-white/5 py-32 mb-32 backdrop-blur-3xl">
        <div className="max-w-7xl mx-auto px-6 text-center">
            <h2 className="text-4xl md:text-7xl font-black text-white mb-10 font-display break-keep tracking-tight">{t('trust_title')}</h2>
            <div className="grid md:grid-cols-2 gap-20 mt-20">
                <div className="space-y-8 animate-fade-in-up">
                    <div className="text-emerald-500 text-7xl drop-shadow-[0_0_20px_rgba(16,185,129,0.3)]">🔒</div>
                    <h3 className="text-3xl font-bold text-white font-korean">{t('trust_privacy')}</h3>
                    <p className="text-zinc-400 text-lg max-w-sm mx-auto font-korean break-keep leading-relaxed opacity-80">{t('trust_privacy_desc')}</p>
                </div>
                <div className="space-y-8 animate-fade-in-up">
                    <div className="text-orange-500 text-7xl drop-shadow-[0_0_20px_rgba(249,115,22,0.3)]">👨‍👩‍👧</div>
                    <h3 className="text-3xl font-bold text-white font-korean">{t('trust_safety')}</h3>
                    <p className="text-zinc-400 text-lg max-w-sm mx-auto font-korean break-keep leading-relaxed opacity-80">{t('trust_safety_desc')}</p>
                </div>
            </div>
        </div>
      </div>

      {/* Step Process */}
      <div className="max-w-7xl mx-auto px-6 mb-32">
          <h2 className="text-2xl md:text-5xl font-black text-white text-center mb-24 font-display uppercase tracking-[0.4em] break-keep">{t('how_title')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-16 md:gap-24">
              {[
                  { title: t('how_step1'), desc: t('how_step1_desc'), icon: '📸' },
                  { title: t('how_step2'), desc: t('how_step2_desc'), icon: '✨' },
                  { title: t('how_step3'), desc: t('how_step3_desc'), icon: '🗣️' }
              ].map((item, i) => (
                  <div key={i} className="flex flex-col items-center text-center group">
                      <div className="w-28 h-28 md:w-36 md:h-36 rounded-[3rem] bg-white/5 border border-white/10 flex items-center justify-center text-5xl md:text-6xl mb-10 shadow-2xl backdrop-blur-md group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                        {item.icon}
                      </div>
                      <h3 className="text-3xl md:text-4xl font-black text-white mb-6 font-korean">{item.title}</h3>
                      <p className="text-zinc-500 font-korean text-lg md:text-xl leading-relaxed break-keep max-w-[280px] opacity-70">
                        {item.desc}
                      </p>
                  </div>
              ))}
          </div>
      </div>

      {/* Final Action Wrap */}
      <div className="max-w-7xl mx-auto px-6 pb-24">
          <div className="relative w-full rounded-[4rem] overflow-hidden bg-gradient-to-r from-brand-orange via-brand-pink to-brand-purple shadow-[0_60px_120px_rgba(249,115,22,0.4)] p-12 md:p-24 lg:p-32">
              <div className="absolute top-0 right-0 w-3/4 h-full bg-white/10 blur-[120px] pointer-events-none rotate-12"></div>
              <div className="relative z-10 w-full flex flex-col lg:flex-row items-center gap-16">
                  <div className="w-full lg:max-w-2xl text-left">
                      <h2 className="text-6xl md:text-8xl font-black text-white mb-8 font-display tracking-tight leading-[0.9] drop-shadow-2xl break-keep">
                          {t('hero_cta_title')}
                      </h2>
                      <p className="text-white font-korean text-2xl md:text-3xl mb-12 leading-relaxed break-keep font-bold opacity-90 drop-shadow-lg max-w-lg">
                          {t('hero_cta_desc')}
                      </p>
                      <button 
                        onClick={openLoginModal} 
                        className="group bg-white text-orange-600 px-14 py-8 rounded-[2.5rem] font-black text-2xl md:text-3xl transition-all transform active:scale-95 shadow-[0_30px_60px_rgba(0,0,0,0.3)] font-display flex items-center justify-center gap-6 hover:shadow-white/40 whitespace-nowrap w-fit ring-4 ring-white/10"
                      >
                          <span className="font-korean">{t('hero_cta_btn')}</span>
                          <span className="text-4xl transition-transform group-hover:translate-x-3">→</span>
                      </button>
                  </div>
                  <div className="hidden lg:flex flex-1 justify-end items-center pointer-events-none">
                       <img src={ASSETS.LOGO} alt="Chekki Logo" className="w-full max-w-lg animate-float drop-shadow-[0_40px_100px_rgba(255,255,255,0.4)] scale-[2.2] translate-x-12" />
                  </div>
              </div>
          </div>
          
          <div className="mt-24 pt-12 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-12">
              <div className="flex flex-col items-center md:items-start text-center md:text-left">
                  <h4 className="text-3xl font-black text-white font-display mb-3">
                    Chekki<span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-pink-500">AI</span>
                  </h4>
                  <p className="text-zinc-500 text-sm font-bold font-korean tracking-[0.2em] uppercase break-keep max-w-md opacity-60">
                    {t('footer_text')}
                  </p>
              </div>
              <div className="flex flex-wrap justify-center gap-12 text-sm text-zinc-400 font-black uppercase tracking-[0.4em]">
                  <button onClick={() => setShowLegal('privacy')} className="hover:text-white transition-colors cursor-pointer">PRIVACY</button>
                  <button onClick={() => setShowLegal('terms')} className="hover:text-white transition-colors cursor-pointer">TERMS</button>
                  <a href="mailto:chekkihelp@gmail.com" className="hover:text-white transition-colors cursor-pointer">SUPPORT</a>
              </div>
          </div>
      </div>
    </div>
  );
};
