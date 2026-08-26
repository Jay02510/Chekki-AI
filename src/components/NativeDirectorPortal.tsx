import React, { useState, useEffect } from 'react';
import {
  Buildings,
  WarningCircle,
  SquaresFour,
  CheckCircle
} from '@phosphor-icons/react';
import { collection, query, where, getCountFromServer, getDocs } from 'firebase/firestore';
import { dbInstance } from '../../services/database';
import { useDialogA11y } from '../../hooks/useDialogA11y';
import { SchoolBillingPanel } from './SchoolBillingPanel';
import { ActivityFeed } from './ActivityFeed';

interface Props {
  isNight?: boolean;
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
  onRequestPlanChange?: (planId: string, planName: string) => Promise<boolean>;
}

export const NativeDirectorPortal: React.FC<Props> = ({
  isNight = true,
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
  onRequestPlanChange,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'exceptions' | 'billing'>('overview');

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
            const usersSnap = await getDocs(query(collection(dbInstance, 'users'), where('classId', '==', cls.id)));
            let active = 0;
            let pending = 0;
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

  const totalRosterCount = campusRoster.activeCount + campusRoster.pendingCount;
  const flaggedStudents = campusRoster.flagged;

  const [phoneScriptFor, setPhoneScriptFor] = useState<string | null>(null);
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


  return (
    <div
      className={`p-6 sm:p-8 rounded-3xl border shadow-2xl space-y-8 font-sans transition-[background-color,border-color,color] ${
        isNight ? 'bg-brand-dark border-white/15 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-900'
      }`}
    >
      {/* Setup-First Activation Header Banner — real signal from
          schools/{schoolId}.planId, not sessionStorage (Audit: paid/seat
          status read from a per-tab value instead of Firestore, so a
          director on a second device or after clearing storage saw a
          subscription state that had nothing to do with their real record).
          planId === null means the school doc genuinely has no plan set yet;
          undefined means the fetch hasn't resolved, so we render nothing
          rather than flash this at an already-paid director. */}
      {planId === null && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-orange-500/20 via-amber-500/20 to-emerald-500/20 border border-orange-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-left">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-500/20 border border-orange-500/30 text-orange-400 flex items-center justify-center font-bold text-lg shrink-0">
              🎉
            </div>
            <div>
              <h4 className="font-black text-sm text-white flex items-center gap-2">
                <span>{academyName || '어학원'} 캠퍼스 구축 완료!</span>
              </h4>
              <p className="text-xs text-zinc-300 mt-0.5">
                원생 숙제 자동 스캐너 &amp; 학부모 카카오톡 연동을 위해 결제를 완료하세요. (7일 100% 환불 보장)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              if (typeof window !== 'undefined') {
                sessionStorage.setItem('chekki_paid_school', academyName);
                window.location.href = '/schools';
              }
            }}
            className="px-5 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs rounded-xl shadow-lg shadow-emerald-500/25 transition-[background-color,transform] flex items-center justify-center gap-2 shrink-0 cursor-pointer active:scale-95"
          >
            <span>⚡ 결제 완료하고 최종 활성화하기 →</span>
          </button>
        </div>
      )}

      {/* Trial Countdown / Expired Banner */}
      {trialStatus?.onTrial && (
        <div
          className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-left ${
            trialStatus.expired
              ? 'bg-red-500/10 border-red-500/30'
              : trialStatus.daysRemaining <= 2
                ? 'bg-orange-500/10 border-orange-500/30'
                : 'bg-white/5 border-white/10'
          }`}
        >
          <div>
            <p className={`text-sm font-black ${trialStatus.expired ? 'text-red-400' : trialStatus.daysRemaining <= 2 ? 'text-orange-400' : isNight ? 'text-white' : 'text-zinc-900'}`}>
              {trialStatus.expired
                ? (isKo ? '⏰ 무료 체험이 종료되었습니다' : '⏰ Your free trial has ended')
                : (isKo ? `⏳ 무료 체험 ${trialStatus.daysRemaining}일 남음` : `⏳ ${trialStatus.daysRemaining} day${trialStatus.daysRemaining === 1 ? '' : 's'} left in your free trial`)}
            </p>
            <p className="text-xs text-zinc-400 mt-0.5">
              {trialStatus.expired
                ? (isKo ? '기존 학급과 데이터는 계속 볼 수 있지만, 새 학급 개설과 선생님 초대는 제한됩니다.' : 'Existing classes and data stay visible, but creating new classes or inviting teachers is paused until you upgrade.')
                : (isKo ? '체험 종료 후에도 기존 데이터는 유지되며, 새 학급/초대만 제한됩니다.' : "New classes and invites will pause when it ends — your existing data isn't affected.")}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('billing')}
            className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-black font-bold text-xs rounded-xl shadow-lg shadow-orange-500/20 transition-colors shrink-0 cursor-pointer whitespace-nowrap"
          >
            {isKo ? '플랜 업그레이드 →' : 'Upgrade Plan →'}
          </button>
        </div>
      )}

      {/* Portal Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-orange-500 font-mono">
              DIRECTOR ADMIN PORTAL
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-orange-500/10 text-orange-400 border border-orange-500/20">
              Campus Manager
            </span>
          </div>
          <div className="flex items-center gap-3">
            <h3 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2">
              {academyLogo ? (
                <img src={academyLogo} alt="" className="w-6 h-6 rounded-lg object-cover" />
              ) : (
                <Buildings size={24} className="text-orange-500" />
              )}
              <span>{academyName}</span>
            </h3>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer border ${
              activeTab === 'overview'
                ? 'bg-orange-500 border-orange-500 text-black shadow-md'
                : isNight
                ? 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'
                : 'bg-zinc-100 border-zinc-200 text-zinc-700'
            }`}
          >
            <SquaresFour size={16} weight="bold" />
            <span>Overview</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('exceptions')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer border relative ${
              activeTab === 'exceptions'
                ? 'bg-orange-500 border-orange-500 text-black shadow-md'
                : isNight
                ? 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'
                : 'bg-zinc-100 border-zinc-200 text-zinc-700'
            }`}
          >
            <WarningCircle size={16} weight="bold" className="text-amber-400" />
            <span>Flagged Exceptions ({flaggedStudents.length})</span>
            {flaggedStudents.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-rose-500 absolute -top-1 -right-1 animate-ping" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('billing')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer border ${
              activeTab === 'billing'
                ? 'bg-orange-500 border-orange-500 text-black shadow-md'
                : isNight
                ? 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'
                : 'bg-zinc-100 border-zinc-200 text-zinc-700'
            }`}
          >
            <span>💳</span>
            <span>Billing</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB OVERVIEW: THIS UNIT, AT A GLANCE (selectedClass's active week: real */}
      {/* target vocab + real per-student sync status, both already computed by */}
      {/* TeacherPage — no separate mock data, no second source of truth) */}
      {/* ========================================================================= */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-fade-in text-left">
          {/* High-Level Metric Cards — Overview-only (previously shown above
              every tab, wrapping to 3 rows on mobile and pushing each tab's
              own content down; every other tab already has its own more-
              detailed view of the same numbers, so this is now a one-line
              horizontally-scrollable strip, same pattern as KtReviewQueue's
              chip list, scoped to the tab where it's actually a summary. */}
          <div className="flex items-center gap-3 overflow-x-auto pb-1">
            <div className={`shrink-0 min-w-[168px] p-5 rounded-2xl border ${isNight ? 'bg-white/5 border-white/10' : 'bg-zinc-50 border-zinc-200'}`}>
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 block font-mono">CAMPUS CLASSES</span>
              <h4 className={`text-2xl font-black mt-1 ${isNight ? 'text-white' : 'text-zinc-900'}`}>
                {classes.filter((c: any) => !c.isDemo).length}{' '}
                <span className="text-xs font-normal text-zinc-400">Active</span>
              </h4>
            </div>
            <div className={`shrink-0 min-w-[168px] p-5 rounded-2xl border ${isNight ? 'bg-white/5 border-white/10' : 'bg-zinc-50 border-zinc-200'}`}>
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 block font-mono">TOTAL ROSTER</span>
              <h4 className="text-2xl font-black text-orange-400 mt-1">{totalRosterCount} <span className="text-xs font-normal text-zinc-400">Enrolled</span></h4>
            </div>
            <div className={`shrink-0 min-w-[168px] p-5 rounded-2xl border ${isNight ? 'bg-white/5 border-white/10' : 'bg-zinc-50 border-zinc-200'}`}>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 block font-mono">STAFF SEAT QUOTA</span>
                {planId === 'trial' ? (
                  <span className="text-[10px] font-bold text-zinc-400 whitespace-nowrap" title="Paid seat expansion isn't available during the free trial">
                    Upgrade to add seats
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowSeatExpansionModal(true)}
                    className="text-[10px] font-bold text-orange-400 hover:underline cursor-pointer whitespace-nowrap"
                  >
                    + Add Seats
                  </button>
                )}
              </div>
              <h4 className="text-2xl font-black text-emerald-400 mt-1 whitespace-nowrap">
                {(seatsTotal?.ft || 0) + (seatsTotal?.kt || 0)} <span className="text-xs font-normal text-zinc-400">Total ({seatsTotal?.ft || 0} FT / {seatsTotal?.kt || 0} KT)</span>
              </h4>
            </div>
            <div className={`shrink-0 min-w-[168px] p-5 rounded-2xl border ${isNight ? 'bg-white/5 border-white/10' : 'bg-zinc-50 border-zinc-200'}`}>
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 block font-mono">FLAGGED EXCEPTIONS</span>
              <h4 className="text-2xl font-black text-amber-400 mt-1">{flaggedStudents.length} <span className="text-xs font-normal text-zinc-400">Unresolved</span></h4>
            </div>
            <div className={`shrink-0 min-w-[168px] p-5 rounded-2xl border ${isNight ? 'bg-white/5 border-white/10' : 'bg-zinc-50 border-zinc-200'}`}>
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 block font-mono">DAILY LOG REVIEW</span>
              <h4 className={`text-2xl font-black mt-1 whitespace-nowrap ${logReviewStats.pending > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {logReviewStats.pending} <span className="text-xs font-normal text-zinc-400">Awaiting KT Review ({logReviewStats.sent} sent)</span>
              </h4>
            </div>
          </div>

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
            <div className={`p-8 rounded-2xl border text-center ${isNight ? 'bg-brand-dark border-white/10' : 'bg-zinc-50 border-zinc-200'}`}>
              <p className={`text-sm font-bold ${isNight ? 'text-white' : 'text-zinc-800'}`}>No class yet</p>
              <p className="text-xs text-zinc-400 mt-1">Create your first class to see this week&apos;s vocab and student status here.</p>
            </div>
          ) : (
            <div className={`p-6 rounded-2xl border space-y-5 ${isNight ? 'bg-brand-dark border-white/10' : 'bg-zinc-50 border-zinc-200'}`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-4">
                <div>
                  <span className="text-[10px] font-mono font-bold text-orange-500 uppercase tracking-widest block">This Week</span>
                  <h4 className={`font-black text-base sm:text-lg ${isNight ? 'text-white' : 'text-zinc-900'}`}>
                    {selectedClass.name || selectedClass.className || 'Class'} • Week {selectedClass.activeWeekNumber || 1}
                  </h4>
                </div>
                {flaggedStudents.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('exceptions')}
                    className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold cursor-pointer hover:bg-amber-500/20 transition-colors"
                  >
                    ⚠️ {flaggedStudents.length} Flagged — Review
                  </button>
                )}
              </div>

              <div>
                <span className="text-[10px] font-bold text-orange-400 uppercase font-mono tracking-wider block mb-2">Target Vocab</span>
                {weeklyVocabWords.length === 0 ? (
                  <p className="text-xs text-zinc-400">No vocab set for this week yet — add it from the Curriculum tab.</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {weeklyVocabWords.map((word) => (
                      <span
                        key={word}
                        className={`px-2 py-1 rounded-md text-xs font-bold border ${
                          isNight ? 'bg-orange-500/20 text-orange-300 border-orange-500/30' : 'bg-orange-100 text-orange-800 border-orange-200'
                        }`}
                      >
                        {word}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <span className="text-[10px] font-bold text-orange-400 uppercase font-mono tracking-wider block mb-2">
                  Student Status ({activeRoster.length})
                </span>
                {activeRoster.length === 0 ? (
                  <p className="text-xs text-zinc-400">No active students in this class yet.</p>
                ) : (
                  <ul className="text-xs space-y-1.5">
                    {activeRoster.map((student: any) => (
                      <li
                        key={student.uid || student.studentName}
                        className={`flex justify-between items-center p-2 rounded ${isNight ? 'bg-white/5' : 'bg-white border border-zinc-200'}`}
                      >
                        <span className="font-medium">{student.studentName || student.name || 'Unnamed'}</span>
                        {student.flaggedException || student.weeklyMistakesCount > 0 ? (
                          <span className="text-[10px] font-bold text-amber-400 flex items-center gap-1">
                            <WarningCircle size={12} weight="fill" />
                            {student.weeklyMistakesCount > 0 ? `${student.weeklyMistakesCount} Error(s) Flagged` : 'Flagged'}
                          </span>
                        ) : student.hasScannedThisWeek ? (
                          <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                            <CheckCircle size={12} weight="fill" />
                            Synced
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-zinc-400">No scan yet</span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          {schoolId && <ActivityFeed isNight={isNight} isKo={isKo} schoolId={schoolId} />}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: FLAGGED STUDENT EXCEPTION CENTER */}
      {/* ========================================================================= */}
      {activeTab === 'exceptions' && (
        <div className="space-y-6">
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
            <WarningCircle size={20} className="text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs">
              <h4 className="font-bold text-amber-400">Director Exception Oversight Center</h4>
              <p className={isNight ? 'text-zinc-300' : 'text-zinc-700'}>
                Students flagged by a teacher from the roster&apos;s student detail view for
                academic or behavioral issues. Resolving a flag here clears it.
              </p>
            </div>
          </div>

          {logReviewStats.byClass.length > 0 && (
            <div className={`p-4 rounded-2xl border space-y-2 ${isNight ? 'bg-white/5 border-white/10' : 'bg-zinc-50 border-zinc-200'}`}>
              <h4 className="text-xs font-bold text-zinc-400 uppercase font-mono tracking-wider">
                Daily Logs Awaiting KT Review
              </h4>
              <div className="flex flex-wrap gap-2">
                {logReviewStats.byClass.map((c) => (
                  <span
                    key={c.classId}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500/10 border border-amber-500/30 text-amber-400"
                  >
                    {c.className}: {c.pending} pending
                  </span>
                ))}
              </div>
            </div>
          )}

          {flaggedStudents.length === 0 ? (
            <div className={`p-12 rounded-2xl border text-center text-xs ${isNight ? 'bg-white/5 border-white/10 text-zinc-400' : 'bg-zinc-50 border-zinc-200 text-zinc-500'}`}>
              No students are currently flagged.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {flaggedStudents.map((st: any) => (
                <div
                  key={st.uid}
                  className={`p-6 rounded-2xl border space-y-4 ${
                    isNight ? 'bg-brand-dark border-white/10' : 'bg-white border-zinc-200 shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-black text-sm text-white">{st.studentName || st.name || 'Unnamed'}</h4>
                      <span className="text-xs text-orange-400 font-mono">{st.email}</span>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      {st.flaggedException?.date}
                    </span>
                  </div>

                  <div className={`p-4 rounded-xl border text-xs leading-relaxed ${isNight ? 'bg-brand-dark border-white/5 text-zinc-300' : 'bg-zinc-50 border-zinc-200 text-zinc-800'}`}>
                    <span className="text-[10px] font-bold uppercase font-mono text-zinc-400 block mb-1">
                      Flagged Reason by {st.flaggedException?.teacherName}:
                    </span>
                    <p>{st.flaggedException?.reason}</p>
                  </div>

                  {phoneScriptFor === st.uid && (
                    <div className={`p-4 rounded-xl border text-xs leading-relaxed space-y-1 ${isNight ? 'bg-orange-500/5 border-orange-500/20 text-zinc-300' : 'bg-orange-50 border-orange-200 text-zinc-800'}`}>
                      <span className="text-[10px] font-bold uppercase font-mono text-orange-400 block mb-1">
                        Phone Talking Points
                      </span>
                      <p>1. Acknowledge class effort</p>
                      <p>2. Address: {st.flaggedException?.reason}</p>
                      <p>3. Agree on one concrete follow-up step with the parent before ending the call.</p>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs">
                    <button
                      type="button"
                      onClick={() => setPhoneScriptFor((prev) => (prev === st.uid ? null : st.uid))}
                      className="px-3 py-1.5 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 font-bold rounded-lg border border-orange-500/30 flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <span>📞</span>
                      <span>{phoneScriptFor === st.uid ? 'Hide Phone Script' : 'View Phone Script'}</span>
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
                      className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-bold rounded-lg border border-emerald-500/30 cursor-pointer transition-colors"
                    >
                      Resolve
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: BILLING — plan, seats, trial/renewal, always checkable */}
      {/* ========================================================================= */}
      {activeTab === 'billing' && (
        schoolId ? (
          <SchoolBillingPanel isNight={isNight} isKo={isKo} schoolId={schoolId} seatsTotal={seatsTotal || { ft: 0, kt: 0 }} trialStatus={trialStatus} onRequestPlanChange={onRequestPlanChange} />
        ) : (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400 font-bold">
            School profile still loading — billing info will be available once it finishes.
          </div>
        )
      )}

      {/* SEAT EXPANSION REQUEST MODAL */}
      {showSeatExpansionModal && (
        <div className="fixed inset-0 z-[550] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div
            ref={seatExpansionDialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="seat-expansion-title"
            tabIndex={-1}
            className={`relative w-full max-w-md p-6 sm:p-8 rounded-3xl border shadow-2xl space-y-6 text-left transition-colors ${
            isNight ? 'bg-[#0a0a0d] border-white/15 text-white' : 'bg-white border-zinc-300 text-zinc-900'
          }`}>
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-orange-500/20 text-orange-400 flex items-center justify-center font-black text-lg">
                  ➕
                </div>
                <div>
                  <h3 id="seat-expansion-title" className="font-black text-lg">교사 석 추가 (Seat Expansion)</h3>
                  <p className="text-xs text-zinc-400 font-mono">Current Allowance: {(seatsTotal?.ft || 0) + (seatsTotal?.kt || 0)} Seats</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setShowSeatExpansionModal(false); setSeatRequestSent(false); }}
                aria-label="Close"
                className="min-w-11 min-h-11 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {seatRequestSent ? (
              <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-3">
                <span className="text-3xl block">🎉</span>
                <h4 className="font-black text-emerald-400 text-base">교사 석 추가 요청 접수 완료!</h4>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  +{requestedExtraSeats}석 추가 요청이 등록되었고, 입금 계좌 정보를 이메일로 보내드렸습니다.<br />
                  입금 확인 후 24시간 이내에 추가 교사 계정 초대가 활성화됩니다.
                </p>
                <button
                  type="button"
                  onClick={() => { setShowSeatExpansionModal(false); setSeatRequestSent(false); }}
                  className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  확인 완료
                </button>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                <p className={isNight ? 'text-zinc-300' : 'text-zinc-700'}>
                  원어민 강사(FT) 또는 한국인 코티처(KT)를 추가 등록하기 위해 교사 계정 석을 확장합니다. (석당 ₩19,000 / 월)
                </p>

                <div className="space-y-2">
                  <label className="font-bold text-zinc-400 block font-mono">추가 교사 석 수 선택:</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[+1, +3, +5].map((count) => (
                      <button
                        key={count}
                        type="button"
                        onClick={() => setRequestedExtraSeats(count)}
                        className={`p-3 rounded-xl border text-xs font-black transition-colors cursor-pointer ${
                          requestedExtraSeats === count
                            ? 'bg-orange-500 border-orange-500 text-black shadow-md'
                            : isNight ? 'bg-white/5 border-white/10 text-zinc-400' : 'bg-zinc-100 border-zinc-200 text-zinc-700'
                        }`}
                      >
                        +{count}석 추가
                      </button>
                    ))}
                  </div>
                </div>

                <div className={`p-4 rounded-2xl border ${isNight ? 'bg-white/5 border-white/10' : 'bg-zinc-50 border-zinc-200'}`}>
                  <div className="flex justify-between items-center text-xs font-mono">
                    <span className="text-zinc-400">추가 석 요금:</span>
                    <strong className="text-orange-400">₩{(requestedExtraSeats * 19000).toLocaleString()} / 월</strong>
                  </div>
                  <p className="text-[10px] text-zinc-400 mt-1">계좌이체 세금계산서로합산 청구됩니다.</p>
                </div>

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
                  className="w-full py-3.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-black font-black text-xs rounded-xl shadow-lg transition-[background-color,opacity] cursor-pointer"
                >
                  {isRequestingSeats ? '요청 중...' : `⚡ +${requestedExtraSeats}석 추가 세금계산서 청구하기 →`}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
