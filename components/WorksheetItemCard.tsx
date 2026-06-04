
import React, { memo, useState } from 'react';
import { WorksheetItem } from '../types';
import { renderMarkdown } from '../utils/markdownUtils';

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
}

const simplifyGuideText = (text: string) => {
  if (!text) return text;
  return text.replace(/\s*\/[^/]+\/\s*/g, ' ').replace(/\s+/g, ' ').trim();
};

const getFirstSentence = (text: string, maxLength = 60) => {
  if (!text) return "";
  // Find first period, exclamation, question mark, or new line
  const endOfSentence = text.search(/[.!?\n]/);
  if (endOfSentence !== -1 && endOfSentence < maxLength * 1.5) {
    return text.substring(0, endOfSentence + 1).trim();
  }
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + "...";
};

export const WorksheetItemCard: React.FC<WorksheetItemCardProps> = memo(({
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
  style
}) => {
  const [isScriptExpanded, setIsScriptExpanded] = useState(true);
  const [isGuideExpanded, setIsGuideExpanded] = useState(false);
  const scriptText = language === 'ko' ? item.teaching_script_ko : (item.teaching_script_en || "");
  const guideText = language === 'ko' ? item.korean_guide : (item.english_guide || "");
  const answerText = item.correct_answer;

  const handleActionClick = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      openLoginModal();
    } else {
      action();
    }
  };

  const currentScriptLang = scriptLanguages[item.id] || language;
  const displayScript = currentScriptLang === 'ko' ? item.teaching_script_ko : item.teaching_script_en;
  const displayGuide = currentScriptLang === 'ko' ? item.korean_guide : item.english_guide;

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className={`group relative rounded-[2rem] md:rounded-[2.5rem] border overflow-hidden transition-[border-color,box-shadow,transform] duration-300 ${isActive ? (isNight ? 'bg-zinc-900 border-orange-500/50 shadow-2xl scale-[1.01]' : 'bg-white border-orange-500 shadow-2xl scale-[1.01]') : (isNight ? 'bg-zinc-900/60 border-transparent hover:border-white/10' : 'bg-white border-transparent hover:border-zinc-200 shadow-[0_10px_30px_rgba(0,0,0,0.02)] hover:shadow-lg')}`}
      style={style}
    >
      <div 
        onClick={(e) => { e.stopPropagation(); onToggleActive(); }}
        className="p-4 md:p-8 flex items-start gap-4 md:gap-8 cursor-pointer"
      >
        <div className={`w-8 h-8 md:w-12 md:h-12 rounded-xl md:rounded-[1.2rem] flex items-center justify-center shrink-0 transition-all duration-500 ${isActive ? 'bg-orange-500 text-white shadow-lg rotate-3' : (isNight ? 'bg-zinc-800 text-zinc-500' : 'bg-zinc-100 text-zinc-400')}`}>
          <span className="text-xs md:text-xl font-black font-display">{item.id}</span>
        </div>

        <div className="flex-1 min-w-0">
          <h4 className={`text-sm md:text-lg font-bold leading-relaxed mb-3 transition-colors break-keep ${isActive ? (isNight ? 'text-white' : 'text-zinc-900') : (isNight ? 'text-zinc-500' : 'text-zinc-600')}`}>
             {item.question_text.replace(/^\d+[.)\s]+/, '')}
          </h4>

          <div className="flex flex-col gap-4">
            <div className={`flex flex-col items-start gap-1`}>
              <div className={`relative px-0 py-1 transition-all duration-500 ease-in-out ${speechResult?.id === item.id ? (speechResult.success ? 'scale-110 z-10' : 'translate-x-1') : ''}`}>
                <span className={`font-hand text-3xl md:text-5xl font-bold transition-colors duration-500 block break-words whitespace-normal break-keep ${speechResult?.id === item.id ? (speechResult.success ? 'text-green-300 drop-shadow-[0_2px_8px_rgba(34,197,94,0.5)]' : 'text-red-300 drop-shadow-[0_2px_8px_rgba(239,68,68,0.5)]') : (isNight ? 'text-emerald-400' : 'text-emerald-600')}`}>
                  {answerText}
                </span>
                {speechResult?.id === item.id && speechResult.success && <div className="absolute -top-4 -right-4 text-3xl animate-[bounce_1s_ease-in-out_infinite] drop-shadow-lg z-20">🌟</div>}
              </div>

              {!isActive && (
                <div className="flex items-center gap-1.5 ml-1 animate-pulse">
                  <span className="text-[7px] font-black uppercase text-orange-500 tracking-[0.1em] opacity-70">
                    {language === 'ko' ? '티칭 팁 보기' : 'Teaching Tips'}
                  </span>
                  <svg className="w-2.5 h-2.5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              )}
            </div>

            {isActive && (
              <div className="flex items-center gap-6 md:gap-8 py-4 px-0 transition-all duration-300 w-full max-w-sm animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
                <div className="flex flex-col items-center gap-1.5 group/btn">
                  <button
                    onClick={(e) => { e.stopPropagation(); onPlayAudio(answerText); }}
                    className="w-11 h-11 md:w-12 md:h-12 flex items-center justify-center transition-all text-orange-500 hover:scale-110 active:scale-95 group-hover/btn:rotate-6"
                    title={t('tt_audio')}
                  >
                    <svg className="w-5 h-5 md:w-6 md:h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77zm-3 0L5.5 8H1v8h4.5l6.5 4.77V3.23z" /></svg>
                  </button>
                  <span className="text-[7px] md:text-[9px] font-black uppercase text-orange-500 tracking-widest opacity-80 leading-none h-4 flex items-center text-center">{t('lbl_audio')}</span>
                </div>

                <div className="flex flex-col items-center gap-1.5 group/btn">
                  <button
                    onClick={(e) => handleActionClick(e, () => onToggleMistake(item))}
                    className={`w-11 h-11 md:w-12 md:h-12 flex items-center justify-center transition-all ${flagged ? 'text-red-500' : (isNight ? 'text-zinc-500 hover:text-zinc-300' : 'text-zinc-400 hover:text-zinc-600')} hover:scale-110 active:scale-95 group-hover/btn:scale-110`}
                    title={t('tt_bookmark')}
                  >
                    <svg className="w-5 h-5 md:w-6 md:h-6" fill={flagged ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
                  </button>
                  <span className={`text-[7px] md:text-[9px] font-black uppercase tracking-widest opacity-80 leading-none h-4 flex items-center text-center ${flagged ? 'text-red-400' : (isNight ? 'text-zinc-500' : 'text-zinc-400')}`}>{t('lbl_bookmark')}</span>
                </div>

                <div className="flex flex-col items-center gap-1.5 group/btn">
                  <button
                    onClick={(e) => handleActionClick(e, () => {
                      if (userPlan !== 'pro') setShowPaywall(true);
                      else onRefine(item);
                    })}
                    className={`w-11 h-11 md:w-12 md:h-12 flex items-center justify-center transition-all ${isNight ? 'text-orange-400 hover:text-orange-300' : 'text-orange-600 hover:text-orange-500'} group-hover/btn:scale-110`}
                    title={t('tt_refine')}
                  >
                    <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  </button>
                  <span className={`text-[7px] md:text-[9px] font-black uppercase ${isNight ? 'text-zinc-500' : 'text-zinc-400'} tracking-widest opacity-80 leading-none h-4 flex items-center text-center`}>{t('lbl_refine')}</span>
                </div>

                <div className="flex flex-col items-center gap-1.5 group/btn lg:hidden">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleActive();
                      const overlayNode = document.getElementById('worksheet-overlay-capture');
                      if (overlayNode) {
                        overlayNode.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      } else {
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }
                    }}
                    className={`w-11 h-11 md:w-12 md:h-12 flex items-center justify-center transition-all text-orange-500 hover:scale-110 active:scale-95 group-hover/btn:-translate-y-1`}
                    title={language === 'ko' ? '학습지 보기' : 'Show Worksheet'}
                  >
                    <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                    </svg>
                  </button>
                  <span className="text-[7px] md:text-[9px] font-black uppercase text-orange-500 tracking-widest opacity-80 leading-none h-4 flex items-center text-center">
                    {language === 'ko' ? '학습지' : 'Worksheet'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {isActive && (
        <div className="px-4 pb-6 md:px-10 md:pb-10 animate-fade-in-up space-y-6">
          {!isAuthenticated ? (
            <div className="bg-orange-500/10 border border-orange-500/30 rounded-3xl p-6 text-center space-y-4">
              <p className={`text-sm font-bold ${isNight ? 'text-white' : 'text-zinc-900'} font-korean leading-relaxed`}>{language === 'ko' ? "다정한 티칭 스크립트와 가이드를 보려면 로그인이 필요해요!" : "Log in to unlock the full teaching scripts and guides!"}</p>
              <button onClick={openLoginModal} className="bg-white text-black px-8 py-3 rounded-2xl font-black text-sm uppercase shadow-xl w-full">{language === 'ko' ? "지금 로그인하기" : "Log In Now"}</button>
            </div>
          ) : (
            <>
              <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-3xl p-5 flex items-center gap-5">
                <button
                  onClick={onStartPronunciation}
                  className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center transition-all ${isListening ? 'bg-red-500 animate-pulse' : 'bg-indigo-600'} text-white shadow-lg`}
                >
                  {isListening ? (
                    <div className="flex items-center gap-1.5"><div className="w-1.5 h-6 bg-white rounded-full animate-mic-wave"></div><div className="w-1.5 h-8 bg-white rounded-full animate-mic-wave delay-75"></div><div className="w-1.5 h-6 bg-white rounded-full animate-mic-wave delay-150"></div></div>
                  ) : (
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" /><path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" /></svg>
                  )}
                </button>
                <div className="flex-1">
                  <p className={`text-xs ${isNight ? 'text-white' : 'text-zinc-900'} font-black uppercase tracking-widest`}>{isListening ? (language === 'ko' ? "듣고 있어요..." : "Listening...") : `${language === 'ko' ? '질문' : 'Question'} ${item.id} - Coach`}</p>
                  <p className="text-[10px] text-indigo-300/80 font-bold">{isListening ? (language === 'ko' ? "아이의 목소리를 분석 중입니다" : "Analyzing child's voice...") : (language === 'ko' ? "버튼을 누르고 발음해보세요!" : "Tap to speak and check pronunciation!")}</p>
                </div>
              </div>
              {userPlan === 'pro' ? (
                <>
                  {/* Collapsible Teaching Script (Mom's Tip) */}
                  <div className={`${isNight ? 'bg-orange-500/5 border-orange-500/10 shadow-inner' : 'bg-orange-50/50 border-orange-100 shadow-sm'} border rounded-3xl overflow-hidden transition-all duration-300`}>
                    <div
                      onClick={() => setIsScriptExpanded(!isScriptExpanded)}
                      className="w-full flex justify-between items-center p-4 md:p-5 hover:bg-orange-500/5 transition-colors text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base md:text-lg">💌</span>
                        <p className="text-xs md:text-sm font-black uppercase text-orange-500 tracking-wider font-display">{t('lbl_mom_tip')}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex bg-zinc-800/50 rounded-lg p-0.5 border border-white/5" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={(e) => { e.stopPropagation(); onSetScriptLanguage(item.id, 'ko'); }}
                            className={`px-2 py-0.5 rounded-md text-[8px] font-black transition-all ${currentScriptLang === 'ko' ? 'bg-orange-500 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
                          >KO</button>
                          <button
                            onClick={(e) => { e.stopPropagation(); onSetScriptLanguage(item.id, 'en'); }}
                            className={`px-2 py-0.5 rounded-md text-[8px] font-black transition-all ${currentScriptLang === 'en' ? 'bg-orange-500 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
                          >EN</button>
                        </div>
                        <svg className={`w-4 h-4 text-orange-500 transition-transform duration-300 ${isScriptExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                    <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isScriptExpanded ? 'max-h-[500px] border-t border-orange-500/10' : 'max-h-0'}`}>
                      <div className="p-5">
                        <div className={`text-base md:text-xl ${isNight ? 'text-zinc-100' : 'text-zinc-800'} font-korean leading-relaxed font-bold italic border-l-4 border-orange-500 pl-4`} dangerouslySetInnerHTML={{ __html: renderMarkdown(`&quot;${displayScript || ""}&quot;`) }} />
                      </div>
                    </div>
                  </div>

                  {/* Collapsible Guide Box */}
                  <div className={`${isNight ? 'bg-zinc-950/20 border-white/5' : 'bg-zinc-50/80 border-zinc-200'} border rounded-3xl overflow-hidden transition-all duration-300`}>
                    <div
                      onClick={() => setIsGuideExpanded(!isGuideExpanded)}
                      className="w-full flex justify-between items-center p-4 md:p-5 hover:bg-zinc-800/10 transition-colors text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base md:text-lg">💡</span>
                        <p className="text-xs md:text-sm font-black uppercase text-zinc-400 tracking-wider font-display">{language === 'ko' ? '티칭 가이드' : 'Teaching Guide'}</p>
                      </div>
                      <svg className={`w-4 h-4 text-zinc-400 transition-transform duration-300 ${isGuideExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                    <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isGuideExpanded ? 'max-h-[500px] border-t border-white/5' : 'max-h-0'}`}>
                      <div className="p-5">
                        <div className={`text-sm md:text-base ${isNight ? 'text-zinc-300' : 'text-zinc-700'} font-korean leading-relaxed break-keep font-medium`} dangerouslySetInnerHTML={{ __html: renderMarkdown(simplifyGuideText(displayGuide || "")) }} />
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div 
                  className="relative group/paywall cursor-pointer overflow-hidden rounded-[2rem] border border-transparent hover:border-amber-500/20 hover:shadow-[0_0_30px_rgba(245,158,11,0.05)] transition-all duration-300"
                  onClick={() => setUpsellFeature('guide')}
                >
                  <div className="space-y-4 pointer-events-none opacity-30 transition-opacity duration-300 group-hover/paywall:opacity-40">
                    {/* Collapsible Teaching Script Preview */}
                    <div className={`${isNight ? 'bg-orange-500/5 border-orange-500/10 shadow-inner' : 'bg-orange-50/50 border-orange-100 shadow-sm'} border rounded-3xl p-4 md:p-5 text-left`}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm">💌</span>
                        <p className="text-xs font-black uppercase text-orange-500 tracking-wider font-display">{t('lbl_mom_tip')}</p>
                      </div>
                      <div className={`text-sm md:text-base ${isNight ? 'text-zinc-400' : 'text-zinc-600'} font-korean leading-relaxed font-bold italic border-l-4 border-orange-500 pl-4`}>
                        &quot;{getFirstSentence(displayScript || "")}&quot;
                      </div>
                      <div className="mt-2 space-y-1.5 opacity-20 filter blur-[2px]">
                        <div className={`h-2.5 w-11/12 ${isNight ? 'bg-white' : 'bg-zinc-800'} rounded`} />
                        <div className={`h-2.5 w-8/12 ${isNight ? 'bg-white' : 'bg-zinc-800'} rounded`} />
                      </div>
                    </div>

                    {/* Collapsible Guide Box Preview */}
                    <div className={`${isNight ? 'bg-zinc-950/20 border-white/5' : 'bg-zinc-50/80 border-zinc-200'} border rounded-3xl p-4 md:p-5 text-left`}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm">💡</span>
                        <p className="text-xs font-black uppercase text-zinc-400 tracking-wider font-display">{language === 'ko' ? '티칭 가이드' : 'Teaching Guide'}</p>
                      </div>
                      <div className={`text-xs md:text-sm ${isNight ? 'text-zinc-400' : 'text-zinc-600'} font-korean leading-relaxed break-keep font-medium`}>
                        {getFirstSentence(simplifyGuideText(displayGuide || ""))}
                      </div>
                      <div className="mt-2 space-y-1.5 opacity-20 filter blur-[2px]">
                        <div className={`h-2.5 w-11/12 ${isNight ? 'bg-white' : 'bg-zinc-800'} rounded`} />
                        <div className={`h-2.5 w-9/12 ${isNight ? 'bg-white' : 'bg-zinc-800'} rounded`} />
                      </div>
                    </div>
                  </div>

                  {/* Soft Premium Blurred Gradient Overlay */}
                  <div 
                    className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4 transition-all duration-300 group-hover/paywall:backdrop-blur-[1px]"
                    style={{ 
                      background: isNight 
                        ? 'linear-gradient(to bottom, rgba(24,24,27,0.2) 0%, rgba(24,24,27,0.7) 40%, rgba(24,24,27,0.95) 90%)'
                        : 'linear-gradient(to bottom, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.7) 40%, rgba(255,255,255,0.95) 90%)'
                    }}
                  >
                    {/* Custom Soft Lock Icon with gold gradient */}
                    <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-yellow-600 flex items-center justify-center shadow-lg shadow-amber-500/20 transform group-hover/paywall:scale-110 transition-transform duration-300">
                      <svg className="w-5 h-5 md:w-6 md:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>

                    <div className="text-center px-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-500 text-[9px] font-black uppercase tracking-wider mb-1 shadow-sm">
                        👑 PREMIUM PREVIEW
                      </span>
                      <p className={`text-xs md:text-sm font-black font-korean ${isNight ? 'text-white' : 'text-zinc-900'} leading-snug`}>
                        {language === 'ko' ? '티칭 가이드와 스크립트 전문 보기' : 'Unlock full Guide & Teaching Script'}
                      </p>
                      <p className="text-[9px] text-zinc-500 font-bold mt-0.5">
                        {language === 'ko' ? '탭하여 7일 무료 체험을 시작하세요' : 'Tap to start your 7-day free trial'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
});

WorksheetItemCard.displayName = 'WorksheetItemCard';
