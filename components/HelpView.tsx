import React, { useState, useCallback } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { AskChekkiBar, AskChekkiAnswerModal } from './AskChekkiBar';
import { askChekkiQuestion, ChatTurn } from '../services/geminiService';
import { ASSETS } from '../constants';
import { FeedbackModal } from './FeedbackModal';
import { LegalType } from '../types';
import { FlyerModal } from './FlyerModal';
import { ScreenshotCarousel } from './ScreenshotCarousel';

interface HelpViewProps {
  isNight: boolean;
  onClose?: () => void;
}

export const HelpView: React.FC<HelpViewProps> = ({ isNight, onClose }) => {
  const { t, language } = useLanguage();
  const { isAuthenticated, checkQuestionLimit, incrementQuestion, openLoginModal } = useAuth();

  // State for Grammar Chat
  const [askQuery, setAskQuery] = useState('');
  const [askAnswer, setAskAnswer] = useState<string | null>(null);
  const [askAnsweredQuestion, setAskAnsweredQuestion] = useState('');
  const [isAskAsking, setIsAskAsking] = useState(false);
  const [askHistory, setAskHistory] = useState<ChatTurn[]>([]);

  // Modals
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showFlyerModal, setShowFlyerModal] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);

  const handleAskSubmit = useCallback(
    async (question: string) => {
      if (!question.trim() || isAskAsking) return;

      if (isAuthenticated && !checkQuestionLimit()) return;

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

        if (isAuthenticated) await incrementQuestion();
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

  return (
    <div className="animate-fade-in pb-32">
      {showFeedbackModal && (
        <FeedbackModal onClose={() => setShowFeedbackModal(false)} isNight={isNight} />
      )}
      {showFlyerModal && <FlyerModal onClose={() => setShowFlyerModal(false)} isNight={isNight} />}
      {showVideoModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/95 backdrop-blur-2xl"
            onClick={() => setShowVideoModal(false)}
          ></div>
          <div className="relative w-full max-w-5xl aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl border border-white/10">
            <video src={ASSETS.VIDEO_WALKTHROUGH} controls autoPlay className="w-full h-full" />
            <button
              onClick={() => setShowVideoModal(false)}
              className="absolute top-6 right-6 bg-black/50 hover:bg-black text-white p-3 rounded-full transition-colors z-10 border border-white/10 backdrop-blur-md"
            >
              ✕
            </button>
          </div>
        </div>
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

      <div className="max-w-5xl mx-auto px-4 pt-8 md:pt-16 mb-8 flex justify-start">
        <button
          onClick={onClose}
          className={`group flex items-center gap-3 px-6 py-3 rounded-2xl border transition-all active:scale-[0.97] ${isNight ? 'bg-zinc-900 border-white/10 text-zinc-400 hover:text-white' : 'bg-white border-zinc-200 text-zinc-500 hover:text-zinc-900 shadow-sm'}`}
        >
          <span className="text-xl transition-transform group-hover:-translate-x-1">←</span>
          <span className="text-xs font-black uppercase tracking-widest">
            {t('btn_back') || 'Back to Scan'}
          </span>
        </button>
      </div>

      <div className="max-w-5xl mx-auto px-4 mb-16 md:mb-32">
        <div className="text-center mb-8 md:mb-16">
          <h2
            className={`text-balance text-3xl md:text-5xl font-black tracking-tight ${isNight ? 'text-white' : 'text-zinc-900'} font-display mb-4`}
          >
            Confused about grammar?
          </h2>
          <p className={`${isNight ? 'text-zinc-500' : 'text-zinc-400'} font-korean font-bold`}>
            {language === 'ko'
              ? '궁금한 점이 있다면 채키에게 직접 물어보세요!'
              : 'Ask Chekki anything about English grammar!'}
          </p>
        </div>
        <AskChekkiBar
          query={askQuery}
          setQuery={setAskQuery}
          onSubmit={handleAskSubmit}
          isAsking={isAskAsking}
          language={language}
          isNight={isNight}
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 space-y-20 md:space-y-40">
        <section>
          <h2
            className={`text-balance text-2xl md:text-5xl font-black tracking-tight ${isNight ? 'text-white' : 'text-zinc-900'} font-display text-center mb-12 md:mb-24`}
          >
            {t('how_title')}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 mt-12">
            {[
              {
                step: 1,
                img: '/assets/onboarding_icon_grader_1782545224150.png',
                ko: '찰칵! 1초 채점',
                en: 'Instant Grader',
                koDesc: '아이가 푼 문제집을 촬영하세요. AI가 손글씨를 인식해 즉시 채점하고 정답을 알려줍니다.',
                enDesc: 'Take a picture of the homework. Chekki will instantly grade their handwriting and show you the answers.'
              },
              {
                step: 2,
                img: '/assets/bento_speed_mode.png',
                ko: '스피드 채점 & 튜터',
                en: 'Speed & Tutor Modes',
                koDesc: '빠른 채점 모드로 터치 없이 정답만 보거나, 튜터 모드로 전환해 AI 원어민 오디오 설명을 들어보세요.',
                enDesc: 'Toggle Speed Mode for instant grading of handwriting, or use Tutor Mode to let the AI explain the grammar with native audio.'
              },
              {
                step: 3,
                img: '/assets/onboarding_icon_dashboard_1782545238800.png',
                ko: '자동 오답 노트',
                en: 'Learning Dashboard',
                koDesc: '틀린 문제는 자동으로 학습 대시보드에 저장됩니다. 번거롭게 따로 기록할 필요가 없어요.',
                enDesc: 'Wrong answers are automatically saved to your Dashboard. No need to manually keep track.'
              },
              {
                step: 4,
                img: '/assets/onboarding_icon_loop_1782545249835.png',
                ko: '무한 복습 루프',
                en: 'The Infinite Loop',
                koDesc: '저장된 오답을 모아 맞춤형 복습 프린트물을 만들어주세요. 빈틈없는 영어 학습이 완성됩니다.',
                enDesc: 'Generate practice worksheets from their mistakes. Close the learning gap automatically.'
              }
            ].map((item) => (
              <div key={item.step} className="flex flex-col items-center text-center group">
                <div className={`w-32 h-32 md:w-48 md:h-48 rounded-[2rem] md:rounded-[3rem] flex items-center justify-center mb-6 md:mb-10 shadow-[0_30px_60px_rgba(249,115,22,0.2)] ring-1 ${isNight ? 'ring-white/10 bg-black/20' : 'ring-black/5 bg-zinc-50'} overflow-hidden group-hover:-translate-y-2 transition-transform duration-200`}>
                  <img src={item.img} alt="" className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-200" />
                </div>
                <h4 className={`text-xl md:text-2xl font-black ${isNight ? 'text-white' : 'text-zinc-900'} font-display tracking-tight leading-tight mb-3`}>
                  {language === 'ko' ? item.ko : item.en}
                </h4>
                <p className={`${isNight ? 'text-zinc-400' : 'text-zinc-500'} text-sm md:text-base font-korean max-w-xs leading-relaxed`}>
                  {language === 'ko' ? item.koDesc : item.enDesc}
                </p>
              </div>
            ))}
          </div>
        </section>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 max-w-5xl mx-auto px-4 mb-20 md:mb-40">
          {[
            {
              icon: '🎬',
              label: 'Walkthrough',
              korean: '사용 가이드',
              onClick: () => setShowVideoModal(true),
              color: 'text-indigo-400',
            },
            {
              icon: '📢',
              label: 'Official Flyer',
              korean: '공식 전단지',
              onClick: () => setShowFlyerModal(true),
              color: 'text-orange-400',
            },
            {
              icon: '💬',
              label: 'Send Feedback',
              korean: '의견 보내기',
              onClick: () => setShowFeedbackModal(true),
              color: 'text-emerald-400',
            },
          ].map((item, i) => (
            <button
              key={i}
              onClick={item.onClick}
              className={`group ${isNight ? 'bg-white/5 border-white/10' : 'bg-white border-zinc-200 shadow-xl'} border p-6 md:p-8 rounded-3xl flex items-center gap-4 transition-all text-left backdrop-blur-sm`}
            >
              <div
                className={`w-12 h-12 md:w-16 md:h-16 rounded-2xl ${isNight ? 'bg-white/5 border-white/10' : 'bg-zinc-50 border-zinc-200'} border flex items-center justify-center text-2xl md:text-3xl shadow-xl transition-all group-hover:scale-110`}
              >
                {item.icon}
              </div>
              <div>
                <p
                  className={`text-[10px] font-black uppercase tracking-widest ${item.color} mb-1`}
                >
                  {language === 'ko' ? item.korean : item.label}
                </p>
                <h4
                  className={`text-sm md:text-lg font-bold ${isNight ? 'text-white' : 'text-zinc-900'} font-korean`}
                >
                  {language === 'ko' ? item.korean : item.label}
                </h4>
              </div>
            </button>
          ))}
        </div>

        <section className="text-center space-y-4">
          <h2
            className={`text-balance text-3xl md:text-7xl font-black tracking-tight ${isNight ? 'text-white' : 'text-zinc-900'} font-display uppercase`}
          >
            {t('magic_title')}
          </h2>
          <p
            className={`text-[10px] md:text-sm font-black ${isNight ? 'text-zinc-500' : 'text-zinc-400'} uppercase tracking-[0.4em]`}
          >
            {t('magic_subtitle')}
          </p>
          <div className="pt-10">
            <ScreenshotCarousel />
          </div>
        </section>

        <section>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-10 mb-20 md:mb-40">
            {[
              { id: 'brand', emoji: '🪄', title: t('diff_brand'), desc: t('diff_brand_desc') },
              { id: 'ocr', emoji: '✨', title: t('diff_ocr'), desc: t('diff_ocr_desc') },
              { id: 'script', emoji: '💌', title: t('diff_script'), desc: t('diff_script_desc') },
            ].map((feat) => (
              <div
                key={feat.id}
                className={`p-6 md:p-10 rounded-3xl ${isNight ? 'bg-zinc-900/40 border-white/5 hover:border-orange-500/20' : 'bg-white border-zinc-200 hover:border-orange-500/30 shadow-sm'} border hover:-translate-y-1 hover:shadow-lg transition-all duration-200`}
              >
                <span className="text-3xl md:text-5xl block mb-4 md:mb-6">{feat.emoji}</span>
                <h3
                  className={`text-balance text-lg md:text-2xl font-black tracking-tight ${isNight ? 'text-white' : 'text-zinc-900'} font-display mb-2 md:mb-3`}
                >
                  {feat.title}
                </h3>
                <p
                  className={`${isNight ? 'text-zinc-400 opacity-80' : 'text-zinc-600'} text-xs md:text-base leading-relaxed font-korean`}
                >
                  {feat.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Why Chekki Section */}
        <section className="pt-20 md:pt-40 space-y-12 md:space-y-24">
          <h2
            className={`text-balance text-3xl md:text-6xl font-black tracking-tight ${isNight ? 'text-white' : 'text-zinc-900'} text-center font-display`}
          >
            {t('diff_title')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12 max-w-6xl mx-auto px-4">
            <div
              className={`flex flex-col space-y-4 md:space-y-8 p-8 md:p-16 rounded-3xl ${isNight ? 'bg-zinc-900/30' : 'bg-white shadow-xl'} border ${isNight ? 'border-white/5' : 'border-zinc-100'} backdrop-blur-xl relative overflow-hidden group hover:${isNight ? 'bg-zinc-900/50' : 'bg-white'} hover:-translate-y-1 transition-all duration-200`}
            >
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-200">
                <span className="text-8xl md:text-[12rem]">✨</span>
              </div>
              <span className="text-4xl md:text-7xl mb-2">✨</span>
              <h3
                className={`text-balance text-2xl md:text-4xl font-black tracking-tight ${isNight ? 'text-white' : 'text-zinc-900'} leading-tight`}
              >
                {t('diff_ocr')}
              </h3>
              <p
                className={`${isNight ? 'text-zinc-500 opacity-90' : 'text-zinc-600'} text-base md:text-2xl font-korean leading-relaxed max-w-md`}
              >
                {t('diff_ocr_desc')}
              </p>
            </div>
            <div
              className={`flex flex-col space-y-4 md:space-y-8 p-8 md:p-16 rounded-3xl ${isNight ? 'bg-zinc-900/30' : 'bg-white shadow-xl'} border ${isNight ? 'border-white/5' : 'border-zinc-100'} backdrop-blur-xl relative overflow-hidden group hover:${isNight ? 'bg-zinc-900/50' : 'bg-white'} hover:-translate-y-1 transition-all duration-200`}
            >
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-200">
                <span className="text-8xl md:text-[12rem]">💌</span>
              </div>
              <span className="text-4xl md:text-7xl mb-2">💌</span>
              <h3
                className={`text-balance text-2xl md:text-4xl font-black tracking-tight ${isNight ? 'text-white' : 'text-zinc-900'} leading-tight`}
              >
                {t('diff_script')}
              </h3>
              <p
                className={`${isNight ? 'text-zinc-500 opacity-90' : 'text-zinc-600'} text-base md:text-2xl font-korean leading-relaxed max-w-md`}
              >
                {t('diff_script_desc')}
              </p>
            </div>
          </div>
        </section>

        {/* Privacy Section */}
        <section className="pt-24 md:pt-60 pb-24 md:pb-60 space-y-12 md:space-y-24">
          <div className="text-center space-y-4 md:space-y-8">
            <h2
              className={`text-balance text-3xl md:text-6xl font-black tracking-tight ${isNight ? 'text-white' : 'text-zinc-900'} font-display`}
            >
              {t('trust_title')}
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-24 max-w-6xl mx-auto px-4">
            <div className="flex flex-col items-center text-center space-y-6 md:space-y-10 group">
              <div
                className={`w-20 h-20 md:w-32 md:h-32 rounded-3xl ${isNight ? 'bg-zinc-900/50 border-white/10' : 'bg-white border-zinc-200 shadow-xl'} border flex items-center justify-center text-4xl md:text-6xl group-hover:scale-110 transition-all duration-200 group-hover:border-orange-500/30`}
              >
                🔒
              </div>
              <div className="space-y-4 md:space-y-6">
                <h3
                  className={`text-balance text-2xl md:text-4xl font-black tracking-tight ${isNight ? 'text-white' : 'text-zinc-900'}`}
                >
                  {t('trust_privacy')}
                </h3>
                <p
                  className={`${isNight ? 'text-zinc-500 opacity-90' : 'text-zinc-600'} text-base md:text-2xl font-korean leading-relaxed max-w-xl mx-auto`}
                >
                  {t('trust_privacy_desc')}
                </p>
              </div>
            </div>
            <div className="flex flex-col items-center text-center space-y-6 md:space-y-10 group">
              <div
                className={`w-20 h-20 md:w-32 md:h-32 rounded-3xl ${isNight ? 'bg-zinc-900/50 border-white/10' : 'bg-white border-zinc-200 shadow-xl'} border flex items-center justify-center text-4xl md:text-6xl group-hover:scale-110 transition-all duration-200 group-hover:border-orange-500/30`}
              >
                👥
              </div>
              <div className="space-y-4 md:space-y-6">
                <h3
                  className={`text-balance text-2xl md:text-4xl font-black tracking-tight ${isNight ? 'text-white' : 'text-zinc-900'}`}
                >
                  {t('trust_safety')}
                </h3>
                <p
                  className={`${isNight ? 'text-zinc-500 opacity-90' : 'text-zinc-600'} text-base md:text-2xl font-korean leading-relaxed max-w-xl mx-auto`}
                >
                  {t('trust_safety_desc')}
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
