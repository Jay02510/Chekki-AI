import React from 'react';
import { BookOpen, Sparkle, Eye, X, Warning, Plus, Check, CheckCircle } from '@phosphor-icons/react';
import { useDialogA11y } from '../../hooks/useDialogA11y';

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

  const hasInappropriateContent = activeDisplayObj?.detectedAnswers?.some(
    (ans: any) =>
      BAD_WORDS_PATTERN.test(ans.questionText || '') ||
      BAD_WORDS_PATTERN.test(ans.correctAnswer || ans.answer || '') ||
      BAD_WORDS_PATTERN.test(ans.category || '')
  );

  const dialogRef = useDialogA11y<HTMLDivElement>({ isOpen: true, onClose });

  return (
    <div className="fixed inset-0 z-[350] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={activeScannedModalType === 'syllabus' ? (isKo ? '스캔된 교재' : 'Scanned syllabus') : (isKo ? '스캔된 워크시트' : 'Scanned worksheet')}
        tabIndex={-1}
        className={`relative p-1 border rounded-[2.5rem] shadow-2xl flex flex-col w-full ${
          activeScannedModalType === 'worksheet' ? 'max-w-6xl' : 'max-w-3xl'
        } mx-4 animate-fade-in text-left max-h-[90vh] ${
          isThemeNight ? 'bg-white/5 border-white/10' : 'bg-white border-zinc-200'
        }`}
      >
        <div
          className={`relative w-full h-full rounded-[calc(2.5rem-0.25rem)] p-6 sm:p-8 overflow-y-auto custom-scrollbar ${
            isThemeNight ? 'bg-[#0c0c0e] text-zinc-100' : 'bg-white text-zinc-900'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-500 flex items-center justify-center">
                {activeScannedModalType === 'syllabus' ? <BookOpen size={22} weight="bold" /> : <Sparkle size={22} weight="bold" />}
              </div>
              <div>
                <h3 className={`text-lg font-black ${isThemeNight ? 'text-white' : 'text-zinc-900'}`}>
                  {activeScannedModalType === 'syllabus'
                    ? isKo
                      ? '📘 교재 목차 시라버스 분석 & 어휘 범위'
                      : '📘 Scanned Course Syllabus & Scope'
                    : isKo
                    ? '📄 일간 워크시트 정답지 스캔 분석 & 항목 선택'
                    : '📄 Scanned Worksheet AI Analysis & Selection'}
                </h3>
                <p className="text-xs text-zinc-400">
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
                  className="px-3 py-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-400 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Eye size={14} weight="bold" />
                  <span>{isKo ? '스캔 원본 문서 보기' : 'View Scanned Document'}</span>
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                aria-label={isKo ? '닫기' : 'Close'}
                className={`min-w-11 min-h-11 flex items-center justify-center rounded-full transition-all cursor-pointer ${
                  isThemeNight ? 'bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white' : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-600'
                }`}
              >
                <X size={18} weight="bold" />
              </button>
            </div>
          </div>

          {/* Header Subtitle Banner */}
          {activeScannedModalType === 'worksheet' && (
            <div className="p-4 mb-6 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-xs text-orange-400 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Sparkle size={20} weight="bold" className="shrink-0 text-orange-500" />
                <div>
                  <p className="font-bold">
                    {isKo ? '체키 앱 학부모 스캔 화면과 동일한 AI 정답지 오버레이' : 'Identical AI Answer Ink Overlay as Chekki Parent App'}
                  </p>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    {isKo
                      ? '학부모님이 집에서 워크시트를 스캔했을 때 화면에 녹색 잉크로 자동 합성되는 정답지 내용입니다.'
                      : "This is the exact green answer ink overlaid on parents' screens when they scan their child's physical worksheet."}
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 bg-orange-500 text-white font-mono font-bold text-[10px] rounded-lg uppercase shrink-0">
                Chekki App Sync
              </span>
            </div>
          )}

          {/* Page Selector Pill Bar for Multi-Page Extractions */}
          {scannedData?.pages && scannedData.pages.length > 0 && (
            <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1 custom-scrollbar">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mr-1 shrink-0">
                {isKo ? '페이지 선택:' : 'Select Page:'}
              </span>
              <button
                type="button"
                onClick={() => setSelectedPageIndex('all')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border shrink-0 cursor-pointer flex items-center gap-1.5 ${
                  selectedPageIndex === 'all'
                    ? 'bg-orange-500 text-white border-orange-500 shadow-md'
                    : isThemeNight
                    ? 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'
                    : 'bg-zinc-100 border-zinc-300 text-zinc-700'
                }`}
              >
                <span>📚</span>
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
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border shrink-0 cursor-pointer flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-orange-500 text-white border-orange-500 shadow-md'
                        : isThemeNight
                        ? 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'
                        : 'bg-zinc-100 border-zinc-300 text-zinc-700'
                    }`}
                  >
                    <span>📄</span>
                    <span>{pObj.pageTitle || (isKo ? `페이지 ${pageNum}` : `Page ${pageNum}`)}</span>
                  </button>
                );
              })}
            </div>
          )}

          <div className="space-y-6">
            {/* Guardrail Warning Banner */}
            {hasInappropriateContent && (
              <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-xs text-red-400 font-bold flex items-center gap-3 animate-bounce">
                <Warning size={20} weight="bold" className="shrink-0 text-red-400" />
                <div>
                  <p>{isKo ? '🛡️ AI 세이프티 가드레일: 부적절한 단어 또는 비속어가 감지되었습니다.' : '🛡️ Content Safety Guardrail: Inappropriate language detected.'}</p>
                  <p className="text-[11px] font-normal text-red-300 mt-0.5">
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
                    <span className="text-[11px] font-bold font-mono text-orange-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Eye size={14} weight="bold" />
                      <span>{isKo ? '스캔 원본 & AI 정답 잉크' : 'Scanned Paper & Answer Ink'}</span>
                    </span>
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded font-mono">
                      Green Ink Overlay
                    </span>
                  </div>

                  {/* Paper Sheet Preview Container with Real Image Preview */}
                  <div className="relative w-full rounded-2xl border border-zinc-300 dark:border-white/10 bg-black/40 text-zinc-900 shadow-xl overflow-hidden font-serif select-none min-h-[420px] flex flex-col items-center justify-center p-3">
                    {worksheetPreviewUrl || docPreviewUrl || syllabusPreviewUrl ? (
                      <div className="relative w-full h-full min-h-[380px] rounded-xl overflow-hidden border border-white/20 bg-zinc-900 flex items-center justify-center group">
                        {/* Actual Scanned Physical Document Image */}
                        <img
                          src={worksheetPreviewUrl || docPreviewUrl || syllabusPreviewUrl || undefined}
                          alt="Scanned Physical Worksheet"
                          className="w-full h-auto max-h-[500px] object-contain rounded-lg drop-shadow-2xl"
                        />

                        {/* Green Ink Answer Overlay Badge on top of image */}
                        <div className="absolute top-3 right-3 px-3 py-1.5 rounded-xl bg-emerald-500/90 text-white font-mono font-bold text-xs shadow-lg backdrop-blur-md border border-emerald-300 flex items-center gap-1.5">
                          <Sparkle size={14} weight="fill" className="animate-pulse" />
                          <span>{isKo ? '🟢 Chekki Parent App 정답 오버레이 잉크' : '🟢 Green Ink Answer Overlay'}</span>
                        </div>

                        {/* Interactive Overlay Tags on Image */}
                        <div className="absolute bottom-4 left-4 right-4 p-3 rounded-xl bg-black/80 backdrop-blur-md border border-white/20 text-white text-xs space-y-1">
                          <span className="text-[10px] font-mono text-emerald-400 font-bold block uppercase tracking-wider">
                            {isKo ? '💡 학부모용 실시간 정답 오버레이 가이드:' : '💡 Live Parent App Screen Overlay:'}
                          </span>
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {(activeDisplayObj?.detectedAnswers || []).slice(0, 5).map((ans: any, i: number) => (
                              <span key={i} className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-emerald-500/30 text-emerald-300 border border-emerald-400/40">
                                Q{i + 1}: {ans.correctAnswer || ans.answer || 'Answer'}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="relative w-full rounded-2xl bg-white p-6 min-h-[380px] text-zinc-900">
                        <div className="border-b-2 border-zinc-900 pb-3 mb-6 flex justify-between items-end">
                          <div>
                            <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-bold">PHYSICAL WORKSHEET SCAN</span>
                            <h4 className="text-base font-black tracking-tight text-zinc-900 font-sans">
                              {activeDisplayObj?.topic || (isKo ? '스캔된 자료' : 'Scanned Document')}
                            </h4>
                          </div>
                          <span className="text-[10px] font-mono text-zinc-400 border border-zinc-300 px-2 py-0.5 rounded">PAGE 1 / 1</span>
                        </div>

                        <div className="space-y-4 text-xs">
                          {activeDisplayObj?.detectedAnswers && activeDisplayObj.detectedAnswers.length > 0 ? (
                            activeDisplayObj.detectedAnswers.map((item: any, idx: number) => (
                              <div key={idx} className="p-3 rounded-xl bg-zinc-50 border border-zinc-200">
                                <p className="font-semibold text-zinc-800 text-xs mb-1">{item.questionText || `Q${idx + 1}: Question ${idx + 1}`}</p>
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800 font-mono text-xs font-bold border border-emerald-300">
                                  <span>✍️ Green Ink:</span>
                                  <span className="underline decoration-emerald-500 decoration-2">{item.correctAnswer || item.answer || 'Answer'}</span>
                                </div>
                              </div>
                            ))
                          ) : (
                            <p className="text-zinc-500 text-xs p-3">
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
                    <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                      {isKo ? '✏️ 문항 및 정답 수정 (Right Panel Editor)' : '✏️ Edit Questions & Correct Answers'}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setScannedData((prev: any) => {
                          const currentAnswers = prev?.detectedAnswers || [];
                          const newNum = currentAnswers.length + 1;
                          const newAnswers = [
                            ...currentAnswers,
                            {
                              questionNumber: newNum,
                              category: 'Vocabulary',
                              questionText: `${newNum}. Additional Question Text ${newNum}`,
                              correctAnswer: 'answer',
                              answer: 'answer',
                            },
                          ];
                          return { ...prev, detectedAnswers: newAnswers };
                        });
                      }}
                      className="text-xs font-bold text-orange-400 hover:text-orange-300 flex items-center gap-1 cursor-pointer"
                    >
                      <Plus size={14} weight="bold" />
                      <span>{isKo ? '문항 추가' : 'Add Question'}</span>
                    </button>
                  </div>

                  {activeDisplayObj?.detectedAnswers && activeDisplayObj.detectedAnswers.length > 0 ? (
                    <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1 custom-scrollbar">
                      {activeDisplayObj.detectedAnswers.map((item: any, idx: number) => {
                        const itemHasBadWord = BAD_WORDS_PATTERN.test(item.questionText || '') || BAD_WORDS_PATTERN.test(item.correctAnswer || item.answer || '');

                        return (
                          <div
                            key={idx}
                            className={`p-4 rounded-2xl border transition-all text-left space-y-2.5 ${
                              itemHasBadWord ? 'bg-red-500/10 border-red-500/40' : isThemeNight ? 'bg-white/5 border-white/10' : 'bg-zinc-50 border-zinc-200'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30">
                                Question #{item.questionNumber || idx + 1}
                              </span>
                              <input
                                type="text"
                                value={item.category || 'Vocabulary'}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setScannedData((prev: any) => {
                                    const list = [...(prev?.detectedAnswers || [])];
                                    list[idx] = { ...list[idx], category: val };
                                    return { ...prev, detectedAnswers: list };
                                  });
                                }}
                                className="text-[10px] font-bold uppercase tracking-wider bg-transparent border-b border-zinc-600 focus:border-orange-500 text-zinc-400 outline-none text-right w-28"
                              />
                            </div>

                            <input
                              type="text"
                              value={item.questionText || item.question || ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                setScannedData((prev: any) => {
                                  const list = [...(prev?.detectedAnswers || [])];
                                  list[idx] = { ...list[idx], questionText: val, question: val };
                                  return { ...prev, detectedAnswers: list };
                                });
                              }}
                              className={`w-full text-xs font-semibold p-2.5 rounded-xl border outline-none transition-all ${
                                itemHasBadWord
                                  ? 'bg-red-950/40 border-red-500 text-red-200'
                                  : isThemeNight
                                  ? 'bg-[#050505] border-white/10 focus:border-orange-500 text-zinc-200'
                                  : 'bg-white border-zinc-300 focus:border-orange-500 text-zinc-800'
                              }`}
                              placeholder={isKo ? '문제 지문을 입력하세요' : 'Enter question text'}
                            />

                            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-3 text-xs">
                              <span className="text-emerald-400 font-bold shrink-0 flex items-center gap-1">
                                <span>✏️</span>
                                <span>{isKo ? '부모님용 정답 잉크 (수정 가능):' : 'Correct Answer Ink:'}</span>
                              </span>
                              <input
                                type="text"
                                value={item.correctAnswer || item.answer || ''}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setScannedData((prev: any) => {
                                    const list = [...(prev?.detectedAnswers || [])];
                                    list[idx] = { ...list[idx], correctAnswer: val, answer: val };
                                    return { ...prev, detectedAnswers: list };
                                  });
                                }}
                                className={`bg-[#050505] border outline-none px-3 py-1.5 rounded-lg font-mono font-black text-xs w-full max-w-[220px] ${
                                  BAD_WORDS_PATTERN.test(item.correctAnswer || item.answer || '')
                                    ? 'border-red-500 text-red-300'
                                    : 'border-emerald-500/50 focus:border-emerald-400 text-emerald-300'
                                }`}
                                placeholder={isKo ? '정답 단어/문장 입력' : 'Enter answer text'}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-8 text-center border rounded-2xl border-dashed border-white/10 text-xs text-zinc-500 space-y-3">
                      <p>{isKo ? '추출된 개별 정답 문항이 없거나 아직 스캔되지 않았습니다.' : 'No worksheet question answers extracted yet.'}</p>
                      <button
                        type="button"
                        onClick={() => {
                          setScannedData((prev: any) => ({
                            ...prev,
                            detectedAnswers: [
                              { questionNumber: 1, category: 'Vocabulary', questionText: '1. Organisms that make food', correctAnswer: 'producers', answer: 'producers' },
                              { questionNumber: 2, category: 'Vocabulary', questionText: '2. Organisms that eat living things', correctAnswer: 'consumer', answer: 'consumer' },
                            ],
                          }));
                        }}
                        className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl transition-all cursor-pointer inline-flex items-center gap-1.5"
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
                  <div className={`p-4 rounded-2xl border ${isThemeNight ? 'bg-white/5 border-white/10' : 'bg-zinc-50 border-zinc-200'}`}>
                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-xs font-bold text-orange-500 uppercase tracking-widest">
                        {isKo ? '추출된 대주제 / 테마 (Topic)' : 'Extracted Topic / Theme'}
                      </span>
                      <input
                        type="checkbox"
                        checked={selectedScannedTopic}
                        onChange={(e) => setSelectedScannedTopic(e.target.checked)}
                        className="w-4 h-4 accent-orange-500 cursor-pointer"
                      />
                    </label>
                    <p className={`text-base font-bold mt-1 ${isThemeNight ? 'text-white' : 'text-zinc-900'}`}>{activeDisplayObj.topic}</p>
                  </div>
                )}

                {/* Vocabulary Selection */}
                {activeDisplayObj?.vocabWords && (Array.isArray(activeDisplayObj.vocabWords) ? activeDisplayObj.vocabWords.length > 0 : Boolean(activeDisplayObj.vocabWords)) && (
                  <div className={`p-4 rounded-2xl border ${isThemeNight ? 'bg-white/5 border-white/10' : 'bg-zinc-50 border-zinc-200'}`}>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold text-orange-500 uppercase tracking-widest">
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
                        className="text-[11px] font-bold text-orange-500 hover:underline cursor-pointer"
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
                            className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-2 ${
                              isSelected
                                ? 'bg-orange-500 border-orange-500 text-white shadow-md scale-[1.02]'
                                : isThemeNight
                                ? 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'
                                : 'bg-zinc-100 border-zinc-300 text-zinc-700'
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
          <div className="mt-8 pt-4 border-t border-white/10 flex justify-between items-center">
            <button
              type="button"
              onClick={onClose}
              className={`px-5 py-2.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                isThemeNight ? 'bg-white/5 hover:bg-white/10 text-zinc-400 border-white/10' : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border-zinc-300'
              }`}
            >
              {isKo ? '닫기' : 'Close'}
            </button>

            <button
              type="button"
              onClick={onApplyToCurriculum}
              className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-orange-500/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              <CheckCircle size={16} weight="bold" />
              <span>{isKo ? '선택 항목을 주간 커리큘럼에 적용' : 'Apply Selected to Curriculum'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
