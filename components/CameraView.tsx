import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useToast } from '../contexts/ToastContext';
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
import { CropModal } from './CropModal';

interface Props {
  onImageSelected: (base64: string) => void;
  isNight?: boolean;
  minimal?: boolean;
  onOpenHelp?: () => void;
}

export const CameraView: React.FC<Props> = ({
  onImageSelected,
  isNight = false,
  minimal = false,
  onOpenHelp,
}) => {
  const { showToast } = useToast();
  const {
    user,
    isAuthenticated,
    openLoginModal,
    checkScanLimit,
    incrementScan,
    checkQuestionLimit,
    incrementQuestion,
    setShowPaywall,
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
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);

  const { t, language } = useLanguage();

  const [guestUsed, setGuestUsed] = useState(false);
  const [classCodeBannerDismissed, setClassCodeBannerDismissed] = useState(
    () => localStorage.getItem('chekki_classcode_banner_dismissed') === '1'
  );

  const dismissClassCodeBanner = () => {
    localStorage.setItem('chekki_classcode_banner_dismissed', '1');
    setClassCodeBannerDismissed(true);
  };

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
      setImageToCrop(base64Url);
    } catch (e) {
      console.error('Image processing failed.');
      showToast({ message: 'Error processing image. Please try another photo.', type: 'error' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) processFile(e.target.files[0]);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) processFile(e.dataTransfer.files[0]);
  };

  const renderVideoWalkthroughModal = () => (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/95 backdrop-blur-2xl"
        onClick={() => setShowVideoModal(false)}
      ></div>
      <div className="relative w-full max-w-5xl aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl border border-white/10 animate-fade-in-up">
        <video src={ASSETS.VIDEO_WALKTHROUGH} controls autoPlay className="w-full h-full" />
        <button
          onClick={() => setShowVideoModal(false)}
          className="absolute top-6 right-6 md:top-8 md:right-8 bg-black/50 hover:bg-black text-white p-3 rounded-full transition-colors z-10 border border-white/10 backdrop-blur-md"
        >
          ✕
        </button>
      </div>
    </div>
  );

  const renderFeatureSection = () => null;

  // State for the inline Ask Chekki answer modal
  const [askQuery, setAskQuery] = useState('');
  const [askAnswer, setAskAnswer] = useState<string | null>(null);
  const [askAnsweredQuestion, setAskAnsweredQuestion] = useState('');
  const [isAskAsking, setIsAskAsking] = useState(false);
  const [askHistory, setAskHistory] = useState<ChatTurn[]>([]);
  const [showTools, setShowTools] = useState(false);

  const handleAskSubmit = useCallback(
    async (question: string) => {
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
        const response = await askChekkiQuestion(
          question,
          language,
          isGuest,
          undefined,
          askHistory
        );
        setAskAnswer(response);

        setAskHistory((prev) => [
          ...prev,
          { role: 'user' as const, text: question },
          { role: 'model' as const, text: response },
        ]);

        // Increment only for authenticated users (backend also handles this)
        if (isAuthenticated) {
          await incrementQuestion();
        }
      } catch (error: any) {
        setAskAnswer(
          language === 'ko'
            ? '오류가 발생했습니다. 다시 시도해주세요.'
            : 'Something went wrong. Please try again.'
        );
      } finally {
        setIsAskAsking(false);
      }
    },
    [isAuthenticated, checkQuestionLimit, incrementQuestion, language, askHistory, isAskAsking]
  );

  const renderClarityGuide = () => {
    const tips = [
      {
        emoji: '💡',
        label: t('lbl_lighting'),
        desc: t('tt_lighting'),
      },
      {
        emoji: '📏',
        label: t('lbl_flat'),
        desc: t('tt_flat'),
      },
      {
        emoji: '🔍',
        label: t('lbl_sharp'),
        desc: t('tt_sharp'),
      },
    ];

    return (
      <div className="w-full max-w-md md:max-w-xl mx-auto mt-4 mb-2 grid grid-cols-3 gap-2 px-1">
        {tips.map((tip, idx) => (
          <div
            key={idx}
            className={`relative group p-2.5 rounded-2xl border flex flex-col items-center text-center gap-1 transition-all ${
              isNight
                ? 'bg-zinc-900/30 border-white/5 hover:bg-zinc-900/50'
                : 'bg-orange-50/20 border-orange-100/30 shadow-[0_4px_12px_rgba(0,0,0,0.015)] lg:hover:border-orange-500/30'
            }`}
          >
            <span className="text-sm md:text-base leading-none">{tip.emoji}</span>
            <span
              className={`text-[9px] md:text-xs font-black uppercase tracking-widest leading-none ${isNight ? 'text-zinc-400' : 'text-zinc-800'}`}
            >
              {tip.label}
            </span>
          </div>
        ))}
      </div>
    );
  };

  const renderTrustAndSteps = () => (
    <div className="mt-8 md:mt-12 w-full space-y-6 animate-fade-in-up">
      {/* 3-Step Flow Strip */}
      <div
        className={`grid grid-cols-1 md:grid-cols-3 gap-4 p-5 md:p-6 rounded-3xl border ${isNight ? 'bg-zinc-900/30 border-white/5' : 'bg-white border-zinc-150 shadow-[0_4px_20px_rgba(0,0,0,0.015)]'}`}
      >
        {[
          {
            step: '①',
            title: language === 'ko' ? '학습지 촬영' : 'Snap Worksheet',
            desc:
              language === 'ko'
                ? '카메라로 영어 학습지를 찍어주세요'
                : 'Take a photo of the worksheet',
          },
          {
            step: '②',
            title: language === 'ko' ? '실시간 분석' : 'Chekki Reads',
            desc:
              language === 'ko'
                ? '채키가 문제와 정답을 분석합니다'
                : 'Chekki analyzes questions & answers',
          },
          {
            step: '③',
            title: language === 'ko' ? '맞춤 지도' : 'Korean Guides',
            desc:
              language === 'ko'
                ? '한국어 가이드와 발음을 확인하세요'
                : 'Get step-by-step guides in Korean',
          },
        ].map((item, idx) => (
          <div key={idx} className="flex items-start gap-2.5 text-left font-sans">
            <span
              className={`text-base font-black ${isNight ? 'text-brand-purple' : 'text-orange-500'}`}
            >
              {item.step}
            </span>
            <div>
              <h4
                className={`text-xs md:text-sm font-black ${isNight ? 'text-zinc-200' : 'text-zinc-800'} tracking-tight`}
              >
                {item.title}
              </h4>
              <p
                className={`text-[10px] md:text-xs font-semibold ${isNight ? 'text-zinc-500' : 'text-zinc-400'} font-korean mt-0.5 leading-tight`}
              >
                {item.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderDropZone = (size: 'large' | 'compact' = 'large') => {
    const isGuestLocked = !isAuthenticated && guestUsed;
    const isLocked = isGuestLocked;

    const handleAction = () => {
      if (isGuestLocked) openLoginModal();
      else fileInputRef.current?.click();
    };

    return (
      <div
        className={`relative w-full ${size === 'large' ? 'min-h-[350px] md:min-h-[500px]' : 'h-full'} flex items-center justify-center py-4 md:py-8`}
      >
        <div
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[98%] h-[98%] border ${isNight ? 'border-white/5' : 'border-zinc-200/50'} rounded-[2.5rem]  pointer-events-none`}
        ></div>
        <div
          id="magic-drop-zone-inner"
          className={`relative w-full h-full max-w-3xl mx-auto ${isNight ? 'bg-[#050505]/40 border-white/10 shadow-2xl' : 'bg-white border-zinc-200 shadow-xl'} backdrop-blur-3xl rounded-[2.5rem] border transition-all duration-200 ease-[var(--ease-premium)] flex flex-col items-center justify-center p-5 md:p-12 group
              ${dragActive && !isLocked ? 'border-orange-500 shadow-md scale-[1.02]' : 'lg:hover:border-orange-500/30'}`}
          onDragEnter={isLocked ? undefined : handleDrag}
          onDragLeave={isLocked ? undefined : handleDrag}
          onDragOver={isLocked ? undefined : handleDrag}
          onDrop={isLocked ? undefined : handleDrop}
        >
          {!isAuthenticated && !guestUsed && (
            <div className="absolute top-4 md:top-10 z-40  pointer-events-none">
              <div className="bg-orange-500 text-white text-[8px] md:text-xs font-black px-4 py-2 rounded-full uppercase tracking-widest shadow-sm flex items-center gap-2 border border-white/20 whitespace-nowrap">
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping"></span>
                {t('guest_scan_badge')}
              </div>
            </div>
          )}

          <div className="relative z-10 flex flex-col items-center text-center w-full pt-4">
            <div
              className={`${size === 'large' ? 'w-24 h-24 md:w-44 md:h-44' : 'w-24 h-24'} mb-3 md:mb-6 relative transition-all duration-700 ${isLocked ? 'blur-md opacity-40 grayscale scale-90' : 'group-hover:scale-[1.02]'}`}
            >
              {isProcessing ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div
                    className={`w-10 h-10 md:w-16 md:h-16 border-[3px] ${isNight ? 'border-indigo-500' : 'border-orange-500'} border-t-transparent rounded-full animate-spin shadow-2xl`}
                  ></div>
                </div>
              ) : (
                <div className="w-full h-full  flex items-center justify-center">
                  {!imgError ? (
                    <img
                      src={ASSETS.HERO_IMAGE}
                      alt="Chekki Mascot"
                      className="w-full h-full object-contain drop-shadow-lg filter brightness-110 transition-opacity duration-700"
                      onLoad={() => setMascotLoaded(true)}
                      onError={() => setImgError(true)}
                      loading="eager"
                    />
                  ) : (
                    <ChekkiMascot
                      className="w-full h-full drop-shadow-2xl"
                      mood={isNight ? 'sleeping' : 'happy'}
                    />
                  )}
                </div>
              )}
            </div>

            {isLocked ? (
              <div className="animate-fade-in space-y-4 px-4">
                <div className="space-y-1">
                  <h3
                    className={`text-xl md:text-5xl font-black ${isNight ? 'text-white' : 'text-zinc-900'} font-display tracking-tight break-keep leading-tight`}
                  >
                    {t('guest_used_title')}
                  </h3>
                  <p className="text-zinc-400 font-bold font-korean text-xs md:text-2xl max-w-md mx-auto leading-relaxed opacity-80">
                    {t('guest_used_desc')}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openLoginModal();
                  }}
                  className={`bg-white text-black px-8 py-3 md:px-16 md:py-6 rounded-xl md:rounded-2xl font-black text-sm md:text-2xl transition-all active:scale-[0.97] uppercase tracking-wider w-full md:w-auto shadow-xl`}
                >
                  {t('login')}
                </button>
              </div>
            ) : (
              <>
                <div className="space-y-1 max-w-lg px-2">
                  <h3
                    className={`text-xl md:text-6xl font-black ${isNight ? 'text-white' : 'text-zinc-900'} font-display tracking-tight break-keep leading-[1.2] ${isProcessing ? 'text-orange-500 italic' : ''}`}
                  >
                    {isProcessing
                      ? language === 'ko'
                        ? '채점 중... 칭찬만 준비하세요! 💖'
                        : "Grading... We've got this! 💖"
                      : t('drop_title')}
                  </h3>
                  <p
                    className={`${isNight ? 'text-zinc-500' : 'text-zinc-400'} font-bold font-korean text-xs md:text-2xl break-keep opacity-80 leading-relaxed`}
                  >
                    {t('drop_subtitle')}
                  </p>
                </div>

                {renderClarityGuide()}

                <button
                  type="button"
                  onClick={handleAction}
                  className="mt-4 md:mt-6 flex flex-col items-center gap-3 group/btn cursor-pointer bg-transparent border-0 p-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orange-500 rounded-2xl"
                  title={t('btn_guest_scan')}
                >
                  <div
                    className={`w-16 h-16 md:w-28 md:h-28 rounded-full ${isNight ? 'bg-[#1a1a1a] border-white/10' : 'bg-orange-500 border-white/20'} flex items-center justify-center shadow-md transition-all duration-200 ease-[var(--ease-premium)] group-hover:scale-110 group-hover:shadow-lg border-4 active:scale-90 `}
                  >
                    <svg
                      className="w-8 h-8 md:w-14 md:h-14 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  </div>
                  <span
                    className={`text-xs md:text-lg font-black tracking-wider transition-colors ${isNight ? 'text-zinc-500 group-hover:text-white' : 'text-zinc-400 group-hover:text-zinc-900'}`}
                  >
                    {isAuthenticated ? t('btn_upload') : t('btn_guest_scan')}
                  </span>
                  <div
                    className={`mt-2 flex items-center justify-center gap-1.5 text-[10px] md:text-xs font-semibold ${isNight ? 'text-zinc-500' : 'text-zinc-400'} font-korean opacity-85`}
                  >
                    <span>🔒</span>
                    <span>{t('supported_formats')}</span>
                  </div>
                </button>

                <div className="mt-4 animate-fade-in-up">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenHelp?.();
                    }}
                    className={`px-6 py-2.5 rounded-full border ${isNight ? 'bg-white/5 border-white/10 text-zinc-400 hover:text-white hover:bg-white/10' : 'bg-white border-zinc-200 text-zinc-500 hover:text-zinc-900 shadow-sm'} text-[10px] md:text-xs font-black tracking-wider transition-all duration-200 flex items-center gap-2 group/help`}
                  >
                    {language === 'ko' ? '❓ 3단계 사용 가이드 보기' : '❓ View 3-Step Scan Guide'}
                    <span className="opacity-0 group-hover/help:opacity-100 group-hover/help:translate-x-1 transition-all">
                      →
                    </span>
                  </button>
                </div>
              </>
            )}
          </div>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileChange}
            disabled={isProcessing || isLocked}
          />
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
        color: isNight ? 'text-indigo-400' : 'text-orange-400',
      },
      {
        id: 'guide',
        label: t('lbl_quick_guide'),
        title: t('btn_walkthrough'),
        tooltip: t('tt_guide'),
        emoji: '▶️',
        onClick: () => setShowVideoModal(true),
        color: 'text-indigo-400',
      },
      {
        id: 'resource',
        label: t('lbl_resource'),
        title: t('res_title'),
        tooltip: t('tt_resource'),
        emoji: '📢',
        onClick: () => setShowFlyerModal(true),
        color: 'text-orange-400',
      },
    ];

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 lg:gap-6 mb-8 md:mb-16 animate-fade-in-up w-full px-2 max-w-5xl mx-auto">
        {banners.map((banner) => (
          <button
            key={banner.id}
            onClick={banner.onClick}
            title={banner.tooltip}
            className="group bg-white/5 hover:bg-white/10 border border-white/10 p-5 md:p-8 rounded-3xl flex items-center gap-4 md:gap-6 transition-all text-left w-full h-full backdrop-blur-sm"
          >
            <div
              className={`w-10 h-10 md:w-16 md:h-16 rounded-xl md:rounded-2xl flex-shrink-0 ${isNight ? 'bg-white/5 border-white/10' : 'bg-white border-zinc-200'} flex items-center justify-center text-xl md:text-3xl shadow-xl group-hover:scale-110 transition-all duration-200`}
            >
              {banner.emoji}
            </div>
            <div className="flex-1 min-w-0">
              <p
                className={`text-[9px] md:text-xs font-black uppercase tracking-[0.2em] ${banner.color} mb-1 opacity-90`}
              >
                {banner.label}
              </p>
              <h4
                className={`text-sm md:text-xl font-bold ${isNight ? 'text-white' : 'text-zinc-900'} font-korean truncate leading-tight`}
              >
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
    const scansUsed = isNewDay ? 0 : user?.scansUsedToday || 0;
    const remainingCount = Math.max(0, maxScans - scansUsed);
    const remaining = isPro ? '∞' : remainingCount.toString();

    const isNewQuestionDay = user?.lastQuestionDate !== today;
    const maxQuestions = user?.maxQuestionsPerDay || 5;
    const questionsUsed = isNewQuestionDay ? 0 : user?.questionsUsedToday || 0;
    const remainingQuestionsCount = Math.max(0, maxQuestions - questionsUsed);
    const remainingQuestions = isPro ? '∞' : remainingQuestionsCount.toString();

    return (
      <div className="min-h-full pt-4 md:pt-8 pb-10 px-4 md:px-10 max-w-7xl xl:max-w-[1440px] 2xl:max-w-[1600px] mx-auto flex flex-col items-center animate-fade-in relative">
        {imageToCrop && (
          <CropModal
            imageSrc={imageToCrop}
            isNight={isNight}
            onClose={() => setImageToCrop(null)}
            onCropComplete={(croppedDataUrl) => {
              const base64Data = croppedDataUrl.split(',')[1];
              onImageSelected(base64Data);
              setImageToCrop(null);
            }}
            onGradeOriginal={() => {
              const base64Data = imageToCrop.split(',')[1];
              onImageSelected(base64Data);
              setImageToCrop(null);
            }}
          />
        )}
        {showFeedbackModal && <FeedbackModal onClose={() => setShowFeedbackModal(false)} />}
        {showVideoModal && renderVideoWalkthroughModal()}
        {showFlyerModal && (
          <FlyerModal onClose={() => setShowFlyerModal(false)} isNight={isNight} />
        )}
        <AskChekkiAnswerModal
          answer={askAnswer}
          isAsking={isAskAsking}
          question={askAnsweredQuestion}
          isAuthenticated={isAuthenticated}
          language={language}
          history={askHistory}
          onClose={() => {
            setAskAnswer(null);
            setAskAnsweredQuestion('');
            setAskHistory([]);
          }}
          openLoginModal={openLoginModal}
          onFollowUp={handleAskSubmit}
          isNight={isNight}
        />

        <div className="w-full max-w-5xl flex flex-col items-center text-center mb-6 md:mb-16 gap-4 md:gap-10 px-4">
          <div className="space-y-2 md:space-y-8">
            {user.schoolName && (
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-1 shadow-xl backdrop-blur-sm">
                <span className="text-xs">🏫</span>
                <span className="text-[8px] md:text-xs font-black text-indigo-400 uppercase tracking-[0.1em]">
                  {user.schoolName}
                </span>
              </div>
            )}
            <h1
              className={`text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-black ${isNight ? 'text-white' : 'text-zinc-900'} font-display break-keep leading-tight tracking-tight`}
            >
              {t('dash_welcome')}{' '}
              <span
                className={
                  isNight
                    ? 'text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-pink-500'
                    : 'text-brand-orange'
                }
              >
                {user.name}!
              </span>
            </h1>
            <p
              className={`${isNight ? 'text-zinc-400' : 'text-zinc-500'} font-bold font-korean text-xs sm:text-sm md:text-lg lg:text-xl max-w-3xl mx-auto leading-relaxed break-keep opacity-80`}
            >
              {t('dash_subtitle')}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4">
            {isPro && user.schoolId && (
              <div
                className={`border rounded-full py-2.5 px-6 flex items-center gap-4 shadow-2xl transition-all duration-200 bg-indigo-500/10 border-white/20 backdrop-blur-md`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs">🏫</span>
                  <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                    {user.schoolName || 'School Active'}
                  </span>
                </div>
              </div>
            )}
            {!isPro && (
              <div
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border mb-2 shadow-sm ${isNight ? 'bg-zinc-800/50 border-white/5' : 'bg-zinc-100 border-zinc-200'}`}
              >
                <span className="text-xs">📸</span>
                <span
                  className={`text-[10px] md:text-xs font-black ${isNight ? 'text-zinc-400' : 'text-zinc-600'}`}
                >
                  {language === 'ko'
                    ? `오늘 남은 무료 스캔: ${remainingCount}회`
                    : `${remainingCount} free scans left today`}
                </span>
              </div>
            )}
          </div>

          {!isPro && (
            <div
              onClick={() => setShowPaywall(true)}
              className="w-full max-w-xl mx-auto mt-6 px-5 py-4 rounded-3xl bg-gradient-to-r from-orange-500/10 via-pink-500/10 to-red-500/10 border border-orange-500/30 hover:border-orange-500/50 shadow-lg cursor-pointer transform hover:scale-[1.02] active:scale-[0.97] transition-all duration-200 flex items-center justify-between gap-4 animate-fade-in-up"
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
                    {language === 'ko'
                      ? '무제한 문제 스캔 및 질문하기 기능 제공'
                      : 'Unlock unlimited scans, questions, and all premium features.'}
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
          {minimal ? null : (
            <AskChekkiBar
              query={askQuery}
              setQuery={setAskQuery}
              onSubmit={handleAskSubmit}
              isAsking={isAskAsking}
              language={language}
              isNight={isNight}
            />
          )}
          {renderDropZone('large')}
          {renderTrustAndSteps()}
          {minimal ? null : renderFeatureBanner()}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full flex flex-col pt-4 md:pt-8 pb-10 px-4 md:px-10 max-w-7xl xl:max-w-[1440px] 2xl:max-w-[1600px] mx-auto flex flex-col items-center animate-fade-in relative">
      {imageToCrop && (
        <CropModal
          imageSrc={imageToCrop}
          isNight={isNight}
          onClose={() => setImageToCrop(null)}
          onCropComplete={(croppedDataUrl) => {
            const base64Data = croppedDataUrl.split(',')[1];
            onImageSelected(base64Data);
            setImageToCrop(null);
          }}
          onGradeOriginal={() => {
            const base64Data = imageToCrop.split(',')[1];
            onImageSelected(base64Data);
            setImageToCrop(null);
          }}
        />
      )}
      {showFeedbackModal && <FeedbackModal onClose={() => setShowFeedbackModal(false)} />}
      {showLegal && (
        <LegalModal type={showLegal} onClose={() => setShowLegal(null)} isNight={isNight} />
      )}
      {showVideoModal && renderVideoWalkthroughModal()}
      {showFlyerModal && <FlyerModal onClose={() => setShowFlyerModal(false)} isNight={isNight} />}
      <AskChekkiAnswerModal
        answer={askAnswer}
        isAsking={isAskAsking}
        question={askAnsweredQuestion}
        isAuthenticated={isAuthenticated}
        language={language}
        history={askHistory}
        onClose={() => {
          setAskAnswer(null);
          setAskAnsweredQuestion('');
          setAskHistory([]);
        }}
        openLoginModal={openLoginModal}
        onFollowUp={handleAskSubmit}
        isNight={isNight}
      />

      <div className="relative w-full max-w-7xl xl:max-w-[1440px] 2xl:max-w-[1600px] mx-auto px-4 md:px-6 flex flex-col items-center mb-6 md:mb-12 mt-8 md:mt-16">
        <div
          className={`absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1000px] h-[500px] ${isNight ? 'bg-indigo-900/20' : 'bg-brand-purple/10'} rounded-full blur-[60px] md:blur-[180px] -z-10 pointer-events-none opacity-20 mix-blend-screen`}
        ></div>

        <div className="text-center w-full max-w-4xl">
          {/* Premium 7-Day Free Trial Banner */}
          <div
            onClick={openLoginModal}
            className={`inline-flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-full mb-6 cursor-pointer transform hover:scale-[1.02] active:scale-[0.97] transition-all duration-200 border ${
              isNight
                ? 'bg-gradient-to-r from-orange-500/10 via-pink-500/10 to-red-500/10 border-orange-500/20 hover:border-orange-500/40 shadow-lg shadow-orange-500/5'
                : 'bg-gradient-to-r from-orange-500/5 via-pink-500/5 to-red-500/5 border-orange-500/15 hover:border-orange-500/35 shadow-sm'
            }`}
          >
            <span className="text-[10px] md:text-xs animate-pulse">🎁</span>
            <span
              className={`text-[9px] md:text-xs font-black uppercase tracking-wider ${isNight ? 'text-zinc-300' : 'text-zinc-700'}`}
            >
              {language === 'ko'
                ? '7일 무료 체험 지금 시작하세요'
                : 'Start your 7-Day Free Trial now'}
            </span>
            <div className="flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-gradient-to-r from-orange-500 to-pink-500 text-[8px] md:text-[9px] font-black text-white shadow-md shadow-orange-500/10">
              <span>{language === 'ko' ? '자세히 보기' : 'Try Free'}</span>
              <span>→</span>
            </div>
          </div>

          <h1
            className={`text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black ${isNight ? 'text-white' : 'text-zinc-900'} font-display mb-2 md:mb-6 tracking-tight drop-shadow-2xl whitespace-pre-line leading-[1.05] break-keep`}
          >
            {isNight ? (
              <span className="text-brand-purple">{t('hero_title_night')}</span>
            ) : (
              <span className="text-brand-purple">{t('hero_title')}</span>
            )}
          </h1>

          <div className="flex flex-col md:flex-row gap-4 md:gap-8 justify-center items-center w-full max-w-md md:max-w-2xl mx-auto"></div>
        </div>
      </div>

      <div className="w-full max-w-4xl mx-auto px-4">
        {/* Class Code Prompt Banner */}
        {isAuthenticated && !user?.schoolId && !user?.classId && !classCodeBannerDismissed && (
          <div
            className={`mb-4 flex items-center gap-3 px-4 py-3 rounded-2xl border ${
              isNight
                ? 'bg-orange-500/8 border-orange-500/20 text-orange-300'
                : 'bg-orange-50 border-orange-200 text-orange-700'
            } animate-fade-in-up`}
          >
            <span className="text-lg flex-shrink-0">🏫</span>
            <div className="flex-1 min-w-0">
              <p
                className={`text-xs font-black uppercase tracking-wider ${isNight ? 'text-orange-400' : 'text-orange-600'}`}
              >
                {language === 'ko'
                  ? '학원 코드가 있으신가요?'
                  : 'Got a class code from your teacher?'}
              </p>
              <p
                className={`text-[11px] font-medium mt-0.5 ${isNight ? 'text-zinc-400' : 'text-zinc-600'}`}
              >
                {language === 'ko'
                  ? '코드를 입력하면 채점이 학원 교재에 맞게 조정됩니다.'
                  : "Enter it to align grading with your child's class curriculum."}
              </p>
            </div>
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('open-settings-class-code'))}
              className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                isNight
                  ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-md shadow-orange-500/20'
                  : 'bg-orange-500 hover:bg-orange-600 text-white'
              }`}
            >
              {language === 'ko' ? '코드 입력' : 'Enter Code'}
            </button>
            <button
              onClick={dismissClassCodeBanner}
              className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-lg transition-colors ${
                isNight
                  ? 'text-zinc-600 hover:text-zinc-300 hover:bg-white/5'
                  : 'text-zinc-400 hover:text-zinc-700 hover:bg-black/5'
              }`}
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
        )}
        {renderDropZone('large')}
        {renderTrustAndSteps()}
      </div>

      {/* Floating Tools Trigger */}
      {!minimal && (
        <div className="fixed bottom-24 right-6 z-40">
          <button
            onClick={() => setShowTools(!showTools)}
            className={`w-16 h-16 rounded-full flex items-center justify-center transition-all bg-zinc-900 border border-white/10 shadow-2xl hover:scale-110 active:scale-[0.97] ${showTools ? 'rotate-45 bg-orange-500 border-orange-400' : ''}`}
          >
            {showTools ? (
              <span className="text-3xl text-white">×</span>
            ) : (
              <span className="text-2xl">🧰</span>
            )}
          </button>
        </div>
      )}

      {/* Tools Overlay (Progressive Disclosure) */}
      {showTools && (
        <div className="fixed inset-0 z-30 bg-black/80 backdrop-blur-3xl animate-fade-in flex flex-col p-6 md:p-12 overflow-y-auto">
          <div className="max-w-4xl mx-auto w-full pt-12 md:pt-24 space-y-12 mb-20">
            <div className="text-center space-y-4">
              <h3 className="text-2xl md:text-5xl font-black text-white uppercase tracking-tighter">
                Chekki Toolkit
              </h3>
              <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px] md:text-sm">
                Advanced assistance for curious parents
              </p>
            </div>

            <div
              className={`bg-zinc-900/50 border border-white/5 rounded-3xl p-6 md:p-12 space-y-8 shadow-2xl`}
            >
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
