import React from 'react';
import { CaretRight, Plus } from '@phosphor-icons/react';
import { staffUi } from './staffUi';
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
  roster: { uid: string; name: string; isPending?: boolean; scannedThisWeek?: boolean; weeklyMistakes?: number }[];
  handleFtLogSubmit: (payload: ClassLogPayload) => boolean;
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
            roster={roster}
          />

          {/* 30s Foreign Teacher Mobile Class Log Entry */}
          <div id="interactive" className="mb-8">
            <NativeTeacherLogForm
              isNight={isThemeNight}
              isKo={isKo}
              onSubmitLog={handleFtLogSubmit}
              userProfile={user}
              selectedClassName={activeClass?.name}
              // Fall back to this class's last log so a new device isn't blank.
              selectedTextbookName={selectedTextbookName || submittedLogs.find((l: any) => l.textbook)?.textbook || ''}
              selectedLessonTopic={curriculumTopic}
              roster={roster}
              isRealClassSynced={!activeClass?.isDemo}
            />
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <section className="mx-auto max-w-3xl text-left text-ink">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className={staffUi.h2}>{isKo ? '제출한 일지' : 'Submitted logs'}</h2>
              <p className={staffUi.sub}>{isKo ? '한국인 선생님의 검토 상태를 보여 줘요.' : 'With their Korean teacher review status.'}</p>
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
              className={staffUi.primaryBtn}
            >
              <Plus size={18} weight="bold" aria-hidden="true" />
              {isKo ? '새 일지' : 'New log'}
            </button>
          </div>

          {submittedLogs.length === 0 ? (
            <div className="rounded-lg bg-surface p-10 text-center ring-1 ring-inset ring-rule">
              <p className="text-[16px] font-extrabold">{isKo ? '아직 낸 일지가 없어요' : 'No logs yet'}</p>
              <p className="mt-1 text-[14px] text-ink-3">
                {isKo ? '일지를 내면 여기에서 한국인 선생님의 검토 상태를 볼 수 있어요.' : 'Submitted logs appear here with their KT review status.'}
              </p>
            </div>
          ) : (
            <ul className={staffUi.rows}>
              {submittedLogs.map((log: any, idx: number) => (
                <li key={log.id || idx} className="py-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="min-w-0 truncate text-[15px] font-bold">
                      {log.className || (isKo ? '학급' : 'Class')}
                      <span className="font-normal text-ink-3 tabular-nums"> · {log.date}</span>
                    </p>
                    {log.reviewStatus === 'sent' ? (
                      <span className={staffUi.pill.good}>{isKo ? '발송 완료' : 'Sent'}</span>
                    ) : log.reviewStatus === 'discarded' ? (
                      <span className={staffUi.pill.neutral}>{isKo ? '보내지 않음' : 'Not sent'}</span>
                    ) : (
                      <span className={staffUi.pill.warm}>{isKo ? '검토 대기' : 'In review'}</span>
                    )}
                  </div>
                  <p className="mt-1 text-[15px] leading-relaxed text-ink-2">{log.generalComments || log.lessonTopic}</p>
                  {log.reviewStatus === 'sent' && log.reviewedByName && (
                    <p className="mt-1 text-[13px] text-ink-3">
                      {isKo ? '검토 및 발송: ' : 'Reviewed and sent by '}
                      <span className="font-bold">{log.reviewedByName}</span>
                    </p>
                  )}
                  {log.reviewStatus === 'sent' && log.approvedSummary && <SentReport log={log} isKo={isKo} />}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </>
  );
});

// What parents actually received, so the FT can see how their notes turned
// into a report and what the KT changed — that's how logs get better.
function SentReport({ log, isKo }: { log: any; isKo: boolean }) {
  const edited = !!log.aiKoreanSummary && log.approvedSummary !== log.aiKoreanSummary;
  const notes: { studentName: string; approvedText: string }[] = log.approvedExceptions || [];
  return (
    <details className="group mt-2">
      <summary className="inline-flex min-h-11 cursor-pointer list-none items-center gap-1 text-[14px] font-bold text-line-ink [&::-webkit-details-marker]:hidden">
        <CaretRight size={14} weight="bold" className="transition-transform group-open:rotate-90" aria-hidden="true" />
        {isKo ? '학부모가 받은 리포트 보기' : 'See what parents got'}
      </summary>
      <div className="mt-1 space-y-3 pl-5 text-[14px] leading-relaxed">
        <div>
          <p className="text-[13px] font-bold text-ink-3">
            {isKo ? '반 전체 요약' : 'Class summary (Korean, as sent)'}
            {edited && <span className="ml-2 font-normal">{isKo ? '· 한국인 선생님이 수정함' : '· edited by the KT'}</span>}
          </p>
          <p className="whitespace-pre-line break-keep text-ink">{log.approvedSummary}</p>
        </div>
        {log.aiEnglishSummary && (
          <div>
            <p className="text-[13px] font-bold text-ink-3">
              {edited ? (isKo ? '영어 초안 (수정 전)' : 'English draft (before the KT edited it)') : (isKo ? '영어 버전' : 'English version')}
            </p>
            <p className="text-ink-2">{log.aiEnglishSummary}</p>
          </div>
        )}
        {notes.map((n, i) => (
          <div key={`${n.studentName}-${i}`}>
            <p className="text-[13px] font-bold text-ink-3">{n.studentName}</p>
            <p className="whitespace-pre-line break-keep text-ink">{n.approvedText}</p>
          </div>
        ))}
      </div>
    </details>
  );
}

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
  roster,
}: {
  isNight: boolean;
  isKo: boolean;
  weekNumber: number;
  topic: string;
  vocabWords: string[];
  troubleWords: TroubleWord[];
  roster: Props['roster'];
}) {
  const missed = troubleWords.filter((w) => w.count > 0);
  if (!topic.trim() && vocabWords.length === 0 && roster.length === 0) return null;
  // Unjoined students count in the denominator: they still owe homework,
  // the FT just can't see it in the app. Not-scanned first.
  const scannedCount = roster.filter((s) => s.scannedThisWeek).length;
  const students = [...roster].sort((a, b) => rank(a) - rank(b));
  const muted = 'text-ink-3';
  return (
    <section className="mx-auto w-full max-w-3xl space-y-3 text-left">
      <h2 className="break-keep text-[22px] font-extrabold tracking-[-0.01em]">
        {/* Lead with the unit: "Week 1" next to "Unit 6" read as two
            competing numbers. The week is the term calendar's. */}
        {topic.trim() || (isKo ? `학기 ${weekNumber}주차` : `Term week ${weekNumber}`)}
        {topic.trim() && <span className={`font-semibold ${muted}`}> · {isKo ? `학기 ${weekNumber}주차` : `term week ${weekNumber}`}</span>}
      </h2>
      {roster.length > 0 && (
        <div>
          <p className={`text-[14px] ${muted}`}>
            {isKo
              ? `숙제 스캔: ${roster.length}명 중 ${scannedCount}명 완료`
              : `Homework scanned this week: ${scannedCount} of ${roster.length}`}
          </p>
          <ul className="mt-2 divide-y divide-rule border-y border-rule">
            {students.map((s) => (
              <li key={s.uid} className="flex items-center justify-between gap-3 py-2 text-[14px]">
                <span className="min-w-0 truncate font-bold">{s.name}</span>
                <span className={`shrink-0 break-keep ${s.isPending ? muted : s.scannedThisWeek && s.weeklyMistakes ? 'font-bold text-line-ink' : 'text-ink-2'}`}>
                  {s.isPending
                    ? isKo ? '학부모 앱 미가입' : 'Parent not on the app'
                    : !s.scannedThisWeek
                    ? isKo ? '아직 스캔 안 함' : 'Not scanned yet'
                    : s.weeklyMistakes
                    ? isKo ? `틀린 문제 ${s.weeklyMistakes}개` : `${s.weeklyMistakes} to review`
                    : isKo ? '모두 맞음' : 'All correct'}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {vocabWords.length > 0 && (
        <div className="space-y-2">
          <p className={`text-[14px] ${muted}`}>
            {missed.length > 0
              ? isKo ? '숙제에서 많이 틀린 단어 — 수업 시작할 때 복습해 보세요.' : 'Most-missed words on homework. Worth a quick review at the start of class.'
              : isKo ? '이번 주 단어. 아직 채점된 오답이 없어요.' : "This week's words. No homework mistakes scanned yet."}
          </p>
          <ul className="flex flex-wrap gap-1.5">
            {(missed.length > 0 ? missed : vocabWords.map((word) => ({ word, count: 0 }))).map(({ word, count }) => (
              <li
                key={word}
                className={`rounded-md px-2.5 py-1 text-[14px] font-bold ${
                  count > 0
                    ? 'bg-wrong-soft text-wrong'
                    : 'bg-line-soft text-line-ink'
                }`}
              >
                {word}
                {count > 0 && <span className="ml-1.5 tabular-nums font-extrabold">{count}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

// Who needs the FT's attention first: mistakes, then not scanned, then
// fine, then students whose parent hasn't joined (nothing to act on yet).
function rank(s: Props['roster'][number]) {
  if (s.isPending) return 3;
  if (!s.scannedThisWeek) return 1;
  return s.weeklyMistakes ? 0 : 2;
}
