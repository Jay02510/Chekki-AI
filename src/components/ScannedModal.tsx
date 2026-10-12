import React, { useMemo } from 'react';
import { BookOpen, Sparkle, Eye, X, Warning, Plus, Check, CheckCircle, Trash } from '@phosphor-icons/react';
import { useDialogA11y } from '../../hooks/useDialogA11y';
import { WorksheetOverlay } from '../../components/WorksheetOverlay';
import type { WorksheetItem } from '../../types';

const BAD_WORDS_PATTERN = /(fuck|shit|asshole|bitch|bastard|cunt|dick|cock|pussy|slut|whore|nigger|faggot|retard|damn|crap|idiot|stupid|씨발|개새끼|병신|지랄|존나|닥쳐|미친|좆|씹)/i;

interface Props {
  isThemeNight: boolean;
  isKo: boolean;
  activeScannedModalType: 'syllabus' | 'worksheet';
  scannedData: any;
  setScannedData: React.Dispatch<React.SetStateAction<any>>;
  selectedPageIndex: number | 'all';
  setSelectedPageIndex: (index: number | 'all') => void;
  selectedScannedTopic: boolean;
  setSelectedScannedTopic: (value: boolean) => void;
  selectedScannedVocab: string[];
  setSelectedScannedVocab: React.Dispatch<React.SetStateAction<string[]>>;
  textbookPreviewUrl: string | null;
  docPreviewUrl: string | null;
  syllabusPreviewUrl: string | null;
  worksheetPreviewUrl: string | null;
  onClose: () => void;
  onViewScannedDocument: () => void;
  onApplyToCurriculum: () => void;
}

