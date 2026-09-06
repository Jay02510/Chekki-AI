import React, { useEffect, useState, useRef } from 'react';
import { UserPlus, UploadSimple, X } from '@phosphor-icons/react';
import { useDialogA11y } from '../../hooks/useDialogA11y';
import { useModalExit } from '../../hooks/useModalExit';
import { callStudentInviteEndpoint } from '../utils/studentInviteApi';

interface Props {
  isNight?: boolean;
  isKo?: boolean;
  classId: string;
  classes?: { id: string; name: string }[];
  onClose: () => void;
}

/**
 * Director/KT-facing "push an invite" enrollment path — the only way a
 * parent joins a class (Decision 001, docs/DECISIONS.md; the old self-serve
 * shared joinCode was removed). Staff can add a student one at a time or
 * bulk-upload an Excel/CSV roster; each row becomes a `pendingStudents` doc
 * (server-side only, see api/create-class.ts's add_students action) that
 * flips from "Invited" to "Joined" once api/redeem.ts's redeemClassCode
 * matches the redeeming parent's email against it.
 *
 * This is purely the add flow — viewing/resending/removing an existing
 * invite lives in StudentDatabaseGrid now (Audit: the same invited students
 * used to render in two separate tables here and there, with two different
 * status vocabularies).
 */
export const StudentInvitePanel: React.FC<Props> = ({
  isNight = true,
  isKo = false,
  classId,
  classes = [],
  onClose,
}) => {
  const { isClosing, close } = useModalExit(onClose);
  const dialogRef = useDialogA11y<HTMLDivElement>({ isOpen: true, onClose: close });
  const [showAddForm, setShowAddForm] = useState(true);
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
  const [previewRows, setPreviewRows] = useState<{ name: string; parentEmail: string }[] | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const submitStudents = async (students: { name: string; parentEmail: string }[]) => {
    setIsSubmitting(true);
    setMessage(null);
    try {
      const data = await callStudentInviteEndpoint({ action: 'add_students', classId: targetClassId, students });
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

  return (
    <div className="fixed inset-0 z-[460] flex items-center justify-center p-4">
      <div
        className={`absolute inset-0 bg-black/80 backdrop-blur-md ${isClosing ? 'modal-backdrop-exit' : ''}`}
        onClick={close}
        aria-hidden="true"
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="invite-students-title"
        tabIndex={-1}
        className={`relative p-1 rounded-[2.5rem] text-left shadow-2xl flex flex-col w-full max-w-2xl mx-4 max-h-[90vh] transition-colors ${isClosing ? 'modal-exit' : 'modal-enter'} ${
          isNight ? 'bg-white/5 border border-white/10' : 'bg-white border border-zinc-200'
        }`}
      >
        <div className={`relative w-full h-full rounded-[calc(2.5rem-0.25rem)] p-6 sm:p-8 overflow-y-auto custom-scrollbar transition-colors ${isNight ? 'bg-brand-dark' : 'bg-white'}`}>
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
                <UserPlus size={22} weight="bold" />
              </div>
              <div>
                <h4 id="invite-students-title" className={`text-lg font-black ${isNight ? 'text-white' : 'text-zinc-900'}`}>
                  {isKo ? '학생 초대하기' : 'Invite Students'}
                </h4>
                <p className="text-xs text-zinc-400 leading-normal">
                  {isKo ? '학부모가 직접 코드를 입력하지 않아도, 이메일로 바로 초대할 수 있습니다.' : 'Push an invite to a parent\'s email instead of waiting on the self-serve code.'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={close}
              aria-label={isKo ? '닫기' : 'Close'}
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors cursor-pointer ${
                isNight ? 'bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white' : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-500 hover:text-zinc-900'
              }`}
            >
              <X size={16} weight="bold" />
            </button>
          </div>

          <div className="flex items-center gap-2 mb-6">
            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold border cursor-pointer transition-colors flex items-center gap-1.5 ${
                showAddForm
                  ? 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border-blue-500/30'
                  : isNight
                    ? 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'
                    : 'bg-zinc-100 border-zinc-300 text-zinc-600 hover:text-zinc-900'
              }`}
            >
              <UserPlus size={14} weight="bold" />
              {isKo ? '한 명 추가' : 'Add One'}
            </button>
            <label
              className={`px-3.5 py-2 rounded-xl text-xs font-bold border cursor-pointer transition-colors flex items-center gap-1.5 ${
                isNight ? 'bg-white/5 hover:bg-white/10 border-white/10 text-zinc-300' : 'bg-zinc-100 hover:bg-zinc-200 border-zinc-300 text-zinc-600'
              }`}
            >
              <UploadSimple size={14} weight="bold" />
              {isKo ? '엑셀 업로드' : 'Upload Excel/CSV'}
              <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFileChange} />
            </label>
          </div>

          {message && (
            <p className={`text-xs font-bold mb-4 ${message.type === 'error' ? 'text-rose-400' : 'text-emerald-400'}`}>{message.text}</p>
          )}

          {showAddForm && (
            <form onSubmit={handleAddSingle} className="flex flex-wrap items-end gap-2 mb-2 p-4 rounded-2xl bg-white/5 border border-white/10">
              {classes.length > 1 && (
                <div className="flex-1 min-w-[140px]">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase block mb-1">
                    {isKo ? '학급' : 'Class'}
                  </label>
                  <select
                    value={targetClassId}
                    onChange={(e) => setTargetClassId(e.target.value)}
                    className={`w-full p-2.5 rounded-xl border text-xs font-bold outline-none ${isNight ? 'bg-brand-dark border-white/10 text-white' : 'bg-zinc-50 border-zinc-300 text-zinc-900'}`}
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
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
            <div className="mt-4 p-4 rounded-2xl bg-blue-500/5 border border-blue-500/20">
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
                      <span className="italic text-zinc-400">{isKo ? '이메일 없음 — 명단에만 추가' : 'no email — roster only'}</span>
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

          <p className="text-[11px] text-zinc-500 mt-4">
            {isKo
              ? '이미 초대한 학생의 상태 확인, 재전송, 삭제는 아래 학생 명단 표에서 관리하세요.'
              : 'Manage existing invites — status, resend, remove — from the student table below once this closes.'}
          </p>
        </div>
      </div>
    </div>
  );
};
