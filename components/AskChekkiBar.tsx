import React, { useRef, useState } from 'react';
import { ChekkiMascot } from './Icons';
import { toJpeg } from 'html-to-image';
import { renderMarkdown } from '../utils/markdownUtils';

// --- AskChekkiBar Component ---

interface AskChekkiBarProps {
  query: string;
  setQuery: (q: string) => void;
  onSubmit: (query: string) => void;
  isAsking: boolean;
  language: string;
}

export const AskChekkiBar: React.FC<AskChekkiBarProps> = ({ query, setQuery, onSubmit, isAsking, language }) => (
  <form
    onSubmit={(e) => { e.preventDefault(); onSubmit(query); }}
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
      placeholder={language === 'ko' ? "문법이 헷갈리나요? 채키에게 질문해 보세요!" : "Confused about grammar? Ask Chekki!"}
      className="flex-1 bg-transparent text-white text-[11px] sm:text-xs md:text-sm lg:text-base font-korean placeholder:text-zinc-500 focus:outline-none"
      enterKeyHint="send"
    />
  </form>
);

// --- AskChekkiAnswerModal Component ---

interface AskChekkiAnswerModalProps {
  answer: string | null;
  isAsking: boolean;
  question: string;
  isAuthenticated: boolean;
  language: string;
  onClose: () => void;
  openLoginModal: () => void;
}

export const AskChekkiAnswerModal: React.FC<AskChekkiAnswerModalProps> = ({ 
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
          <div className="flex items-center gap-4">
            <span className="text-2xl shrink-0">{isAsking ? '💭' : '🙋‍♂️'}</span>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] text-orange-400 font-black uppercase tracking-widest">
                {isAsking 
                  ? (language === 'ko' ? '생각하는 중...' : 'Thinking...') 
                  : (language === 'ko' ? '채키의 답변' : 'Chekki says')}
              </p>
              <p className="text-white text-sm font-semibold font-korean mt-0.5 italic opacity-70 leading-snug break-words pr-4">&ldquo;{question}&rdquo;</p>
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
            <div className="flex flex-col items-center justify-center py-16 px-4 gap-6 text-center">
              <div className="w-32 h-32 md:w-36 md:h-36 relative mb-2">
                <div className="absolute inset-0 bg-orange-500/20 rounded-full blur-2xl animate-pulse" />
                <ChekkiMascot className="w-full h-full relative z-10 animate-float" mood="thinking" />
              </div>
              <h3 className="text-xl md:text-2xl font-black text-white font-display tracking-tight">
                {language === 'ko' ? '흠... 흥미로운 질문이네요!' : 'Hmm... Interesting question!'}
              </h3>
              <p className="text-zinc-400 font-korean text-sm md:text-base leading-relaxed max-w-sm">
                {language === 'ko' 
                  ? '채키가 열심히 머리를 굴리며 가장 좋은 답변을 생각하고 있어요.' 
                  : 'Chekki is thinking hard to find the best answer for you.'}
              </p>
              <div className="flex items-center gap-3 mt-4 text-orange-400 text-[10px] md:text-xs font-black uppercase tracking-[0.2em] animate-pulse">
                <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(249,115,22,0.5)]" />
                {language === 'ko' ? '잠시만 기다려주세요' : 'Just a moment'}
              </div>
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
