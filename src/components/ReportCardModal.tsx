import React from 'react';
import { X, Printer } from '@phosphor-icons/react';

interface Props {
  isKo: boolean;
  activeRoster: any[];
  selectedStudentDetails: any | null;
  setSelectedStudentDetails: (student: any) => void;
  selectedClass: { name?: string; activeWeekNumber?: number } | null;
  academyLogo: string;
  schoolName?: string | null;
  curriculumTopic: string;
  curriculumPhonics: string;
  curriculumPassage: string;
  curriculumOther: string;
  activeVocabWords: any[];
  onClose: () => void;
}

export const ReportCardModal: React.FC<Props> = ({
  isKo,
  activeRoster,
  selectedStudentDetails,
  setSelectedStudentDetails,
  selectedClass,
  academyLogo,
  schoolName,
  curriculumTopic,
  curriculumPhonics,
  curriculumPassage,
  curriculumOther,
  activeVocabWords,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-[330] flex items-center justify-center p-4">
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          .printable-report-card, .printable-report-card * {
            visibility: visible !important;
          }
          .printable-report-card {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 32px !important;
            background: #ffffff !important;
            color: #000000 !important;
            box-shadow: none !important;
            border: none !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md no-print" onClick={onClose} />
      <div className="relative p-1 bg-white border border-zinc-200 rounded-[2.5rem] shadow-2xl flex flex-col w-full max-w-3xl mx-4 animate-fade-in text-left max-h-[90vh]">
        <div className="printable-report-card relative w-full h-full rounded-[calc(2.5rem-0.25rem)] p-6 sm:p-8 bg-white text-zinc-900 overflow-y-auto custom-scrollbar">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-6 right-6 p-2 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-600 transition-all cursor-pointer no-print"
          >
            <X size={18} weight="bold" />
          </button>

          {/* Student Selector Bar */}
          {activeRoster.length > 0 && (
            <div className="mb-6 p-3 bg-orange-50/50 border border-orange-200 rounded-2xl flex items-center justify-between no-print">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-orange-700">{isKo ? '성적표 대상 원생 선택:' : 'Select Student for Report Card:'}</span>
                <select
                  value={selectedStudentDetails?.uid || ''}
                  onChange={(e) => {
                    const target = activeRoster.find((s) => s.uid === e.target.value);
                    if (target) setSelectedStudentDetails(target);
                  }}
                  className="px-3 py-1.5 bg-white border border-orange-300 rounded-xl text-xs font-bold text-zinc-900 outline-none cursor-pointer shadow-xs"
                >
                  <option value="">-- {isKo ? '원생 선택' : 'Select Student'} --</option>
                  {activeRoster.map((s) => (
                    <option key={s.uid} value={s.uid}>
                      {s.studentName || s.name} ({s.email})
                    </option>
                  ))}
                </select>
              </div>
              <span className="text-[10px] font-mono font-bold text-orange-600">
                Week {selectedClass?.activeWeekNumber || 1} Report Card
              </span>
            </div>
          )}

          {/* Official Academy Header */}
          <div className="border-b-2 border-zinc-900 pb-6 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {academyLogo ? (
                <img src={academyLogo} alt="Logo" className="w-14 h-14 object-contain rounded-xl border border-zinc-200" />
              ) : (
                <div className="w-14 h-14 bg-orange-500/10 border border-orange-500/20 text-orange-500 rounded-2xl flex items-center justify-center font-bold text-2xl shadow-md">
                  🏫
                </div>
              )}
              <div>
                <h2 className="text-xl font-black text-zinc-900 tracking-tight">{schoolName || 'B2B Academy'}</h2>
                <p className="text-xs text-orange-600 font-bold uppercase tracking-widest">
                  {isKo ? '공식 학부모 원생 학습 성장 리포트' : 'OFFICIAL STUDENT PROGRESS REPORT CARD'}
                </p>
              </div>
            </div>

            <div className="text-right text-xs font-mono bg-zinc-50 p-3 rounded-xl border border-zinc-200">
              <p className="font-bold text-zinc-900">Student: {selectedStudentDetails?.studentName || selectedStudentDetails?.name || 'Student'}</p>
              <p className="text-zinc-500">Class: {selectedClass?.name || 'Assigned Class'}</p>
              <p className="text-zinc-500">Date: {new Date().toLocaleDateString()}</p>
            </div>
          </div>

          {/* Weekly Curriculum Summary Section */}
          <div className="mb-6 p-4 border border-zinc-200 rounded-2xl bg-zinc-50/80 text-xs space-y-3">
            <h4 className="font-black text-zinc-900 uppercase tracking-widest text-[11px] flex items-center gap-1.5">
              <span>📚</span>
              <span>{isKo ? '이번 주 학습 커리큘럼 요약' : 'Weekly Curriculum Summary'}</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-zinc-700">
              <div>
                <span className="font-bold text-zinc-900 block">{isKo ? '주간 주제 (Topic):' : 'Topic / Theme:'}</span>
                <p className="text-zinc-600">{curriculumTopic || (isKo ? '미설정' : 'Not Set')}</p>
              </div>
              <div>
                <span className="font-bold text-zinc-900 block">{isKo ? '파닉스 규칙 (Phonics):' : 'Phonics Targets:'}</span>
                <p className="text-indigo-600 font-mono font-bold">{curriculumPhonics || (isKo ? '미설정' : 'Not Set')}</p>
              </div>
              {curriculumPassage && (
                <div className="sm:col-span-2">
                  <span className="font-bold text-zinc-900 block">{isKo ? '본문 지문 (Passage):' : 'Reading Story:'}</span>
                  <p className="text-zinc-700 italic">&quot;{curriculumPassage}&quot;</p>
                </div>
              )}
              {curriculumOther && (
                <div className="sm:col-span-2 pt-1 border-t border-zinc-200">
                  <span className="font-bold text-purple-700 block">{isKo ? '기타 추가 학습 지침 (Other Notes):' : 'Supplementary Notes (Other):'}</span>
                  <p className="text-purple-900 font-medium">{curriculumOther}</p>
                </div>
              )}
            </div>
          </div>

          {/* Growth Stats Overview */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="p-4 bg-orange-50/60 border border-orange-200 rounded-2xl text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-orange-700 block mb-1">
                {isKo ? '주간 숙제 달성률' : 'Homework Completion'}
              </span>
              <span className="text-2xl font-black text-orange-600 font-mono">100%</span>
            </div>
            <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-2xl text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block mb-1">
                {isKo ? '마스터한 타겟 단어' : 'Mastered Vocabulary'}
              </span>
              <span className="text-2xl font-black text-emerald-600 font-mono">{activeVocabWords.length || 7} words</span>
            </div>
            <div className="p-4 bg-purple-50/60 border border-purple-200 rounded-2xl text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 block mb-1">
                {isKo ? '2차 재도전 정답률' : 'Rescan Correction'}
              </span>
              <span className="text-2xl font-black text-purple-600 font-mono">100%</span>
            </div>
          </div>

          {/* Detailed Mistakes & Corrections Log */}
          <div className="space-y-4">
            <h4 className="text-xs font-black text-zinc-800 uppercase tracking-widest">
              {isKo ? '주간 학습 도전 과제 & 오답 수정 기록' : 'Weekly Error & Correction History'}
            </h4>

            {selectedStudentDetails?.weeklyMistakes && selectedStudentDetails.weeklyMistakes.length > 0 ? (
              <div className="space-y-3">
                {selectedStudentDetails.weeklyMistakes.map((m: any, idx: number) => (
                  <div key={idx} className="p-4 border border-zinc-200 rounded-xl bg-zinc-50 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-zinc-900 font-mono">Target: {m.question_text}</p>
                      <p className="text-emerald-600 font-mono">Correct Answer: {m.correct_answer}</p>
                    </div>
                    <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 font-bold rounded-lg text-[10px]">
                      ⚡ {isKo ? '2차 재도전 수정 완료' : 'Fixed on Rescan'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-600 text-center">
                {isKo ? '이번 주 모든 학습 항목을 첫 시도에 완벽히 마스터했습니다!' : 'Mastered all weekly items on the first attempt with 0 errors!'}
              </div>
            )}
          </div>

          {/* Teacher Evaluation & Signature */}
          <div className="mt-6 p-4 border border-zinc-200 rounded-2xl bg-zinc-50">
            <h4 className="text-xs font-black text-zinc-800 uppercase tracking-widest mb-1">
              {isKo ? '담임 교사 총평 (Teacher Evaluation)' : 'Teacher Evaluation & Comments'}
            </h4>
            <p className="text-xs text-zinc-700 italic">
              {isKo
                ? `${selectedStudentDetails?.studentName || '원생'}은(는) 이번 주 타겟 파닉스 규칙과 단어를 매우 훌륭하게 수행하였습니다. 가정에서의 지속적인 칭찬과 관심 부탁드립니다.`
                : `${selectedStudentDetails?.studentName || 'Student'} demonstrated excellent focus on target vocabulary and phonics rules this week. Great enthusiasm during home practice!`}
            </p>
            <div className="mt-4 pt-3 border-t border-zinc-200 flex justify-between items-center text-xs text-zinc-500 font-mono">
              <span>Teacher Signature: ______________________</span>
              <span>Academy Stamp: [ SEAL ]</span>
            </div>
          </div>


          {/* Print Action Bar */}
          <div className="mt-6 pt-4 border-t border-zinc-200 flex justify-between items-center">
            <p className="text-[10px] text-zinc-500 font-mono">
              {isKo ? 'Chekki AI B2B Academy Platform 성적표' : 'Official Academy Progress Report'}
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold text-xs rounded-xl border border-zinc-300 transition-all cursor-pointer"
              >
                {isKo ? '닫기' : 'Close'}
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-orange-500/20 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Printer size={16} weight="bold" />
                <span>{isKo ? '성적표 인쇄 / PDF 발급' : 'Print / Export Report PDF'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
