
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { compressImage } from '../utils/imageUtils';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { ChekkiMascot } from './Icons';
import { toJpeg } from 'html-to-image';
import { ASSETS } from '../constants';
import { SCREENSHOT_MODE } from '../config';
import { FeedbackModal } from './FeedbackModal';
import { LegalType } from '../types';
const LegalModal = React.lazy(() => import('./LegalModal').then(module => ({ default: module.LegalModal })));
import { FlyerModal } from './FlyerModal';
import { ScreenshotCarousel } from './ScreenshotCarousel';
import { askChekkiQuestion } from '../services/geminiService';
import { renderMarkdown } from '../utils/markdownUtils';


// --- SUB-COMPONENTS (Defined outside to prevent unmounting/focus loss on re-render) ---

interface AskChekkiBarProps {
  query: string;
  setQuery: (q: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isAsking: boolean;
  language: string;
}

const AskChekkiBar: React.FC<AskChekkiBarProps> = ({ query, setQuery, onSubmit, isAsking, language }) => (
  <form
    onSubmit={onSubmit}
    className="relative flex items-center bg-zinc-900 border border-white/10 hover:border-orange-500/30 focus-within:border-orange-500 rounded-[1.5rem] md:rounded-[2.2rem] pl-4 pr-6 py-2.5 md:pl-8 md:pr-10 md:py-5 shadow-2xl transition-all w-full"
  >
    <button
      type="submit"
      disabled={!query.trim() || isAsking}
      className={`shrink-0 mr-3 md:mr-4 transition-all duration-300 active:scale-90 ${query.trim() ? 'text-orange-500' : 'text-zinc-500'}`}
      title="Search"
    >
      {isAsking ? (
        <div className="w-5 h-5 md:w-6 md:h-6 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
      ) : (
        <svg className="w-5 h-5 md:w-7 md:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
        </svg>
      )}
    </button>
    <input
      type="text"
      value={query}
      onChange={e => setQuery(e.target.value)}
      placeholder={language === 'ko' ? "채키 공식 질문 (예: A와 An의 차이)..." : "Ask about grammar, rules, or homework..."}
      className="flex-1 bg-transparent text-white text-xs md:text-lg font-korean placeholder:text-zinc-600 focus:outline-none"
      enterKeyHint="send"
    />
  </form>
);

interface AskChekkiAnswerModalProps {
  answer: string | null;
  isAsking: boolean;
  question: string;
  isAuthenticated: boolean;
  language: string;
  onClose: () => void;
  openLoginModal: () => void;
}

const AskChekkiAnswerModal: React.FC<AskChekkiAnswerModalProps> = ({ 
  answer, isAsking, question, isAuthenticated, language, onClose, openLoginModal 
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!contentRef.current) return;
    setIsSaving(true);
    try {
      const dataUrl = await toJpeg(contentRef.current, { quality: 1, backgroundColor: '#09090b', pixelRatio: 2 });
      const { saveImageToDevice } = await import('../utils/exportUtils');
      await saveImageToDevice( 
        dataUrl, 
        'Chekki AI Tutor', 
        language === 'ko' ? '채키가 제 질문에 답변해줬어요!' : 'Chekki answered my question!', 
        'chekki-answer'
      );
    } catch (err) {
      console.error("Failed to save answer image", err);
      alert(language === 'ko' ? "저장에 실패했습니다." : "Failed to save the answer.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!answer && !isAsking) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-zinc-950 border border-white/10 rounded-[2.5rem] w-full max-w-lg max-h-[85dvh] flex flex-col shadow-2xl animate-fade-in-up overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🙋‍♂️</span>
            <div>
              <p className="text-[10px] text-orange-400 font-black uppercase tracking-widest">{language === 'ko' ? '채키의 답변' : 'Chekki says'}</p>
              <p className="text-white text-sm font-semibold font-korean line-clamp-1 mt-0.5 italic opacity-70">&ldquo;{question}&rdquo;</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white flex items-center justify-center transition-colors shrink-0 ml-3"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto px-6 py-5 flex-1 custom-scrollbar">
          {isAsking ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4 text-center">
              <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-orange-400 text-xs font-black uppercase tracking-widest animate-pulse">
                {language === 'ko' ? '답변을 생각하는 중...' : 'Thinking...'}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <div ref={contentRef} className="bg-zinc-900 border border-white/5 rounded-[2rem] p-6 md:p-8 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">
                  <span className="text-[120px]">💡</span>
                </div>
                
                <div className="relative z-10 flex gap-4 mb-6">
                  <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center border-2 border-white/10 shadow-lg shrink-0 overflow-hidden">
                    <ChekkiMascot className="w-full h-full scale-110" mood="happy" />
                  </div>
                  <div className="bg-zinc-800/80 p-3.5 rounded-2xl rounded-tl-none border border-white/5 w-fit max-w-[85%] self-start">
                    <p className="text-zinc-200 text-xs italic font-korean leading-relaxed">&quot;{question}&quot;</p>
                  </div>
                </div>

                <div className="relative z-10">
                  <div
                    className="text-zinc-100 text-sm md:text-base font-korean leading-relaxed prose-answer"
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(answer ?? '') }}
                  />
                  <div className="mt-8 pt-4 border-t border-white/5 flex items-center justify-between opacity-30">
                    <p className="text-[9px] uppercase font-black tracking-[0.2em] text-white">Chekki AI Tutor</p>
                    <span className="text-xs">⭐️</span>
                  </div>
                </div>
              </div>

              <div className="w-full flex gap-3 pt-2">
                 <button
                   onClick={handleSave}
                   disabled={isSaving}
                   className="flex-1 bg-white hover:bg-zinc-200 text-black py-4 rounded-2xl flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest transition-all active:scale-95 shadow-xl disabled:opacity-50"
                 >
                   {isSaving ? (
                     <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                   ) : (
                     <><span>📥</span> {language === 'ko' ? '이미지로 저장' : 'Save as Image'}</>
                   )}
                 </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer upsell for guests */}
        {!isAsking && !isAuthenticated && answer && (
          <div className="px-6 pb-6 pt-3 border-t border-white/5 bg-zinc-950/50">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[10px] text-orange-400 font-black uppercase tracking-widest mb-0.5">{language === 'ko' ? '도움이 되셨나요?' : 'Was this helpful?'}</p>
                <p className="text-[10px] text-zinc-500 font-korean truncate">
                  {language === 'ko' ? '무료 로그인하고 더 자세한 설명을 확인하세요!' : 'Login to unlock examples & deeper rules!'}
                </p>
              </div>
              <button
                onClick={() => { onClose(); openLoginModal(); }}
                className="text-[10px] bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl font-black uppercase tracking-wider whitespace-nowrap shadow-lg shadow-orange-500/20 transition-all active:scale-95"
              >
                {language === 'ko' ? '로그인' : 'Log In'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};


interface Props {
  onImageSelected: (base64: string) => void;
  isNight?: boolean;
}

export const CameraView: React.FC<Props> = ({ onImageSelected, isNight = false }) => {
  const { 
    user, isAuthenticated, openLoginModal, checkScanLimit, incrementScan, 
    checkQuestionLimit, incrementQuestion 
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
    <section className="py-12 md:py-32 px-4 max-w-7xl mx-auto w-full space-y-16 md:space-y-40">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-10">
        {[
          { id: 'ocr', emoji: '🎯', title: t('diff_ocr'), desc: t('diff_ocr_desc') },
          { id: 'script', emoji: '💌', title: t('diff_script'), desc: t('diff_script_desc') },
          { id: 'brand', emoji: '🏫', title: t('diff_brand'), desc: t('diff_brand_desc') }
        ].map(feat => (
          <div key={feat.id} className="p-6 md:p-10 rounded-[2rem] bg-zinc-900/40 border border-white/5 hover:border-orange-500/20 transition-all">
            <span className="text-3xl md:text-5xl block mb-4 md:mb-6">{feat.emoji}</span>
            <h3 className="text-lg md:text-2xl font-black text-white font-display mb-2 md:mb-3">{feat.title}</h3>
            <p className="text-zinc-400 text-xs md:text-base leading-relaxed font-korean opacity-80">{feat.desc}</p>
          </div>
        ))}
      </div>

      <div className="space-y-10 md:space-y-20">

        <h2 className="text-2xl md:text-6xl font-black text-white text-center font-display tracking-tight">{t('how_title')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-16">
          {[1, 2, 3].map(step => (
            <div key={step} className="flex flex-col items-center text-center group">
              <div className="w-12 h-12 md:w-20 md:h-20 rounded-[1.5rem] bg-orange-500 flex items-center justify-center text-xl md:text-3xl font-black text-white mb-4 md:mb-8 shadow-2xl shadow-orange-500/20 group-hover:scale-110 transition-transform">
                {step}
              </div>
              <h4 className="text-lg md:text-2xl font-bold text-white mb-2 md:mb-3 tracking-tight">{t(`how_step${step}`)}</h4>
              <p className="text-zinc-500 text-xs md:text-lg font-korean max-w-xs opacity-90 leading-relaxed">{t(`how_step${step}_desc`)}</p>
            </div>
          ))}
        </div>

        <div className="pt-20 md:pt-40 pb-2 md:pb-4 text-center space-y-2 md:space-y-4">

          <h2 className="text-3xl md:text-8xl font-black text-white font-display tracking-tight break-keep leading-tight">
            {t('magic_title')}
          </h2>
          <p className="text-[10px] md:text-base font-black text-zinc-500 uppercase tracking-[0.4em] opacity-90">
            {t('magic_subtitle')}
          </p>
        </div>

        <ScreenshotCarousel />

        {/* Why Chekki Section */}
        <div className="pt-20 md:pt-40 space-y-12 md:space-y-24">
          <h2 className="text-3xl md:text-6xl font-black text-white text-center font-display tracking-tight">
            {t('diff_title')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12 max-w-6xl mx-auto px-4">
            <div className="flex flex-col space-y-4 md:space-y-8 p-8 md:p-16 rounded-[2.5rem] md:rounded-[4rem] bg-zinc-900/30 border border-white/5 backdrop-blur-xl relative overflow-hidden group hover:bg-zinc-900/50 transition-all duration-500">
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-500">
                <span className="text-8xl md:text-[12rem]">✍️</span>
              </div>
              <span className="text-4xl md:text-7xl mb-2">✍️</span>
              <h3 className="text-2xl md:text-4xl font-black text-white tracking-tight leading-tight">{t('diff_ocr')}</h3>
              <p className="text-zinc-500 text-base md:text-2xl font-korean leading-relaxed opacity-90 max-w-md">{t('diff_ocr_desc')}</p>
            </div>
            <div className="flex flex-col space-y-4 md:space-y-8 p-8 md:p-16 rounded-[2.5rem] md:rounded-[4rem] bg-zinc-900/30 border border-white/5 backdrop-blur-xl relative overflow-hidden group hover:bg-zinc-900/50 transition-all duration-500">
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-500">
                <span className="text-8xl md:text-[12rem]">💌</span>
              </div>
              <span className="text-4xl md:text-7xl mb-2">💌</span>
              <h3 className="text-2xl md:text-4xl font-black text-white tracking-tight leading-tight">{t('diff_script')}</h3>
              <p className="text-zinc-500 text-base md:text-2xl font-korean leading-relaxed opacity-90 max-w-md">{t('diff_script_desc')}</p>
            </div>
          </div>
        </div>

        {/* Privacy Section */}
        <div className="pt-24 md:pt-60 pb-24 md:pb-60 space-y-12 md:space-y-24">
          <div className="text-center space-y-4 md:space-y-8">
            <h2 className="text-3xl md:text-6xl font-black text-white font-display tracking-tight">
              {t('trust_title')}
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-24 max-w-6xl mx-auto px-4">
            <div className="flex flex-col items-center text-center space-y-6 md:space-y-10 group">
              <div className="w-20 h-20 md:w-32 md:h-32 rounded-[2.5rem] bg-zinc-900/50 border border-white/10 flex items-center justify-center text-4xl md:text-6xl shadow-2xl group-hover:scale-110 transition-all duration-500 group-hover:border-white/20">
                🔒
              </div>
              <div className="space-y-4 md:space-y-6">
                <h3 className="text-2xl md:text-4xl font-black text-white tracking-tight">{t('trust_privacy')}</h3>
                <p className="text-zinc-500 text-base md:text-2xl font-korean leading-relaxed opacity-90 max-w-xl mx-auto">{t('trust_privacy_desc')}</p>
              </div>
            </div>
            <div className="flex flex-col items-center text-center space-y-6 md:space-y-10 group">
              <div className="w-20 h-20 md:w-32 md:h-32 rounded-[2.5rem] bg-zinc-900/50 border border-white/10 flex items-center justify-center text-4xl md:text-6xl shadow-2xl group-hover:scale-110 transition-all duration-500 group-hover:border-white/20">
                👥
              </div>
              <div className="space-y-4 md:space-y-6">
                <h3 className="text-2xl md:text-4xl font-black text-white tracking-tight">{t('trust_safety')}</h3>
                <p className="text-zinc-500 text-base md:text-2xl font-korean leading-relaxed opacity-90 max-w-xl mx-auto">{t('trust_safety_desc')}</p>
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

  const handleAskSubmit = useCallback(async (question: string) => {
    if (!question.trim()) return;
    
    // Check limit for authenticated free users
    if (isAuthenticated && !checkQuestionLimit()) {
      return;
    }

    setAskAnswer(null);
    setAskAnsweredQuestion(question);
    setIsAskAsking(true);
    
    try {
      const isGuest = !isAuthenticated;
      const response = await askChekkiQuestion(question, isGuest);
      setAskAnswer(response);
      
      // Increment only for authenticated users (backend also handles this)
      if (isAuthenticated) {
        await incrementQuestion();
      } else {
        // For guests, we can track usage in session if needed, but not required by current plan
      }
    } catch (error: any) {
      setAskAnswer(language === 'ko' ? '오류가 발생했습니다. 다시 시도해주세요.' : 'Something went wrong. Please try again.');
    } finally {
      setIsAskAsking(false);
    }
  }, [isAuthenticated, checkQuestionLimit, incrementQuestion, language]);

  const ClarityGuide = () => (
    <div className="flex flex-wrap justify-center gap-2 mt-6 md:mt-12 mb-4 px-2">
      {[
        { icon: '☀️', text: t('lbl_lighting'), tooltip: t('tt_lighting') },
        { icon: '📏', text: t('lbl_flat'), tooltip: t('tt_flat') },
        { icon: '🔍', text: t('lbl_sharp'), tooltip: t('tt_sharp') }
      ].map((tip, i) => (
        <div key={i} className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 md:px-5 md:py-2.5 rounded-xl backdrop-blur-md" title={tip.tooltip}>
          <span className="text-sm">{tip.icon}</span>
          <span className="text-[9px] md:text-xs font-black text-zinc-400 whitespace-nowrap uppercase tracking-[0.1em]">{tip.text}</span>
        </div>
      ))}
    </div>
  );

  const DropZone = ({ size = "large" }: { size?: "large" | "compact" }) => {
    const isGuestLocked = !isAuthenticated && guestUsed;
    const isLocked = isGuestLocked;

    const handleAction = () => {
      if (isGuestLocked) openLoginModal();
      else fileInputRef.current?.click();
    };

    return (
      <div className={`relative w-full ${size === 'large' ? 'min-h-[380px] md:min-h-[600px]' : 'h-full'} flex items-center justify-center py-6 md:py-16`}>
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[98%] h-[98%] border border-white/5 rounded-[2.5rem] md:rounded-[4.5rem] animate-[pulse_5s_ease-in-out_infinite] pointer-events-none`}></div>
        <div
          role="button"
          id="magic-drop-zone-inner"
          className={`relative w-full h-full max-w-3xl mx-auto ${isNight ? 'bg-indigo-950/20' : 'bg-zinc-900/40'} backdrop-blur-3xl rounded-[2.5rem] md:rounded-[4.5rem] border transition-all duration-700 flex flex-col items-center justify-center p-6 md:p-24 group cursor-pointer
              ${dragActive && !isLocked ? 'border-orange-500 shadow-[0_0_80px_rgba(249,115,22,0.2)] scale-[1.01]' : 'border-white/10 shadow-[0_40px_100px_rgba(0,0,0,0.5)] hover:border-white/20'}`}
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
                      src={isNight ? ASSETS.HERO_SLEEPY : ASSETS.MASCOT_HAPPY}
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
                  <h3 className="text-xl md:text-5xl font-black text-white font-display tracking-tight break-keep leading-tight">
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
                  <h3 className="text-xl md:text-6xl font-black text-white font-display tracking-tight break-keep leading-[1.2]">
                    {isProcessing ? t('processing') : t('drop_title')}
                  </h3>
                  <p className="text-zinc-500 font-bold font-korean text-xs md:text-2xl break-keep opacity-80 leading-relaxed">{t('drop_subtitle')}</p>
                </div>

                <ClarityGuide />

                <div className="mt-6 md:mt-16 flex flex-col items-center gap-2 group/btn" title={t('btn_upload')}>
                  <div className={`w-14 h-14 md:w-24 md:h-24 rounded-full ${isNight ? 'bg-indigo-600' : 'bg-orange-500'} flex items-center justify-center shadow-[0_15px_40px_rgba(249,115,22,0.3)] transition-all duration-300 group-hover:scale-110 group-hover:shadow-orange-500/60 border-2 border-white/20 active:scale-90`}>
                    <svg className="w-7 h-7 md:w-12 md:h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <span className="text-[9px] md:text-sm font-black text-zinc-500 uppercase tracking-[0.2em] group-hover:text-white transition-colors">{t('btn_upload')}</span>
                </div>
              </>
            )}
          </div>
          <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileChange} disabled={isProcessing || isLocked} />
        </div>
      </div>
    );
  };

  const FeatureBanner = () => {
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
            <div className="w-10 h-10 md:w-16 md:h-16 rounded-xl md:rounded-2xl flex-shrink-0 bg-white/5 border border-white/10 flex items-center justify-center text-xl md:text-3xl shadow-xl group-hover:scale-110 transition-all duration-300">
              {banner.emoji}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-[9px] md:text-xs font-black uppercase tracking-[0.2em] ${banner.color} mb-1 opacity-90`}>
                {banner.label}
              </p>
              <h4 className="text-sm md:text-xl font-bold text-white font-korean truncate leading-tight">
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
    const maxQuestions = user?.maxQuestionsPerDay || 2;
    const questionsUsed = isNewQuestionDay ? 0 : (user?.questionsUsedToday || 0);
    const remainingQuestionsCount = Math.max(0, maxQuestions - questionsUsed);
    const remainingQuestions = isPro ? '∞' : remainingQuestionsCount.toString();

    return (
      <div className="min-h-full pt-20 md:pt-44 pb-20 px-4 md:px-10 max-w-7xl mx-auto flex flex-col items-center animate-fade-in relative">
        {showFeedbackModal && <FeedbackModal onClose={() => setShowFeedbackModal(false)} />}
        {showVideoModal && <VideoWalkthroughModal />}
        {showFlyerModal && <FlyerModal onClose={() => setShowFlyerModal(false)} />}
        <AskChekkiAnswerModal 
          answer={askAnswer} 
          isAsking={isAskAsking} 
          question={askAnsweredQuestion}
          isAuthenticated={isAuthenticated}
          language={language}
          onClose={() => { setAskAnswer(null); setAskAnsweredQuestion(''); }}
          openLoginModal={openLoginModal}
        />

        <div className="w-full max-w-5xl flex flex-col items-center text-center mb-8 md:mb-24 gap-4 md:gap-14 px-4">
          <div className="space-y-2 md:space-y-8">
            {user.schoolName && (
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-1 shadow-xl backdrop-blur-sm">
                <span className="text-xs">🏫</span>
                <span className="text-[8px] md:text-xs font-black text-indigo-400 uppercase tracking-[0.1em]">{user.schoolName}</span>
              </div>
            )}
            <h1 className="text-3xl md:text-6xl lg:text-7xl font-black text-white font-display break-keep leading-tight">
              {t('dash_welcome')} <span className={`text-transparent bg-clip-text bg-gradient-to-r ${isNight ? 'from-indigo-400 to-purple-500' : 'from-orange-400 to-pink-500'}`}>{user.name}!</span>
            </h1>
            <p className="text-zinc-400 font-bold font-korean text-sm md:text-3xl max-w-3xl mx-auto leading-relaxed break-keep opacity-80">{t('dash_subtitle')}</p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4">
            {/* Scan Tracker */}
            <div className={`border rounded-xl md:rounded-[2rem] py-2 px-4 md:py-4 md:px-8 flex items-center gap-3 md:gap-4 shadow-2xl transition-all duration-500 hover:scale-105 ${isPro ? 'bg-orange-500/10 border-orange-500/30' : 'bg-[#0F1014] border-white/10'}`}>
              <div className={`text-[8px] md:text-[10px] uppercase font-black tracking-[0.1em] ${isPro ? 'text-orange-400' : 'text-zinc-500'}`}>
                {isPro ? t('lbl_pro_active') : t('lbl_magic_left')}
              </div>
              <div className="w-px h-3 md:h-4 bg-white/10"></div>
              <div className={`font-bold text-sm md:text-2xl font-display leading-none ${isPro ? 'text-orange-500 scale-110' : 'text-white'}`}>{remaining}</div>
            </div>

            {/* Question Tracker */}
            <div className={`border rounded-xl md:rounded-[2rem] py-2 px-4 md:py-4 md:px-8 flex items-center gap-3 md:gap-4 shadow-2xl transition-all duration-500 hover:scale-105 ${isPro ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-[#0F1014] border-white/10'}`}>
              <div className={`text-[8px] md:text-[10px] uppercase font-black tracking-[0.1em] ${isPro ? 'text-indigo-400' : 'text-zinc-500'}`}>
                {isPro ? "Unlimited Q & A" : "Ask Chekki Left"}
              </div>
              <div className="w-px h-3 md:h-4 bg-white/10"></div>
              <div className={`font-bold text-sm md:text-2xl font-display leading-none ${isPro ? 'text-indigo-400 scale-110' : 'text-white'}`}>{remainingQuestions}</div>
            </div>
          </div>
        </div>

        <div className="w-full max-w-4xl mx-auto flex flex-col gap-4 md:gap-10 px-4">
          <AskChekkiBar 
            query={askQuery} 
            setQuery={setAskQuery} 
            onSubmit={handleAskSubmit} 
            isAsking={isAskAsking} 
            language={language}
          />
          <DropZone size="large" />
          <FeatureBanner />
        </div>
        <p className="mt-8 text-zinc-600 text-[9px] md:text-sm font-black uppercase tracking-[0.2em] text-center opacity-60">{t('supported_formats')}</p>
      </div>
    );
  }

  return (
    <div className="min-h-full flex flex-col pt-6 md:pt-36 pb-20 overflow-x-hidden scroll-smooth">
      {showFeedbackModal && <FeedbackModal onClose={() => setShowFeedbackModal(false)} />}
      <React.Suspense fallback={null}>
        {showLegal && <LegalModal type={showLegal} onClose={() => setShowLegal(null)} />}
      </React.Suspense>
      {showVideoModal && <VideoWalkthroughModal />}
      {showFlyerModal && <FlyerModal onClose={() => setShowFlyerModal(false)} />}
      <AskChekkiAnswerModal 
        answer={askAnswer} 
        isAsking={isAskAsking} 
        question={askAnsweredQuestion}
        isAuthenticated={isAuthenticated}
        language={language}
        onClose={() => { setAskAnswer(null); setAskAnsweredQuestion(''); }}
        openLoginModal={openLoginModal}
      />

      <div className="relative max-w-7xl mx-auto px-4 md:px-6 grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-6 md:gap-24 items-center mb-12 md:mb-40">
        <div className={`absolute top-0 left-1/4 -translate-x-1/2 w-full md:w-[1000px] h-[700px] ${isNight ? 'bg-indigo-900/20' : 'bg-brand-purple/10'} rounded-full blur-[60px] md:blur-[180px] -z-10 pointer-events-none opacity-20 mix-blend-screen`}></div>

        <div className="w-full flex justify-center lg:justify-end items-center animate-fade-in-up order-1 lg:order-2 px-2 md:px-0 mt-8 lg:mt-0">
          <div className="relative w-full max-w-[180px] sm:max-w-[300px] md:max-w-[580px] lg:max-w-[720px] xl:max-w-[850px] aspect-square flex items-center justify-center lg:translate-x-10 lg:translate-y-6">
            <div className={`absolute inset-0 bg-gradient-to-tr ${isNight ? 'from-indigo-500/20 to-purple-500/20' : 'from-brand-orange/20 to-brand-purple/20'} rounded-full blur-[40px] md:blur-[140px] animate-pulse`}></div>
            <div className="w-full h-full relative z-10 transition-transform scale-100 md:scale-110 lg:scale-[1.2] xl:scale-[1.3]">
              <img src={isNight ? ASSETS.HERO_SLEEPY : ASSETS.HERO_IMAGE} alt="Chekki Hero" className="w-full h-full object-contain drop-shadow-[0_15px_40px_rgba(0,0,0,0.6)] animate-float filter brightness-110" />
            </div>
          </div>
        </div>

        <div className="w-full flex flex-col items-center lg:items-start text-center lg:text-left z-10 animate-fade-in-up order-2 lg:order-1 mt-2 lg:mt-0 px-2 md:px-0">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 mb-4 md:mb-12 backdrop-blur-md shadow-2xl self-center lg:self-start">
            <span className={`w-1.5 h-1.5 rounded-full ${isNight ? 'bg-indigo-500 shadow-[0_0_8px_#6366f1]' : 'bg-orange-500 shadow-[0_0_8px_#f97316]'} animate-pulse`}></span>
            <span className="text-[8px] md:text-sm font-black text-zinc-200 tracking-[0.1em] uppercase">{t('hero_badge')}</span>
          </div>
          <h1 className="text-2xl sm:text-4xl md:text-6xl lg:text-7xl xl:text-8xl font-black text-white font-display mb-4 md:mb-10 tracking-tight drop-shadow-2xl whitespace-pre-line leading-[1.1] break-keep">
            {isNight ? (
              <span className={`text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-600`}>{t('hero_title_night')}</span>
            ) : (
              language === 'ko' ? (
                <>숙제 전쟁 끝, <br /> <span className={`text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-pink-500`}>웃으며 공부하세요</span></>
              ) : (
                <h2 className="text-3xl md:text-5xl lg:text-6xl font-black text-white leading-[1.1] mb-6 animate-fade-in drop-shadow-2xl">
                  <>Peaceful <br /> <span className={`text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-pink-500`}>Homework Prep.</span></>
                </h2>
              )
            )}
          </h1>
          <p className="text-sm md:text-3xl text-zinc-400 max-w-2xl leading-relaxed mb-8 md:mb-20 font-korean font-medium break-keep opacity-90 mx-auto lg:mx-0">
            {isNight ? t('hero_desc_night') : t('hero_desc')}
          </p>

          <div className="flex flex-col md:flex-row gap-4 md:gap-8 justify-center lg:justify-start items-center w-full max-w-md md:max-w-2xl mx-auto lg:mx-0">
            <button onClick={openLoginModal} className="group bg-white text-black py-4 md:py-7 px-6 md:px-20 rounded-xl md:rounded-[2.5rem] font-black text-base md:text-4xl transition-all transform active:scale-95 shadow-[0_15px_40px_rgba(255,255,255,0.05)] font-display flex items-center justify-center gap-3 overflow-hidden w-full md:w-auto whitespace-nowrap min-w-fit">
              <span className="font-korean">{t('hero_cta_btn')}</span>
              <span className="text-xl md:text-5xl transition-transform group-hover:translate-x-2">→</span>
            </button>
            {!guestUsed && (
              <button
                onClick={() => {
                  const dropZone = document.getElementById('magic-drop-zone');
                  dropZone?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }}
                className="group py-4 md:py-6 px-6 md:px-16 rounded-xl md:rounded-[2rem] border border-white/10 bg-white/5 hover:bg-white/10 text-white font-black text-base md:text-2xl transition-all flex items-center justify-center gap-3 backdrop-blur-xl active:scale-95 w-full md:w-auto whitespace-nowrap min-w-fit"
              >
                <span className="text-orange-500 transition-transform group-hover:rotate-[360deg] duration-1000 text-lg md:text-3xl">✨</span>
                <span className="whitespace-nowrap">{t('hero_guest_cta')}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div id="magic-drop-zone" className="max-w-6xl mx-auto px-4 md:px-6 mb-16 md:mb-56 w-full relative pt-8 md:pt-32 flex flex-col gap-4 md:gap-10">
        <div className="w-full max-w-4xl mx-auto px-4">
          <AskChekkiBar 
            query={askQuery} 
            setQuery={setAskQuery} 
            onSubmit={handleAskSubmit} 
            isAsking={isAskAsking} 
            language={language}
          />
        </div>
        <DropZone size="large" />
        <p className="mt-8 text-zinc-600 text-[9px] md:text-sm font-black uppercase tracking-[0.2em] text-center opacity-40">{t('supported_formats')}</p>
      </div>

      <FeatureSection />

      <div className="mt-12 md:mt-40 pt-12 md:pt-24 border-t border-white/5 bg-zinc-950/50 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto px-4 md:px-6 pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-20 mb-12">
            <div className="space-y-4 text-[9px] md:text-sm text-zinc-500 font-korean leading-relaxed">
              <h4 className="text-white font-black text-lg md:text-2xl mb-4 font-display">Chekki (채키)</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2">
                <p>상호명: {t('biz_name')}</p>
                <p>대표자: Jason Benjamin (제이슨 벤자민)</p>
                <p>{t('biz_reg_num')}</p>
                <p>{t('biz_mail_order')}</p>
                <p className="md:col-span-2">주소: 서울특별시 종로구 종로 347, 롯데캐슬, 03113</p>
                <p className="md:col-span-2">{t('biz_hours')}</p>
                <p className="md:col-span-2">{t('biz_email')}</p>
              </div>
            </div>

            <div className="space-y-4 text-[9px] md:text-sm text-zinc-500 font-sans leading-relaxed lg:border-l lg:border-white/5 lg:pl-20">
              <h4 className="text-white font-black text-lg md:text-2xl mb-4 font-display">{t('biz_info_title')}</h4>
              <div className="grid grid-cols-1 gap-y-2">
                <p>Business Name: Chekki</p>
                <p>Representative: Jason Benjamin</p>
                <p>Business Registration Number: 814-14-03096</p>
                <p>Address: Jongno 347, Lotte Castle, Seoul 03113, South Korea</p>
                <p>Email: chekkihelp@gmail.com</p>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-8 border-t border-white/5 flex flex-col items-center gap-6">
            <div className="flex flex-wrap justify-center gap-4 md:gap-14 text-[9px] md:text-sm text-zinc-400 font-black uppercase tracking-[0.2em]">
              <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="hover:text-white transition-colors">{t('nav_home')}</button>
              <button onClick={() => setShowPaywall(true)} className="hover:text-white transition-colors">{t('nav_pricing')}</button>
              <button onClick={() => setShowLegal('terms')} className="hover:text-white transition-colors">{t('nav_terms')}</button>
              <button onClick={() => setShowLegal('privacy')} className="hover:text-white transition-colors">{t('nav_privacy')}</button>
              <button onClick={() => setShowLegal('support')} className="hover:text-white transition-colors">Support</button>
              <button onClick={() => setShowLegal('refund')} className="hover:text-white transition-colors">{t('nav_refund')}</button>
              <button onClick={() => setShowFeedbackModal(true)} className="hover:text-white transition-colors">{t('nav_contact')}</button>
            </div>
            <p className="text-[9px] md:text-sm text-zinc-600 font-bold uppercase tracking-[0.3em] text-center">{t('footer_text')}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
