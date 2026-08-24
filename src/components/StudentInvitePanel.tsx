import React, { useEffect, useState, useRef } from 'react';
import { collection, query, where, onSnapshot, Timestamp } from 'firebase/firestore';
import { UserPlus, UploadSimple, X, PaperPlaneTilt, Trash } from '@phosphor-icons/react';
import { auth, dbInstance } from '../../services/database';
import { ConfirmDialog } from '../../components/ConfirmDialog';

interface PendingStudent {
  id: string;
  name: string;
  parentEmail: string;
  inviteCode?: string;
  status: 'invited' | 'redeemed';
  addedAt?: Timestamp;
  redeemedAt?: Timestamp;
}

interface Props {
  isNight?: boolean;
  isKo?: boolean;
  classId: string;
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
export const StudentInvitePanel: React.FC<Props> = ({ isNight = true, isKo = false, classId }) => {
  const [pending, setPending] = useState<PendingStudent[]>([]);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
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
    let retried = false;
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
        },
        (err) => {
          console.warn('Failed to load pending student invites:', err?.code, err);
          // firestore.rules re-reads the caller's own user doc on every
          // attach to check schoolId; right after creating a brand-new
          // class that read can transiently permission-deny before the
          // director's session settles. One silent retry avoids scaring
          // staff with an error on a class that's a second old.
          if (err?.code === 'permission-denied' && !retried) {
            retried = true;
            unsub?.();
            setTimeout(() => {
              if (!cancelled) attach();
            }, 1500);
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
      const data = await callEndpoint({ action: 'add_students', classId, students });
      const withEmail = data.added - (data.addedWithoutEmail || 0);
      if (data.addedWithoutEmail > 0 && withEmail === 0) {
        setMessage({
          text: isKo
            ? `${data.added}명이 학급 명단에 추가되었습니다. 이메일이 없어 초대는 발송되지 않았습니다 — 나중에 이메일을 추가하거나 코드를 직접 전달하세요.`
            : `${data.added} student(s) added to the class roster. No email on file, so no invite was sent — add one later or share the code directly.`,
          type: 'success',
        });
      } else if (!data.resendConfigured && withEmail > 0) {
        setMessage({
          text: isKo
            ? `${data.added}명 추가됨 — 이메일 발송이 설정되지 않아 코드를 직접 전달해야 합니다.`
            : `${data.added} student(s) added — email sending isn't configured, so codes weren't sent. Share them manually.`,
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
        setMessage({ text: isKo ? `${data.added}명 초대 완료!` : `Invited ${data.added} student(s)!`, type: 'success' });
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

  return (
    <div className={`p-1 rounded-[2.5rem] text-left transition-colors ${
      isNight ? 'bg-white/5 border border-white/10 shadow-2xl' : 'bg-white border border-zinc-200 shadow-md'
    }`}>
      <div className={`rounded-[calc(2.5rem-0.25rem)] p-6 sm:p-8 transition-colors ${isNight ? 'bg-brand-dark' : 'bg-white'}`}>
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
              <UserPlus size={22} weight="bold" />
            </div>
            <div>
              <h4 className={`text-lg font-black ${isNight ? 'text-white' : 'text-zinc-900'}`}>
                {isKo ? '학생 초대하기' : 'Invite Students'}
              </h4>
              <p className="text-xs text-zinc-400 leading-normal">
                {isKo ? '학부모가 직접 코드를 입력하지 않아도, 이메일로 바로 초대할 수 있습니다.' : 'Push an invite to a parent\'s email instead of waiting on the self-serve code.'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowAddForm((v) => !v)}
              className="px-3.5 py-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-xs font-bold border border-blue-500/30 cursor-pointer transition-colors flex items-center gap-1.5"
            >
              <UserPlus size={14} weight="bold" />
              {isKo ? '학생 추가' : 'Add Student'}
            </button>
            <label className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-bold border border-white/10 cursor-pointer transition-colors flex items-center gap-1.5">
              <UploadSimple size={14} weight="bold" />
              {isKo ? '엑셀 업로드' : 'Upload Excel/CSV'}
              <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFileChange} />
            </label>
          </div>
        </div>

        {message && (
          <p className={`text-xs font-bold mb-4 ${message.type === 'error' ? 'text-rose-400' : 'text-emerald-400'}`}>{message.text}</p>
        )}

        {showAddForm && (
          <form onSubmit={handleAddSingle} className="flex flex-wrap items-end gap-2 mb-6 p-4 rounded-2xl bg-white/5 border border-white/10">
            <div className="flex-1 min-w-[140px]">
              <label className="text-[10px] font-bold text-zinc-400 uppercase block mb-1">{isKo ? '학생 이름' : 'Student Name'}</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="David / 김다윗"
                required
                className={`w-full p-2.5 rounded-xl border text-xs font-bold outline-none ${isNight ? 'bg-brand-dark border-white/10 text-white' : 'bg-zinc-50 border-zinc-300 text-zinc-900'}`}
              />
            </div>
            <div className="flex-1 min-w-[180px]">
              <label className="text-[10px] font-bold text-zinc-400 uppercase block mb-1">
                {isKo ? '학부모 이메일 (선택)' : 'Parent Email (optional)'}
              </label>
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="parent@email.com"
                className={`w-full p-2.5 rounded-xl border text-xs font-bold outline-none ${isNight ? 'bg-brand-dark border-white/10 text-white' : 'bg-zinc-50 border-zinc-300 text-zinc-900'}`}
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 disabled:opacity-40 text-white text-xs font-bold cursor-pointer transition-colors"
            >
              {isSubmitting ? '...' : newEmail.trim() ? (isKo ? '초대 발송' : 'Send Invite') : (isKo ? '명단에 추가' : 'Add to Roster')}
            </button>
          </form>
        )}

        {previewRows && (
          <div className="mb-6 p-4 rounded-2xl bg-blue-500/5 border border-blue-500/20">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold text-blue-400">
                {isKo ? `${previewRows.length}명 확인됨 — 검토 후 전송하세요` : `${previewRows.length} student(s) found — review before sending`}
              </p>
              <button type="button" onClick={() => { setPreviewRows(null); if (fileInputRef.current) fileInputRef.current.value = ''; }} className="text-zinc-400 hover:text-white cursor-pointer">
                <X size={16} weight="bold" />
              </button>
            </div>
            <div className="max-h-40 overflow-y-auto space-y-1 mb-3">
              {previewRows.map((r, i) => (
                <div key={i} className="text-[11px] text-zinc-400 flex gap-2">
                  <span className="font-bold text-zinc-200">{r.name}</span>
                  {r.parentEmail ? (
                    <span className="font-mono">{r.parentEmail}</span>
                  ) : (
                    <span className="italic text-zinc-500">{isKo ? '이메일 없음 — 명단에만 추가' : 'no email — roster only'}</span>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => void submitStudents(previewRows)}
              className="w-full py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 disabled:opacity-40 text-white text-xs font-bold cursor-pointer transition-colors"
            >
              {isSubmitting ? '...' : isKo ? `${previewRows.length}명 전체 초대` : `Invite all ${previewRows.length}`}
            </button>
          </div>
        )}

        {!hasLoaded ? (
          <p className="text-xs text-zinc-500 text-center py-6">
            {isKo ? '초대 목록 불러오는 중...' : 'Loading invite list...'}
          </p>
        ) : pending.length === 0 ? (
          <p className="text-xs text-zinc-500 text-center py-6">
            {isKo ? '아직 초대한 학생이 없습니다.' : 'No students invited yet.'}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className={`border-b text-zinc-500 font-bold uppercase tracking-wider text-[10px] ${isNight ? 'border-white/5' : 'border-zinc-200'}`}>
                  <th className="pb-3 pl-1">{isKo ? '학생' : 'Student'}</th>
                  <th className="pb-3">{isKo ? '학부모 이메일' : 'Parent Email'}</th>
                  <th className="pb-3">{isKo ? '상태' : 'Status'}</th>
                  <th className="pb-3 text-right pr-1">{isKo ? '작업' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isNight ? 'divide-white/5' : 'divide-zinc-200'}`}>
                {pending.map((s) => (
                  <React.Fragment key={s.id}>
                    <tr>
                      <td className={`py-3 pl-1 font-bold ${isNight ? 'text-white' : 'text-zinc-900'}`}>{s.name}</td>
                      <td className="py-3 font-mono text-zinc-400">
                        {s.parentEmail || <span className="italic text-zinc-600">{isKo ? '이메일 없음' : 'no email yet'}</span>}
                      </td>
                      <td className="py-3">
                        {s.status === 'redeemed' ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                            ✓ {isKo ? '가입됨' : 'Joined'}
                          </span>
                        ) : s.parentEmail ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 border border-amber-500/20 text-amber-400">
                            ⏳ {isKo ? '초대됨' : 'Invited'}
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-500/10 border border-blue-500/20 text-blue-400">
                            📋 {isKo ? '학급 명단만' : 'Class roster only'}
                          </span>
                        )}
                      </td>
                      <td className="py-3 text-right pr-1 space-x-2 whitespace-nowrap">
                        {s.status === 'invited' && s.parentEmail && (
                          <button
                            type="button"
                            onClick={() => handleResend(s.id)}
                            disabled={busyId === s.id}
                            title={isKo ? '재전송' : 'Resend'}
                            className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10 disabled:opacity-40 cursor-pointer transition-colors inline-flex items-center"
                          >
                            <PaperPlaneTilt size={12} weight="bold" />
                          </button>
                        )}
                        {s.status === 'invited' && !s.parentEmail && (
                          <button
                            type="button"
                            onClick={() => { setAddEmailForId(s.id); setAddEmailValue(''); }}
                            disabled={busyId === s.id}
                            title={isKo ? '이메일 추가하고 초대 발송' : 'Add email and send invite'}
                            className="px-2.5 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 disabled:opacity-40 cursor-pointer transition-colors inline-flex items-center gap-1"
                          >
                            <PaperPlaneTilt size={12} weight="bold" />
                            <span className="text-[10px] font-bold">{isKo ? '이메일 추가' : 'Add Email'}</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setRemoveConfirm({ id: s.id, label: s.name })}
                          disabled={busyId === s.id}
                          title={isKo ? '삭제' : 'Remove'}
                          className="px-2.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 disabled:opacity-40 cursor-pointer transition-colors inline-flex items-center"
                        >
                          <Trash size={12} weight="bold" />
                        </button>
                      </td>
                    </tr>
                    {addEmailForId === s.id && (
                      <tr>
                        <td colSpan={4} className="pb-3">
                          <form
                            onSubmit={(e) => { e.preventDefault(); void handleSendFirstInvite(s.id); }}
                            className="flex items-center gap-2 p-3 rounded-xl bg-blue-500/5 border border-blue-500/20"
                          >
                            <input
                              type="email"
                              autoFocus
                              value={addEmailValue}
                              onChange={(e) => setAddEmailValue(e.target.value)}
                              placeholder="parent@email.com"
                              required
                              className={`flex-1 min-w-0 p-2 rounded-lg border text-xs font-bold outline-none ${isNight ? 'bg-brand-dark border-white/10 text-white' : 'bg-white border-zinc-300 text-zinc-900'}`}
                            />
                            <button
                              type="submit"
                              disabled={busyId === s.id}
                              className="px-3 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 disabled:opacity-40 text-white text-[11px] font-bold cursor-pointer transition-colors"
                            >
                              {isKo ? '발송' : 'Send'}
                            </button>
                            <button
                              type="button"
                              onClick={() => { setAddEmailForId(null); setAddEmailValue(''); }}
                              className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 text-[11px] font-bold cursor-pointer transition-colors"
                            >
                              {isKo ? '취소' : 'Cancel'}
                            </button>
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
      </div>

      {removeConfirm && (
        <ConfirmDialog
          title={`Remove invite for ${removeConfirm.label}?`}
          confirmText="Remove"
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
    </div>
  );
};
