import React from 'react';
import {
  TrendUp,
  Users,
  FileText,
  Plus,
} from '@phosphor-icons/react';
import { NativeTeacherLogForm } from './NativeTeacherLogForm';
import { StatTile } from './ui/StatTile';
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
  completionRate: number;
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
  completionRate,
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
          <FtStatCards
            isNight={isThemeNight}
            isKo={isKo}
            completionRate={completionRate}
            completedHomeworkCount={completedHomeworkCount}
            activeStudentsCount={activeStudentsCount}
          />

          {/* FT previously had no view showing enrolled student names at all
              (only the count on the stat card above) — Director/KT get the
              full StudentDatabaseGrid, but that table's move/remove actions
              are director-level, so FT gets this read-only list instead. */}
          <FtRosterList isNight={isThemeNight} isKo={isKo} roster={roster} />
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

interface FtStatCardsProps {
  isNight: boolean;
  isKo: boolean;
  completionRate: number;
  completedHomeworkCount: number;
  activeStudentsCount: number;
}

/**
 * Extracted so TeacherPage.tsx can render this directly instead of
 * hand-duplicating the stat-card block (previously drifted independently,
 * one variant not even using the double-bezel construction). One source
 * of truth for the FT/KT overview stats going forward.
 */
export const FtStatCards: React.FC<FtStatCardsProps> = ({
  isNight,
  isKo,
  completionRate,
  completedHomeworkCount,
  activeStudentsCount,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <StatTile
        isNight={isNight}
        label={isKo ? '숙제 완료율' : 'Completion Rate'}
        icon={<TrendUp size={14} weight="bold" className="text-orange-500" />}
        badge={{ text: `${completionRate}%`, tone: 'emerald' }}
        ring={{ value: completionRate }}
        value={
          <>
            {completedHomeworkCount}{' '}
            <span className="text-sm font-normal text-zinc-400">
              / {activeStudentsCount} {isKo ? '명 완료' : 'Students'}
            </span>
          </>
        }
      />
      <StatTile
        isNight={isNight}
        label={isKo ? '등록 원생 수' : 'Enrolled Students'}
        icon={<Users size={14} weight="bold" className="text-orange-500" />}
        badge={{ text: isKo ? '활동 원생' : 'ACTIVE ROSTER', tone: 'neutral' }}
        value={
          <>
            {activeStudentsCount} <span className="text-sm font-normal text-zinc-400">{isKo ? '명 등록' : 'Children'}</span>
          </>
        }
        sublabel={isKo ? '가입 승인 완료된 활동 원생 수' : 'Approved active student profiles'}
      />
    </div>
  );
};

interface FtRosterListProps {
  isNight: boolean;
  isKo: boolean;
  roster: { uid: string; name: string; isPending?: boolean }[];
}

/**
 * Read-only student name list for FT — deliberately not StudentDatabaseGrid
 * (that has move/remove actions, which are director-level). This is just
 * "who's in my class", the thing FT had no way to see before.
 */
const FtRosterList: React.FC<FtRosterListProps> = ({ isNight, isKo, roster }) => {
  return (
    <div
      className={`p-1 rounded-[2rem] transition-colors ${
        isNight ? 'bg-white/5 border border-white/10 shadow-2xl' : 'bg-white border border-zinc-200 shadow-md'
      }`}
    >
      <div className={`rounded-[calc(2rem-0.25rem)] p-6 ${isNight ? 'bg-brand-dark' : 'bg-white'}`}>
        <span
          className={`text-[10px] font-bold uppercase tracking-[0.2em] flex items-center gap-1.5 mb-4 ${
            isNight ? 'text-zinc-400' : 'text-zinc-500'
          }`}
        >
          <Users size={14} weight="bold" className="text-orange-500" />
          <span>{isKo ? '학생 명단' : 'Students in Class'}</span>
        </span>
        {roster.length === 0 ? (
          <p className="text-xs text-zinc-400">
            {isKo ? '등록된 학생이 없습니다.' : 'No students enrolled yet.'}
          </p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {roster.map((s) => (
              <li
                key={s.uid}
                className={`px-3 py-1.5 rounded-full text-xs font-bold border ${
                  isNight ? 'bg-white/5 border-white/10 text-zinc-100' : 'bg-zinc-50 border-zinc-200 text-zinc-900'
                }`}
              >
                {s.name}
                {s.isPending && (
                  <span className="ml-1.5 text-orange-400 font-mono text-[10px]">
                    {isKo ? '(가입 대기)' : '(pending)'}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

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
}: {
  isNight: boolean;
  isKo: boolean;
  weekNumber: number;
  topic: string;
  vocabWords: string[];
  troubleWords: TroubleWord[];
}) {
  const missed = troubleWords.filter((w) => w.count > 0);
  if (!topic.trim() && vocabWords.length === 0) return null;
  const muted = isNight ? 'text-zinc-400' : 'text-zinc-500';
  return (
    <section className={`max-w-3xl mx-auto w-full p-5 rounded-3xl border space-y-3 ${isNight ? 'bg-brand-dark border-white/10' : 'bg-white border-zinc-200'}`}>
      <h3 className="text-base font-black break-keep">
        {isKo ? `${weekNumber}주차` : `Week ${weekNumber}`}
        {topic.trim() && <span className={`font-bold ${muted}`}> · {topic.trim()}</span>}
      </h3>
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
