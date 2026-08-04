import React from 'react';
import {
  BookOpen,
  FileText,
  Sparkle,
  Eye,
  Plus,
  X,
  Notebook,
  Info,
  Printer,
  CheckCircle,
} from '@phosphor-icons/react';

interface Props {
  isNight: boolean;
  isKo: boolean;
  activeTab: string;
  uploadMode: 'syllabus' | 'worksheet';
  user: any;
  classes: any[];
  selectedClass: any;
  setSelectedClass: (c: any) => void;
  selectedTextbookName: string;
  setSelectedTextbookName: (v: string) => void;
  isLoadingCurriculum: boolean;
  handleSaveCurriculum: (e: React.FormEvent) => void;
  scanStatusMessage: string | null;
  scannedData: any;
  setShowScannedModal: (v: boolean) => void;
  isDraggingFile: boolean;
  setIsDraggingFile: (v: boolean) => void;
  handleTextbookFileUpload: (files: FileList | File[] | File, scanType?: 'syllabus' | 'worksheet') => void;
  isScanningSyllabus: boolean;
  syllabusPreviewUrl: string | null;
  syllabusFileName: string;
  setDocPreviewUrl: (v: string | null) => void;
  setShowDocPreviewModal: (v: boolean) => void;
  syllabusScannedData: any;
  setActiveScannedModalType: (v: 'syllabus' | 'worksheet') => void;
  setScannedData: (v: any) => void;
  syllabusWeeks: number;
  handleSyllabusWeeksChange: (weeks: number) => void;
  isScanningWorksheet: boolean;
  worksheetPreviewUrl: string | null;
  worksheetFileName: string;
  worksheetScannedData: any;
  setWorksheetPreviewUrl: (v: string | null) => void;
  setWorksheetScannedData: (v: any) => void;
  setWorksheetFileName: (v: string) => void;
  handleUpdateWeek: (delta: number) => void;
  curriculumTopic: string;
  setCurriculumTopic: (v: string) => void;
  curriculumVocab: string;
  setCurriculumVocab: (v: string) => void;
  handleRemoveVocabWord: (index: number) => void;
  newVocabInput: string;
  setNewVocabInput: (v: string) => void;
  handleAddVocabWord: (word?: string) => void;
  curriculumPhonics: string;
  setCurriculumPhonics: (v: string) => void;
  handleRemovePhonicsRule: (index: number) => void;
  newPhonicsInput: string;
  setNewPhonicsInput: (v: string) => void;
  handleAddPhonicsRule: (rule?: string) => void;
  curriculumPassage: string;
  setCurriculumPassage: (v: string) => void;
  curriculumOther: string;
  setCurriculumOther: (v: string) => void;
  worksheetType: string;
  setWorksheetType: (v: string) => void;
  questionStyle: string;
  setQuestionStyle: (v: string) => void;
  loadCurriculum: () => void;
  isSavingCurriculum: boolean;
}

/**
 * The curriculum-editing form shared by Director's "Syllabus" tab and FT's
 * "Homework" tab (audit §6/§10/§17f) — same form, same `handleSaveCurriculum`
 * submit handler, gated internally by `activeTab`/`uploadMode` to show
 * syllabus-only fields (topic/vocab/phonics/passage/other) vs. worksheet-only
 * fields (AI worksheet generation options). This was the reason Director's
 * Syllabus and FT's Homework tabs couldn't be split into fully independent
 * components in one pass — extracting one without the other would have
 * meant duplicating this form. Both NativeDirectorPortal and
 * NativeFtDashboard now import this same component.
 *
 * All state stays owned by TeacherPage and is passed down as props — some of
 * it (curriculumTopic/Phonics/Passage/Other, scannedData) is also read by
 * NativeFtDashboard's Overview tab and the scan-result modals that still
 * live in TeacherPage.tsx, so it can't be made local to this component.
 */
