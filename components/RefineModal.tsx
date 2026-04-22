import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { WorksheetItem } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface Props {
  item: WorksheetItem;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (itemId: number, reason: string) => Promise<void>;
  isSubmitting: boolean;
  isNight?: boolean;
}

export const RefineModal: React.FC<Props> = ({ item, isOpen, onClose, onSubmit, isSubmitting, isNight = true }) => {
  const { t, language } = useLanguage();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [customReason, setCustomReason] = useState('');

  useEffect(() => {
    if (isOpen && scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const quickChips = language === 'ko' ? [
    { id: 'simpler', label: '더 쉽게 설명해주세요 (유치원생)', text: '아이의 눈높이에 맞춰 훨씬 더 쉽고 간단한 비유로 설명해주세요.' },
    { id: 'example', label: '다른 예시 들어주세요', text: '이 개념을 사용하는 다른 문장이나 상황 예시를 2개 더 알려주세요.' },
    { id: 'grammar', label: '문법적인 이유가 궁금해요', text: '왜 이게 정답인지 문법적인 규칙을 학부모가 이해하기 쉽게 설명해주세요.' },
    { id: 'wrong', label: '정답이 틀린 것 같아요', text: '정답 추출이 잘못되었습니다. 다시 한번 맥락을 확인하고 올바른 답과 가이드를 내려주세요.' }
  ] : [
    { id: 'simpler', label: 'Make it simpler (For age 5-7)', text: 'Explain this much more simply with a fun analogy for a kindergartener.' },
    { id: 'example', label: 'Give another example', text: 'Provide two more examples using this exact concept or vocabulary.' },
    { id: 'grammar', label: 'Explain the grammar rules', text: 'Explain the grammar rule behind why this is the correct answer so I can teach it.' },
    { id: 'wrong', label: 'The answer seems wrong', text: 'I think the extracted answer is incorrect. Please re-evaluate the question and correct it.' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReason && !customReason.trim()) return;
    
    // Choose the selected chip text, or fallback to custom reason
    const chipText = quickChips.find(c => c.id === selectedReason)?.text;
    const finalReason = customReason.trim() ? customReason.trim() : (chipText || '');
    
    if (finalReason) {
      await onSubmit(item.id, finalReason);
    }
  };

  const handleChipSelect = (id: string, text: string) => {
    setSelectedReason(id);
    if (!customReason) {
      setCustomReason(''); // Clear custom reason if they tap a chip
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4" onClick={onClose}>
      <div 
        className={`${isNight ? 'bg-[#09090b] border-white/10' : 'bg-white border-zinc-200 shadow-2xl'} w-full sm:max-w-md md:max-w-lg rounded-[2.5rem] md:rounded-[3rem] border shadow-[0_0_80px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[85vh] animate-fade-in-up relative`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Animated Glow Background */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-orange-500/10 blur-[100px] rounded-full animate-pulse"></div>
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-indigo-500/10 blur-[100px] rounded-full animate-pulse delay-700"></div>

        <div 
          ref={scrollRef}
          className="p-8 md:p-10 flex-1 overflow-y-auto custom-scrollbar relative z-10"
        >
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center text-3xl shadow-[0_10px_30px_rgba(249,115,22,0.3)]">
                🪄
              </div>
              <div>
                <h3 className={`text-2xl md:text-3xl font-black ${isNight ? 'text-white' : 'text-zinc-900'} font-display leading-tight tracking-tight`}>
                  {language === 'ko' ? "설명 다듬기" : "Refine Explanation"}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
                  <p className="text-xs text-orange-500 font-black uppercase tracking-[0.2em]">
                    AI TUTOR
                  </p>
                </div>
              </div>
            </div>
            
            {!isSubmitting && (
              <button 
                onClick={onClose}
                className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-all active:scale-90 border border-white/5"
                aria-label="Close"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            )}
          </div>

          <div className={`${isNight ? 'bg-zinc-900/40 border-white/5 shadow-inner' : 'bg-zinc-50 border-zinc-200'} rounded-[2rem] p-6 border mb-8 group transition-all hover:border-white/10`}>
            <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.2em] mb-2">{language === 'ko' ? "질문" : "Question"}</p>
            <p className={`${isNight ? 'text-zinc-100' : 'text-zinc-900'} text-base md:text-lg break-keep leading-relaxed font-bold italic`}>&quot;{item.question_text}&quot;</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div>
              <p className="text-[10px] text-zinc-400 font-black uppercase tracking-[0.2em] mb-4">
                {language === 'ko' ? "어떤 도움이 필요하신가요?" : "How can I improve this?"}
              </p>
              <div className="flex flex-col gap-3">
                {quickChips.map((chip) => (
                    <button
                      key={chip.id}
                      type="button"
                      onClick={() => handleChipSelect(chip.id, chip.text)}
                      className={`text-left px-6 py-4 rounded-[1.5rem] border text-sm md:text-base font-black transition-all transform active:scale-[0.98] ${
                        selectedReason === chip.id 
                          ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white border-transparent shadow-[0_15px_40px_rgba(249,115,22,0.4)]' 
                          : `${isNight ? 'bg-zinc-900/60 border-white/5 text-zinc-300' : 'bg-zinc-100 border-zinc-200 text-zinc-500'} hover:bg-zinc-800 hover:border-white/10`
                      }`}
                    >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] text-zinc-400 font-black uppercase tracking-[0.2em]">
                {language === 'ko' ? "직접 입력 (선택)" : "Or type your reason (Optional)"}
              </label>
              <textarea
                value={customReason}
                onChange={(e) => {
                  setCustomReason(e.target.value);
                  if (e.target.value) setSelectedReason(''); // Clear chip if typing
                }}
                className={`w-full ${isNight ? 'bg-zinc-900/40 border-white/5 text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-900'} rounded-[1.8rem] p-5 text-sm focus:outline-none focus:border-orange-500/50 focus:ring-4 focus:ring-orange-500/10 transition-all font-korean resize-none h-32 shadow-inner`}
                placeholder={language === 'ko' ? "예: 이 단어 뜻 자체를 모르겠어요. 쉬운 말로 바꿔주세요." : "e.g., I don't understand the vocabulary."}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || (!selectedReason && !customReason.trim())}
              className={`w-full py-5 md:py-6 rounded-full font-black text-sm md:text-base uppercase tracking-[0.3em] transition-all transform active:scale-[0.95] flex items-center justify-center gap-4 relative overflow-hidden shadow-2xl ${
                isSubmitting || (!selectedReason && !customReason.trim())
                  ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed opacity-50'
                  : `${isNight ? 'bg-white hover:bg-zinc-100 text-black' : 'bg-zinc-900 hover:bg-black text-white'}`
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="w-6 h-6 border-3 border-zinc-400 border-t-black rounded-full animate-spin"></div>
                  <span>{language === 'ko' ? '다듬는 중...' : 'Refining...'}</span>
                </>
              ) : (
                <>
                  <span className="text-xl">✨</span>
                  <span>{language === 'ko' ? '새로운 추천 받기' : 'Submit Request'}</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
