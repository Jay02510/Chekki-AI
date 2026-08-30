import React, { useEffect, useState } from 'react';
import { doc, collection, query, where, onSnapshot } from 'firebase/firestore';
import { auth, dbInstance } from '../../services/database';
import { PLAN_LABELS, PLAN_SEATS, PRICING_BILLING } from '../../api/_lib/pricingTiers';

interface Props {
  isNight?: boolean;
  isKo?: boolean;
  schoolId: string;
  seatsTotal: { ft: number; kt: number };
  trialStatus?: { onTrial: boolean; daysRemaining: number; expired: boolean } | null;
  onRequestPlanChange?: (planId: string, planName: string) => Promise<boolean>;
}

const SELECTABLE_PLAN_IDS = ['solo', 'starter', 'school_pro', 'enterprise'] as const;

/**
 * Director-facing "Settings → Billing" view. Before this, plan/trial info
 * only ever appeared during the activation wizard or at the soft-lock
 * moment a trial expired (BillingModal.tsx is scoped entirely to the
 * parent app's consumer RevenueCat subscription, zero schoolId awareness)
 * — a director had no way to just check their plan/seats/renewal anytime.
 * Reads schools/{schoolId} directly (client SDK; firestore.rules already
 * scopes that read to the director whose own schoolId matches).
 */
