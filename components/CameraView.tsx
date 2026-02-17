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

  const ScreenshotCarousel = () => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const slides = [
      {
        url: "https://res.cloudinary.com/dginphpy4/image/upload/v1771328734/Story_Upload_ubfd9l.png",
        titleEn: "1. Homework Upload",
        titleKo: "숙제 사진 업로드",
        desc: language === 'ko' ? "복잡한 학습지도 사진 한 장이면 분석 준비 끝!" : "Snap any complex worksheet with just one shot."
      },
      {
        url: "https://res.cloudinary.com/dginphpy4/image/upload/v1771328734/Story_Gen_Text_d2lwgj.png",
        titleEn: "2. Smart Overlay",
        titleKo: "마법 같은 정답 오버레이",
        desc: language === 'ko' ? "종이 위에 정답이 디지털로 정확히 나타납니다." : "Answers appear digitally right on top of the paper."
      },
      {
        url: "https://res.cloudinary.com/dginphpy4/image/upload/v1771328730/Kor_Pronunciation_v6bxaq.png",
        titleEn: "3. Teacher Guide",
        titleKo: "다정한 티칭 가이드",
        desc: language === 'ko' ? "한국어 대본과 교육 팁을 즉시 제공합니다." : "Get Korean scripts and learning tips instantly."
      },
      {
        url: "https://res.cloudinary.com/dginphpy4/image/upload/v1771328724/Eng_Questions_Pronunciation_irbcxk.png",
        titleEn: "4. English Pronunciation",
        titleKo: "원어민 발음 가이드",
        desc: language === 'ko' ? "아이에게 들려줄 정확한 원어민 발음을 확인하세요." : "Check the perfect native pronunciation for success."
      },
      {
        url: "https://res.cloudinary.com/dginphpy4/image/upload/v1771329421/Practice_Worksheet_p6oxaq.png",
        titleEn: "5. AI Practice Sheet",
        titleKo: "무제한 연습문제 생성",
        desc: language === 'ko' ? "틀린 문제와 유사한 유형을 AI가 새로 만들어줍니다." : "AI generates new worksheets based on struggle areas."
      }
    ];

    const nextSlide = () => setCurrentIndex((prev) => (prev + 1) % slides.length);
    const prevSlide = () => setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);

    useEffect(() => {
      const timer = setInterval(nextSlide, 6000);
      return () => clearInterval(timer);
    }, [slides.length]);

    return (
      <div className="w-full max-w-6xl mx-auto px-4 animate-fade-in-up">
        <div className="text-center mb-10 md:mb-12">
          <h2 className="text-2xl md:text-5xl font-black text-white font-display mb-4 tracking-tight">
            {language === 'ko' ? "눈으로 확인하는 마법" : "See the Magic in Action"}
          </h2>
          <p className="text-zinc-500 text-[10px] md:text-base font-korean font-bold opacity-80 uppercase tracking-[0.2em]">
            {language === 'ko' ? "영유 부모님들의 필수 육아템, 채키 AI" : "The Essential Tool for EK Parents"}
          </p>
        </div>

        <div className="relative group flex items-center">
          {/* Side Arrows */}
          <button 
            onClick={(e) => { e.stopPropagation(); prevSlide(); }}
            className="absolute left-2 md:-left-8 z-30 p-3 md:p-5 rounded-full bg-zinc-900/80 border border-white/10 text-white hover:bg-orange-500 transition-all opacity-0 group-hover:opacity-100 hidden md:block"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7"/></svg>
          </button>
          
          <button 
            onClick={(e) => { e.stopPropagation(); nextSlide(); }}
            className="absolute right-2 md:-right-8 z-30 p-3 md:p-5 rounded-full bg-zinc-900/80 border border-white/10 text-white hover:bg-orange-500 transition-all opacity-0 group-hover:opacity-100 hidden md:block"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7"/></svg>
          </button>

          {/* Main Visual Frame - Updated to ensure full visibility */}
          <div className="relative w-full aspect-[16/11] md:aspect-[16/9] bg-zinc-950 rounded-[2.5rem] md:rounded-[4rem] overflow-hidden border border-white/5 shadow-[0_40px_100px_rgba(0,0,0,0.8)]">
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10 pointer-events-none"></div>
            
            {slides.map((slide, idx) => (
              <div 
                key={idx}
                className={`absolute inset-0 transition-all duration-1000 ease-in-out transform flex items-center justify-center p-4 md:p-12 ${idx === currentIndex ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
              >
                {/* 
                  USE OBJECT-CONTAIN: 
                  This ensures the image is NEVER cropped, regardless of container size. 
                */}
                <img 
                  src={slide.url} 
                  alt={slide.titleEn} 
                  className="w-full h-full object-contain drop-shadow-[0_20px_40px_rgba(0,0,0,0.5)]" 
                />
                
                {/* Content Overlay */}
                <div className={`absolute bottom-4 left-4 right-4 md:bottom-12 md:left-12 md:right-12 z-20 transition-all duration-700 delay-300 flex justify-center ${idx === currentIndex ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
                  <div className="flex flex-col gap-1 md:gap-3 bg-black/70 backdrop-blur-xl p-4 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] border border-white/10 w-full max-w-2xl text-center md:text-left shadow-2xl">
                    <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4 mb-1">
                      <span className="bg-orange-500 text-white text-[8px] md:text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">Step {idx + 1}</span>
                      <h3 className="text-sm md:text-3xl font-black text-white font-display tracking-tight">{slide.titleEn}</h3>
                    </div>
                    <h4 className="text-xs md:text-2xl font-black text-white/90 font-korean">{slide.titleKo}</h4>
                    <p className="text-[10px] md:text-base text-zinc-400 font-bold font-korean leading-relaxed opacity-90">{slide.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Nav Dots */}
          <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 flex gap-2 md:gap-3 z-30">
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`h-1.5 md:h-2 transition-all duration-500 rounded-full ${idx === currentIndex ? 'w-8 md:w-12 bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.6)]' : 'w-2 bg-zinc-800 hover:bg-zinc-700'}`}
              />
            ))}
          </div>
        </div>
      </div>
    );
  };

  const WhyChekkiSection = () => (
    <section className="py-16 md:py-32 px-4 max-w-7xl mx-auto w-full">
        <div className="text-center mb-16 md:mb-24">
            <h2 className="text-2xl md:text-6xl font-black text-white font-display mb-6 tracking-tight">{t('diff_title')}</h2>
            <div className="w-20 h-1.5 bg-orange-500 mx-auto rounded-full"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-12">
            {[
                { id: 'ocr', emoji: '🎯', title: t('diff_ocr'), desc: t('diff_ocr_desc'), color: 'from-orange-500/20' },
                { id: 'script', emoji: '💌', title: t('diff_script'), desc: t('diff_script_desc'), color: 'from-indigo-500/20' },
                { id: 'brand', emoji: '🏫', title: t('diff_brand'), desc: t('diff_brand_desc'), color: 'from-purple-500/20' }
            ].map(feat => (
                <div key={feat.id} className={`p-8 md:p-12 rounded-[3rem] bg-gradient-to-br ${feat.color} to-zinc-900/30 border border-white/5 hover:border-white/10 transition-all group relative overflow-hidden`}>
                    <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity text-6xl md:text-8xl">{feat.emoji}</div>
                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-white/5 flex items-center justify-center text-4xl md:text-5xl mb-8 group-hover:scale-110 transition-transform">
                      {feat.emoji}
                    </div>
                    <h3 className="text-xl md:text-3xl font-black text-white font-display mb-4 tracking-tight leading-tight">{feat.title}</h3>
                    <p className="text-zinc-400 text-sm md:text-lg leading-relaxed font-korean opacity-80 break-keep">{feat.desc}</p>
                </div>
            ))}
        </div>
    </section>
  );

  const PrivacySection = () => (
    <section className="py-16 md:py-32 px-4 max-w-5xl mx-auto w-full">
        <div className="bg-zinc-900/30 border border-white/5 rounded-[4rem] p-8 md:p-24 relative overflow-hidden text-center group">
            <div className={`absolute inset-0 bg-gradient-to-b ${isNight ? 'from-indigo-500/5' : 'from-orange-500/5'} to-transparent pointer-events-none`}></div>
            
            <div className="w-32 h-32 md:w-56 md:h-56 mx-auto mb-10 md:mb-16 relative">
                <div className="absolute inset-0 bg-white/5 rounded-full blur-3xl animate-pulse"></div>
                <ChekkiMascot className="w-full h-full animate-float drop-shadow-2xl" mood={isNight ? "sleeping" : "happy"} />
            </div>

            <h2 className="text-2xl md:text-6xl font-black text-white font-display mb-6 md:mb-10 tracking-tight">{t('trust_title')}</h2>
            <p className="text-zinc-400 text-sm md:text-2xl font-korean font-medium max-w-2xl mx-auto leading-relaxed mb-12 md:mb-20 break-keep">
                {language === 'ko' ? "채키는 자녀의 소중한 정보를 저장하지 않으며, 부모님과 아이가 함께 즐겁게 공부하는 시간을 만드는 데에만 집중합니다." : "Chekki never stores your child's data. We focus only on making study time a happy bonding moment for you and your little one."}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 text-left">
                <div className="p-6 md:p-10 rounded-[2.5rem] bg-black/40 border border-white/5 hover:border-white/10 transition-colors">
                    <div className="flex items-center gap-4 mb-4">
                        <span className="text-2xl md:text-4xl">🔒</span>
                        <h4 className="text-lg md:text-2xl font-black text-white font-display uppercase tracking-tight">{t('trust_privacy')}</h4>
                    </div>
                    <p className="text-zinc-500 text-xs md:text-lg font-korean leading-relaxed">{t('trust_privacy_desc')}</p>
                </div>
                <div className="p-6 md:p-10 rounded-[2.5rem] bg-black/40 border border-white/5 hover:border-white/10 transition-colors">
                    <div className="flex items-center gap-4 mb-4">
                        <span className="text-2xl md:text-4xl">🏠</span>
                        <h4 className="text-lg md:text-2xl font-black text-white font-display uppercase tracking-tight">{t('trust_safety')}</h4>
                    </div>
                    <p className="text-zinc-500 text-xs md:text-lg font-korean leading-relaxed">{t('trust_safety_desc')}</p>
                </div>
            </div>
        </div>
    </section>
  );

  const VideoWalkthroughModal = () => (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/95 backdrop-blur-2xl" onClick={() => setShowVideoModal(false)}></div>
      <div className="relative w-full max-w-5xl aspect-video bg-black rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/10 animate-fade-in-up">
         <video src={ASSETS.VIDEO_WALKTHROUGH} controls autoPlay className="w-full h-full" />
         <button onClick={() => setShowVideoModal(false)} className="absolute top-6 right-6 md:top-8 md:right-8 bg-black/50 hover:bg-black text-white p-3 rounded-full transition-colors z-10 border border-white/10 backdrop-blur-md">✕</button>
      </div>
    </div>
  );

  const ClarityGuide = () => (
    <div className="flex flex-wrap justify-center gap-3 mt-8 md:mt-12 mb-4 px-2">
      {[
        { icon: '☀️', text: t('lbl_lighting') },
        { icon: '📏', text: t('lbl_flat') },
        { icon: '🔍', text: t('lbl_sharp') }
      ].map((tip, i) => (
        <div key={i} className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 md:px-6 md:py-3 rounded-2xl backdrop-blur-md hover:bg-white/10 transition-colors">
          <span className="text-base">{tip.icon}</span>
          <span className="text-[10px] md:text-xs font-black text-zinc-300 whitespace-nowrap uppercase tracking-[0.15em]">{tip.text}</span>
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
        <div className={`relative w-full ${size === 'large' ? 'min-h-[420px] md:min-h-[640px]' : 'h-full'} flex items-center justify-center py-8 md:py-12`}>
          <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[98%] h-[98%] border border-white/5 rounded-[3rem] md:rounded-[5rem] animate-[pulse_5s_ease-in-out_infinite] pointer-events-none`}></div>
          <div 
            role="button"
            id="magic-drop-zone-inner"
            className={`relative w-full h-full max-w-4xl mx-auto ${isNight ? 'bg-indigo-950/20' : 'bg-zinc-900/40'} backdrop-blur-3xl rounded-[3rem] md:rounded-[5rem] border transition-all duration-700 flex flex-col items-center justify-center p-8 md:p-20 group cursor-pointer
              ${dragActive && !isLocked ? 'border-orange-500 shadow-[0_0_80px_rgba(249,115,22,0.2)] scale-[1.01]' : 'border-white/10 shadow-[0_40px_100px_rgba(0,0,0,0.5)] hover:border-white/20'}`}
            onDragEnter={isLocked ? undefined : handleDrag} 
            onDragLeave={isLocked ? undefined : handleDrag} 
            onDragOver={isLocked ? undefined : handleDrag} 
            onDrop={isLocked ? undefined : handleDrop}
            onClick={handleAction}
          >
              {!isAuthenticated && !guestUsed && (
                <div className="absolute top-6 md:top-12 z-40 animate-[bounce_4s_ease-in-out_infinite] pointer-events-none">
                    <div className="bg-orange-500 text-white text-[10px] md:text-sm font-black px-6 py-2.5 rounded-full uppercase tracking-widest shadow-[0_15px_40px_rgba(249,115,22,0.4)] flex items-center gap-3 border border-white/20 whitespace-nowrap">
                        <span className="w-2 h-2 bg-white rounded-full animate-ping"></span>
                        {t('guest_scan_badge')}
                    </div>
                </div>
              )}

              <div className="relative z-10 flex flex-col items-center text-center w-full pt-6">
                <div className={`${size === 'large' ? 'w-40 h-40 md:w-80 md:h-80' : 'w-40 h-40'} mb-6 md:mb-12 relative transition-all duration-700 ${isLocked ? 'blur-md opacity-40 grayscale scale-90' : 'group-hover:scale-105'}`}>
                    {isProcessing ? (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className={`w-12 h-12 md:w-24 md:h-24 border-[4px] ${isNight ? 'border-indigo-500' : 'border-orange-500'} border-t-transparent rounded-full animate-spin shadow-2xl`}></div>
                      </div>
                    ) : (
                      <div className="w-full h-full animate-float flex items-center justify-center">
                        {!imgError ? (
                           <img 
                            src={isNight ? ASSETS.HERO_SLEEPY : ASSETS.MASCOT_HAPPY} 
                            alt="Chekki Mascot" 
                            className={`w-full h-full object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)] filter brightness-110 ${isNight ? 'scale-[1.6] md:scale-[2.0]' : 'scale-110 md:scale-125'} transition-opacity duration-700 ${mascotLoaded ? 'opacity-100' : 'opacity-0'}`} 
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
                    <div className="animate-fade-in space-y-6 px-4">
                        <div className="space-y-2">
                             <h3 className="text-2xl md:text-5xl font-black text-white font-display tracking-tight break-keep leading-tight">
                                {isGuestLocked ? t('guest_used_title') : t('refill_title')}
                             </h3>
                             <p className="text-zinc-400 font-bold font-korean text-sm md:text-2xl max-w-lg mx-auto leading-relaxed opacity-80">
                                {isGuestLocked ? t('guest_used_desc') : t('refill_desc')}
                             </p>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); isGuestLocked ? openLoginModal() : setShowPaywall(true); }} className={`bg-white text-black px-10 py-4 md:px-20 md:py-6 rounded-2xl md:rounded-[2.5rem] font-black text-sm md:text-2xl transition-all active:scale-95 uppercase tracking-wider w-full md:w-auto shadow-[0_20px_60px_rgba(255,255,255,0.1)]`}>
                           {isGuestLocked ? t('login') : t('refill_cta')}
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="space-y-2 max-w-2xl px-4">
                            <h3 className="text-2xl md:text-6xl font-black text-white font-display tracking-tight break-keep leading-[1.1]">
                            {isProcessing ? t('processing') : t('drop_title')}
                            </h3>
                            <p className="text-zinc-500 font-bold font-korean text-sm md:text-2xl break-keep opacity-80 leading-relaxed">{t('drop_subtitle')}</p>
                        </div>
                        
                        <ClarityGuide />

                        <div className="mt-8 md:mt-16 flex flex-col items-center gap-3 group/btn">
                            <div className={`w-16 h-16 md:w-28 md:h-28 rounded-full ${isNight ? 'bg-indigo-600' : 'bg-orange-500'} flex items-center justify-center shadow-[0_15px_50px_rgba(249,115,22,0.4)] transition-all duration-300 group-hover:scale-110 group-hover:shadow-orange-500/60 border-2 border-white/20 active:scale-90`}>
                                <svg className="w-8 h-8 md:w-14 md:h-14 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </div>
                            <span className="text-[10px] md:text-base font-black text-zinc-500 uppercase tracking-[0.25em] group-hover:text-white transition-colors">{t('btn_upload')}</span>
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
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-8 mb-12 md:mb-24 animate-fade-in-up w-full px-2">
        <button 
          onClick={() => setShowFeedbackModal(true)}
          className="group bg-white/5 hover:bg-white/10 border border-white/10 p-5 md:p-10 rounded-[2rem] flex items-center gap-4 md:gap-6 transition-all"
        >
           <div className={`w-12 h-12 md:w-16 md:h-16 rounded-2xl flex-shrink-0 ${isNight ? 'bg-indigo-500/20' : 'bg-orange-500/20'} flex items-center justify-center text-2xl md:text-4xl`}>✨</div>
           <div className="text-left min-w-0">
              <p className={`text-[9px] md:text-xs font-black uppercase tracking-[0.1em] ${isNight ? 'text-indigo-400' : 'text-orange-500'} mb-1`}>{t('lbl_feedback')}</p>
              <p className="text-sm md:text-2xl font-black text-zinc-100 font-korean truncate tracking-tight">{t('lbl_share_ideas')}</p>
           </div>
        </button>
        <button 
          onClick={() => setShowVideoModal(true)}
          className="group bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/20 p-5 md:p-10 rounded-[2rem] flex items-center gap-4 md:gap-6 transition-all"
        >
          <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl flex-shrink-0 bg-indigo-500 flex items-center justify-center text-xl md:text-3xl shadow-xl">▶️</div>
          <div className="text-left min-w-0">
              <p className="text-[9px] md:text-xs font-black uppercase tracking-[0.1em] text-indigo-400 mb-1">{t('lbl_quick_guide')}</p>
              <p className="text-sm md:text-2xl font-black text-white font-korean truncate tracking-tight">{t('btn_walkthrough')}</p>
          </div>
        </button>
        <button 
          onClick={() => setShowFlyerModal(true)}
          className="group bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 p-5 md:p-10 rounded-[2rem] flex items-center gap-4 md:gap-6 transition-all"
        >
          <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl flex-shrink-0 bg-orange-500 flex items-center justify-center text-xl md:text-3xl shadow-xl">📢</div>
          <div className="text-left min-w-0">
              <p className={`text-[9px] md:text-xs font-black uppercase tracking-[0.1em] text-orange-400 mb-1`}>{t('lbl_resource')}</p>
              <p className="text-sm md:text-2xl font-black text-white font-korean truncate tracking-tight">{t('res_title')}</p>
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
        
        <div className="w-full max-w-5xl flex flex-col items-center text-center mb-12 md:mb-24 gap-6 md:gap-14">
           <div className="space-y-4 md:space-y-8">
              {user.schoolName && (
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-2 shadow-xl backdrop-blur-sm">
                      <span className="text-sm">🏫</span>
                      <span className="text-[10px] md:text-sm font-black text-indigo-400 uppercase tracking-[0.15em]">{user.schoolName}</span>
                  </div>
              )}
              <h1 className="text-3xl md:text-8xl font-black text-white font-display break-keep leading-tight">
                {t('dash_welcome')} <span className={`text-transparent bg-clip-text bg-gradient-to-r ${isNight ? 'from-indigo-400 to-purple-500' : 'from-orange-400 to-pink-500'}`}>{user.name}!</span>
              </h1>
              <p className="text-zinc-400 font-bold font-korean text-base md:text-3xl max-w-3xl mx-auto leading-relaxed break-keep opacity-80">{t('dash_subtitle')}</p>
           </div>
           
           <div className={`border rounded-[1.5rem] md:rounded-[2.5rem] py-3 px-6 md:py-6 md:px-16 flex items-center gap-4 md:gap-8 shadow-2xl transition-all duration-500 ${isPro ? 'bg-orange-500/10 border-orange-500/30' : 'bg-[#0F1014] border-white/10'}`}>
                <div className={`text-[10px] md:text-base uppercase font-black tracking-[0.15em] ${isPro ? 'text-orange-400' : 'text-zinc-500'}`}>
                    {isPro ? t('lbl_pro_active') : t('lbl_magic_left')}
                </div>
                <div className="w-px h-6 md:h-12 bg-white/10"></div>
                <div className={`font-black text-2xl md:text-5xl font-display leading-none ${isPro ? 'text-orange-500 scale-110' : 'text-white'}`}>{remaining}</div>
           </div>
        </div>
        
        <div className="w-full max-w-6xl mx-auto flex flex-col gap-12 md:gap-24">
           <BetaBanner />
           <DropZone size="large" />
           <p className="text-zinc-600 text-[10px] md:text-sm font-black uppercase tracking-[0.25em] text-center opacity-60">{t('supported_formats')}</p>
           <WhyChekkiSection />
           <PrivacySection />
           <ScreenshotCarousel />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full flex flex-col pt-8 md:pt-36 pb-20 overflow-x-hidden scroll-smooth">
      {showFeedbackModal && <FeedbackModal onClose={() => setShowFeedbackModal(false)} />}
      {showLegal && <LegalModal type={showLegal} onClose={() => setShowLegal(null)} />}
      {showVideoModal && <VideoWalkthroughModal />}
      {showFlyerModal && <FlyerModal onClose={() => setShowFlyerModal(false)} />}
      
      <div className="relative max-w-7xl mx-auto px-4 md:px-6 grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-10 md:gap-24 items-center mb-16 md:mb-40">
        <div className={`absolute top-0 left-1/4 -translate-x-1/2 w-full md:w-[1000px] h-[700px] ${isNight ? 'bg-indigo-900/20' : 'bg-brand-purple/10'} rounded-full blur-[60px] md:blur-[180px] -z-10 pointer-events-none opacity-20 mix-blend-screen`}></div>
        
        <div className="w-full flex justify-center lg:justify-end items-center animate-fade-in-up order-1 lg:order-2 px-2 md:px-0">
            <div className="relative w-full max-w-[240px] sm:max-w-[380px] md:max-w-[620px] aspect-square flex items-center justify-center">
                <div className={`absolute inset-0 bg-gradient-to-tr ${isNight ? 'from-indigo-500/20 to-purple-500/20' : 'from-brand-orange/20 to-brand-purple/20'} rounded-full blur-[40px] md:blur-[140px] animate-pulse`}></div>
                <div className="w-full h-full relative z-10 transition-transform scale-110 md:scale-125">
                   <img src={isNight ? ASSETS.HERO_SLEEPY : ASSETS.HERO_IMAGE} alt="Chekki Hero" className="w-full h-full object-contain drop-shadow-[0_20px_60px_rgba(0,0,0,0.6)] animate-float filter brightness-110" />
                </div>
            </div>
        </div>

        <div className="w-full flex flex-col items-center lg:items-start text-center lg:text-left z-10 animate-fade-in-up order-2 lg:order-1 mt-4 lg:mt-0 px-2 md:px-0">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 mb-6 md:mb-12 backdrop-blur-md shadow-2xl self-center lg:self-start">
            <span className={`w-2 h-2 rounded-full ${isNight ? 'bg-indigo-500 shadow-[0_0_10px_#6366f1]' : 'bg-orange-500 shadow-[0_0_10px_#f97316]'} animate-pulse`}></span>
            <span className="text-[10px] md:text-sm font-black text-zinc-200 tracking-[0.15em] uppercase">{t('hero_badge')}</span>
          </div>
          <h1 className="text-3xl sm:text-5xl md:text-7xl lg:text-9xl font-black text-white font-display mb-6 md:mb-14 tracking-tight drop-shadow-2xl whitespace-pre-line leading-[1.1] break-keep">
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
          <p className="text-base md:text-3xl text-zinc-400 max-w-2xl leading-relaxed mb-10 md:mb-20 font-korean font-medium break-keep opacity-95 mx-auto lg:mx-0">
            {isNight ? t('hero_desc_night') : t('hero_desc')}
          </p>
          
          <div className="flex flex-col md:flex-row gap-5 md:gap-10 justify-center lg:justify-start items-center w-full max-w-md md:max-w-3xl mx-auto lg:mx-0">
            <button onClick={openLoginModal} className="group bg-white text-black py-5 md:py-7 px-8 md:px-20 rounded-2xl md:rounded-[3rem] font-black text-lg md:text-4xl transition-all transform active:scale-95 shadow-[0_20px_50px_rgba(255,255,255,0.1)] font-display flex items-center justify-center gap-4 overflow-hidden w-full md:w-auto whitespace-nowrap min-w-fit">
              <span className="font-korean">{t('hero_cta_btn')}</span> 
              <span className="text-2xl md:text-5xl transition-transform group-hover:translate-x-3">→</span>
            </button>
            {!guestUsed && (
                <button 
                onClick={() => {
                    const dropZone = document.getElementById('magic-drop-zone');
                    dropZone?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }} 
                className="group py-5 md:py-7 px-8 md:px-20 rounded-2xl md:rounded-[3rem] border border-white/10 bg-white/5 hover:bg-white/10 text-white font-black text-lg md:text-3xl transition-all flex items-center justify-center gap-4 backdrop-blur-xl active:scale-95 w-full md:w-auto whitespace-nowrap min-w-fit"
                >
                <span className="text-orange-500 transition-transform group-hover:rotate-[360deg] duration-1000 text-2xl md:text-4xl">✨</span> 
                <span className="whitespace-nowrap">{t('hero_guest_cta')}</span>
                </button>
            )}
          </div>
        </div>
      </div>

      <div id="magic-drop-zone" className="max-w-7xl mx-auto px-4 md:px-6 mb-24 md:mb-48 w-full relative pt-12 md:pt-32">
         <DropZone size="large" />
         <p className="mt-12 text-zinc-600 text-[10px] md:text-sm font-black uppercase tracking-[0.25em] text-center opacity-40">{t('supported_formats')}</p>
      </div>

      <WhyChekkiSection />

      <PrivacySection />

      <ScreenshotCarousel />

      <div className="mt-16 md:mt-40 pt-16 md:pt-32 border-t border-white/5 bg-zinc-950/50 backdrop-blur-2xl">
          <div className="max-w-7xl mx-auto px-4 md:px-6 pb-20">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-32 mb-16">
                  <div className="space-y-6 text-[10px] md:text-base text-zinc-500 font-korean leading-relaxed">
                      <h4 className="text-white font-black text-xl md:text-3xl mb-6 font-display">Chekki (채키)</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-3">
                          <p>상호명: {t('biz_name')}</p>
                          <p>대표자: Jason Benjamin (제이슨 벤자민)</p>
                          <p>{t('biz_reg_num')}</p>
                          <p>{t('biz_mail_order')}</p>
                          <p className="md:col-span-2">주소: 서울특별시 종로구 종로 347, 롯데캐슬, 03113</p>
                          <p className="md:col-span-2">{t('biz_hours')}</p>
                          <p className="md:col-span-2">{t('biz_email')}</p>
                      </div>
                  </div>

                  <div className="space-y-6 text-[10px] md:text-base text-zinc-500 font-sans leading-relaxed lg:border-l lg:border-white/5 lg:pl-32">
                      <h4 className="text-white font-black text-xl md:text-3xl mb-6 font-display">{t('biz_info_title')}</h4>
                      <div className="grid grid-cols-1 gap-y-3">
                          <p>Business Name: Chekki</p>
                          <p>Representative: Jason Benjamin</p>
                          <p>Business Registration Number: 814-14-03096</p>
                          <p>Address: Jongno 347, Lotte Castle, Seoul 03113, South Korea</p>
                          <p>Email: jsn.benjamin@gmail.com</p>
                      </div>
                  </div>
              </div>

              <div className="mt-10 pt-10 border-t border-white/5 flex flex-col items-center gap-8">
                  <div className="flex flex-wrap justify-center gap-6 md:gap-20 text-[10px] md:text-base text-zinc-400 font-black uppercase tracking-[0.25em]">
                      <button onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})} className="hover:text-white transition-colors">{t('nav_home')}</button>
                      <button onClick={() => setShowPaywall(true)} className="hover:text-white transition-colors">{t('nav_pricing')}</button>
                      <button onClick={() => setShowLegal('terms')} className="hover:text-white transition-colors">{t('nav_terms')}</button>
                      <button onClick={() => setShowLegal('privacy')} className="hover:text-white transition-colors">{t('nav_privacy')}</button>
                      <button onClick={() => setShowLegal('refund')} className="hover:text-white transition-colors">{t('nav_refund')}</button>
                      <button onClick={() => setShowFeedbackModal(true)} className="hover:text-white transition-colors">{t('nav_contact')}</button>
                  </div>
                  <p className="text-[10px] md:text-base text-zinc-600 font-bold uppercase tracking-[0.4em] text-center">{t('footer_text')}</p>
              </div>
          </div>
      </div>
    </div>
  );
};
