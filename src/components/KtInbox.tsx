import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Bell, BellSlash, CaretLeft, CaretRight, CheckCircle, Copy, Sparkle } from '@phosphor-icons/react';
import { doc, updateDoc } from 'firebase/firestore';
import { dbInstance } from '../../services/database';
import { logDate, type ApprovedNote, type PendingClassLog } from '../../hooks/useKtReviewQueue';
import type { UserProfile } from '../../types';

interface Props {
  isNight: boolean;
  isKo: boolean;
  logs: PendingClassLog[];
  loadError: boolean;
  academyName: string;
  user: UserProfile | null;
  approve: (log: PendingClassLog, summary: string, notes: ApprovedNote[]) => Promise<boolean>;
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
export function KtInbox({ isNight, isKo, logs, loadError, academyName, user, approve, setDirty, confirmDiscard }: Props) {
  const isMobile = useIsMobile();
  // A snapshot, not an id: after approval the log leaves `logs`, but the
  // review stays on screen to show the done state and KakaoTalk copies.
  const [openLog, setOpenLog] = useState<PendingClassLog | null>(null);
  const current = openLog ?? (isMobile ? null : logs[0] ?? null);
  const isOpen = !!openLog;

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

  const muted = isNight ? 'text-zinc-400' : 'text-zinc-500';

  const review = current && (
    <KtClassReview
      key={current.id}
      isNight={isNight}
      isKo={isKo}
      log={current}
      academyName={academyName}
      remaining={logs.filter((l) => l.id !== current.id).length}
      approve={async (summary, notes) => {
        setOpenLog(current);
        return approve(current, summary, notes);
      }}
      setDirty={setDirty}
      onNext={goNext}
    />
  );

  return (
    <div className="max-w-6xl mx-auto w-full space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-xl sm:text-2xl font-black tracking-tight break-keep">
            {isKo ? '학부모 리포트' : 'Parent reports'}
          </h2>
          <p className={`text-sm mt-1 ${muted}`}>
            {logs.length === 0
              ? isKo ? '검토할 리포트가 없습니다' : 'Nothing to review'
              : isKo ? `${logs.length}개 수업 검토 대기` : `${logs.length} ${logs.length === 1 ? 'class' : 'classes'} to review`}
          </p>
        </div>
        <DigestSettings isNight={isNight} isKo={isKo} user={user} />
      </div>

      {loadError && (
        <p role="alert" className="p-3.5 rounded-2xl border text-sm bg-red-500/10 border-red-500/30 text-red-500">
          {isKo
            ? '리포트 대기열을 불러오지 못했습니다. 새로고침 후 다시 시도해주세요.'
            : "Couldn't load the review queue. Refresh the page and try again."}
        </p>
      )}

      {logs.length === 0 && !openLog ? (
        <div className={`p-8 sm:p-12 rounded-3xl border text-center space-y-3 ${isNight ? 'bg-brand-dark border-white/10' : 'bg-white border-zinc-200'}`}>
          <CheckCircle size={32} weight="bold" className="mx-auto text-emerald-500" />
          <h3 className="text-lg font-black">{isKo ? '모두 확인했습니다' : "You're all caught up"}</h3>
          <p className={`text-sm max-w-sm mx-auto break-keep ${muted}`}>
            {isKo
              ? '선생님이 수업 일지를 제출하면 여기에 수업별로 표시됩니다. 한 번 검토하고 승인하면 반 전체 학부모님께 전달됩니다.'
              : 'When a teacher logs a class, it shows up here. Review it once and approve, and every family in that class gets it.'}
          </p>
        </div>
      ) : (
        <div className="md:grid md:grid-cols-[17rem_minmax(0,1fr)] md:gap-6 md:items-start">
          <ul className="space-y-2 md:sticky md:top-4" aria-label={isKo ? '검토할 수업' : 'Classes to review'}>
            {logs.map((log) => {
              const notes = log.aiStudentReports?.length || 0;
              const active = !isMobile && log.id === current?.id;
              return (
                <li key={log.id}>
                  <button
                    type="button"
                    onClick={() => select(log)}
                    aria-current={active ? 'true' : undefined}
                    className={`w-full text-left px-4 py-3 min-h-16 rounded-2xl border flex items-center gap-3 cursor-pointer transition-colors active:scale-[0.99] ${
                      active
                        ? 'border-orange-500 bg-orange-500/10'
                        : isNight
                          ? 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06]'
                          : 'border-zinc-200 bg-white hover:bg-zinc-50'
                    }`}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-bold truncate">{log.className || (isKo ? '수업' : 'Class')}</span>
                      <span className={`block text-xs mt-0.5 truncate ${muted}`}>
                        {[logDate(log), log.lessonTopic].filter(Boolean).join(' · ')}
                      </span>
                    </span>
                    {notes > 0 && (
                      <span className={`shrink-0 px-2 py-0.5 rounded-full text-[11px] font-bold ${isNight ? 'bg-amber-500/15 text-amber-400' : 'bg-amber-100 text-amber-800'}`}>
                        {isKo ? `노트 ${notes}` : `${notes} ${notes === 1 ? 'note' : 'notes'}`}
                      </span>
                    )}
                    <CaretRight size={14} weight="bold" className={`shrink-0 md:hidden ${muted}`} />
                  </button>
                </li>
              );
            })}
          </ul>

          {!isMobile && <div className="mt-6 md:mt-0">{review}</div>}
        </div>
      )}

      {isMobile && openLog && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          aria-label={openLog.className || (isKo ? '수업 리포트' : 'Class report')}
          className={`fixed inset-0 z-[380] overflow-y-auto ${isNight ? 'bg-brand-dark text-white' : 'bg-slate-50 text-zinc-900'}`}
        >
          <div className={`sticky top-0 z-20 flex items-center px-2 pt-[calc(env(safe-area-inset-top)+0.5rem)] pb-2 border-b backdrop-blur-md ${
            isNight ? 'bg-brand-dark/90 border-white/10' : 'bg-white/90 border-zinc-200'
          }`}>
            <button
              type="button"
              onClick={close}
              className={`min-h-11 px-2 flex items-center gap-1 text-sm font-bold cursor-pointer ${isNight ? 'text-zinc-300' : 'text-zinc-700'}`}
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
  approve: (summary: string, notes: ApprovedNote[]) => Promise<boolean>;
  setDirty: (dirty: boolean) => void;
  onNext: () => void;
}

const rowsFor = (text: string) => Math.min(14, Math.max(4, Math.ceil(text.length / 55) + text.split('\n').length));

function KtClassReview({ isNight, isKo, log, academyName, remaining, approve, setDirty, onNext }: ReviewProps) {
  const initialSummary = log.aiKoreanSummary || '';
  const initialNotes = (log.aiStudentReports || []).map((r) => r.koreanUpdate || '');
  const [summary, setSummary] = useState(initialSummary);
  const [notes, setNotes] = useState(initialNotes);
  const [status, setStatus] = useState<'review' | 'saving' | 'done'>('review');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [copyFailed, setCopyFailed] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  const families = familyCount(log);
  const date = logDate(log);
  const className = log.className || '';

  const isDirty = status === 'review' && (summary !== initialSummary || notes.some((n, i) => n !== initialNotes[i]));
  const dirtyRef = useRef(isDirty);
  useEffect(() => {
    if (dirtyRef.current !== isDirty) setDirty(isDirty);
    dirtyRef.current = isDirty;
  }, [isDirty, setDirty]);

  const canApprove = status === 'review' && summary.trim().length > 0;

  const handleApprove = async () => {
    if (!canApprove) return;
    setStatus('saving');
    const approved: ApprovedNote[] = (log.aiStudentReports || []).map((r, i) => ({
      studentName: r.studentName,
      studentUid: r.studentUid ?? null,
      approvedText: notes[i].trim(),
    })).filter((n) => n.approvedText);
    const ok = await approve(summary.trim(), approved);
    setStatus(ok ? 'done' : 'review');
  };

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

  const panel = isNight ? 'bg-brand-dark border-white/10' : 'bg-white border-zinc-200';
  const muted = isNight ? 'text-zinc-400' : 'text-zinc-500';
  const field = `w-full p-3.5 rounded-2xl border text-base md:text-sm leading-relaxed outline-none transition-colors focus:border-orange-500 ${
    isNight ? 'bg-black/30 border-white/10 text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-900'
  }`;
  const copyButton = (key: string, text: string, label: string) => (
    <button
      type="button"
      onClick={() => copy(key, text)}
      className={`min-h-11 px-3.5 rounded-xl border text-sm font-bold flex items-center gap-2 cursor-pointer transition-colors active:scale-[0.97] ${
        copiedKey === key
          ? (isNight ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400' : 'border-emerald-300 bg-emerald-50 text-emerald-800')
          : isNight ? 'border-white/10 bg-white/5 hover:bg-white/10' : 'border-zinc-200 bg-white hover:bg-zinc-50'
      }`}
    >
      {copiedKey === key ? <CheckCircle size={16} weight="bold" /> : <Copy size={16} weight="bold" />}
      {copiedKey === key ? (isKo ? '복사됨' : 'Copied') : label}
    </button>
  );

  return (
    <article className={`rounded-3xl border ${panel}`}>
      <header className={`p-5 sm:p-6 border-b ${isNight ? 'border-white/10' : 'border-zinc-200'}`}>
        <h3 className="text-lg sm:text-xl font-black tracking-tight break-keep">{className || (isKo ? '수업' : 'Class')}</h3>
        <p className={`text-sm mt-1 ${muted}`}>{[date, log.lessonTopic].filter(Boolean).join(' · ')}</p>
      </header>

      {status === 'done' ? (
        <div className="p-5 sm:p-6 space-y-6">
          <div className="flex items-start gap-3">
            <CheckCircle size={28} weight="fill" className="shrink-0 text-emerald-500" />
            <div>
              <p className="font-black">{isKo ? `${families}가정에 전달되었습니다` : `Sent to ${families} ${families === 1 ? 'family' : 'families'}`}</p>
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
              <p role="alert" className="text-sm text-red-500">
                {isKo ? '복사하지 못했습니다. 브라우저의 클립보드 권한을 확인해 주세요.' : "Couldn't copy. Check your browser's clipboard permission."}
              </p>
            )}
          </section>

          <button
            type="button"
            onClick={onNext}
            className="w-full sm:w-auto min-h-12 px-6 rounded-full bg-orange-500 hover:bg-orange-600 text-black text-sm font-black flex items-center justify-center gap-2 cursor-pointer transition-colors active:scale-[0.97]"
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
              <textarea
                id={`kt-summary-${log.id}`}
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                rows={rowsFor(summary)}
                className={field}
              />
              {log.aiEnglishSummary && (
                <div>
                  <button
                    type="button"
                    onClick={() => setShowOriginal((v) => !v)}
                    aria-expanded={showOriginal}
                    className={`min-h-11 text-sm font-bold flex items-center gap-1 cursor-pointer ${muted}`}
                  >
                    <CaretRight size={14} weight="bold" className={`transition-transform ${showOriginal ? 'rotate-90' : ''}`} />
                    {isKo ? '영어 원문 보기' : 'English version'}
                  </button>
                  {showOriginal && (
                    <p className={`text-sm leading-relaxed pl-5 ${muted}`}>{log.aiEnglishSummary}</p>
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
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                        r.category === 'praise'
                          ? (isNight ? 'bg-emerald-500/15 text-emerald-400' : 'bg-emerald-100 text-emerald-800')
                          : (isNight ? 'bg-amber-500/15 text-amber-400' : 'bg-amber-100 text-amber-800')
                      }`}>
                        {r.category === 'praise' ? (isKo ? '칭찬' : 'Praise') : (isKo ? '관심 필요' : 'Needs attention')}
                      </span>
                    </div>
                    <textarea
                      id={`kt-note-${log.id}-${i}`}
                      value={notes[i]}
                      onChange={(e) => setNotes((prev) => prev.map((n, j) => (j === i ? e.target.value : n)))}
                      rows={rowsFor(notes[i])}
                      className={field}
                    />
                  </div>
                ))}
              </section>
            )}
          </div>

          <footer className={`sticky bottom-0 p-4 sm:px-6 border-t rounded-b-3xl backdrop-blur-md max-md:pb-[calc(env(safe-area-inset-bottom)+1rem)] ${
            isNight ? 'bg-brand-dark/90 border-white/10' : 'bg-white/90 border-zinc-200'
          }`}>
            <button
              type="button"
              onClick={handleApprove}
              disabled={!canApprove}
              className={`w-full min-h-12 px-6 rounded-full text-sm font-black flex items-center justify-center gap-2 transition-colors active:scale-[0.97] ${
                canApprove
                  ? 'bg-orange-500 hover:bg-orange-600 text-black cursor-pointer shadow-[0_12px_30px_rgba(249,115,22,0.25)]'
                  : 'bg-zinc-500/30 text-zinc-400 cursor-not-allowed'
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
          </footer>
        </>
      )}
    </article>
  );
}

// Per-KT daily email listing what's waiting — same defaults as the cron
// (api/create-teacher-invite.ts) when the fields are absent.
function DigestSettings({ isNight, isKo, user }: { isNight: boolean; isKo: boolean; user: UserProfile | null }) {
  const [open, setOpen] = useState(false);
  const [enabled, setEnabled] = useState(user?.notifyDigestEnabled !== false);
  const [hour, setHour] = useState(user?.notifyDigestHourKst ?? 9);
  const [saving, setSaving] = useState(false);
  if (!user?.uid) return null;

  const save = async (nextEnabled: boolean, nextHour: number) => {
    setSaving(true);
    try {
      await updateDoc(doc(dbInstance, 'users', user.uid!), { notifyDigestEnabled: nextEnabled, notifyDigestHourKst: nextHour });
    } catch (err) {
      console.warn('Failed to save KT notification preferences:', err);
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
        className={`w-11 h-11 rounded-2xl border flex items-center justify-center cursor-pointer transition-colors ${
          isNight ? 'border-white/10 bg-white/5 hover:bg-white/10' : 'border-zinc-200 bg-white hover:bg-zinc-50'
        } ${enabled ? '' : 'text-zinc-400'}`}
      >
        {enabled ? <Bell size={18} weight="bold" /> : <BellSlash size={18} weight="bold" />}
      </button>
      {open && (
        <div className={`absolute top-full right-0 mt-2 z-30 w-72 p-4 rounded-2xl border shadow-[0_20px_50px_rgba(0,0,0,0.35)] space-y-3 text-sm ${
          isNight ? 'bg-brand-dark border-white/10' : 'bg-white border-zinc-200'
        }`}>
          <label className="flex items-center justify-between gap-3 cursor-pointer">
            <span className="font-bold">{isKo ? '검토 대기 알림 이메일' : 'Daily reminder email'}</span>
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => {
                setEnabled(e.target.checked);
                save(e.target.checked, hour);
              }}
              className="w-5 h-5 accent-orange-500 cursor-pointer"
            />
          </label>
          {enabled && (
            <label className="block space-y-1.5">
              <span className={isNight ? 'text-zinc-400' : 'text-zinc-500'}>{isKo ? '받을 시간 (한국 시간)' : 'Time (KST)'}</span>
              <select
                value={hour}
                onChange={(e) => {
                  const next = Number(e.target.value);
                  setHour(next);
                  save(enabled, next);
                }}
                className={`w-full min-h-11 px-3 rounded-xl border text-base md:text-sm font-bold outline-none focus:border-orange-500 ${
                  isNight ? 'bg-white/5 border-white/10' : 'bg-zinc-50 border-zinc-200'
                }`}
              >
                {Array.from({ length: 24 }, (_, h) => (
                  <option key={h} value={h}>{String(h).padStart(2, '0')}:00</option>
                ))}
              </select>
            </label>
          )}
          {saving && <p className="text-xs text-zinc-400">{isKo ? '저장 중...' : 'Saving...'}</p>}
        </div>
      )}
    </div>
  );
}

