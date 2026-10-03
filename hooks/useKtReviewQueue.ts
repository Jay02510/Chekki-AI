import { useEffect, useState } from 'react';
import * as Sentry from '@sentry/react';
import { collection, doc, getDocs, orderBy, limit as fbLimit, query, serverTimestamp, where, writeBatch } from 'firebase/firestore';
import { dbInstance } from '../services/database';
import type { UserProfile } from '../types';
import { parentReportRecipients, type ApprovedNote } from '../src/services/parentReports';

export type { ApprovedNote };

type ToastFn = (opts: { type: 'error' | 'success'; message: string }) => void;

/** One FT/KT class-day submission waiting for KT review (classes/{id}/logs/{id}). */
export interface PendingClassLog {
  id: string;
  classId: string;
  className?: string;
  date?: string;
  lessonTopic?: string;
  createdAt?: any;
  aiKoreanSummary?: string;
  aiEnglishSummary?: string;
  aiStudentReports?: Array<{
    studentName: string;
    studentUid?: string | null;
    koreanUpdate: string;
    category?: 'praise' | 'attention';
  }>;
  enrolledStudentUids?: string[];
}

export const logDate = (log: PendingClassLog) =>
  log.date || (log.createdAt?.toDate ? log.createdAt.toDate().toISOString().slice(0, 10) : '');

// Owns the KT review queue: every pending class-day log across the KT's
// classes, reviewed and approved one class-day at a time.
//
// Approval writes two things in one batch:
//  - the log doc itself (approvedSummary = the class paragraph only,
//    approvedExceptions = the per-student notes) for staff views, and
//  - one classes/{classId}/parentReports/{logId}_{uid} doc per enrolled
//    student, holding the class paragraph plus only THAT student's note.
// Parents read only their own parentReports doc — the log doc carries every
// child's note, so it stays staff-only (see firestore.rules).
export function useKtReviewQueue(
  educatorRole: 'ft' | 'kt',
  classes: any[],
  user: UserProfile | null,
  showToast: ToastFn,
  isKo: boolean
) {
  const [ktPendingLogs, setKtPendingLogs] = useState<PendingClassLog[]>([]);
  const [ktDraftDirty, setKtDraftDirty] = useState(false);
  const [ktLogsLoadError, setKtLogsLoadError] = useState(false);

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

  // Cross-class: every pending log from every class this KT can access, not
  // just the class selected in the header.
  useEffect(() => {
    if (educatorRole !== 'kt') return;
    const realClasses = classes.filter((c: any) => c?.id && !c.isDemo);
    if (realClasses.length === 0) {
      setKtPendingLogs([]);
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
            return snap.docs.map((d) => ({ id: d.id, classId: c.id, className: c.name, ...d.data() } as PendingClassLog));
          })
        );
        setKtPendingLogs(perClassLogs.flat().reverse()); // oldest pending first
      } catch (err) {
        console.error('Failed to load cross-class KT review queue:', err);
        Sentry.captureException(err, {
          tags: { area: 'ktReviewQueue' },
          extra: { educatorRole, classIds: realClasses.map((c: any) => c.id) },
        });
        setKtLogsLoadError(true);
      }
    })();
  }, [educatorRole, classes.map((c: any) => c?.id).join('|')]);

  const approveClassLog = async (log: PendingClassLog, summary: string, notes: ApprovedNote[]): Promise<boolean> => {
    if (!user?.uid) return false;
    const reviewedByName = user.name || user.email || 'Unknown teacher';
    const recipients = parentReportRecipients(log.enrolledStudentUids, notes);
    try {
      const batch = writeBatch(dbInstance);
      batch.update(doc(dbInstance, 'classes', log.classId, 'logs', log.id), {
        approvedSummary: summary,
        approvedExceptions: notes,
        reviewedStudentUids: recipients.map((r) => r.studentUid),
        reviewStatus: 'sent',
        reviewedByUid: user.uid,
        reviewedByName,
        sentAt: serverTimestamp(),
      });
      for (const { studentUid: uid, note } of recipients) {
        batch.set(doc(dbInstance, 'classes', log.classId, 'parentReports', `${log.id}_${uid}`), {
          classId: log.classId,
          logId: log.id,
          studentUid: uid,
          className: log.className || '',
          date: logDate(log),
          lessonTopic: log.lessonTopic || '',
          summary,
          note,
          reviewedByName,
          sentAt: serverTimestamp(),
        });
      }
      await batch.commit();
      setKtPendingLogs((prev) => prev.filter((l) => l.id !== log.id));
      setKtDraftDirty(false);
      return true;
    } catch (err) {
      console.error('Failed to save KT-reviewed report:', err);
      Sentry.captureException(err, { tags: { area: 'ktApprove' }, extra: { classId: log.classId, logId: log.id } });
      showToast({
        type: 'error',
        message: isKo
          ? '⚠️ 승인이 저장되지 않았습니다. 학부모에게 아직 보이지 않습니다. 다시 시도해주세요.'
          : "⚠️ The approval wasn't saved, so parents can't see it yet. Please try again.",
      });
      return false;
    }
  };

  return {
    ktPendingLogs, setKtPendingLogs,
    ktDraftDirty, setKtDraftDirty,
    ktLogsLoadError,
    confirmDiscardKtDraft,
    approveClassLog,
  };
}
