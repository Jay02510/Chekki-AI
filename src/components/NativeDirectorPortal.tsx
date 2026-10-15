import React, { useState, useEffect } from 'react';
import { Buildings, WarningCircle, CheckCircle, X } from '@phosphor-icons/react';
import { collection, query, where, getCountFromServer, getDocs, limit, Timestamp } from 'firebase/firestore';
import { dbInstance } from '../../services/database';
import { useDialogA11y } from '../../hooks/useDialogA11y';
import { ActivityFeed } from './ActivityFeed';
import { useLogCompliance, type ComplianceRow } from '../../hooks/useLogCompliance';
import { staffUi } from './staffUi';
import { localDate, kstDate } from '../utils/localDate';
import { kstWeekStart, missLabel } from '../utils/weeklyMistakes';

interface Props {
  isKo?: boolean;
  academyName?: string;
  academyLogo?: string;
  schoolId?: string;
  // Real value read from schools/{schoolId}.planId (null until that fetch
  // resolves — treated as "not yet known" so the activation banner doesn't
  // flash on for a paid director before their school doc has loaded).
  planId?: string | null | undefined;
  seatsTotal?: { ft: number; kt: number };
  // Real, live-Firestore roster data -- same source TeacherPage's own
  // "Student Roster" sidebar tab uses. This tab used to hold a separate,
  // local-only mock `students` array that was never populated by anything
  // real, so it silently showed nothing regardless of the director's
  // actual roster (see NativeDirectorStudentsTab.tsx).
  pendingRoster?: any[];
  activeRoster?: any[];
  trialStatus?: { onTrial: boolean; daysRemaining: number; expired: boolean } | null;
  classes?: any[];
  onClassesChanged?: () => void;
  selectedClass?: any;
  // Current active-week target vocab for selectedClass, same computation
  // TeacherPage's own curriculum tab and per-student mistake tracking use
  // (getWeeklyVocabWords). Passed down so the Overview tab can show real
  // "this unit, at a glance" data without a second source of truth.
  weeklyVocabWords?: string[];
  weeklyPhonicsRules?: string[];
  curriculumTopic?: string;
  curriculumPassage?: string;
  onResolveFlag?: (studentUid: string) => void;
  onRequestSeatExpansion?: (extraSeats: number) => Promise<boolean>;
  // Billing lives as its own top-level director tab now (was a sub-tab of
  // this portal) — the trial banner's "Upgrade Plan" CTA still needs
  // somewhere to send the director, so the parent wires that navigation in.
  onNavigateToBilling?: () => void;
}

