import React, { useEffect, useState, useRef } from 'react';
import { collection, query, where, onSnapshot, Timestamp } from 'firebase/firestore';
import { UserPlus, UploadSimple, X, PaperPlaneTilt, Trash, ChatCircle } from '@phosphor-icons/react';
import { auth, dbInstance } from '../../services/database';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { staffUi, msgTone } from './staffUi';
import { copyToClipboard } from '../../utils/clipboard';

interface PendingStudent {
  id: string;
  name: string;
  parentEmail: string;
  inviteCode?: string;
  classId?: string;
  status: 'invited' | 'redeemed';
  addedAt?: Timestamp;
  redeemedAt?: Timestamp;
}

interface Props {
  isNight?: boolean;
  isKo?: boolean;
  classId: string;
  classes?: { id: string; name: string }[];
}

/**
 * Director/KT-facing "push an invite" enrollment path — the only way a
 * parent joins a class (Decision 001, docs/DECISIONS.md; the old self-serve
 * shared joinCode was removed). Staff can add a student one at a time or
 * bulk-upload an Excel/CSV roster; each row becomes a `pendingStudents` doc
 * (server-side only, see api/create-class.ts's add_students action) that
 * flips from "Invited" to "Joined" once api/redeem.ts's redeemClassCode
 * matches the redeeming parent's email against it — so staff can see who
 * still hasn't redeemed instead of guessing.
 */
