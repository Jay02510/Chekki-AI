import React, { memo, useState } from 'react';
import { WorksheetItem } from '../types';
import { renderMarkdown } from '../utils/markdownUtils';
import { cleanAnswerText, removeMarkdown } from '../utils/speechUtils';

interface WorksheetItemCardProps {
  item: WorksheetItem;
  isActive: boolean;
  isNight: boolean;
  language: 'en' | 'ko';
  t: (key: string) => string;
  flagged: boolean;
  speechResult: { id: number; success: boolean } | null;
  scriptLanguages: Record<number, 'en' | 'ko'>;
  isAuthenticated: boolean;
  userPlan?: string;
  isListening: boolean;
  onToggleActive: () => void;
  onPlayAudio: (text: string) => void;
  onToggleMistake: (item: WorksheetItem) => void;
  onRefine: (item: WorksheetItem) => void;
  onStartPronunciation: (e: React.MouseEvent) => void;
  onSetScriptLanguage: (id: number, lang: 'en' | 'ko') => void;
  openLoginModal: () => void;
  setShowPaywall: (show: boolean) => void;
  setUpsellFeature: (feature: 'pronunciation' | 'audio' | 'guide' | null) => void;
  style?: React.CSSProperties;
  hasHandwriting?: boolean;
  index?: number;
  isSpeedMode?: boolean;
}

