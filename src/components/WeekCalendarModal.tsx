import React from 'react';
import { X } from '@phosphor-icons/react';
import { staffUi } from './staffUi';
import { useDialogA11y } from '../../hooks/useDialogA11y';

interface Props {
  isThemeNight: boolean;
  isKo: boolean;
  selectedClass: { name?: string; activeWeekNumber?: number } | null;
  curriculumTopic: string;
  curriculumVocab: string;
  curriculumPhonics: string;
  onSelectWeek: (weekNum: number) => void;
  onClose: () => void;
}

export const WeekCalendarModal: React.FC<Props> = ({
  isThemeNight,
  isKo,
  selectedClass,
  curriculumTopic,
  curriculumVocab,
  curriculumPhonics,
  onSelectWeek,
  onClose,
}) => {
  const dialogRef = useDialogA11y<HTMLDivElement>({ isOpen: true, onClose });

  return (
    <div className="fixed inset-0 z-[280] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#2b211a]/55" onClick={onClose} />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="week-calendar-title"
        tabIndex={-1}
        className="modal-enter relative mx-4 flex max-h-[90vh] w-full max-w-3xl flex-col rounded-lg bg-surface text-left text-ink shadow-[0_24px_60px_-20px_rgba(43,33,26,0.45)]"
      >
        <div className="custom-scrollbar relative h-full w-full overflow-y-auto p-6 sm:p-8">
          <button
            type="button"
            onClick={onClose}
            aria-label={isKo ? '닫기' : 'Close'}
            className={`${staffUi.iconBtn} absolute right-5 top-5 h-11 w-11`}
          >
            <X size={20} weight="bold" />
          </button>

          <h3 id="week-calendar-title" className="pr-12 text-[22px] font-extrabold tracking-[-0.01em]">
            {isKo ? `${selectedClass?.name || '학급'} 주차` : `${selectedClass?.name || 'Class'} weeks`}
          </h3>
          <p className={`${staffUi.sub} mb-5`}>
            {isKo ? '주차를 누르면 그 주차로 바뀌어요.' : 'Pick a week to make it the active one.'}
          </p>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((weekNum) => {
              const isActiveWeek = selectedClass?.activeWeekNumber === weekNum;
              const topic = isActiveWeek ? curriculumTopic : '';
              const wordCount = isActiveWeek && curriculumVocab ? curriculumVocab.split(',').filter(Boolean).length : 0;
              return (
                <button
                  key={weekNum}
                  type="button"
                  aria-current={isActiveWeek ? 'true' : undefined}
                  onClick={() => {
                    onSelectWeek(weekNum);
                    onClose();
                  }}
                  className={`btn-press min-h-[72px] cursor-pointer rounded-md p-3 text-left ${
                    isActiveWeek ? 'bg-line-soft ring-2 ring-inset ring-line' : 'ring-1 ring-inset ring-rule hover:bg-sunken'
                  }`}
                >
                  <span className="block text-[15px] font-extrabold">{isKo ? `${weekNum}주차` : `Week ${weekNum}`}</span>
                  {isActiveWeek && (
                    <span className="block truncate text-[13px] text-ink-2">{topic || (isKo ? '주제 없음' : 'No topic yet')}</span>
                  )}
                  {wordCount > 0 && <span className="block text-[13px] font-bold text-correct">{isKo ? `단어 ${wordCount}개` : `${wordCount} words`}</span>}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
