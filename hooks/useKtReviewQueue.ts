import { useEffect, useMemo, useRef, useState } from 'react';
import { collection, doc, getDocs, orderBy, limit as fbLimit, query, serverTimestamp, updateDoc, where } from 'firebase/firestore';
import { dbInstance } from '../services/database';
import { consolidateStudentReports, formatConsolidatedDraft, ConsolidatedStudentDay } from '../src/services/consolidateStudentReports';
import type { UserProfile } from '../types';

type ToastFn = (opts: { type: 'error' | 'success'; message: string }) => void;

// Owns the KT-only review-queue state: the cross-class pending-log query, its
// consolidated-by-student-day view, and the approve/send flow. Kept separate
// from the FT log-submission code path (which still lives in TeacherPage and
// writes into this hook's `setKtPendingLogs`/`setActiveKtLogId` — the actual
// FT->KT handoff is genuinely shared state, not KT-exclusive, see the
// TeacherPage comment on handleLogSubmit).
export function useKtReviewQueue(
  educatorRole: 'ft' | 'kt',
  classes: any[],
  selectedClass: { id: string } | null | undefined,
  user: UserProfile | null,
  showToast: ToastFn,
  isKo: boolean,
  studentNamesByUid: Record<string, string>
) {
  const [ktPendingLogs, setKtPendingLogs] = useState<any[]>([]);
  const [activeKtLogId, setActiveKtLogId] = useState<string | null>(null);
  const [ktDraftDirty, setKtDraftDirty] = useState(false);
  const [justCopiedLogId, setJustCopiedLogId] = useState<string | null>(null);
  const [ktLogsLoadError, setKtLogsLoadError] = useState(false);
  const ktApproveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const confirmDiscardKtDraft = () => {
    if (!ktDraftDirty) return true;
    return window.confirm(
      isKo
        ? '저장되지 않은 수정 내용이 있습니다. 계속하면 사라집니다. 계속하시겠습니까?'
        : 'You have unsaved edits to this report. They will be lost if you continue. Continue?'
    );
  };

  // Covers a hard tab close/refresh while a KT edit is unsaved.
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (!ktDraftDirty) return;
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [ktDraftDirty]);

  // KT review queue, cross-class: every pending log from every class this
  // KT has access to (`classes`, already loaded via fetchClasses's
  // owned+assigned query), not just whichever class is currently selected —
  // required so a student in two classes with two different FTs shows up
  // for consolidation under one student-day card instead of two invisible
  // halves.
  useEffect(() => {
    if (educatorRole !== 'kt') return;
    const realClasses = classes.filter((c: any) => c?.id && !c.isDemo);
    if (realClasses.length === 0) {
      setKtPendingLogs([]);
      setActiveKtLogId(null);
      return;
    }
    setKtLogsLoadError(false);
    (async () => {
      try {
        const perClassLogs = await Promise.all(
          realClasses.map(async (c: any) => {
            const logsRef = collection(dbInstance, 'classes', c.id, 'logs');
            const logsQuery = query(logsRef, where('reviewStatus', '==', 'pending_review'), orderBy('createdAt', 'desc'), fbLimit(50));
            const snap = await getDocs(logsQuery);
            return snap.docs.map((d) => ({ id: d.id, classId: c.id, className: c.name, ...d.data() } as any));
          })
        );
        setKtPendingLogs(perClassLogs.flat().reverse()); // oldest pending first
      } catch (err) {
        console.error('Failed to load cross-class KT review queue:', err);
        setKtLogsLoadError(true);
      }
    })();
  }, [educatorRole, classes.map((c: any) => c?.id).join('|')]);

  // Cancel any pending KT-approve "remove from queue" timeout when switching
  // classes or unmounting, so it can't fire against a different class's
  // freshly-loaded log list.
  useEffect(() => {
    return () => {
      if (ktApproveTimeoutRef.current) clearTimeout(ktApproveTimeoutRef.current);
    };
  }, [selectedClass?.id]);

  // Consolidated per-student-per-day view of the cross-class pending queue
  // — a student in two classes with two different FTs used to produce two
  // entirely separate review items; this groups everything touching them
  // that day (keyed on studentUid, see consolidateStudentReports) into one
  // review unit instead of leaving the KT to notice and merge by hand.
  const ktConsolidatedGroups = useMemo(
    () => consolidateStudentReports(ktPendingLogs, user?.schoolName || 'Chekki Master Academy', studentNamesByUid),
    [ktPendingLogs, user, studentNamesByUid]
  );
  const groupKey = (g: ConsolidatedStudentDay) => g.studentUid || `custom:${g.studentName.trim().toLowerCase()}:${g.date}`;
  const activeKtGroup = ktConsolidatedGroups.find((g) => groupKey(g) === activeKtLogId) || ktConsolidatedGroups[0] || null;
  // KtReviewQueue is memoized, but a fresh .map() literal built inline in JSX
  // on every render would defeat that regardless — this is the one place the
  // derived shape actually needs to be recomputed (audit action #6).
  const ktQueueLogs = useMemo(
    () =>
      ktConsolidatedGroups.map((g) => ({
        id: groupKey(g),
        studentName: g.studentName,
        // A student can appear in more than one class the same day (see
        // consolidateStudentReports) — join every distinct source class name
        // so the queue's class filter can match on any of them.
        className: [...new Set(g.entries.map((e) => e.className).filter(Boolean))].join(', '),
        date: g.date,
        flaggedCount: g.entries.filter((e) => !!e.exceptionParagraph).length,
      })),
    [ktConsolidatedGroups]
  );

  const handleKtApprove = async (approvedSummary: string, approvedExceptions: { studentName: string; approvedText: string }[]): Promise<boolean> => {
    if (!activeKtGroup || activeKtGroup.entries.length === 0 || !user?.uid) return false;
    const activeGroupKey = groupKey(activeKtGroup);
    try {
      // A consolidated student-day draft can be assembled from multiple
      // source logs across different classes — approving it has to mark
      // every one of them "sent", not just one, or the others would still
      // show up as pending next time the queue loads.
      await Promise.all(
        activeKtGroup.entries.map((e) => {
          const logRef = doc(dbInstance, 'classes', e.classId, 'logs', e.logId);
          return updateDoc(logRef, {
            approvedSummary,
            approvedExceptions,
            reviewStatus: 'sent',
            reviewedByUid: user.uid,
            reviewedByName: user?.name || user?.email || 'Unknown teacher',
            sentAt: serverTimestamp(),
          });
        })
      );
      // Show the checkmark on the queue chip first, then remove it — an
      // instant vanish left no visible confirmation of what had just been
      // sent (same short-lived-success pattern NativeKtDashboard already
      // uses for its own "Copied!" button state).
      const sentLogIds = new Set(activeKtGroup.sourceLogIds);
      setJustCopiedLogId(activeGroupKey);
      if (ktApproveTimeoutRef.current) clearTimeout(ktApproveTimeoutRef.current);
      ktApproveTimeoutRef.current = setTimeout(() => {
        setKtPendingLogs((prev) => prev.filter((l) => !sentLogIds.has(l.id)));
        setJustCopiedLogId((cur) => (cur === activeGroupKey ? null : cur));
        ktApproveTimeoutRef.current = null;
      }, 1400);
      return true;
    } catch (err) {
      console.error('Failed to save KT-reviewed report:', err);
      // The UI (copy/share buttons) previously reported success regardless of
      // this write's outcome, so a failed approve silently never reached
      // parents with no indication to the KT that it didn't go through
      // (Audit: silent FT->KT persist failure). NativeKtDashboard now awaits
      // this return value before showing its own "sent" state.
      showToast({
        type: 'error',
        message: isKo
          ? '⚠️ 학부모 전송 승인이 저장되지 않았습니다. 다시 시도해주세요.'
          : "⚠️ The approval wasn't saved — parents won't see this yet. Please try again.",
      });
      return false;
    }
  };

  return {
    ktPendingLogs, setKtPendingLogs,
    activeKtLogId, setActiveKtLogId,
    ktDraftDirty, setKtDraftDirty,
    justCopiedLogId,
    ktLogsLoadError, setKtLogsLoadError,
    confirmDiscardKtDraft,
    ktConsolidatedGroups,
    activeKtGroup,
    ktQueueLogs,
    groupKey,
    handleKtApprove,
    formatConsolidatedDraft,
  };
}