export function ScannedModal({
  isThemeNight,
  isKo,
  activeScannedModalType,
  scannedData,
  setScannedData,
  selectedPageIndex,
  setSelectedPageIndex,
  selectedScannedTopic,
  setSelectedScannedTopic,
  selectedScannedVocab,
  setSelectedScannedVocab,
  textbookPreviewUrl,
  docPreviewUrl,
  syllabusPreviewUrl,
  worksheetPreviewUrl,
  onClose,
  onViewScannedDocument,
  onApplyToCurriculum,
}: Props) {
  const activeDisplayObj =
    selectedPageIndex === 'all' || !scannedData?.pages
      ? scannedData
      : scannedData.pages.find((p: any) => (p.pageIndex || p.pageNumber) === selectedPageIndex) || scannedData;

  // Every edit below operates on activeDisplayObj.detectedAnswers (the list
  // actually rendered), but a specific page's list lives at
  // scannedData.pages[i].detectedAnswers — writing straight to
  // scannedData.detectedAnswers (the separate top-level aggregate) silently
  // edited/deleted the WRONG array whenever a specific page was selected,
  // with the visible list never updating and "Apply to Curriculum" pulling
  // stale/unrelated data (audit: page edits invisible and lost on apply).
  const updateActiveDetectedAnswers = (updater: (list: any[]) => any[]) => {
    setScannedData((prev: any) => {
      if (selectedPageIndex === 'all' || !prev?.pages) {
        return { ...prev, detectedAnswers: updater(prev?.detectedAnswers || []) };
      }
      const pages = prev.pages.map((p: any) =>
        (p.pageIndex || p.pageNumber) === selectedPageIndex
          ? { ...p, detectedAnswers: updater(p.detectedAnswers || []) }
          : p
      );
      return { ...prev, pages };
    });
  };

  // Same pinned-overlay component the parent app uses when a parent scans
  // their child's worksheet at home (components/WorksheetOverlay.tsx) — a
  // teacher reviewing a scan should see the identical positioned-pill view,
  // not a separate hand-built mock (audit: teacher scan review didn't match
  // what parents actually see). Blank-key styling (hasHandwriting={false}
  // below) since this is the master answer key, not a graded submission —
  // no is_correct verdict exists here.
  const overlayItems: WorksheetItem[] = useMemo(
    () =>
      (activeDisplayObj?.detectedAnswers || []).map((item: any, idx: number) => ({
        id: idx + 1,
        type: item.category || 'text',
        question_text: item.questionText || item.question || '',
        correct_answer: item.correctAnswer || item.answer || '',
        korean_guide: '',
        teaching_script_ko: '',
        bounding_box: item.bounding_box,
      })),
    [activeDisplayObj]
  );

  const hasInappropriateContent = activeDisplayObj?.detectedAnswers?.some(
    (ans: any) =>
      BAD_WORDS_PATTERN.test(ans.questionText || '') ||
      BAD_WORDS_PATTERN.test(ans.correctAnswer || ans.answer || '') ||
      BAD_WORDS_PATTERN.test(ans.category || '')
  );

  const dialogRef = useDialogA11y<HTMLDivElement>({ isOpen: true, onClose });

  return (
    <div className="fixed inset-0 z-[350] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#2b211a]/55" onClick={onClose} />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={activeScannedModalType === 'syllabus' ? (isKo ? '스캔된 교재' : 'Scanned syllabus') : (isKo ? '스캔된 워크시트' : 'Scanned worksheet')}
        tabIndex={-1}
        className={`relative p-1 border rounded-lg flex flex-col w-full ${
          activeScannedModalType === 'worksheet' ? 'max-w-6xl' : 'max-w-3xl'
        } mx-4 animate-fade-in text-left max-h-[90vh] ${
          'bg-surface border-rule'
        }`}
      >
        <div
          className={`relative w-full h-full rounded-lg p-6 sm:p-8 overflow-y-auto custom-scrollbar ${
            'bg-surface text-ink'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-rule">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-line-soft border border-rule text-line-ink flex items-center justify-center">
                {activeScannedModalType === 'syllabus' ? <BookOpen size={22} weight="bold" /> : <Sparkle size={22} weight="bold" />}
              </div>
              <div>
                <h3 className={`text-lg font-extrabold text-ink`}>
                  {activeScannedModalType === 'syllabus'
                    ? isKo
                      ? '교재 목차 시라버스 분석 & 어휘 범위'
                      : 'Scanned Course Syllabus & Scope'
                    : isKo
                    ? '일간 워크시트 정답지 스캔 분석 & 항목 선택'
                    : 'Scanned Worksheet AI Analysis & Selection'}
                </h3>
                <p className="text-xs text-ink-3">
                  {activeScannedModalType === 'syllabus'
                    ? isKo
                      ? '전체 주차별 어휘 및 파닉스 범위를 설정합니다.'
                      : 'Review course-wide vocabulary & phonics scope across weeks.'
                    : isKo
                    ? '추출된 학부모 정답 가이드와 커리큘럼 항목을 선택하세요.'
                    : 'Review parent answer keys & select items to add to curriculum.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {(textbookPreviewUrl || docPreviewUrl || syllabusPreviewUrl || worksheetPreviewUrl) && (
                <button
                  type="button"
                  onClick={onViewScannedDocument}
                  className="px-3 py-2 bg-sunken hover:bg-sunken border border-rule text-ink-2 font-bold text-xs rounded-md transition-[color,background-color,border-color,opacity,transform] flex items-center gap-1.5 cursor-pointer"
                >
                  <Eye size={14} weight="bold" />
                  <span>{isKo ? '스캔 원본 문서 보기' : 'View Scanned Document'}</span>
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                aria-label={isKo ? '닫기' : 'Close'}
                className={`min-w-11 min-h-11 flex items-center justify-center rounded-md transition-[color,background-color,border-color,opacity,transform] cursor-pointer ${
                  'bg-sunken hover:bg-sunken text-ink-2'
                }`}
              >
                <X size={18} weight="bold" />
              </button>
            </div>
          </div>

          {/* Header Subtitle Banner */}
          {activeScannedModalType === 'worksheet' && (
            <div className="p-4 mb-6 rounded-lg bg-line-soft border border-rule text-xs text-line-ink flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Sparkle size={20} weight="bold" className="shrink-0 text-line-ink" />
                <div>
                  <p className="font-bold">
                    {isKo ? '체키 앱 학부모 스캔 화면과 동일한 AI 정답지 오버레이' : 'Identical AI Answer Ink Overlay as Chekki Parent App'}
                  </p>
                  <p className="text-[12px] text-ink-3 mt-0.5">
                    {isKo
                      ? '학부모님이 집에서 워크시트를 스캔했을 때 화면에 녹색 잉크로 자동 합성되는 정답지 내용입니다.'
                      : "This is the exact green answer ink overlaid on parents' screens when they scan their child's physical worksheet."}
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 bg-line text-on-line font-bold text-[12px] rounded-lg shrink-0">
                Chekki App Sync
              </span>
            </div>
          )}

          {/* Page Selector Pill Bar for Multi-Page Extractions */}
          {scannedData?.pages && scannedData.pages.length > 0 && (
            <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1 custom-scrollbar">
              <span className="text-[12px] font-bold text-ink-3 mr-1 shrink-0">
                {isKo ? '페이지 선택:' : 'Select Page:'}
              </span>
              <button
                type="button"
                onClick={() => setSelectedPageIndex('all')}
                className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition-[color,background-color,border-color,opacity,transform] border shrink-0 cursor-pointer flex items-center gap-1.5 ${
                  selectedPageIndex === 'all'
                    ? 'bg-line text-on-line border-line'
                    : 'bg-sunken border-rule text-ink-2'
                }`}
              >
                
                <span>{isKo ? '전체 통합 (All Combined)' : 'All Pages'}</span>
              </button>
              {scannedData.pages.map((pObj: any, idx: number) => {
                const pageNum = pObj.pageIndex || idx + 1;
                const isActive = selectedPageIndex === pageNum;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedPageIndex(pageNum)}
                    className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition-[color,background-color,border-color,opacity,transform] border shrink-0 cursor-pointer flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-line text-on-line border-line'
                        : 'bg-sunken border-rule text-ink-2'
                    }`}
                  >
                    
                    <span>{pObj.pageTitle || (isKo ? `페이지 ${pageNum}` : `Page ${pageNum}`)}</span>
                  </button>
                );
              })}
            </div>
          )}

          <div className="space-y-6">
            {/* Guardrail Warning Banner */}
            {hasInappropriateContent && (
              <div className="p-4 rounded-lg bg-wrong-soft border border-rule text-xs text-wrong font-bold flex items-center gap-3">
                <Warning size={20} weight="bold" className="shrink-0 text-wrong" />
                <div>
                  <p>{isKo ? 'AI 세이프티 가드레일: 부적절한 단어 또는 비속어가 감지되었습니다.' : 'Content Safety Guardrail: Inappropriate language detected.'}</p>
                  <p className="text-[12px] font-normal text-wrong mt-0.5">
                    {isKo
                      ? '학습지 문항 및 정답에서 비속어를 수정해 주세요. 부적절한 단어는 커리큘럼 저장이 제한됩니다.'
                      : 'Please remove offensive or profane words. Guardrails restrict saving inappropriate content into the student curriculum.'}
                  </p>
                </div>
              </div>
            )}

            {activeScannedModalType === 'worksheet' ? (
              /* SIDE-BY-SIDE 2-COLUMN LAYOUT FOR WORKSHEETS */
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* LEFT COLUMN: Scanned Physical Paper Preview with Green Answer Overlay Ink */}
                <div className="lg:col-span-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-bold text-line-ink flex items-center gap-1.5">
                      <Eye size={14} weight="bold" />
                      <span>{isKo ? '스캔 원본 & AI 정답 잉크' : 'Scanned Paper & Answer Ink'}</span>
                    </span>
                    <span className="text-[12px] font-bold text-correct bg-right-soft border border-rule px-2 py-0.5 rounded">
                      Green Ink Overlay
                    </span>
                  </div>

                  {/* Paper Sheet Preview Container with Real Image Preview */}
                  <div className="relative w-full rounded-lg border border-rule bg-[#2b211a]/55 text-ink overflow-hidden font-serif select-none min-h-[420px] flex flex-col items-center justify-center p-3">
                    {worksheetPreviewUrl || docPreviewUrl || syllabusPreviewUrl ? (
                      <WorksheetOverlay
                        imageUrl={(worksheetPreviewUrl || docPreviewUrl || syllabusPreviewUrl) as string}
                        items={overlayItems}
                        isNight={isThemeNight}
                        hasHandwriting={false}
                        className="min-h-[380px] rounded-md"
                      />
                    ) : (
                      <div className="relative w-full rounded-lg bg-surface p-6 min-h-[380px] text-ink">
                        <div className="border-b-2 border-rule pb-3 mb-6 flex justify-between items-end">
                          <div>
                            <span className="text-[12px] text-ink-3 font-bold">PHYSICAL WORKSHEET SCAN</span>
                            <h4 className="text-base font-extrabold tracking-tight text-ink font-sans">
                              {activeDisplayObj?.topic || (isKo ? '스캔된 자료' : 'Scanned Document')}
                            </h4>
                          </div>
                          <span className="text-[12px] text-ink-3 border border-rule px-2 py-0.5 rounded">PAGE 1 / 1</span>
                        </div>

                        <div className="space-y-4 text-xs">
                          {activeDisplayObj?.detectedAnswers && activeDisplayObj.detectedAnswers.length > 0 ? (
                            activeDisplayObj.detectedAnswers.map((item: any, idx: number) => (
                              <div key={idx} className="p-3 rounded-md bg-surface border border-rule">
                                <p className="font-semibold text-ink text-xs mb-1">{item.questionText || `Q${idx + 1}: Question ${idx + 1}`}</p>
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-right-soft text-correct text-xs font-bold border border-rule">
                                  <span>Green Ink:</span>
                                  <span className="underline decoration-emerald-500 decoration-2">{item.correctAnswer || item.answer || 'Answer'}</span>
                                </div>
                              </div>
                            ))
                          ) : (
                            <p className="text-ink-3 text-xs p-3">
                              {isKo
                                ? '이 페이지에서 문항/정답을 찾지 못했습니다. 문항이 있는 페이지인지 확인해 주세요.'
                                : "No questions or answers detected on this page — check it's the right page, or add answers manually below."}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* RIGHT COLUMN: Editable Question & Answer Key Panel */}
                <div className="lg:col-span-7 space-y-4">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[12px] font-bold text-ink-3">
                      {isKo ? '문항 및 정답 수정 (Right Panel Editor)' : 'Edit Questions & Correct Answers'}
                    </span>
                  </div>

                  {activeDisplayObj?.detectedAnswers && activeDisplayObj.detectedAnswers.length > 0 ? (
                    <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1 custom-scrollbar">
                      {activeDisplayObj.detectedAnswers.map((item: any, idx: number) => {
                        const itemHasBadWord = BAD_WORDS_PATTERN.test(item.questionText || '') || BAD_WORDS_PATTERN.test(item.correctAnswer || item.answer || '');

                        return (
                          <div
                            key={idx}
                            className={`p-4 rounded-lg border transition-[color,background-color,border-color,opacity,transform] text-left space-y-2.5 ${
                              itemHasBadWord ? 'bg-wrong-soft border-rule' : 'bg-surface border-rule'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="px-2.5 py-0.5 rounded-md text-[12px] font-bold bg-line-soft text-line-ink border border-rule shrink-0">
                                Question #{item.questionNumber || idx + 1}
                              </span>
                              <input
                                type="text"
                                value={item.category || 'Vocabulary'}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  updateActiveDetectedAnswers((list) => {
                                    const next = [...list];
                                    next[idx] = { ...next[idx], category: val };
                                    return next;
                                  });
                                }}
                                className="text-[12px] font-bold bg-transparent border-b border-rule focus:border-line text-ink-3 outline-none text-right w-28"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  updateActiveDetectedAnswers((list) => {
                                    const next = [...list];
                                    next.splice(idx, 1);
                                    return next;
                                  });
                                }}
                                aria-label={isKo ? '문항 삭제' : 'Delete question'}
                                className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-wrong bg-wrong-soft hover:bg-wrong-soft border border-rule transition-[color,background-color,border-color,opacity,transform] cursor-pointer"
                              >
                                <Trash size={13} weight="bold" />
                              </button>
                            </div>

                            <input
                              type="text"
                              value={item.questionText || item.question || ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                updateActiveDetectedAnswers((list) => {
                                  const next = [...list];
                                  next[idx] = { ...next[idx], questionText: val, question: val };
                                  return next;
                                });
                              }}
                              className={`w-full text-xs font-semibold p-2.5 rounded-md border outline-none transition-[color,background-color,border-color,opacity,transform] ${
                                itemHasBadWord
                                  ? 'bg-wrong-soft border-rule text-wrong'
                                  : 'bg-surface border-rule focus:border-line text-ink'
                              }`}
                              placeholder={isKo ? '문제 지문을 입력하세요' : 'Enter question text'}
                            />

                            <div className="p-3 rounded-md bg-right-soft border border-rule flex items-center justify-between gap-3 text-xs">
                              <span className="text-correct font-bold shrink-0 flex items-center gap-1">
                                
                                <span>{isKo ? '부모님용 정답 잉크 (수정 가능):' : 'Correct Answer Ink:'}</span>
                              </span>
                              <input
                                type="text"
                                value={item.correctAnswer || item.answer || ''}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  updateActiveDetectedAnswers((list) => {
                                    const next = [...list];
                                    next[idx] = { ...next[idx], correctAnswer: val, answer: val };
                                    return next;
                                  });
                                }}
                                className={`bg-surface border outline-none px-3 py-1.5 rounded-lg font-extrabold text-xs w-full max-w-[220px] ${
                                  BAD_WORDS_PATTERN.test(item.correctAnswer || item.answer || '')
                                    ? 'border-rule text-wrong'
                                    : 'border-rule focus:border-rule text-correct'
                                }`}
                                placeholder={isKo ? '정답 단어/문장 입력' : 'Enter answer text'}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-8 text-center border rounded-lg border-dashed border-rule text-xs text-ink-3 space-y-3">
                      <p>{isKo ? '추출된 개별 정답 문항이 없거나 아직 스캔되지 않았습니다.' : 'No worksheet question answers extracted yet.'}</p>
                      <button
                        type="button"
                        onClick={() => {
                          updateActiveDetectedAnswers(() => [
                            { questionNumber: 1, category: 'Vocabulary', questionText: '1. Organisms that make food', correctAnswer: 'producers', answer: 'producers' },
                            { questionNumber: 2, category: 'Vocabulary', questionText: '2. Organisms that eat living things', correctAnswer: 'consumer', answer: 'consumer' },
                          ]);
                        }}
                        className="px-4 py-2 bg-line hover:bg-line text-on-line font-bold text-xs rounded-md transition-[color,background-color,border-color,opacity,transform] cursor-pointer inline-flex items-center gap-1.5"
                      >
                        <Plus size={14} weight="bold" />
                        <span>{isKo ? '수동 정답 문항 작성하기' : 'Create Answer Key Manually'}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* SINGLE COLUMN SCOPE PICKER FOR SYLLABUS */
              <div className="space-y-6">
                {/* Topic selection */}
                {activeDisplayObj?.topic && (
                  <div className={`p-4 rounded-lg border bg-surface border-rule`}>
                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-xs font-bold text-line-ink">
                        {isKo ? '추출된 대주제 / 테마 (Topic)' : 'Extracted Topic / Theme'}
                      </span>
                      <input
                        type="checkbox"
                        checked={selectedScannedTopic}
                        onChange={(e) => setSelectedScannedTopic(e.target.checked)}
                        className="w-4 h-4 accent-[var(--m-line)] cursor-pointer"
                      />
                    </label>
                    <p className={`text-base font-bold mt-1 text-ink`}>{activeDisplayObj.topic}</p>
                  </div>
                )}

                {/* Vocabulary Selection */}
                {activeDisplayObj?.vocabWords && (Array.isArray(activeDisplayObj.vocabWords) ? activeDisplayObj.vocabWords.length > 0 : Boolean(activeDisplayObj.vocabWords)) && (
                  <div className={`p-4 rounded-lg border bg-surface border-rule`}>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold text-line-ink">
                        {isKo ? '추출된 학습 단어 (Select Vocabulary Words)' : 'Extracted Target Vocabulary'}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const pageWords = Array.isArray(activeDisplayObj.vocabWords)
                            ? activeDisplayObj.vocabWords
                            : activeDisplayObj.vocabWords.split(/[,\n]/).map((s: string) => s.trim()).filter(Boolean);

                          const allSelected = pageWords.every((w: string) => selectedScannedVocab.includes(w));
                          if (allSelected) {
                            setSelectedScannedVocab((prev) => prev.filter((w) => !pageWords.includes(w)));
                          } else {
                            setSelectedScannedVocab((prev) => Array.from(new Set([...prev, ...pageWords])));
                          }
                        }}
                        className="text-[12px] font-bold text-line-ink hover:underline cursor-pointer"
                      >
                        {isKo ? '이 페이지 단어 전체 선택 / 해제' : 'Toggle Page Words'}
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {(Array.isArray(activeDisplayObj.vocabWords)
                        ? activeDisplayObj.vocabWords
                        : activeDisplayObj.vocabWords.split(/[,\n]/).map((s: string) => s.trim()).filter(Boolean)
                      ).map((word: string) => {
                        const isSelected = selectedScannedVocab.includes(word);
                        return (
                          <button
                            type="button"
                            key={word}
                            onClick={() => {
                              if (isSelected) {
                                setSelectedScannedVocab((prev) => prev.filter((w) => w !== word));
                              } else {
                                setSelectedScannedVocab((prev) => [...prev, word]);
                              }
                            }}
                            className={`px-3 py-1.5 rounded-md border text-xs font-bold transition-[color,background-color,border-color,opacity,transform] cursor-pointer flex items-center gap-2 ${
                              isSelected
                                ? 'bg-line border-line text-on-line scale-[1.02]'
                                : 'bg-sunken border-rule text-ink-2'
                            }`}
                          >
                            <span>{word}</span>
                            {isSelected ? <Check size={12} weight="bold" /> : <Plus size={12} weight="bold" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Modal Footer Actions */}
          <div className="mt-8 pt-4 border-t border-rule flex justify-between items-center">
            <button
              type="button"
              onClick={onClose}
              className={`px-5 py-2.5 text-xs font-bold rounded-md border transition-[color,background-color,border-color,opacity,transform] cursor-pointer ${
                'bg-sunken hover:bg-sunken text-ink-2 border-rule'
              }`}
            >
              {isKo ? '닫기' : 'Close'}
            </button>

            <button
              type="button"
              onClick={onApplyToCurriculum}
              className="px-6 py-2.5 bg-line hover:bg-line text-on-line font-bold text-xs rounded-md transition-[color,background-color,border-color,opacity,transform] flex items-center gap-2 cursor-pointer"
            >
              <CheckCircle size={16} weight="bold" />
              <span>{isKo ? '선택 항목 적용하고 저장' : 'Apply and save'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