export const StudentInvitePanel: React.FC<Props> = ({
  isNight = true,
  isKo = false,
  classId,
  classes = [],
}) => {
  const [pending, setPending] = useState<PendingStudent[]>([]);
  // Joined students are managed in the roster table below; listing them here too
  // showed every student twice.
  const waiting = pending.filter((p) => p.status !== 'redeemed');
  const [hasLoaded, setHasLoaded] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [targetClassId, setTargetClassId] = useState(classId);

  // Keep the picker following the class the director is currently viewing
  // rather than sticking to whatever was selected the first time the form
  // opened — a stale target here would silently add students to the wrong
  // class.
  useEffect(() => {
    setTargetClassId(classId);
  }, [classId]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'error' | 'success' } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [removeConfirm, setRemoveConfirm] = useState<{ id: string; label: string } | null>(null);
  const [previewRows, setPreviewRows] = useState<{ name: string; parentEmail: string }[] | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [addEmailForId, setAddEmailForId] = useState<string | null>(null);
  const [addEmailValue, setAddEmailValue] = useState('');

  useEffect(() => {
    if (!classId) return;
    setHasLoaded(false);
    // No orderBy here on purpose — classId(==) + addedAt(orderBy) needs a
    // composite index that was never created, which made this listener
    // fail silently (console.warn only) and left the list stuck on "No
    // students invited yet" even right after a successful add. Sorted
    // client-side below instead.
    let cancelled = false;
    let retryCount = 0;
    const maxRetries = 3;
    let unsub: (() => void) | undefined;

    const attach = () => {
      const q = query(collection(dbInstance, 'pendingStudents'), where('classId', '==', classId));
      unsub = onSnapshot(
        q,
        (snap) => {
          if (cancelled) return;
          const rows = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as PendingStudent[];
          rows.sort((a, b) => (b.addedAt?.toMillis() || 0) - (a.addedAt?.toMillis() || 0));
          setPending(rows);
          setHasLoaded(true);
          // A retry that eventually succeeds should clear whatever error
          // banner an earlier failed attempt left up — otherwise a student
          // that *did* load successfully sits under a stale "Failed to
          // load" message (audit: newly-added student invisible, error
          // banner and empty-state both shown together).
          setMessage((m) => (m?.text === 'Failed to load the invite list. Please refresh.' ? null : m));
        },
        (err) => {
          console.warn('Failed to load pending student invites:', err?.code, err);
          // firestore.rules re-reads the caller's own user doc on every
          // attach to check schoolId; right after creating a brand-new
          // class that read can transiently permission-deny before the
          // director's session settles. A single fixed 1.5s retry wasn't
          // always enough — a slower session settle left the listener
          // permanently in the error state with no way to recover even
          // after a student was successfully added via the API (audit:
          // added student never appeared, error banner stuck). Retry with
          // backoff instead of once.
          if (err?.code === 'permission-denied' && retryCount < maxRetries) {
            const delay = 1000 * 2 ** retryCount;
            retryCount += 1;
            unsub?.();
            setTimeout(() => {
              if (cancelled) return;
              // Force a fresh ID token before retrying — this rule now reads
              // request.auth.token.schoolId (a custom claim), and the SDK's
              // cached token can still be missing/stale claims from before a
              // director's schoolId was backfilled or re-synced, even though
              // the underlying Firestore doc is already correct (audit:
              // added student never appears, retries exhaust on a stale token).
              auth.currentUser?.getIdToken(true).finally(() => {
                if (!cancelled) attach();
              });
            }, delay);
            return;
          }
          if (cancelled) return;
          setHasLoaded(true);
          setMessage({ text: 'Failed to load the invite list. Please refresh.', type: 'error' });
        }
      );
    };
    attach();

    return () => {
      cancelled = true;
      unsub?.();
    };
  }, [classId]);

  const callEndpoint = async (body: unknown) => {
    const idToken = await auth.currentUser?.getIdToken();
    const response = await fetch('/api/create-class', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
      body: JSON.stringify(body),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'Request failed');
    return data;
  };

  const submitStudents = async (students: { name: string; parentEmail: string }[]) => {
    setIsSubmitting(true);
    setMessage(null);
    try {
      const data = await callEndpoint({ action: 'add_students', classId: targetClassId, students });
      const withEmail = data.added - (data.addedWithoutEmail || 0);
      if (data.addedWithoutEmail > 0 && withEmail === 0) {
        setMessage({
          text: isKo
            ? `${data.added}명이 학급 명단에 추가되었습니다. 아래 명단에서 '카톡 초대'를 눌러 초대 문구를 복사해 카카오톡으로 보내세요.`
            : `${data.added} ${data.added === 1 ? 'student' : 'students'} added to the class roster. Press 'Kakao invite' on their row below to copy an invite for KakaoTalk.`,
          type: 'success',
        });
      } else if (!data.resendConfigured && withEmail > 0) {
        setMessage({
          text: isKo
            ? `${data.added}명 추가됨 — 이메일 발송이 설정되지 않아 코드를 직접 전달해야 합니다.`
            : `${data.added} ${data.added === 1 ? 'student' : 'students'} added — email sending isn't configured, so codes weren't sent. Share them manually.`,
          type: 'error',
        });
      } else if (data.emailsSent < withEmail) {
        setMessage({
          text: isKo
            ? `${data.added}명 중 ${data.emailsSent}명에게만 이메일이 발송되었습니다. 실패한 초대는 재전송해주세요.`
            : `Only ${data.emailsSent} of ${withEmail} invite emails were sent. Resend the rest individually.`,
          type: 'error',
        });
      } else {
        setMessage({ text: isKo ? `${data.added}명 초대 완료!` : `Invited ${data.added} ${data.added === 1 ? 'student' : 'students'}!`, type: 'success' });
      }
      setNewName('');
      setNewEmail('');
      setShowAddForm(false);
      setPreviewRows(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      setMessage({ text: err.message || 'Failed to add students.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddSingle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    void submitStudents([{ name: newName.trim(), parentEmail: newEmail.trim() }]);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMessage(null);
    try {
      const XLSX = await import('xlsx');
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(firstSheet, { defval: '' });

      const findCol = (row: Record<string, unknown>, keywords: string[]) => {
        const key = Object.keys(row).find((k) => keywords.some((kw) => k.toLowerCase().includes(kw)));
        return key ? String(row[key] ?? '').trim() : '';
      };

      const parsed = rows
        .map((row) => ({
          name: findCol(row, ['student', 'name']),
          parentEmail: findCol(row, ['email']),
        }))
        .filter((r) => r.name);

      if (parsed.length === 0) {
        setMessage({
          text: isKo
            ? '학생 이름 열을 찾을 수 없습니다. 헤더를 확인해주세요 (예: Name). 이메일 열은 선택 사항입니다.'
            : "Couldn't find a name column. Check your header row (e.g. Name). Email column is optional.",
          type: 'error',
        });
        return;
      }
      setPreviewRows(parsed.slice(0, 200));
    } catch (err: any) {
      setMessage({ text: 'Failed to read that file. Please upload a .xlsx, .xls, or .csv file.', type: 'error' });
    }
  };

  const handleResend = async (id: string) => {
    setBusyId(id);
    setMessage(null);
    try {
      await callEndpoint({ action: 'resend_student_invite', pendingStudentId: id });
      setMessage({ text: isKo ? '초대를 재전송했습니다.' : 'Invite resent.', type: 'success' });
    } catch (err: any) {
      setMessage({ text: err.message || 'Failed to resend invite.', type: 'error' });
    } finally {
      setBusyId(null);
    }
  };

  // A student added by name only gets their first invite sent here — same
  // endpoint as resend, which also accepts a parentEmail to set for the
  // first time (api/create-class.ts's handleResendStudentInvite).
  const handleSendFirstInvite = async (id: string) => {
    const email = addEmailValue.trim();
    if (!email) return;
    setBusyId(id);
    setMessage(null);
    try {
      await callEndpoint({ action: 'resend_student_invite', pendingStudentId: id, parentEmail: email });
      setMessage({ text: isKo ? '초대를 발송했습니다.' : 'Invite sent.', type: 'success' });
      setAddEmailForId(null);
      setAddEmailValue('');
    } catch (err: any) {
      setMessage({ text: err.message || 'Failed to send invite.', type: 'error' });
    } finally {
      setBusyId(null);
    }
  };

  const performRemove = async (id: string) => {
    setBusyId(id);
    setMessage(null);
    try {
      await callEndpoint({ action: 'remove_pending_student', pendingStudentId: id });
    } catch (err: any) {
      setMessage({ text: err.message || 'Failed to remove invite.', type: 'error' });
    } finally {
      setBusyId(null);
    }
  };

  // Roster-only invites (no parent email) redeem for whichever account opens
  // the link (api/redeem.ts only checks email when one is on file), so staff
  // can send them by KakaoTalk — how most academies reach parents.
  const copyKakaoInvite = async (s: PendingStudent) => {
    if (!s.inviteCode) return;
    const link = `https://www.chekkiai.com/?classCode=${s.inviteCode}`;
    const className = classes.find((c) => c.id === s.classId)?.name;
    const text = isKo
      ? `[Chekki AI] ${s.name} 학부모님, 아래 링크를 눌러 가입하시면 ${className ? `${className} 반에 ` : ''}바로 연결돼요. 카카오·Apple·이메일 어느 방법으로 가입해도 돼요. 학원 숙제 채점과 선생님 리포트를 무료로 받으실 수 있어요.\n${link}`
      : `[Chekki AI] Hi, this link connects ${s.name}'s parent to ${className || 'the class'}. Sign up any way you like (Kakao, Apple or email). Homework grading and teacher reports are free.\n${link}`;
    const ok = await copyToClipboard(text);
    setMessage(ok
      ? { text: isKo ? `${s.name} 초대 문구를 복사했어요. 카카오톡에 붙여 넣어 보내세요. 링크는 한 번만 쓸 수 있어요.` : `Copied ${s.name}'s invite. Paste it into KakaoTalk. The link works once.`, type: 'success' }
      : { text: isKo ? '복사에 실패했습니다. 다시 시도해 주세요.' : 'Copy failed. Please try again.', type: 'error' });
  };

  return (
    <section className="text-left text-ink">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className={staffUi.h2}>{isKo ? '학생 초대' : 'Invite students'}</h2>
          <p className={staffUi.sub}>
            {isKo ? '학부모 이메일로 초대를 보내거나, 이메일 없이 추가한 뒤 카카오톡으로 보낼 초대 문구를 복사하세요. 가입한 학생은 아래 학생 명단으로 옮겨집니다.' : 'Email each parent an invite, or add the student without an email and copy a KakaoTalk invite. Once they join, the student moves to the roster below.'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className={`${staffUi.quietBtn} focus-within:ring-2 focus-within:ring-line`}>
            <UploadSimple size={16} weight="bold" aria-hidden="true" />
            {isKo ? '엑셀 업로드' : 'Upload Excel/CSV'}
            <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" className="sr-only" onChange={handleFileChange} />
          </label>
          <button type="button" onClick={() => setShowAddForm((v) => !v)} aria-expanded={showAddForm} className={staffUi.primaryBtn}>
            <UserPlus size={18} weight="bold" aria-hidden="true" />
            {isKo ? '학생 추가' : 'Add student'}
          </button>
        </div>
      </div>

      {message && <p className={`mb-4 ${msgTone(message.type)}`} role="status">{message.text}</p>}

      {showAddForm && (
        <form onSubmit={handleAddSingle} className="mb-6 flex flex-wrap items-end gap-3 rounded-lg bg-sunken p-4">
          {classes.length > 1 && (
            <div className="min-w-[140px] flex-1">
              <label htmlFor="sip-class" className={staffUi.label}>{isKo ? '학급' : 'Class'}</label>
              <select id="sip-class" value={targetClassId} onChange={(e) => setTargetClassId(e.target.value)} className={staffUi.field}>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}
          <div className="min-w-[140px] flex-1">
            <label htmlFor="sip-name" className={staffUi.label}>{isKo ? '학생 이름' : 'Student name'}</label>
            <input id="sip-name" type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="David / 김다윗" required className={staffUi.field} />
          </div>
          <div className="min-w-[180px] flex-1">
            <label htmlFor="sip-email" className={staffUi.label}>{isKo ? '학부모 이메일 (선택)' : 'Parent email (optional)'}</label>
            <input id="sip-email" type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="parent@email.com" className={staffUi.field} />
          </div>
          <button type="submit" disabled={isSubmitting} className={staffUi.primaryBtn}>
            {isSubmitting ? '...' : newEmail.trim() ? (isKo ? '초대 발송' : 'Send invite') : (isKo ? '명단에 추가' : 'Add to roster')}
          </button>
        </form>
      )}

      {previewRows && (
        <div className="mb-6 rounded-lg bg-line-soft p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-[15px] font-bold">
              {isKo ? `${previewRows.length}명 확인됨 — 검토 후 전송하세요` : `${previewRows.length} ${previewRows.length === 1 ? 'student' : 'students'} found — review before sending`}
            </p>
            <button
              type="button"
              onClick={() => { setPreviewRows(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
              aria-label={isKo ? '닫기' : 'Close'}
              className={staffUi.iconBtn}
            >
              <X size={18} weight="bold" />
            </button>
          </div>
          <ul className="mb-3 max-h-40 space-y-1 overflow-y-auto text-[14px] text-ink-2">
            {previewRows.map((r, i) => (
              <li key={i} className="flex gap-2">
                <span className="font-bold text-ink">{r.name}</span>
                {r.parentEmail ? <span className="break-all">{r.parentEmail}</span> : <span className="text-ink-3">{isKo ? '이메일 없음 — 명단에만 추가' : 'no email — roster only'}</span>}
              </li>
            ))}
          </ul>
          <button type="button" disabled={isSubmitting} onClick={() => void submitStudents(previewRows)} className={`${staffUi.primaryBtn} w-full`}>
            {isSubmitting ? '...' : isKo ? `${previewRows.length}명 전체 초대` : `Invite all ${previewRows.length}`}
          </button>
        </div>
      )}

      {!hasLoaded ? (
        <p className={`${staffUi.sub} py-6 text-center`}>{isKo ? '초대 목록 불러오는 중...' : 'Loading invite list...'}</p>
      ) : waiting.length === 0 ? (
        <p className="rounded-lg bg-surface p-8 text-center ring-1 ring-inset ring-rule text-[15px] text-ink-3">
          {pending.length === 0
            ? (isKo ? '아직 초대한 학생이 없습니다.' : 'No students invited yet.')
            : (isKo ? '초대한 학부모가 모두 가입했습니다.' : 'Everyone you invited has joined.')}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-[15px]">
            <thead>
              <tr className="border-b border-rule">
                <th className={staffUi.th}>{isKo ? '학생' : 'Student'}</th>
                <th className={`${staffUi.th} hidden sm:table-cell`}>{isKo ? '학부모 이메일' : 'Parent email'}</th>
                <th className={staffUi.th}>{isKo ? '상태' : 'Status'}</th>
                <th className={`${staffUi.th} pr-0 text-right`}><span className="sr-only">{isKo ? '작업' : 'Actions'}</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule border-b border-rule">
              {waiting.map((s) => (
                <React.Fragment key={s.id}>
                  <tr>
                    <td className="py-3 pr-3 font-bold">
                      {s.name}
                      {/* Phones: email moves under the name — as its own
                          column it pushed Status/Actions off-screen. */}
                      <div className="mt-0.5 break-all text-[13px] font-normal text-ink-3 sm:hidden">
                        {s.parentEmail || (isKo ? '이메일 없음' : 'No email yet')}
                      </div>
                    </td>
                    <td className="hidden break-all py-3 pr-3 text-ink-2 sm:table-cell">
                      {s.parentEmail || <span className="text-ink-3">{isKo ? '이메일 없음' : 'No email yet'}</span>}
                    </td>
                    <td className="py-3 pr-3">
                      {s.status === 'redeemed' ? (
                        <span className={staffUi.pill.good}>{isKo ? '가입됨' : 'Joined'}</span>
                      ) : s.parentEmail ? (
                        <span className={staffUi.pill.warm}>{isKo ? '초대됨' : 'Invited'}</span>
                      ) : (
                        <span className={staffUi.pill.neutral}>{isKo ? '명단만' : 'Roster only'}</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap py-2 text-right">
                      <div className="inline-flex items-center gap-1">
                        {s.status === 'invited' && s.parentEmail && (
                          <button
                            type="button"
                            onClick={() => handleResend(s.id)}
                            disabled={busyId === s.id}
                            title={isKo ? '재전송' : 'Resend'}
                            aria-label={isKo ? `${s.name} 초대 재전송` : `Resend invite to ${s.name}`}
                            className={staffUi.iconBtn}
                          >
                            <PaperPlaneTilt size={18} weight="bold" />
                          </button>
                        )}
                        {s.status === 'invited' && !s.parentEmail && s.inviteCode && (
                          <button
                            type="button"
                            onClick={() => void copyKakaoInvite(s)}
                            title={isKo ? '카카오톡 초대 문구 복사' : 'Copy KakaoTalk invite'}
                            className={staffUi.quietBtn}
                          >
                            <ChatCircle size={16} weight="bold" aria-hidden="true" />
                            {isKo ? '카톡 초대' : 'Kakao invite'}
                          </button>
                        )}
                        {s.status === 'invited' && !s.parentEmail && (
                          <button
                            type="button"
                            onClick={() => { setAddEmailForId(s.id); setAddEmailValue(''); }}
                            disabled={busyId === s.id}
                            title={isKo ? '이메일 추가하고 초대 발송' : 'Add email and send invite'}
                            className={staffUi.quietBtn}
                          >
                            <PaperPlaneTilt size={16} weight="bold" aria-hidden="true" />
                            {isKo ? '이메일' : 'Email'}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setRemoveConfirm({ id: s.id, label: s.name })}
                          disabled={busyId === s.id}
                          title={isKo ? '삭제' : 'Remove'}
                          aria-label={isKo ? `${s.name} 삭제` : `Remove ${s.name}`}
                          className={`${staffUi.iconBtn} hover:text-wrong`}
                        >
                          <Trash size={18} weight="bold" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  {addEmailForId === s.id && (
                    <tr>
                      <td colSpan={4} className="pb-3">
                        <form
                          onSubmit={(e) => { e.preventDefault(); void handleSendFirstInvite(s.id); }}
                          className="flex flex-wrap items-center gap-2 rounded-lg bg-sunken p-3"
                        >
                          <input
                            type="email"
                            autoFocus
                            value={addEmailValue}
                            onChange={(e) => setAddEmailValue(e.target.value)}
                            placeholder="parent@email.com"
                            aria-label={isKo ? '학부모 이메일' : 'Parent email'}
                            required
                            className={`${staffUi.field} min-w-0 flex-1`}
                          />
                          <button type="submit" disabled={busyId === s.id} className={staffUi.primaryBtn}>{isKo ? '발송' : 'Send'}</button>
                          <button type="button" onClick={() => { setAddEmailForId(null); setAddEmailValue(''); }} className={staffUi.quietBtn}>{isKo ? '취소' : 'Cancel'}</button>
                        </form>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {removeConfirm && (
        <ConfirmDialog
          title={isKo ? `${removeConfirm.label} 초대를 삭제할까요?` : `Remove invite for ${removeConfirm.label}?`}
          confirmText={isKo ? '삭제' : 'Remove'}
          variant="destructive"
          isNight={isNight}
          onConfirm={() => {
            const { id } = removeConfirm;
            setRemoveConfirm(null);
            void performRemove(id);
          }}
          onCancel={() => setRemoveConfirm(null)}
        />
      )}
    </section>
  );
};
