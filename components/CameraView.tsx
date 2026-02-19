import React, { useRef, useState, useEffect } from 'react';
import { compressImage } from '../utils/imageUtils';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { ChekkiMascot } from './Icons';
import { ASSETS } from '../constants';
import { FeedbackModal } from './FeedbackModal';
import { LegalModal } from './LegalModal';
import { LegalType } from '../types';
import { FlyerModal } from './FlyerModal';

const VideoWalkthroughModal = ({ onClose }: { onClose: () => void }) => (
  <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={onClose}></div>
    <div className="relative bg-zinc-900 border border-white/10 rounded-[2.5rem] p-4 max-w-4xl w-full shadow-2xl overflow-hidden animate-fade-in-up">
        <video autoPlay controls className="w-full rounded-2xl">
            <source src={ASSETS.VIDEO_WALKTHROUGH} type="video/mp4" />
        </video>
        <button onClick={onClose} className="absolute top-4 right-4 text-white bg-black/50 w-10 h-10 rounded-full flex items-center justify-center border border-white/10 z-30">✕</button>
    </div>
  </div>
);

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
  const [showLegal, setShowLegal] = useState<LegalType | null>(null);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showFlyerModal, setShowFlyerModal] = useState(false);
  
  const { t, language } = useLanguage();

  const [guestUsed, setGuestUsed] = useState(false);
  useEffect(() => {
    const used = localStorage.getItem('chekki_guest_scan_used') === 'true';
    setGuestUsed(used);
  }, [isAuthenticated]);

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

  const DropZone = ({ size = "large" }: { size?: "large" | "compact" }) => {
    const isGuestLocked = !isAuthenticated && guestUsed;
    
    const handleAction = () => {
        if (isGuestLocked) openLoginModal();
        else fileInputRef.current?.click();
    };

    return (
        <div className={`relative w-full ${size === 'large' ? 'min-h-[340px] md:min-h-[500px]' : 'h-full'} flex items-center justify-center py-2 md:py-6`}>
          <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[98%] h-[98%] border border-white/5 rounded-[2.5rem] md:rounded-[4rem] animate-[pulse_5s_ease-in-out_infinite] pointer-events-none`}></div>
          <div 
            role="button"
            id="magic-drop-zone-inner"
            className={`relative w-full h-full max-w-4xl mx-auto ${isNight ? 'bg-indigo-950/20' : 'bg-zinc-900/40'} backdrop-blur-3xl rounded-[2.5rem] md:rounded-[4rem] border transition-all duration-700 flex flex-col items-center justify-center p-4 md:p-12 group cursor-pointer
              ${dragActive && !isGuestLocked ? 'border-orange-500 shadow-[0_0_80px_rgba(249,115,22,0.2)] scale-[1.01]' : 'border-white/10 shadow-[0_40px_100px_rgba(0,0,0,0.5)] hover:border-white/20'}`}
            onDragEnter={isGuestLocked ? undefined : handleDrag} 
            onDragLeave={isGuestLocked ? undefined : handleDrag} 
            onDragOver={isGuestLocked ? undefined : handleDrag} 
            onDrop={isGuestLocked ? undefined : handleDrop}
            onClick={handleAction}
          >
              {!isAuthenticated && !guestUsed && (
                <div className="absolute top-4 md:top-8 z-40 animate-[bounce_4s_ease-in-out_infinite] pointer-events-none">
                    <div className="bg-orange-500 text-white text-[9px] md:text-xs font-black px-4 py-2 rounded-full uppercase tracking-widest shadow-[0_15px_40px_rgba(249,115,22,0.4)] flex items-center gap-2 border border-white/20 whitespace-nowrap">
                        <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping"></span>
                        {t('guest_scan_badge')}
                    </div>
                </div>
              )}

              <div className="relative z-10 flex flex-col items-center text-center w-full pt-2">
                <div className={`${size === 'large' ? 'w-28 h-28 md:w-56 md:h-56' : 'w-28 h-28'} mb-4 md:mb-6 relative transition-all duration-700 ${isGuestLocked ? 'blur-md opacity-40 grayscale scale-90' : 'group-hover:scale-105'}`}>
                    {isProcessing ? (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className={`w-10 h-10 md:w-16 md:h-16 border-[3px] ${isNight ? 'border-indigo-500' : 'border-orange-500'} border-t-transparent rounded-full animate-spin shadow-2xl`}></div>
                      </div>
                    ) : (
                      <div className="w-full h-full animate-float flex items-center justify-center">
                        {!imgError ? (
                           <img 
                            src={isNight ? ASSETS.HERO_SLEEPY : ASSETS.LOGO} 
                            alt="Chekki Mascot" 
                            className={`w-full h-full object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)] filter brightness-110 transition-opacity duration-700 ${mascotLoaded ? 'opacity-100' : 'opacity-0'}`} 
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
                
                {isGuestLocked ? (
                    <div className="animate-fade-in space-y-3 px-4">
                        <div className="space-y-1">
                             <h3 className="text-xl md:text-4xl font-black text-white font-display tracking-tight break-keep leading-tight">
                                {t('guest_used_title')}
                             </h3>
                             <p className="text-zinc-400 font-bold font-korean text-xs md:text-xl max-w-lg mx-auto leading-relaxed opacity-80">
                                {t('guest_used_desc')}
                             </p>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); openLoginModal(); }} className={`bg-white text-black px-8 py-3 md:px-14 md:py-5 rounded-xl md:rounded-2xl font-black text-xs md:text-xl transition-all active:scale-95 uppercase tracking-wider w-full md:w-auto shadow-[0_20px_60px_rgba(255,255,255,0.1)]`}>
                           {t('login')}
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="space-y-1 max-w-2xl px-4">
                            <h3 className="text-xl md:text-4xl font-black text-white font-display tracking-tight break-keep leading-tight">
                            {isProcessing ? (language === 'ko' ? "마법 부리는 중..." : "Casting Magic...") : t('drop_title')}
                            </h3>
                            <p className="text-zinc-500 font-bold font-korean text-xs md:text-xl break-keep opacity-80 leading-relaxed">{t('drop_subtitle')}</p>
                        </div>
                        
                        <div className="flex flex-wrap justify-center gap-2 mt-4 md:mt-8 mb-4 px-2">
                          {[
                            { icon: '☀️', text: language === 'ko' ? '밝은 조명' : 'Bright Light' },
                            { icon: '📏', text: language === 'ko' ? '평평하게' : 'Flat Surface' },
                            { icon: '🔍', text: language === 'ko' ? '선명하게' : 'Sharp Focus' }
                          ].map((tip, i) => (
                            <div key={i} className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 md:px-5 md:py-2 rounded-xl backdrop-blur-md hover:bg-white/10 transition-colors">
                              <span className="text-sm">{tip.icon}</span>
                              <span className="text-[9px] md:text-xs font-black text-zinc-300 whitespace-nowrap uppercase tracking-[0.1em]">{tip.text}</span>
                            </div>
                          ))}
                        </div>

                        <div className="mt-4 md:mt-8 flex flex-col items-center gap-2 group/btn">
                            <div className={`w-14 h-14 md:w-20 md:h-20 rounded-full ${isNight ? 'bg-indigo-600' : 'bg-orange-500'} flex items-center justify-center shadow-[0_15px_50px_rgba(249,115,22,0.4)] transition-all duration-300 group-hover:scale-110 group-hover:shadow-orange-500/60 border-2 border-white/20 active:scale-90`}>
                                <svg className="w-7 h-7 md:w-10 md:h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </div>
                            <span className="text-[9px] md:text-sm font-black text-zinc-500 uppercase tracking-[0.2em] group-hover:text-white transition-colors">{t('btn_upload')}</span>
                        </div>
                    </>
                )}
              </div>
              <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileChange} disabled={isProcessing || isGuestLocked} />
          </div>
        </div>
    );
  };

  const FeatureShowcase = () => (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-12 md:py-24 border-t border-white/5 mt-12">
        <div className="text-center mb-12 md:mb-20">
            <h2 className="text-3xl md:text-6xl font-black text-white font-display mb-4 tracking-tight">{t('feat_title')}</h2>
            <div className="w-20 h-1.5 bg-gradient-to-r from-orange-500 to-pink-500 mx-auto rounded-full"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
            {[
                { title: t('feat_1_title'), desc: t('feat_1_desc'), icon: "✍️", bg: "bg-orange-500/10", border: "border-orange-500/20" },
                { title: t('feat_2_title'), desc: t('feat_2_desc'), icon: "💌", bg: "bg-pink-500/10", border: "border-pink-500/20" },
                { title: t('feat_3_title'), desc: t('feat_3_desc'), icon: "🔊", bg: "bg-indigo-500/10", border: "border-indigo-500/20" },
                { title: t('feat_4_title'), desc: t('feat_4_desc'), icon: "🪄", bg: "bg-purple-500/10", border: "border-purple-500/20" }
            ].map((f, i) => (
                <div key={i} className={`p-8 md:p-12 rounded-[2.5rem] ${f.bg} border ${f.border} backdrop-blur-3xl flex flex-col items-center md:items-start text-center md:text-left transition-all hover:scale-[1.02] group`}>
                    <span className="text-5xl md:text-7xl mb-6 block drop-shadow-2xl animate-float" style={{ animationDelay: `${i * 0.5}s` }}>{f.icon}</span>
                    <h3 className="text-xl md:text-3xl font-black text-white font-display mb-4 tracking-tight group-hover:text-orange-400 transition-colors">{f.title}</h3>
                    <p className="text-zinc-400 font-bold font-korean text-sm md:text-xl leading-relaxed opacity-80 break-keep">{f.desc}</p>
                </div>
            ))}
        </div>
    </div>
  );

  const ScreenshotCarousel = () => {
    const images = [
        "https://res.cloudinary.com/dginphpy4/image/upload/f_auto,q_auto/v1769504113/preview1.jpg",
        "https://res.cloudinary.com/dginphpy4/image/upload/f_auto,q_auto/v1769504113/preview2.jpg",
        "https://res.cloudinary.com/dginphpy4/image/upload/f_auto,q_auto/v1769504113/preview3.jpg",
        "https://res.cloudinary.com/dginphpy4/image/upload/f_auto,q_auto/v1769504113/preview4.jpg"
    ];

    return (
        <div className="w-full overflow-hidden py-12 md:py-24">
            <div className="max-w-7xl mx-auto px-4 md:px-6 mb-12">
                <h2 className="text-2xl md:text-5xl font-black text-white font-display text-center">{language === 'ko' ? "채키의 실제 모습" : "Chekki in Action"}</h2>
            </div>
            <div className="flex gap-4 md:gap-8 overflow-x-auto px-4 md:px-12 pb-8 custom-scrollbar scroll-smooth">
                {images.map((src, i) => (
                    <div key={i} className="min-w-[280px] md:min-w-[400px] aspect-[9/19] bg-zinc-900 rounded-[2rem] border border-white/10 overflow-hidden shadow-2xl transition-transform hover:scale-[1.02] duration-500 shrink-0">
                        <img src={src} alt={`Preview ${i+1}`} className="w-full h-full object-cover" loading="lazy" />
                    </div>
                ))}
            </div>
        </div>
    );
  };

  const BusinessInfo = () => (
    <footer className="bg-[#030305] border-t border-white/5 py-12 md:py-20 px-6 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between gap-12">
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <img src={ASSETS.LOGO} alt="Chekki Logo" className="w-8 h-8 opacity-60" />
                    <h2 className="text-xl font-black text-zinc-400 font-display">Chekki<span className="text-zinc-600">AI</span></h2>
                </div>
                <div className="text-zinc-600 text-[10px] md:text-xs space-y-1.5 leading-relaxed font-medium uppercase tracking-widest">
                    <p>{t('biz_name')}</p>
                    <p>{t('biz_ceo')}</p>
                    <p>{t('biz_addr')}</p>
                    <p>{t('biz_reg')}</p>
                    <p>{t('biz_mail')}</p>
                    <p>{t('biz_contact')}</p>
                </div>
            </div>
            <div className="flex flex-col md:items-end gap-6">
                <div className="flex gap-4">
                    <button onClick={() => setShowLegal('terms')} className="text-zinc-500 hover:text-white text-[10px] uppercase font-black tracking-widest transition-colors underline underline-offset-4">Terms</button>
                    <button onClick={() => setShowLegal('privacy')} className="text-zinc-500 hover:text-white text-[10px] uppercase font-black tracking-widest transition-colors underline underline-offset-4">Privacy</button>
                    <button onClick={() => setShowLegal('refund')} className="text-zinc-500 hover:text-white text-[10px] uppercase font-black tracking-widest transition-colors underline underline-offset-4">Refund</button>
                </div>
                <p className="text-zinc-700 text-[10px] font-bold uppercase tracking-[0.2em] md:text-right">
                    © 2025 Chekki AI Labs. All Rights Reserved.
                </p>
            </div>
        </div>
    </footer>
  );

  const BetaBanner = () => (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 md:gap-4 mb-4 md:mb-8 animate-fade-in-up w-full px-2">
        <button 
          onClick={() => setShowFeedbackModal(true)}
          className="group bg-white/5 hover:bg-white/10 border border-white/10 p-4 md:p-6 rounded-[1.5rem] flex items-center gap-3 md:gap-4 transition-all"
        >
           <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl flex-shrink-0 ${isNight ? 'bg-indigo-500/20' : 'bg-orange-500/20'} flex items-center justify-center text-xl md:text-2xl`}>✨</div>
           <div className="text-left min-w-0">
              <p className={`text-[8px] md:text-[9px] font-black uppercase tracking-[0.1em] ${isNight ? 'text-indigo-400' : 'text-orange-500'} mb-0.5`}>{language === 'ko' ? '의견 남기기' : 'Feedback'}</p>
              <p className="text-xs md:text-lg font-black text-zinc-100 font-korean truncate tracking-tight">{language === 'ko' ? '아이디어 제안' : 'Share Ideas'}</p>
           </div>
        </button>
        <button 
          onClick={() => setShowVideoModal(true)}
          className="group bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/20 p-4 md:p-6 rounded-[1.5rem] flex items-center gap-3 md:gap-4 transition-all"
        >
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl flex-shrink-0 bg-indigo-500 flex items-center justify-center text-lg md:text-xl shadow-xl">▶️</div>
          <div className="text-left min-w-0">
              <p className="text-[8px] md:text-[9px] font-black uppercase tracking-[0.1em] text-indigo-400 mb-0.5">{language === 'ko' ? '빠른 가이드' : 'Quick Guide'}</p>
              <p className="text-xs md:text-lg font-black text-white font-korean truncate tracking-tight">{language === 'ko' ? '사용법 보기' : 'Walkthrough'}</p>
          </div>
        </button>
        <button 
          onClick={() => setShowFlyerModal(true)}
          className="group bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 p-4 md:p-6 rounded-[1.5rem] flex items-center gap-3 md:gap-4 transition-all"
        >
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl flex-shrink-0 bg-orange-500 flex items-center justify-center text-lg md:text-xl shadow-xl">📢</div>
          <div className="text-left min-w-0">
              <p className={`text-[8px] md:text-[9px] font-black uppercase tracking-[0.1em] text-orange-400 mb-0.5`}>{language === 'ko' ? '홍보 자료' : 'Resources'}</p>
              <p className="text-xs md:text-lg font-black text-white font-korean truncate tracking-tight">{language === 'ko' ? '채키 알리기' : 'Spread Chekki'}</p>
          </div>
        </button>
    </div>
  );

  if (isAuthenticated && user) {
    const isPro = user.plan === 'pro';

    return (
      <div className="min-h-full pt-4 md:pt-16 pb-12 px-4 md:px-10 max-w-7xl mx-auto flex flex-col items-center animate-fade-in relative">
        {showFeedbackModal && <FeedbackModal onClose={() => setShowFeedbackModal(false)} />}
        {showVideoModal && <VideoWalkthroughModal onClose={() => setShowVideoModal(false)} />}
        {showFlyerModal && <FlyerModal onClose={() => setShowFlyerModal(false)} />}
        
        <div className="w-full max-w-5xl flex flex-col items-center text-center mb-4 md:mb-10 gap-3 md:gap-8">
           <div className="space-y-2 md:space-y-4">
              {user.schoolName && (
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-1 shadow-xl backdrop-blur-sm">
                      <span className="text-xs">🏫</span>
                      <span className="text-[9px] md:text-xs font-black text-indigo-400 uppercase tracking-[0.1em]">{user.schoolName}</span>
                  </div>
              )}
              <h1 className="text-2xl md:text-7xl font-black text-white font-display break-keep leading-tight">
                {language === 'ko' ? '반가워요,' : 'Welcome,'} <span className={`text-transparent bg-clip-text bg-gradient-to-r ${isNight ? 'from-indigo-400 to-purple-500' : 'from-orange-400 to-pink-500'}`}>{user.name}!</span>
              </h1>
              <p className="text-zinc-400 font-bold font-korean text-sm md:text-2xl max-w-3xl mx-auto leading-relaxed break-keep opacity-80">{language === 'ko' ? '오늘도 아이와 즐거운 숙제 시간 보내세요.' : 'Have a wonderful homework session tonight.'}</p>
           </div>
           
           <div className={`border rounded-[1.2rem] md:rounded-[2rem] py-2 px-4 md:py-3 md:px-10 flex items-center gap-3 md:gap-4 shadow-2xl transition-all duration-500 ${isPro ? 'bg-orange-500/10 border-orange-500/30' : 'bg-[#0F1014] border-white/10'}`}>
                <div className={`text-[9px] md:text-sm uppercase font-black tracking-[0.1em] ${isPro ? 'text-orange-400' : 'text-zinc-500'}`}>
                    {isPro ? t('lbl_pro_active') : t('lbl_member_active')}
                </div>
                <div className="w-px h-4 md:h-8 bg-white/10"></div>
                <div className={`font-black text-xl md:text-4xl font-display leading-none ${isPro ? 'text-orange-500' : 'text-white'}`}>∞</div>
           </div>
        </div>
        
        <div className="w-full max-w-6xl mx-auto flex flex-col gap-6 md:gap-12">
           <BetaBanner />
           <div id="magic-drop-zone-auth" className="w-full relative">
              <DropZone size="large" />
           </div>
           <p className="text-zinc-600 text-[9px] md:text-xs font-black uppercase tracking-[0.2em] text-center opacity-60">{language === 'ko' ? '지원 형식: JPG, PNG, PDF' : 'Supported formats: JPG, PNG, PDF'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full flex flex-col pt-2 md:pt-16 overflow-x-hidden scroll-smooth">
      {showFeedbackModal && <FeedbackModal onClose={() => setShowFeedbackModal(false)} />}
      {showLegal && <LegalModal type={showLegal} onClose={() => setShowLegal(null)} />}
      {showVideoModal && <VideoWalkthroughModal onClose={() => setShowVideoModal(false)} />}
      {showFlyerModal && <FlyerModal onClose={() => setShowFlyerModal(false)} />}
      
      <div className="relative max-w-7xl mx-auto px-4 md:px-6 grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-4 md:gap-12 items-center mb-6 md:mb-12">
        <div className={`absolute top-0 left-1/4 -translate-x-1/2 w-full md:w-[1000px] h-[700px] ${isNight ? 'bg-indigo-900/20' : 'bg-brand-purple/10'} rounded-full blur-[60px] md:blur-[180px] -z-10 pointer-events-none opacity-20 mix-blend-screen`}></div>
        
        <div className="w-full flex justify-center lg:justify-end items-center animate-fade-in-up order-1 lg:order-2 px-2 md:px-0">
            <div className="relative w-full max-w-[280px] sm:max-w-[450px] md:max-w-[700px] aspect-square flex items-center justify-center">
                <div className={`absolute inset-0 bg-gradient-to-tr ${isNight ? 'from-indigo-500/20 to-purple-500/20' : 'from-brand-orange/20 to-brand-purple/20'} rounded-full blur-[40px] md:blur-[140px] animate-pulse`}></div>
                <div className="w-full h-full relative z-10 transition-transform scale-110 md:scale-125">
                   <img src={isNight ? ASSETS.HERO_SLEEPY : ASSETS.HERO_IMAGE} alt="Chekki Hero" className="w-full h-full object-contain drop-shadow-[0_20px_60px_rgba(0,0,0,0.6)] animate-float filter brightness-110" />
                </div>
            </div>
        </div>

        <div className="w-full flex flex-col items-center lg:items-start text-center lg:text-left z-10 animate-fade-in-up order-2 lg:order-1 mt-2 lg:mt-0 px-2 md:px-0">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 mb-3 md:mb-6 backdrop-blur-md shadow-2xl self-center lg:self-start">
            <span className={`w-1.5 h-1.5 rounded-full ${isNight ? 'bg-indigo-500 shadow-[0_0_10px_#6366f1]' : 'bg-orange-500 shadow-[0_0_10px_#f97316]'} animate-pulse`}></span>
            <span className="text-[9px] md:text-xs font-black text-zinc-200 tracking-[0.1em] uppercase">{language === 'ko' ? '베타 버전 출시' : 'Beta Release'}</span>
          </div>
          <h1 className="text-3xl sm:text-5xl md:text-7xl lg:text-9xl font-black text-white font-display mb-4 md:mb-8 tracking-tight drop-shadow-2xl whitespace-pre-line leading-[1.1] break-keep">
            {isNight ? (
              <span className={`text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-600`}>{language === 'ko' ? '아이와 함께하는\n꿈같은 숙제 시간' : 'Sweet Dreams,\nStress-Free Homework'}</span>
            ) : (
              language === 'ko' ? (
                  <>숙제 때문에 힘드신가요?<br/> <span className={`text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-pink-500`}>사진 한 장만 찍으세요.</span></>
              ) : (
                  <>Homework Stress?<br/> <span className={`text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-pink-500`}>Just Snap a Photo.</span></>
              )
            )}
          </h1>
          <p className="text-sm md:text-2xl text-zinc-400 max-w-2xl leading-relaxed mb-6 md:mb-10 font-korean font-medium break-keep opacity-95 mx-auto lg:mx-0">
            {isNight ? (language === 'ko' ? '밤늦은 시간까지 고민하지 마세요. 채키가 도와드릴게요.' : 'Don\'t stay up late alone. Chekki is here to help.') : (language === 'ko' ? '영유 숙제 채점부터 티칭 가이드까지, 채키가 다정하게 알려드려요.' : 'From grading to teaching scripts, Chekki guides you with love.')}
          </p>
          
          <div className="flex flex-col gap-4 md:gap-6 items-center lg:items-start w-full max-w-md md:max-w-2xl mx-auto lg:mx-0">
            <button onClick={openLoginModal} className="group bg-white text-black py-4 md:py-6 px-6 md:px-16 rounded-xl md:rounded-2xl font-black text-base md:text-3xl transition-all transform active:scale-95 shadow-[0_20px_50px_rgba(255,255,255,0.1)] font-display flex items-center justify-center gap-3 overflow-hidden w-full md:w-auto whitespace-nowrap min-w-fit">
              <span className="font-korean">{t('login')}</span> 
              <span className="text-xl md:text-4xl transition-transform group-hover:translate-x-2">→</span>
            </button>
            
            <div className="flex flex-row gap-2 md:gap-4 w-full md:w-auto">
                <button 
                    onClick={() => setShowVideoModal(true)}
                    className="flex-1 md:flex-none py-3 md:py-4 px-4 md:px-8 rounded-xl md:rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 text-white font-bold text-xs md:text-base transition-all flex items-center justify-center gap-2 backdrop-blur-xl active:scale-95"
                >
                    <span className="text-sm md:text-lg">▶️</span> 
                    <span className="whitespace-nowrap">{language === 'ko' ? '사용법' : 'Walkthrough'}</span>
                </button>
                <button 
                    onClick={() => setShowFlyerModal(true)}
                    className="flex-1 md:flex-none py-3 md:py-4 px-4 md:px-8 rounded-xl md:rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 text-white font-bold text-xs md:text-base transition-all flex items-center justify-center gap-2 backdrop-blur-xl active:scale-95"
                >
                    <span className="text-sm md:text-lg">📢</span> 
                    <span className="whitespace-nowrap">{language === 'ko' ? '홍보 자료' : 'Read More'}</span>
                </button>
            </div>
          </div>
        </div>
      </div>

      <div id="magic-drop-zone" className="max-w-7xl mx-auto px-4 md:px-6 mb-4 md:mb-12 w-full relative pt-4 md:pt-8">
         <DropZone size="large" />
         <p className="mt-4 text-zinc-600 text-[9px] md:text-xs font-black uppercase tracking-[0.2em] text-center opacity-40">{language === 'ko' ? '지원 형식: JPG, PNG, PDF' : 'Supported formats: JPG, PNG, PDF'}</p>
      </div>

      {!isAuthenticated && (
        <>
            <FeatureShowcase />
            <ScreenshotCarousel />
            
            <div className="max-w-7xl mx-auto px-4 md:px-6 py-20 text-center">
                <div className="bg-gradient-to-br from-zinc-900 to-black border border-white/10 p-12 md:p-24 rounded-[3rem] shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 blur-[100px] rounded-full"></div>
                    <div className="relative z-10">
                        <h2 className="text-3xl md:text-6xl font-black text-white font-display mb-6">{language === 'ko' ? '지금 바로 시작하세요' : 'Get Started Now'}</h2>
                        <p className="text-zinc-400 md:text-xl font-korean mb-10 max-w-2xl mx-auto opacity-80">{language === 'ko' ? '숙제 전쟁을 멈추고 아이와 더 많은 추억을 만드세요.' : 'Stop the homework war and make more memories with your child.'}</p>
                        <button onClick={openLoginModal} className="bg-white text-black px-12 py-5 rounded-2xl font-black text-lg md:text-2xl shadow-xl hover:bg-zinc-200 active:scale-95 transition-all">{t('login')}</button>
                    </div>
                </div>
            </div>
            
            <BusinessInfo />
        </>
      )}
    </div>
  );
};
