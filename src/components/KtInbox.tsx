import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowClockwise, ArrowCounterClockwise, Bell, BellSlash, CaretLeft, CaretRight, CheckCircle, Copy, Sparkle, Warning } from '@phosphor-icons/react';
import { doc, updateDoc } from 'firebase/firestore';
import { dbInstance } from '../../services/database';
import { logDate, logTime, type ApprovedNote, type PendingClassLog } from '../../hooks/useKtReviewQueue';
import { noteReachesApp } from '../services/parentReports';
import { generateGeneralClassSummary, generateStudentExceptionReport, type RewriteStyle } from '../services/aiGenerator';
import type { UserProfile } from '../../types';

interface Props {
  isNight: boolean;
  isKo: boolean;
  logs: PendingClassLog[];
  loadError: boolean;
  academyName: string;
  user: UserProfile | null;
  approve: (log: PendingClassLog, summary: string, notes: ApprovedNote[], summaryEn: string) => Promise<boolean>;
  discard: (log: PendingClassLog) => Promise<boolean>;
  setDirty: (dirty: boolean) => void;
  confirmDiscard: () => boolean;
}

const MOBILE_QUERY = '(max-width: 767px)';
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(MOBILE_QUERY).matches
  );
  useEffect(() => {
    const mq = window.matchMedia(MOBILE_QUERY);
    const onChange = () => setIsMobile(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return isMobile;
}

const dupKey = (log: PendingClassLog) => `${log.classId}|${logDate(log)}|${(log.lessonTopic || '').trim().toLowerCase()}`;
const daysOld = (log: PendingClassLog) => {
  const d = log.createdAt?.toDate?.() ?? (log.date ? new Date(log.date) : null);
  return d ? Math.floor((Date.now() - d.getTime()) / 86_400_000) : 0;
};

const familyCount = (log: PendingClassLog) =>
  (log.enrolledStudentUids || []).filter((uid) => !uid.startsWith('pending:')).length;

// Share sheet on touch devices (hands the text straight to KakaoTalk on a
// phone), clipboard otherwise — desktop Chrome/Safari also expose
// navigator.share, but a KT at a computer expects Copy to copy.
async function shareOrCopy(text: string): Promise<'shared' | 'copied' | 'cancelled' | 'failed'> {
  if (typeof navigator.share === 'function' && window.matchMedia('(pointer: coarse)').matches) {
    try {
      await navigator.share({ text });
      return 'shared';
    } catch (e) {
      if ((e as Error)?.name === 'AbortError') return 'cancelled';
    }
  }
  try {
    await navigator.clipboard.writeText(text);
    return 'copied';
  } catch {
    return 'failed';
  }
}

// KT inbox: one item per class-day, not per student. The KT reads the class
// summary once and every student note on one screen, approves once, and
// every family in the class gets it in the app. KakaoTalk copies are
// optional, offered after publishing.
export function KtInbox({ isNight, isKo, logs, loadError, academyName, user, approve, discard, setDirty, confirmDiscard }: Props) {
  const isMobile = useIsMobile();
  // A snapshot, not an id: after approval the log leaves `logs`, but the
  // review stays on screen to show the done state and KakaoTalk copies.
  const [openLog, setOpenLog] = useState<PendingClassLog | null>(null);
  const current = openLog ?? (isMobile ? null : logs[0] ?? null);
  const isOpen = !!openLog;
  const dupCounts = new Map<string, number>();
  logs.forEach((l) => dupCounts.set(dupKey(l), (dupCounts.get(dupKey(l)) || 0) + 1));

  // Bulk send for a KT with a stack of logs that need no edits. Only clean
  // drafts qualify: anything the AI flagged (template summary, failed
  // translation) or a possible duplicate still needs a person to look.
  const isClean = (l: PendingClassLog) =>
    !l.aiSummaryFallback &&
    !!l.aiKoreanSummary?.trim() &&
    !(l.aiStudentReports || []).some((r) => r.failed || isUntranslated(r.koreanUpdate || '')) &&
    (dupCounts.get(dupKey(l)) || 0) <= 1;
  const cleanLogs = logs.filter(isClean);
  const [bulkSending, setBulkSending] = useState(false);
  const sendAllClean = async () => {
    if (!confirmDiscard()) return;
    const familiesTotal = new Set(cleanLogs.flatMap((l) => (l.enrolledStudentUids || []).filter((uid) => !uid.startsWith('pending:')))).size;
    const msg = isKo
      ? `AI 초안 그대로 ${cleanLogs.length}개 리포트를 ${familiesTotal}가정에 보낼까요? 보낸 뒤에는 취소할 수 없어요.`
      : `Send ${cleanLogs.length} reports to ${familiesTotal} families exactly as drafted? This can't be undone.`;
    if (!window.confirm(msg)) return;
    setBulkSending(true);
    setDirty(false);
    setOpenLog(null);
    for (const l of cleanLogs) {
      const notes = (l.aiStudentReports || [])
        .map((r) => ({ studentName: r.studentName, studentUid: r.studentUid ?? null, approvedText: (r.koreanUpdate || '').trim() }))
        .filter((n) => n.approvedText);
      // Stops at the first failure; approve() already shows the error toast.
      if (!(await approve(l, l.aiKoreanSummary!.trim(), notes, l.aiEnglishSummary || ''))) break;
    }
    setBulkSending(false);
  };

  const select = (log: PendingClassLog) => {
    if (log.id === current?.id || !confirmDiscard()) return;
    setDirty(false);
    setOpenLog(log);
  };

  // Phones: the review is a full-screen layer with its own history entry,
  // so the OS back gesture closes it instead of leaving the page.
  useEffect(() => {
    if (!isMobile || !isOpen) return;
    window.history.pushState({ ktReview: true }, '');
    const onPop = () => {
      if (!confirmDiscard()) {
        window.history.pushState({ ktReview: true }, '');
        return;
      }
      setDirty(false);
      setOpenLog(null);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobile, isOpen]);

  const close = () => {
    if (isMobile) window.history.back();
    else setOpenLog(null);
  };

  const goNext = () => {
    const next = logs.find((l) => l.id !== current?.id) ?? null;
    if (next) setOpenLog(next);
    else close();
  };

  const muted = 'text-ink-3';

  const review = current && (
    <KtClassReview
      key={current.id}
      isNight={isNight}
      isKo={isKo}
      log={current}
      academyName={academyName}
      remaining={logs.filter((l) => l.id !== current.id).length}
      approve={async (summary, notes, summaryEn, stayOnScreen) => {
        if (stayOnScreen) setOpenLog(current);
        return approve(current, summary, notes, summaryEn);
      }}
      setDirty={setDirty}
      onNext={goNext}
      onDiscard={async () => {
        const msg = isKo
          ? '이 일지를 학부모께 보내지 않고 삭제할까요? (중복이거나 잘못 제출된 경우)'
          : 'Discard this log without sending it to parents? Use this for duplicates or mistakes.';
        if (!window.confirm(msg)) return;
        if (await discard(current)) goNext();
      }}
    />
  );

  return (
    <div className="max-w-6xl mx-auto w-full space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight break-keep">
            {isKo ? '학부모 리포트' : 'Parent reports'}
          </h2>
          <p className={`text-sm mt-1 ${muted}`}>
            {logs.length === 0
              ? isKo ? '검토할 리포트가 없습니다' : 'Nothing to review'
              : isKo ? `${logs.length}개 리포트 검토 대기` : `${logs.length} ${logs.length === 1 ? 'report' : 'reports'} to review`}
          </p>
        </div>
        <DigestSettings isNight={isNight} isKo={isKo} user={user} />
      </div>

      {loadError && (
        <p role="alert" className="p-3.5 rounded-lg border text-sm bg-wrong-soft border-rule text-wrong">
          {isKo
            ? '리포트 대기열을 불러오지 못했습니다. 새로고침 후 다시 시도해주세요.'
            : "Couldn't load the review queue. Refresh the page and try again."}
        </p>
      )}

      {logs.length === 0 && !openLog ? (
        <div className={`p-8 sm:p-12 rounded-lg border text-center space-y-3 bg-surface border-rule`}>
          <CheckCircle size={32} weight="bold" className="mx-auto text-correct" />
          <h3 className="text-lg font-extrabold">{isKo ? '모두 확인했습니다' : "You're all caught up"}</h3>
          <p className={`text-sm max-w-sm mx-auto break-keep ${muted}`}>
            {isKo
              ? '선생님이 수업 일지를 제출하면 여기에 수업별로 표시됩니다. 한 번 검토하고 승인하면 반 전체 학부모님께 전달됩니다.'
              : 'When a teacher logs a class, it shows up here. Review it once and approve, and every family in that class gets it.'}
          </p>
        </div>
      ) : (
        <div className="md:grid md:grid-cols-[17rem_minmax(0,1fr)] md:gap-6 md:items-start">
          <div className="space-y-3 md:sticky md:top-4">
          {cleanLogs.length >= 2 && (
            <button
              type="button"
              onClick={sendAllClean}
              disabled={bulkSending}
              className="btn-press w-full min-h-11 px-4 rounded-md text-sm font-bold ring-1 ring-inset ring-rule bg-surface hover:bg-sunken cursor-pointer disabled:cursor-default disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {bulkSending && <Sparkle size={14} weight="bold" className="animate-spin" />}
              {bulkSending
                ? (isKo ? '보내는 중...' : 'Sending...')
                : isKo ? `수정 없이 ${cleanLogs.length}개 모두 보내기` : `Send all ${cleanLogs.length} as drafted`}
            </button>
          )}
          <ul className="space-y-2" aria-label={isKo ? '검토할 수업' : 'Classes to review'}>
            {logs.map((log) => {
              const notes = log.aiStudentReports?.length || 0;
              const age = daysOld(log);
              const dup = (dupCounts.get(dupKey(log)) || 0) > 1;
              const active = !isMobile && log.id === current?.id;
              return (
                <li key={log.id}>
                  <button
                    type="button"
                    onClick={() => select(log)}
                    aria-current={active ? 'true' : undefined}
                    className={`w-full text-left px-4 py-3 min-h-16 rounded-lg border flex items-center gap-3 cursor-pointer transition-colors active:scale-[0.99] ${
                      active
                        ? 'border-line bg-line-soft'
                        : 'border-rule bg-surface hover:bg-sunken'
                    }`}
                  >
                    {/* Date + topic lead: every row in one KT's queue is
                        often the same class, so the class name can't tell
                        rows apart. */}
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-bold truncate">
                        {[logDate(log), log.lessonTopic].filter(Boolean).join(' · ') || log.className || (isKo ? '수업' : 'Class')}
                      </span>
                      <span className={`block text-xs mt-0.5 truncate ${muted}`}>
                        {[log.className, logTime(log)].filter(Boolean).join(' · ')}
                      </span>
                      {(age >= 2 || dup) && (
                        <span className="mt-1 flex flex-wrap gap-1">
                          {age >= 2 && (
                            <span className="px-1.5 py-0.5 rounded-md text-[12px] font-bold bg-sunken text-ink-2 tabular-nums">
                              {isKo ? `${age}일 대기` : `Waiting ${age}d`}
                            </span>
                          )}
                          {dup && (
                            <span className="px-1.5 py-0.5 rounded-md text-[12px] font-bold bg-wrong-soft text-wrong">
                              {isKo ? '중복 가능성' : 'Possible duplicate'}
                            </span>
                          )}
                        </span>
                      )}
                    </span>
                    {notes > 0 && (
                      <span className={`shrink-0 px-2 py-0.5 rounded-md text-[12px] font-bold bg-line-soft text-line-ink`}>
                        {isKo ? `노트 ${notes}` : `${notes} ${notes === 1 ? 'note' : 'notes'}`}
                      </span>
                    )}
                    <CaretRight size={14} weight="bold" className={`shrink-0 md:hidden ${muted}`} />
                  </button>
                </li>
              );
            })}
          </ul>
          </div>

          {!isMobile && <div className="mt-6 md:mt-0">{review}</div>}
        </div>
      )}

      {isMobile && openLog && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          aria-label={openLog.className || (isKo ? '수업 리포트' : 'Class report')}
          className={`fixed inset-0 z-[380] overflow-y-auto bg-ground text-ink`}
        >
          <div className={`sticky top-0 z-20 flex items-center px-2 pt-[calc(env(safe-area-inset-top)+0.5rem)] pb-2 border-b ${
            'bg-surface border-rule'
          }`}>
            <button
              type="button"
              onClick={close}
              className={`min-h-11 px-2 flex items-center gap-1 text-sm font-bold cursor-pointer text-ink-2`}
            >
              <CaretLeft size={18} weight="bold" />
              {isKo ? '검토함' : 'Inbox'}
            </button>
          </div>
          <div className="p-4">{review}</div>
        </div>,
        document.body
      )}
    </div>
  );
}

interface ReviewProps {
  isNight: boolean;
  isKo: boolean;
  log: PendingClassLog;
  academyName: string;
  remaining: number;
  approve: (summary: string, notes: ApprovedNote[], summaryEn: string, stayOnScreen: boolean) => Promise<boolean>;
  setDirty: (dirty: boolean) => void;
  onNext: () => void;
  onDiscard: () => void;
}

// Grow textareas to fit their text — on a phone a fixed height hid most of
// the summary behind an inner scroll.
const autoSize = (el: HTMLTextAreaElement | null) => {
  if (!el) return;
  el.style.height = 'auto';
  el.style.height = `${el.scrollHeight + 2}px`;
};

const isUntranslated = (text: string) => text.startsWith('⚠️') && text.includes('자동 번역 실패');

const rewriteBtn =
  'btn-press inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-md px-3 text-[14px] font-bold text-ink-2 ring-1 ring-inset ring-rule hover:text-ink disabled:cursor-not-allowed disabled:opacity-50';

// One row of AI rewrite actions under a draft. Text buttons, not a menu: a KT
// between classes should fix a draft in one tap.
function RewriteBar({ isKo, busy, disabled, canUndo, error, onRewrite, onUndo }: {
  isKo: boolean;
  busy: boolean;
  disabled: boolean;
  canUndo: boolean;
  error: boolean;
  onRewrite: (style?: RewriteStyle) => void;
  onUndo: () => void;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap items-center gap-1.5">
        <button type="button" disabled={disabled} onClick={() => onRewrite()} className={rewriteBtn}>
          <ArrowClockwise size={14} weight="bold" className={busy ? 'animate-spin' : ''} />
          {busy ? (isKo ? '쓰는 중...' : 'Writing...') : isKo ? '다시 쓰기' : 'Rewrite'}
        </button>
        <button type="button" disabled={disabled} onClick={() => onRewrite('shorter')} className={rewriteBtn}>
          {isKo ? '더 짧게' : 'Shorter'}
        </button>
        <button type="button" disabled={disabled} onClick={() => onRewrite('detail')} className={rewriteBtn}>
          {isKo ? '더 자세히' : 'More detail'}
        </button>
        {canUndo && (
          <button type="button" disabled={disabled} onClick={onUndo} className={rewriteBtn}>
            <ArrowCounterClockwise size={14} weight="bold" />
            {isKo ? '이전 글로' : 'Undo rewrite'}
          </button>
        )}
      </div>
      {error && (
        <p role="alert" className="text-[13px] font-bold text-wrong">
          {isKo ? '다시 쓰지 못했어요. 잠시 후 다시 눌러 주세요.' : "Couldn't rewrite it. Try again in a moment."}
        </p>
      )}
    </div>
  );
}

function KtClassReview({ isNight, isKo, log, academyName, remaining, approve, setDirty, onNext, onDiscard }: ReviewProps) {
  const initialSummary = log.aiKoreanSummary || '';
  const initialNotes = (log.aiStudentReports || []).map((r) => r.koreanUpdate || '');
  const [summary, setSummary] = useState(initialSummary);
  const [notes, setNotes] = useState(initialNotes);
  const [status, setStatus] = useState<'review' | 'queued' | 'saving' | 'done'>('review');
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [copyFailed, setCopyFailed] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  // English goes to parents using the app in English. Cleared when the KT
  // hand-edits the Korean so a stale translation never goes out.
  const [english, setEnglish] = useState(log.aiEnglishSummary || '');
  const [summaryFallback, setSummaryFallback] = useState(!!log.aiSummaryFallback);
  // AI rewrite on the review screen: which field is busy, its last error,
  // and the text before the last rewrite so one tap puts it back.
  const [rewriting, setRewriting] = useState<string | null>(null);
  const [rewriteError, setRewriteError] = useState<string | null>(null);
  const [beforeRewrite, setBeforeRewrite] = useState<Record<string, string>>({});
  const families = familyCount(log);
  const date = logDate(log);
  const className = log.className || '';

  const isDirty = status === 'review' && (summary !== initialSummary || notes.some((n, i) => n !== initialNotes[i]));
  const dirtyRef = useRef(isDirty);
  useEffect(() => {
    if (dirtyRef.current !== isDirty) setDirty(isDirty);
    dirtyRef.current = isDirty;
  }, [isDirty, setDirty]);

  // A failed translation still holds the raw note with a warning marker,
  // which must never reach a parent.
  const untranslated = notes.some(isUntranslated);
  const canApprove = status === 'review' && !rewriting && !untranslated && summary.trim().length > 0;

  const rewrite = async (key: string, style?: RewriteStyle) => {
    setRewriting(key);
    setRewriteError(null);
    try {
      if (key === 'summary') {
        const next = await generateGeneralClassSummary({
          className,
          date,
          lessonTopic: log.lessonTopic || '',
          textbook: log.textbook || '',
          energyLevel: log.energyLevel || '',
          activities: log.activities || [],
          generalComments: log.generalComments || '',
          exceptions: [],
          authorRole: log.authorRole,
        }, { style, previous: summary });
        if (next.fallback) throw new Error('fallback');
        setBeforeRewrite((b) => ({ ...b, summary, summaryEn: english }));
        setSummary(next.korean);
        setEnglish(next.english);
        setSummaryFallback(false);
      } else {
        const i = Number(key.slice(1));
        const r = log.aiStudentReports![i];
        const next = await generateStudentExceptionReport({
          studentName: r.studentName,
          classTopic: log.lessonTopic || '',
          textbook: log.textbook || '',
          exceptionDetails: log.exceptions?.[i]?.details || '',
          category: r.category,
          classSummary: summary,
        }, { style, previous: isUntranslated(notes[i]) ? undefined : notes[i] });
        if (next.failed) throw new Error('failed');
        setBeforeRewrite((b) => ({ ...b, [key]: notes[i] }));
        setNotes((prev) => prev.map((n, j) => (j === i ? next.text : n)));
      }
    } catch {
      setRewriteError(key);
    } finally {
      setRewriting(null);
    }
  };

  const restore = (key: string) => {
    const prev = beforeRewrite[key];
    if (prev === undefined) return;
    if (key === 'summary') {
      setSummary(prev);
      setEnglish(beforeRewrite.summaryEn || '');
    } else {
      const i = Number(key.slice(1));
      setNotes((n) => n.map((t, j) => (j === i ? prev : t)));
    }
    setBeforeRewrite(({ [key]: _, ...rest }) => rest);
  };

  // Rewrite needs the teacher's original input; logs saved before it was
  // kept on the doc can only be edited by hand.
  const canRewriteSummary = !!(log.textbook && log.lessonTopic);
  const canRewriteNote = (i: number) => !!(log.textbook && log.exceptions?.[i]?.details);

  const approvedNotes = (): ApprovedNote[] => (log.aiStudentReports || []).map((r, i) => ({
    studentName: r.studentName,
    studentUid: r.studentUid ?? null,
    approvedText: notes[i].trim(),
  })).filter((n) => n.approvedText);

  // Approve holds the send for UNDO_SECONDS so a wrong tap never reaches a
  // parent. Leaving the review mid-countdown (next class, back gesture)
  // still sends: the KT meant to. Closing the tab asks first.
  const UNDO_SECONDS = 10;
  const sendRef = useRef<(() => void) | null>(null);
  const handleApprove = () => {
    if (!canApprove) return;
    const send = () => approve(summary.trim(), approvedNotes(), english, false);
    sendRef.current = send;
    setSecondsLeft(UNDO_SECONDS);
    setStatus('queued');
  };
  const undo = () => {
    sendRef.current = null;
    setStatus('review');
  };
  useEffect(() => {
    if (status !== 'queued') return;
    if (secondsLeft <= 0) {
      sendRef.current = null;
      setStatus('saving');
      approve(summary.trim(), approvedNotes(), english, true).then((ok) => setStatus(ok ? 'done' : 'review'));
      return;
    }
    const t = setTimeout(() => setSecondsLeft((n) => n - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, secondsLeft]);
  useEffect(() => {
    if (status !== 'queued') return;
    const warn = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [status]);
  useEffect(() => () => { sendRef.current?.(); }, []);

  // Parent messages stay in Korean whatever the KT's UI language — the body
  // is the Korean summary.
  const classMessage = `[${academyName}] ${className} 수업 리포트 (${date})\n\n${summary.trim()}`;
  const studentMessage = (name: string, note: string) =>
    `[${academyName}] ${name} 학생 리포트 (${date})\n\n${summary.trim()}\n\n${note.trim()}`;

  const copy = async (key: string, text: string) => {
    setCopyFailed(false);
    const result = await shareOrCopy(text);
    if (result === 'failed') setCopyFailed(true);
    else if (result !== 'cancelled') {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey((k) => (k === key ? null : k)), 2000);
    }
  };

  const panel = 'bg-surface border-rule';
  const muted = 'text-ink-3';
  const field = `w-full p-3.5 rounded-lg border break-keep resize-none overflow-hidden text-base md:text-sm leading-relaxed outline-none transition-colors focus:border-line ${
    'bg-surface border-rule text-ink'
  }`;
  const copyButton = (key: string, text: string, label: string) => (
    <button
      type="button"
      onClick={() => copy(key, text)}
      className={`min-h-11 px-3.5 rounded-md border text-sm font-bold flex items-center gap-2 cursor-pointer transition-colors active:scale-[0.97] ${
        copiedKey === key
          ? ('border-rule bg-right-soft text-correct')
          : 'border-rule bg-surface hover:bg-sunken'
      }`}
    >
      {copiedKey === key ? <CheckCircle size={16} weight="bold" /> : <Copy size={16} weight="bold" />}
      {copiedKey === key ? (isKo ? '복사됨' : 'Copied') : label}
    </button>
  );

  return (
    <article className={`rounded-lg border ${panel}`}>
      <header className={`p-5 sm:p-6 border-b border-rule`}>
        <h3 className="text-lg sm:text-xl font-extrabold tracking-tight break-keep">{className || (isKo ? '수업' : 'Class')}</h3>
        <p className={`text-sm mt-1 ${muted}`}>{[date, log.lessonTopic, log.teacherName].filter(Boolean).join(' · ')}</p>
      </header>

      {status === 'done' ? (
        <div className="p-5 sm:p-6 space-y-6">
          <div className="flex items-start gap-3">
            <CheckCircle size={28} weight="fill" className="shrink-0 text-correct" />
            <div>
              <p className="font-extrabold">{isKo ? `${families}가정에 전달되었습니다` : `Sent to ${families} ${families === 1 ? 'family' : 'families'}`}</p>
              <p className={`text-sm mt-0.5 ${muted}`}>
                {isKo ? '학부모님은 채키 앱에서 확인할 수 있습니다.' : 'Parents can read it in the Chekki app.'}
              </p>
            </div>
          </div>

          <section className="space-y-3">
            <h4 className="text-sm font-bold">{isKo ? '카카오톡으로도 보내기 (선택)' : 'Also send on KakaoTalk (optional)'}</h4>
            <div className="flex flex-wrap gap-2">
              {copyButton('class', classMessage, isKo ? '반 단톡방용 메시지' : 'Class group chat message')}
              {(log.aiStudentReports || []).map((r, i) =>
                notes[i]?.trim() ? (
                  <React.Fragment key={`${r.studentName}-${i}`}>
                    {copyButton(`s${i}`, studentMessage(r.studentName, notes[i]), r.studentName)}
                  </React.Fragment>
                ) : null
              )}
            </div>
            {copyFailed && (
              <p role="alert" className="text-sm text-wrong">
                {isKo ? '복사하지 못했습니다. 브라우저의 클립보드 권한을 확인해 주세요.' : "Couldn't copy. Check your browser's clipboard permission."}
              </p>
            )}
          </section>

          <button
            type="button"
            onClick={onNext}
            className="w-full sm:w-auto min-h-12 px-6 rounded-md bg-line hover:bg-line text-on-line text-sm font-extrabold flex items-center justify-center gap-2 cursor-pointer transition-colors active:scale-[0.97]"
          >
            {remaining > 0 ? (isKo ? '다음 수업' : 'Next class') : (isKo ? '검토함으로' : 'Back to inbox')}
            {remaining > 0 && <CaretRight size={16} weight="bold" />}
          </button>
        </div>
      ) : (
        <>
          <div className="p-5 sm:p-6 space-y-8">
            <section className="space-y-2">
              <div className="flex items-baseline justify-between gap-3">
                <label htmlFor={`kt-summary-${log.id}`} className="text-sm font-bold">
                  {isKo ? '수업 요약' : 'Class summary'}
                </label>
                <span className={`text-xs ${muted}`}>
                  {isKo ? `${families}가정 모두에게` : `Goes to all ${families} ${families === 1 ? 'family' : 'families'}`}
                </span>
              </div>
              {summaryFallback && (
                <p className="flex items-start gap-2 rounded-md bg-line-soft px-3 py-2 text-sm text-line-ink break-keep">
                  <Warning size={16} weight="bold" className="mt-0.5 shrink-0" />
                  {isKo
                    ? '자동 작성이 안 돼서 기본 문장만 들어갔어요. 다시 쓰기를 눌러 보세요.'
                    : "The AI draft failed, so this is a plain template. Tap Rewrite to try again."}
                </p>
              )}
              <textarea
                id={`kt-summary-${log.id}`}
                value={summary}
                // Inline so it re-measures after a rewrite swaps the text.
                ref={(el) => autoSize(el)}
                onChange={(e) => { setSummary(e.target.value); setEnglish(''); }}
                rows={3}
                readOnly={status !== 'review' || rewriting === 'summary'}
                className={field}
              />
              {status === 'review' && canRewriteSummary && (
                <RewriteBar
                  isKo={isKo}
                  busy={rewriting === 'summary'}
                  disabled={!!rewriting}
                  canUndo={beforeRewrite.summary !== undefined}
                  error={rewriteError === 'summary'}
                  onRewrite={(style) => rewrite('summary', style)}
                  onUndo={() => restore('summary')}
                />
              )}
              {(log.generalComments || english) && (
                <div>
                  <button
                    type="button"
                    onClick={() => setShowOriginal((v) => !v)}
                    aria-expanded={showOriginal}
                    className={`min-h-11 text-sm font-bold flex items-center gap-1 cursor-pointer ${muted}`}
                  >
                    <CaretRight size={14} weight="bold" className={`transition-transform ${showOriginal ? 'rotate-90' : ''}`} />
                    {isKo ? '선생님 원본 메모 보기' : "Teacher's original notes"}
                  </button>
                  {showOriginal && (
                    <dl className={`space-y-2 pl-5 text-sm leading-relaxed ${muted}`}>
                      <div>
                        <dt className="font-bold text-ink-2">{isKo ? '수업 메모' : 'Class notes'}</dt>
                        <dd className="whitespace-pre-line break-keep">{log.generalComments || (isKo ? '메모 없음' : 'No notes')}</dd>
                      </div>
                      {(log.activities?.length || log.energyLevel) ? (
                        <div>
                          <dt className="font-bold text-ink-2">{isKo ? '활동 · 분위기' : 'Activities · energy'}</dt>
                          <dd>{[...(log.activities || []), log.energyLevel].filter(Boolean).join(', ')}</dd>
                        </div>
                      ) : null}
                      {english && (
                        <div>
                          <dt className="font-bold text-ink-2">{isKo ? '영어 버전 (영어로 앱을 쓰는 학부모용)' : 'English version (for parents using the app in English)'}</dt>
                          <dd>{english}</dd>
                        </div>
                      )}
                    </dl>
                  )}
                </div>
              )}
            </section>

            {(log.aiStudentReports?.length || 0) > 0 && (
              <section className="space-y-4">
                <h4 className="text-sm font-bold">
                  {isKo ? '학생별 노트' : 'Student notes'}
                  <span className={`ml-2 font-normal ${muted}`}>
                    {isKo ? '해당 가정에만 전달' : 'Only that family sees their note'}
                  </span>
                </h4>
                {log.aiStudentReports!.map((r, i) => (
                  <div key={`${r.studentName}-${i}`} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <label htmlFor={`kt-note-${log.id}-${i}`} className="text-sm font-bold">{r.studentName}</label>
                      {/* Only the concern tag: it's the FT's pick, and a green
                          "Praise" on a note that also raises a concern told the
                          KT the opposite of what they were about to send. */}
                      {r.category === 'attention' && (
                        <span className="px-2 py-0.5 rounded-md text-[12px] font-bold bg-line-soft text-line-ink">
                          {isKo ? '관심 필요' : 'Needs attention'}
                        </span>
                      )}
                    </div>
                    {!noteReachesApp(r.studentUid) && notes[i]?.trim() && (
                      <p className="text-sm text-line-ink bg-line-soft rounded-md px-3 py-2 break-keep">
                        {isKo
                          ? '아직 학부모가 앱에 가입하지 않아서 이 노트는 앱으로 전달되지 않아요. 보낸 뒤 카카오톡으로 복사해 보내 주세요.'
                          : "This parent hasn't joined the app yet, so this note won't reach them there. After sending, copy it to KakaoTalk."}
                      </p>
                    )}
                    {log.exceptions?.[i]?.details && !isUntranslated(notes[i]) && (
                      <p className={`text-[13px] leading-relaxed break-keep ${muted}`}>
                        <span className="font-bold text-ink-2">{isKo ? '원본 메모 ' : 'Original note '}</span>
                        {log.exceptions[i].details}
                      </p>
                    )}
                    {isUntranslated(notes[i]) ? (
                      <div className="space-y-2 rounded-md bg-wrong-soft px-3 py-3">
                        <p className="flex items-start gap-2 text-sm font-bold text-wrong break-keep">
                          <Warning size={16} weight="bold" className="mt-0.5 shrink-0" />
                          {isKo ? '자동 번역이 안 됐어요. 다시 시도하거나, 아래 글을 지우고 한국어로 직접 써 주세요. 비워 두면 이 학생 노트는 빠져요.' : "Translation failed. Retry, or replace the text below with your own Korean. Leave it empty to skip this student's note."}
                        </p>
                        {canRewriteNote(i) && (
                          <button
                            type="button"
                            disabled={!!rewriting}
                            onClick={() => rewrite(`n${i}`)}
                            className={`${rewriteBtn} bg-surface`}
                          >
                            <ArrowClockwise size={14} weight="bold" className={rewriting === `n${i}` ? 'animate-spin' : ''} />
                            {rewriting === `n${i}` ? (isKo ? '번역하는 중...' : 'Translating...') : isKo ? '다시 번역하기' : 'Retry translation'}
                          </button>
                        )}
                        {rewriteError === `n${i}` && (
                          <p role="alert" className="text-[13px] font-bold text-wrong">
                            {isKo ? '이번에도 안 됐어요. 직접 고쳐 써 주세요.' : 'Still failing. Please write it yourself.'}
                          </p>
                        )}
                      </div>
                    ) : null}
                    <textarea
                      id={`kt-note-${log.id}-${i}`}
                      value={notes[i]}
                      ref={(el) => autoSize(el)}
                      onChange={(e) => setNotes((prev) => prev.map((n, j) => (j === i ? e.target.value : n)))}
                      rows={3}
                      readOnly={status !== 'review' || rewriting === `n${i}`}
                      className={field}
                    />
                    {status === 'review' && canRewriteNote(i) && !isUntranslated(notes[i]) && notes[i]?.trim() && (
                      <RewriteBar
                        isKo={isKo}
                        busy={rewriting === `n${i}`}
                        disabled={!!rewriting}
                        canUndo={beforeRewrite[`n${i}`] !== undefined}
                        error={rewriteError === `n${i}`}
                        onRewrite={(style) => rewrite(`n${i}`, style)}
                        onUndo={() => restore(`n${i}`)}
                      />
                    )}
                  </div>
                ))}
              </section>
            )}
          </div>

          <footer className={`sticky bottom-0 p-4 sm:px-6 border-t rounded-b-3xl max-md:pb-[calc(env(safe-area-inset-bottom)+1rem)] ${
            'bg-surface border-rule'
          }`}>
            {status === 'queued' ? (
              <div role="status" className="w-full min-h-12 px-4 rounded-md bg-sign text-on-sign flex items-center justify-between gap-3">
                <span className="text-sm font-bold num">
                  {isKo ? `${secondsLeft}초 뒤에 ${families}가정에 보내요` : `Sending to ${families} ${families === 1 ? 'family' : 'families'} in ${secondsLeft}s`}
                </span>
                <button
                  type="button"
                  onClick={undo}
                  className="min-h-11 px-4 rounded-md bg-line text-[#2b211a] text-sm font-extrabold cursor-pointer active:scale-[0.97]"
                >
                  {isKo ? '취소' : 'Undo'}
                </button>
              </div>
            ) : (
            <button
              type="button"
              onClick={handleApprove}
              disabled={!canApprove}
              className={`w-full min-h-12 px-6 rounded-md text-sm font-extrabold flex items-center justify-center gap-2 transition-colors active:scale-[0.97] ${
                canApprove
                  ? 'bg-line hover:bg-line text-on-line cursor-pointer'
                  : 'bg-sunken text-ink-3 cursor-not-allowed'
              }`}
            >
              {status === 'saving' ? (
                <>
                  <Sparkle size={16} weight="bold" className="animate-spin" />
                  {isKo ? '보내는 중...' : 'Sending...'}
                </>
              ) : isKo ? (
                `승인하고 ${families}가정에 보내기`
              ) : (
                `Approve and send to ${families} ${families === 1 ? 'family' : 'families'}`
              )}
            </button>
            )}
            {status === 'review' && untranslated && (
              <p className="mt-2 text-center text-[13px] font-bold text-wrong break-keep">
                {isKo ? '번역 안 된 노트를 고치거나 비워야 보낼 수 있어요.' : 'Fix or clear the untranslated note to send.'}
              </p>
            )}
            <button
              type="button"
              onClick={onDiscard}
              disabled={status !== 'review'}
              className={`mt-2 w-full min-h-11 text-sm font-bold cursor-pointer transition-colors disabled:opacity-40 text-ink-3 hover:text-wrong`}
            >
              {isKo ? '보내지 않고 삭제 (중복·실수)' : "Discard, don't send (duplicate or mistake)"}
            </button>
          </footer>
        </>
      )}
    </article>
  );
}

// Per-KT daily email listing what's waiting. Sent at 9:00 KST — the daily
// cron in vercel.json (Vercel Hobby allows one run a day, so no per-KT hour).
function DigestSettings({ isNight, isKo, user }: { isNight: boolean; isKo: boolean; user: UserProfile | null }) {
  const [open, setOpen] = useState(false);
  const [enabled, setEnabled] = useState(user?.notifyDigestEnabled !== false);
  const [saving, setSaving] = useState(false);
  if (!user?.uid) return null;

  const save = async (nextEnabled: boolean) => {
    setEnabled(nextEnabled);
    setSaving(true);
    try {
      await updateDoc(doc(dbInstance, 'users', user.uid!), { notifyDigestEnabled: nextEnabled });
    } catch (err) {
      console.warn('Failed to save KT notification preferences:', err);
      setEnabled(!nextEnabled);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={isKo ? '알림 이메일 설정' : 'Email reminder settings'}
        className={`w-11 h-11 rounded-lg border flex items-center justify-center cursor-pointer transition-colors ${
          'border-rule bg-surface hover:bg-sunken'
        } ${enabled ? '' : 'text-ink-3'}`}
      >
        {enabled ? <Bell size={18} weight="bold" /> : <BellSlash size={18} weight="bold" />}
      </button>
      {open && (
        <div className={`absolute top-full right-0 mt-2 z-30 w-72 p-4 rounded-lg border space-y-3 text-sm ${
          'bg-surface border-rule'
        }`}>
          <label className="flex items-center justify-between gap-3 cursor-pointer">
            <span className="font-bold">{isKo ? '검토 대기 알림 이메일' : 'Daily reminder email'}</span>
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => save(e.target.checked)}
              className="w-5 h-5 accent-[var(--m-line)] cursor-pointer"
            />
          </label>
          <p className={`text-xs text-ink-3`}>
            {isKo ? '매일 오전 9시(한국 시간)에 검토 대기 일지를 이메일로 알려드립니다.' : 'Sent every morning at 9:00 KST when logs are waiting.'}
          </p>
          {saving && <p className="text-xs text-ink-3">{isKo ? '저장 중...' : 'Saving...'}</p>}
        </div>
      )}
    </div>
  );
}

