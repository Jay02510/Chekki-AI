import { useEffect, useRef, type Dispatch, type SetStateAction } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { dbInstance } from '../services/database';
import type { UserProfile } from '../types';
import type { useToast } from '../contexts/ToastContext';
import type { PendingClassLog } from './useKtReviewQueue';
import {
  generateGeneralClassSummary,
  generateStudentExceptionReport,
  clearOfflineDraft,
  ClassLogPayload,
  enqueuePendingLogSubmission,
  getPendingLogQueue,
  removePendingLogSubmission,
  QueuedLogSubmission,
} from '../src/services/aiGenerator';

// FT/KT daily log submission: AI drafting, the Firestore write, and the
// offline queue that retries a log once the device is back online.
// Extracted from TeacherPage.tsx; returns the form's submit handler.
export function useClassLogSubmission(
  user: UserProfile | null,
  selectedClass: any,
  educatorRole: 'ft' | 'kt',
  setSubmittedLogs: Dispatch<SetStateAction<any[]>>,
  setKtPendingLogs: Dispatch<SetStateAction<PendingClassLog[]>>,
  showToast: ReturnType<typeof useToast>['showToast'],
  isKo: boolean
) {
  // Queue ids of submissions being sent right now, so the drain below never
  // sends the same log twice while a fresh submit is still in flight.
  const inFlightLogIdsRef = useRef(new Set<string>());

  // Core submit: AI generation + Firestore persist, parameterized on
  // classId/teacherUid/authorRole (rather than reading selectedClass/user/
  // educatorRole directly) so the offline queue drain below can replay a
  // queued submission for whichever class/role it was originally queued
  // under, even if the live UI has since switched classes. Returns whether
  // it actually reached Firestore — `isQueuedRetry` only changes whether a
  // network failure here re-queues (a fresh submission) or is left for the
  // next drain pass (an already-queued one, to avoid an infinite retry loop
  // spamming toasts every time `online` fires).
  const submitClassLog = async (
    payload: ClassLogPayload,
    classId: string,
    teacherUid: string,
    authorRole: 'ft' | 'kt',
    isQueuedRetry = false
  ): Promise<boolean> => {
    try {
      // Summary and student notes are independent AI calls — run together.
      const [summary, studentReports] = await Promise.all([
        generateGeneralClassSummary({ ...payload, authorRole }),
        Promise.all(payload.exceptions.map(async (ex) => {
          const { text: updateText, failed } = await generateStudentExceptionReport({
            studentName: ex.studentName,
            classTopic: payload.lessonTopic,
            textbook: payload.textbook,
            exceptionDetails: ex.details,
            category: ex.type,
          });
          // No per-exception phoneTalkingPoints call here anymore — the old
          // same-day phone-consult drawer that displayed it was removed in
          // favor of ReportCardModal's weekly consolidated talking points
          // (strictly more context, same purpose), so generating this per
          // submission was a wasted AI call with nothing left to read it.
          return {
            studentName: ex.studentName,
            studentUid: ex.studentUid ?? null,
            koreanUpdate: updateText,
            phoneTalkingPoints: [],
            category: ex.type,
            failed,
          };
        })),
      ]);
      // Stay on the FT's own dashboard after submit — the kt_script tab
      // is the KT's review workspace, not an FT-facing "success" screen.
      // FT gets a toast confirmation below instead of being bounced there.

      // Persist the log AND the AI-generated KT script so the handoff
      // survives across accounts/devices — it used to live only in
      // `ftLogOutput` React state, which meant a KT logging in separately
      // never saw it (Audit: FT->KT handoff). Visible in the FT history
      // tab, the KT review queue, and — once reviewed and sent — to
      // parents of enrolled students. Best-effort — an AI report was
      // already generated and shown, so a Firestore hiccup here shouldn't
      // block the teacher.
      const logsRef = collection(dbInstance, 'classes', classId, 'logs');
      const docRef = await addDoc(logsRef, {
        ...payload,
        classId,
        teacherUid,
        teacherName: user?.name || '',
        createdAt: serverTimestamp(),
        aiKoreanSummary: summary.korean,
        aiEnglishSummary: summary.english,
        aiStudentReports: studentReports,
        aiSummaryFallback: summary.fallback,
        authorRole,
        reviewStatus: 'pending_review',
      });
      const newLog = { id: docRef.id, ...payload };
      setSubmittedLogs((prev) => [newLog, ...prev]);
      clearOfflineDraft();
      // Only the KT's own inbox shows pending logs — an FT's submit lands
      // in the KT's queue on their next load.
      if (authorRole === 'kt') {
        setKtPendingLogs((prev) => [...prev, {
          ...payload,
          id: docRef.id,
          classId,
          aiKoreanSummary: summary.korean,
          aiEnglishSummary: summary.english,
          aiStudentReports: studentReports,
          aiSummaryFallback: summary.fallback,
          authorRole,
        }]);
      }
      showToast({
        type: 'success',
        message: authorRole === 'kt'
          ? (isKo ? '일지가 저장되었습니다. 학부모 리포트에서 검토 후 보내세요.' : 'Log saved. Review and send it from Parent reports.')
          : (isKo ? '한국인 교사에게 검토 요청을 보냈습니다!' : 'Sent to your KT for review!'),
      });

      // No per-submission email to the KT here — a daily digest cron
      // (api/create-teacher-invite.ts action=send_pending_digests)
      // batches every pending_review log into one summary email instead
      // of firing one email per FT submission (20 kids => 20 emails).
      // This log is already visible in the KT's review queue above.
      return true;
    } catch (err) {
      console.error('Failed to submit class log:', err);
      // A no-signal classroom (common in academy basements) used to just
      // fail this outright, forcing the FT to redo the whole form once back
      // online. Queue it instead of losing it — the drain effect below
      // retries automatically the moment connectivity returns.
      if (typeof navigator !== 'undefined' && !navigator.onLine && !isQueuedRetry) {
        enqueuePendingLogSubmission({ classId, teacherUid, authorRole, payload });
        showToast({
          type: 'success',
          message: isKo
            ? '오프라인 상태예요. 인터넷이 연결되면 자동으로 전송됩니다.'
            : "You're offline — this will send automatically once you're back online.",
        });
        return true;
      }
      if (!isQueuedRetry) {
        showToast({
          type: 'error',
          message: isKo
            ? '일지 생성에 실패했습니다. 다시 제출해주세요.'
            : "Couldn't generate the report from your log. Please try submitting again.",
        });
      }
      return false;
    }
  };

  // Retries every queued offline submission — called once on mount (covers
  // a submission queued in a previous session/tab) and again whenever the
  // browser regains connectivity. Left in the queue (silently) on repeat
  // failure so it retries next time rather than dropping the log.
  const drainingQueueRef = useRef(false);
  const drainPendingLogQueue = async () => {
    if (drainingQueueRef.current) return;
    const queue = getPendingLogQueue();
    if (queue.length === 0) return;
    drainingQueueRef.current = true;
    try {
      for (const item of queue as QueuedLogSubmission[]) {
        if (inFlightLogIdsRef.current.has(item.localId)) continue;
        inFlightLogIdsRef.current.add(item.localId);
        try {
          const ok = await submitClassLog(item.payload, item.classId, item.teacherUid, item.authorRole, true);
          if (ok) removePendingLogSubmission(item.localId);
        } finally {
          inFlightLogIdsRef.current.delete(item.localId);
        }
      }
    } finally {
      drainingQueueRef.current = false;
    }
  };
  useEffect(() => {
    drainPendingLogQueue();
    window.addEventListener('online', drainPendingLogQueue);
    return () => window.removeEventListener('online', drainPendingLogQueue);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Returns true once the log is safe (queued locally), so the form can
  // clear right away. AI drafting (~10s) and the Firestore write continue in
  // the background; the queue retries on the next load or reconnect if the
  // tab closes or the network drops before it finishes.
  const handleLogSubmit = (payload: ClassLogPayload): boolean => {
    if (!selectedClass?.id || selectedClass.isDemo || !user?.uid) {
      // No real class yet (demo/placeholder class, or classes still
      // loading) — there's nothing to send to a KT.
      showToast({
        type: 'error',
        message: isKo
          ? '아직 등록된 학급이 없어 저장되지 않았습니다. 원장님께 학급 등록을 요청하세요.'
          : "This is a preview only — you're not assigned to a real class yet, so nothing was sent. Ask your director to add you to a class.",
      });
      return false;
    }
    const item = { classId: selectedClass.id, teacherUid: user.uid, authorRole: educatorRole, payload };
    const queued = enqueuePendingLogSubmission(item);
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      if (!queued) return false;
      showToast({
        type: 'success',
        message: isKo
          ? '오프라인 상태예요. 인터넷이 연결되면 자동으로 전송됩니다.'
          : "You're offline — this will send automatically once you're back online.",
      });
      return true;
    }
    showToast({
      type: 'success',
      message: educatorRole === 'kt'
        ? (isKo ? '일지를 저장하는 중입니다. 잠시 후 학부모 리포트에 나타납니다.' : 'Saving your log. It will appear in Parent reports in a moment.')
        : (isKo ? 'KT에게 보내는 중입니다. 다른 작업을 계속하셔도 됩니다.' : 'Sending to your KT. You can keep working.'),
    });
    if (queued) inFlightLogIdsRef.current.add(queued.localId);
    void submitClassLog(payload, item.classId, item.teacherUid, item.authorRole, true)
      .then((ok) => {
        if (ok && queued) removePendingLogSubmission(queued.localId);
        if (!ok) {
          showToast({
            type: 'error',
            message: queued
              ? (isKo ? '아직 전송되지 않았습니다. 다시 접속하거나 인터넷이 연결되면 자동으로 다시 시도합니다.' : "Couldn't send yet. Chekki will retry automatically when you reopen this page or reconnect.")
              : (isKo ? '일지 전송에 실패했습니다. 다시 제출해주세요.' : "Couldn't send your log. Please submit it again."),
          });
        }
      })
      .finally(() => {
        if (queued) inFlightLogIdsRef.current.delete(queued.localId);
      });
    // Without local storage there's no retry copy, so keep the form filled.
    return !!queued;
  };

  return handleLogSubmit;
}
