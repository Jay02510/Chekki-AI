
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { compressImage } from '../utils/imageUtils';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { ChekkiMascot } from './Icons';
import { ASSETS } from '../constants';
import { SCREENSHOT_MODE } from '../config';
import { FeedbackModal } from './FeedbackModal';
import { LegalType } from '../types';
import { LegalModal } from './LegalModal';
import { FlyerModal } from './FlyerModal';
import { ScreenshotCarousel } from './ScreenshotCarousel';
import { askChekkiQuestion, ChatTurn } from '../services/geminiService';
import { renderMarkdown } from '../utils/markdownUtils';


import { AskChekkiBar, AskChekkiAnswerModal } from './AskChekkiBar';


interface Props {
  onImageSelected: (base64: string) => void;
  isNight?: boolean;
  minimal?: boolean;
  onOpenHelp?: () => void;
}

export const CameraView: React.FC<Props> = ({ onImageSelected, isNight = false, minimal = false, onOpenHelp }) => {
  const { 
    user, isAuthenticated, openLoginModal, checkScanLimit, incrementScan, 
    checkQuestionLimit, incrementQuestion, setShowPaywall 
  } = useAuth();
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

  // Listen for trigger-scan event from BottomNav
  useEffect(() => {
    const handleTriggerScan = () => {
      if (isAuthenticated) {
        fileInputRef.current?.click();
      } else if (guestUsed) {
        openLoginModal();
      } else {
        fileInputRef.current?.click();
      }
    };
    window.addEventListener('trigger-scan', handleTriggerScan);
    return () => window.removeEventListener('trigger-scan', handleTriggerScan);
  }, [isAuthenticated, guestUsed, openLoginModal]);

  const processFile = async (file: File) => {
    setIsProcessing(true);
    try {
      const base64Url = await compressImage(file);

      // Smart Feature: Quality Check
      const img = new Image();
      img.src = base64Url;
      img.onload = () => {
        const isLowRes = img.width < 400 || img.height < 400;
        if (isLowRes) {
          const proceed = window.confirm("This image looks a bit small or blurry. The results might not be accurate.\n\nDo you want to scan it anyway?");
          if (!proceed) {
            setIsProcessing(false);
            return;
          }
        }

        const base64Data = base64Url.split(',')[1];
        onImageSelected(base64Data);
      };
      // img.onload handles the rest, so we remove the direct call
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

  const renderVideoWalkthroughModal = () => (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/95 backdrop-blur-2xl" onClick={() => setShowVideoModal(false)}></div>
      <div className="relative w-full max-w-5xl aspect-video bg-black rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/10 animate-fade-in-up">
        <video src={ASSETS.VIDEO_WALKTHROUGH} controls autoPlay className="w-full h-full" />
        <button onClick={() => setShowVideoModal(false)} className="absolute top-6 right-6 md:top-8 md:right-8 bg-black/50 hover:bg-black text-white p-3 rounded-full transition-colors z-10 border border-white/10 backdrop-blur-md">✕</button>
      </div>
    </div>
  );

  const renderFeatureSection = () => (
    <section className="py-12 md:py-32 px-4 max-w-7xl mx-auto w-full space-y-16 md:space-y-40">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-10">
        {[
          { id: 'brand', emoji: '🏫', title: t('diff_brand'), desc: t('diff_brand_desc') },
          { id: 'ocr', emoji: '🎯', title: t('diff_ocr'), desc: t('diff_ocr_desc') },
          { id: 'script', emoji: '💌', title: t('diff_script'), desc: t('diff_script_desc') }
        ].map(feat => (
          <div key={feat.id} className={`p-6 md:p-10 rounded-[2rem] ${isNight ? 'bg-zinc-900/40 border-white/5 hover:border-orange-500/20' : 'bg-white border-zinc-200 hover:border-orange-500/30 shadow-sm'} border transition-all`}>
            <span className="text-3xl md:text-5xl block mb-4 md:mb-6">{feat.emoji}</span>
            <h3 className={`text-lg md:text-2xl font-black ${isNight ? 'text-white' : 'text-zinc-900'} font-display mb-2 md:mb-3`}>{feat.title}</h3>
            <p className={`${isNight ? 'text-zinc-400 opacity-80' : 'text-zinc-600'} text-xs md:text-base leading-relaxed font-korean`}>{feat.desc}</p>
          </div>
        ))}
      </div>

      <div className="space-y-10 md:space-y-20">
        <h2 className={`text-2xl md:text-6xl font-black ${isNight ? 'text-white' : 'text-zinc-900'} text-center font-display tracking-tight`}>{t('how_title')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-16">
          {[1, 2, 3].map(step => (
            <div key={step} className="flex flex-col items-center text-center group">
              <div className="w-12 h-12 md:w-20 md:h-20 rounded-[1.5rem] bg-orange-500 flex items-center justify-center text-xl md:text-3xl font-black text-white mb-4 md:mb-8 shadow-2xl shadow-orange-500/20 group-hover:scale-110 transition-transform">
                 {step}
              </div>
              <h4 className={`text-lg md:text-2xl font-bold ${isNight ? 'text-white' : 'text-zinc-900'} mb-2 md:mb-3 tracking-tight`}>{t(`how_step${step}`)}</h4>
              <p className={`${isNight ? 'text-zinc-500 opacity-90' : 'text-zinc-600'} text-xs md:text-lg font-korean max-w-xs leading-relaxed`}>{t(`how_step${step}_desc`)}</p>
            </div>
          ))}
        </div>

         <div className="pt-20 md:pt-40 pb-2 md:pb-4 text-center space-y-2 md:space-y-4">
          <h2 className={`text-3xl md:text-8xl font-black ${isNight ? 'text-white' : 'text-zinc-900'} font-display tracking-tight break-keep leading-tight`}>
            {t('magic_title')}
          </h2>
          <p className="text-[10px] md:text-base font-black text-zinc-500 uppercase tracking-[0.4em] opacity-90">
            {t('magic_subtitle')}
          </p>
        </div>

        <ScreenshotCarousel />

        {/* Why Chekki Section */}
        <div className="pt-20 md:pt-40 space-y-12 md:space-y-24">
          <h2 className={`text-3xl md:text-6xl font-black ${isNight ? 'text-white' : 'text-zinc-900'} text-center font-display tracking-tight`}>
            {t('diff_title')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12 max-w-6xl mx-auto px-4">
            <div className={`flex flex-col space-y-4 md:space-y-8 p-8 md:p-16 rounded-[2.5rem] md:rounded-[4rem] ${isNight ? 'bg-zinc-900/30' : 'bg-white shadow-xl'} border ${isNight ? 'border-white/5' : 'border-zinc-100'} backdrop-blur-xl relative overflow-hidden group hover:${isNight ? 'bg-zinc-900/50' : 'bg-white'} transition-all duration-500`}>
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-500">
                <span className="text-8xl md:text-[12rem]">✍️</span>
              </div>
              <span className="text-4xl md:text-7xl mb-2">✍️</span>
              <h3 className={`text-2xl md:text-4xl font-black ${isNight ? 'text-white' : 'text-zinc-900'} tracking-tight leading-tight`}>{t('diff_ocr')}</h3>
              <p className={`${isNight ? 'text-zinc-500 opacity-90' : 'text-zinc-600'} text-base md:text-2xl font-korean leading-relaxed max-w-md`}>{t('diff_ocr_desc')}</p>
            </div>
            <div className={`flex flex-col space-y-4 md:space-y-8 p-8 md:p-16 rounded-[2.5rem] md:rounded-[4rem] ${isNight ? 'bg-zinc-900/30' : 'bg-white shadow-xl'} border ${isNight ? 'border-white/5' : 'border-zinc-100'} backdrop-blur-xl relative overflow-hidden group hover:${isNight ? 'bg-zinc-900/50' : 'bg-white'} transition-all duration-500`}>
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-500">
                <span className="text-8xl md:text-[12rem]">💌</span>
              </div>
              <span className="text-4xl md:text-7xl mb-2">💌</span>
              <h3 className={`text-2xl md:text-4xl font-black ${isNight ? 'text-white' : 'text-zinc-900'} tracking-tight leading-tight`}>{t('diff_script')}</h3>
              <p className={`${isNight ? 'text-zinc-500 opacity-90' : 'text-zinc-600'} text-base md:text-2xl font-korean leading-relaxed max-w-md`}>{t('diff_script_desc')}</p>
            </div>
          </div>
        </div>

        {/* Privacy Section */}
        <div className="pt-24 md:pt-60 pb-24 md:pb-60 space-y-12 md:space-y-24">
          <div className="text-center space-y-4 md:space-y-8">
            <h2 className={`text-3xl md:text-6xl font-black ${isNight ? 'text-white' : 'text-zinc-900'} font-display tracking-tight`}>
              {t('trust_title')}
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-24 max-w-6xl mx-auto px-4">
            <div className="flex flex-col items-center text-center space-y-6 md:space-y-10 group">
              <div className={`w-20 h-20 md:w-32 md:h-32 rounded-[2.5rem] ${isNight ? 'bg-zinc-900/50 border-white/10' : 'bg-white border-zinc-200 shadow-xl'} border flex items-center justify-center text-4xl md:text-6xl group-hover:scale-110 transition-all duration-500 group-hover:border-orange-500/30`}>
                🔒
              </div>
              <div className="space-y-4 md:space-y-6">
                <h3 className={`text-2xl md:text-4xl font-black ${isNight ? 'text-white' : 'text-zinc-900'} tracking-tight`}>{t('trust_privacy')}</h3>
                <p className={`${isNight ? 'text-zinc-500 opacity-90' : 'text-zinc-600'} text-base md:text-2xl font-korean leading-relaxed max-w-xl mx-auto`}>{t('trust_privacy_desc')}</p>
              </div>
            </div>
             <div className="flex flex-col items-center text-center space-y-6 md:space-y-10 group">
              <div className={`w-20 h-20 md:w-32 md:h-32 rounded-[2.5rem] ${isNight ? 'bg-zinc-900/50 border-white/10' : 'bg-white border-zinc-200 shadow-xl'} border flex items-center justify-center text-4xl md:text-6xl group-hover:scale-110 transition-all duration-500 group-hover:border-orange-500/30`}>
                👥
              </div>
              <div className="space-y-4 md:space-y-6">
                <h3 className={`text-2xl md:text-4xl font-black ${isNight ? 'text-white' : 'text-zinc-900'} tracking-tight`}>{t('trust_safety')}</h3>
                <p className={`${isNight ? 'text-zinc-500 opacity-90' : 'text-zinc-600'} text-base md:text-2xl font-korean leading-relaxed max-w-xl mx-auto`}>{t('trust_safety_desc')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );

  // State for the inline Ask Chekki answer modal
  const [askQuery, setAskQuery] = useState('');
  const [askAnswer, setAskAnswer] = useState<string | null>(null);
  const [askAnsweredQuestion, setAskAnsweredQuestion] = useState('');
  const [isAskAsking, setIsAskAsking] = useState(false);
  const [askHistory, setAskHistory] = useState<ChatTurn[]>([]);
  const [showTools, setShowTools] = useState(false);

  const handleAskSubmit = useCallback(async (question: string) => {
    if (!question.trim() || isAskAsking) return;
    
    // Check limit for authenticated free users
    if (isAuthenticated && !checkQuestionLimit()) {
      return;
    }

    const isFollowUp = askHistory.length > 0;
    if (!isFollowUp) {
      setAskAnswer(null);
      setAskHistory([]);
    }

    setAskAnsweredQuestion(question);
    setIsAskAsking(true);
    
    try {
      const isGuest = !isAuthenticated;
      const response = await askChekkiQuestion(question, language, isGuest, undefined, askHistory);
      setAskAnswer(response);

      setAskHistory(prev => [
        ...prev,
        { role: 'user' as const, text: question },
        { role: 'model' as const, text: response }
      ]);
      
      // Increment only for authenticated users (backend also handles this)
      if (isAuthenticated) {
        await incrementQuestion();
      }
    } catch (error: any) {
      setAskAnswer(language === 'ko' ? '오류가 발생했습니다. 다시 시도해주세요.' : 'Something went wrong. Please try again.');
    } finally {
      setIsAskAsking(false);
    }
  }, [isAuthenticated, checkQuestionLimit, incrementQuestion, language, askHistory, isAskAsking]);

  const renderClarityGuide = () => (
    <div className="grid grid-cols-3 gap-3 md:gap-8 mt-6 md:mt-12 mb-4 px-2 w-full max-w-2xl">
      {[
        { icon: '☀️', text: t('lbl_lighting'), tooltip: t('tt_lighting'), color: isNight ? 'from-orange-500/20 to-transparent' : 'from-orange-500/10 to-transparent' },
        { icon: '📏', text: t('lbl_flat'), tooltip: t('tt_flat'), color: isNight ? 'from-indigo-500/20 to-transparent' : 'from-indigo-500/10 to-transparent' },
        { icon: '🔍', text: t('lbl_sharp'), tooltip: t('tt_sharp'), color: isNight ? 'from-emerald-500/20 to-transparent' : 'from-emerald-500/10 to-transparent' }
      ].map((tip, i) => (
        <div key={i} className={`flex flex-col items-center justify-center gap-2 md:gap-4 ${isNight ? 'bg-white/5 border-white/10' : 'bg-white/80 border-zinc-200 shadow-[0_10px_30px_rgba(0,0,0,0.02)]'} border p-3 md:p-8 rounded-[1.8rem] md:rounded-[3rem] backdrop-blur-md transition-all hover:scale-105 group shadow-sm relative overflow-hidden h-full`} title={tip.tooltip}>
          <div className={`absolute inset-0 bg-gradient-to-b ${tip.color} opacity-30`}></div>
          <span className="text-2xl md:text-5xl relative z-10 group-hover:scale-110 transition-transform">{tip.icon}</span>
          <span className={`text-[8px] md:text-xs font-black ${isNight ? 'text-zinc-400' : 'text-zinc-900'} relative z-10 uppercase tracking-widest text-center`}>{tip.text}</span>
        </div>
      ))}
    </div>
  );

  const renderDropZone = (size: "large" | "compact" = "large") => {
    const isGuestLocked = !isAuthenticated && guestUsed;
    const isLocked = isGuestLocked;

    const handleAction = () => {
      if (isGuestLocked) openLoginModal();
      else fileInputRef.current?.click();
    };

    return (
      <div className={`relative w-full ${size === 'large' ? 'min-h-[380px] md:min-h-[600px]' : 'h-full'} flex items-center justify-center py-6 md:py-16`}>
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[98%] h-[98%] border ${isNight ? 'border-white/5' : 'border-zinc-200/50'} rounded-[3rem] md:rounded-[4.5rem] animate-[pulse_5s_ease-in-out_infinite] pointer-events-none`}></div>
        <div
          role="button"
          id="magic-drop-zone-inner"
          className={`relative w-full h-full max-w-3xl mx-auto ${isNight ? 'bg-indigo-950/20 border-white/10 shadow-[0_40px_100px_rgba(0,0,0,0.5)]' : 'bg-white border-zinc-200 shadow-[0_30px_90px_rgba(0,0,0,0.05)]'} backdrop-blur-3xl rounded-[3rem] md:rounded-[4.5rem] border transition-all duration-700 flex flex-col items-center justify-center p-6 md:p-24 group cursor-pointer
              ${dragActive && !isLocked ? 'border-orange-500 shadow-[0_0_80px_rgba(249,115,22,0.2)] scale-[1.01]' : 'hover:border-orange-500/30'}`}
          onDragEnter={isLocked ? undefined : handleDrag}
          onDragLeave={isLocked ? undefined : handleDrag}
          onDragOver={isLocked ? undefined : handleDrag}
          onDrop={isLocked ? undefined : handleDrop}
          onClick={handleAction}
        >
          {!isAuthenticated && !guestUsed && (
            <div className="absolute top-4 md:top-10 z-40 animate-[bounce_4s_ease-in-out_infinite] pointer-events-none">
              <div className="bg-orange-500 text-white text-[8px] md:text-xs font-black px-4 py-2 rounded-full uppercase tracking-widest shadow-[0_15px_40px_rgba(249,115,22,0.4)] flex items-center gap-2 border border-white/20 whitespace-nowrap">
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping"></span>
                {t('guest_scan_badge')}
              </div>
            </div>
          )}

          <div className="relative z-10 flex flex-col items-center text-center w-full pt-4">
            <div className={`${size === 'large' ? 'w-36 h-36 md:w-80 md:h-80' : 'w-40 h-40'} mb-4 md:mb-12 relative transition-all duration-700 ${isLocked ? 'blur-md opacity-40 grayscale scale-90' : 'group-hover:scale-105'}`}>
              {isProcessing ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className={`w-10 h-10 md:w-24 md:h-24 border-[3px] md:border-[4px] ${isNight ? 'border-indigo-500' : 'border-orange-500'} border-t-transparent rounded-full animate-spin shadow-2xl`}></div>
                </div>
              ) : (
                <div className="w-full h-full animate-float flex items-center justify-center">
                  {!imgError ? (
                    <img
                      src={ASSETS.HERO_IMAGE}
                      alt="Chekki Mascot"
                      className={`w-full h-full object-contain drop-shadow-[0_15px_30px_rgba(0,0,0,0.5)] filter brightness-110 ${isNight ? 'scale-[1.3] md:scale-[1.4] lg:scale-[1.5]' : 'scale-110 md:scale-115 lg:scale-[1.2]'} transition-opacity duration-700 ${mascotLoaded ? 'opacity-100' : 'opacity-0'}`}
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
              <div className="animate-fade-in space-y-4 px-4">
                <div className="space-y-1">
                  <h3 className={`text-xl md:text-5xl font-black ${isNight ? 'text-white' : 'text-zinc-900'} font-display tracking-tight break-keep leading-tight`}>
                    {t('guest_used_title')}
                  </h3>
                  <p className="text-zinc-400 font-bold font-korean text-xs md:text-2xl max-w-md mx-auto leading-relaxed opacity-80">
                    {t('guest_used_desc')}
                  </p>
                </div>
                <button onClick={(e) => { e.stopPropagation(); openLoginModal(); }} className={`bg-white text-black px-8 py-3 md:px-16 md:py-6 rounded-xl md:rounded-[2rem] font-black text-sm md:text-2xl transition-all active:scale-95 uppercase tracking-wider w-full md:w-auto shadow-xl`}>
                  {t('login')}
                </button>
              </div>
            ) : (
              <>
                <div className="space-y-1 max-w-lg px-2">
                  <h3 className={`text-xl md:text-6xl font-black ${isNight ? 'text-white' : 'text-zinc-900'} font-display tracking-tight break-keep leading-[1.2]`}>
                    {isProcessing ? t('processing') : t('drop_title')}
                  </h3>
                  <p className={`${isNight ? 'text-zinc-500' : 'text-zinc-400'} font-bold font-korean text-xs md:text-2xl break-keep opacity-80 leading-relaxed`}>{t('drop_subtitle')}</p>
                </div>

                {renderClarityGuide()}

                <div className="mt-4 md:mt-12 flex flex-col items-center gap-4 group/btn" title={t('btn_guest_scan')}>
                  <div className={`w-16 h-16 md:w-28 md:h-28 rounded-full ${isNight ? 'bg-indigo-600' : 'bg-orange-500'} flex items-center justify-center shadow-[0_20px_50px_rgba(249,115,22,0.3)] transition-all duration-300 group-hover:scale-110 group-hover:shadow-orange-500/60 border-4 border-white/20 active:scale-90`}>
                    <svg className="w-8 h-8 md:w-14 md:h-14 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <span className={`text-xs md:text-lg font-black uppercase tracking-[0.3em] transition-colors ${isNight ? 'text-zinc-500 group-hover:text-white' : 'text-zinc-400 group-hover:text-zinc-900'}`}>{isAuthenticated ? t('btn_upload') : t('btn_guest_scan')}</span>
                </div>

                <div className="mt-8 animate-fade-in-up">
                  <button 
                    onClick={(e) => { e.stopPropagation(); onOpenHelp?.(); }}
                    className={`px-6 py-2.5 rounded-full border ${isNight ? 'bg-white/5 border-white/10 text-zinc-400 hover:text-white hover:bg-white/10' : 'bg-white border-zinc-200 text-zinc-500 hover:text-zinc-900 shadow-sm'} text-[10px] md:text-xs font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-2 group/help`}
                  >
                    {language === 'ko' ? '❓ 어떻게 사용하나요?' : '❓ How does this work?'}
                    <span className="opacity-0 group-hover/help:opacity-100 group-hover/help:translate-x-1 transition-all">→</span>
                  </button>
                </div>
              </>
            )}
          </div>
          <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileChange} disabled={isProcessing || isLocked} />
        </div>
      </div>
    );
  };

  const renderFeatureBanner = () => {
    const banners = [
      {
        id: 'feedback',
        label: t('lbl_feedback'),
        title: t('lbl_share_ideas'),
        tooltip: t('tt_feedback'),
        emoji: '✨',
        onClick: () => setShowFeedbackModal(true),
        color: isNight ? 'text-indigo-400' : 'text-orange-400'
      },
      {
        id: 'guide',
        label: t('lbl_quick_guide'),
        title: t('btn_walkthrough'),
        tooltip: t('tt_guide'),
        emoji: '▶️',
        onClick: () => setShowVideoModal(true),
        color: 'text-indigo-400'
      },
      {
        id: 'resource',
        label: t('lbl_resource'),
        title: t('res_title'),
        tooltip: t('tt_resource'),
        emoji: '📢',
        onClick: () => setShowFlyerModal(true),
        color: 'text-orange-400'
      }
    ];

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 lg:gap-6 mb-8 md:mb-16 animate-fade-in-up w-full px-2 max-w-5xl mx-auto">
        {banners.map((banner) => (
          <button
            key={banner.id}
            onClick={banner.onClick}
            title={banner.tooltip}
            className="group bg-white/5 hover:bg-white/10 border border-white/10 p-5 md:p-8 rounded-[2rem] flex items-center gap-4 md:gap-6 transition-all text-left w-full h-full backdrop-blur-sm"
          >
          <div className={`w-10 h-10 md:w-16 md:h-16 rounded-xl md:rounded-2xl flex-shrink-0 ${isNight ? 'bg-white/5 border-white/10' : 'bg-white border-zinc-200'} flex items-center justify-center text-xl md:text-3xl shadow-xl group-hover:scale-110 transition-all duration-300`}>
              {banner.emoji}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-[9px] md:text-xs font-black uppercase tracking-[0.2em] ${banner.color} mb-1 opacity-90`}>
                {banner.label}
              </p>
              <h4 className={`text-sm md:text-xl font-bold ${isNight ? 'text-white' : 'text-zinc-900'} font-korean truncate leading-tight`}>
                {banner.title}
              </h4>
            </div>
          </button>
        ))}
      </div>
    );
  };

  if (isAuthenticated && user) {
    const isPro = user.plan === 'pro';
    const today = new Date().toISOString().split('T')[0];
    const isNewDay = user?.lastScanDate !== today;
    const maxScans = user?.maxScansPerDay || 3;
    const scansUsed = isNewDay ? 0 : (user?.scansUsedToday || 0);
    const remainingCount = Math.max(0, maxScans - scansUsed);
    const remaining = isPro ? '∞' : remainingCount.toString();

    const isNewQuestionDay = user?.lastQuestionDate !== today;
    const maxQuestions = user?.maxQuestionsPerDay || 5;
    const questionsUsed = isNewQuestionDay ? 0 : (user?.questionsUsedToday || 0);
    const remainingQuestionsCount = Math.max(0, maxQuestions - questionsUsed);
    const remainingQuestions = isPro ? '∞' : remainingQuestionsCount.toString();

    return (
      <div className="min-h-full pt-12 md:pt-32 pb-20 px-4 md:px-10 max-w-7xl mx-auto flex flex-col items-center animate-fade-in relative">
        {showFeedbackModal && <FeedbackModal onClose={() => setShowFeedbackModal(false)} />}
        {showVideoModal && renderVideoWalkthroughModal()}
        {showFlyerModal && <FlyerModal onClose={() => setShowFlyerModal(false)} isNight={isNight} />}
        <AskChekkiAnswerModal 
          answer={askAnswer} 
          isAsking={isAskAsking} 
          question={askAnsweredQuestion}
          isAuthenticated={isAuthenticated}
          language={language}
          history={askHistory}
          onClose={() => { setAskAnswer(null); setAskAnsweredQuestion(''); setAskHistory([]); }}
          openLoginModal={openLoginModal}
          onFollowUp={handleAskSubmit}
          isNight={isNight}
        />

        <div className="w-full max-w-5xl flex flex-col items-center text-center mb-6 md:mb-16 gap-4 md:gap-10 px-4">
          <div className="space-y-2 md:space-y-8">
            {user.schoolName && (
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-1 shadow-xl backdrop-blur-sm">
                <span className="text-xs">🏫</span>
                <span className="text-[8px] md:text-xs font-black text-indigo-400 uppercase tracking-[0.1em]">{user.schoolName}</span>
              </div>
            )}
            <h1 className={`text-3xl md:text-6xl lg:text-7xl font-black ${isNight ? 'text-white' : 'text-zinc-900'} font-display break-keep leading-tight`}>
              {t('dash_welcome')} <span className={`text-transparent bg-clip-text bg-gradient-to-r ${isNight ? 'from-indigo-400 to-purple-500' : 'from-orange-500 to-pink-500'}`}>{user.name}!</span>
            </h1>
            <p className={`${isNight ? 'text-zinc-400' : 'text-zinc-500'} font-bold font-korean text-sm md:text-3xl max-w-3xl mx-auto leading-relaxed break-keep opacity-80`}>{t('dash_subtitle')}</p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4">
            {isPro && user.schoolId && (
              <div className={`border rounded-full py-2.5 px-6 flex items-center gap-4 shadow-2xl transition-all duration-500 bg-indigo-500/10 border-white/20 backdrop-blur-md`}>
                <div className="flex items-center gap-2">
                  <span className="text-xs">🏫</span>
                  <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{user.schoolName || 'School Active'}</span>
                </div>
              </div>
            )}
            {!isPro && (
              <>
                {/* Scan Tracker */}
                <div className={`border rounded-xl md:rounded-[2rem] py-2 px-4 md:py-4 md:px-8 flex items-center gap-3 md:gap-4 shadow-2xl transition-all duration-500 hover:scale-105 bg-[#0F1014] border-white/10`}>
                  <div className={`text-[8px] md:text-[10px] uppercase font-black tracking-[0.1em] text-zinc-500`}>
                    {t('lbl_magic_left')}
                  </div>
                  <div className="w-px h-3 md:h-4 bg-white/10"></div>
                  <div className={`font-bold text-sm md:text-2xl font-display leading-none text-white`}>{remaining}</div>
                </div>

                {/* Question Tracker */}
                <div className={`border rounded-xl md:rounded-[2rem] py-2 px-4 md:py-4 md:px-8 flex items-center gap-3 md:gap-4 shadow-2xl transition-all duration-500 hover:scale-105 ${isNight ? 'bg-[#0F1014] border-white/10' : 'bg-white border-zinc-200'}`}>
                  <div className={`text-[8px] md:text-[10px] uppercase font-black tracking-[0.1em] ${isNight ? 'text-zinc-500' : 'text-zinc-400'}`}>
                    Ask Chekki Left
                  </div>
                  <div className={`w-px h-3 md:h-4 ${isNight ? 'bg-white/10' : 'bg-zinc-200'}`}></div>
                  <div className={`font-bold text-sm md:text-2xl font-display leading-none ${isNight ? 'text-white' : 'text-zinc-900'}`}>{remainingQuestions}</div>
                </div>
              </>
            )}
          </div>

          {!isPro && (
            <div 
              onClick={() => setShowPaywall(true)}
              className="w-full max-w-xl mx-auto mt-6 px-5 py-4 rounded-3xl bg-gradient-to-r from-orange-500/10 via-pink-500/10 to-red-500/10 border border-orange-500/30 hover:border-orange-500/50 shadow-lg cursor-pointer transform hover:scale-[1.02] active:scale-95 transition-all duration-300 flex items-center justify-between gap-4 animate-fade-in-up"
            >
              <div className="flex items-center gap-3 text-left">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-orange-500 to-pink-500 flex items-center justify-center text-xl shadow-md shadow-orange-500/20 flex-shrink-0 animate-bounce">
                  ✨
                </div>
                <div>
                  <h4 className="text-xs md:text-sm font-black text-white leading-tight font-display">
                    {language === 'ko' ? 'Chekki PRO 7일 무료 체험' : 'Chekki PRO 7-Day Free Trial'}
                  </h4>
                  <p className="text-[10px] md:text-xs text-zinc-400 font-medium font-korean leading-snug mt-0.5">
                    {language === 'ko' ? '무제한 문제 스캔 및 질문하기 기능 제공' : 'Unlock unlimited scans, questions, and all premium features.'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-[10px] md:text-xs font-black text-white shadow-md shadow-orange-500/10 transition-colors whitespace-nowrap">
                <span>{language === 'ko' ? '무료 체험 시작' : 'Start Trial'}</span>
                <span>→</span>
              </div>
            </div>
          )}
        </div>

        <div className="w-full max-w-4xl mx-auto flex flex-col gap-4 md:gap-10 px-4">
          {minimal ? null : <AskChekkiBar 
            query={askQuery} 
            setQuery={setAskQuery} 
            onSubmit={handleAskSubmit} 
            isAsking={isAskAsking} 
            language={language}
            isNight={isNight}
          />}
          {renderDropZone("large")}
          {minimal ? null : renderFeatureBanner()}
        </div>
        <p className="mt-8 text-zinc-600 text-[9px] md:text-sm font-black uppercase tracking-[0.2em] text-center opacity-60">{t('supported_formats')}</p>
      </div>
    );
  }

  return (
    <div className="min-h-full flex flex-col pt-12 md:pt-32 pb-20 px-4 md:px-10 max-w-7xl mx-auto flex flex-col items-center animate-fade-in relative">
      {showFeedbackModal && <FeedbackModal onClose={() => setShowFeedbackModal(false)} />}
      {showLegal && <LegalModal type={showLegal} onClose={() => setShowLegal(null)} isNight={isNight} />}
      {showVideoModal && renderVideoWalkthroughModal()}
      {showFlyerModal && <FlyerModal onClose={() => setShowFlyerModal(false)} isNight={isNight} />}
      <AskChekkiAnswerModal 
        answer={askAnswer} 
        isAsking={isAskAsking} 
        question={askAnsweredQuestion}
        isAuthenticated={isAuthenticated}
        language={language}
        history={askHistory}
        onClose={() => { setAskAnswer(null); setAskAnsweredQuestion(''); setAskHistory([]); }}
        openLoginModal={openLoginModal}
        onFollowUp={handleAskSubmit}
        isNight={isNight}
      />

      <div className="relative w-full max-w-7xl mx-auto px-4 md:px-6 flex flex-col items-center mb-6 md:mb-12 mt-8 md:mt-16">
        <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1000px] h-[500px] ${isNight ? 'bg-indigo-900/20' : 'bg-brand-purple/10'} rounded-full blur-[60px] md:blur-[180px] -z-10 pointer-events-none opacity-20 mix-blend-screen`}></div>

        <div className="text-center w-full max-w-4xl">
          {/* Premium 7-Day Free Trial Banner */}
          <div 
            onClick={openLoginModal}
            className={`inline-flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-full mb-6 cursor-pointer transform hover:scale-[1.02] active:scale-95 transition-all duration-300 border ${
              isNight 
                ? 'bg-gradient-to-r from-orange-500/10 via-pink-500/10 to-red-500/10 border-orange-500/20 hover:border-orange-500/40 shadow-lg shadow-orange-500/5' 
                : 'bg-gradient-to-r from-orange-500/5 via-pink-500/5 to-red-500/5 border-orange-500/15 hover:border-orange-500/35 shadow-sm'
            }`}
          >
            <span className="text-[10px] md:text-xs animate-pulse">🎁</span>
            <span className={`text-[9px] md:text-xs font-black uppercase tracking-wider ${isNight ? 'text-zinc-300' : 'text-zinc-700'}`}>
              {language === 'ko' ? '7일 무료 체험 지금 시작하세요' : 'Start your 7-Day Free Trial now'}
            </span>
            <div className="flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-gradient-to-r from-orange-500 to-pink-500 text-[8px] md:text-[9px] font-black text-white shadow-md shadow-orange-500/10">
              <span>{language === 'ko' ? '자세히 보기' : 'Try Free'}</span>
              <span>→</span>
            </div>
          </div>

          <h1 className={`text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black ${isNight ? 'text-white' : 'text-zinc-900'} font-display mb-2 md:mb-6 tracking-tight drop-shadow-2xl whitespace-pre-line leading-[1.05] break-keep`}>
            {isNight ? (
              <span className={`text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-600`}>{t('hero_title_night')}</span>
            ) : (
              language === 'ko' ? (
                <>숙제 전쟁 끝, <br /> <span className={`text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-pink-500`}>웃으며 공부하세요</span></>
              ) : (
                <>Peaceful <br /> <span className={`text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-pink-500`}>Homework Prep.</span></>
              )
            )}
          </h1>
          
          <div className="flex flex-col md:flex-row gap-4 md:gap-8 justify-center items-center w-full max-w-md md:max-w-2xl mx-auto">
          </div>
        </div>
      </div>

      <div className="w-full max-w-4xl mx-auto px-4">
        {renderDropZone("large")}
      </div>


      {/* Floating Tools Trigger */}
      {!minimal && (
        <div className="fixed bottom-24 right-6 z-40">
          <button 
            onClick={() => setShowTools(!showTools)}
            className={`w-16 h-16 rounded-full flex items-center justify-center transition-all bg-zinc-900 border border-white/10 shadow-2xl hover:scale-110 active:scale-95 ${showTools ? 'rotate-45 bg-orange-500 border-orange-400' : ''}`}
          >
            {showTools ? <span className="text-3xl text-white">×</span> : <span className="text-2xl">🧰</span>}
          </button>
        </div>
      )}

      {/* Tools Overlay (Progressive Disclosure) */}
      {showTools && (
        <div className="fixed inset-0 z-30 bg-black/80 backdrop-blur-3xl animate-fade-in flex flex-col p-6 md:p-12 overflow-y-auto">
          <div className="max-w-4xl mx-auto w-full pt-12 md:pt-24 space-y-12 mb-20">
            <div className="text-center space-y-4">
              <h3 className="text-2xl md:text-5xl font-black text-white uppercase tracking-tighter">Chekki Toolkit</h3>
              <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px] md:text-sm">Advanced assistance for curious parents</p>
            </div>
            
            <div className={`bg-zinc-900/50 border border-white/5 rounded-[2.5rem] md:rounded-[4rem] p-6 md:p-12 space-y-8 shadow-2xl`}>
              <div className="space-y-4">
                <h4 className="text-lg md:text-2xl font-black text-orange-500 uppercase tracking-tight flex items-center gap-3">
                  <span>🤔</span> Grammar Q&A
                </h4>
                <AskChekkiBar 
                  query={askQuery} 
                  setQuery={setAskQuery} 
                  onSubmit={handleAskSubmit} 
                  isAsking={isAskAsking} 
                  language={language}
                  isNight={isNight}
                />
              </div>

              <div className="w-full h-px bg-white/5"></div>

              <div className="space-y-6">
                <h4 className="text-lg md:text-2xl font-black text-blue-500 uppercase tracking-tight flex items-center gap-3">
                  <span>📚</span> Parent Resources
                </h4>
                {renderFeatureSection()}
              </div>
            </div>
            
            <button 
              onClick={() => setShowTools(false)}
              className="w-full py-6 rounded-3xl bg-zinc-800 text-zinc-400 font-black uppercase tracking-widest hover:bg-zinc-700 transition-colors"
            >
              Close Toolkit
            </button>
          </div>
        </div>
      )}


    </div>
  );
};
