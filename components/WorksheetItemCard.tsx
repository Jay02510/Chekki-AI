import React, { memo, useState } from 'react';
import { WorksheetItem } from '../types';
import { renderMarkdown } from '../utils/markdownUtils';
import { cleanAnswerText, removeMarkdown } from '../utils/speechUtils';
import {
  BookmarkSimple,
  CaretDown,
  ChatCircleText,
  Check,
  Microphone,
  Play,
  SpeakerHigh,
  X,
} from '@phosphor-icons/react';
import { Roundel } from './metro';

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
    const isAnswerLong = answerText.length > 20;
    const isStudentResponseLong = (item.student_response || '').length > 20;

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

    const graded = hasHandwriting !== false;
    const isWrong = item.is_correct === false && graded;
    const isRight = item.is_correct === true && graded;
    const ko = language === 'ko';
    const locked = userPlan !== 'pro' && index !== 0;

    const ProTag = () => (
      <span className="ml-1 rounded bg-line-soft px-1 text-[10px] font-extrabold leading-4 text-line-ink">PRO</span>
    );

    const toolBtn =
      'relative inline-flex min-h-11 items-center gap-2 rounded-md px-3 text-[14px] font-bold ring-1 ring-inset ring-rule bg-surface text-ink-2 hover:text-ink hover:ring-ink-3 active:scale-[0.97] transition-transform';

    return (
      <div onClick={(e) => e.stopPropagation()} className="relative pl-[58px] sm:pl-16" style={style}>
        <span className="absolute left-[3px] top-3 sm:left-[7px]">
          <Roundel state={isWrong ? 'wrong' : isRight ? 'right' : isActive ? 'current' : 'next'} size={44}>
            {item.id}
          </Roundel>
        </span>

        <div
          className={`overflow-hidden rounded-md bg-surface ring-inset transition-shadow duration-200 ${
            isActive ? 'ring-2 ring-line' : 'ring-1 ring-rule hover:ring-ink-3'
          }`}
        >
          <div
            role="button"
            tabIndex={0}
            aria-expanded={isActive}
            aria-label={ko ? `${item.id}번 문제 ${isActive ? '접기' : '펼치기'}` : `${isActive ? 'Collapse' : 'Expand'} question ${item.id}`}
            onClick={(e) => {
              e.stopPropagation();
              onToggleActive();
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                e.stopPropagation();
                onToggleActive();
              }
            }}
            className="flex cursor-pointer items-start justify-between gap-3 px-4 py-4 sm:px-5"
          >
            <div className="min-w-0">
              <p className="text-[16px] font-semibold leading-relaxed text-ink break-words">
                {item.question_text.replace(/^\d+[.)\s]+/, '')}
              </p>
              {item.question_translation && (
                <p className="mt-0.5 text-[14px] leading-relaxed text-ink-2 break-keep">{item.question_translation}</p>
              )}
              <p
                className={`mt-2 flex items-center gap-1.5 text-[13px] font-bold ${
                  isWrong ? 'text-wrong' : isRight ? 'text-correct' : 'text-line-ink'
                }`}
              >
                {isRight ? <Check size={14} weight="bold" /> : null}
                {isWrong
                  ? ko
                    ? '아이와 같이 보기'
                    : "Let's look together"
                  : isRight
                    ? ko
                      ? '맞았어요'
                      : 'Right'
                    : ko
                      ? '정답 보기'
                      : 'See the answer'}
              </p>
            </div>
            <CaretDown
              size={18}
              weight="bold"
              className={`mt-1 shrink-0 text-ink-3 transition-transform duration-200 ${isActive ? 'rotate-180' : ''}`}
            />
          </div>

          {isActive && (
            <div className="space-y-3 border-t border-rule px-4 pb-5 pt-4 sm:px-5 animate-fade-in">
              {!isAuthenticated && index !== 0 ? (
                <div className="rounded-md bg-sunken p-5">
                  <p className="text-[15px] font-semibold leading-relaxed text-ink">
                    {ko
                      ? '로그인하면 원어민 발음 듣기, 아이 발음 체크, 전체 설명까지 볼 수 있어요.'
                      : 'Sign in for native audio, pronunciation checks and full explanations.'}
                  </p>
                  <button onClick={openLoginModal} className="mt-3 min-h-11 w-full rounded-md bg-sign text-[15px] font-bold text-on-sign">
                    {ko ? '로그인하기' : 'Sign in'}
                  </button>
                </div>
              ) : (
                <>
                  {/* answer */}
                  <section className="rounded-md bg-sunken">
                    <button
                      type="button"
                      aria-expanded={isAnswerExpanded}
                      onClick={() => {
                        setIsAnswerExpanded(!isAnswerExpanded);
                        if (!isAnswerExpanded) setIsScriptExpanded(false);
                      }}
                      className="flex w-full items-center justify-between px-4 py-3 text-left"
                    >
                      <span className="text-[15px] font-bold text-ink">{ko ? '정답' : 'Answer'}</span>
                      <CaretDown size={16} weight="bold" className={`text-ink-3 transition-transform ${isAnswerExpanded ? 'rotate-180' : ''}`} />
                    </button>
                    {isAnswerExpanded && (
                      <div className="space-y-4 px-4 pb-4">
                        <div
                          className={`space-y-3 ${!isAuthenticated && index !== 0 ? 'pointer-events-none select-none blur-[4px] opacity-40' : ''}`}
                        >
                          {isWrong && (
                            <div>
                              <p className="text-[13px] font-semibold text-ink-3">{ko ? '아이의 답' : "Child's answer"}</p>
                              <p className={`mt-0.5 font-bold text-wrong line-through decoration-2 ${isStudentResponseLong ? 'text-lg' : 'text-2xl'}`}>
                                {item.student_response || (ko ? '(빈칸)' : '(blank)')}
                              </p>
                            </div>
                          )}
                          <div>
                            <p className="text-[13px] font-semibold text-ink-3">
                              {!graded ? (ko ? '정답지' : 'Answer key') : ko ? '정답' : 'Correct answer'}
                            </p>
                            <p
                              className={`mt-0.5 font-extrabold break-words ${isAnswerLong ? 'text-xl' : 'text-[28px] leading-tight'} ${
                                speechResult?.id === item.id ? (speechResult.success ? 'text-correct' : 'text-wrong') : 'text-ink'
                              }`}
                            >
                              {answerText}
                              {speechResult?.id === item.id && speechResult.success && (
                                <span className="ml-2 align-middle text-[15px] font-bold text-correct">
                                  {ko ? '잘 말했어요!' : 'Well said!'}
                                </span>
                              )}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (locked) setUpsellFeature('pronunciation');
                              else onStartPronunciation(e);
                            }}
                            aria-label={locked ? (ko ? 'Pro: AI 발음 평가' : 'Pro: AI pronunciation check') : t('tt_pronunciation')}
                            className={`${toolBtn} ${isListening ? '!bg-wrong !text-white !ring-wrong' : ''}`}
                          >
                            <Microphone size={18} weight="bold" />
                            {isListening ? (ko ? '듣는 중…' : 'Listening…') : ko ? '따라 말하기' : 'Say it'}
                            {locked && <ProTag />}
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (locked) setUpsellFeature('audio');
                              else onPlayAudio(cleanAnswerText(item.correct_answer || ''));
                            }}
                            aria-label={locked ? (ko ? 'Pro: 원어민 발음 듣기' : 'Pro: native audio') : t('tt_audio')}
                            className={toolBtn}
                          >
                            <SpeakerHigh size={18} weight="bold" />
                            {t('lbl_audio')}
                            {locked && <ProTag />}
                          </button>
                          <button
                            type="button"
                            onClick={(e) =>
                              handleActionClick(e, () => {
                                if (locked) setShowPaywall(true);
                                else onToggleMistake(item);
                              })
                            }
                            aria-pressed={flagged}
                            aria-label={t('tt_bookmark')}
                            className={`${toolBtn} ${flagged ? '!text-wrong !ring-wrong' : ''}`}
                          >
                            <BookmarkSimple size={18} weight={flagged ? 'fill' : 'bold'} />
                            {t('lbl_bookmark')}
                            {locked && <ProTag />}
                          </button>
                          <button
                            type="button"
                            onClick={(e) =>
                              handleActionClick(e, () => {
                                if (locked) setShowPaywall(true);
                                else onRefine(item);
                              })
                            }
                            aria-label={t('tt_refine')}
                            className={toolBtn}
                          >
                            <ChatCircleText size={18} weight="bold" />
                            {t('lbl_refine')}
                          </button>
                        </div>
                      </div>
                    )}
                  </section>

                  {/* what to say: the guide in the parent's language */}
                  <section className="rounded-md bg-line-soft">
                    <div className="flex items-center justify-between gap-3 px-4 py-3">
                      <button
                        type="button"
                        aria-expanded={isScriptExpanded}
                        onClick={() => {
                          setIsScriptExpanded(!isScriptExpanded);
                          if (!isScriptExpanded) setIsAnswerExpanded(false);
                        }}
                        className="flex flex-1 items-center justify-between text-left"
                      >
                        <span className="text-[15px] font-bold text-ink">{ko ? '아이에게 이렇게 말해 주세요' : 'What to say to your child'}</span>
                        <CaretDown size={16} weight="bold" className={`text-ink-3 transition-transform ${isScriptExpanded ? 'rotate-180' : ''}`} />
                      </button>
                      <div role="group" aria-label={ko ? '스크립트 언어' : 'Script language'} className="flex shrink-0 rounded bg-surface p-0.5">
                        {(['ko', 'en'] as const).map((lng) => (
                          <button
                            key={lng}
                            type="button"
                            aria-pressed={currentScriptLang === lng}
                            onClick={(e) => {
                              e.stopPropagation();
                              onSetScriptLanguage(item.id, lng);
                            }}
                            className={`min-h-8 min-w-9 rounded px-2 text-xs font-bold ${
                              currentScriptLang === lng ? 'bg-sign text-on-sign' : 'text-ink-3'
                            }`}
                          >
                            {lng === 'ko' ? '한' : 'EN'}
                          </button>
                        ))}
                      </div>
                    </div>
                    {isScriptExpanded && (
                      <div className="space-y-4 px-4 pb-4">
                        <div
                          className="teaching-script-text text-[17px] font-semibold leading-relaxed text-ink break-keep"
                          dangerouslySetInnerHTML={{ __html: renderMarkdown(`"${displayScript || ''}"`) }}
                        />
                        {displayGuide && (
                          <p className="text-[14px] leading-relaxed text-ink-2 break-keep">{simplifyGuideText(displayGuide)}</p>
                        )}
                        {currentScriptLang === 'en' && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (locked) setUpsellFeature('guide');
                              else onPlayAudio(displayScript || '');
                            }}
                            className={toolBtn}
                          >
                            <Play size={16} weight="fill" />
                            {ko ? '질문 읽어 주기' : 'Read the question aloud'}
                            {locked && <ProTag />}
                          </button>
                        )}
                      </div>
                    )}
                  </section>
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
