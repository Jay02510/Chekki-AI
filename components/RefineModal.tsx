import React, { useState, useEffect, useRef } from 'react';
import { WorksheetItem } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface Props {
  item: WorksheetItem;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (itemId: number, reason: string) => Promise<void>;
  isSubmitting: boolean;
}

export const RefineModal: React.FC<Props> = ({ item, isOpen, onClose, onSubmit, isSubmitting }) => {
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

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-start justify-center bg-black/80 backdrop-blur-sm sm:pt-10 md:pt-20 px-0 sm:px-4">
      <div 
        className="bg-zinc-950 w-full sm:max-w-md md:max-w-lg rounded-t-[2.5rem] sm:rounded-[2.5rem] border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col max-h-[90vh] sm:max-h-[85vh] animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div 
          ref={scrollRef}
          className="p-6 md:p-8 flex-1 overflow-y-auto custom-scrollbar"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-2xl shadow-inner">
                🪄
              </div>
              <div>
                <h3 className="text-xl md:text-2xl font-black text-white font-display leading-tight">
                  {language === 'ko' ? "설명 다듬기" : "Refine Explanation"}
                </h3>
                <p className="text-xs text-orange-500 font-bold uppercase tracking-widest mt-1">
                  AI Tutor
                </p>
              </div>
            </div>
            
            {!isSubmitting && (
              <button 
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            )}
          </div>

          <div className="bg-zinc-900/50 rounded-2xl p-4 border border-white/5 mb-6">
            <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-2">{language === 'ko' ? "질문" : "Question"}</p>
            <p className="text-white text-sm break-keep leading-relaxed font-bold">&quot;{item.question_text}&quot;</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <p className="text-xs text-zinc-400 font-bold uppercase tracking-widest mb-3">
                {language === 'ko' ? "어떤 도움이 필요하신가요?" : "How can I improve this?"}
              </p>
              <div className="flex flex-col gap-2">
                {quickChips.map((chip) => (
                  <button
                    key={chip.id}
                    type="button"
                    onClick={() => handleChipSelect(chip.id, chip.text)}
                    className={`text-left px-5 py-3.5 rounded-2xl border text-sm md:text-base font-bold transition-all ${
                      selectedReason === chip.id 
                        ? 'bg-orange-500 text-white border-orange-400 shadow-[0_5px_20px_rgba(249,115,22,0.3)]' 
                        : 'bg-zinc-900 border-white/10 text-zinc-300 hover:bg-zinc-800'
                    }`}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-zinc-400 font-bold uppercase tracking-widest">
                {language === 'ko' ? "직접 입력 (선택)" : "Or type your reason (Optional)"}
              </label>
              <textarea
                value={customReason}
                onChange={(e) => {
                  setCustomReason(e.target.value);
                  if (e.target.value) setSelectedReason(''); // Clear chip if typing
                }}
                className="w-full bg-zinc-900 border border-white/10 rounded-2xl p-4 text-white text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all font-korean resize-none h-24"
                placeholder={language === 'ko' ? "예: 이 단어 뜻 자체를 모르겠어요. 쉬운 말로 바꿔주세요." : "e.g., I don't understand the vocabulary."}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || (!selectedReason && !customReason.trim())}
              className={`w-full py-4 md:py-5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all transform active:scale-[0.98] flex items-center justify-center gap-3 relative overflow-hidden ${
                isSubmitting || (!selectedReason && !customReason.trim())
                  ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                  : 'bg-white hover:bg-zinc-200 text-black shadow-xl shadow-white/10'
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-zinc-500 border-t-white rounded-full animate-spin"></div>
                  <span>{language === 'ko' ? '다시 생각하는 중...' : 'Refining...'}</span>
                </>
              ) : (
                <>
                  <span className="text-lg">✨</span>
                  <span>{language === 'ko' ? '새로 추천받기' : 'Submit Request'}</span>
                </>
              )}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
};
