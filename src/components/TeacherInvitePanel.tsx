import React, { useEffect, useState, useCallback } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { auth, dbInstance } from '../../services/database';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { staffUi, msgTone } from './staffUi';

interface Invite {
  id: string;
  role: 'ft' | 'kt';
  status: 'pending' | 'claimed' | 'revoked';
  email: string | null;
  classId?: string;
}

interface Props {
  isNight?: boolean;
  isKo?: boolean;
  schoolId: string;
  seatsTotal: { ft: number; kt: number };
  classes: { id: string; name: string }[];
}

/**
 * Director-facing invite generator, shared between the activation wizard
 * (Step 3) and the permanent Director dashboard. Replaces the old single
 * guessable invite link + dead staffEmails field (audit §21/§22) — every
 * invite here is role-locked and seat-checked server-side by
 * api/create-teacher-invite.ts before it's ever created.
 */
export const TeacherInvitePanel: React.FC<Props> = ({ isNight = true, isKo = true, schoolId, seatsTotal, classes }) => {
  const [invites, setInvites] = useState<Invite[]>([]);
  const [showUpgradeConfirm, setShowUpgradeConfirm] = useState(false);
  const [role, setRole] = useState<'ft' | 'kt'>('ft');
  const [classId, setClassId] = useState(classes[0]?.id || '');
  const [email, setEmail] = useState('');
  const [noEmailYet, setNoEmailYet] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'error' | 'success' } | null>(null);
  const [lastLink, setLastLink] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [justCopied, setJustCopied] = useState(false);

  // Bulk invite: paste several emails at once instead of filling the single
  // form N times during initial school setup, when a director has a full
  // roster of FT/KT seats to fill in one sitting.
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [bulkEmailsInput, setBulkEmailsInput] = useState('');
  const [bulkProgress, setBulkProgress] = useState<{ done: number; total: number } | null>(null);
  const [bulkResults, setBulkResults] = useState<Array<{ email: string; success: boolean; error?: string }>>([]);

  const copyInviteLink = async (link: string) => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(link);
      } else {
        throw new Error('clipboard API unavailable');
      }
    } catch {
      // Fallback for webviews/browsers that block navigator.clipboard
      // (e.g. no clipboard-write permission) — silent failure was the
      // bug reported: button did nothing with no error either.
      const textarea = document.createElement('textarea');
      textarea.value = link;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
      } catch {
        setMessage({ text: isKo ? '복사에 실패했습니다. 링크를 직접 선택해 복사하세요.' : 'Copy failed — select the link text manually.', type: 'error' });
        document.body.removeChild(textarea);
        return;
      }
      document.body.removeChild(textarea);
    }
    setJustCopied(true);
    setTimeout(() => setJustCopied(false), 2000);
  };

  useEffect(() => {
    if (!classes.some((c) => c.id === classId)) {
      setClassId(classes[0]?.id || '');
    }
  }, [classes, classId]);

  useEffect(() => {
    if (!schoolId) return;
    const q = query(collection(dbInstance, 'invites'), where('schoolId', '==', schoolId));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setInvites(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
      },
      (err) => console.warn('Failed to load invites:', err)
    );
    return () => unsub();
  }, [schoolId]);

  const usedForRole = useCallback(
    (r: 'ft' | 'kt') => invites.filter((i) => i.role === r && (i.status === 'pending' || i.status === 'claimed')).length,
    [invites]
  );

  const remainingFt = Math.max(0, (seatsTotal.ft || 0) - usedForRole('ft'));
  const remainingKt = Math.max(0, (seatsTotal.kt || 0) - usedForRole('kt'));

  const handleSendInvite = async () => {
    setMessage(null);
    setLastLink(null);
    if (!noEmailYet && !email.trim()) {
      setMessage({ text: isKo ? '이메일을 입력하거나 "아직 없음"을 선택하세요.' : 'Enter an email or check "no email yet".', type: 'error' });
      return;
    }
    if (!classId) {
      setMessage({ text: isKo ? '배정할 학급을 선택하세요.' : 'Pick a class for this teacher to join.', type: 'error' });
      return;
    }
    setIsSending(true);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const response = await fetch('/api/create-teacher-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ role, email: noEmailYet ? undefined : email.trim(), classId }),
      });
      const data = await response.json();
      if (!response.ok) {
        setMessage({ text: data.error || (isKo ? '초대 생성에 실패했습니다.' : 'Failed to create invite.'), type: 'error' });
        // Trial-expiry soft-lock (api/create-teacher-invite.ts) — the upgrade
        // path should be one click away here too, not just a dead-end error.
        if (data.trialExpired) {
          setShowUpgradeConfirm(true);
        }
        return;
      }
      // data.emailSent reflects whether the Resend call actually succeeded —
      // previously this always claimed success regardless (Audit: invite
      // email reports success while the send failed).
      if (noEmailYet) {
        setMessage({ text: isKo ? '초대 링크가 생성되었습니다. 아래에서 복사하세요.' : 'Invite link created — copy it below.', type: 'success' });
      } else if (data.emailSent) {
        setMessage({ text: isKo ? `${email} 주소로 초대 이메일을 전송했습니다.` : `Invite email sent to ${email}.`, type: 'success' });
      } else {
        setMessage({
          text: data.resendConfigured
            ? (isKo ? `초대는 생성되었지만 ${email}로 이메일 전송에 실패했습니다. 아래 링크를 직접 전달해주세요.` : `Invite created, but the email to ${email} failed to send. Share the link below directly.`)
            : (isKo ? '초대는 생성되었지만 이메일 발송이 설정되지 않았습니다. 아래 링크를 직접 전달해주세요.' : 'Invite created, but email sending isn\'t configured. Share the link below directly.'),
          type: 'error',
        });
      }
      setLastLink(data.inviteUrl);
      setEmail('');
      setNoEmailYet(false);
    } catch (err) {
      setMessage({ text: isKo ? '네트워크 오류가 발생했습니다.' : 'Network error — please try again.', type: 'error' });
    } finally {
      setIsSending(false);
    }
  };

  const handleSendBulkInvites = async () => {
    setMessage(null);
    setBulkResults([]);
    const emails = Array.from(
      new Set(
        bulkEmailsInput
          .split('\n')
          .map((e) => e.trim())
          .filter(Boolean)
      )
    );
    if (emails.length === 0) {
      setMessage({ text: isKo ? '이메일을 한 줄에 하나씩 입력하세요.' : 'Enter one email per line.', type: 'error' });
      return;
    }
    if (!classId) {
      setMessage({ text: isKo ? '배정할 학급을 선택하세요.' : 'Pick a class for this teacher to join.', type: 'error' });
      return;
    }
    setIsSending(true);
    setBulkProgress({ done: 0, total: emails.length });
    // Sequential, not Promise.all — the backend re-reads the seat count per
    // request rather than in a transaction, so firing these in parallel near
    // the seat cap could let more invites through than seats actually allow.
    const results: Array<{ email: string; success: boolean; error?: string }> = [];
    for (const inviteEmail of emails) {
      try {
        const idToken = await auth.currentUser?.getIdToken();
        const response = await fetch('/api/create-teacher-invite', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
          body: JSON.stringify({ role, email: inviteEmail, classId }),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          results.push({ email: inviteEmail, success: false, error: data.error || 'failed' });
          if (data.trialExpired) setShowUpgradeConfirm(true);
        } else if (!data.emailSent) {
          // Invite record was created but the actual email didn't go out —
          // don't report this row as a plain success (Audit: invite email
          // reports success while the send failed).
          results.push({
            email: inviteEmail,
            success: false,
            error: isKo ? '초대는 생성됐지만 이메일 발송 실패' : 'invite created but email failed to send',
          });
        } else {
          results.push({ email: inviteEmail, success: true });
        }
      } catch (err) {
        results.push({ email: inviteEmail, success: false, error: isKo ? '네트워크 오류' : 'network error' });
      }
      setBulkResults([...results]);
      setBulkProgress({ done: results.length, total: emails.length });
    }
    setIsSending(false);
    const successCount = results.filter((r) => r.success).length;
    setMessage({
      text: isKo
        ? `${successCount}/${emails.length}건 초대를 보냈습니다.`
        : `Sent ${successCount}/${emails.length} invites.`,
      type: successCount === emails.length ? 'success' : 'error',
    });
    if (successCount === emails.length) {
      setBulkEmailsInput('');
    } else {
      // Leave only the failed emails in the textarea so the director can
      // fix and resubmit without retyping everything that already worked.
      setBulkEmailsInput(results.filter((r) => !r.success).map((r) => r.email).join('\n'));
    }
  };

  const handleRevokeInvite = async (inviteId: string) => {
    setRevokingId(inviteId);
    setMessage(null);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const response = await fetch('/api/create-teacher-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ action: 'revoke_invite', inviteId }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Failed to revoke invite.');
      setMessage({ text: isKo ? '초대가 취소되었고 좌석이 반환되었습니다.' : 'Invite revoked — the seat is free again.', type: 'success' });
    } catch (err: any) {
      setMessage({ text: err.message || (isKo ? '초대 취소에 실패했습니다.' : 'Failed to revoke invite.'), type: 'error' });
    } finally {
      setRevokingId(null);
    }
  };

  const liveInvites = invites.filter((inv) => inv.status !== 'revoked');
  const noSeats = role === 'ft' ? remainingFt <= 0 : remainingKt <= 0;

  return (
    <section className="space-y-6 text-left text-ink">
      <div>
        <h2 className={staffUi.h2}>{isKo ? '선생님' : 'Teachers'}</h2>
        <p className={`${staffUi.sub} tabular-nums`}>
          {isKo ? `남은 좌석: FT ${remainingFt}석 · KT ${remainingKt}석` : `Seats left: FT ${remainingFt} · KT ${remainingKt}`}
        </p>
      </div>

      <div className="space-y-4 rounded-lg border border-rule bg-surface p-5">
        <h3 className={staffUi.h3}>{isKo ? '선생님 초대' : 'Invite a teacher'}</h3>

        <div className="flex gap-1 rounded-md bg-sunken p-1" role="radiogroup" aria-label={isKo ? '선생님 유형' : 'Teacher type'}>
          {([
            ['ft', isKo ? '원어민 선생님 (FT)' : 'Foreign teacher (FT)'],
            ['kt', isKo ? '한국인 선생님 (KT)' : 'Korean teacher (KT)'],
          ] as const).map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={role === id}
              onClick={() => setRole(id)}
              className={`min-h-10 flex-1 cursor-pointer rounded px-3 text-[14px] font-bold ${
                role === id ? 'bg-surface text-ink shadow-[0_1px_2px_rgba(43,33,26,0.12)]' : 'text-ink-2 hover:text-ink'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div>
          <label htmlFor="tip-class" className={staffUi.label}>{isKo ? '배정할 학급' : 'Assign to class'}</label>
          <select id="tip-class" value={classId} onChange={(e) => setClassId(e.target.value)} className={`${staffUi.field} font-semibold`}>
            {classes.length === 0 && <option value="">{isKo ? '학급 없음' : 'No classes yet'}</option>}
            {classes.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {!isBulkMode ? (
          <div className="space-y-2">
            <label htmlFor="tip-email" className={staffUi.label}>{isKo ? '선생님 이메일' : "Teacher's email"}</label>
            <input
              id="tip-email"
              type="email"
              value={email}
              disabled={noEmailYet}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="teacher@email.com"
              className={`${staffUi.field} disabled:cursor-not-allowed disabled:opacity-50`}
            />
            <label className="flex min-h-11 cursor-pointer items-center gap-2.5 text-[14px] text-ink-2">
              <input type="checkbox" checked={noEmailYet} onChange={(e) => setNoEmailYet(e.target.checked)} className="h-5 w-5 accent-[var(--m-line)]" />
              {isKo ? '아직 이메일을 몰라요 (1회용 초대 링크 만들기)' : "I don't know their email yet (make a single-use link instead)"}
            </label>
          </div>
        ) : (
          <div className="space-y-2">
            <label htmlFor="tip-bulk" className={staffUi.label}>{isKo ? '이메일 (한 줄에 하나씩)' : 'Emails, one per line'}</label>
            <textarea
              id="tip-bulk"
              value={bulkEmailsInput}
              onChange={(e) => setBulkEmailsInput(e.target.value)}
              rows={5}
              placeholder={'teacher1@example.com\nteacher2@example.com'}
              className={`${staffUi.field} py-2.5`}
            />
            {bulkProgress && (
              <p className="text-[13px] text-ink-3 tabular-nums" role="status">
                {isKo ? `전송 중 ${bulkProgress.done}/${bulkProgress.total}` : `Sending ${bulkProgress.done}/${bulkProgress.total}`}
              </p>
            )}
            {bulkResults.length > 0 && (
              <ul className="max-h-32 space-y-1 overflow-y-auto pt-1 text-[14px]">
                {bulkResults.map((r, idx) => (
                  <li key={`${r.email}-${idx}`} className="flex items-center justify-between gap-2">
                    <span className="truncate text-ink-2">{r.email}</span>
                    <span className={`shrink-0 font-bold ${r.success ? 'text-correct' : 'text-wrong'}`}>
                      {r.success ? (isKo ? '전송됨' : 'Sent') : r.error || (isKo ? '실패' : 'Failed')}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              setMessage(null);
              setIsBulkMode((prev) => !prev);
            }}
            className="min-h-10 cursor-pointer text-[14px] font-bold text-line-ink hover:underline"
          >
            {isBulkMode
              ? (isKo ? '한 명씩 초대하기' : 'Invite one at a time')
              : (isKo ? '여러 명 한번에 초대하기' : 'Invite several at once')}
          </button>
          <button
            type="button"
            onClick={isBulkMode ? handleSendBulkInvites : handleSendInvite}
            disabled={isSending || !classId || noSeats}
            className={staffUi.primaryBtn}
          >
            {isSending
              ? (isKo ? '전송 중...' : 'Sending...')
              : noSeats
              ? (isKo ? '남은 좌석 없음' : 'No seats left')
              : isBulkMode
              ? (isKo ? '모두 초대 보내기' : 'Send all invites')
              : noEmailYet
              ? (isKo ? '초대 링크 만들기' : 'Make invite link')
              : (isKo ? '초대 이메일 보내기' : 'Send invite email')}
          </button>
        </div>

        {message && <p className={msgTone(message.type)} role="status">{message.text}</p>}
        {lastLink && (
          <div className="flex items-center gap-2">
            <input readOnly value={lastLink} aria-label={isKo ? '초대 링크' : 'Invite link'} className={`${staffUi.field} min-w-0 flex-1 bg-sunken text-[14px]`} />
            <button type="button" onClick={() => copyInviteLink(lastLink)} className={staffUi.quietBtn}>
              {justCopied ? (isKo ? '복사됨' : 'Copied') : (isKo ? '복사' : 'Copy')}
            </button>
          </div>
        )}
      </div>

      {liveInvites.length > 0 && (
        <div>
          <h3 className={`${staffUi.h3} mb-1`}>{isKo ? '보낸 초대' : 'Sent invites'}</h3>
          <ul className={`${staffUi.rows} max-h-72 overflow-y-auto`}>
            {liveInvites.map((inv) => (
              <li key={inv.id} className="flex min-h-12 items-center gap-3 py-2 text-[15px]">
                <span className="min-w-0 flex-1 truncate text-ink-2">{inv.email || (isKo ? '(링크 전용)' : '(link only)')}</span>
                <span className="shrink-0 text-[13px] font-bold text-ink-3">{inv.role.toUpperCase()}</span>
                <span className={inv.status === 'claimed' ? staffUi.pill.good : staffUi.pill.neutral}>
                  {inv.status === 'claimed' ? (isKo ? '수락됨' : 'Joined') : (isKo ? '대기중' : 'Pending')}
                </span>
                {inv.status === 'pending' && (
                  <button
                    type="button"
                    onClick={() => handleRevokeInvite(inv.id)}
                    disabled={revokingId === inv.id}
                    className={`${staffUi.dangerText} min-h-10 shrink-0`}
                  >
                    {revokingId === inv.id ? (isKo ? '취소 중…' : 'Revoking…') : (isKo ? '취소' : 'Revoke')}
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {showUpgradeConfirm && (
        <ConfirmDialog
          title={isKo ? '지금 업그레이드하시겠습니까?' : 'Upgrade now?'}
          confirmText={isKo ? '업그레이드' : 'Upgrade'}
          cancelText={isKo ? '취소' : 'Cancel'}
          isNight={isNight}
          onConfirm={() => {
            window.location.href = '/schools';
          }}
          onCancel={() => setShowUpgradeConfirm(false)}
        />
      )}
    </section>
  );
};