export const NativeDirectorPortal: React.FC<Props> = ({
  isKo = false,
  academyName = 'Apex English Academy (Seocho)',
  academyLogo,
  schoolId,
  planId,
  seatsTotal,
  pendingRoster = [],
  activeRoster = [],
  trialStatus = null,
  classes = [],
  onClassesChanged,
  selectedClass,
  weeklyVocabWords = [],
  weeklyPhonicsRules = [],
  curriculumTopic = '',
  curriculumPassage = '',
  onResolveFlag = () => {},
  onRequestSeatExpansion,
  onNavigateToBilling,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'exceptions'>('overview');

  // Campus-wide roster + flag counts — previously TOTAL ROSTER and FLAGGED
  // EXCEPTIONS only reflected whichever single class was selected
  // (pendingRoster/activeRoster are TeacherPage's per-selectedClass roster),
  // so a director had to click through every class one at a time to find
  // flags elsewhere in their school. Mirrors the logReviewStats pattern
  // below: one query per class, aggregated client-side.
  const [campusRoster, setCampusRoster] = useState<{
    activeCount: number;
    pendingCount: number;
    flagged: any[];
  }>({ activeCount: 0, pendingCount: 0, flagged: [] });

  useEffect(() => {
    if (classes.length === 0) {
      setCampusRoster({ activeCount: 0, pendingCount: 0, flagged: [] });
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const results = await Promise.all(
          classes.map(async (cls: any) => {
            if (!cls?.id || cls.isDemo) return { active: 0, pending: 0, flagged: [] as any[] };
            // Invited students have no users/{uid} doc until a parent joins;
            // count them too so this matches the class rosters (same query
            // as useRosterAnalytics' pendingStudentsForRoster).
            const [usersSnap, invitedSnap] = await Promise.all([
              getDocs(query(collection(dbInstance, 'users'), where('classId', '==', cls.id))),
              getDocs(query(collection(dbInstance, 'pendingStudents'), where('classId', '==', cls.id))).catch(() => null),
            ]);
            let active = 0;
            let pending = invitedSnap?.docs.filter((d) => d.data()?.status === 'invited').length || 0;
            const flagged: any[] = [];
            usersSnap.forEach((d) => {
              const data = d.data();
              if (data.classStatus === 'active') {
                active++;
                if (data.flaggedException) flagged.push({ uid: d.id, ...data });
              } else if (data.classStatus === 'pending') {
                pending++;
              }
            });
            return { active, pending, flagged };
          })
        );
        if (cancelled) return;
        setCampusRoster({
          activeCount: results.reduce((sum, r) => sum + r.active, 0),
          pendingCount: results.reduce((sum, r) => sum + r.pending, 0),
          flagged: results.flatMap((r) => r.flagged),
        });
      } catch (err) {
        console.error('Failed to load campus roster stats:', err);
      }
    })();
    return () => { cancelled = true; };
  }, [classes]);

  const { complianceRows, isLoading: isLoadingCompliance } = useLogCompliance(classes);
  const totalRosterCount = campusRoster.activeCount + campusRoster.pendingCount;
  const flaggedStudents = campusRoster.flagged;

  const [phoneScriptFor, setPhoneScriptFor] = useState<string | null>(null);
  // Call notes = this child's real homework from the last two weeks, loaded
  // when opened. Replaced a fixed three-line script that was the same for everyone.
  const [callNotes, setCallNotes] = useState<Record<string, { scans: number; mistakes: number; words: string[] } | 'loading' | 'error'>>({});
  const openCallNotes = async (st: any) => {
    if (phoneScriptFor === st.uid) return setPhoneScriptFor(null);
    setPhoneScriptFor(st.uid);
    if (callNotes[st.uid] && callNotes[st.uid] !== 'error') return;
    if (!st.classId) return setCallNotes((p) => ({ ...p, [st.uid]: { scans: 0, mistakes: 0, words: [] } }));
    setCallNotes((p) => ({ ...p, [st.uid]: 'loading' }));
    try {
      const snap = await getDocs(query(collection(dbInstance, 'classes', st.classId, 'studentScans'), where('studentUid', '==', st.uid), limit(50)));
      const since = Date.now() - 14 * 86_400_000;
      const recent = snap.docs.map((d) => d.data()).filter((d) => new Date(d.scannedAt).getTime() >= since);
      const counts = new Map<string, number>();
      recent.forEach((d) => (d.redBorderedMistakes || []).forEach((m: any) => {
        const w = missLabel(m, []);
        if (w) counts.set(w, (counts.get(w) || 0) + 1);
      }));
      setCallNotes((p) => ({
        ...p,
        [st.uid]: {
          scans: recent.length,
          mistakes: recent.reduce((n, d) => n + (Number(d.mistakeCount) || 0), 0),
          words: [...counts].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([w]) => w),
        },
      }));
    } catch (err) {
      console.error('Failed to load call notes:', err);
      setCallNotes((p) => ({ ...p, [st.uid]: 'error' }));
    }
  };
  const [showSeatExpansionModal, setShowSeatExpansionModal] = useState(false);
  const [requestedExtraSeats, setRequestedExtraSeats] = useState(3);
  const [seatRequestSent, setSeatRequestSent] = useState(false);
  const [isRequestingSeats, setIsRequestingSeats] = useState(false);
  const seatExpansionDialogRef = useDialogA11y<HTMLDivElement>({
    isOpen: showSeatExpansionModal,
    onClose: () => { setShowSeatExpansionModal(false); setSeatRequestSent(false); },
  });

  // Thin visibility layer over the FT->KT log review pipeline: not the
  // content of a log (that's private teacher-to-teacher until a KT reviews
  // it — see ParentClassLogs.tsx), just whether classes are keeping up with
  // submitting and reviewing them. Counts only, via aggregate queries.
  const [logReviewStats, setLogReviewStats] = useState<{
    pending: number;
    sent: number;
    byClass: { classId: string; className: string; pending: number }[];
  }>({ pending: 0, sent: 0, byClass: [] });

  useEffect(() => {
    if (classes.length === 0) {
      setLogReviewStats({ pending: 0, sent: 0, byClass: [] });
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const results = await Promise.all(
          classes.map(async (cls: any) => {
            if (!cls?.id || cls.isDemo) return { classId: cls?.id, className: cls?.name, pending: 0, sent: 0 };
            const logsRef = collection(dbInstance, 'classes', cls.id, 'logs');
            const [pendingSnap, sentSnap] = await Promise.all([
              getCountFromServer(query(logsRef, where('reviewStatus', '==', 'pending_review'))),
              getCountFromServer(query(logsRef, where('reviewStatus', '==', 'sent'))),
            ]);
            return {
              classId: cls.id,
              className: cls.name || cls.className || 'Class',
              pending: pendingSnap.data().count,
              sent: sentSnap.data().count,
            };
          })
        );
        if (cancelled) return;
        setLogReviewStats({
          pending: results.reduce((sum, r) => sum + r.pending, 0),
          sent: results.reduce((sum, r) => sum + r.sent, 0),
          byClass: results.filter((r) => r.pending > 0).map((r) => ({ classId: r.classId, className: r.className, pending: r.pending })),
        });
      } catch (err) {
        console.error('Failed to load log review stats:', err);
      }
    })();
    return () => { cancelled = true; };
  }, [classes]);


  // Is it being used: real counts only (PRODUCT.md principle 6), so a
  // director at renewal sees use, not just whether logs went out.
  const [usage, setUsage] = useState<{
    scans: number;
    students: number;
    reportsThisMonth: number;
    byClass: { classId: string; className: string; scans: number; mistakes: number; students: number }[];
  } | null>(null);

  useEffect(() => {
    const real = classes.filter((c: any) => c?.id && !c.isDemo);
    if (real.length === 0) {
      setUsage(null);
      return;
    }
    let cancelled = false;
    const weekStartIso = new Date(kstWeekStart()).toISOString();
    const monthStart = Timestamp.fromDate(new Date(`${kstDate().slice(0, 7)}-01T00:00:00+09:00`));
    (async () => {
      try {
        const rows = await Promise.all(
          real.map(async (cls: any) => {
            const [scansSnap, reportsCount] = await Promise.all([
              getDocs(query(collection(dbInstance, 'classes', cls.id, 'studentScans'), where('scannedAt', '>=', weekStartIso), limit(500))),
              getCountFromServer(query(collection(dbInstance, 'classes', cls.id, 'parentReports'), where('sentAt', '>=', monthStart))),
            ]);
            const uids = new Set<string>();
            let mistakes = 0;
            scansSnap.forEach((d) => {
              const data = d.data();
              if (data.studentUid) uids.add(data.studentUid);
              mistakes += Number(data.mistakeCount) || 0;
            });
            return {
              classId: cls.id as string,
              className: (cls.name || cls.className || 'Class') as string,
              scans: scansSnap.size,
              mistakes,
              students: uids.size,
              reports: reportsCount.data().count,
            };
          })
        );
        if (cancelled) return;
        setUsage({
          scans: rows.reduce((n, r) => n + r.scans, 0),
          students: rows.reduce((n, r) => n + r.students, 0),
          reportsThisMonth: rows.reduce((n, r) => n + r.reports, 0),
          // Most mistakes per scan first: where the director looks next.
          byClass: rows.sort((a, b) => b.mistakes / Math.max(1, b.scans) - a.mistakes / Math.max(1, a.scans)),
        });
      } catch (err) {
        console.error('Failed to load usage stats:', err);
      }
    })();
    return () => { cancelled = true; };
  }, [classes]);

  const realClassCount = classes.filter((c: any) => !c.isDemo).length;
  const seatCount = (seatsTotal?.ft || 0) + (seatsTotal?.kt || 0);
  const today = new Intl.DateTimeFormat(isKo ? 'ko-KR' : 'en-US', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date());
  const { primaryBtn, quietBtn } = staffUi;
  const closeSeatModal = () => { setShowSeatExpansionModal(false); setSeatRequestSent(false); };

  return (
    <div className="mx-auto max-w-5xl space-y-10 text-left text-ink">
      {/* Setup-First Activation Header Banner — real signal from
          schools/{schoolId}.planId, not sessionStorage (Audit: paid/seat
          status read from a per-tab value instead of Firestore, so a
          director on a second device or after clearing storage saw a
          subscription state that had nothing to do with their real record).
          planId === null means the school doc genuinely has no plan set yet;
          undefined means the fetch hasn't resolved, so we render nothing
          rather than flash this at an already-paid director. */}
      {planId === null && (
        <div className="flex flex-col items-start justify-between gap-4 rounded-lg bg-line-soft p-5 sm:flex-row sm:items-center">
          <div>
            <p className="text-[16px] font-extrabold">
              {isKo ? `${academyName || '학원'} 준비가 끝났어요` : `${academyName || 'Your academy'} is set up`}
            </p>
            <p className="mt-1 text-[14px] text-ink-2">
              {isKo
                ? '결제를 마치면 숙제 채점과 학부모 카카오톡 리포트가 켜져요. 7일 안에는 전액 환불돼요.'
                : 'Finish payment to turn on homework grading and KakaoTalk parent reports. Full refund within 7 days.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              if (typeof window !== 'undefined') {
                sessionStorage.setItem('chekki_paid_school', academyName);
                window.location.href = '/schools';
              }
            }}
            className={primaryBtn}
          >
            {isKo ? '결제하고 시작하기' : 'Pay and start'}
          </button>
        </div>
      )}

      {/* Trial Countdown / Expired Banner */}
      {trialStatus?.onTrial && (
        <div
          className={`flex flex-col items-start justify-between gap-3 rounded-lg p-5 sm:flex-row sm:items-center ${
            trialStatus.expired ? 'bg-wrong-soft' : trialStatus.daysRemaining <= 2 ? 'bg-line-soft' : 'bg-sunken'
          }`}
        >
          <div>
            <p className={`text-[16px] font-extrabold ${trialStatus.expired ? 'text-wrong' : ''}`}>
              {trialStatus.expired
                ? (isKo ? '무료 체험이 끝났어요' : 'Your free trial has ended')
                : (isKo ? `무료 체험 ${trialStatus.daysRemaining}일 남음` : `${trialStatus.daysRemaining} day${trialStatus.daysRemaining === 1 ? '' : 's'} left in your free trial`)}
            </p>
            <p className="mt-1 text-[14px] text-ink-2">
              {trialStatus.expired
                ? (isKo ? '지금 있는 학급과 데이터는 계속 볼 수 있어요. 새 학급 만들기와 선생님 초대만 멈춰요.' : 'Existing classes and data stay visible, but creating new classes or inviting teachers is paused until you upgrade.')
                : (isKo ? '체험이 끝나도 지금 데이터는 그대로예요. 새 학급 만들기와 초대만 멈춰요.' : "New classes and invites will pause when it ends — your existing data isn't affected.")}
            </p>
          </div>
          <button type="button" onClick={onNavigateToBilling} className={primaryBtn}>
            {isKo ? '플랜 선택하기' : 'Choose a plan'}
          </button>
        </div>
      )}

      {/* Header: academy, today's date, and the flagged-students switch.
          The exceptions view only exists while something is actually
          flagged; at zero it was a dead tab. */}
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div className="flex items-center gap-3">
          {academyLogo ? (
            <img src={academyLogo} alt="" width={40} height={40} className="h-10 w-10 rounded-md object-cover" />
          ) : (
            <Buildings size={32} weight="duotone" className="text-line-ink" aria-hidden="true" />
          )}
          <div>
            <h2 className="text-[26px] font-extrabold leading-tight tracking-[-0.02em] sm:text-[30px]">{academyName}</h2>
            <p className="text-[14px] text-ink-3">{today}</p>
          </div>
        </div>

        {(flaggedStudents.length > 0 || activeTab === 'exceptions') && (
          <div className="flex gap-1 rounded-md bg-sunken p-1" role="tablist">
            {([
              ['overview', isKo ? '오늘 현황' : 'Overview'],
              ['exceptions', isKo ? `주의 학생 ${flaggedStudents.length}명` : `Flagged (${flaggedStudents.length})`],
            ] as const).map(([id, label]) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={activeTab === id}
                onClick={() => setActiveTab(id)}
                className={`min-h-10 cursor-pointer rounded px-4 text-[14px] font-bold ${
                  activeTab === id ? 'bg-surface text-ink shadow-[0_1px_2px_rgba(43,33,26,0.12)]' : 'text-ink-2 hover:text-ink'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </header>

      {activeTab === 'overview' && (
        <>
          <DirectorTodayPanel isKo={isKo} rows={complianceRows} isLoading={isLoadingCompliance} />

          {/* Campus totals: one ruled row, not three boxes. */}
          <dl className="grid grid-cols-3 divide-x divide-rule border-y border-rule">
            <div className="py-4 pr-4">
              <dt className="text-[13px] font-bold text-ink-3">{isKo ? '학급' : 'Classes'}</dt>
              <dd className="mt-1 text-[28px] font-extrabold tabular-nums">{realClassCount}</dd>
            </div>
            <div className="px-4 py-4">
              <dt className="text-[13px] font-bold text-ink-3">{isKo ? '학생' : 'Students'}</dt>
              <dd className="mt-1 text-[28px] font-extrabold tabular-nums">{totalRosterCount}</dd>
              {campusRoster.pendingCount > 0 && (
                <dd className="text-[13px] text-ink-3">
                  {isKo
                    ? `앱 가입 ${campusRoster.activeCount} · 초대 대기 ${campusRoster.pendingCount}`
                    : `${campusRoster.activeCount} on the app · ${campusRoster.pendingCount} invited`}
                </dd>
              )}
            </div>
            <div className="py-4 pl-4">
              <dt className="text-[13px] font-bold text-ink-3">{isKo ? '교사 좌석' : 'Staff seats'}</dt>
              <dd className="mt-1 text-[28px] font-extrabold tabular-nums">{seatCount}</dd>
              <dd className="flex flex-wrap items-center gap-x-3 text-[13px] text-ink-3">
                <span className="whitespace-nowrap">{seatsTotal?.ft || 0} FT · {seatsTotal?.kt || 0} KT</span>
                {planId !== 'trial' && (
                  <button
                    type="button"
                    onClick={() => setShowSeatExpansionModal(true)}
                    className="min-h-8 cursor-pointer font-bold text-line-ink hover:underline"
                  >
                    {isKo ? '좌석 추가' : 'Add seats'}
                  </button>
                )}
              </dd>
            </div>
          </dl>

          {usage && (
            <section aria-labelledby="usage-title">
              <h3 id="usage-title" className="text-[20px] font-extrabold tracking-[-0.01em]">{isKo ? '학부모 사용 현황' : 'How families are using it'}</h3>
              <dl className="mt-3 grid grid-cols-3 divide-x divide-rule border-y border-rule">
                <div className="py-4 pr-4">
                  <dt className="text-[13px] font-bold text-ink-3">{isKo ? '이번 주 숙제 채점' : 'Homework scans this week'}</dt>
                  <dd className="mt-1 text-[28px] font-extrabold tabular-nums">{usage.scans}</dd>
                </div>
                <div className="px-4 py-4">
                  <dt className="text-[13px] font-bold text-ink-3">{isKo ? '이번 주 채점한 학생' : 'Students scanned this week'}</dt>
                  <dd className="mt-1 text-[28px] font-extrabold tabular-nums">
                    {usage.students}
                    {campusRoster.activeCount > 0 && <span className="text-[16px] font-bold text-ink-3"> / {campusRoster.activeCount}</span>}
                  </dd>
                </div>
                <div className="py-4 pl-4">
                  <dt className="text-[13px] font-bold text-ink-3">{isKo ? '이번 달 전달된 리포트' : 'Reports delivered this month'}</dt>
                  <dd className="mt-1 text-[28px] font-extrabold tabular-nums">{usage.reportsThisMonth}</dd>
                </div>
              </dl>
              {usage.byClass.length > 1 && (
                <ul className={`mt-3 ${staffUi.rows}`} aria-label={isKo ? '반별 이번 주 숙제' : "This week's homework by class"}>
                  {usage.byClass.map((c) => (
                    <li key={c.classId} className="flex items-center justify-between gap-3 py-2.5 text-[14px]">
                      <span className="min-w-0 truncate font-bold">{c.className}</span>
                      <span className="shrink-0 tabular-nums text-ink-2">
                        {c.scans === 0
                          ? (isKo ? '이번 주 채점 없음' : 'No scans this week')
                          : isKo
                            ? `채점 ${c.scans}건 · 학생 ${c.students}명 · 오답 평균 ${(c.mistakes / c.scans).toFixed(1)}개`
                            : `${c.scans} ${c.scans === 1 ? 'scan' : 'scans'} · ${c.students} ${c.students === 1 ? 'student' : 'students'} · ${(c.mistakes / c.scans).toFixed(1)} misses per scan`}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          {/* selectedClass is never actually null — TeacherPage always falls
              back to a placeholder "Sample Class" object so the rest of the
              page can safely read .joinCode etc without null checks
              everywhere. That placeholder used to render here as if it were
              a real class (fake name, fake "This Week" card) the moment a
              brand-new director signed in with zero real classes — showing
              demo content that looked exactly like the director's own data
              (Audit: "demo data that loads when a director signs in without
              a class"). Checking isDemo instead of truthiness shows the
              genuine empty state until a real class exists. */}
          {!selectedClass || selectedClass.isDemo ? (
            <div className="rounded-lg bg-surface p-8 text-center ring-1 ring-inset ring-rule">
              <p className="text-[16px] font-extrabold">{isKo ? '아직 학급이 없어요' : 'No class yet'}</p>
              <p className="mt-1 text-[14px] text-ink-3">{isKo ? '첫 학급을 만들면 이번 주 어휘와 학생 현황이 여기에 보여요.' : "Create your first class to see this week's vocab and student status here."}</p>
            </div>
          ) : (
            <section className="space-y-5">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="text-[20px] font-extrabold tracking-[-0.01em]">
                  {isKo ? '이번 주' : 'This week'}
                  <span className="font-semibold text-ink-3">
                    {' · '}{selectedClass.name || selectedClass.className || 'Class'}, {isKo ? `학기 ${selectedClass.activeWeekNumber || 1}주차` : `term week ${selectedClass.activeWeekNumber || 1}`}
                  </span>
                </h3>
                {flaggedStudents.length > 0 && (
                  <button type="button" onClick={() => setActiveTab('exceptions')} className="min-h-10 cursor-pointer text-[14px] font-bold text-line-ink hover:underline">
                    {isKo ? `주의 학생 ${flaggedStudents.length}명 보기` : `See ${flaggedStudents.length} flagged`}
                  </button>
                )}
              </div>

              <div>
                <p className="mb-2 text-[13px] font-bold text-ink-3">{isKo ? '목표 어휘' : 'Target vocab'}</p>
                {weeklyVocabWords.length === 0 ? (
                  <p className="text-[14px] text-ink-3">{isKo ? '이번 주 어휘가 아직 없어요. 선생님이 "정답지 올리기"에서 올리면 여기에 보여요.' : 'No vocab for this week yet. It shows here once a teacher uploads it in Answer key.'}</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {weeklyVocabWords.map((word) => (
                      <span key={word} className="rounded-md bg-line-soft px-2.5 py-1 text-[14px] font-bold text-line-ink">{word}</span>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <p className="mb-1 text-[13px] font-bold text-ink-3">
                  {isKo ? `학생 ${activeRoster.length}명` : `Students (${activeRoster.length})`}
                </p>
                {activeRoster.length === 0 ? (
                  <p className="text-[14px] text-ink-3">{isKo ? '아직 학생이 없어요.' : 'No active students in this class yet.'}</p>
                ) : (
                  <ul className="divide-y divide-rule border-y border-rule">
                    {activeRoster.map((student: any) => (
                      <li key={student.uid || student.studentName} className="flex items-center justify-between gap-3 py-2.5 text-[15px]">
                        <span className="min-w-0 truncate font-semibold">{student.studentName || student.name || (isKo ? '이름 없음' : 'Unnamed')}</span>
                        {student.flaggedException || student.weeklyMistakesCount > 0 ? (
                          <span className="flex shrink-0 items-center gap-1 text-[13px] font-bold text-line-ink">
                            <WarningCircle size={16} weight="fill" aria-hidden="true" />
                            {student.weeklyMistakesCount > 0 ? (isKo ? `오답 ${student.weeklyMistakesCount}개` : `${student.weeklyMistakesCount} ${student.weeklyMistakesCount === 1 ? 'mistake' : 'mistakes'}`) : (isKo ? '주의' : 'Flagged')}
                          </span>
                        ) : student.hasScannedThisWeek ? (
                          <span className="flex shrink-0 items-center gap-1 text-[13px] font-bold text-correct">
                            <CheckCircle size={16} weight="fill" aria-hidden="true" />
                            {isKo ? '스캔 완료' : 'Scanned'}
                          </span>
                        ) : (
                          <span className="shrink-0 text-[13px] font-bold text-ink-3">{isKo ? '스캔 전' : 'No scan yet'}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          )}

          {schoolId && <ActivityFeed isKo={isKo} schoolId={schoolId} />}
        </>
      )}

      {activeTab === 'exceptions' && (
        <section className="space-y-6">
          <p className="max-w-2xl text-[15px] text-ink-2">
            {isKo
              ? '선생님이 학습·생활 문제로 표시한 학생이에요. 해결을 누르면 표시가 사라져요.'
              : 'Students a teacher flagged for academic or behavior issues. Resolving clears the flag.'}
          </p>

          {logReviewStats.byClass.length > 0 && (
            <div>
              <p className="mb-2 text-[13px] font-bold text-ink-3">{isKo ? '검토 대기 일지' : 'Logs awaiting review'}</p>
              <div className="flex flex-wrap gap-2">
                {logReviewStats.byClass.map((c) => (
                  <span key={c.classId} className="rounded-md bg-line-soft px-3 py-1.5 text-[14px] font-bold text-line-ink">
                    {c.className}: {isKo ? `${c.pending}건 대기` : `${c.pending} pending`}
                  </span>
                ))}
              </div>
            </div>
          )}

          {flaggedStudents.length === 0 ? (
            <p className="rounded-lg bg-surface p-10 text-center ring-1 ring-inset ring-rule text-[15px] text-ink-3">
              {isKo ? '주의 표시된 학생이 없어요.' : 'No students are currently flagged.'}
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {flaggedStudents.map((st: any) => (
                <article key={st.uid} className="space-y-4 rounded-lg border border-rule bg-surface p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h4 className="truncate text-[16px] font-extrabold">{st.studentName || st.name || (isKo ? '이름 없음' : 'Unnamed')}</h4>
                      <p className="truncate text-[13px] text-ink-3">{st.email}</p>
                    </div>
                    <span className="shrink-0 rounded-md bg-sunken px-2 py-1 text-[13px] font-bold text-ink-2">{st.flaggedException?.date}</span>
                  </div>

                  <div className="rounded-md bg-line-soft px-4 py-3 text-[14px] leading-relaxed">
                    <p className="mb-0.5 text-[13px] font-bold text-ink-3">
                      {isKo ? `${st.flaggedException?.teacherName} 선생님 메모` : `Note from ${st.flaggedException?.teacherName}`}
                    </p>
                    <p>{st.flaggedException?.reason}</p>
                  </div>

                  {phoneScriptFor === st.uid && (() => {
                    const n = callNotes[st.uid];
                    return (
                      <div className="rounded-md bg-sunken px-4 py-3 text-[14px] leading-relaxed" aria-live="polite">
                        <p className="mb-0.5 text-[13px] font-bold text-ink-3">{isKo ? '최근 2주 숙제' : 'Homework, last 2 weeks'}</p>
                        {n === 'loading' || !n ? (
                          <p className="text-ink-3">{isKo ? '불러오는 중...' : 'Loading...'}</p>
                        ) : n === 'error' ? (
                          <p className="text-ink-3">{isKo ? '불러오지 못했어요. 다시 눌러 주세요.' : "Couldn't load it. Tap again to retry."}</p>
                        ) : n.scans === 0 ? (
                          <p>{isKo ? '최근 2주 동안 스캔한 숙제가 없어요.' : 'No homework scanned in the last 2 weeks.'}</p>
                        ) : (
                          <>
                            <p className="tabular-nums">
                              {isKo ? `채점 ${n.scans}회 · 틀린 문제 ${n.mistakes}개` : `${n.scans} ${n.scans === 1 ? 'scan' : 'scans'} · ${n.mistakes} ${n.mistakes === 1 ? 'mistake' : 'mistakes'}`}
                            </p>
                            {n.words.length > 0 && (
                              <p>
                                {isKo ? '자주 틀린 것: ' : 'Missed most: '}
                                <span className="font-bold">{n.words.join(', ')}</span>
                              </p>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })()}

                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => openCallNotes(st)}
                      className={quietBtn}
                    >
                      {phoneScriptFor === st.uid ? (isKo ? '통화 요점 숨기기' : 'Hide call notes') : (isKo ? '통화 요점 보기' : 'Call notes')}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onResolveFlag(st.uid);
                        // Optimistic — onResolveFlag only refreshes TeacherPage's
                        // own selectedClass roster, not this component's separate
                        // campus-wide fetch above.
                        setCampusRoster((prev) => ({ ...prev, flagged: prev.flagged.filter((f) => f.uid !== st.uid) }));
                      }}
                      className={`${quietBtn} text-correct`}
                    >
                      <CheckCircle size={16} weight="bold" className="mr-1.5" aria-hidden="true" />
                      {isKo ? '해결' : 'Resolve'}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {/* SEAT EXPANSION REQUEST MODAL */}
      {showSeatExpansionModal && (
        <div className="fixed inset-0 z-[550] flex items-end justify-center bg-[#2b211a]/55 sm:items-center sm:p-4">
          <div
            ref={seatExpansionDialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="seat-expansion-title"
            tabIndex={-1}
            className="modal-enter relative w-full max-w-md space-y-5 rounded-t-lg bg-surface p-6 text-left text-ink shadow-[0_24px_60px_-20px_rgba(43,33,26,0.45)] sm:rounded-lg"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 id="seat-expansion-title" className="text-[20px] font-extrabold">{isKo ? '교사 좌석 추가' : 'Add staff seats'}</h3>
                <p className="text-[14px] text-ink-3">{isKo ? `지금 ${seatCount}석 · FT ${seatsTotal?.ft || 0} · KT ${seatsTotal?.kt || 0}` : `${seatCount} seats now · ${seatsTotal?.ft || 0} FT · ${seatsTotal?.kt || 0} KT`}</p>
              </div>
              <button
                type="button"
                onClick={closeSeatModal}
                aria-label={isKo ? '닫기' : 'Close'}
                className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-md text-ink-2 hover:bg-sunken hover:text-ink"
              >
                <X size={20} weight="bold" />
              </button>
            </div>

            {seatRequestSent ? (
              <div className="space-y-3 rounded-lg bg-right-soft p-5 text-center">
                <CheckCircle size={32} weight="fill" className="mx-auto text-correct" aria-hidden="true" />
                <p className="text-[16px] font-extrabold">{isKo ? '좌석 추가 요청을 받았어요' : 'Seat request received'}</p>
                <p className="text-[14px] leading-relaxed text-ink-2">
                  {isKo
                    ? `+${requestedExtraSeats}석 요청이 등록되었고, 입금 계좌를 이메일로 보내드렸어요. 입금 확인 후 24시간 안에 초대가 열려요.`
                    : `We logged +${requestedExtraSeats} seats and emailed the bank details. Invites open within 24 hours of payment.`}
                </p>
                <button type="button" onClick={closeSeatModal} className={primaryBtn}>
                  {isKo ? '확인' : 'Done'}
                </button>
              </div>
            ) : (
              <>
                <p className="text-[15px] text-ink-2">
                  {isKo
                    ? '원어민 선생님(FT)이나 한국인 선생님(KT)을 더 초대하려면 좌석을 늘려요. 좌석당 월 ₩19,000이에요.'
                    : 'Add seats to invite more foreign (FT) or Korean (KT) teachers. ₩19,000 per seat a month.'}
                </p>

                <fieldset>
                  <legend className="mb-2 text-[13px] font-bold text-ink-3">{isKo ? '추가할 좌석' : 'Seats to add'}</legend>
                  <div className="grid grid-cols-3 gap-2">
                    {[1, 3, 5].map((count) => (
                      <button
                        key={count}
                        type="button"
                        aria-pressed={requestedExtraSeats === count}
                        onClick={() => setRequestedExtraSeats(count)}
                        className={`btn-press min-h-12 cursor-pointer rounded-md text-[16px] font-extrabold tabular-nums ${
                          requestedExtraSeats === count ? 'bg-sign text-on-sign' : 'bg-sunken text-ink-2 hover:text-ink'
                        }`}
                      >
                        +{count}
                      </button>
                    ))}
                  </div>
                </fieldset>

                <div className="flex items-baseline justify-between border-y border-rule py-3">
                  <span className="text-[14px] text-ink-2">{isKo ? '월 추가 요금' : 'Added each month'}</span>
                  <strong className="text-[18px] font-extrabold tabular-nums">₩{(requestedExtraSeats * 19000).toLocaleString()}</strong>
                </div>
                <p className="-mt-3 text-[13px] text-ink-3">{isKo ? '계좌이체, 세금계산서에 합산 청구돼요.' : 'Billed by bank transfer on your tax invoice.'}</p>

                <button
                  type="button"
                  disabled={isRequestingSeats}
                  onClick={async () => {
                    setIsRequestingSeats(true);
                    try {
                      const ok = await onRequestSeatExpansion?.(requestedExtraSeats);
                      if (ok) setSeatRequestSent(true);
                    } finally {
                      setIsRequestingSeats(false);
                    }
                  }}
                  className={`${primaryBtn} w-full`}
                >
                  {isRequestingSeats ? (isKo ? '요청 중...' : 'Sending...') : (isKo ? `+${requestedExtraSeats}석 요청하기` : `Request +${requestedExtraSeats} seats`)}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// The director's first question each day: did every class get logged, and
// did parents get the report? Per class, from today's logs only
// (useLogCompliance.todayStatus) — an older backlog shows in the KT inbox.
function DirectorTodayPanel({
  isKo,
  rows,
  isLoading,
}: {
  isKo: boolean;
  rows: ComplianceRow[];
  isLoading: boolean;
}) {
  if (rows.length === 0 && !isLoading) return null;
  const statusFor = (row: ComplianceRow) => {
    if (row.todayStatus === 'none') return { key: 'none', label: isKo ? '아직 일지 없음' : 'Not logged yet', tone: 'text-ink-2 ring-1 ring-inset ring-rule' };
    if (row.todayStatus === 'pending') return { key: 'pending', label: isKo ? 'KT 검토 대기' : 'Waiting for KT review', tone: 'bg-line-soft text-line-ink' };
    return { key: 'sent', label: isKo ? '학부모 전달 완료' : 'Sent to parents', tone: 'bg-right-soft text-correct' };
  };
  const sentCount = rows.filter((r) => statusFor(r).key === 'sent').length;

  return (
    <section className="rounded-lg border border-rule bg-surface">
      <header className="flex items-baseline justify-between gap-3 border-b border-rule px-5 py-4">
        <h3 className="text-[20px] font-extrabold tracking-[-0.01em]">{isKo ? '오늘 리포트' : "Today's reports"}</h3>
        {!isLoading && (
          <span className="text-[14px] font-semibold text-ink-3 tabular-nums">
            {isKo ? `${rows.length}개 반 중 ${sentCount}개 전달` : `${sentCount} of ${rows.length} classes sent`}
          </span>
        )}
      </header>
      {isLoading && rows.length === 0 ? (
        <p className="px-5 py-4 text-[14px] text-ink-3">{isKo ? '불러오는 중...' : 'Loading...'}</p>
      ) : (
        <ul className="divide-y divide-rule">
          {rows.map((row) => {
            const status = statusFor(row);
            return (
              <li key={row.classId} className="flex items-center justify-between gap-3 px-5 py-3.5">
                <div className="min-w-0">
                  <p className="truncate text-[15px] font-bold">{row.className}</p>
                  <p className={`truncate text-[13px] ${row.missStreak >= 2 ? 'font-semibold text-wrong' : 'text-ink-3'}`}>
                    {[
                      row.teacherName,
                      row.missStreak >= 2 && (isKo ? `수업일 ${row.missStreak}일 연속 미제출` : `No log for ${row.missStreak} class days`),
                    ].filter(Boolean).join(' · ')}
                  </p>
                  {row.pendingCount > 0 && (
                    <p className="break-keep text-[13px] font-semibold text-line-ink">
                      {(() => {
                        const age = row.oldestPendingDate
                          ? Math.max(0, Math.round((Date.parse(localDate()) - Date.parse(row.oldestPendingDate)) / 86400000))
                          : 0;
                        return isKo
                          ? `KT 검토 대기 ${row.pendingCount}건${age > 0 ? ` · 가장 오래된 일지 ${age}일 전` : ''}`
                          : `${row.pendingCount} waiting for KT review${age > 0 ? ` · oldest ${age} ${age === 1 ? 'day' : 'days'} ago` : ''}`;
                      })()}
                    </p>
                  )}
                </div>
                <span className={`shrink-0 rounded-md px-2.5 py-1 text-[13px] font-bold ${status.tone}`}>{status.label}</span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
