
import React, { useRef, useState, useEffect } from 'react';
import { compressImage } from '../utils/imageUtils';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { ChekkiMascot } from './Icons';
import { ASSETS } from '../constants';
import { FeedbackModal } from './FeedbackModal';
import { LegalModal, LegalType } from './LegalModal';
import { FlyerModal } from './FlyerModal';

interface Props {
  onImageSelected: (base64: string) => void;
  isNight?: boolean;
}

export const CameraView: React.FC<Props> = ({ onImageSelected, isNight = false }) => {
  const { user, openLoginModal, isAuthenticated, setShowPaywall } = useAuth();
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

  const VideoWalkthroughModal = () => (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/95 backdrop-blur-2xl" onClick={() => setShowVideoModal(false)}></div>
      <div className="relative w-full max-w-5xl aspect-video bg-black rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/10 animate-fade-in-up">
         <video src={ASSETS.VIDEO_WALKTHROUGH} controls autoPlay className="w-full h-full" />
         <button onClick={() => setShowVideoModal(false)} className="absolute top-6 right-6 md:top-8 md:right-8 bg-black/50 hover:bg-black text-white p-3 rounded-full transition-colors z-10 border border-white/10 backdrop-blur-md">✕</button>
      </div>
    </div>
  );

  const FeatureSection = () => (
    <section className="py-16 md:py-32 px-6 max-w-7xl mx-auto w-full space-y-24 md:space-y-40">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-10">
            {[
                { id: 'ocr', emoji: '🎯', title: t('diff_ocr'), desc: t('diff_ocr_desc') },
                { id: 'script', emoji: '💌', title: t('diff_script'), desc: t('diff_script_desc') },
                { id: 'brand', emoji: '🏫', title: t('diff_brand'), desc: t('diff_brand_desc') }
            ].map(feat => (
                <div key={feat.id} className="p-8 md:p-10 rounded-[2.5rem] bg-zinc-900/40 border border-white/5 hover:border-orange-500/20 transition-all hover:-translate-y-1">
                    <span className="text-4xl md:text-5xl block mb-6">{feat.emoji}</span>
                    <h3 className="text-xl md:text-2xl font-black text-white font-display mb-3">{feat.title}</h3>
                    <p className="text-zinc-400 text-sm md:text-base leading-relaxed font-korean opacity-80">{feat.desc}</p>
                </div>
            ))}
        </div>

        <div className="space-y-12 md:space-y-20">
            <h2 className="text-3xl md:text-6xl font-black text-white text-center font-display tracking-tight">{t('how_title')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-16">
                {[1, 2, 3].map(step => (
                    <div key={step} className="flex flex-col items-center text-center group">
                        <div className="w-16 h-16 md:w-20 md:h-20 rounded-[2rem] bg-orange-500 flex items-center justify-center text-2xl md:text-3xl font-black text-white mb-6 md:mb-8 shadow-2xl shadow-orange-500/20 group-hover:scale-110 transition-transform">
                            {step}
                        </div>
                        <h4 className="text-xl md:text-2xl font-bold text-white mb-3 tracking-tight">{t(`how_step${step}`)}</h4>
                        <p className="text-zinc-500 text-sm md:text-lg font-korean max-w-xs opacity-90 leading-relaxed">{t(`how_step${step}_desc`)}</p>
                    </div>
                ))}
            </div>
        </div>

        <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-[3rem] md:rounded-[4rem] p-10 md:p-24 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-indigo-500/5 to-transparent pointer-events-none"></div>
            <h2 className="text-2xl md:text-5xl font-black text-white mb-12 md:mb-20 font-display relative z-10">{t('trust_title')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20 text-left relative z-10">
                <div className="space-y-4 md:space-y-6">
                    <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-3xl mb-4 shadow-inner border border-white/5">🔒</div>
                    <h3 className="text-xl md:text-3xl font-black text-white tracking-tight">{t('trust_privacy')}</h3>
                    <p className="text-zinc-400 text-sm md:text-xl leading-relaxed font-korean opacity-80">{t('trust_privacy_desc')}</p>
                </div>
                <div className="space-y-4 md:space-y-6">
                    <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-3xl mb-4 shadow-inner border border-white/5">🤝</div>
                    <h3 className="text-xl md:text-3xl font-black text-white tracking-tight">{t('trust_safety')}</h3>
                    <p className="text-zinc-400 text-sm md:text-xl leading-relaxed font-korean opacity-80">{t('trust_safety_desc')}</p>
                </div>
            </div>
        </div>
    </section>
  );

  const ClarityGuide = () => (
    <div className="flex flex-wrap justify-center gap-3 mt-10 md:mt-12 mb-6 px-2">
      {[
        { icon: '☀️', text: t('lbl_lighting') },
        { icon: '📏', text: t('lbl_flat') },
        { icon: '🔍', text: t('lbl_sharp') }
      ].map((tip, i) => (
        <div key={i} className="flex items-center gap-2.5 bg-white/5 border border-white/10 px-4 py-2 md:px-5 md:py-2.5 rounded-2xl shrink-0 backdrop-blur-md hover:bg-white/10 transition-all cursor-default">
          <span className="text-base">{tip.icon}</span>
          <span className="text-[10px] md:text-xs font-black text-zinc-400 whitespace-nowrap uppercase tracking-[0.2em]">{tip.text}</span>
        </div>
      ))}
    </div>
  );

  const DropZone = ({ size = "large" }: { size?: "large" | "compact" }) => {
    const isGuestLocked = !isAuthenticated && guestUsed;
    const isFreeUserLocked = isAuthenticated && user?.plan === 'free' && user?.scansUsedToday >= user?.maxScansPerDay;
    const isLocked = isGuestLocked || isFreeUserLocked;

    const handleAction = () => {
        if (isGuestLocked) openLoginModal();
        else if (isFreeUserLocked) setShowPaywall(true);
        else fileInputRef.current?.click();
    };

    return (
        <div className={`relative w-full ${size === 'large' ? 'min-h-[480px] md:min-h-[600px]' : 'h-full'} flex items-center justify-center py-10 md:py-16 overflow-visible`}>
          <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[99%] h-[99%] border-2 ${isNight ? 'border-indigo-500/10' : 'border-white/5'} rounded-[3.5rem] md:rounded-[4.5rem] animate-[pulse_5s_ease-in-out_infinite] pointer-events-none`}></div>
          <div 
            role="button"
            id="magic-drop-zone-inner"
            className={`relative w-full h-full max-w-3xl mx-auto ${isNight ? 'bg-indigo-950/20' : 'bg-zinc-900/40'} backdrop-blur-3xl rounded-[3.5rem] md:rounded-[4.5rem] border-2 transition-all duration-700 flex flex-col items-center justify-center p-10 md:p-24 group cursor-pointer overflow-visible
              ${dragActive && !isLocked ? 'border-orange-500 shadow-[0_0_100px_rgba(249,115,22,0.25)] scale-[1.02]' : 'border-white/10 shadow-[0_60px_120px_rgba(0,0,0,0.6)] hover:border-white/20'}`}
            onDragEnter={isLocked ? undefined : handleDrag} 
            onDragLeave={isLocked ? undefined : handleDrag} 
            onDragOver={isLocked ? undefined : handleDrag} 
            onDrop={isLocked ? undefined : handleDrop}
            onClick={handleAction}
          >
              {!isAuthenticated && !guestUsed && (
                <div className="absolute top-10 z-40 animate-[bounce_4s_ease-in-out_infinite] pointer-events-none">
                    <div className="relative">
                        <div className="bg-orange-500 text-white text-[10px] md:text-xs font-black px-8 py-4 rounded-full uppercase tracking-widest shadow-[0_20px_50px_rgba(249,115,22,0.5)] flex items-center gap-4 border-2 border-white/20 whitespace-nowrap">
                            <span className="w-2.5 h-2.5 bg-white rounded-full animate-ping"></span>
                            {t('guest_scan_badge')}
                        </div>
                    </div>
                </div>
              )}

              <div className="relative z-10 flex flex-col items-center text-center w-full pt-10">
                <div className={`${size === 'large' ? 'w-44 h-44 md:w-80 md:h-80' : 'w-48 h-48'} mb-8 md:mb-12 relative transition-all duration-700 ${isLocked ? 'blur-md opacity-40 grayscale scale-90' : 'group-hover:scale-105'}`}>
                    {isProcessing ? (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className={`w-14 h-14 md:w-24 md:h-24 border-[6px] ${isNight ? 'border-indigo-500' : 'border-orange-500'} border-t-transparent rounded-full animate-spin shadow-2xl`}></div>
                      </div>
                    ) : (
                      <div className="w-full h-full animate-float flex items-center justify-center">
                        {!imgError ? (
                           <img 
                            src={isNight ? ASSETS.HERO_SLEEPY : ASSETS.MASCOT_HAPPY} 
                            alt="Chekki Mascot" 
                            className={`w-full h-full object-contain drop-shadow-[0_30px_60px_rgba(0,0,0,0.6)] filter brightness-110 ${isNight ? 'scale-[1.7] md:scale-[1.9]' : 'scale-115 md:scale-125'} transition-opacity duration-700 ${mascotLoaded ? 'opacity-100' : 'opacity-0'}`} 
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
                
                {isLocked ? (
                    <div className="animate-fade-in space-y-8 px-6">
                        <div className="space-y-3">
                             <h3 className="text-3xl md:text-5xl font-black text-white font-display tracking-tight break-keep leading-tight">
                                {isGuestLocked ? t('guest_used_title') : (language === 'ko' ? "마법 충전 필요!" : "Refill Required!")}
                             </h3>
                             <p className="text-zinc-400 font-bold font-korean text-base md:text-2xl max-w-md mx-auto leading-relaxed opacity-80">
                                {isGuestLocked ? t('guest_used_desc') : (language === 'ko' ? "오늘의 무료 스캔을 모두 사용했어요. 내일 다시 충전됩니다!" : "Daily free scans used. We refill your magic at midnight!")}
                             </p>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); isGuestLocked ? openLoginModal() : setShowPaywall(true); }} className={`bg-white text-black px-12 py-5 md:px-16 md:py-6 rounded-2xl md:rounded-[2rem] font-black text-lg md:text-2xl shadow-[0_20px_50px_rgba(255,255,255,0.1)] transition-all active:scale-95 uppercase tracking-wider w-full md:w-auto ${isFreeUserLocked ? 'ring-4 ring-orange-500/40' : ''}`}>
                           {isGuestLocked ? t('login') : (language === 'ko' ? "무제한 마법 시작하기" : "Unlock Unlimited Magic")}
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="space-y-4 max-w-lg px-4">
                            <h3 className="text-3xl md:text-6xl font-black text-white font-display tracking-tight break-keep leading-[1.15]">
                            {isProcessing ? t('processing') : t('drop_title')}
                            </h3>
                            <p className="text-zinc-500 font-bold font-korean text-base md:text-2xl break-keep opacity-80 leading-relaxed">{t('drop_subtitle')}</p>
                        </div>
                        
                        <ClarityGuide />

                        <div className="mt-12 md:mt-16 flex flex-col items-center gap-5 group/btn">
                            <div className={`w-20 h-20 md:w-24 md:h-24 rounded-full ${isNight ? 'bg-indigo-600' : 'bg-orange-500'} flex items-center justify-center shadow-[0_25px_60px_rgba(249,115,22,0.4)] transition-all duration-300 group-hover:scale-110 group-hover:shadow-orange-500/60 border-4 border-white/20 active:scale-90 ring-offset-4 ring-offset-black ring-white/5`}>
                                <svg className="w-10 h-10 md:w-12 md:h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </div>
                            <span className="text-[11px] md:text-sm font-black text-zinc-500 uppercase tracking-[0.4em] group-hover:text-white transition-colors">{t('btn_upload')}</span>
                        </div>
                    </>
                )}
              </div>
              <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileChange} disabled={isProcessing || isLocked} />
          </div>
        </div>
    );
  };

  const BetaBanner = () => (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 mb-16 md:mb-24 animate-fade-in-up w-full px-2">
        <button 
          onClick={() => setShowFeedbackModal(true)}
          className="group bg-white/5 hover:bg-white/10 border border-white/10 p-6 md:p-8 rounded-[2.5rem] flex items-center gap-6 transition-all shadow-xl backdrop-blur-md ring-1 ring-white/5 hover:ring-orange-500/40 text-left h-full"
        >
           <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl flex-shrink-0 ${isNight ? 'bg-indigo-500/20' : 'bg-orange-500/20'} flex items-center justify-center text-2xl md:text-3xl shadow-inner`}>✨</div>
           <div className="min-w-0">
              <p className={`text-[10px] md:text-xs font-black uppercase tracking-[0.2em] ${isNight ? 'text-indigo-400' : 'text-orange-500'} mb-1.5`}>{t('lbl_feedback')}</p>
              <p className="text-base md:text-xl font-bold text-zinc-200 font-korean group-hover:text-white transition-colors leading-tight truncate">
                {t('lbl_share_ideas')}
              </p>
           </div>
        </button>
        <button 
          onClick={() => setShowVideoModal(true)}
          className="group bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/20 p-6 md:p-8 rounded-[2.5rem] flex items-center gap-6 transition-all shadow-xl backdrop-blur-md ring-1 ring-indigo-500/20 hover:ring-indigo-500/40 text-left h-full"
        >
          <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl flex-shrink-0 bg-indigo-500 flex items-center justify-center text-xl md:text-2xl shadow-lg">▶️</div>
          <div className="min-w-0">
              <p className="text-[10px] md:text-xs font-black uppercase tracking-[0.2em] text-indigo-400 mb-1.5">{t('lbl_quick_guide')}</p>
              <p className="text-base md:text-xl font-bold text-white font-korean leading-tight truncate">{t('btn_walkthrough')}</p>
          </div>
        </button>
        <button 
          onClick={() => setShowFlyerModal(true)}
          className="group bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 p-6 md:p-8 rounded-[2.5rem] flex items-center gap-6 transition-all shadow-xl backdrop-blur-md ring-1 ring-orange-500/20 hover:ring-orange-500/40 text-left h-full"
        >
          <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl flex-shrink-0 bg-orange-500 flex items-center justify-center text-xl md:text-2xl shadow-lg">📢</div>
          <div className="min-w-0">
              <p className={`text-[10px] md:text-xs font-black uppercase tracking-[0.2em] text-orange-400 mb-1.5`}>{t('lbl_resource')}</p>
              <p className="text-base md:text-xl font-bold text-white font-korean leading-tight truncate">{t('res_title')}</p>
          </div>
        </button>
    </div>
  );

  if (isAuthenticated && user) {
    const remaining = user.plan === 'pro' ? '∞' : Math.max(0, user.maxScansPerDay - user.scansUsedToday);
    const isPro = user.plan === 'pro';

    return (
      <div className="min-h-full pt-12 md:pt-36 pb-20 px-4 md:px-10 max-w-7xl mx-auto flex flex-col items-center animate-fade-in relative">
        {showFeedbackModal && <FeedbackModal onClose={() => setShowFeedbackModal(false)} />}
        {showVideoModal && <VideoWalkthroughModal />}
        {showFlyerModal && <FlyerModal onClose={() => setShowFlyerModal(false)} />}
        
        <div className="w-full max-w-5xl flex flex-col items-center text-center mb-16 md:mb-24 gap-10 md:gap-14">
           <div className="space-y-6 md:space-y-8">
              {user.schoolName && (
                  <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-4 shadow-xl backdrop-blur-sm">
                      <span className="text-sm">🏫</span>
                      <span className="text-[10px] md:text-xs font-black text-indigo-400 uppercase tracking-[0.3em]">{user.schoolName}</span>
                  </div>
              )}
              <h1 className="text-5xl md:text-8xl font-black text-white font-display break-keep leading-tight">
                {t('dash_welcome')} <span className={`text-transparent bg-clip-text bg-gradient-to-r ${isNight ? 'from-indigo-400 to-purple-500' : 'from-orange-400 to-pink-500'}`}>{user.name}!</span>
              </h1>
              <p className="text-zinc-400 font-bold font-korean text-lg md:text-3xl max-w-3xl mx-auto leading-relaxed break-keep opacity-80">{t('dash_subtitle')}</p>
           </div>
           
           <div className={`border rounded-[2rem] py-4 px-8 md:py-5 md:px-12 flex items-center gap-6 shadow-2xl ring-1 ring-white/5 transition-all duration-500 ${isPro ? 'bg-orange-500/10 border-orange-500/30' : 'bg-[#0F1014] border-white/10'}`}>
                <div className={`text-[11px] md:text-sm uppercase font-black tracking-[0.3em] ${isPro ? 'text-orange-400' : 'text-zinc-500'}`}>
                    {isPro ? t('lbl_pro_active') : t('lbl_magic_left')}
                </div>
                <div className="w-px h-6 md:h-8 bg-white/10"></div>
                <div className={`font-bold text-2xl md:text-4xl font-display leading-none ${isPro ? 'text-orange-500 scale-110' : 'text-white'}`}>{remaining}</div>
           </div>
        </div>
        
        <div className="w-full max-w-6xl mx-auto flex flex-col gap-10">
           <BetaBanner />
           <DropZone size="large" />
        </div>
        <p className="mt-12 text-zinc-600 text-[11px] md:text-sm font-black uppercase tracking-[0.5em] text-center opacity-60">{t('supported_formats')}</p>
      </div>
    );
  }

  return (
    <div className="min-h-full flex flex-col pt-10 md:pt-36 pb-20 overflow-x-hidden scroll-smooth">
      {showFeedbackModal && <FeedbackModal onClose={() => setShowFeedbackModal(false)} />}
      {showLegal && <LegalModal type={showLegal} onClose={() => setShowLegal(null)} />}
      {showVideoModal && <VideoWalkthroughModal />}
      {showFlyerModal && <FlyerModal onClose={() => setShowFlyerModal(false)} />}
      
      <div className="relative max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-12 lg:gap-24 items-center mb-24 md:mb-40">
        <div className={`absolute top-0 left-1/4 -translate-x-1/2 w-full md:w-[1000px] h-[700px] ${isNight ? 'bg-indigo-900/20' : 'bg-brand-purple/10'} rounded-full blur-[100px] md:blur-[180px] -z-10 pointer-events-none opacity-40 mix-blend-screen`}></div>
        
        <div className="w-full flex justify-center lg:justify-end items-center animate-fade-in-up order-1 lg:order-2 px-4 md:px-0">
            <div className="relative w-full max-w-[280px] sm:max-w-[340px] md:max-w-[580px] aspect-square flex items-center justify-center">
                <div className={`absolute inset-0 bg-gradient-to-tr ${isNight ? 'from-indigo-500/20 to-purple-500/20' : 'from-brand-orange/20 to-brand-purple/20'} rounded-full blur-[80px] md:blur-[140px] animate-pulse`}></div>
                <div className="w-full h-full relative z-10 transition-transform scale-110 md:scale-125">
                   <img src={isNight ? ASSETS.HERO_SLEEPY : ASSETS.HERO_IMAGE} alt="Chekki Hero" className="w-full h-full object-contain drop-shadow-[0_40px_100px_rgba(0,0,0,0.6)] animate-float filter brightness-110" />
                </div>
            </div>
        </div>

        <div className="w-full flex flex-col items-center lg:items-start text-center lg:text-left z-10 animate-fade-in-up order-2 lg:order-1 mt-6 lg:mt-0 px-2 md:px-0">
          <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full border border-white/10 bg-white/5 mb-8 md:mb-12 backdrop-blur-md shadow-2xl self-center lg:self-start ring-1 ring-white/10">
            <span className={`w-2.5 h-2.5 rounded-full ${isNight ? 'bg-indigo-500 shadow-[0_0_12px_#6366f1]' : 'bg-orange-500 shadow-[0_0_12px_#f97316]'} animate-pulse`}></span>
            <span className="text-[10px] md:text-sm font-black text-zinc-200 tracking-[0.3em] uppercase">{t('hero_badge')}</span>
          </div>
          <h1 className="text-3xl sm:text-6xl md:text-8xl lg:text-9xl font-black text-white font-display mb-10 md:mb-14 tracking-tight drop-shadow-2xl whitespace-pre-line leading-[1.15] break-keep">
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
          <p className="text-lg md:text-3xl text-zinc-400 max-w-3xl leading-relaxed mb-12 md:mb-20 font-korean font-medium break-keep opacity-90 mx-auto lg:mx-0">
            {isNight ? t('hero_desc_night') : t('hero_desc')}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 md:gap-8 justify-center lg:justify-start items-center w-full max-w-lg mx-auto lg:mx-0">
            <button onClick={openLoginModal} className="group bg-white text-black h-16 md:h-24 px-6 md:px-16 rounded-2xl md:rounded-[2rem] font-black text-xl md:text-3xl transition-all transform active:scale-95 shadow-[0_20px_60px_rgba(255,255,255,0.1)] font-display flex items-center justify-center gap-4 overflow-hidden ring-2 ring-white/10 w-full lg:w-auto">
              <span className="font-korean whitespace-nowrap">{t('hero_cta_btn')}</span> 
              <span className="text-3xl md:text-4xl transition-transform group-hover:translate-x-3">→</span>
            </button>
            {!guestUsed && (
                <button 
                onClick={() => {
                    const dropZone = document.getElementById('magic-drop-zone');
                    dropZone?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }} 
                className="group h-16 md:h-24 px-6 md:px-16 rounded-2xl md:rounded-[2rem] border-2 border-white/10 bg-white/5 hover:bg-white/10 text-white font-black text-lg md:text-2xl transition-all flex items-center justify-center gap-4 backdrop-blur-xl ring-1 ring-white/5 active:scale-95 w-full lg:w-auto"
                >
                <span className="text-orange-500 transition-transform group-hover:rotate-[360deg] duration-1000 text-2xl md:text-3xl">✨</span> 
                <span className="whitespace-nowrap">{t('hero_guest_cta')}</span>
                </button>
            )}
          </div>
        </div>
      </div>

      <div id="magic-drop-zone" className="max-w-6xl mx-auto px-6 mb-40 md:mb-56 w-full relative pt-20 md:pt-32 overflow-visible">
         <DropZone size="large" />
         <p className="mt-14 text-zinc-600 text-[11px] md:text-sm font-black uppercase tracking-[0.5em] text-center opacity-40">{t('supported_formats')}</p>
      </div>

      <FeatureSection />

      <div className="mt-40 pt-24 border-t border-white/5 bg-zinc-950/50 backdrop-blur-2xl">
          <div className="max-w-7xl mx-auto px-6 pb-24">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 mb-24">
                  <div className="space-y-8 text-[11px] md:text-sm text-zinc-500 font-korean leading-relaxed">
                      <h4 className="text-white font-black text-2xl mb-8 font-display">Chekki (채키)</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
                          <p>상호명: {t('biz_name')}</p>
                          <p>대표자: Jason Benjamin (제이슨 벤자민)</p>
                          <p>{t('biz_reg_num')}</p>
                          <p>{t('biz_mail_order')}</p>
                          <p className="md:col-span-2">주소: 서울특별시 종로구 종로 347, 롯데캐슬, 03113</p>
                          <p className="md:col-span-2">{t('biz_hours')}</p>
                          <p className="md:col-span-2">{t('biz_email')}</p>
                          <p className="md:col-span-2 text-zinc-600 font-bold text-xs">{t('biz_escrow')}</p>
                          <p className="md:col-span-2 text-zinc-600 italic text-xs">{t('biz_contact_notice')}</p>
                      </div>
                  </div>

                  <div className="space-y-8 text-[10px] md:text-sm text-zinc-500 font-sans leading-relaxed lg:border-l lg:border-white/5 lg:pl-20">
                      <h4 className="text-white font-black text-2xl mb-8 font-display">{t('biz_info_title')}</h4>
                      <div className="grid grid-cols-1 gap-y-4">
                          <p>Business Name: Chekki</p>
                          <p>Representative: Jason Benjamin</p>
                          <p>Business Registration Number: 814-14-03096</p>
                          <p>Address: Jongno 347, Lotte Castle, Seoul 03113, South Korea</p>
                          <p>Customer Support Hours: Weekdays 10AM–6PM (KST)</p>
                          <p>Email: jsn.benjamin@gmail.com</p>
                          <p className="text-zinc-600 font-bold text-xs">Secure payment guaranteed via Toss Escrow.</p>
                      </div>
                  </div>
              </div>

              <div className="mt-12 pt-12 border-t border-white/5 flex flex-col items-center gap-12">
                  <div className="flex flex-wrap justify-center gap-8 md:gap-14 text-[11px] md:text-sm text-zinc-400 font-black uppercase tracking-[0.4em]">
                      <button onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})} className="hover:text-white transition-colors">{t('nav_home')}</button>
                      <button onClick={() => setShowPaywall(true)} className="hover:text-white transition-colors">{t('nav_pricing')}</button>
                      <button onClick={() => setShowLegal('terms')} className="hover:text-white transition-colors">{t('nav_terms')}</button>
                      <button onClick={() => setShowLegal('privacy')} className="hover:text-white transition-colors">{t('nav_privacy')}</button>
                      <button onClick={() => setShowLegal('refund')} className="hover:text-white transition-colors">{t('nav_refund')}</button>
                      <button onClick={() => setShowFeedbackModal(true)} className="hover:text-white transition-colors">{t('nav_contact')}</button>
                  </div>
                  <p className="text-[11px] md:text-sm text-zinc-600 font-bold uppercase tracking-[0.5em] text-center">{t('footer_text')}</p>
              </div>
          </div>
      </div>
    </div>
  );
};
