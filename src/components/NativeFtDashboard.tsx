import React from 'react';
import {
  FileText,
  Plus,
} from '@phosphor-icons/react';
import { NativeTeacherLogForm } from './NativeTeacherLogForm';
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
  roster: { uid: string; name: string; isPending?: boolean }[];
  handleFtLogSubmit: (payload: ClassLogPayload) => boolean;
  completedHomeworkCount: number;
  activeStudentsCount: number;
  activeVocabWords: string[];
  sortedTroubleWords: TroubleWord[];
  setActiveTab: (tab: any) => void;
  curriculumTopic: string;
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
 * KT (KtInbox): a self-contained component that TeacherPage
 * mounts and feeds via props, rather than inlining role-specific JSX in the
 * shared file. `activeTab`/`setActiveTab` stay owned by TeacherPage (the
 * sidebar nav lives there) — this component just reads which of its own
 * two views to show.
 */
export const NativeFtDashboard: React.FC<Props> = React.memo(function NativeFtDashboard({
  isNight,
  isKo,
  activeTab,
  user,
  activeClass,
  selectedTextbookName,
  roster,
  handleFtLogSubmit,
  completedHomeworkCount,
  activeStudentsCount,
  activeVocabWords,
  sortedTroubleWords,
  setActiveTab,
  curriculumTopic,
  submittedLogs,
}) {
  const isThemeNight = isNight;
  return (
    <>
      {activeTab === 'overview' && (
        <div className="space-y-8 animate-fade-in">

          <WeekFocusCard
            isNight={isThemeNight}
            isKo={isKo}
            weekNumber={activeClass?.activeWeekNumber || 1}
            topic={curriculumTopic}
            vocabWords={activeVocabWords}
            troubleWords={sortedTroubleWords}
            scannedCount={completedHomeworkCount}
            studentCount={activeStudentsCount}
          />

          {/* 30s Foreign Teacher Mobile Class Log Entry */}
          <div id="interactive" className="mb-8">
            <NativeTeacherLogForm
              isNight={isThemeNight}
              isKo={isKo}
              onSubmitLog={handleFtLogSubmit}
              userProfile={user}
              selectedClassName={activeClass?.name}
              selectedTextbookName={selectedTextbookName}
              selectedLessonTopic={curriculumTopic}
              roster={roster}
              isRealClassSynced={!activeClass?.isDemo}
            />
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="space-y-8 animate-fade-in">
          <div className={`p-1 rounded-[2.5rem] text-left transition-colors ${
            isThemeNight ? 'bg-white/5 border border-white/10 shadow-2xl' : 'bg-white border border-zinc-200 shadow-md'
          }`}>
            <div className={`rounded-[calc(2.5rem-0.25rem)] p-6 sm:p-8 transition-colors ${
              isThemeNight ? 'bg-brand-dark text-white' : 'bg-white text-zinc-900'
            }`}>
              <div className={`flex items-center justify-between flex-wrap gap-3 mb-8 pb-4 border-b ${isThemeNight ? 'border-white/5' : 'border-zinc-200'}`}>
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-500 flex items-center justify-center shrink-0">
                    <FileText size={22} weight="bold" />
                  </div>
                  <div className="min-w-0">
                    <h4 className={`text-xl font-black ${isThemeNight ? 'text-white' : 'text-zinc-900'}`}>
                      {isKo ? '제출한 일지' : 'Submitted logs'}
                    </h4>
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
                  className="px-4 min-h-11 bg-orange-500 hover:bg-orange-600 text-black font-bold text-sm rounded-xl transition-[background-color,transform] active:scale-[0.97] cursor-pointer flex items-center gap-1.5"
                >
                  <Plus size={14} weight="bold" />
                  <span>{isKo ? '새 일지' : 'New log'}</span>
                </button>
              </div>

              {submittedLogs.length === 0 ? (
                <div className={`p-12 rounded-3xl border text-center space-y-4 ${
                  isThemeNight ? 'bg-brand-dark border-white/5 text-zinc-300' : 'bg-zinc-50 border-zinc-200 text-zinc-700'
                }`}>
                  <div className="w-16 h-16 rounded-3xl bg-orange-500/10 border border-orange-500/20 text-orange-500 flex items-center justify-center mx-auto text-2xl shadow-inner">
                    📑
                  </div>
                  <div className="space-y-1.5 max-w-md mx-auto">
                    <h5 className={`text-lg font-black ${isThemeNight ? 'text-white' : 'text-zinc-900'}`}>
                      {isKo ? '아직 제출한 일지가 없습니다' : 'No logs yet'}
                    </h5>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      {isKo
                        ? '일지를 제출하면 여기에서 한국인 선생님의 검토 상태를 확인할 수 있습니다.'
                        : "Submitted logs appear here with their KT review status."}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {submittedLogs.map((log: any, idx: number) => (
                    <div key={log.id || idx} className={`p-5 rounded-2xl border transition-colors ${
                      isThemeNight ? 'bg-brand-dark border-white/10' : 'bg-zinc-50 border-zinc-200'
                    }`}>
                      <div className="flex items-center justify-between gap-3 pb-3 border-b border-white/5">
                        <div className="min-w-0">
                          <p className="font-bold text-sm text-orange-400 truncate">{log.className || (isKo ? '학급' : 'Class')}</p>
                          <p className="text-xs text-zinc-400">{log.date}</p>
                        </div>
                        {log.reviewStatus === 'sent' ? (
                          <span className="shrink-0 whitespace-nowrap px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                            {isKo ? '발송 완료' : 'Sent'}
                          </span>
                        ) : log.reviewStatus === 'discarded' ? (
                          <span className="shrink-0 whitespace-nowrap px-2.5 py-1 rounded-full text-[11px] font-bold bg-white/5 border border-white/10 text-zinc-400">
                            {isKo ? '보내지 않음' : 'Not sent'}
                          </span>
                        ) : (
                          <span className="shrink-0 whitespace-nowrap px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/10 border border-amber-500/30 text-amber-400">
                            {isKo ? '검토 대기' : 'In review'}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-zinc-300 pt-3 leading-relaxed">
                        {log.generalComments || log.lessonTopic}
                      </p>
                      {log.reviewStatus === 'sent' && log.reviewedByName && (
                        <p className="text-[10px] text-zinc-400 pt-2 mt-2 border-t border-white/5">
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
});

// This week at a glance, above the log form: the topic, and which target
// words the class is getting wrong on scanned homework (the class-level
// mistake view from the core loop) so the teacher can cover them in class.
function WeekFocusCard({
  isNight,
  isKo,
  weekNumber,
  topic,
  vocabWords,
  troubleWords,
  scannedCount,
  studentCount,
}: {
  isNight: boolean;
  isKo: boolean;
  weekNumber: number;
  topic: string;
  vocabWords: string[];
  troubleWords: TroubleWord[];
  scannedCount: number;
  studentCount: number;
}) {
  const missed = troubleWords.filter((w) => w.count > 0);
  if (!topic.trim() && vocabWords.length === 0 && studentCount === 0) return null;
  const muted = isNight ? 'text-zinc-400' : 'text-zinc-500';
  return (
    <section className={`max-w-3xl mx-auto w-full p-5 rounded-3xl border space-y-3 ${isNight ? 'bg-brand-dark border-white/10' : 'bg-white border-zinc-200'}`}>
      <h3 className="text-base font-black break-keep">
        {isKo ? `${weekNumber}주차` : `Week ${weekNumber}`}
        {topic.trim() && <span className={`font-bold ${muted}`}> · {topic.trim()}</span>}
      </h3>
      {studentCount > 0 && (
        <p className={`text-sm ${muted}`}>
          {isKo
            ? `숙제 스캔: ${studentCount}명 중 ${scannedCount}명 완료`
            : `Homework scanned this week: ${scannedCount} of ${studentCount}`}
        </p>
      )}
      {vocabWords.length > 0 && (
        <div className="space-y-2">
          <p className={`text-sm ${muted}`}>
            {missed.length > 0
              ? isKo ? '숙제에서 많이 틀린 단어 — 수업 시작할 때 복습해 보세요.' : 'Most-missed words on homework. Worth a quick review at the start of class.'
              : isKo ? '이번 주 단어 — 아직 채점된 오답이 없습니다.' : "This week's words. No homework mistakes scanned yet."}
          </p>
          <ul className="flex flex-wrap gap-1.5">
            {(missed.length > 0 ? missed : vocabWords.map((word) => ({ word, count: 0 }))).map(({ word, count }) => (
              <li
                key={word}
                className={`px-2.5 py-1 rounded-full text-sm font-bold ${
                  count > 0
                    ? isNight ? 'bg-red-500/15 text-red-300' : 'bg-red-50 text-red-700'
                    : isNight ? 'bg-white/5 text-zinc-300' : 'bg-zinc-100 text-zinc-700'
                }`}
              >
                {word}
                {count > 0 && <span className="ml-1.5 tabular-nums font-black">{count}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
