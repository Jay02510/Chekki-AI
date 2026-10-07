import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { WorksheetItem } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { ConfirmDialog } from './ConfirmDialog';
import { useModalExit } from '../hooks/useModalExit';
import { useDialogA11y } from '../hooks/useDialogA11y';
import { X } from '@phosphor-icons/react';

interface Props {
  item: WorksheetItem;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (itemId: number, reason: string) => Promise<void>;
  isSubmitting: boolean;
  isNight?: boolean;
}

export const RefineModal: React.FC<Props> = ({
  item,
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
  isNight = true,
}) => {
  const { t, language } = useLanguage();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [customReason, setCustomReason] = useState('');
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const { isClosing, close } = useModalExit(onClose);
  // Escape routes through the latest handleClose so typed text isn't lost
  // silently (the a11y hook captures onClose once per open).
  const handleCloseRef = useRef<() => void>(() => {});
  const dialogRef = useDialogA11y<HTMLDivElement>({
    isOpen: isOpen && !showDiscardConfirm,
    onClose: () => handleCloseRef.current(),
  });

  const handleClose = () => {
    if (customReason.trim()) {
      setShowDiscardConfirm(true);
      return;
    }
    close();
  };
  handleCloseRef.current = handleClose;

  useEffect(() => {
    if (isOpen && scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const quickChips =
    language === 'ko'
      ? [
          {
            id: 'simpler',
            label: '더 쉽게 설명해주세요 (유치원생)',
            text: '아이의 눈높이에 맞춰 훨씬 더 쉽고 간단한 비유로 설명해주세요.',
          },
          {
            id: 'example',
            label: '다른 예시 들어주세요',
            text: '이 개념을 사용하는 다른 문장이나 상황 예시를 2개 더 알려주세요.',
          },
          {
            id: 'grammar',
            label: '문법적인 이유가 궁금해요',
            text: '왜 이게 정답인지 문법적인 규칙을 학부모가 이해하기 쉽게 설명해주세요.',
          },
          {
            id: 'wrong',
            label: '정답이 틀린 것 같아요',
            text: '정답 추출이 잘못되었습니다. 다시 한번 맥락을 확인하고 올바른 답과 가이드를 내려주세요.',
          },
        ]
      : [
          {
            id: 'simpler',
            label: 'Make it simpler (For age 5-7)',
            text: 'Explain this much more simply with a fun analogy for a kindergartener.',
          },
          {
            id: 'example',
            label: 'Give another example',
            text: 'Provide two more examples using this exact concept or vocabulary.',
          },
          {
            id: 'grammar',
            label: 'Explain the grammar rules',
            text: 'Explain the grammar rule behind why this is the correct answer so I can teach it.',
          },
          {
            id: 'wrong',
            label: 'The answer seems wrong',
            text: 'I think the extracted answer is incorrect. Please re-evaluate the question and correct it.',
          },
        ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReason && !customReason.trim()) return;

    // Choose the selected chip text, or fallback to custom reason
    const chipText = quickChips.find((c) => c.id === selectedReason)?.text;
    const finalReason = customReason.trim() ? customReason.trim() : chipText || '';

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

  const canSubmit = !isSubmitting && (!!selectedReason || !!customReason.trim());

  const modalContent = (
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-4">
      <div
        className={`absolute inset-0 bg-[#2b211a]/55 ${isClosing ? 'modal-backdrop-exit' : 'animate-fade-in'}`}
        onClick={handleClose}
        aria-hidden="true"
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="refine-title"
        tabIndex={-1}
        className={`relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-lg bg-surface ring-1 ring-inset ring-rule shadow-[0_24px_60px_-20px_rgba(43,33,26,0.45)] sm:max-w-lg sm:rounded-lg ${isClosing ? 'modal-exit' : 'modal-enter'}`}
      >
        <div className="flex shrink-0 items-start justify-between gap-3 px-5 pt-5 sm:px-6 sm:pt-6">
          <div className="min-w-0">
            <h3 id="refine-title" className="text-[22px] font-extrabold tracking-[-0.02em] text-ink break-keep">
              {language === 'ko' ? '채키에게 더 물어보기' : 'Ask Chekki for more'}
            </h3>
            <p className="mt-1 text-[14px] text-ink-3 break-keep">
              {language === 'ko' ? '이 문제를 다시 설명해 드릴게요.' : "Chekki will explain this one again."}
            </p>
          </div>
          {!isSubmitting && (
            <button
              onClick={handleClose}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-ink-3 hover:bg-sunken hover:text-ink"
              aria-label={language === 'ko' ? '닫기' : 'Close'}
            >
              <X size={20} weight="bold" />
            </button>
          )}
        </div>

        <div ref={scrollRef} className="custom-scrollbar flex-1 overflow-y-auto px-5 pb-5 pt-4 sm:px-6 sm:pb-6">
          <div className="rounded-md bg-sunken px-4 py-3">
            <p className="text-[13px] font-semibold text-ink-3">{language === 'ko' ? '문제' : 'Question'}</p>
            <p className="mt-0.5 text-[16px] font-semibold leading-relaxed text-ink break-keep">{item.question_text}</p>
          </div>

          <form onSubmit={handleSubmit} className="mt-5 space-y-5">
            <fieldset>
              <legend className="mb-2.5 text-[15px] font-bold text-ink">
                {language === 'ko' ? '어떤 게 필요하세요?' : 'What would help?'}
              </legend>
              <div className="flex flex-col gap-2">
                {quickChips.map((chip) => {
                  const on = selectedReason === chip.id;
                  return (
                    <button
                      key={chip.id}
                      type="button"
                      aria-pressed={on}
                      onClick={() => handleChipSelect(chip.id, chip.text)}
                      className={`btn-press flex min-h-12 items-center gap-3 rounded-md px-4 py-3 text-left text-[15px] font-semibold break-keep ${
                        on ? 'bg-line-soft text-ink ring-2 ring-inset ring-line' : 'bg-surface text-ink-2 ring-1 ring-inset ring-rule hover:ring-ink-3'
                      }`}
                    >
                      <span
                        aria-hidden="true"
                        className={`h-5 w-5 shrink-0 rounded-full border-2 ${on ? 'border-line bg-line shadow-[inset_0_0_0_3px_var(--m-line-soft)]' : 'border-rule'}`}
                      />
                      {chip.label}
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <div>
              <label htmlFor="refine-custom" className="mb-2 block text-[14px] font-semibold text-ink-2">
                {language === 'ko' ? '직접 적어도 돼요 (선택)' : 'Or write your own (optional)'}
              </label>
              <textarea
                id="refine-custom"
                value={customReason}
                onChange={(e) => {
                  setCustomReason(e.target.value);
                  if (e.target.value) setSelectedReason(''); // Clear chip if typing
                }}
                className="h-28 w-full resize-none rounded-md bg-sunken p-3 text-[16px] text-ink ring-1 ring-inset ring-rule placeholder:text-ink-3 focus:outline-none focus:ring-2 focus:ring-line"
                placeholder={
                  language === 'ko'
                    ? '예: 아이가 헷갈려해요. 더 쉬운 예를 들어 주세요.'
                    : 'e.g. My child is confused. Can you use an easier example?'
                }
              />
            </div>

            <button
              type="submit"
              disabled={!canSubmit}
              className="btn-press flex min-h-12 w-full items-center justify-center gap-2 rounded-md bg-line text-[15px] font-bold text-[#2b211a] disabled:opacity-40"
            >
              {isSubmitting ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#2b211a]/30 border-t-[#2b211a]" />
                  <span>{language === 'ko' ? '다시 설명하는 중...' : 'Explaining...'}</span>
                </>
              ) : (
                <span>{language === 'ko' ? '다시 설명 받기' : 'Explain again'}</span>
              )}
            </button>
          </form>
        </div>
      </div>

      {showDiscardConfirm && (
        <ConfirmDialog
          title={language === 'ko'
            ? '작성 중인 내용이 있습니다. 정말 닫으시겠습니까?'
            : 'You have unsaved text. Are you sure you want to close?'}
          confirmText={language === 'ko' ? '닫기' : 'Close'}
          cancelText={language === 'ko' ? '취소' : 'Cancel'}
          variant="destructive"
          isNight={isNight}
          warm
          onConfirm={() => {
            setShowDiscardConfirm(false);
            close();
          }}
          onCancel={() => setShowDiscardConfirm(false)}
        />
      )}
    </div>
  );

  return createPortal(modalContent, document.body);
};