const simplifyGuideText = (text: string) => {
  if (!text) return text;
  return text
    .replace(/\s*\/[^/]+\/\s*/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

export const WorksheetItemCard: React.FC<WorksheetItemCardProps> = memo(
  ({
    item,
    isActive,
    isNight,
    language,
    t,
    flagged,
    speechResult,
    scriptLanguages,
    isAuthenticated,
    userPlan,
    isListening,
    onToggleActive,
    onPlayAudio,
    onToggleMistake,
    onRefine,
    onStartPronunciation,
    onSetScriptLanguage,
    openLoginModal,
    setShowPaywall,
    setUpsellFeature,
    style,
    hasHandwriting = true,
    index = 0,
    isSpeedMode = false,
  }) => {
    const [isScriptExpanded, setIsScriptExpanded] = useState(!isSpeedMode);
    const [isAnswerExpanded, setIsAnswerExpanded] = useState(isSpeedMode);

    React.useEffect(() => {
      if (isSpeedMode) {
        setIsAnswerExpanded(true);
        setIsScriptExpanded(false);
      } else {
        setIsScriptExpanded(true);
        setIsAnswerExpanded(false);
      }
    }, [isSpeedMode]);

    const scriptText = language === 'ko' ? item.teaching_script_ko : item.teaching_script_en || '';
    const guideText = language === 'ko' ? item.korean_guide : item.english_guide || '';
    const answerText = removeMarkdown(item.correct_answer || '');

    const handleActionClick = (e: React.MouseEvent, action: () => void) => {
      e.stopPropagation();
      if (!isAuthenticated) {
        openLoginModal();
      } else {
        action();
      }
    };

    const currentScriptLang = scriptLanguages[item.id] || language;
    const displayScript =
      currentScriptLang === 'ko' ? item.teaching_script_ko : item.teaching_script_en;
    const displayGuide = currentScriptLang === 'ko' ? item.korean_guide : item.english_guide;

    return (
      <div
        onClick={(e) => e.stopPropagation()}
        className={`group relative rounded-[2.5rem] border overflow-hidden transition-all duration-200 ease-[var(--ease-premium)] p-1.5 ${isActive ? (isNight ? 'bg-zinc-900 border-orange-500/50 shadow-[0_20px_50px_rgba(249,115,22,0.15)] scale-[1.02]' : 'bg-white border-orange-500 shadow-[0_20px_50px_rgba(249,115,22,0.15)] scale-[1.02]') : isNight ? 'bg-[#111111]/80 border-white/5 hover:border-white/10' : 'bg-white/80 border-zinc-200 hover:border-zinc-300 shadow-sm hover:shadow-lg'}`}
        style={style}
      >
        <div className={`w-full h-full rounded-[calc(2.5rem-0.375rem)] ${isNight ? 'bg-[#0A0A0A] shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]' : 'bg-white shadow-[inset_0_1px_1px_rgba(0,0,0,0.05)]'} transition-all duration-200 ease-[var(--ease-premium)]`}>
          <div
            onClick={(e) => {
              e.stopPropagation();
              onToggleActive();
            }}
            className="p-4 md:p-8 flex items-start gap-4 md:gap-8 cursor-pointer"
          >
            <div
              className={`w-8 h-8 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0 transition-all duration-200 ${isActive ? 'bg-orange-500 text-white shadow-lg rotate-3' : isNight ? 'bg-zinc-800 text-zinc-500' : 'bg-zinc-100 text-zinc-400'}`}
            >
              <span className="text-xs md:text-xl font-black font-display">{item.id}</span>
            </div>

            <div className="flex-1 min-w-0">
              <h4
                className={`text-sm md:text-lg font-bold leading-relaxed transition-colors break-words min-w-0 ${isActive ? (isNight ? 'text-white' : 'text-zinc-900') : isNight ? 'text-zinc-500' : 'text-zinc-600'} ${item.question_translation ? 'mb-1' : 'mb-3'}`}
              >
                {item.question_text.replace(/^\d+[.)\s]+/, '')}
              </h4>
              {item.question_translation && (
                <p className={`text-[10px] md:text-xs font-korean italic leading-relaxed mb-3 ${isNight ? 'text-orange-400' : 'text-orange-600'}`}>
                  {item.question_translation}
                </p>
              )}

              {/* Show simple hint when inactive */}
              {!isActive && (
                <div className="flex items-center gap-1.5 ml-1 animate-pulse mt-2">
                  <span className="text-[7px] font-black uppercase text-orange-500 tracking-[0.1em] opacity-70">
                    {language === 'ko' ? '정답 확인하기' : 'Check Answers'}
                  </span>
                  <svg
                    className="w-2.5 h-2.5 text-orange-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth="4"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              )}
            </div>
          </div>

          {/* Active State Accordions */}
          {isActive && (
            <div className="px-4 pb-6 md:px-10 md:pb-10 animate-fade-in-up space-y-4">
              {!isAuthenticated && index !== 0 ? (
                <div className="bg-orange-500/10 border border-orange-500/30 rounded-3xl p-6 text-center space-y-4">
                  <p
                    className={`text-sm font-bold ${isNight ? 'text-white' : 'text-zinc-900'} font-korean leading-relaxed`}
                  >
                    {language === 'ko'
                      ? '로그인하고 원어민 AI 발음 듣기, 아이 발음 체크, 그리고 전체 해설 가이드를 확인해보세요!'
                      : 'Log in to unlock Native AI Audio, Pronunciation Checking, and Full Explanations!'}
                  </p>
                  <button
                    onClick={openLoginModal}
                    className="bg-white text-black px-8 py-3 rounded-2xl font-black text-sm uppercase shadow-xl w-full"
                  >
                    {language === 'ko' ? '지금 로그인하기' : 'Log In Now'}
                  </button>
                </div>
              ) : (
                <>
                  {/* ACCORDION 2: CHECK UNDERSTANDING / TUTOR GUIDE */}
                  <div className={`${isNight ? 'bg-orange-500/5 border-orange-500/10 shadow-inner' : 'bg-orange-50/50 border-orange-100 shadow-sm'} border rounded-3xl overflow-hidden transition-all duration-200`}>
                    <div
                      onClick={() => {
                        setIsScriptExpanded(!isScriptExpanded);
                        if (!isScriptExpanded) setIsAnswerExpanded(false);
                      }}
                      className="w-full flex justify-between items-center p-4 md:p-5 hover:bg-orange-500/5 transition-colors cursor-pointer active:scale-[0.98]"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base md:text-lg">🤖</span>
                        <p className="text-sm font-black uppercase text-orange-500 tracking-wider">
                          {language === 'ko' ? '이해도 확인 (티칭 가이드)' : 'Check Understanding / Guide'}
                        </p>
                      </div>
                      <svg
                        className={`w-4 h-4 text-orange-500 transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] ${isScriptExpanded ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        strokeWidth="3"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>

                    <div className={`transition-all duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] overflow-hidden ${isScriptExpanded ? 'max-h-[3000px] border-t border-orange-500/10 opacity-100 scale-100' : 'max-h-0 opacity-0 scale-95 origin-top'}`}>
                      <div className="p-5 flex flex-col gap-5">
                        <div className="flex items-center justify-between gap-3">
                          {displayGuide && (
                            <div className="flex-1">
                              <h5 className="text-[10px] font-black uppercase tracking-widest text-orange-500 mb-1">
                                {language === 'ko' ? '학습 가이드' : 'Learning Guide'}
                              </h5>
                              <p className={`text-sm ${isNight ? 'text-zinc-300' : 'text-zinc-600'} font-korean leading-relaxed`}>
                                {simplifyGuideText(displayGuide)}
                              </p>
                            </div>
                          )}
                          <div
                            className="flex bg-zinc-800/50 rounded-lg p-0.5 border border-white/5 shrink-0 h-fit active:scale-[0.97] transition-transform"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onSetScriptLanguage(item.id, 'ko');
                              }}
                              className={`px-3 py-1 rounded-md text-[10px] font-black transition-all ${currentScriptLang === 'ko' ? 'bg-orange-500 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
                            >
                              KO
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onSetScriptLanguage(item.id, 'en');
                              }}
                              className={`px-3 py-1 rounded-md text-[10px] font-black transition-all ${currentScriptLang === 'en' ? 'bg-orange-500 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
                            >
                              EN
                            </button>
                          </div>
                        </div>

                        <div className="mt-2">
                          <h5 className="text-[10px] font-black uppercase tracking-widest text-orange-500 mb-2">
                            {language === 'ko' ? '티칭 스크립트' : 'Teacher Script'}
                          </h5>
                          <div
                            className={`teaching-script-text text-base md:text-xl ${isNight ? 'text-zinc-100' : 'text-zinc-800'} font-korean leading-relaxed font-bold italic border-l-4 border-orange-500 pl-4`}
                            dangerouslySetInnerHTML={{
                              __html: renderMarkdown(`&quot;${displayScript || ''}&quot;`),
                            }}
                          />
                        </div>
                        
                        <div className="flex flex-col sm:flex-row justify-end gap-3 w-full">
                          {currentScriptLang === 'en' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (userPlan !== 'pro' && index !== 0) {
                                  setUpsellFeature('guide');
                                } else {
                                  onPlayAudio(displayScript || '');
                                }
                              }}
                              className={`group flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-[11px] sm:text-xs font-black tracking-wide transition-all border w-full sm:w-auto ${userPlan === 'pro' ? 'bg-blue-500 text-white border-blue-400 hover:scale-[1.02] active:scale-[0.97] shadow-md shadow-blue-500/20' : isNight ? 'bg-blue-500/10 border-blue-500/20 text-blue-400 hover:bg-blue-500/20 active:scale-[0.97]' : 'bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100 active:scale-[0.97]'}`}
                            >
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z"/>
                              </svg>
                              <span>
                                {userPlan === 'pro' 
                                  ? (language === 'ko' ? 'AI 튜터: 가이드 질문 읽기' : 'AI Tutor: Ask Guiding Question') 
                                  : (language === 'ko' ? 'Pro: 가이드 질문 읽기' : 'Pro: Ask Guiding Question')}
                              </span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ACCORDION 1: SHOW ANSWER & OPTIONS */}
                  <div className={`${isNight ? 'bg-emerald-500/5 border-emerald-500/10 shadow-inner' : 'bg-emerald-50/50 border-emerald-100 shadow-sm'} border rounded-3xl overflow-hidden transition-all duration-200`}>
                    <div
                      onClick={() => {
                        setIsAnswerExpanded(!isAnswerExpanded);
                        if (!isAnswerExpanded) setIsScriptExpanded(false);
                      }}
                      className="w-full flex justify-between items-center p-4 md:p-5 hover:bg-emerald-500/5 transition-colors cursor-pointer active:scale-[0.98]"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base md:text-lg">✅</span>
                        <p className="text-sm font-black uppercase text-emerald-500 tracking-wider">
                          {language === 'ko' ? '정답 확인 및 옵션' : 'Show Answer & Options'}
                        </p>
                      </div>
                      <svg
                        className={`w-4 h-4 text-emerald-500 transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] ${isAnswerExpanded ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        strokeWidth="3"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>

                    <div className={`transition-all duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] overflow-hidden ${isAnswerExpanded ? 'max-h-[3000px] border-t border-emerald-500/10 opacity-100 scale-100' : 'max-h-0 opacity-0 scale-95 origin-top'}`}>
                      <div className="p-5 flex flex-col gap-6">
                        
                        {/* Voice Coach Inside Answer */}
                        <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-3xl p-5 flex items-center gap-5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (userPlan !== 'pro' && index !== 0) {
                                setUpsellFeature('pronunciation');
                              } else {
                                onStartPronunciation(e);
                              }
                            }}
                            className={`w-14 h-14 md:w-16 md:h-16 rounded-[2rem] flex items-center justify-center btn-press hover:scale-[1.02] ${isListening ? 'bg-red-500 animate-pulse' : index === 0 ? 'bg-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.6)] animate-pulse' : 'bg-indigo-600'} text-white shadow-lg relative`}
                            title={userPlan !== 'pro' && index !== 0 ? (language === 'ko' ? 'Pro: AI 발음 평가' : 'Pro: AI Pronunciation Eval') : t('tt_pronunciation')}
                          >
                            {isListening ? (
                              <div className="flex gap-1 items-center justify-center h-full">
                                <span className="w-1 h-3 bg-white animate-waveform rounded-full" style={{ animationDelay: '0.1s' }} />
                                <span className="w-1 h-5 bg-white animate-waveform rounded-full" style={{ animationDelay: '0.2s' }} />
                                <span className="w-1 h-4 bg-white animate-waveform rounded-full" style={{ animationDelay: '0.3s' }} />
                              </div>
                            ) : (
                              <svg className="w-6 h-6 md:w-8 md:h-8 drop-shadow-sm" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                              </svg>
                            )}
                            {index === 0 && !isListening && (
                              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-[#FAFAFB] animate-ping" />
                            )}
                          </button>
                          <div className="flex-1">
                            <h5 className="text-[10px] md:text-xs font-black uppercase tracking-widest text-indigo-500 mb-0.5">
                              {language === 'ko' ? 'AI 보이스 코치' : 'AI Voice Coach'}
                            </h5>
                            <p className={`text-xs md:text-sm font-semibold ${isNight ? 'text-indigo-200' : 'text-indigo-800'} font-korean leading-snug`}>
                              {language === 'ko'
                                ? '정답을 직접 말하며 연습해보세요!'
                                : 'Practice speaking the correct answer!'}
                            </p>
                          </div>
                        </div>

                        {/* Answer Display */}
                        <div
                          className={`relative px-0 py-1 transition-all duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] ${!isAuthenticated && index !== 0 ? 'blur-[4px] opacity-40 pointer-events-none select-none' : ''} ${speechResult?.id === item.id ? (speechResult.success ? 'scale-110 z-10' : 'translate-x-1') : ''}`}
                        >
                          {item.is_correct === false && hasHandwriting !== false && (
                            <div className="mb-2">
                              <span className="text-xs text-red-500/80 font-bold uppercase tracking-wider block mb-1">
                                {language === 'ko' ? '아이의 답안' : "Child's Answer"}
                              </span>
                              <span className="font-hand text-2xl md:text-4xl text-red-500 line-through decoration-red-500/50 block rotate-[1.5deg]">
                                {item.student_response || (language === 'ko' ? '(빈칸)' : '(blank)')}
                              </span>
                            </div>
                          )}
                          {item.is_correct === false && hasHandwriting !== false && (
                            <span className="text-xs text-emerald-500/80 font-bold uppercase tracking-wider block mt-3 mb-1">
                              {language === 'ko' ? '정답' : "Correct Answer"}
                            </span>
                          )}
                          {hasHandwriting === false && (
                            <span className="text-[10px] text-blue-500/80 font-black uppercase tracking-widest block mb-2 bg-blue-500/10 w-fit px-2 py-0.5 rounded-full border border-blue-500/20 shadow-sm">
                              {language === 'ko' ? '정답 모드' : "Answer Key"}
                            </span>
                          )}
                          <span
                            className={`font-hand text-3xl md:text-5xl font-bold transition-colors duration-200 block break-words whitespace-normal break-words min-w-0 rotate-[1.5deg] inline-block ${speechResult?.id === item.id ? (speechResult.success ? (isNight ? 'text-green-300 drop-shadow-[0_2px_8px_rgba(34,197,94,0.5)]' : 'text-green-600 drop-shadow-[0_2px_8px_rgba(22,163,74,0.3)]') : (isNight ? 'text-red-300 drop-shadow-[0_2px_8px_rgba(239,68,68,0.5)]' : 'text-red-600 drop-shadow-[0_2px_8px_rgba(220,38,38,0.3)]')) : isNight ? 'text-emerald-400' : 'text-emerald-600'}`}
                          >
                            {item.is_correct === true && <span className="mr-2">✅</span>}
                            {answerText}
                          </span>
                          {speechResult?.id === item.id && speechResult.success && (
                            <div className="absolute -top-4 -right-4 text-3xl animate-[bounce_1s_ease-[cubic-bezier(0.23,1,0.32,1)]_infinite] drop-shadow-lg z-20">
                              🌟
                            </div>
                          )}
                        </div>

                        {/* Tool Actions */}
                        <div className="flex items-center justify-between gap-2 pt-4 border-t border-emerald-500/10">
                          <div className="flex flex-col items-center gap-1.5 group/btn">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (userPlan !== 'pro' && index !== 0) {
                                  setUpsellFeature('audio');
                                } else {
                                  onPlayAudio(cleanAnswerText(item.correct_answer || ''));
                                }
                              }}
                              className={`w-11 h-11 md:w-12 md:h-12 flex items-center justify-center rounded-full btn-press hover:scale-[1.02] active:scale-[0.97] hover:-translate-y-0.5 shadow-sm transition-transform ${isNight ? 'bg-emerald-500/10 text-emerald-400 hover:text-emerald-300' : 'bg-emerald-600/10 text-emerald-600 hover:text-emerald-500'}`}
                              title={userPlan !== 'pro' && index !== 0 ? (language === 'ko' ? 'Pro: 원어민 AI 발음 듣기' : 'Pro: Native AI Pronunciation Audio') : t('tt_audio')}
                            >
                              <svg className="w-5 h-5 md:w-6 md:h-6" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77zm-3 0L5.5 8H1v8h4.5l6.5 4.77V3.23z" />
                              </svg>
                            </button>
                            <span className={`text-[7px] md:text-[9px] font-black uppercase tracking-widest opacity-80 leading-none h-4 flex items-center text-center ${isNight ? 'text-emerald-500/60' : 'text-emerald-600/60'}`}>
                              {t('lbl_audio')}
                            </span>
                          </div>

                          <div className="flex flex-col items-center gap-1.5 group/btn">
                            <button
                              onClick={(e) => handleActionClick(e, () => onToggleMistake(item))}
                              className={`w-11 h-11 md:w-12 md:h-12 flex items-center justify-center rounded-full btn-press hover:scale-[1.02] active:scale-[0.97] hover:-translate-y-0.5 shadow-sm transition-transform ${flagged ? 'bg-red-500/10 text-red-500' : isNight ? 'bg-white/5 text-emerald-500/60 hover:text-emerald-400' : 'bg-emerald-500/5 text-emerald-600/50 hover:text-emerald-600'}`}
                              title={t('tt_bookmark')}
                            >
                              <svg className="w-5 h-5 md:w-6 md:h-6" fill={flagged ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                              </svg>
                            </button>
                            <span className={`text-[7px] md:text-[9px] font-black uppercase tracking-widest opacity-80 leading-none h-4 flex items-center text-center ${flagged ? 'text-red-400' : isNight ? 'text-emerald-500/60' : 'text-emerald-600/60'}`}>
                              {t('lbl_bookmark')}
                            </span>
                          </div>

                          <div className="flex flex-col items-center gap-1.5 group/btn">
                            <button
                              onClick={(e) =>
                                handleActionClick(e, () => {
                                  if (userPlan !== 'pro' && index !== 0) setShowPaywall(true);
                                  else onRefine(item);
                                })
                              }
                              className={`w-11 h-11 md:w-12 md:h-12 flex items-center justify-center rounded-full btn-press hover:scale-[1.02] active:scale-[0.97] hover:-translate-y-0.5 shadow-sm transition-transform ${isNight ? 'bg-emerald-500/10 text-emerald-400 hover:text-emerald-300' : 'bg-emerald-600/10 text-emerald-600 hover:text-emerald-500'}`}
                              title={t('tt_refine')}
                            >
                              <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                              </svg>
                            </button>
                            <span className={`text-[7px] md:text-[9px] font-black uppercase tracking-widest opacity-80 leading-none h-4 flex items-center text-center ${isNight ? 'text-emerald-500/60' : 'text-emerald-600/60'}`}>
                              {t('lbl_refine')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                </>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }
);

WorksheetItemCard.displayName = 'WorksheetItemCard';