export const SchoolBillingPanel: React.FC<Props> = ({ isNight = true, isKo = false, schoolId, seatsTotal, trialStatus, onRequestPlanChange }) => {
  const [planId, setPlanId] = useState<string | null>(null);
  const [createdAt, setCreatedAt] = useState<string | null>(null);
  const [usedSeats, setUsedSeats] = useState({ ft: 0, kt: 0 });
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [isSubmittingPlanChange, setIsSubmittingPlanChange] = useState(false);
  const [planRequestSent, setPlanRequestSent] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isRequestingDeletion, setIsRequestingDeletion] = useState(false);
  const [deletionRequested, setDeletionRequested] = useState(false);
  const [dataActionError, setDataActionError] = useState<string | null>(null);

  const callDataRequest = async (kind: 'export' | 'delete') => {
    const idToken = await auth.currentUser?.getIdToken();
    const response = await fetch('/api/update-school-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
      body: JSON.stringify({ dataRequest: kind }),
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || 'Request failed');
    }
    return response;
  };

  const handleExport = async () => {
    setDataActionError(null);
    setIsExporting(true);
    try {
      const response = await callDataRequest('export');
      const data = await response.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `chekki-school-export-${schoolId}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setDataActionError(err.message || 'Export failed.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteRequest = async () => {
    const confirmed = window.confirm(
      isKo
        ? '학원의 모든 데이터(학생, 반, 채점 기록)에 대한 삭제를 요청합니다. 담당자 확인 후 처리됩니다. 계속하시겠습니까?'
        : "This requests deletion of ALL your school's data (students, classes, grading records). Our team will verify and process it. Continue?"
    );
    if (!confirmed) return;
    setDataActionError(null);
    setIsRequestingDeletion(true);
    try {
      await callDataRequest('delete');
      setDeletionRequested(true);
    } catch (err: any) {
      setDataActionError(err.message || 'Request failed.');
    } finally {
      setIsRequestingDeletion(false);
    }
  };

  useEffect(() => {
    if (!schoolId) return;
    const unsub = onSnapshot(
      doc(dbInstance, 'schools', schoolId),
      (snap) => {
        const data = snap.data();
        setPlanId(data?.planId || null);
        setCreatedAt(data?.createdAt || null);
      },
      (err) => console.warn('Failed to load school billing info:', err)
    );
    return () => unsub();
  }, [schoolId]);

  useEffect(() => {
    if (!schoolId) return;
    const q = query(collection(dbInstance, 'invites'), where('schoolId', '==', schoolId));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const counts = { ft: 0, kt: 0 };
        snap.docs.forEach((d) => {
          const data = d.data() as any;
          if (data.status === 'pending' || data.status === 'claimed') {
            if (data.role === 'ft') counts.ft++;
            if (data.role === 'kt') counts.kt++;
          }
        });
        setUsedSeats(counts);
      },
      (err) => console.warn('Failed to load seat usage:', err)
    );
    return () => unsub();
  }, [schoolId]);

  const planLabel = planId ? (isKo ? PLAN_LABELS[planId]?.nameKo : PLAN_LABELS[planId]?.nameEn) || planId : '…';

  return (
    <div className="space-y-6 animate-fade-in text-left">
      <div className={`p-6 rounded-2xl border space-y-5 ${isNight ? 'bg-brand-dark border-white/10' : 'bg-zinc-50 border-zinc-200'}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div>
            <span className="text-[10px] font-mono font-bold text-orange-500 uppercase tracking-widest block">Current Plan</span>
            <h4 className={`font-black text-lg ${isNight ? 'text-white' : 'text-zinc-900'}`}>{planLabel}</h4>
            {createdAt && <p className="text-[11px] text-zinc-400 mt-0.5">Since {new Date(createdAt).toLocaleDateString()}</p>}
          </div>
          <button
            type="button"
            onClick={() => { setPlanRequestSent(false); setShowPlanModal(true); }}
            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-black text-xs font-bold rounded-xl shadow-md transition-all active:scale-95 inline-block text-center"
          >
            {isKo ? '요금제 변경 / 업그레이드' : 'Change Plan / Upgrade'}
          </button>
        </div>

        {trialStatus?.onTrial && (
          <div className={`p-3 rounded-xl border text-xs font-bold ${trialStatus.expired ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' : 'bg-amber-500/10 border-amber-500/30 text-amber-400'}`}>
            {trialStatus.expired
              ? (isKo ? '⚠️ 무료 체험이 종료되었습니다. 계속하려면 업그레이드하세요.' : '⚠️ Your trial has ended. Upgrade to continue.')
              : (isKo ? `🕐 무료 체험 ${trialStatus.daysRemaining}일 남음` : `🕐 ${trialStatus.daysRemaining} day${trialStatus.daysRemaining === 1 ? '' : 's'} left in trial`)}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className={`p-4 rounded-xl border ${isNight ? 'bg-white/5 border-white/10' : 'bg-white border-zinc-200'}`}>
            <span className="text-[10px] font-bold uppercase tracking-widest text-orange-400 block font-mono">FT Seats</span>
            <h4 className={`text-xl font-black mt-1 ${isNight ? 'text-white' : 'text-zinc-900'}`}>
              {usedSeats.ft} <span className="text-xs font-normal text-zinc-400">/ {seatsTotal.ft} used</span>
            </h4>
          </div>
          <div className={`p-4 rounded-xl border ${isNight ? 'bg-white/5 border-white/10' : 'bg-white border-zinc-200'}`}>
            <span className="text-[10px] font-bold uppercase tracking-widest text-blue-400 block font-mono">KT Seats</span>
            <h4 className={`text-xl font-black mt-1 ${isNight ? 'text-white' : 'text-zinc-900'}`}>
              {usedSeats.kt} <span className="text-xs font-normal text-zinc-400">/ {seatsTotal.kt} used</span>
            </h4>
          </div>
        </div>
      </div>

      <div className={`p-6 rounded-2xl border space-y-3 ${isNight ? 'bg-brand-dark border-white/10' : 'bg-zinc-50 border-zinc-200'}`}>
        <span className="text-[10px] font-mono font-bold text-orange-500 uppercase tracking-widest block">
          {isKo ? '데이터 관리' : 'Data Management'}
        </span>
        <p className={`text-xs ${isNight ? 'text-zinc-400' : 'text-zinc-500'}`}>
          {isKo
            ? '학원의 모든 데이터를 내보내거나 삭제를 요청할 수 있습니다.'
            : 'Export everything tied to your school, or request full deletion.'}
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all active:scale-95 disabled:opacity-50 ${isNight ? 'bg-white/5 text-white hover:bg-white/10 border border-white/10' : 'bg-white text-zinc-900 hover:bg-zinc-100 border border-zinc-200'}`}
          >
            {isExporting ? (isKo ? '내보내는 중...' : 'Exporting...') : (isKo ? '전체 데이터 내보내기' : 'Export All Data')}
          </button>
          {deletionRequested ? (
            <span className="px-4 py-2 text-xs font-bold rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 inline-flex items-center">
              {isKo ? '삭제 요청 접수됨' : 'Deletion requested'}
            </span>
          ) : (
            <button
              type="button"
              onClick={handleDeleteRequest}
              disabled={isRequestingDeletion}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-all active:scale-95 disabled:opacity-50"
            >
              {isRequestingDeletion ? (isKo ? '요청 중...' : 'Requesting...') : (isKo ? '데이터 삭제 요청' : 'Request Data Deletion')}
            </button>
          )}
        </div>
        {dataActionError && <p className="text-xs font-bold text-rose-400">{dataActionError}</p>}
      </div>

      {showPlanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowPlanModal(false)} />
          <div className={`relative w-full max-w-md rounded-2xl border p-6 space-y-4 ${isNight ? 'bg-brand-dark border-white/10' : 'bg-white border-zinc-200'}`}>
            <div>
              <h4 className={`font-black text-lg ${isNight ? 'text-white' : 'text-zinc-900'}`}>
                {isKo ? '요금제 변경 요청' : 'Request a Plan Change'}
              </h4>
              {!planRequestSent && (
                <p className={`text-xs mt-1 ${isNight ? 'text-zinc-400' : 'text-zinc-500'}`}>
                  {isKo ? '월간 요금 기준입니다. 요청 후 담당자가 이메일로 결제 방법을 안내합니다.' : 'Prices shown are monthly. Our team will email you payment details after you request.'}
                </p>
              )}
            </div>

            {planRequestSent ? (
              <div className="space-y-4">
                <p className={`text-sm ${isNight ? 'text-zinc-300' : 'text-zinc-600'}`}>
                  {isKo
                    ? '요청이 접수되었습니다. 담당자가 확인 후 이메일로 연락드립니다.'
                    : 'Request sent. Our team will follow up by email to confirm and complete the change.'}
                </p>
                <button
                  type="button"
                  onClick={() => setShowPlanModal(false)}
                  className="w-full px-4 py-2 bg-zinc-200 hover:bg-zinc-300 text-zinc-900 text-xs font-bold rounded-xl transition-all active:scale-95"
                >
                  {isKo ? '닫기' : 'Close'}
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {SELECTABLE_PLAN_IDS.filter((id) => id !== planId).map((id) => {
                  const label = PLAN_LABELS[id];
                  const seats = PLAN_SEATS[id];
                  const billing = PRICING_BILLING[id];
                  return (
                    <button
                      key={id}
                      type="button"
                      disabled={isSubmittingPlanChange}
                      onClick={async () => {
                        setIsSubmittingPlanChange(true);
                        const ok = await onRequestPlanChange?.(id, isKo ? label.nameKo : label.nameEn);
                        setIsSubmittingPlanChange(false);
                        if (ok) setPlanRequestSent(true);
                      }}
                      className={`w-full text-left px-4 py-3 rounded-xl border transition-all disabled:opacity-50 ${isNight ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-zinc-50 border-zinc-200 hover:bg-zinc-100'}`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className={`block text-sm font-bold ${isNight ? 'text-white' : 'text-zinc-900'}`}>
                          {isKo ? label.nameKo : label.nameEn}
                        </span>
                        {billing && (
                          <span className="shrink-0 text-sm font-black text-orange-500 font-mono">
                            {billing.monthly.krw > 0 ? `₩${billing.monthly.krw.toLocaleString()}/mo` : (isKo ? '무료' : 'Free')}
                          </span>
                        )}
                      </div>
                      {seats && (
                        <span className={`block text-[11px] mt-1 font-mono ${isNight ? 'text-zinc-400' : 'text-zinc-500'}`}>
                          {seats.ft} FT + {seats.kt} KT {isKo ? '석' : 'seats'}
                        </span>
                      )}
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => setShowPlanModal(false)}
                  className={`w-full px-4 py-2 mt-2 text-xs font-bold rounded-xl transition-all active:scale-95 ${isNight ? 'bg-white/5 text-zinc-300 hover:bg-white/10' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'}`}
                >
                  {isKo ? '취소' : 'Cancel'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
