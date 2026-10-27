import React, { useState } from 'react';
import { Printer, Sparkle, Warning, X } from '@phosphor-icons/react';
import { useDialogA11y } from '../../hooks/useDialogA11y';

interface Props {
  student: any;
  isKo: boolean;
  onClose: () => void;
  handleToggleFlagStudent: (studentUid: string, reason?: string) => Promise<void>;
  onPrintReport: () => void;
}

// Slide-over with one student's flag status and this week's mistakes.
// Mounted only while a student is selected (see TeacherPage.tsx).
export function StudentDetailsDrawer({ student, isKo, onClose, handleToggleFlagStudent, onPrintReport }: Props) {
  const [flagReasonInput, setFlagReasonInput] = useState('');
  const [showFlagReasonInput, setShowFlagReasonInput] = useState(false);
  const studentDrawerDialogRef = useDialogA11y<HTMLDivElement>({ isOpen: true, onClose });

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-end">
      <div 
        className="absolute inset-0 bg-[#2b211a]/55" 
        onClick={() => onClose()} 
     />
      <div
        ref={studentDrawerDialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="student-drawer-title"
        tabIndex={-1}
        className={`relative w-full max-w-lg h-full border-l p-6 sm:p-8 flex flex-col animate-slide-in text-left transition-colors ${
        'bg-surface border-rule text-ink'
      }`}>

        {/* Drawer Header */}
        <div className={`pb-6 border-b flex items-center justify-between shrink-0 ${
          'border-rule'
        }`}>
          <div>
            <h3 id="student-drawer-title" className={`text-xl font-extrabold flex items-center gap-2 text-ink`}>
              <span>{student.studentName || 'Unnamed'}</span>
              <span className="text-xs font-normal text-ink-3">{isKo ? '원생 학습 성장 기록' : "'s Growth & Practice Log"}</span>
            </h3>
            <p className="text-xs text-ink-3 mt-1">
              {student.email}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onClose()}
            aria-label={isKo ? '닫기' : 'Close'}
            className={`min-w-11 min-h-11 flex items-center justify-center rounded-md transition-[color,background-color,border-color,box-shadow,transform] text-sm font-bold active:scale-[0.95] cursor-pointer ${
              'text-ink-3 hover:text-ink hover:bg-sunken'
            }`}
          >
            <X size={18} weight="bold" />
          </button>
        </div>

        {/* Flag for Director/Counselor */}
        <div className={`mt-4 p-4 rounded-lg border shrink-0 ${
          student.flaggedException
            ? 'bg-line-soft border-rule'
            : 'bg-surface border-rule'
        }`}>
          {student.flaggedException ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-bold text-line-ink">
                  {isKo ? '원장님께 플래그됨' : 'Flagged for Director'}
                </span>
                <button
                  type="button"
                  onClick={() => handleToggleFlagStudent(student.uid)}
                  className="text-[12px] font-bold text-ink-3 hover:text-ink cursor-pointer"
                >
                  {isKo ? '플래그 해제' : 'Unflag'}
                </button>
              </div>
              <p className="text-xs text-ink-3">{student.flaggedException.reason}</p>
              <p className="text-[12px] text-ink-3">
                {student.flaggedException.teacherName} · {student.flaggedException.date}
              </p>
            </div>
          ) : showFlagReasonInput ? (
            <div className="space-y-2">
              <textarea
                value={flagReasonInput}
                onChange={(e) => setFlagReasonInput(e.target.value)}
                placeholder={isKo ? '플래그 사유를 입력하세요 (학습/행동 이슈 등)' : 'Reason for flagging (academic or behavioral issue)...'}
                className={`w-full h-20 p-3 rounded-md border text-xs outline-none resize-none ${
                  'bg-surface border-rule text-ink placeholder:text-ink-3'
                }`}
             />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (!flagReasonInput.trim()) return;
                    handleToggleFlagStudent(student.uid, flagReasonInput);
                    setFlagReasonInput('');
                    setShowFlagReasonInput(false);
                  }}
                  className="px-4 py-2 bg-line hover:bg-line text-on-line font-bold text-xs rounded-md cursor-pointer"
                >
                  {isKo ? '플래그 제출' : 'Submit Flag'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowFlagReasonInput(false); setFlagReasonInput(''); }}
                  className="px-4 py-2 text-xs font-bold text-ink-3 hover:text-ink cursor-pointer"
                >
                  {isKo ? '취소' : 'Cancel'}
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowFlagReasonInput(true)}
              className={`text-xs font-bold flex items-center gap-1.5 cursor-pointer text-ink-3 hover:text-ink`}
            >
              <Warning size={14} weight="bold" />
              <span>{isKo ? '원장님께 플래그하기' : 'Flag for Director'}</span>
            </button>
          )}
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto py-6 space-y-6 custom-scrollbar pr-1">
          <div>
            <span className="text-[12px] font-bold text-ink-3 mb-4 block">
              {isKo ? '이번 주 도전 복습 포인트' : "This week's focus practice items"}
            </span>

            {student.weeklyMistakes.length === 0 ? (
              <div className="py-16 text-center text-correct text-xs flex flex-col items-center gap-2">
                <Sparkle size={24} weight="bold" />
                <span>
                  {student.hasScannedThisWeek
                    ? (isKo ? '이번 주 스캔한 숙제는 모두 맞았어요.' : 'Everything scanned this week was correct.')
                    : (isKo ? '이번 주에 스캔한 숙제가 아직 없어요.' : 'No homework scanned this week yet.')}
                </span>
              </div>
            ) : (
              <div className="space-y-4">
                {student.weeklyMistakes.map((m: any, idx: number) => (
                  <div key={m.uniqueId || idx} className={`p-5 border rounded-lg flex flex-col gap-3 ${
                    'bg-surface border-rule'
                  }`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-2.5 py-1 bg-line-soft border border-rule text-line-ink font-bold rounded-lg text-[12px]">
                          {m.type || 'Phonics'}
                        </span>
                        {m.isResolved || m.attemptNumber > 1 ? (
                          <span className="px-2 py-0.5 bg-right-soft border border-rule text-correct font-bold rounded-md text-[12px]">
                            {isKo ? '2차 재도전 수정 완료' : 'Fixed on Rescan'}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-line-soft border border-rule text-line-ink font-bold rounded-md text-[12px]">
                            {isKo ? '1차 스캔 기록' : '1st Scan Attempt'}
                          </span>
                        )}
                      </div>
                      <span className="text-[12px] text-ink-3">
                        {m.dateAdded ? m.dateAdded.split('T')[0] : ''}
                      </span>
                    </div>

                    <div className="space-y-3 text-xs">
                      <div>
                        <span className="text-[12px] font-bold text-ink-3 block mb-1">
                          Question / Word
                        </span>
                        <p className={`font-bold text-ink`}>{m.question_text}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-1">
                        <div>
                          <span className="text-[12px] font-bold text-ink-3 block mb-1">
                            Target Answer
                          </span>
                          <p className="font-bold text-correct">{m.correct_answer}</p>
                        </div>
                        <div>
                          <span className="text-[12px] font-bold text-ink-3 block mb-1">
                            Student Answer
                          </span>
                          <p className="font-bold text-wrong">{m.student_response || '(Blank)'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Drawer Footer */}
        <div className={`pt-6 border-t shrink-0 flex gap-3 border-rule`}>
          <button
            type="button"
            onClick={() => onPrintReport()}
            className="w-1/2 py-4 bg-line hover:bg-line text-on-line font-bold text-xs rounded-lg transition-[color,background-color,border-color,box-shadow,transform] active:scale-[0.98] flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Printer size={16} weight="bold" />
            <span>{isKo ? '맞춤 로고 성적표 인쇄' : 'Print Branded Report'}</span>
          </button>
          <button
            type="button"
            onClick={() => onClose()}
            className={`w-1/2 py-4 font-bold text-xs rounded-lg transition-[color,background-color,border-color,box-shadow,transform] border active:scale-[0.98] cursor-pointer ${
              'bg-sunken hover:bg-sunken text-ink-2 border-rule'
            }`}
          >
            {isKo ? '닫기' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
}
