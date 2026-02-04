
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
    <div className="flex gap-2 mt-6 mb-2 overflow-x-auto pb-2 no-scrollbar px-2">
      {[
        { icon: '☀️', text: language === 'ko' ? '밝은 곳에서' : 'Good Lighting' },
        { icon: '📏', text: language === 'ko' ? '수평 맞춰서' : 'Hold Flat' },
        { icon: '🔍', text: language === 'ko' ? '초점 선명하게' : 'Stay Sharp' }
      ].map((tip, i) => (
        <div key={i} className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full shrink-0">
          <span className="text-xs">{tip.icon}</span>
          <span className="text-[10px] font-bold text-zinc-500 whitespace-nowrap uppercase tracking-widest">{tip.text}</span>
        </div>
      ))}
    </div>
  );

  const DropZone = ({ size = "large" }: { size?: "large" | "compact" }) => (
    <div className={`relative w-full ${size === 'large' ? 'min-h-[350px] h-auto md:min-h-[450px]' : 'h-[500px]'} transition-all duration-700 ease-out py-8`}>
      {/* Decorative pulse ring */}
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[85%] h-[85%] border ${isNight ? 'border-indigo-500/5' : 'border-white/5'} rounded-[3rem] animate-[pulse_4s_ease-in-out_infinite] pointer-events-none`}></div>
      
      <div 
        role="button"
        id="magic-drop-zone-inner"
        className={`relative w-full h-full max-w-2xl mx-auto ${isNight ? 'bg-indigo-950/20' : 'bg-zinc-900/40'} backdrop-blur-3xl rounded-[2.5rem] border transition-all duration-500 flex flex-col items-center justify-center p-8 md:p-12 group cursor-pointer overflow-hidden
          ${dragActive ? 'border-orange-500 shadow-[0_0_60px_rgba(249,115,22,0.2)] scale-[1.01]' : 'border-white/10 shadow-2xl hover:border-white/20'}`}
        onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
          {/* Guest Mode Reward Badge - Redesigned for Pro Look */}
          {!isAuthenticated && (
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30">
               <div className="bg-orange-500 text-white text-[9px] font-black px-6 py-2 rounded-full uppercase tracking-[0.2em] shadow-[0_10px_30px_rgba(249,115,22,0.5)] border-2 border-white/20 flex items-center gap-3 animate-pulse">
                  <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                  {t('guest_scan_badge')}
               </div>
            </div>
          )}

          <div className="relative z-10 flex flex-col items-center text-center w-full">
            <div className={`${size === 'large' ? 'w-32 h-32 md:w-52 md:h-52' : 'w-40 h-40'} mb-6 relative transition-all duration-500 group-hover:scale-105`}>
                {isProcessing ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className={`w-12 h-12 md:w-16 md:h-16 border-4 ${isNight ? 'border-indigo-500' : 'border-brand-orange'} border-t-transparent rounded-full animate-spin`}></div>
                  </div>
                ) : (
                  <div className="w-full h-full animate-float flex items-center justify-center">
                    {!imgError ? (
                       <img 
                        src={isNight ? ASSETS.HERO_SLEEPY : ASSETS.MASCOT_HAPPY} 
                        alt="Chekki Mascot" 
                        className={`w-full h-full object-contain drop-shadow-2xl filter brightness-110 ${isNight ? 'scale-[1.5] md:scale-[1.7]' : ''} transition-opacity duration-500 ${mascotLoaded ? 'opacity-100' : 'opacity-0'}`} 
                        onLoad={() => setMascotLoaded(true)}
                        onError={() => setImgError(true)}
                        loading="eager"
                       />
                    ) : (
                       <ChekkiMascot className="w-full h-full drop-shadow-2xl filter brightness-110" mood={isNight ? "sleeping" : "happy"} />
                    )}
                  </div>
                )}
            </div>
            
            <div className="space-y-2 max-w-sm">
                <h3 className="text-2xl md:text-4xl font-black text-white font-display tracking-tight break-keep">
                {isProcessing ? t('processing') : t('drop_title')}
                </h3>
                <p className="text-zinc-500 font-medium font-korean text-sm md:text-base break-keep opacity-80">{t('drop_subtitle')}</p>
            </div>
            
            <ClarityGuide />

            <div className="mt-8 flex flex-col items-center gap-3">
                <div className={`w-14 h-14 md:w-16 md:h-16 rounded-full ${isNight ? 'bg-indigo-600' : 'bg-orange-500'} flex items-center justify-center shadow-2xl transition-all duration-300 group-hover:scale-110 group-hover:shadow-orange-500/40 border-2 border-white/20 active:scale-95`}>
                    <svg className="w-6 h-6 md:w-8 md:h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                </div>
                <span className="text-[10px] md:text-xs font-black text-zinc-500 uppercase tracking-[0.2em] group-hover:text-white transition-colors">{t('btn_upload')}</span>
            </div>
          </div>
          <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileChange} disabled={isProcessing} />
      </div>
    </div>
  );

  const VideoWalkthroughModal = () => (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={() => setShowVideoModal(false)}></div>
      <div className="relative w-full max-w-4xl aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl border border-white/10 animate-fade-in-up">
         <video src={ASSETS.VIDEO_WALKTHROUGH} controls autoPlay className="w-full h-full" />
         <button onClick={() => setShowVideoModal(false)} className="absolute top-6 right-6 bg-black/50 hover:bg-black text-white p-2 rounded-full transition-colors z-10">✕</button>
      </div>
    </div>
  );

  const BetaBanner = () => (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10 animate-fade-in-up w-full">
        {/* Feedback Card */}
        <button 
          onClick={() => setShowFeedbackModal(true)}
          className="group bg-white/5 hover:bg-white/10 border border-white/10 p-5 rounded-[2rem] flex items-center gap-4 transition-all shadow-xl backdrop-blur-md ring-1 ring-white/5 hover:ring-orange-500/30 text-left h-full"
        >
           <div className={`w-10 h-10 rounded-xl flex-shrink-0 ${isNight ? 'bg-indigo-500/20' : 'bg-orange-500/20'} flex items-center justify-center text-xl`}>✨</div>
           <div className="min-w-0">
              <p className={`text-[9px] font-black uppercase tracking-[0.15em] ${isNight ? 'text-indigo-400' : 'text-orange-500'} mb-0.5`}>Feedback</p>
              <p className="text-sm font-bold text-zinc-200 font-korean group-hover:text-white transition-colors leading-tight">
                {language === 'ko' ? "의견 보내기" : "Share Ideas"}
              </p>
           </div>
        </button>

        {/* Walkthrough Card */}
        <button 
          onClick={() => setShowVideoModal(true)}
          className="group bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/20 p-5 rounded-[2rem] flex items-center gap-4 transition-all shadow-xl backdrop-blur-md ring-1 ring-indigo-500/20 hover:ring-indigo-500/30 text-left h-full"
        >
          <div className="w-10 h-10 rounded-xl flex-shrink-0 bg-indigo-500 flex items-center justify-center text-lg">▶️</div>
          <div className="min-w-0">
              <p className="text-[9px] font-black uppercase tracking-[0.15em] text-indigo-400 mb-0.5">Quick Guide</p>
              <p className="text-sm font-bold text-white font-korean leading-tight">{t('btn_walkthrough')}</p>
          </div>
        </button>

        {/* Marketing Card */}
        <button 
          onClick={() => setShowFlyerModal(true)}
          className="group bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 p-5 rounded-[2rem] flex items-center gap-4 transition-all shadow-xl backdrop-blur-md ring-1 ring-orange-500/20 hover:ring-orange-500/30 text-left h-full"
        >
          <div className="w-10 h-10 rounded-xl flex-shrink-0 bg-orange-500 flex items-center justify-center text-lg">📢</div>
          <div className="min-w-0">
              <p className={`text-[9px] font-black uppercase tracking-[0.15em] text-orange-400 mb-0.5`}>Resource</p>
              <p className="text-sm font-bold text-white font-korean leading-tight">{t('res_title')}</p>
          </div>
        </button>
    </div>
  );

  if (isAuthenticated && user) {
    const remaining = user.plan === 'pro' ? '∞' : Math.max(0, user.maxScansPerDay - user.scansUsedToday);
    return (
      <div className="min-h-full pt-12 md:pt-28 pb-12 px-4 md:px-6 max-w-7xl mx-auto flex flex-col items-center animate-fade-in relative">
        {showFeedbackModal && <FeedbackModal onClose={() => setShowFeedbackModal(false)} />}
        {showVideoModal && <VideoWalkthroughModal />}
        {showFlyerModal && <FlyerModal onClose={() => setShowFlyerModal(false)} />}
        
        <div className="w-full max-w-3xl flex flex-col items-center text-center mb-8 md:mb-10 gap-4 md:gap-6">
           <div className="space-y-1 md:space-y-2">
              {user.schoolName && (
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-2">
                      <span className="text-xs">🏫</span>
                      <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{user.schoolName}</span>
                  </div>
              )}
              <h1 className="text-3xl md:text-6xl font-black text-white font-display break-keep leading-[1.15]">
                {t('dash_welcome')} <span className={`text-transparent bg-clip-text bg-gradient-to-r ${isNight ? 'from-indigo-400 to-purple-500' : 'from-orange-400 to-pink-500'}`}>{user.name}!</span>
              </h1>
              <p className="text-zinc-400 font-korean text-base md:text-xl max-w-lg mx-auto leading-relaxed break-keep">{t('dash_subtitle')}</p>
           </div>
           
           <div className="bg-[#0F1014] border border-white/10 rounded-full py-2 px-6 flex items-center gap-3 shadow-lg">
                <div className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">{language === 'ko' ? "오늘 남은 마법" : "Magic Left Today"}</div>
                <div className="w-px h-4 bg-white/10"></div>
                <div className="font-bold text-white text-xl font-display leading-none">{remaining}</div>
           </div>
        </div>
        
        <div className="w-full max-w-4xl mx-auto">
           <BetaBanner />
           <DropZone size="large" />
        </div>
        <p className="mt-8 text-zinc-600 text-[10px] md:text-xs font-bold uppercase tracking-widest text-center">{t('supported_formats')}</p>
      </div>
    );
  }

  return (
    <div className="min-h-full flex flex-col pt-12 md:pt-24 pb-12 overflow-x-hidden scroll-smooth">
      {showFeedbackModal && <FeedbackModal onClose={() => setShowFeedbackModal(false)} />}
      {showLegal && <LegalModal type={showLegal} onClose={() => setShowLegal(null)} />}
      {showVideoModal && <VideoWalkthroughModal />}
      {showFlyerModal && <FlyerModal onClose={() => setShowFlyerModal(false)} />}
      
      {/* Hero Section */}
      <div className="relative max-w-7xl mx-auto px-6 grid lg:grid-cols-[1.1fr_0.9fr] gap-10 lg:gap-8 items-center mb-16">
        <div className={`absolute top-0 left-1/4 -translate-x-1/2 w-[800px] h-[500px] ${isNight ? 'bg-indigo-900/20' : 'bg-brand-purple/20'} rounded-full blur-[120px] -z-10 pointer-events-none opacity-50 mix-blend-screen`}></div>
        <div className="w-full flex flex-col items-start text-left z-10 animate-fade-in-up order-2 lg:order-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 md:px-4 md:py-1.5 rounded-full border border-white/10 bg-white/5 mb-6 backdrop-blur-sm shadow-xl self-start ring-1 ring-white/10">
            <span className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full ${isNight ? 'bg-indigo-500' : 'bg-brand-orange'} animate-pulse shadow-[0_0_8px_rgba(249,115,22,0.6)]`}></span>
            <span className="text-[9px] md:text-xs font-black text-zinc-200 tracking-widest uppercase">{t('hero_badge')}</span>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white font-display mb-6 md:mb-8 tracking-tighter text-left drop-shadow-2xl whitespace-pre-line leading-[1.1] break-keep">
            {isNight ? (
              <span className={`text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-600`}>{t('hero_title_night')}</span>
            ) : (
              language === 'ko' ? (
                  <>숙제 전쟁은 이제 끝, <br/> <span className={`text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-pink-500`}>아이와 웃으며 공부하세요</span></>
              ) : (
                  <>Homework Stress? <br/> <span className={`text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-pink-500`}>Just Snap a Photo.</span></>
              )
            )}
          </h1>
          <p className="text-lg md:text-xl text-zinc-400 max-w-lg leading-relaxed mb-10 font-korean text-left font-medium break-keep">
            {isNight ? t('hero_desc_night') : t('hero_desc')}
          </p>
          
          <div className="flex flex-wrap gap-4 justify-start items-center">
            <button onClick={openLoginModal} className="group bg-white text-black px-10 py-5 rounded-2xl font-black text-lg md:text-xl transition-all transform active:scale-95 shadow-[0_20px_40px_rgba(255,255,255,0.1)] font-display flex items-center gap-3 overflow-hidden ring-2 ring-white/10 hover:ring-white/40">
              <span className="font-korean whitespace-nowrap">{t('hero_cta_btn')}</span> 
              <span className="text-2xl transition-transform group-hover:translate-x-1">→</span>
            </button>

            <button 
              onClick={() => {
                const dropZone = document.getElementById('magic-drop-zone');
                dropZone?.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }} 
              className="group px-8 py-5 rounded-2xl border-2 border-white/10 bg-white/5 hover:bg-white/10 text-white font-black text-sm md:text-lg transition-all flex items-center gap-3 backdrop-blur-md"
            >
              <span className="text-orange-500 group-hover:animate-spin">✨</span> {t('hero_guest_cta')}
            </button>
          </div>
        </div>
        
        {/* Mascot */}
        <div className="w-full flex justify-center lg:justify-end items-center animate-fade-in-up order-1 lg:order-2">
            <div className="relative w-full max-w-[260px] md:max-w-[400px] aspect-square flex items-center justify-center">
                <div className={`absolute inset-0 bg-gradient-to-tr ${isNight ? 'from-indigo-500/20 to-purple-500/20' : 'from-brand-orange/20 to-brand-purple/20'} rounded-full blur-[80px] animate-pulse`}></div>
                <div className="w-full h-full relative z-10 transition-transform scale-100 md:scale-105">
                   <img src={isNight ? ASSETS.HERO_SLEEPY : ASSETS.HERO_IMAGE} alt="Chekki Hero" className="w-full h-full object-contain drop-shadow-2xl animate-float filter brightness-110" />
                </div>
            </div>
        </div>
      </div>

      {/* Main Action Zone */}
      <div id="magic-drop-zone" className="max-w-4xl mx-auto px-6 mb-24 w-full relative pt-12">
         <DropZone size="large" />
         <p className="mt-8 text-zinc-600 text-[10px] md:text-xs font-bold uppercase tracking-widest text-center">{t('supported_formats')}</p>
      </div>

      {/* Why Chekki Section */}
      <div className="max-w-7xl mx-auto px-6 mb-24">
          <h2 className="text-3xl md:text-5xl font-black text-white text-center mb-12 font-display break-keep">{t('diff_title')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-zinc-900/50 border border-white/10 p-10 rounded-[3rem] backdrop-blur-md">
                  <div className="text-4xl mb-6">✍️</div>
                  <h3 className="text-2xl font-bold text-white mb-3 font-korean">{t('diff_ocr')}</h3>
                  <p className="text-zinc-400 leading-relaxed font-korean break-keep">{t('diff_ocr_desc')}</p>
              </div>
              <div className="bg-zinc-900/50 border border-white/10 p-10 rounded-[3rem] backdrop-blur-md">
                  <div className="text-4xl mb-6">💌</div>
                  <h3 className="text-2xl font-bold text-white mb-3 font-korean">{t('diff_script')}</h3>
                  <p className="text-zinc-400 leading-relaxed font-korean break-keep">{t('diff_script_desc')}</p>
              </div>
          </div>
      </div>

      {/* Trust & Privacy Section */}
      <div className="bg-white/5 border-y border-white/5 py-24 mb-24 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 text-center">
            <h2 className="text-3xl md:text-5xl font-black text-white mb-6 font-display break-keep">{t('trust_title')}</h2>
            <div className="grid md:grid-cols-2 gap-16 mt-16">
                <div className="space-y-6">
                    <div className="text-emerald-500 text-5xl">🔒</div>
                    <h3 className="text-2xl font-bold text-white font-korean">{t('trust_privacy')}</h3>
                    <p className="text-zinc-400 max-w-sm mx-auto font-korean break-keep leading-relaxed">{t('trust_privacy_desc')}</p>
                </div>
                <div className="space-y-6">
                    <div className="text-orange-500 text-5xl">👨‍👩‍👧</div>
                    <h3 className="text-2xl font-bold text-white font-korean">{t('trust_safety')}</h3>
                    <p className="text-zinc-400 max-w-sm mx-auto font-korean break-keep leading-relaxed">{t('trust_safety_desc')}</p>
                </div>
            </div>
        </div>
      </div>

      {/* Process Section */}
      <div className="max-w-7xl mx-auto px-6 mb-24">
          <h2 className="text-2xl md:text-4xl font-black text-white text-center mb-20 font-display uppercase tracking-[0.3em] break-keep">{t('how_title')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-20">
              {[
                  { title: t('how_step1'), desc: t('how_step1_desc'), icon: '📸' },
                  { title: t('how_step2'), desc: t('how_step2_desc'), icon: '✨' },
                  { title: t('how_step3'), desc: t('how_step3_desc'), icon: '🗣️' }
              ].map((item, i) => (
                  <div key={i} className="flex flex-col items-center text-center group">
                      <div className="w-24 h-24 md:w-28 md:h-28 rounded-[2.5rem] bg-white/5 border border-white/10 flex items-center justify-center text-4xl md:text-5xl mb-8 shadow-2xl backdrop-blur-md group-hover:scale-110 transition-transform">
                        {item.icon}
                      </div>
                      <h3 className="text-2xl md:text-3xl font-black text-white mb-4 font-korean">{item.title}</h3>
                      <p className="text-zinc-500 font-korean text-base md:text-lg leading-relaxed break-keep max-w-[260px]">
                        {item.desc}
                      </p>
                  </div>
              ))}
          </div>
      </div>

      {/* Final CTA Section */}
      <div className="max-w-7xl mx-auto px-6 pb-20">
          <div className="relative w-full rounded-[3rem] overflow-hidden bg-gradient-to-r from-brand-orange via-brand-pink to-brand-purple shadow-[0_40px_100px_rgba(249,115,22,0.3)] p-12 md:p-20">
              <div className="absolute top-0 right-0 w-1/2 h-full bg-white/5 blur-[80px] pointer-events-none"></div>
              <div className="relative z-10 w-full flex flex-col lg:flex-row items-center gap-12">
                  <div className="w-full lg:max-w-xl text-left">
                      <h2 className="text-5xl md:text-7xl font-black text-white mb-6 font-display tracking-tight leading-[1] drop-shadow-2xl break-keep">
                          {t('hero_cta_title')}
                      </h2>
                      <p className="text-white font-korean text-xl md:text-2xl mb-10 leading-relaxed break-keep font-bold opacity-90 drop-shadow-lg max-w-sm">
                          {t('hero_cta_desc')}
                      </p>
                      <button 
                        onClick={openLoginModal} 
                        className="group bg-white text-orange-600 px-12 py-6 rounded-[2rem] font-black text-xl md:text-2xl transition-all transform active:scale-95 shadow-2xl font-display flex items-center justify-center gap-4 hover:shadow-white/40 whitespace-nowrap w-fit"
                      >
                          <span className="font-korean">{t('hero_cta_btn')}</span>
                          <span className="text-3xl transition-transform group-hover:translate-x-2">→</span>
                      </button>
                  </div>
                  <div className="hidden lg:flex flex-1 justify-end items-center pointer-events-none">
                       <img src={ASSETS.LOGO} alt="Chekki Logo" className="w-full max-w-md animate-float drop-shadow-[0_20px_50px_rgba(255,255,255,0.3)] scale-[1.8]" />
                  </div>
              </div>
          </div>
          
          <div className="mt-20 pt-10 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-10">
              <div className="flex flex-col items-center md:items-start text-center md:text-left">
                  <h4 className="text-xl font-black text-white font-display mb-2">
                    Chekki<span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-pink-500">AI</span>
                  </h4>
                  <p className="text-zinc-500 text-xs font-bold font-korean tracking-[0.1em] uppercase break-keep max-w-xs">
                    {t('footer_text')}
                  </p>
              </div>
              <div className="flex flex-wrap justify-center gap-10 text-xs text-zinc-400 font-black uppercase tracking-[0.3em]">
                  <button onClick={() => setShowLegal('privacy')} className="hover:text-white transition-colors">PRIVACY</button>
                  <button onClick={() => setShowLegal('terms')} className="hover:text-white transition-colors">TERMS</button>
                  <a href="mailto:chekkihelp@gmail.com" className="hover:text-white transition-colors">SUPPORT</a>
              </div>
          </div>
      </div>
    </div>
  );
};
