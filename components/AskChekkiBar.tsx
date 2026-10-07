import React, { useState, useEffect, useRef } from 'react';
import { ChatTurn } from '../services/geminiService';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from '../contexts/ToastContext';
import { toJpeg } from 'html-to-image';
import { renderMarkdown } from '../utils/markdownUtils';
import { ChekkiMascot } from './Icons';
import { DownloadSimple, PaperPlaneRight, X } from '@phosphor-icons/react';
import { useDialogA11y } from '../hooks/useDialogA11y';

// --- AskChekkiBar Component ---

interface AskChekkiBarProps {
  query: string;
  setQuery: (q: string) => void;
  onSubmit: (query: string) => void;
  isAsking: boolean;
  language: string;
  isNight?: boolean;
}

export const AskChekkiBar: React.FC<AskChekkiBarProps> = ({
  query,
  setQuery,
  onSubmit,
  isAsking,
  language,
  isNight = false,
}) => {
  const { t } = useLanguage();
  const suggestions =
    language === 'ko'
      ? [
          '아이가 왜 이 문제를 틀렸을까요?',
          '아이에게 어떻게 쉽게 설명할까요?',
          '비슷한 예시 문제를 내주세요',
        ]
      : [
          'Why did my child get this wrong?',
          'How can I explain this easily?',
          'Give me another example',
        ];

  return (
    <div className="flex w-full flex-col gap-3">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit(query);
        }}
        className="flex w-full items-center gap-2 rounded-md bg-surface py-1.5 pl-4 pr-1.5 ring-1 ring-inset ring-rule focus-within:ring-2 focus-within:ring-line"
      >
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('ask_placeholder')}
          aria-label={t('ask_placeholder')}
          className="min-w-0 flex-1 bg-transparent text-[16px] text-ink placeholder:text-ink-3 focus:outline-none"
          enterKeyHint="send"
        />
        <button
          type="submit"
          disabled={!query.trim() || isAsking}
          aria-label={language === 'ko' ? '물어보기' : 'Ask'}
          className="btn-press flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-line text-[#2b211a] disabled:bg-sunken disabled:text-ink-3"
        >
          {isAsking ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#2b211a]/30 border-t-[#2b211a]" />
          ) : (
            <PaperPlaneRight size={18} weight="bold" />
          )}
        </button>
      </form>

      {/* Suggestions: wrap instead of a hidden side-scroll */}
      <div className="flex flex-wrap gap-2">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion}
            onClick={() => onSubmit(suggestion)}
            disabled={isAsking}
            className="btn-press min-h-10 rounded-full bg-line-soft px-3.5 text-[14px] font-semibold text-line-ink hover:ring-1 hover:ring-inset hover:ring-line/50 disabled:opacity-50 break-keep"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
};

// --- AskChekkiAnswerModal Component ---

interface AskChekkiAnswerModalProps {
  answer: string | null;
  isAsking: boolean;
  question: string;
  isAuthenticated: boolean;
  language: string;
  history: ChatTurn[];
  onClose: () => void;
  openLoginModal: () => void;
  onFollowUp: (question: string) => void;
  isNight?: boolean;
}

