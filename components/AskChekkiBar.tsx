import React, { useState, useEffect, useRef } from 'react';
import { ChatTurn } from '../services/geminiService';
import { useLanguage } from '../contexts/LanguageContext';
import { toJpeg } from 'html-to-image';
import { renderMarkdown } from '../utils/markdownUtils';
import { ChekkiMascot } from './Icons';

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
  const suggestions = language === 'ko' 
    ? ['아이가 왜 이 문제를 틀렸을까요?', '아이에게 어떻게 쉽게 설명할까요?', '비슷한 예시 문제를 내주세요']
    : ['Why did my child get this wrong?', 'How can I explain this easily?', 'Give me another example'];

  return (
    <div className="flex flex-col w-full gap-3">
      {/* Suggestions */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {suggestions.map((suggestion, idx) => (
          <button
            key={idx}
            onClick={() => onSubmit(suggestion)}
            className={`shrink-0 px-4 py-2 ${isNight ? 'bg-white/5 hover:bg-white/10 text-zinc-300 border-white/10' : 'bg-black/5 hover:bg-black/10 text-zinc-700 border-black/10'} text-[10px] sm:text-xs font-korean rounded-full border transition-colors whitespace-nowrap active:scale-[0.97]`}
          >
            {suggestion}
          </button>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit(query);
        }}
        className={`relative flex items-center ${isNight ? 'bg-zinc-900' : 'bg-white shadow-xl border-zinc-200'} border border-transparent hover:border-orange-500/30 focus-within:border-orange-500 rounded-3xl pl-4 pr-6 py-2.5 md:pl-8 md:pr-10 md:py-5 shadow-2xl transition-transform duration-200 ease-[var(--ease-out-strong)] opacity-100 w-full`}
      >
        <button
          type="submit"
          disabled={!query.trim() || isAsking}
          className={`shrink-0 mr-3 md:mr-4 transition-transform duration-200 ease-[var(--ease-out-strong)] opacity-100  active:scale-[0.97] ${query.trim() ? 'text-orange-500' : 'text-zinc-500'}`}
          title="Search"
        >
          {isAsking ? (
            <div className="w-5 h-5 md:w-6 md:h-6 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
          ) : (
            <svg
              className="w-5 h-5 md:w-7 md:h-7"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          )}
        </button>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('ask_placeholder')}
          className={`flex-1 bg-transparent ${isNight ? 'text-white' : 'text-zinc-900'} text-[11px] sm:text-xs md:text-sm lg:text-base font-korean placeholder:text-zinc-500 focus:outline-none`}
          enterKeyHint="send"
        />
      </form>
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
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [followUpText, setFollowUpText] = useState('');
  const [showConfirmClose, setShowConfirmClose] = useState(false);

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
        backgroundColor: isNight ? '#09090b' : '#ffffff',
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
      alert(language === 'ko' ? '저장에 실패했습니다.' : 'Failed to save the answer.');
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

  // Don't render if there's no content at all and not loading
  if (!answer && !isAsking && history.length === 0) return null;

  // We show all completed turns from history, plus the last pending question if isAsking
  const completedTurns = history;
  // The current pending question is `question` when `isAsking` is true

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center p-4 pt-[calc(env(safe-area-inset-top)+1rem)] sm:pt-10">
      <div
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        onClick={() => {
          if (showConfirmClose) setShowConfirmClose(false);
          else handleCloseAttempt();
        }}
      />
      <div
        className={`relative ${isNight ? 'bg-zinc-950 border-white/5' : 'bg-white border-zinc-200'} border rounded-3xl w-full max-w-lg max-h-[85dvh] flex flex-col shadow-2xl animate-fade-in-down overflow-hidden`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-white/5 shrink-0">
          <div className="flex items-center gap-4">
            <span className="text-2xl shrink-0">{isAsking ? '💭' : '🙋‍♂️'}</span>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] text-orange-400 font-black uppercase tracking-wide leading-normal">
                {language === 'ko' ? '채키에게 물어보기' : 'Ask Chekki'}
              </p>
              <p
                className={`${isNight ? 'text-white' : 'text-zinc-900'} text-xs font-semibold font-korean mt-0.5 opacity-60 leading-snug break-words pr-4`}
              >
                {history.length > 0
                  ? language === 'ko'
                    ? `${Math.ceil(history.length / 2)}번의 대화`
                    : `${Math.ceil(history.length / 2)} exchange${Math.ceil(history.length / 2) > 1 ? 's' : ''}`
                  : `"${question}"`}
              </p>
            </div>
          </div>
          <button
            onClick={handleCloseAttempt}
            className={`w-9 h-9 rounded-full ${isNight ? 'bg-white/5 border-white/10 text-white' : 'bg-zinc-100 border-zinc-200 text-zinc-500'} hover:opacity-80 flex items-center justify-center transition-colors shrink-0 ml-3`}
          >
            ✕
          </button>
        </div>

        {/* Confirmation Overlay */}
        {showConfirmClose && (
          <div
            className={`absolute inset-0 z-[210] ${isNight ? 'bg-zinc-950/90' : 'bg-white/95'} backdrop-blur-md flex items-center justify-center p-8 animate-fade-in shadow-2xl`}
          >
            <div className="text-center space-y-6 max-w-sm">
              <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-2">
                <span className="text-3xl">⚠️</span>
              </div>
              <div>
                <h3
                  className={`text-xl font-black ${isNight ? 'text-white' : 'text-zinc-900'} font-display uppercase tracking-tight mb-2`}
                >
                  {language === 'ko' ? '대화를 종료할까요?' : 'Close Conversation?'}
                </h3>
                <p className="text-zinc-400 text-sm font-korean leading-relaxed">
                  {language === 'ko'
                    ? '지금 닫으면 대화 내용이 모두 사라집니다. 답변을 이미지로 저장하시겠어요?'
                    : 'Closing will wipe your current chat history. Would you like to save the answer as an image first?'}
                </p>
              </div>
              <div className="flex flex-col gap-3 pt-2">
                <button
                  onClick={async () => {
                    if (isSaving) return;
                    const success = await handleSave();
                    if (success) onClose();
                  }}
                  disabled={isSaving}
                  className={`w-full ${isNight ? 'bg-white text-black' : 'bg-zinc-900 text-white shadow-lg shadow-zinc-900/20'} py-4 rounded-2xl font-black text-xs uppercase tracking-wide shadow-xl active:scale-[0.97] transition-transform duration-200 ease-[var(--ease-out-strong)] opacity-100 disabled:opacity-50 flex items-center justify-center`}
                >
                  {isSaving ? (
                    <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>📥 {language === 'ko' ? '이미지로 저장하고 닫기' : 'Save & Close'}</>
                  )}
                </button>
                <button
                  onClick={onClose}
                  disabled={isSaving}
                  className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-500 py-4 rounded-2xl font-black text-xs uppercase tracking-wide border border-red-500/20 active:scale-[0.97] transition-transform duration-200 ease-[var(--ease-out-strong)] opacity-100 disabled:opacity-50"
                >
                  {language === 'ko' ? '저장하지 않고 종료' : 'Close Anyway'}
                </button>
                <button
                  onClick={() => setShowConfirmClose(false)}
                  disabled={isSaving}
                  className="w-full text-zinc-500 py-2 font-bold text-xs uppercase tracking-wide hover:text-white transition-colors disabled:opacity-50"
                >
                  {language === 'ko' ? '취소' : 'Cancel'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Chat Body */}
        <div
          ref={chatContainerRef}
          className={`overflow-y-auto px-5 py-4 flex-1 custom-scrollbar space-y-5 ${isNight ? 'bg-[#09090b]' : 'bg-zinc-50/50'}`}
        >
          {/* Render conversation history */}
          {completedTurns.map((turn, idx) =>
            turn.role === 'user' ? (
              /* User bubble */
              <div key={idx} className="flex justify-end">
                <div
                  className={`${isNight ? 'bg-orange-500/20 border-orange-500/20' : 'bg-orange-500/10 border-orange-500/20 shadow-sm'} rounded-2xl rounded-tr-sm px-4 py-2.5 max-w-[85%]`}
                >
                  <p
                    className={`${isNight ? 'text-zinc-200' : 'text-zinc-800'} text-xs italic font-korean leading-relaxed`}
                  >
                    &ldquo;{turn.text}&rdquo;
                  </p>
                </div>
              </div>
            ) : (
              /* Chekki answer bubble */
              <div key={idx} className="flex items-start gap-3">
                <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center border-2 border-white/10 shadow-lg shrink-0 overflow-hidden mt-0.5">
                  <ChekkiMascot className="w-full h-full scale-110" mood="happy" />
                </div>
                <div
                  className={`${isNight ? 'bg-zinc-900 border-white/5' : 'bg-white border-zinc-200 shadow-sm'} rounded-2xl rounded-tl-sm px-4 py-3 flex-1 prose-answer`}
                >
                  <div
                    className={`${isNight ? 'text-zinc-100' : 'text-zinc-900'} text-sm font-korean leading-relaxed`}
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(turn.text) }}
                  />
                </div>
              </div>
            )
          )}

          {/* Thinking / loading state for the current pending question */}
          {isAsking && (
            <>
              {/* Show the pending user question bubble */}
              <div className="flex justify-end">
                <div
                  className={`${isNight ? 'bg-orange-500/20 border-orange-500/20' : 'bg-orange-500/10 border-orange-500/20 shadow-sm'} rounded-2xl rounded-tr-sm px-4 py-2.5 max-w-[85%]`}
                >
                  <p
                    className={`${isNight ? 'text-zinc-200' : 'text-zinc-800'} text-xs italic font-korean leading-relaxed`}
                  >
                    &ldquo;{question}&rdquo;
                  </p>
                </div>
              </div>
              {/* Thinking bubble */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center border-2 border-white/10 shadow-lg shrink-0 overflow-hidden mt-0.5">
                  <ChekkiMascot className="w-full h-full scale-110 animate-float" mood="thinking" />
                </div>
                <div
                  className={`${isNight ? 'bg-zinc-900 border-white/5' : 'bg-white border-zinc-200 shadow-sm'} rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2`}
                >
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-orange-400 rounded-full animate-[bounce_1s_infinite_0ms]" />
                    <span className="w-2 h-2 bg-orange-400 rounded-full animate-[bounce_1s_infinite_150ms]" />
                    <span className="w-2 h-2 bg-orange-400 rounded-full animate-[bounce_1s_infinite_300ms]" />
                  </div>
                  <p className="text-zinc-400 text-xs font-korean">
                    {language === 'ko' ? '생각하는 중...' : 'Thinking...'}
                  </p>
                </div>
              </div>
            </>
          )}

          {/* Scroll anchor */}
          <div ref={chatBottomRef} />
        </div>

        {/* Follow-up Input */}
        {!isAsking && history.length > 0 && isAuthenticated && (
          <div
            className={`px-4 pt-3 pb-3 border-t border-white/5 shrink-0 ${isNight ? 'bg-zinc-950/80' : 'bg-zinc-50/80'}`}
          >
            <form
              onSubmit={handleFollowUpSubmit}
              className={`flex items-center gap-2 ${isNight ? 'bg-zinc-900 border-white/10' : 'bg-white border-zinc-200 shadow-sm'} focus-within:border-orange-500/60 rounded-2xl px-4 py-2.5 transition-transform duration-200 ease-[var(--ease-out-strong)] opacity-100`}
            >
              <input
                type="text"
                value={followUpText}
                onChange={(e) => setFollowUpText(e.target.value)}
                placeholder={
                  language === 'ko'
                    ? '더 궁금한 게 있나요?'
                    : 'Want more examples? Ask a follow-up!'
                }
                className={`flex-1 bg-transparent ${isNight ? 'text-white' : 'text-zinc-900'} text-xs font-korean placeholder:text-zinc-500 focus:outline-none`}
                enterKeyHint="send"
                autoFocus={false}
              />
              <button
                type="submit"
                disabled={!followUpText.trim() || isAsking}
                className={`shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-transform duration-200 ease-[var(--ease-out-strong)] opacity-100 active:scale-[0.97] ${followUpText.trim() ? 'bg-orange-500 text-white' : 'bg-zinc-800 text-zinc-500'}`}
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.269 20.876L5.999 12zm0 0h7.5"
                  />
                </svg>
              </button>
            </form>
          </div>
        )}

        {/* Save button row (only show when we have answers) */}
        {!isAsking && history.some((t) => t.role === 'model') && (
          <div
            className={`px-4 pb-4 shrink-0 border-t ${isNight ? 'border-white/5' : 'border-zinc-100'}`}
          >
            <button
              onClick={handleSave}
              disabled={isSaving}
              className={`w-full mt-3 py-3.5 rounded-2xl flex items-center justify-center gap-2 text-xs font-black uppercase tracking-wide transition-transform duration-200 ease-[var(--ease-out-strong)] opacity-100 active:scale-[0.97] border ${isNight ? 'bg-zinc-900 border-white/10 text-zinc-400 hover:text-white' : 'bg-zinc-100 border-zinc-200 text-zinc-500 hover:text-zinc-800 shadow-sm'} disabled:opacity-50`}
            >
              {isSaving ? (
                <div className="w-4 h-4 border-2 border-zinc-500/20 border-t-zinc-500 rounded-full animate-spin" />
              ) : saveSuccess ? (
                <span className="text-emerald-500 flex items-center gap-2">
                  ✅ {language === 'ko' ? '저장 완료!' : 'Saved!'}
                </span>
              ) : (
                <>
                  <span>📥</span> {language === 'ko' ? '이미지로 저장' : 'Save as Image'}
                </>
              )}
            </button>
          </div>
        )}

        {/* Footer upsell for guests */}
        {!isAsking && !isAuthenticated && history.some((t) => t.role === 'model') && (
          <div
            className={`px-6 pb-6 pt-3 border-t ${isNight ? 'border-white/5 bg-zinc-950/50' : 'border-zinc-100 bg-zinc-50/50'} shrink-0`}
          >
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[10px] text-orange-400 font-black uppercase tracking-wide mb-0.5">
                  {language === 'ko' ? '도움이 되셨나요?' : 'Was this helpful?'}
                </p>
                <p className="text-[10px] text-zinc-500 font-korean truncate">
                  {language === 'ko'
                    ? '무료 로그인하고 대화를 이어가세요!'
                    : 'Login to ask follow-ups & get deeper answers!'}
                </p>
              </div>
              <button
                onClick={() => {
                  onClose();
                  openLoginModal();
                }}
                className="text-[10px] bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl font-black uppercase tracking-wider whitespace-nowrap shadow-lg shadow-orange-500/20 transition-transform duration-200 ease-[var(--ease-out-strong)] opacity-100 active:scale-[0.97]"
              >
                {language === 'ko' ? '회원가입' : 'Sign Up'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
