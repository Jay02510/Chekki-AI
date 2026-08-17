import React from 'react';
import {
  TrendUp,
  Users,
  Lightbulb,
  Sparkle,
  Notebook,
  BookOpen,
  FileText,
  Warning,
  Check,
} from '@phosphor-icons/react';
import { NativeTeacherLogForm } from './NativeTeacherLogForm';
import { InsightsChatPanel } from './InsightsChatPanel';
import { ClassLogPayload } from '../services/aiGenerator';

interface TroubleWord {
  word: string;
  count: number;
}

interface Props {
  isNight: boolean;
  isKo: boolean;
  activeTab: string;
  user: any;
  activeClass: any;
  selectedTextbookName: string;
  roster: string[];
  handleFtLogSubmit: (payload: ClassLogPayload) => void | Promise<void>;
  isSubmittingFtLog: boolean;
  completionRate: number;
  completedHomeworkCount: number;
  activeStudentsCount: number;
  curriculumSlideIndex: number;
  setCurriculumSlideIndex: React.Dispatch<React.SetStateAction<number>>;
  activeVocabWords: string[];
  hasVocabData: boolean;
  isLoadingRoster: boolean;
  sortedTroubleWords: TroubleWord[];
  setActiveTab: (tab: any) => void;
  curriculumTopic: string;
  curriculumPhonics: string;
  curriculumPassage: string;
  curriculumOther: string;
  submittedLogs: any[];
}

/**
 * FT (Foreign Teacher)'s Overview and History tabs, carved out of
 * TeacherPage.tsx (audit §6/§7/§10/§17f) — this used to be ~650 lines
 * inline in the 5,600-line shared render function, the exact block the
 * audit flagged as "nearly the entire app crammed into one scroll" (log
 * form + duplicate worksheet scanner + stat cards + 5-slide carousel all
 * visible before the teacher has done anything).
 *
 * The FT Homework tab is NOT here yet — it shares a curriculum-editing form
 * with Director's Syllabus tab in TeacherPage.tsx, so extracting it cleanly
 * needs that shared form pulled into its own component first. That's a
 * follow-up, not a gap in this pass.
 *
 * Mirrors the pattern already used for Director (NativeDirectorPortal) and
 * KT (NativeKtDashboard): a self-contained component that TeacherPage
 * mounts and feeds via props, rather than inlining role-specific JSX in the
 * shared file. `activeTab`/`setActiveTab` stay owned by TeacherPage (the
 * sidebar nav lives there) — this component just reads which of its own
 * two views to show.
 */