export const CurriculumEditorForm: React.FC<Props> = ({
  isNight,
  isKo,
  activeTab,
  uploadMode,
  user,
  classes,
  selectedClass,
  setSelectedClass,
  selectedTextbookName,
  setSelectedTextbookName,
  isLoadingCurriculum,
  handleSaveCurriculum,
  scanStatusMessage,
  scannedData,
  setShowScannedModal,
  isDraggingFile,
  setIsDraggingFile,
  handleTextbookFileUpload,
  isScanningSyllabus,
  syllabusPreviewUrl,
  syllabusFileName,
  setDocPreviewUrl,
  setShowDocPreviewModal,
  syllabusScannedData,
  setActiveScannedModalType,
  setScannedData,
  syllabusWeeks,
  handleSyllabusWeeksChange,
  isScanningWorksheet,
  worksheetPreviewUrl,
  worksheetFileName,
  worksheetScannedData,
  setWorksheetPreviewUrl,
  setWorksheetScannedData,
  setWorksheetFileName,
  handleUpdateWeek,
  curriculumTopic,
  setCurriculumTopic,
  curriculumVocab,
  setCurriculumVocab,
  handleRemoveVocabWord,
  newVocabInput,
  setNewVocabInput,
  handleAddVocabWord,
  curriculumPhonics,
  setCurriculumPhonics,
  handleRemovePhonicsRule,
  newPhonicsInput,
  setNewPhonicsInput,
  handleAddPhonicsRule,
  curriculumPassage,
  setCurriculumPassage,
  curriculumOther,
  setCurriculumOther,
  worksheetType,
  setWorksheetType,
  questionStyle,
  setQuestionStyle,
  loadCurriculum,
  isSavingCurriculum,
}) => {
  const isThemeNight = isNight;
  return (
    <div className={`p-1 rounded-[2.5rem] animate-fade-in text-left transition-colors ${
      isThemeNight ? 'bg-white/5 border border-white/10 shadow-2xl' : 'bg-white border border-zinc-200 shadow-md'
    }`}>
      <div className={`rounded-[calc(2.5rem-0.25rem)] p-6 sm:p-8 transition-colors ${
        isThemeNight ? 'bg-[#0a0a0c]' : 'bg-white'
      }`}>
        <div className={`flex items-center justify-between mb-8 pb-4 border-b ${isThemeNight ? 'border-white/5' : 'border-zinc-200'}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-500 flex items-center justify-center">
              {activeTab === 'syllabus' ? <BookOpen size={22} weight="bold" /> : <FileText size={22} weight="bold" />}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h4 className={`text-xl font-black ${isThemeNight ? 'text-white' : 'text-zinc-900'}`}>
                  {activeTab === 'syllabus'
                    ? (isKo ? `📘 주간 학과목/교재 범위 설정 (Week ${selectedClass?.activeWeekNumber || 1})` : `📘 Course Syllabus & Scope (Week ${selectedClass?.activeWeekNumber || 1})`)
                    : (isKo ? `📄 일간 워크시트 및 오답 채점 (Week ${selectedClass?.activeWeekNumber || 1})` : `📄 Daily Homework Worksheet Scanner (Week ${selectedClass?.activeWeekNumber || 1})`)}
                </h4>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-500/10 border border-blue-500/20 text-blue-400 font-mono">
                  ✍️ {isKo ? `담당 교사: ${(user as any)?.displayName || (user as any)?.email?.split('@')[0] || '원어민 교사'}` : `Assigned: ${(user as any)?.displayName || (user as any)?.email?.split('@')[0] || 'FT Teacher'}`}
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                {activeTab === 'syllabus'
                  ? (isKo ? '선택된 학급의 교재목차, 주차별 학습 주제, 어휘 및 파닉스 범위를 구성합니다.' : 'Configure course textbook, weekly topics, vocabulary lists, and phonics targets.')
                  : (isKo ? '학생이 작성한 매일 워크시트 종이를 스캔하여 학부모 채점 그린 잉크 오버레이를 생성합니다.' : 'Upload scanned physical student worksheet papers to generate Green Ink overlays.')}
              </p>
            </div>
          </div>
        </div>

        {isLoadingCurriculum ? (
          <div className="flex items-center justify-center min-h-[30vh]">
            <div className="w-8 h-8 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
          </div>
        ) : (
          <form onSubmit={handleSaveCurriculum} className="space-y-6">
            {/* Scan status feedback banner */}
            {scanStatusMessage && (
              <div className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${
                isThemeNight ? 'bg-orange-500/10 border-orange-500/30 text-orange-300' : 'bg-orange-50 border-orange-200 text-orange-900'
              }`}>
                <div className="flex items-center gap-3">
                  <Sparkle size={20} weight="bold" className="text-orange-500 shrink-0" />
                  <p className="text-xs font-semibold">{scanStatusMessage}</p>
                </div>
                {scannedData && (
                  <button
                    type="button"
                    onClick={() => setShowScannedModal(true)}
                    className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl shadow-md transition-all shrink-0 cursor-pointer"
                  >
                    🎯 {isKo ? '스캔 결과 & 답안 확인' : 'View Scanned Answers'}
                  </button>
                )}
              </div>
            )}

            {/* Target Class & Target Textbook Selection Lock Bar */}
            <div className={`p-4 rounded-2xl border space-y-3 mb-6 transition-all ${
              isThemeNight ? 'bg-orange-500/5 border-orange-500/20' : 'bg-orange-50/60 border-orange-200'
            }`}>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-mono font-black text-orange-500 uppercase tracking-widest block">
                    📌 {isKo ? '적용 학급반 & 교재 지정 (Target Class & Textbook Lock)' : 'Target Class & Textbook Lock'}
                  </span>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    {isKo
                      ? '현재 업로드 중인 커리큘럼이 적용될 학급반과 교재명을 정확히 지정하세요. 폼 및 대시보드가 실시간 동기화됩니다.'
                      : 'Specify the exact class and textbook name for this upload. Auto-syncs with teacher forms to prevent wrong-class logs.'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {/* Target Class Selector */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                    {isKo ? '적용 학급반 (Target Class)' : 'Target Class'}
                  </label>
                  <select
                    value={selectedClass?.id || ''}
                    onChange={(e) => {
                      const target = classes.find(c => c.id === e.target.value);
                      if (target) setSelectedClass(target);
                    }}
                    className={`w-full p-2.5 rounded-xl border text-xs font-bold focus:outline-none focus:border-orange-500 cursor-pointer ${
                      isThemeNight ? 'bg-[#050505] border-white/10 text-white' : 'bg-white border-zinc-300 text-zinc-900'
                    }`}
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        🏫 {c.name} ({c.level || 'Active Class'})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Target Textbook Name Input — Syllabus tab only */}
                {activeTab === 'syllabus' && (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                    {isKo ? '교재명 (Textbook Title)' : 'Textbook Title'}
                  </label>
                  <input
                    type="text"
                    value={selectedTextbookName}
                    onChange={(e) => setSelectedTextbookName(e.target.value)}
                    placeholder="E.g. Bricks Reading 150 (Book 1)"
                    className={`w-full p-2.5 rounded-xl border text-xs font-bold outline-none focus:border-orange-500 ${
                      isThemeNight ? 'bg-[#050505] border-white/10 text-white placeholder:text-zinc-600' : 'bg-white border-zinc-300 text-zinc-900 placeholder:text-zinc-400'
                    }`}
                  />
                </div>
                )}
              </div>
            </div>

            {/* MODE 1: SYLLABUS & COURSE DURATION MANAGER */}
            {uploadMode === 'syllabus' && (
              <div className="space-y-4">

                {/* ① UPLOAD FIRST — Syllabus Dropzone */}
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDraggingFile(true); }}
                  onDragLeave={() => setIsDraggingFile(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDraggingFile(false);
                    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                      handleTextbookFileUpload(e.dataTransfer.files, 'syllabus');
                    }
                  }}
                  className={`relative border-2 border-dashed rounded-3xl p-6 transition-all text-center flex flex-col items-center justify-center gap-3 ${
                    isDraggingFile
                      ? 'border-orange-500 bg-orange-500/10 scale-[1.01]'
                      : isThemeNight ? 'border-white/10 hover:border-orange-500/40 bg-[#050505]' : 'border-zinc-300 hover:border-orange-500/40 bg-zinc-50/70'
                  }`}
                >
                  <input
                    type="file"
                    multiple
                    accept="image/*,.pdf"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        handleTextbookFileUpload(e.target.files, 'syllabus');
                      }
                    }}
                    className="absolute inset-0 opacity-0 cursor-pointer z-20"
                  />

                  {isScanningSyllabus ? (
                    <div className="flex flex-col items-center py-4">
                      <div className="w-10 h-10 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin mb-3" />
                      <p className="text-xs font-bold text-orange-500">
                        {isKo ? 'Chekki AI가 교재 시라버스 목차를 분석하고 있습니다...' : 'Scanning Course Syllabus with Chekki AI...'}
                      </p>
                      <p className="text-[10px] text-zinc-500 mt-1">
                        {isKo ? '전체 주차별 어휘 및 파닉스 범위를 추출합니다 (정답지 불필요)' : 'Extracting multi-week course scope & vocabulary (No answer key needed)'}
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-center gap-4 w-full justify-between px-2">
                      <div className="flex items-center gap-4">
                        {syllabusPreviewUrl ? (
                          <img
                            src={syllabusPreviewUrl}
                            alt="Syllabus preview"
                            className="w-16 h-16 object-cover rounded-2xl border border-orange-500/30 shadow-md shrink-0 cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDocPreviewUrl(syllabusPreviewUrl);
                              setShowDocPreviewModal(true);
                            }}
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-500 flex items-center justify-center shadow-lg shrink-0">
                            <BookOpen size={22} weight="bold" />
                          </div>
                        )}
                        <div className="text-left">
                          <h5 className={`text-sm font-bold flex items-center gap-2 ${isThemeNight ? 'text-white' : 'text-zinc-900'}`}>
                            <span>
                              {syllabusFileName
                                ? (syllabusFileName.length > 28 ? syllabusFileName.substring(0, 25) + '...' : syllabusFileName)
                                : (isKo ? '📘 교재 목차/시라버스 파일 업로드 (Photo/PDF)' : '📘 Upload Syllabus / Course Plan (Photo/PDF)')}
                            </span>
                            <span className="px-2 py-0.5 bg-orange-500/20 text-orange-500 text-[9px] font-black uppercase rounded-md border border-orange-500/30">
                              Syllabus Mode
                            </span>
                          </h5>
                          <p className={`text-xs mt-0.5 ${isThemeNight ? 'text-zinc-400' : 'text-zinc-500'}`}>
                            {syllabusFileName
                              ? (isKo ? '독립 저장됨: 클릭하여 새 시라버스 스캔' : 'Stored independently. Click to rescan syllabus.')
                              : (isKo ? '목차 페이지 사진이나 PDF를 드롭하면 주차별 어휘 및 파닉스 범위를 자동 생성합니다.' : 'Drag & drop syllabus. AI extracts course-wide vocabulary scope.')}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 z-30">
                        {syllabusPreviewUrl && (
                          <button
                            type="button"
                            onClick={() => {
                              setDocPreviewUrl(syllabusPreviewUrl);
                              setShowDocPreviewModal(true);
                            }}
                            className="px-3 py-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-400 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                          >
                            <Eye size={14} weight="bold" />
                            <span>{isKo ? '시라버스 원본 보기' : 'View Syllabus'}</span>
                          </button>
                        )}
                        {syllabusScannedData && (
                          <button
                            type="button"
                            onClick={() => {
                              setActiveScannedModalType('syllabus');
                              setScannedData(syllabusScannedData);
                              setShowScannedModal(true);
                            }}
                            className="px-3 py-2 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 text-orange-500 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                          >
                            <Sparkle size={14} weight="bold" />
                            <span>{isKo ? '어휘 범위 확인' : 'View Scope'}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* ② Course Duration Selector */}
                <div className={`p-4 rounded-2xl border space-y-3 ${isThemeNight ? 'bg-white/5 border-white/10' : 'bg-zinc-50 border-zinc-200'}`}>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <label className="text-xs font-bold text-orange-500 uppercase tracking-widest block">
                        🗓️ {isKo ? '교재 커리큘럼 진행 기간 (Course Duration in Weeks)' : 'Course Duration (Weeks)'}
                      </label>
                      <p className="text-[11px] text-zinc-400 mt-0.5">
                        {isKo ? '시라버스가 몇 주 동안 진행되는 교재인지 선택하세요 (기본 4주).' : 'Select total duration in weeks for this textbook syllabus (default: 4 weeks).'}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {[4, 8, 12, 16].map(numWeeks => (
                        <button
                          key={numWeeks}
                          type="button"
                          onClick={() => handleSyllabusWeeksChange(numWeeks)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                            syllabusWeeks === numWeeks
                              ? 'bg-orange-500 text-white border-orange-500 shadow-md'
                              : isThemeNight ? 'bg-white/5 border-white/10 text-zinc-400 hover:text-white' : 'bg-white border-zinc-300 text-zinc-700'
                          }`}
                        >
                          {numWeeks} {isKo ? '주' : 'Wks'}
                        </button>
                      ))}
                      <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl px-2 py-1">
                        <input
                          type="number"
                          min={1}
                          max={52}
                          value={syllabusWeeks}
                          onChange={(e) => handleSyllabusWeeksChange(Number(e.target.value) || 4)}
                          className="w-12 text-center text-xs font-bold bg-transparent outline-none text-orange-400"
                        />
                        <span className="text-[10px] text-zinc-400">{isKo ? '주간' : 'Weeks'}</span>
                      </div>
                  </div>
                </div>

                  {/* ③ Pro Scanner Tip Banner */}
                  <div className={`p-4 rounded-2xl border text-xs flex items-start gap-3 transition-colors ${
                    isThemeNight ? 'bg-orange-500/10 border-orange-500/30 text-orange-200' : 'bg-orange-50 border-orange-200 text-orange-950'
                  }`}>
                    <Sparkle size={20} weight="fill" className="shrink-0 text-orange-500 mt-0.5" />
                    <div className="space-y-1">
                      <span className="font-bold block text-xs text-orange-400">
                        💡 {isKo ? '교재 목차(Textbook Syllabus / Index) 촬영 & 스캔 팁:' : 'Pro Tips for Textbook Syllabus / Index Photo Scanning:'}
                      </span>
                      <ul className={`text-[11px] space-y-1 list-disc pl-4 leading-relaxed ${isThemeNight ? 'text-zinc-300' : 'text-zinc-600'}`}>
                        <li>{isKo ? '교재 맨 앞쪽의 Table of Contents (목차) 및 Scope & Sequence 페이지를 평평하게 촬영하세요.' : 'Take a flat, glare-free photo of the textbook Table of Contents or Scope & Sequence page.'}</li>
                        <li>{isKo ? '주차별/단원별(Unit 1, Unit 2) 제목과 타겟 어휘 목록이 포함되도록 구도를 맞추세요.' : 'Ensure unit headers (Unit 1, Unit 2) and target vocabulary lists are clearly framed.'}</li>
                        <li>{isKo ? 'Chekki AI가 4주~16주 전체 과정의 주차별 어휘 및 파닉스를 자동 추출하여 대시보드에 선제 탑재합니다.' : 'Chekki AI automatically extracts multi-week vocabulary & phonics to pre-seed your entire course!'}</li>
                      </ul>
                    </div>
                  </div>

                </div>
              </div>
            )}


            {/* MODE 2: DAILY HOMEWORK WORKSHEET & ANSWER KEY SCANNER */}
            {activeTab === 'homework' && (
              <div className="space-y-4">
                {/* FT Quick Week Switcher Header Bar */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-white/5 border border-white/10 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-orange-400">⚡ ACTIVE SCANNING WEEK:</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleUpdateWeek(-1)}
                        className="px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold transition-all cursor-pointer active:scale-95"
                      >
                        ‹ Prev
                      </button>
                      <span className="px-3 py-1 rounded-xl bg-orange-500/20 text-orange-400 font-black text-xs border border-orange-500/30 font-mono">
                        Week {selectedClass?.activeWeekNumber || 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleUpdateWeek(1)}
                        className="px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold transition-all cursor-pointer active:scale-95"
                      >
                        Next ›
                      </button>
                    </div>
                  </div>
                  <span className="text-[11px] text-zinc-400 font-mono">
                    Class: {selectedClass?.name || '7A'}
                  </span>
                </div>


                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDraggingFile(true); }}
                  onDragLeave={() => setIsDraggingFile(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDraggingFile(false);
                    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                      handleTextbookFileUpload(e.dataTransfer.files, 'worksheet');
                    }
                  }}
                  className={`relative border-2 border-dashed rounded-3xl p-6 transition-all text-center flex flex-col items-center justify-center gap-3 ${
                    isDraggingFile
                      ? 'border-orange-500 bg-orange-500/10 scale-[1.01]'
                      : isThemeNight ? 'border-white/10 hover:border-orange-500/40 bg-[#050505]' : 'border-zinc-300 hover:border-orange-500/40 bg-zinc-50/70'
                  }`}
                >
                  <input
                    type="file"
                    multiple
                    accept="image/*,.pdf"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        handleTextbookFileUpload(e.target.files, 'worksheet');
                      }
                    }}
                    className="absolute inset-0 opacity-0 cursor-pointer z-20"
                  />

                  {isScanningWorksheet ? (
                    <div className="flex flex-col items-center py-4">
                      <div className="w-10 h-10 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin mb-3" />
                      <p className="text-xs font-bold text-orange-500">
                        {isKo ? 'Chekki AI가 워크시트 문제와 학부모 정답지를 분석하고 있습니다...' : 'Scanning Daily Worksheet & Answer Key with Chekki AI...'}
                      </p>
                      <p className="text-[10px] text-zinc-500 mt-1">
                        {isKo ? '문제별 학부모 잉크 정답 오버레이 가이드를 추출합니다' : 'Extracting question-by-question parent answer keys'}
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-center gap-4 w-full justify-between px-2">
                      <div className="flex items-center gap-4">
                        {worksheetPreviewUrl ? (
                          <img
                            src={worksheetPreviewUrl}
                            alt="Worksheet preview"
                            className="w-16 h-16 object-cover rounded-2xl border border-orange-500/30 shadow-md shrink-0 cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDocPreviewUrl(worksheetPreviewUrl);
                              setShowDocPreviewModal(true);
                            }}
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-500 flex items-center justify-center shadow-lg shrink-0">
                            <FileText size={22} weight="bold" />
                          </div>
                        )}
                        <div className="text-left">
                          <h5 className={`text-sm font-bold flex items-center gap-2 ${isThemeNight ? 'text-white' : 'text-zinc-900'}`}>
                            <span>
                              {worksheetFileName
                                ? (worksheetFileName.length > 28 ? worksheetFileName.substring(0, 25) + '...' : worksheetFileName)
                                : (isKo ? '📄 일간 워크시트/정답지 업로드 (Photo/PDF)' : '📄 Upload Homework Worksheet / Answer Key (Photo/PDF)')}
                            </span>
                            <span className="px-2 py-0.5 bg-orange-500/20 text-orange-500 text-[9px] font-black uppercase rounded-md border border-orange-500/30">
                              Answer Key Mode
                            </span>
                          </h5>
                          <p className="text-xs text-zinc-400 mt-0.5">
                            {worksheetFileName
                              ? (isKo ? '독립 저장됨: 새 워크시트 스캔' : 'Stored independently. Click to rescan worksheet.')
                              : (isKo ? '오늘의 워크시트 사진이나 PDF를 드롭하면 학부모용 정답 가이드를 자동 생성합니다.' : 'Drag & drop worksheet photo. AI creates parent answer key overlays.')}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 z-30 flex-wrap">
                        <label className="px-3.5 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 z-30">
                          <span>📷</span>
                          <span>{isKo ? '카메라 바로 촬영' : 'Camera Snap'}</span>
                          <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            onChange={(e) => {
                              if (e.target.files && e.target.files.length > 0) {
                                handleTextbookFileUpload(e.target.files, 'worksheet');
                              }
                            }}
                            className="hidden"
                          />
                        </label>
                        {worksheetPreviewUrl && (
                          <button
                            type="button"
                            onClick={() => {
                              setDocPreviewUrl(worksheetPreviewUrl);
                              setShowDocPreviewModal(true);
                            }}
                            className="px-3 py-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-400 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                          >
                            <Eye size={14} weight="bold" />
                            <span>{isKo ? '워크시트 원본 보기' : 'View Worksheet'}</span>
                          </button>
                        )}
                        {worksheetScannedData && (
                          <button
                            type="button"
                            onClick={() => {
                              setActiveScannedModalType('worksheet');
                              setScannedData(worksheetScannedData);
                              setShowScannedModal(true);
                            }}
                            className="px-3 py-2 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 text-orange-500 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                          >
                            <Sparkle size={14} weight="bold" />
                            <span>{isKo ? '정답지 확인' : 'View Answers'}</span>
                          </button>
                        )}
                        {/* Continuous Upload Button */}
                        <button
                          type="button"
                          onClick={() => {
                            setWorksheetPreviewUrl('');
                            setWorksheetScannedData(null);
                            setWorksheetFileName('');
                          }}
                          className="px-3.5 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-orange-500/20 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                        >
                          <Plus size={14} weight="bold" />
                          <span>{isKo ? '+ 추가 워크시트 업로드' : '+ Upload Additional Worksheet'}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* SYLLABUS TAB ONLY: Weekly Topic, Vocabulary, Phonics, Reading Passage, Other */}
            {activeTab === 'syllabus' && (<>
            <div className="space-y-2">
              <label className={`text-[10px] font-bold uppercase tracking-widest pl-1 ${isThemeNight ? 'text-zinc-400' : 'text-zinc-600'}`}>
                {isKo ? '대주제 / 주간 테마 (Topic)' : 'Weekly Topic / Theme'}
              </label>
              <input
                type="text"
                value={curriculumTopic}
                onChange={(e) => setCurriculumTopic(e.target.value)}
                placeholder={isKo ? '예: Weather & Nature (날씨와 자연)' : 'E.g. Weather & Nature'}
                className={`w-full border outline-none text-sm p-4 rounded-2xl transition-all ${
                  isThemeNight ? 'bg-[#050505] border-white/10 focus:border-orange-500 text-white placeholder:text-zinc-600' : 'bg-zinc-50 border-zinc-300 focus:border-orange-500 text-zinc-900 placeholder:text-zinc-400'
                }`}
              />
            </div>

            {/* Interactive Chips & Fast Input for Vocabulary and Phonics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Target Vocabulary */}
              <div className="space-y-3">
                <div className="flex items-center justify-between pl-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                    {isKo ? '주간 학습 단어 (Target Vocabulary)' : 'Target Vocabulary'}
                  </label>
                  <span className="text-[10px] font-mono font-bold text-orange-500">
                    {curriculumVocab.split(/[,\n]/).filter(s => s.trim()).length} {isKo ? '개 단어' : 'words'}
                  </span>
                </div>

                {/* Chip Badges Container */}
                <div className={`p-3.5 rounded-2xl border min-h-[90px] flex flex-wrap gap-2 items-center transition-all ${
                  isThemeNight ? 'bg-[#050505] border-white/10' : 'bg-zinc-50 border-zinc-300'
                }`}>
                  {curriculumVocab.split(/[,\n]/).filter(s => s.trim()).length === 0 ? (
                    <p className="text-xs text-zinc-500 italic p-1">
                      {isKo ? '등록된 단어가 없습니다. 아래에서 단어를 추가하거나 워크시트를 스캔하세요.' : 'No vocabulary words yet. Type below or scan a worksheet.'}
                    </p>
                  ) : (
                    curriculumVocab.split(/[,\n]/).map(s => s.trim()).filter(Boolean).map((word, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-500/15 border border-orange-500/30 text-orange-400 font-mono font-bold text-xs rounded-xl shadow-sm group transition-all"
                      >
                        <span>{word}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveVocabWord(idx)}
                          className="p-0.5 hover:bg-orange-500/30 rounded-full transition-colors cursor-pointer text-orange-400 hover:text-white"
                          title={isKo ? '단어 삭제' : 'Delete word'}
                        >
                          <X size={12} weight="bold" />
                        </button>
                      </span>
                    ))
                  )}
                </div>

                {/* Add Word Input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newVocabInput}
                    onChange={(e) => setNewVocabInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddVocabWord();
                      }
                    }}
                    placeholder={isKo ? '새 단어 입력 후 Enter...' : 'Type a word & press Enter...'}
                    className={`flex-1 border outline-none text-xs p-3.5 rounded-xl transition-all ${
                      isThemeNight ? 'bg-[#050505] border-white/10 focus:border-orange-500 text-white placeholder:text-zinc-600' : 'bg-zinc-50 border-zinc-300 focus:border-orange-500 text-zinc-900 placeholder:text-zinc-400'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => handleAddVocabWord()}
                    className="px-4 py-3.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-[0.97] cursor-pointer"
                  >
                    + {isKo ? '추가' : 'Add'}
                  </button>
                </div>

                <textarea
                  value={curriculumVocab}
                  onChange={(e) => setCurriculumVocab(e.target.value)}
                  placeholder="umbrella, rainbow, storm..."
                  className="hidden"
                />
              </div>

              {/* Target Phonics Rules */}
              <div className="space-y-3">
                <div className="flex items-center justify-between pl-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                    {isKo ? '주간 타겟 파닉스 / 음가 (Phonics Sounds)' : 'Target Phonics Rules / Sounds'}
                  </label>
                  <span className="text-[10px] font-mono font-bold text-indigo-400">
                    {curriculumPhonics.split(/[,\n]/).filter(s => s.trim()).length} {isKo ? '개 음가' : 'sounds'}
                  </span>
                </div>

                {/* Chip Badges Container */}
                <div className={`p-3.5 rounded-2xl border min-h-[90px] flex flex-wrap gap-2 items-center transition-all ${
                  isThemeNight ? 'bg-[#050505] border-white/10' : 'bg-zinc-50 border-zinc-300'
                }`}>
                  {curriculumPhonics.split(/[,\n]/).filter(s => s.trim()).length === 0 ? (
                    <p className="text-xs text-zinc-500 italic p-1">
                      {isKo ? '등록된 파닉스 규칙이 없습니다. 아래에서 음가를 추가하거나 스캔하세요.' : 'No phonics rules yet. Type below or scan a worksheet.'}
                    </p>
                  ) : (
                    curriculumPhonics.split(/[,\n]/).map(s => s.trim()).filter(Boolean).map((rule, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 font-mono font-bold text-xs rounded-xl shadow-sm group transition-all"
                      >
                        <span>{rule}</span>
                        <button
                          type="button"
                          onClick={() => handleRemovePhonicsRule(idx)}
                          className="p-0.5 hover:bg-indigo-500/30 rounded-full transition-colors cursor-pointer text-indigo-400 hover:text-white"
                          title={isKo ? '파닉스 규칙 삭제' : 'Delete sound rule'}
                        >
                          <X size={12} weight="bold" />
                        </button>
                      </span>
                    ))
                  )}
                </div>

                {/* Add Phonics Sound Input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newPhonicsInput}
                    onChange={(e) => setNewPhonicsInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddPhonicsRule();
                      }
                    }}
                    placeholder={isKo ? '파닉스 입력 (예: -ai-) 후 Enter...' : 'Type a sound (e.g. -ai-) & press Enter...'}
                    className={`flex-1 border outline-none text-xs p-3.5 rounded-xl transition-all ${
                      isThemeNight ? 'bg-[#050505] border-white/10 focus:border-indigo-500 text-white placeholder:text-zinc-600' : 'bg-zinc-50 border-zinc-300 focus:border-indigo-500 text-zinc-900 placeholder:text-zinc-400'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => handleAddPhonicsRule()}
                    className="px-4 py-3.5 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-[0.97] cursor-pointer"
                  >
                    + {isKo ? '추가' : 'Add'}
                  </button>
                </div>

                <textarea
                  value={curriculumPhonics}
                  onChange={(e) => setCurriculumPhonics(e.target.value)}
                  placeholder="-ai-, -ay-..."
                  className="hidden"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-1">
                {isKo ? '주간 본문 지문 / 스토리 (Reading Passage)' : 'Weekly Reading Passage / Target Story'}
              </label>
              <textarea
                value={curriculumPassage}
                onChange={(e) => setCurriculumPassage(e.target.value)}
                placeholder={isKo ? '이번 주 교재에 수록된 본문 이야기를 입력해 주세요.' : 'Paste the reference reading text here.'}
                className={`w-full h-36 border outline-none text-sm p-4 rounded-2xl transition-all resize-y ${
                  isThemeNight ? 'bg-[#050505] border-white/10 focus:border-orange-500 text-white placeholder:text-zinc-600' : 'bg-zinc-50 border-zinc-300 focus:border-orange-500 text-zinc-900 placeholder:text-zinc-400'
                }`}
              />
            </div>

            {/* NEW: Other Field with Guardrails & Educational Tooltip */}
            <div className="space-y-3">
              <div className="flex items-center justify-between pl-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Notebook size={14} weight="bold" className="text-purple-400" />
                  <span>{isKo ? '기타 추가 학습 내용 및 숙제 가이드 (Other)' : 'Other Supplementary Notes & Rules (Other)'}</span>
                </label>
                <span className="text-[9px] text-purple-400 font-bold px-2 py-0.5 bg-purple-500/10 border border-purple-500/20 rounded-full">
                  🛡️ {isKo ? '영어 학습 보조 전용' : 'English Instruction Only'}
                </span>
              </div>

              {/* Recommended Format Tooltip Box */}
              <div className={`p-3.5 rounded-2xl border text-xs flex items-start gap-3 transition-colors ${
                isThemeNight ? 'bg-purple-500/10 border-purple-500/20 text-purple-200' : 'bg-purple-50 border-purple-200 text-purple-900'
              }`}>
                <Info size={18} weight="bold" className="shrink-0 text-purple-400 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold block text-xs">
                    {isKo ? '💡 추천 작성 형태 (영어 학습 지침):' : '💡 Recommended Format (English Learning Focus):'}
                  </span>
                  <div className="flex items-center gap-2 flex-wrap">
                    <code className="px-2.5 py-1 rounded-xl bg-purple-500/20 border border-purple-500/30 text-[11px] font-mono font-bold text-purple-300">
                      &quot;Speaking: Practice reading the word umbrella 3 times.&quot;
                    </code>
                  </div>
                  <p className="text-[11px] text-purple-400 leading-normal">
                    {isKo
                      ? '원생들의 영어 학습에 직결되는 안내만 입력 가능하며, 부적절한 단어나 무관한 텍스트는 자동으로 차단됩니다.'
                      : 'Must focus on English practice (speaking, phonics, reading). Inappropriate or non-educational text will be blocked.'}
                  </p>
                </div>
              </div>

              <textarea
                value={curriculumOther}
                onChange={(e) => setCurriculumOther(e.target.value)}
                placeholder={isKo ? '예: Speaking: Practice reading the word umbrella 3 times.' : 'E.g. Speaking: Practice reading the word umbrella 3 times.'}
                className={`w-full h-32 border outline-none text-sm p-4 rounded-2xl transition-all resize-y ${
                  isThemeNight ? 'bg-[#050505] border-white/10 focus:border-purple-500 text-white placeholder:text-zinc-600' : 'bg-zinc-50 border-zinc-300 focus:border-purple-500 text-zinc-900 placeholder:text-zinc-400'
                }`}
              />
            </div>
            </>)}

            {/* MODE 2 ONLY: AI WORKSHEET GENERATION & AUTOGRADED QUESTION FORMAT OPTIONS */}
            {uploadMode === 'worksheet' && (
              <div className={`p-4 sm:p-5 rounded-2xl border space-y-4 text-left transition-all ${
                isThemeNight ? 'bg-orange-500/5 border-orange-500/20' : 'bg-orange-50/70 border-orange-200'
              }`}>
                <div>
                  <label className="text-xs font-bold text-orange-500 uppercase tracking-widest block">
                    ⚙️ {isKo ? '📄 AI 워크시트 자동 생성 & 정밀 채점 옵션' : '📄 AI Worksheet Generation & Autograding Format'}
                  </label>
                  <p className="text-[11px] text-zinc-400 mt-1 leading-normal">
                    {isKo
                      ? '생성할 학습지 유형과 정답 채점 문제 형태를 설정하세요. 이 설정값에 맞춰 워크시트 생성 및 학부모 정답지 잉크가 구성됩니다.'
                      : 'Specify the desired target worksheet format and question styles for AI worksheet generation & automated answer key grading.'}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  {/* Worksheet Type Selector */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                      {isKo ? '생성할 학습지 형태 (Worksheet Format)' : 'Worksheet Format'}
                    </label>
                    <select
                      value={worksheetType}
                      onChange={(e) => setWorksheetType(e.target.value)}
                      className={`w-full p-3 rounded-xl border text-xs font-bold focus:outline-none focus:border-orange-500 cursor-pointer ${
                        isThemeNight ? 'bg-[#050505] border-white/10 text-zinc-200' : 'bg-white border-zinc-300 text-zinc-800'
                      }`}
                    >
                      <option value="daily_homework">📄 {isKo ? '일간 워크시트 (Daily Homework)' : 'Daily Homework'}</option>
                      <option value="weekly_quiz">📝 {isKo ? '주간 단원 평가 (Weekly Quiz)' : 'Weekly Quiz'}</option>
                      <option value="phonics_tracing">✍️ {isKo ? '파닉스/어휘 쓰기 (Phonics & Tracing)' : 'Phonics & Tracing'}</option>
                      <option value="reading_comp">📖 {isKo ? '독해 이해력 문제지 (Reading Comprehension)' : 'Reading Comprehension'}</option>
                    </select>
                  </div>

                  {/* Question Style Selector */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                      {isKo ? '출제 및 채점 문제 스타일 (Question Style)' : 'Question Format'}
                    </label>
                    <select
                      value={questionStyle}
                      onChange={(e) => setQuestionStyle(e.target.value)}
                      className={`w-full p-3 rounded-xl border text-xs font-bold focus:outline-none focus:border-orange-500 cursor-pointer ${
                        isThemeNight ? 'bg-[#050505] border-white/10 text-zinc-200' : 'bg-white border-zinc-300 text-zinc-800'
                      }`}
                    >
                      <option value="multiple_choice">☑️ {isKo ? '4지 선다형 (Multiple Choice)' : 'Multiple Choice'}</option>
                      <option value="fill_in_blanks">✏️ {isKo ? '빈칸 채우기 (Fill-in-the-Blanks)' : 'Fill-in-the-Blanks'}</option>
                      <option value="unscramble">🔤 {isKo ? '문장 배열 (Unscramble Sentences)' : 'Unscramble Sentences'}</option>
                      <option value="vocab_matching">🔗 {isKo ? '어휘 뜻 연결 (Matching Definitions)' : 'Matching Definitions'}</option>
                      <option value="short_answer">📝 {isKo ? '단답형 (Short Answer)' : 'Short Answer'}</option>
                    </select>
                  </div>

                  {/* Explicit AI Worksheet Generation Button */}
                  <div className="pt-3 border-t border-orange-500/20 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <p className="text-[11px] text-zinc-400 font-medium">
                      {isKo ? '선택한 옵션으로 학급 맞춤 오답 복습지 및 정답지 PDF를 생성합니다.' : 'Generates custom review worksheet & answer key PDF based on chosen options.'}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        alert(isKo ? '⚡ AI 맞춤 워크시트(PDF) 작성이 완료되었습니다!' : '⚡ AI Worksheet Generated Successfully!');
                        window.print();
                      }}
                      className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white font-black text-xs rounded-xl shadow-lg shadow-orange-500/20 transition-all active:scale-[0.97] cursor-pointer flex items-center justify-center gap-2 shrink-0"
                    >
                      <Printer size={15} weight="bold" />
                      <span>{isKo ? '⚡ AI 워크시트 생성 & 오답 복습지 인쇄 (PDF)' : '⚡ Generate Printable AI Worksheet (PDF)'}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className={`flex gap-4 justify-end pt-4 border-t ${isThemeNight ? 'border-white/5' : 'border-zinc-200'}`}>
              <button
                type="button"
                onClick={loadCurriculum}
                disabled={isSavingCurriculum}
                className={`px-6 py-3.5 rounded-2xl text-xs font-bold border transition-all active:scale-[0.98] cursor-pointer ${
                  isThemeNight ? 'bg-[#050505] hover:bg-white/5 text-zinc-400 hover:text-white border-white/10' : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border-zinc-300'
                }`}
              >
                {isKo ? '초기화' : 'Reset'}
              </button>

              <button
                type="submit"
                disabled={isSavingCurriculum}
                className="group px-7 py-3.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold text-xs rounded-2xl shadow-xl shadow-orange-500/20 transition-all duration-300 active:scale-[0.97] flex items-center justify-center gap-3"
              >
                {isSavingCurriculum ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>{isKo ? '주간 계획 저장' : 'Save Curriculum'}</span>
                    <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <CheckCircle size={14} weight="bold" />
                    </div>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