export const AskChekkiAnswerModal: React.FC<AskChekkiAnswerModalProps> = ({
  answer,
  isAsking,
  question,
  isAuthenticated,
  language,
  history,
  onClose,
  openLoginModal,
  onFollowUp,
  isNight = false,
}) => {
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [followUpText, setFollowUpText] = useState('');
  const [showConfirmClose, setShowConfirmClose] = useState(false);
  const isKo = language === 'ko';
  const isOpen = !!answer || isAsking || history.length > 0;
  // Escape: first dismiss the confirm overlay, then attempt close. Ref so the
  // hook (which captures onClose once per open) always sees current state.
  const escRef = useRef<() => void>(() => {});
  const dialogRef = useDialogA11y<HTMLDivElement>({ isOpen, onClose: () => escRef.current() });

  const handleCloseAttempt = () => {
    // If there's an answer from Chekki, warn them before wiping
    if (history.some((t) => t.role === 'model')) {
      setShowConfirmClose(true);
    } else {
      onClose();
    }
  };

  // Scroll to bottom whenever history or loading state changes
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, isAsking]);

  // Reset confirmation state when a new question starts
  useEffect(() => {
    if (isAsking) {
      setShowConfirmClose(false);
    }
  }, [isAsking]);

  const handleSave = async () => {
    if (!chatContainerRef.current) return false;
    setIsSaving(true);
    try {
      const dataUrl = await toJpeg(chatContainerRef.current, {
        quality: 0.95,
        backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--m-surface').trim() || '#ffffff',
        pixelRatio: 2,
        skipFonts: true, // Speeds up capture on mobile
      });
      const { saveImageToDevice } = await import('../utils/exportUtils');
      await saveImageToDevice(
        dataUrl,
        'Ask Chekki',
        language === 'ko' ? '채키가 제 질문에 답변해줬어요!' : 'Chekki answered my question!',
        'chekki-answer'
      );
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      return true;
    } catch (err) {
      console.error('Failed to save answer image', err);
      showToast({ type: 'error', message: language === 'ko' ? '저장에 실패했습니다.' : 'Failed to save the answer.' });
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleFollowUpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!followUpText.trim() || isAsking) return;
    onFollowUp(followUpText.trim());
    setFollowUpText('');
  };

  escRef.current = () => (showConfirmClose ? setShowConfirmClose(false) : handleCloseAttempt());

  // Don't render if there's no content at all and not loading
  if (!isOpen) return null;

  // We show all completed turns from history, plus the last pending question if isAsking
  const completedTurns = history;
  // The current pending question is `question` when `isAsking` is true

  const userBubble = (text: string, key?: React.Key) => (
    <div key={key} className="flex justify-end">
      <p className="max-w-[85%] rounded-md rounded-tr-sm bg-line-soft px-4 py-3 text-[15px] font-semibold leading-relaxed text-ink break-keep">
        {text}
      </p>
    </div>
  );
  const chekkiAvatar = (mood: 'happy' | 'thinking') => (
    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-line-soft ring-[3px] ring-line">
      <ChekkiMascot className="h-full w-full scale-110" mood={mood} />
    </span>
  );

  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center sm:items-start sm:p-4 sm:pt-10">
      <div
        className="absolute inset-0 bg-[#2b211a]/55 animate-fade-in"
        onClick={() => {
          if (showConfirmClose) setShowConfirmClose(false);
          else handleCloseAttempt();
        }}
        aria-hidden="true"
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="ask-title"
        tabIndex={-1}
        className="relative flex max-h-[90dvh] w-full flex-col overflow-hidden rounded-t-lg bg-surface ring-1 ring-inset ring-rule shadow-[0_24px_60px_-20px_rgba(43,33,26,0.45)] sm:max-w-lg sm:rounded-lg modal-enter"
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-rule px-5 py-4">
          <div className="min-w-0">
            <h2 id="ask-title" className="text-[17px] font-extrabold text-ink">
              {isKo ? '채키에게 물어보기' : 'Ask Chekki'}
            </h2>
            {history.length > 1 && (
              <p className="num text-[13px] text-ink-3">
                {isKo
                  ? `대화 ${Math.ceil(history.length / 2)}번`
                  : `${Math.ceil(history.length / 2)} exchange${Math.ceil(history.length / 2) > 1 ? 's' : ''}`}
              </p>
            )}
          </div>
          <button
            onClick={handleCloseAttempt}
            aria-label={isKo ? '닫기' : 'Close'}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-ink-3 hover:bg-sunken hover:text-ink"
          >
            <X size={20} weight="bold" />
          </button>
        </div>

        {/* Confirmation Overlay */}
        {showConfirmClose && (
          <div className="absolute inset-0 z-[210] flex items-center justify-center bg-surface p-6 animate-fade-in">
            <div className="w-full max-w-sm text-center">
              <h3 className="text-[20px] font-extrabold tracking-[-0.02em] text-ink break-keep">
                {isKo ? '대화를 닫을까요?' : 'Close this chat?'}
              </h3>
              <p className="mt-2 text-[15px] leading-relaxed text-ink-2 break-keep">
                {isKo
                  ? '닫으면 대화가 사라져요. 답변을 사진으로 저장해 둘까요?'
                  : "Closing clears this chat. Save the answer as a picture first?"}
              </p>
              <div className="mt-6 flex flex-col gap-2.5">
                <button
                  onClick={async () => {
                    if (isSaving) return;
                    const success = await handleSave();
                    if (success) onClose();
                  }}
                  disabled={isSaving}
                  className="btn-press flex min-h-12 w-full items-center justify-center gap-2 rounded-md bg-line text-[15px] font-bold text-[#2b211a] disabled:opacity-50"
                >
                  {isSaving ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#2b211a]/30 border-t-[#2b211a]" />
                  ) : (
                    <>
                      <DownloadSimple size={18} weight="bold" />
                      {isKo ? '사진으로 저장하고 닫기' : 'Save and close'}
                    </>
                  )}
                </button>
                <button
                  onClick={onClose}
                  disabled={isSaving}
                  className="btn-press min-h-12 w-full rounded-md bg-surface text-[15px] font-bold text-ink ring-1 ring-inset ring-rule hover:ring-ink-3 disabled:opacity-50"
                >
                  {isKo ? '저장 안 하고 닫기' : 'Close without saving'}
                </button>
                <button
                  onClick={() => setShowConfirmClose(false)}
                  disabled={isSaving}
                  className="min-h-11 w-full text-[14px] font-semibold text-ink-3 hover:text-ink disabled:opacity-50"
                >
                  {isKo ? '계속 대화하기' : 'Keep chatting'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Chat Body */}
        <div ref={chatContainerRef} className="custom-scrollbar flex-1 space-y-4 overflow-y-auto bg-surface px-5 py-4">
          {completedTurns.map((turn, idx) =>
            turn.role === 'user' ? (
              userBubble(turn.text, idx)
            ) : (
              <div key={idx} className="flex items-start gap-3">
                {chekkiAvatar('happy')}
                <div className="prose-answer min-w-0 flex-1 rounded-md rounded-tl-sm bg-sunken px-4 py-3">
                  <div
                    className="text-[15px] leading-relaxed text-ink break-keep"
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(turn.text) }}
                  />
                </div>
              </div>
            )
          )}

          {/* Pending question + thinking bubble */}
          {isAsking && (
            <>
              {userBubble(question)}
              <div className="flex items-start gap-3" role="status">
                {chekkiAvatar('thinking')}
                <div className="flex items-center gap-2 rounded-md rounded-tl-sm bg-sunken px-4 py-3">
                  <span className="flex gap-1" aria-hidden="true">
                    <span className="h-2 w-2 rounded-full bg-line animate-[bounce_1s_infinite_0ms]" />
                    <span className="h-2 w-2 rounded-full bg-line animate-[bounce_1s_infinite_150ms]" />
                    <span className="h-2 w-2 rounded-full bg-line animate-[bounce_1s_infinite_300ms]" />
                  </span>
                  <span className="text-[14px] text-ink-3">{isKo ? '생각하는 중...' : 'Thinking...'}</span>
                </div>
              </div>
            </>
          )}

          <div ref={chatBottomRef} />
        </div>

        {/* Follow-up + save */}
        {!isAsking && history.some((t) => t.role === 'model') && (
          <div className="shrink-0 space-y-2 border-t border-rule bg-surface px-4 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-3">
            {isAuthenticated ? (
              <form
                onSubmit={handleFollowUpSubmit}
                className="flex items-center gap-2 rounded-md bg-sunken py-1.5 pl-4 pr-1.5 ring-1 ring-inset ring-rule focus-within:ring-2 focus-within:ring-line"
              >
                <input
                  type="text"
                  value={followUpText}
                  onChange={(e) => setFollowUpText(e.target.value)}
                  placeholder={isKo ? '더 궁금한 게 있나요?' : 'Ask a follow-up'}
                  aria-label={isKo ? '이어서 물어보기' : 'Follow-up question'}
                  className="min-w-0 flex-1 bg-transparent text-[16px] text-ink placeholder:text-ink-3 focus:outline-none"
                  enterKeyHint="send"
                />
                <button
                  type="submit"
                  disabled={!followUpText.trim()}
                  aria-label={isKo ? '보내기' : 'Send'}
                  className="btn-press flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-line text-[#2b211a] disabled:bg-transparent disabled:text-ink-3"
                >
                  <PaperPlaneRight size={18} weight="bold" />
                </button>
              </form>
            ) : (
              <div className="flex items-center justify-between gap-3 rounded-md bg-line-soft px-4 py-3">
                <p className="min-w-0 text-[14px] font-semibold text-ink break-keep">
                  {isKo ? '무료로 가입하면 이어서 물어볼 수 있어요' : 'Sign up free to ask follow-ups'}
                </p>
                <button
                  onClick={() => {
                    onClose();
                    openLoginModal();
                  }}
                  className="btn-press min-h-11 shrink-0 rounded-md bg-sign px-4 text-[14px] font-bold text-on-sign"
                >
                  {isKo ? '가입하기' : 'Sign up'}
                </button>
              </div>
            )}
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex min-h-11 w-full items-center justify-center gap-2 rounded-md text-[14px] font-semibold text-ink-2 hover:bg-sunken hover:text-ink disabled:opacity-50"
            >
              {isSaving ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-ink-3/30 border-t-ink-3" />
              ) : saveSuccess ? (
                <span className="text-correct">{isKo ? '저장했어요' : 'Saved'}</span>
              ) : (
                <>
                  <DownloadSimple size={16} weight="bold" />
                  {isKo ? '답변 사진으로 저장' : 'Save answer as a picture'}
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