export const NativeFtDashboard: React.FC<Props> = ({
  isNight,
  isKo,
  activeTab,
  user,
  activeClass,
  selectedTextbookName,
  roster,
  handleFtLogSubmit,
  isSubmittingFtLog,
  completionRate,
  completedHomeworkCount,
  activeStudentsCount,
  curriculumSlideIndex,
  setCurriculumSlideIndex,
  activeVocabWords,
  hasVocabData,
  isLoadingRoster,
  sortedTroubleWords,
  setActiveTab,
  curriculumTopic,
  curriculumPhonics,
  curriculumPassage,
  curriculumOther,
  submittedLogs,
}) => {
  const isThemeNight = isNight;
  return (
    <>
      {activeTab === 'overview' && (
        <div className="space-y-8 animate-fade-in">

          {/* 30s Foreign Teacher Mobile Class Log Entry */}
          <div id="interactive" className="mb-8">
            <NativeTeacherLogForm
              isNight={isThemeNight}
              onSubmitLog={handleFtLogSubmit}
              isSubmitting={isSubmittingFtLog}
              userProfile={user}
              selectedClassName={activeClass?.name}
              selectedTextbookName={selectedTextbookName}
              selectedLessonTopic={curriculumTopic}
              roster={roster}
            />
          </div>
          {/* NOTE: Duplicate worksheet scanner that previously lived here was
              removed (Audit §7). It is now exclusively on the Homework tab.
              The 5-slide curriculum carousel and AI tip panel that used to
              sit below the stats also moved out, to their own Insights tab
              (Audit: FT overview still not simple) — a teacher checking in
              before class shouldn't have to scroll past carousel slides to
              reach the thing they actually came to do: log today's class.
              Overview is now just the log form + the two stats teachers
              actually check daily. The "Active Class" stat card was dropped
              entirely rather than relocated — the sidebar/header already
              shows the active class name, so it was pure duplication. */}

          {/* Top Double-Bezel Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Stat Card 2 */}
              <div className={`p-1 rounded-[2rem] text-left transition-colors ${
                isThemeNight ? 'bg-white/5 border border-white/10 shadow-2xl' : 'bg-white border border-zinc-200 shadow-md'
              }`}>
                <div className={`rounded-[calc(2rem-0.25rem)] p-6 flex flex-col justify-between h-full transition-colors ${
                  isThemeNight ? 'bg-[#0a0a0c]' : 'bg-white'
                }`}>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-bold text-orange-500 uppercase tracking-[0.2em] flex items-center gap-1.5">
                      <TrendUp size={14} weight="bold" />
                      <span>{isKo ? '숙제 완료율' : 'Completion Rate'}</span>
                    </span>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 font-mono">
                      {completionRate}%
                    </span>
                  </div>
                  <div>
                    <h4 className={`text-2xl font-black tracking-tight ${isThemeNight ? 'text-white' : 'text-zinc-900'}`}>
                      {completedHomeworkCount} <span className="text-sm font-normal text-zinc-500">/ {activeStudentsCount} {isKo ? '명 완료' : 'Students'}</span>
                    </h4>
                    <div className={`w-full h-2 rounded-full mt-4 overflow-hidden p-0.5 border ${
                      isThemeNight ? 'bg-[#050505] border-white/5' : 'bg-zinc-100 border-zinc-200'
                    }`}>
                      <div
                        className="bg-gradient-to-r from-orange-500 via-amber-500 to-emerald-400 h-full rounded-full transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]"
                        style={{ width: `${completionRate}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Stat Card 3 */}
              <div className={`p-1 rounded-[2rem] text-left transition-colors ${
                isThemeNight ? 'bg-white/5 border border-white/10 shadow-2xl' : 'bg-white border border-zinc-200 shadow-md'
              }`}>
                <div className={`rounded-[calc(2rem-0.25rem)] p-6 flex flex-col justify-between h-full transition-colors ${
                  isThemeNight ? 'bg-[#0a0a0c]' : 'bg-white'
                }`}>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] flex items-center gap-1.5">
                      <Users size={14} weight="bold" className="text-purple-500" />
                      <span>{isKo ? '등록 원생 수' : 'Enrolled Students'}</span>
                    </span>
                    <span className="px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider bg-purple-500/10 border border-purple-500/20 text-purple-500 font-mono">
                      Active Roster
                    </span>
                  </div>
                  <div>
                    <h4 className={`text-2xl font-black tracking-tight ${isThemeNight ? 'text-white' : 'text-zinc-900'}`}>
                      {activeStudentsCount} <span className="text-sm font-normal text-zinc-500">{isKo ? '명 등록' : 'Children'}</span>
                    </h4>
                    <p className="text-xs text-zinc-500 mt-1">
                      {isKo ? '가입 승인 완료된 활동 원생 수' : 'Approved active student profiles'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
        </div>
      )}

      {/* Weekly curriculum carousel + AI tip panel, moved out of Overview
          (see NOTE above) so the daily-log screen stays a quick glance
          instead of a 5-slide scroll. Reachable any time via its own tab. */}
      {activeTab === 'insights' && (
        <div className="space-y-8 animate-fade-in">
            {/* Main Overview Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Left/Middle Column: Weekly Focus & Curriculum Targets (Slide Switcher) */}
              <div className={`lg:col-span-2 p-1 rounded-[2.5rem] text-left transition-colors ${
                isThemeNight ? 'bg-white/5 border border-white/10 shadow-2xl' : 'bg-white border border-zinc-200 shadow-md'
              }`}>
                <div className={`rounded-[calc(2.5rem-0.25rem)] p-6 sm:p-8 flex flex-col justify-between h-full text-left transition-colors ${
                  isThemeNight ? 'bg-[#0a0a0c]' : 'bg-white'
                }`}>
                  <div>
                    {/* Header: Title + Slide Nav Controls */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-500 flex items-center justify-center font-bold">
                          {curriculumSlideIndex === 0 && <Lightbulb size={20} weight="bold" />}
                          {curriculumSlideIndex === 1 && <Sparkle size={20} weight="bold" />}
                          {curriculumSlideIndex === 2 && <Notebook size={20} weight="bold" />}
                          {curriculumSlideIndex === 3 && <BookOpen size={20} weight="bold" />}
                          {curriculumSlideIndex === 4 && <FileText size={20} weight="bold" />}
                        </div>
                        <div>
                          <h4 className={`text-lg font-black ${isThemeNight ? 'text-white' : 'text-zinc-900'}`}>
                            {isKo ? '주간 AI 커리큘럼 & 오답 분석' : 'Weekly AI Curriculum & Insights'}
                          </h4>
                          <p className="text-[11px] text-zinc-400 font-medium">
                            {isKo ? 'AI가 추출한 이번 주 학습 목표와 오답 현황' : 'AI-extracted weekly learning targets & student statistics'}
                          </p>
                        </div>
                      </div>

                      {/* Slide Prev/Next Controls */}
                      <div className="flex items-center gap-2 self-start sm:self-auto">
                        <span className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-full border ${
                          isThemeNight ? 'bg-white/5 border-white/10 text-zinc-400' : 'bg-zinc-100 border-zinc-200 text-zinc-600'
                        }`}>
                          {curriculumSlideIndex + 1} / 5
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setCurriculumSlideIndex((prev) => (prev === 0 ? 4 : prev - 1))}
                            aria-label="Previous slide"
                            className={`w-11 h-11 rounded-xl border flex items-center justify-center text-xs font-bold transition-all cursor-pointer active:scale-95 ${
                              isThemeNight ? 'bg-white/5 border-white/10 text-white hover:bg-white/10' : 'bg-zinc-100 border-zinc-300 text-zinc-800 hover:bg-zinc-200'
                            }`}
                            title="Previous Slide"
                          >
                            ◀
                          </button>
                          <button
                            type="button"
                            onClick={() => setCurriculumSlideIndex((prev) => (prev === 4 ? 0 : prev + 1))}
                            aria-label="Next slide"
                            className={`w-11 h-11 rounded-xl border flex items-center justify-center text-xs font-bold transition-all cursor-pointer active:scale-95 ${
                              isThemeNight ? 'bg-white/5 border-white/10 text-white hover:bg-white/10' : 'bg-zinc-100 border-zinc-300 text-zinc-800 hover:bg-zinc-200'
                            }`}
                            title="Next Slide"
                          >
                            ▶
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Slide Pill Tabs Bar */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-6 custom-scrollbar">
                      {[
                        { id: 0, labelEn: 'Words', labelKo: '복습 단어', icon: '🔤' },
                        { id: 1, labelEn: 'Week Theme', labelKo: '주간 테마', icon: '🎯' },
                        { id: 2, labelEn: 'Phonics', labelKo: '파닉스 규칙', icon: '🔊' },
                        { id: 3, labelEn: 'Reading Passage', labelKo: '본문 지문', icon: '📖' },
                        { id: 4, labelEn: 'Other Notes', labelKo: '기타 참고', icon: '📝' },
                      ].map((slide) => (
                        <button
                          key={slide.id}
                          type="button"
                          onClick={() => setCurriculumSlideIndex(slide.id)}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                            curriculumSlideIndex === slide.id
                              ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                              : isThemeNight
                                ? 'bg-white/5 hover:bg-white/10 text-zinc-400 border border-white/5'
                                : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-600 border border-zinc-200'
                          }`}
                        >
                          <span>{slide.icon}</span>
                          <span>{isKo ? slide.labelKo : slide.labelEn}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* SLIDE 0: Key Vocabulary & Error Analytics */}
                  {curriculumSlideIndex === 0 && (
                    <div className="animate-fade-in">
                      {activeVocabWords.length === 0 ? (
                        <div className={`py-12 px-6 rounded-2xl border flex flex-col items-center justify-center text-center ${
                          isThemeNight ? 'bg-[#050505] border-white/5' : 'bg-zinc-50 border-zinc-200'
                        }`}>
                          <div className="w-14 h-14 mb-4 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-500 flex items-center justify-center">
                            <Notebook size={28} weight="bold" />
                          </div>
                          <h5 className={`text-sm font-bold mb-1 ${isThemeNight ? 'text-white' : 'text-zinc-900'}`}>
                            {isKo ? '등록된 이번 주 학습 단어가 없습니다.' : 'No vocabulary words configured for this week.'}
                          </h5>
                          <p className="text-xs text-zinc-500 max-w-xs mb-6">
                            {isKo ? '주간 학습 커리큘럼 탭에서 이번 주 단어를 등록해 주세요.' : 'Go to the Curriculum tab to add target vocabulary words.'}
                          </p>
                          <button
                            onClick={() => setActiveTab('curriculum')}
                            className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-orange-500/10 transition-all active:scale-[0.97] cursor-pointer"
                          >
                            + {isKo ? '단어 등록하러 가기' : 'Add Weekly Words'}
                          </button>
                        </div>
                      ) : isLoadingRoster ? (
                        <div className="space-y-3">
                          {[0, 1, 2].map((i) => (
                            <div key={i} className={`flex items-center justify-between p-4 border rounded-2xl ${
                              isThemeNight ? 'bg-[#050505] border-white/5' : 'bg-zinc-50 border-zinc-200'
                            }`}>
                              <div className="h-4 w-24 rounded bg-white/10 animate-pulse" />
                              <div className="h-6 w-20 rounded-full bg-white/10 animate-pulse" />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1 custom-scrollbar">
                          {sortedTroubleWords.map(({ word, count }) => (
                            <div key={word} className={`flex items-center justify-between p-4 border rounded-2xl transition-all ${
                              isThemeNight ? 'bg-[#050505] border-white/5 hover:border-white/10' : 'bg-zinc-50 border-zinc-200 hover:border-zinc-300'
                            }`}>
                              <span className={`text-sm font-bold font-mono tracking-wide ${isThemeNight ? 'text-white' : 'text-zinc-900'}`}>{word}</span>
                              <div className="flex items-center gap-3">
                                {count > 0 ? (
                                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-500/10 border border-red-500/20 text-red-500 flex items-center gap-1.5">
                                    <Warning size={14} weight="bold" />
                                    <span>{count} {isKo ? '명 틀림' : 'Mistakes'}</span>
                                  </span>
                                ) : (
                                  <button onClick={() => setActiveTab('curriculum')} className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center gap-1.5">
                                    <Check size={14} weight="bold" />
                                    <span>{isKo ? '오답 없음' : 'Clear'}</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* SLIDE 1: Week Theme / Topic */}
                  {curriculumSlideIndex === 1 && (
                    <div className="animate-fade-in">
                      {curriculumTopic.trim() ? (
                        <div className={`p-6 rounded-2xl border text-left flex flex-col justify-between min-h-[220px] ${
                          isThemeNight ? 'bg-[#050505] border-white/10' : 'bg-orange-50/40 border-orange-200/60'
                        }`}>
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-[10px] uppercase font-bold tracking-widest text-orange-500 font-mono">
                                {isKo ? 'Week ' + (activeClass?.activeWeekNumber || 1) + ' 대주제' : 'Week ' + (activeClass?.activeWeekNumber || 1) + ' Target Topic'}
                              </span>
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-500/10 text-orange-500 border border-orange-500/20">
                                🎯 {isKo ? '주간 학습 테마' : 'Active Unit'}
                              </span>
                            </div>
                            <h3 className={`text-2xl font-black mb-2 ${isThemeNight ? 'text-white' : 'text-zinc-900'}`}>
                              {curriculumTopic}
                            </h3>
                            <p className="text-xs text-zinc-400 leading-relaxed">
                              {isKo
                                ? '이번 주 교재에서 집중적으로 다루는 핵심 주제입니다. 수업 시간 및 가정 학습 시 스토리텔링 가이드로 활용할 수 있습니다.'
                                : 'The primary contextual theme extracted for this week. Use as a storytelling framework during instruction.'}
                            </p>
                          </div>
                          <div className="pt-4 border-t border-white/5 flex items-center justify-between text-[11px] text-zinc-500">
                            <span>{isKo ? '설정 상태: 정상 반영됨' : 'Status: Ready for class'}</span>
                            <button
                              type="button"
                              onClick={() => setActiveTab('curriculum')}
                              className="text-orange-500 hover:underline font-bold cursor-pointer"
                            >
                              {isKo ? '주제 수정하기 →' : 'Edit Theme →'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className={`p-8 rounded-2xl border text-center flex flex-col items-center justify-center min-h-[220px] ${
                          isThemeNight ? 'bg-[#050505] border-white/5' : 'bg-zinc-50 border-zinc-200'
                        }`}>
                          <div className="w-12 h-12 mb-3 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-500 flex items-center justify-center">
                            <Sparkle size={24} weight="bold" />
                          </div>
                          <h5 className={`text-xs font-bold mb-1 ${isThemeNight ? 'text-white' : 'text-zinc-900'}`}>
                            {isKo ? '등록된 이번 주 학습 주제가 없습니다' : 'No target topic set for this week'}
                          </h5>
                          <p className="text-[11px] text-zinc-500 max-w-xs mb-4">
                            {isKo ? '주간 학습 커리큘럼 탭에서 이번 주 주제를 추가해 주세요.' : 'Add target topic in the Manage Curriculum tab.'}
                          </p>
                          <button
                            type="button"
                            onClick={() => setActiveTab('curriculum')}
                            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-[0.97] cursor-pointer"
                          >
                            + {isKo ? '주제 등록하기' : 'Add Topic'}
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* SLIDE 2: Phonics Rules */}
                  {curriculumSlideIndex === 2 && (
                    <div className="animate-fade-in">
                      {curriculumPhonics.trim() ? (
                        <div className={`p-6 rounded-2xl border text-left min-h-[220px] flex flex-col justify-between ${
                          isThemeNight ? 'bg-[#050505] border-white/10' : 'bg-indigo-50/40 border-indigo-200/60'
                        }`}>
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-400 font-mono">
                                {isKo ? '타겟 음가 & 조합 규칙' : 'Phonics Sound Blends'}
                              </span>
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                                🔊 {isKo ? '발음 드릴' : 'Phonics Target'}
                              </span>
                            </div>
                            <h4 className={`text-base font-bold mb-4 ${isThemeNight ? 'text-zinc-200' : 'text-zinc-800'}`}>
                              {isKo ? '이번 주 집중 연습 파닉스 규칙:' : 'Focus Phonics & Letter Sounds:'}
                            </h4>
                            <div className="flex flex-wrap gap-2 mb-4">
                              {curriculumPhonics.split(/[,\n]/).map((rule, idx) => (
                                <span
                                  key={idx}
                                  className="px-4 py-2 bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 font-mono font-bold text-sm rounded-xl"
                                >
                                  {rule.trim()}
                                </span>
                              ))}
                            </div>
                          </div>
                          <p className="text-xs text-zinc-400 leading-relaxed border-t border-white/5 pt-3">
                            {isKo
                              ? '단어 읽기 및 소리내어 쓰기 연습 시 학생들이 이중모음 및 소리 결합을 파악할 수 있도록 훈련합니다.'
                              : 'Target letter patterns to emphasize during vocal repetition and spelling exercises.'}
                          </p>
                        </div>
                      ) : (
                        <div className={`p-8 rounded-2xl border text-center flex flex-col items-center justify-center min-h-[220px] ${
                          isThemeNight ? 'bg-[#050505] border-white/5' : 'bg-zinc-50 border-zinc-200'
                        }`}>
                          <div className="w-12 h-12 mb-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                            <Notebook size={24} weight="bold" />
                          </div>
                          <h5 className={`text-xs font-bold mb-1 ${isThemeNight ? 'text-white' : 'text-zinc-900'}`}>
                            {isKo ? '등록된 파닉스 규칙이 없습니다' : 'No phonics rules set for this week'}
                          </h5>
                          <p className="text-[11px] text-zinc-500 max-w-xs mb-4">
                            {isKo ? '주간 학습 커리큘럼 탭에서 발음 드릴 규칙을 추가해 주세요.' : 'Add target letter sounds and phonics rules in the Curriculum tab.'}
                          </p>
                          <button
                            type="button"
                            onClick={() => setActiveTab('syllabus')}
                            className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-[0.97] cursor-pointer"
                          >
                            + {isKo ? '파닉스 규칙 추가' : 'Add Phonics Rules'}
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* SLIDE 3: Reading Passage */}
                  {curriculumSlideIndex === 3 && (
                    <div className="animate-fade-in">
                      {curriculumPassage.trim() ? (
                        <div className={`p-6 rounded-2xl border text-left min-h-[220px] flex flex-col justify-between ${
                          isThemeNight ? 'bg-[#050505] border-white/10' : 'bg-emerald-50/40 border-emerald-200/60'
                        }`}>
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-500 font-mono">
                                {isKo ? '본문 읽기 지문' : 'Target Reading Passage'}
                              </span>
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                📖 {isKo ? '독해 지문' : 'Reading Text'}
                              </span>
                            </div>
                            <div className={`p-4 rounded-xl border italic font-serif text-sm leading-relaxed ${
                              isThemeNight ? 'bg-white/5 border-white/10 text-zinc-200' : 'bg-white border-emerald-200 text-zinc-800'
                            }`}>
                              &quot;{curriculumPassage}&quot;
                            </div>
                          </div>
                          <p className="text-[11px] text-zinc-400 mt-3">
                            {isKo ? '교재 본문 문장 기반 리딩 연습 지문입니다.' : 'Passage for reading comprehension practice and homework verification.'}
                          </p>
                        </div>
                      ) : (
                        <div className={`p-8 rounded-2xl border text-center flex flex-col items-center justify-center min-h-[220px] ${
                          isThemeNight ? 'bg-[#050505] border-white/5' : 'bg-zinc-50 border-zinc-200'
                        }`}>
                          <div className="w-12 h-12 mb-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                            <BookOpen size={24} weight="bold" />
                          </div>
                          <h5 className={`text-xs font-bold mb-1 ${isThemeNight ? 'text-white' : 'text-zinc-900'}`}>
                            {isKo ? '등록된 본문 지문이 없습니다' : 'No reading passage set for this week'}
                          </h5>
                          <p className="text-[11px] text-zinc-500 max-w-xs mb-4">
                            {isKo ? '주간 학습 커리큘럼 탭에서 독해 지문을 작성해 주세요.' : 'Add textbook passage sentences in the Curriculum tab.'}
                          </p>
                          <button
                            type="button"
                            onClick={() => setActiveTab('curriculum')}
                            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-[0.97] cursor-pointer"
                          >
                            + {isKo ? '지문 등록하기' : 'Add Reading Passage'}
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* SLIDE 4: Other Supplementary Notes */}
                  {curriculumSlideIndex === 4 && (
                    <div className="animate-fade-in">
                      {curriculumOther.trim() ? (
                        <div className={`p-6 rounded-2xl border text-left min-h-[220px] flex flex-col justify-between ${
                          isThemeNight ? 'bg-[#050505] border-white/10' : 'bg-purple-50/40 border-purple-200/60'
                        }`}>
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-[10px] uppercase font-bold tracking-widest text-purple-400 font-mono">
                                {isKo ? '기타 학습 참고 사항 (Other)' : 'Supplementary Notes (Other)'}
                              </span>
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                                📝 {isKo ? '추가 지침' : 'Custom Field'}
                              </span>
                            </div>
                            <div className={`p-4 rounded-xl border text-xs leading-relaxed ${
                              isThemeNight ? 'bg-white/5 border-white/10 text-zinc-200' : 'bg-white border-purple-200 text-zinc-800'
                            }`}>
                              {curriculumOther}
                            </div>
                          </div>
                          <div className="pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-zinc-500">
                            <span>{isKo ? '교사 추가 커스텀 필드' : 'Custom teacher notes field'}</span>
                            <button
                              type="button"
                              onClick={() => setActiveTab('curriculum')}
                              className="text-purple-400 hover:underline font-bold cursor-pointer"
                            >
                              {isKo ? '내용 편집하기 →' : 'Edit Other Field →'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className={`p-8 rounded-2xl border text-center flex flex-col items-center justify-center min-h-[220px] ${
                          isThemeNight ? 'bg-[#050505] border-white/5' : 'bg-zinc-50 border-zinc-200'
                        }`}>
                          <div className="w-12 h-12 mb-3 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
                            <FileText size={24} weight="bold" />
                          </div>
                          <h5 className={`text-xs font-bold mb-1 ${isThemeNight ? 'text-white' : 'text-zinc-900'}`}>
                            {isKo ? '등록된 기타 참고 사항이 없습니다' : 'No supplementary notes set for this week'}
                          </h5>
                          <p className="text-[11px] text-zinc-500 max-w-xs mb-4">
                            {isKo ? '주간 학습 커리큘럼 탭에서 문법 노트를 추가해 주세요.' : 'Add grammar points or homework guidelines in the Curriculum tab.'}
                          </p>
                          <button
                            type="button"
                            onClick={() => setActiveTab('curriculum')}
                            className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-[0.97] cursor-pointer"
                          >
                            + {isKo ? '참고 사항 추가' : 'Add Notes'}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: AI Tutor Pedagogical Review Tip & Report Generator Action */}
              <div className={`p-1 rounded-[2.5rem] text-left transition-colors ${
                isThemeNight ? 'bg-white/5 border border-white/10 shadow-2xl' : 'bg-white border border-zinc-200 shadow-md'
              }`}>
                <div className={`rounded-[calc(2.5rem-0.25rem)] p-6 sm:p-8 flex flex-col justify-between h-full text-left relative overflow-hidden transition-colors ${
                  isThemeNight ? 'bg-[#0a0a0c]' : 'bg-white'
                }`}>
                  <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-amber-500/10 to-transparent blur-3xl pointer-events-none" />
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center">
                        <BookOpen size={20} weight="bold" />
                      </div>
                      <h4 className={`text-lg font-black ${isThemeNight ? 'text-white' : 'text-zinc-900'}`}>
                        {isKo ? '교사 복습 가이드' : 'Weekly Review Tips'}
                      </h4>
                    </div>
                    <p className="text-xs text-zinc-400 mb-6 leading-relaxed">
                      {isKo
                        ? '오답 통계 기반 맞춤 복습 가이드입니다. 학부모 리포트는 KT가 검토 후 발송합니다.'
                        : "Rule-based review guide from this week's scanned mistakes. Parent reports are sent by your KT after review."}
                    </p>

                    <div className="space-y-4 text-xs leading-relaxed text-zinc-300 font-medium">
                      {!hasVocabData ? (
                        <div className={`p-6 rounded-2xl border text-center text-xs text-zinc-500 flex flex-col items-center gap-2 ${
                          isThemeNight ? 'bg-[#050505] border-white/5' : 'bg-zinc-50 border-zinc-200'
                        }`}>
                          <BookOpen size={24} weight="bold" />
                          <span>{isKo ? '이번 주 등록된 어휘가 없습니다. 커리큘럼 탭에서 단어를 추가해 주세요.' : 'No vocabulary words set for this week yet — add some on the Curriculum tab to get tips here.'}</span>
                        </div>
                      ) : sortedTroubleWords.some(w => w.count > 0) ? (
                        <>
                          <p className={`font-semibold ${isThemeNight ? 'text-zinc-200' : 'text-zinc-800'}`}>
                            {isKo
                              ? `이번 주 가장 많이 틀린 단어는 "${sortedTroubleWords[0].word}" 입니다.`
                              : `Students struggled most with the word "${sortedTroubleWords[0].word}" this week.`}
                          </p>
                          <div className={`p-4 border rounded-2xl leading-relaxed ${
                            isThemeNight ? 'bg-orange-500/10 border-orange-500/20 text-orange-300' : 'bg-orange-50 border-orange-200 text-orange-800'
                          }`}>
                            💡 {isKo
                              ? '수업 시작 시 해당 단어들의 파닉스 모음 결합을 소리내어 복습하는 파닉스 드릴을 추천합니다.'
                              : 'Recommendation: Dedicate the first 5 minutes of class to spelling tracing and a vocal blend drill.'}
                          </div>
                        </>
                      ) : (
                        <div className={`p-6 rounded-2xl border text-center text-xs text-emerald-500 flex flex-col items-center gap-2 ${
                          isThemeNight ? 'bg-[#050505] border-white/5' : 'bg-emerald-50/50 border-emerald-200'
                        }`}>
                          <Sparkle size={24} weight="bold" />
                          <span>{isKo ? '아직 채점된 오답이 없습니다 (또는 모든 아이들이 완벽히 소화했습니다!)' : 'No mistakes scanned against this week\'s words yet — or everyone nailed it!'}</span>
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              </div>

          </div>

          <InsightsChatPanel
            isNight={isThemeNight}
            isKo={isKo}
            curriculumTopic={curriculumTopic}
            curriculumPhonics={curriculumPhonics}
            curriculumPassage={curriculumPassage}
            curriculumOther={curriculumOther}
            sortedTroubleWords={sortedTroubleWords}
          />
        </div>
      )}

      {activeTab === 'history' && (
        <div className="space-y-8 animate-fade-in">
          <div className={`p-1 rounded-[2.5rem] text-left transition-colors ${
            isThemeNight ? 'bg-white/5 border border-white/10 shadow-2xl' : 'bg-white border border-zinc-200 shadow-md'
          }`}>
            <div className={`rounded-[calc(2.5rem-0.25rem)] p-6 sm:p-8 transition-colors ${
              isThemeNight ? 'bg-[#0a0a0c] text-white' : 'bg-white text-zinc-900'
            }`}>
              <div className={`flex items-center justify-between mb-8 pb-4 border-b ${isThemeNight ? 'border-white/5' : 'border-zinc-200'}`}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-500 flex items-center justify-center">
                    <FileText size={22} weight="bold" />
                  </div>
                  <div>
                    <h4 className={`text-xl font-black ${isThemeNight ? 'text-white' : 'text-zinc-900'}`}>
                      {isKo ? '제출된 원어민 평가 폼 내역' : 'Submitted Teacher Evaluation Forms'}
                    </h4>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      {isKo
                        ? '원어민 강사가 모바일에서 작성한 출석 및 관찰 일지 내역입니다. 학부모 알림톡 대본으로 1초 변환됩니다.'
                        : 'Daily classroom evaluation logs submitted by foreign teachers. Auto-translated into Korean parent scripts.'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('overview');
                    setTimeout(() => {
                      const el = document.getElementById('interactive');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }, 200);
                  }}
                  className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-[0.97] cursor-pointer flex items-center gap-1.5"
                >
                  <Sparkle size={14} weight="bold" />
                  <span>{isKo ? '⚡ 폼 작성 체험하기' : 'Test FT Log Form'}</span>
                </button>
              </div>

              {submittedLogs.length === 0 ? (
                <div className={`p-12 rounded-3xl border text-center space-y-4 ${
                  isThemeNight ? 'bg-[#050505] border-white/5 text-zinc-300' : 'bg-zinc-50 border-zinc-200 text-zinc-700'
                }`}>
                  <div className="w-16 h-16 rounded-3xl bg-orange-500/10 border border-orange-500/20 text-orange-500 flex items-center justify-center mx-auto text-2xl shadow-inner">
                    📑
                  </div>
                  <div className="space-y-1.5 max-w-md mx-auto">
                    <h5 className={`text-lg font-black ${isThemeNight ? 'text-white' : 'text-zinc-900'}`}>
                      {isKo ? '아직 제출된 평가 폼이 없습니다' : 'No Submitted Forms Found'}
                    </h5>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      {isKo
                        ? '원어민 선생님이 30초 모바일 평가 폼을 제출하면 이곳에서 실시간으로 대본을 검수하고 복사할 수 있습니다.'
                        : 'When foreign teachers submit daily 30s evaluation logs, their responses and generated Korean KakaoTalk scripts will appear here.'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {submittedLogs.map((log: any, idx: number) => (
                    <div key={log.id || idx} className={`p-5 rounded-2xl border transition-all ${
                      isThemeNight ? 'bg-[#050505] border-white/10' : 'bg-zinc-50 border-zinc-200'
                    }`}>
                      <div className="flex items-center justify-between pb-3 border-b border-white/5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-orange-400">{log.className || 'Class'}</span>
                          <span className="text-xs text-zinc-500 font-mono">• {log.date}</span>
                        </div>
                        {log.reviewStatus === 'sent' ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                            {isKo ? '학부모 발송 완료' : 'Sent to Parents'}
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 border border-amber-500/30 text-amber-400">
                            {isKo ? 'KT 검토 대기 중' : 'Waiting on KT Review'}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-300 pt-3 leading-relaxed">
                        {log.generalComments || log.lessonTopic}
                      </p>
                      {log.reviewStatus === 'sent' && log.reviewedByName && (
                        <p className="text-[10px] text-zinc-500 pt-2 mt-2 border-t border-white/5">
                          {isKo ? '검토 및 발송: ' : 'Reviewed & sent by '}
                          <span className="font-bold text-zinc-400">{log.reviewedByName}</span>
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
