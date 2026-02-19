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
      const base64Url = await compressImage(file, 1600, 0.7); 
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
        <div className={`relative w-full ${size === 'large' ? 'min-h-[360px] md:min-h-[560px]' : 'h-full'} flex items-center justify-center py-4 md:py-10`}>
          <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[99%] h-[99%] border border-white/5 rounded-[3rem] md:rounded-[5rem] animate-[pulse_5s_ease-in-out_infinite] pointer-events-none`}></div>
          <div 
            role="button"
            id="magic-drop-zone-inner"
            className={`relative w-full h-full max-w-5xl mx-auto ${isNight ? 'bg-indigo-950/25' : 'bg-zinc-900/40'} backdrop-blur-3xl rounded-[3rem] md:rounded-[5rem] border transition-all duration-700 flex flex-col items-center justify-center p-6 md:p-16 group cursor-pointer
              ${dragActive && !isGuestLocked ? 'border-orange-500 shadow-[0_0_100px_rgba(249,115,22,0.3)] scale-[1.01]' : 'border-white/10 shadow-[0_50px_120px_rgba(0,0,0,0.6)] hover:border-white/25'}`}
            onDragEnter={isGuestLocked ? undefined : handleDrag} 
            onDragLeave={isGuestLocked ? undefined : handleDrag} 
            onDragOver={isGuestLocked ? undefined : handleDrag} 
            onDrop={isGuestLocked ? undefined : handleDrop}
            onClick={handleAction}
          >
              {!isAuthenticated && !guestUsed && (
                <div className="absolute top-6 md:top-10 z-40 animate-[bounce_4s_ease-in-out_infinite] pointer-events-none">
                    <div className="bg-orange-600 text-white text-[10px] md:text-sm font-black px-6 py-2.5 rounded-full uppercase tracking-widest shadow-[0_20px_50px_rgba(249,115,22,0.5)] flex items-center gap-2 border border-white/30 whitespace-nowrap">
                        <span className="w-2 h-2 bg-white rounded-full animate-ping"></span>
                        {t('guest_scan_badge')}
                    </div>
                </div>
              )}

              <div className="relative z-10 flex flex-col items-center text-center w-full">
                <div className={`${size === 'large' ? 'w-32 h-32 md:w-64 md:h-64' : 'w-32 h-32'} mb-6 md:mb-10 relative transition-all duration-1000 ${isGuestLocked ? 'blur-xl opacity-30 grayscale scale-90' : 'group-hover:scale-110'}`}>
                    {isProcessing ? (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className={`w-12 h-12 md:w-20 md:h-20 border-[4px] ${isNight ? 'border-indigo-500' : 'border-orange-500'} border-t-transparent rounded-full animate-spin shadow-2xl`}></div>
                      </div>
                    ) : (
                      <div className="w-full h-full animate-float flex items-center justify-center">
                        {!imgError ? (
                           <img 
                            src={isNight ? ASSETS.HERO_SLEEPY : ASSETS.LOGO} 
                            alt="Chekki Mascot" 
                            className={`w-full h-full object-contain drop-shadow-[0_30px_70px_rgba(0,0,0,0.6)] filter brightness-110 transition-all duration-1000 ${mascotLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`} 
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
                    <div className="animate-fade-in-up space-y-4 px-6">
                        <div className="space-y-2">
                             <h3 className="text-2xl md:text-5xl font-black text-white font-display tracking-tight break-keep leading-tight drop-shadow-lg">
                                {t('guest_used_title')}
                             </h3>
                             <p className="text-zinc-400 font-bold font-korean text-sm md:text-2xl max-w-xl mx-auto leading-relaxed opacity-90">
                                {t('guest_used_desc')}
                             </p>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); openLoginModal(); }} className={`mt-4 bg-white text-black px-10 py-4 md:px-16 md:py-6 rounded-2xl md:rounded-3xl font-black text-sm md:text-2xl transition-all active:scale-95 uppercase tracking-wider w-full md:w-auto shadow-[0_30px_70px_rgba(255,255,255,0.15)] ring-4 ring-white/10`}>
                           {t('login')}
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="space-y-2 max-w-3xl px-6">
                            <h3 className="text-2xl md:text-5xl font-black text-white font-display tracking-tight break-keep leading-tight">
                            {isProcessing ? (language === 'ko' ? "마법을 거는 중..." : "Casting Magic...") : t('drop_title')}
                            </h3>
                            <p className="text-zinc-400 font-bold font-korean text-sm md:text-2xl break-keep opacity-80 leading-relaxed drop-shadow-md">{t('drop_subtitle')}</p>
                        </div>
                        
                        <div className="flex flex-wrap justify-center gap-3 mt-6 md:mt-12 mb-6 px-4">
                          {[
                            { icon: '☀️', text: language === 'ko' ? '밝은 조명' : 'Bright Light' },
                            { icon: '📏', text: language === 'ko' ? '평평하게' : 'Flat Surface' },
                            { icon: '🔍', text: language === 'ko' ? '선명하게' : 'Sharp Focus' }
                          ].map((tip, i) => (
                            <div key={i} className="flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-2 md:px-7 md:py-3 rounded-2xl backdrop-blur-xl hover:bg-white/15 transition-all shadow-xl">
                              <span className="text-base md:text-xl">{tip.icon}</span>
                              <span className="text-[10px] md:text-sm font-black text-zinc-300 whitespace-nowrap uppercase tracking-[0.15em]">{tip.text}</span>
                            </div>
                          ))}
                        </div>

                        <div className="mt-6 md:mt-12 flex flex-col items-center gap-4 group/btn">
                            <div className={`w-16 h-16 md:w-24 md:h-24 rounded-full ${isNight ? 'bg-indigo-600 shadow-indigo-500/40' : 'bg-orange-500 shadow-orange-500/40'} flex items-center justify-center shadow-[0_20px_60px] transition-all duration-500 group-hover:scale-115 group-hover:shadow-orange-500/60 border-4 border-white/20 active:scale-95`}>
                                <svg className="w-8 h-8 md:w-12 md:h-12 text-white drop-shadow-lg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </div>
                            <span className="text-[10px] md:text-base font-black text-zinc-500 uppercase tracking-[0.3em] group-hover:text-white transition-all duration-300">{t('btn_upload')}</span>
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
    <div className="max-w-7xl mx-auto px-6 md:px-10 py-16 md:py-32 border-t border-white/5 mt-16">
        <div className="text-center mb-16 md:mb-24">
            <h2 className="text-4xl md:text-7xl font-black text-white font-display mb-6 tracking-tight">{t('feat_title')}</h2>
            <div className="w-24 h-2 bg-gradient-to-r from-orange-500 to-pink-500 mx-auto rounded-full shadow-[0_0_20px_rgba(249,115,22,0.5)]"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
            {[
                { title: t('feat_1_title'), desc: t('feat_1_desc'), icon: "✍️", bg: "bg-orange-500/10", border: "border-orange-500/20" },
                { title: t('feat_2_title'), desc: t('feat_2_desc'), icon: "💌", bg: "bg-pink-500/10", border: "border-pink-500/20" },
                { title: t('feat_3_title'), desc: t('feat_3_desc'), icon: "🔊", bg: "bg-indigo-500/10", border: "border-indigo-500/20" },
                { title: t('feat_4_title'), desc: t('feat_4_desc'), icon: "🪄", bg: "bg-purple-500/10", border: "border-purple-500/20" }
            ].map((f, i) => (
                <div key={i} className={`p-10 md:p-16 rounded-[3.5rem] ${f.bg} border ${f.border} backdrop-blur-3xl flex flex-col items-center md:items-start text-center md:text-left transition-all duration-500 hover:scale-[1.03] hover:shadow-2xl group`}>
                    <span className="text-6xl md:text-8xl mb-8 block drop-shadow-2xl animate-float" style={{ animationDelay: `${i * 0.5}s` }}>{f.icon}</span>
                    <h3 className="text-2xl md:text-4xl font-black text-white font-display mb-5 tracking-tight group-hover:text-orange-400 transition-colors">{f.title}</h3>
                    <p className="text-zinc-400 font-bold font-korean text-base md:text-2xl leading-relaxed opacity-90 break-keep">{f.desc}</p>
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
        <div className="w-full overflow-hidden py-16 md:py-32">
            <div className="max-w-7xl mx-auto px-6 mb-16">
                <h2 className="text-3xl md:text-6xl font-black text-white font-display text-center drop-shadow-xl">{language === 'ko' ? "채키의 실제 모습" : "Chekki in Action"}</h2>
            </div>
            <div className="flex gap-6 md:gap-12 overflow-x-auto px-6 md:px-20 pb-12 custom-scrollbar scroll-smooth snap-x">
                {images.map((src, i) => (
                    <div key={i} className="min-w-[300px] md:min-w-[450px] aspect-[9/19] bg-zinc-900 rounded-[3rem] border border-white/10 overflow-hidden shadow-2xl transition-all duration-700 hover:scale-[1.05] hover:shadow-orange-500/10 shrink-0 snap-center">
                        <img src={src} alt={`Preview ${i+1}`} className="w-full h-full object-cover" loading="lazy" />
                    </div>
                ))}
            </div>
        </div>
    );
  };

  const BusinessInfo = () => (
    <footer className="bg-[#030305] border-t border-white/5 py-16 md:py-24 px-8 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between gap-16">
            <div className="space-y-6">
                <div className="flex items-center gap-3">
                    <img src={ASSETS.LOGO} alt="Chekki Logo" className="w-10 h-10 opacity-70 filter grayscale" />
                    <h2 className="text-2xl font-black text-zinc-500 font-display">Chekki<span className="text-zinc-700">AI</span></h2>
                </div>
                <div className="text-zinc-600 text-[11px] md:text-sm space-y-2 leading-relaxed font-medium uppercase tracking-[0.15em]">
                    <p>{t('biz_name')}</p>
                    <p>{t('biz_ceo')}</p>
                    <p>{t('biz_addr')}</p>
                    <p>{t('biz_reg')}</p>
                    <p>{t('biz_mail')}</p>
                    <p>{t('biz_contact')}</p>
                </div>
            </div>
            <div className="flex flex-col md:items-end gap-8">
                <div className="flex gap-6">
                    <button onClick={() => setShowLegal('terms')} className="text-zinc-500 hover:text-white text-xs uppercase font-black tracking-widest transition-colors underline underline-offset-8">Terms</button>
                    <button onClick={() => setShowLegal('privacy')} className="text-zinc-500 hover:text-white text-xs uppercase font-black tracking-widest transition-colors underline underline-offset-8">Privacy</button>
                    <button onClick={() => setShowLegal('refund')} className="text-zinc-500 hover:text-white text-xs uppercase font-black tracking-widest transition-colors underline underline-offset-8">Refund</button>
                </div>
                <p className="text-zinc-700 text-xs font-bold uppercase tracking-[0.3em] md:text-right">
                    © 2025 Chekki AI Labs. All Rights Reserved.
                </p>
            </div>
        </div>
    </footer>
  );

  const BetaBanner = () => (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-6 mb-6 md:mb-12 animate-fade-in-up w-full px-4">
        <button 
          onClick={() => setShowFeedbackModal(true)}
          className="group bg-white/5 hover:bg-white/10 border border-white/10 p-5 md:p-8 rounded-[2rem] flex items-center gap-4 md:gap-6 transition-all shadow-xl"
        >
           <div className={`w-12 h-12 md:w-16 md:h-16 rounded-2xl flex-shrink-0 ${isNight ? 'bg-indigo-500/20' : 'bg-orange-500/20'} flex items-center justify-center text-2xl md:text-3xl shadow-inner`}>✨</div>
           <div className="text-left min-w-0">
              <p className={`text-[10px] md:text-xs font-black uppercase tracking-[0.2em] ${isNight ? 'text-indigo-400' : 'text-orange-500'} mb-1`}>{language === 'ko' ? '의견 남기기' : 'Feedback'}</p>
              <p className="text-sm md:text-xl font-black text-zinc-100 font-korean truncate tracking-tight">{language === 'ko' ? '아이디어 제안' : 'Share Ideas'}</p>
           </div>
        </button>
        <button 
          onClick={() => setShowVideoModal(true)}
          className="group bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/20 p-5 md:p-8 rounded-[2rem] flex items-center gap-4 md:gap-6 transition-all shadow-xl"
        >
          <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl flex-shrink-0 bg-indigo-500 flex items-center justify-center text-xl md:text-3xl shadow-2xl">▶️</div>
          <div className="text-left min-w-0">
              <p className="text-[10px] md:text-xs font-black uppercase tracking-[0.2em] text-indigo-400 mb-1">{language === 'ko' ? '빠른 가이드' : 'Quick Guide'}</p>
              <p className="text-sm md:text-xl font-black text-white font-korean truncate tracking-tight">{language === 'ko' ? '사용법 보기' : 'Walkthrough'}</p>
          </div>
        </button>
        <button 
          onClick={() => setShowFlyerModal(true)}
          className="group bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 p-5 md:p-8 rounded-[2rem] flex items-center gap-4 md:gap-6 transition-all shadow-xl"
        >
          <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl flex-shrink-0 bg-orange-500 flex items-center justify-center text-xl md:text-3xl shadow-2xl">📢</div>
          <div className="text-left min-w-0">
              <p className={`text-[10px] md:text-xs font-black uppercase tracking-[0.2em] text-orange-400 mb-1`}>{language === 'ko' ? '홍보 자료' : 'Resources'}</p>
              <p className="text-sm md:text-xl font-black text-white font-korean truncate tracking-tight">{language === 'ko' ? '채키 알리기' : 'Spread Chekki'}</p>
          </div>
        </button>
    </div>
  );

  if (isAuthenticated && user) {
    const isPro = user.plan === 'pro';

    return (
      <div className="min-h-full pt-20 md:pt-32 pb-16 px-6 md:px-16 max-w-7xl mx-auto flex flex-col items-center animate-fade-in relative">
        {showFeedbackModal && <FeedbackModal onClose={() => setShowFeedbackModal(false)} />}
        {showVideoModal && <VideoWalkthroughModal onClose={() => setShowVideoModal(false)} />}
        {showFlyerModal && <FlyerModal onClose={() => setShowFlyerModal(false)} />}
        
        <div className="w-full max-w-5xl flex flex-col items-center text-center mb-8 md:mb-16 gap-4 md:gap-12">
           <div className="space-y-3 md:space-y-6">
              {user.schoolName && (
                  <div className="inline-flex items-center gap-3 px-5 py-1.5 rounded-full bg-indigo-500/15 border border-indigo-500/30 mb-2 shadow-2xl backdrop-blur-xl">
                      <span className="text-sm md:text-lg">🏫</span>
                      <span className="text-[10px] md:text-sm font-black text-indigo-400 uppercase tracking-[0.2em]">{user.schoolName}</span>
                  </div>
              )}
              <h1 className="text-4xl md:text-8xl font-black text-white font-display break-keep leading-tight">
                {language === 'ko' ? '반가워요,' : 'Welcome,'} <span className={`text-transparent bg-clip-text bg-gradient-to-r ${isNight ? 'from-indigo-400 to-purple-500' : 'from-orange-400 to-pink-500'}`}>{user.name}!</span>
              </h1>
              <p className="text-zinc-400 font-bold font-korean text-base md:text-3xl max-w-4xl mx-auto leading-relaxed break-keep opacity-90">{language === 'ko' ? '오늘도 아이와 즐거운 숙제 시간 보내세요.' : 'Have a wonderful homework session tonight.'}</p>
           </div>
           
           <div className={`border rounded-[1.5rem] md:rounded-[3rem] py-3 px-6 md:py-4 md:px-14 flex items-center gap-4 md:gap-6 shadow-2xl transition-all duration-700 ${isPro ? 'bg-orange-500/15 border-orange-500/40' : 'bg-[#0F1014] border-white/10'}`}>
                <div className={`text-[10px] md:text-lg uppercase font-black tracking-[0.2em] ${isPro ? 'text-orange-400' : 'text-zinc-500'}`}>
                    {isPro ? t('lbl_pro_active') : t('lbl_member_active')}
                </div>
                <div className="w-px h-6 md:h-12 bg-white/15"></div>
                <div className={`font-black text-2xl md:text-6xl font-display leading-none ${isPro ? 'text-orange-500' : 'text-white'}`}>∞</div>
           </div>
        </div>
        
        <div className="w-full max-w-6xl mx-auto flex flex-col gap-10 md:gap-16">
           <BetaBanner />
           <div id="magic-drop-zone-auth" className="w-full relative">
              <DropZone size="large" />
           </div>
           <p className="text-zinc-600 text-[10px] md:text-sm font-black uppercase tracking-[0.4em] text-center opacity-60">{language === 'ko' ? '지원 형식: JPG, PNG, PDF' : 'Supported formats: JPG, PNG, PDF'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full flex flex-col pt-20 md:pt-32 overflow-x-hidden scroll-smooth">
      {showFeedbackModal && <FeedbackModal onClose={() => setShowFeedbackModal(false)} />}
      {showLegal && <LegalModal type={showLegal} onClose={() => setShowLegal(null)} />}
      {showVideoModal && <VideoWalkthroughModal onClose={() => setShowVideoModal(false)} />}
      {showFlyerModal && <FlyerModal onClose={() => setShowFlyerModal(false)} />}
      
      <div className="relative max-w-7xl mx-auto px-6 md:px-10 grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-8 md:gap-16 items-center mb-10 md:mb-20">
        <div className={`absolute top-0 left-1/4 -translate-x-1/2 w-full md:w-[1200px] h-[900px] bg-brand-purple/15 rounded-full blur-[80px] md:blur-[220px] -z-10 pointer-events-none opacity-25 mix-blend-screen`}></div>
        
        <div className="w-full flex justify-center lg:justify-end items-center animate-fade-in-up order-1 lg:order-2 px-4 md:px-0">
            <div className="relative w-full max-w-[320px] sm:max-w-[550px] md:max-w-[800px] aspect-square flex items-center justify-center">
                <div className={`absolute inset-0 bg-gradient-to-tr from-brand-orange/30 to-brand-purple/30 rounded-full blur-[60px] md:blur-[180px] animate-pulse`}></div>
                <div className="w-full h-full relative z-10 transition-transform scale-115 md:scale-135">
                   <img src={isNight ? ASSETS.HERO_SLEEPY : ASSETS.HERO_IMAGE} alt="Chekki Hero" className="w-full h-full object-contain drop-shadow-[0_40px_100px_rgba(0,0,0,0.7)] animate-float filter brightness-110" />
                </div>
            </div>
        </div>

        <div className="w-full flex flex-col items-center lg:items-start text-center lg:text-left z-10 animate-fade-in-up order-2 lg:order-1 mt-6 lg:mt-0 px-4 md:px-0">
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full border border-white/15 bg-white/10 mb-6 md:mb-10 backdrop-blur-2xl shadow-2xl self-center lg:self-start">
            <span className={`w-2.5 h-2.5 rounded-full bg-orange-500 shadow-[0_0_15px_#f97316] animate-pulse`}></span>
            <span className="text-[10px] md:text-sm font-black text-zinc-200 tracking-[0.2em] uppercase">{language === 'ko' ? '베타 버전 출시' : 'Beta Release'}</span>
          </div>
          <h1 className="text-4xl sm:text-6xl md:text-8xl lg:text-9xl font-black text-white font-display mb-6 md:mb-10 tracking-tight drop-shadow-2xl whitespace-pre-line leading-[1.05] break-keep">
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
          <p className="text-base md:text-3xl text-zinc-400 max-w-3xl leading-relaxed mb-10 md:mb-16 font-korean font-medium break-keep opacity-95 mx-auto lg:mx-0">
            {isNight ? (language === 'ko' ? '밤늦은 시간까지 고민하지 마세요. 채키가 도와드릴게요.' : 'Don\'t stay up late alone. Chekki is here to help.') : (language === 'ko' ? '영유 숙제 채점부터 티칭 가이드까지, 채키가 다정하게 알려드려요.' : 'From grading to teaching scripts, Chekki guides you with love.')}
          </p>
          
          <div className="flex flex-col gap-6 md:gap-8 items-center lg:items-start w-full max-w-lg md:max-w-3xl mx-auto lg:mx-0">
            <button onClick={openLoginModal} className="group bg-white text-black py-5 md:py-8 px-10 md:px-20 rounded-2xl md:rounded-3xl font-black text-lg md:text-4xl transition-all transform active:scale-95 shadow-[0_30px_70px_rgba(255,255,255,0.15)] font-display flex items-center justify-center gap-5 overflow-hidden w-full md:w-auto whitespace-nowrap min-w-fit">
              <span className="font-korean">{t('login')}</span> 
              <span className="text-2xl md:text-5xl transition-transform group-hover:translate-x-3">→</span>
            </button>
            
            <div className="flex flex-row gap-4 md:gap-6 w-full md:w-auto">
                <button 
                    onClick={() => setShowVideoModal(true)}
                    className="flex-1 md:flex-none py-4 md:py-6 px-6 md:px-12 rounded-2xl md:rounded-3xl border border-white/15 bg-white/5 hover:bg-white/15 text-white font-black text-sm md:text-xl transition-all flex items-center justify-center gap-3 backdrop-blur-2xl active:scale-95 shadow-xl"
                >
                    <span className="text-xl md:text-2xl">▶️</span> 
                    <span className="whitespace-nowrap uppercase tracking-widest">{language === 'ko' ? '사용법' : 'Guide'}</span>
                </button>
                <button 
                    onClick={() => setShowFlyerModal(true)}
                    className="flex-1 md:flex-none py-4 md:py-6 px-6 md:px-12 rounded-2xl md:rounded-3xl border border-white/15 bg-white/5 hover:bg-white/15 text-white font-black text-sm md:text-xl transition-all flex items-center justify-center gap-3 backdrop-blur-2xl active:scale-95 shadow-xl"
                >
                    <span className="text-xl md:text-2xl">📢</span> 
                    <span className="whitespace-nowrap uppercase tracking-widest">{language === 'ko' ? '소개' : 'Intro'}</span>
                </button>
            </div>
          </div>
        </div>
      </div>

      <div id="magic-drop-zone" className="max-w-7xl mx-auto px-6 md:px-10 mb-10 md:mb-24 w-full relative pt-10 md:pt-16">
         <DropZone size="large" />
         <p className="mt-8 text-zinc-600 text-[10px] md:text-sm font-black uppercase tracking-[0.4em] text-center opacity-50">{language === 'ko' ? '지원 형식: JPG, PNG, PDF' : 'Supported formats: JPG, PNG, PDF'}</p>
      </div>

      {!isAuthenticated && (
        <>
            <FeatureShowcase />
            <ScreenshotCarousel />
            
            <div className="max-w-7xl mx-auto px-6 md:px-10 py-24 md:py-48 text-center">
                <div className="bg-gradient-to-br from-zinc-900/60 to-black border border-white/10 p-16 md:p-32 rounded-[4rem] md:rounded-[6rem] shadow-[0_60px_150px_rgba(0,0,0,0.8)] relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/15 blur-[120px] rounded-full group-hover:scale-150 transition-transform duration-1000"></div>
                    <div className="relative z-10">
                        <h2 className="text-4xl md:text-8xl font-black text-white font-display mb-8 tracking-tight">{language === 'ko' ? '지금 바로 시작하세요' : 'Get Started Now'}</h2>
                        <p className="text-zinc-400 text-base md:text-3xl font-korean mb-12 md:mb-20 max-w-4xl mx-auto opacity-90 break-keep leading-relaxed">{language === 'ko' ? '숙제 전쟁을 멈추고 아이와 더 많은 추억을 만드세요.' : 'Stop the homework war and make more memories with your child.'}</p>
                        <button onClick={openLoginModal} className="bg-white text-black px-16 py-6 md:px-24 md:py-8 rounded-[2rem] md:rounded-[3rem] font-black text-xl md:text-4xl shadow-[0_30px_70px_rgba(255,255,255,0.2)] hover:bg-zinc-100 active:scale-95 transition-all uppercase tracking-tighter">
                            {t('login')}
                        </button>
                    </div>
                </div>
            </div>
            
            <BusinessInfo />
        </>
      )}
    </div>
  );
};