import React, { useState, useRef } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { askChekkiQuestion } from '../services/geminiService';
import { toJpeg } from 'html-to-image';
import { ChekkiMascot } from './Icons';
import { useAuth } from '../contexts/AuthContext';

/** Converts basic markdown (**bold**, *italic*, numbered/bullet lists) to safe HTML. */
function renderMarkdown(text: string): string {
  return text
    // Numbered list items: "1. text" → paragraph with bold number
    .replace(/^(\d+\.\s+)(.+)$/gm, '<p class="mb-2"><strong>$1</strong>$2</p>')
    // Bullet list items: "  * text" or "* text"
    .replace(/^\s*[*•-]\s+(.+)$/gm, '<p class="ml-4 mb-1 before:content-[\'·\'] before:mr-2 before:text-orange-400">$1</p>')
    // Bold+italic: ***text***
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    // Bold: **text**
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Italic: *text*
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Remaining plain lines (not already wrapped)
    .replace(/^(?!<)(.+)$/gm, '<p class="mb-2">$1</p>')
    // Collapse multiple blank lines
    .replace(/(<\/p>\s*){2,}/g, '</p>');
}

interface Props {
  onClose: () => void;
}

export const AskChekkiModal: React.FC<Props> = ({ onClose }) => {
  const { language } = useLanguage();
  const { isAuthenticated, openLoginModal } = useAuth();
  const [question, setQuestion] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);
  const [showWarning, setShowWarning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const contentRef = useRef<HTMLDivElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;
    
    setIsAsking(true);
    setAnswer(null);
    try {
      const result = await askChekkiQuestion(question, !isAuthenticated);
      setAnswer(result);
    } catch (err) {
      alert(language === 'ko' ? "오류가 발생했습니다. 다시 시도해주세요." : "Failed to get an answer. Please try again.");
    } finally {
      setIsAsking(false);
    }
  };

  const handleClose = () => {
    if (answer && !showWarning) {
      setShowWarning(true);
    } else {
      onClose();
    }
  };

  const handleSave = async () => {
    if (!contentRef.current) return;
    setIsSaving(true);
    try {
      const dataUrl = await toJpeg(contentRef.current, { quality: 1, backgroundColor: '#18181b', pixelRatio: 2 });
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
      onClose();
    }
  };

  if (showWarning) {
    return (
      <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => onClose()}></div>
        <div className="relative bg-zinc-900 border border-white/10 rounded-3xl p-8 max-w-sm w-full text-center animate-fade-in-up">
          <p className="text-white font-bold text-lg mb-8 font-korean">
            {language === 'ko' ? "잠깐만요! 답변이 사라집니다. 기기에 저장하시겠습니까?" : "Wait! This answer will disappear. Do you want to save it?"}
          </p>
          <div className="flex flex-col gap-4">
            <button onClick={handleSave} disabled={isSaving} className="w-full bg-orange-500 text-white py-4 rounded-2xl font-black uppercase text-xs shadow-xl disabled:opacity-50">
              {isSaving ? "Saving..." : (language === 'ko' ? "저장하고 닫기" : "Save & Close")}
            </button>
            <button onClick={onClose} className="w-full bg-zinc-800 text-zinc-400 py-4 rounded-2xl font-black uppercase text-xs hover:bg-zinc-700">
              {language === 'ko' ? "그냥 닫기" : "Discard & Close"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={handleClose}></div>
      <div className="relative bg-zinc-950 border border-white/10 rounded-[2.5rem] w-full max-w-2xl max-h-[90dvh] flex flex-col shadow-2xl animate-fade-in-up overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5 bg-zinc-900/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-500/10 border border-orange-500/20 rounded-2xl flex items-center justify-center">
              <span className="text-2xl">🙋‍♂️</span>
            </div>
            <div>
              <h2 className="text-xl font-black text-white font-display leading-tight tracking-tight">Ask Chekki</h2>
              <p className="text-xs text-orange-400 font-bold uppercase tracking-widest">{language === 'ko' ? "무엇이든 물어보세요!" : "Ask anything about school!"}</p>
            </div>
          </div>
          <button onClick={handleClose} className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white flex items-center justify-center transition-colors">
            ✕
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 flex flex-col items-center">
          
          {!answer && !isAsking && (
            <div className="flex flex-col items-center justify-center text-center opacity-60 flex-1 min-h-[200px]">
              <ChekkiMascot className="w-32 h-32 mb-4" mood="happy" />
              <p className="text-zinc-300 font-bold font-korean">
                {language === 'ko' ? "선생님처럼 친절하게 답변해드릴게요." : "I'll answer just like your teacher."}
              </p>
            </div>
          )}

          {isAsking && (
            <div className="flex flex-col items-center justify-center flex-1 min-h-[200px] space-y-4">
              <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-orange-400 font-bold text-xs uppercase tracking-widest animate-pulse">
                {language === 'ko' ? "답변을 생각하는 중..." : "Thinking..."}
              </p>
            </div>
          )}

          {answer && (
            <div ref={contentRef} className="bg-zinc-900 border border-white/10 rounded-[2rem] p-6 md:p-10 w-full relative">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <span className="text-[10rem]">💡</span>
              </div>
              <div className="relative z-10 flex gap-4 mb-6">
                <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center border-2 border-white/10 shadow-lg shrink-0 overflow-hidden">
                  <ChekkiMascot className="w-full h-full scale-110" mood="happy" />
                </div>
                <div className="bg-zinc-800/80 p-4 rounded-2xl rounded-tl-none border border-white/5 w-fit max-w-[85%] self-start">
                   <p className="text-zinc-200 text-sm italic font-korean">&quot;{question}&quot;</p>
                </div>
              </div>
              <div className="relative z-10 pl-2">
                <div
                  className="text-white md:text-lg font-korean leading-loose prose-answer"
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(answer) }}
                />
                
                {!isAuthenticated && (
                   <div className="mt-8 border border-orange-500/30 bg-orange-500/10 p-5 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 w-full">
                     <div className="text-center md:text-left">
                        <p className="text-orange-400 font-black text-sm uppercase tracking-widest">{language === 'ko' ? "더 자세한 설명이 필요하신가요?" : "Need a deeper breakdown?"}</p>
                        <p className="text-zinc-400 text-xs font-korean mt-1">{language === 'ko' ? "로그인하고 추가 예문을 확인하세요!" : "Login to view full examples, translations, and grammar rules!"}</p>
                     </div>
                     <button 
                       onClick={() => { onClose(); openLoginModal(); }} 
                       className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest whitespace-nowrap shadow-xl transition-all"
                     >
                       {language === 'ko' ? "무료로 로그인" : "Unlock Answer"}
                     </button>
                   </div>
                )}
              </div>
              
              <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between opacity-50 relative z-10">
                 <p className="text-[10px] uppercase font-black tracking-[0.2em] text-white">Chekki AI Tutor</p>
                 <span className="text-sm">⭐️</span>
              </div>
            </div>
          )}
          
          {answer && (
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
          )}

        </div>

        {/* Input Footer */}
        <div className="p-4 border-t border-white/5 bg-zinc-950">
          <form onSubmit={handleSubmit} className="relative">
            <input 
              type="text" 
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder={language === 'ko' ? "예: 관사 a와 an의 차이는 무엇인가요?" : "e.g., What is the difference between a and an?"}
              className="w-full bg-zinc-900 border border-white/10 rounded-2xl py-4 pl-5 pr-14 text-white focus:outline-none focus:border-orange-500 font-korean placeholder:text-zinc-600 shadow-inner"
              disabled={isAsking}
            />
            <button 
              type="submit" 
              disabled={isAsking || !question.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center text-white disabled:opacity-50 hover:bg-orange-600 transition-colors shadow-lg"
            >
              <svg className="w-5 h-5 -ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};
