import React, { useEffect, useState, useCallback } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { auth, dbInstance } from '../../services/database';
import { ConfirmDialog } from '../../components/ConfirmDialog';

interface Invite {
  id: string;
  role: 'ft' | 'kt';
  status: 'pending' | 'claimed' | 'revoked';
  email: string | null;
}

interface Props {
  isNight?: boolean;
  isKo?: boolean;
  schoolId: string;
  seatsTotal: { ft: number; kt: number };
}

/**
 * Director-facing invite generator, shared between the activation wizard
 * (Step 3) and the permanent Director dashboard. Replaces the old single
 * guessable invite link + dead staffEmails field (audit §21/§22) — every
 * invite here is role-locked and seat-checked server-side by
 * api/create-teacher-invite.ts before it's ever created.
 */
export const TeacherInvitePanel: React.FC<Props> = ({ isNight = true, isKo = true, schoolId, seatsTotal }) => {
  const [invites, setInvites] = useState<Invite[]>([]);
  const [showUpgradeConfirm, setShowUpgradeConfirm] = useState(false);
  const [role, setRole] = useState<'ft' | 'kt'>('ft');
  const [email, setEmail] = useState('');
  const [noEmailYet, setNoEmailYet] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'error' | 'success' } | null>(null);
  const [lastLink, setLastLink] = useState<string | null>(null);

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
    setIsSending(true);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const response = await fetch('/api/create-teacher-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ role, email: noEmailYet ? undefined : email.trim() }),
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
      setMessage({
        text: noEmailYet
          ? (isKo ? '초대 링크가 생성되었습니다. 아래에서 복사하세요.' : 'Invite link created — copy it below.')
          : (isKo ? `${email} 주소로 초대 이메일을 전송했습니다.` : `Invite email sent to ${email}.`),
        type: 'success',
      });
      setLastLink(data.inviteUrl);
      setEmail('');
      setNoEmailYet(false);
    } catch (err) {
      setMessage({ text: isKo ? '네트워크 오류가 발생했습니다.' : 'Network error — please try again.', type: 'error' });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className={`rounded-2xl border p-5 space-y-4 ${isNight ? 'bg-white/5 border-white/10' : 'bg-zinc-50 border-zinc-200'}`}>
      <div className="flex items-center justify-between">
        <h3 className="font-black text-sm">{isKo ? '선생님 초대' : 'Invite Teachers'}</h3>
        <div className="flex gap-2 text-[11px] font-mono font-bold">
          <span className="px-2 py-1 rounded-lg bg-orange-500/10 text-orange-400 border border-orange-500/20">
            FT {remainingFt}/{seatsTotal.ft}
          </span>
          <span className="px-2 py-1 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
            KT {remainingKt}/{seatsTotal.kt}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setRole('ft')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
            role === 'ft' ? 'bg-orange-500 border-orange-500 text-white' : isNight ? 'bg-white/5 border-white/10 text-zinc-400' : 'bg-white border-zinc-300 text-zinc-600'
          }`}
        >
          {isKo ? '원어민 선생님 (FT)' : 'Foreign Teacher (FT)'}
        </button>
        <button
          type="button"
          onClick={() => setRole('kt')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
            role === 'kt' ? 'bg-blue-500 border-blue-500 text-white' : isNight ? 'bg-white/5 border-white/10 text-zinc-400' : 'bg-white border-zinc-300 text-zinc-600'
          }`}
        >
          {isKo ? '한국인 선생님 (KT)' : 'Korean Teacher (KT)'}
        </button>
      </div>

      <div className="space-y-2">
        <input
          type="email"
          value={email}
          disabled={noEmailYet}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={isKo ? '선생님 이메일 주소' : "Teacher's email address"}
          className={`w-full p-3 rounded-xl border text-xs font-bold outline-none focus:border-orange-500 disabled:opacity-40 ${
            isNight ? 'bg-[#030305] border-white/10 text-white' : 'bg-white border-zinc-300 text-zinc-900'
          }`}
        />
        <label className="flex items-center gap-2 text-[11px] text-zinc-400 font-bold cursor-pointer">
          <input type="checkbox" checked={noEmailYet} onChange={(e) => setNoEmailYet(e.target.checked)} />
          {isKo ? '아직 이메일을 모릅니다 (공유 가능한 1회용 링크 생성)' : "I don't know their email yet (generate a single-use link instead)"}
        </label>
      </div>

      <button
        type="button"
        onClick={handleSendInvite}
        disabled={isSending || (role === 'ft' ? remainingFt <= 0 : remainingKt <= 0)}
        className="w-full py-3 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl transition-all"
      >
        {isSending
          ? (isKo ? '전송 중...' : 'Sending...')
          : (role === 'ft' ? remainingFt <= 0 : remainingKt <= 0)
          ? (isKo ? '남은 좌석 없음' : 'No seats remaining')
          : noEmailYet
          ? (isKo ? '초대 링크 생성' : 'Generate invite link')
          : (isKo ? '초대 이메일 보내기' : 'Send invite email')}
      </button>

      {message && (
        <p className={`text-xs font-bold ${message.type === 'error' ? 'text-rose-400' : 'text-emerald-400'}`}>{message.text}</p>
      )}
      {lastLink && (
        <div className="flex items-center gap-2">
          <input readOnly value={lastLink} className="flex-1 p-2 rounded-lg bg-black/30 border border-white/10 text-[10px] font-mono text-zinc-300" />
          <button
            type="button"
            onClick={() => navigator.clipboard.writeText(lastLink)}
            className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-[10px] font-bold shrink-0"
          >
            {isKo ? '복사' : 'Copy'}
          </button>
        </div>
      )}

      {invites.filter((inv) => inv.status !== 'revoked').length > 0 && (
        <div className="pt-2 border-t border-white/10 space-y-1.5 max-h-40 overflow-y-auto">
          {invites.filter((inv) => inv.status !== 'revoked').map((inv) => (
            <div key={inv.id} className="flex items-center justify-between text-[11px]">
              <span className="text-zinc-400 truncate">{inv.email || (isKo ? '(링크 전용)' : '(link only)')}</span>
              <span className={`font-mono font-bold px-1.5 py-0.5 rounded ${inv.role === 'ft' ? 'text-orange-400' : 'text-blue-400'}`}>
                {inv.role.toUpperCase()}
              </span>
              <span className={`font-bold ${inv.status === 'claimed' ? 'text-emerald-400' : 'text-zinc-500'}`}>
                {inv.status === 'claimed' ? (isKo ? '수락됨' : 'claimed') : (isKo ? '대기중' : 'pending')}
              </span>
            </div>
          ))}
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
    </div>
  );
};
