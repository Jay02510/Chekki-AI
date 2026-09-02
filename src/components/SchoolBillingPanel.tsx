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
  const [invoices, setInvoices] = useState<any[] | null>(null);
  const [invoicesError, setInvoicesError] = useState<string | null>(null);

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

  // school_invoices is server-only (firestore.rules denies client reads) —
  // a director previously had no way to see a plan-change/seat-expansion
  // request they'd already submitted once the confirmation modal closed
  // (Audit: "no way to track requests made"). One-shot fetch, not a
  // subscription — billing history doesn't need to be live.
  const fetchInvoices = async () => {
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const response = await fetch('/api/update-school-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ listInvoices: true }),
      });
      if (!response.ok) throw new Error((await response.json().catch(() => ({}))).error || 'Failed to load billing history');
      const data = await response.json();
      setInvoices(data.invoices || []);
    } catch (err: any) {
      setInvoicesError(err.message || 'Failed to load billing history');
    }
  };

  useEffect(() => {
    if (!schoolId) return;
    fetchInvoices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-black text-xs font-bold rounded-xl shadow-md transition-[color,background-color,border-color,box-shadow,transform] active:scale-95 inline-block text-center"
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
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-[color,background-color,border-color,box-shadow,transform] active:scale-95 disabled:opacity-50 ${isNight ? 'bg-white/5 text-white hover:bg-white/10 border border-white/10' : 'bg-white text-zinc-900 hover:bg-zinc-100 border border-zinc-200'}`}
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
              className="px-4 py-2 text-xs font-bold rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-[color,background-color,border-color,box-shadow,transform] active:scale-95 disabled:opacity-50"
            >
              {isRequestingDeletion ? (isKo ? '요청 중...' : 'Requesting...') : (isKo ? '데이터 삭제 요청' : 'Request Data Deletion')}
            </button>
          )}
        </div>
        {dataActionError && <p className="text-xs font-bold text-rose-400">{dataActionError}</p>}
      </div>

      <div className={`p-6 rounded-2xl border space-y-3 ${isNight ? 'bg-brand-dark border-white/10' : 'bg-zinc-50 border-zinc-200'}`}>
        <span className="text-[10px] font-mono font-bold text-orange-500 uppercase tracking-widest block">
          {isKo ? '요청 내역' : 'Billing History'}
        </span>
        {invoicesError ? (
          <p className="text-xs font-bold text-rose-400">{invoicesError}</p>
        ) : invoices === null ? (
          <p className={`text-xs ${isNight ? 'text-zinc-500' : 'text-zinc-400'}`}>{isKo ? '불러오는 중...' : 'Loading...'}</p>
        ) : invoices.length === 0 ? (
          <p className={`text-xs ${isNight ? 'text-zinc-500' : 'text-zinc-400'}`}>
            {isKo ? '아직 요청한 청구서가 없습니다.' : 'No billing requests yet.'}
          </p>
        ) : (
          <div className="space-y-2">
            {invoices.map((inv) => (
              <div
                key={inv.invoiceId}
                className={`flex items-center justify-between gap-3 p-3 rounded-xl border text-xs ${isNight ? 'bg-white/5 border-white/10' : 'bg-white border-zinc-200'}`}
              >
                <div>
                  <p className={`font-bold font-mono ${isNight ? 'text-white' : 'text-zinc-900'}`}>{inv.invoiceId}</p>
                  <p className="text-zinc-400 mt-0.5">
                    {inv.planName} · {inv.teacherCount} {isKo ? '명' : 'teacher(s)'} · {new Date(inv.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className={`font-black ${isNight ? 'text-white' : 'text-zinc-900'}`}>₩{Number(inv.totalAmount || 0).toLocaleString()}</p>
                  <span className={`inline-block mt-0.5 px-2 py-0.5 rounded-full font-bold text-[10px] ${
                    inv.status === 'paid'
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : 'bg-amber-500/10 text-amber-400'
                  }`}>
                    {inv.status === 'paid' ? (isKo ? '결제 확인됨' : 'Payment Confirmed') : (isKo ? '입금 대기' : 'Pending Payment')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
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
                  {isKo
                    ? '월간 요금 기준입니다. 요청 즉시 계좌이체 정보가 담긴 청구서 이메일이 발송되며, 입금 확인 후 24시간 이내에 활성화됩니다.'
                    : "Prices shown are monthly. You'll get an invoice email with bank transfer details right away — activation follows within 24 hours of us confirming payment."}
                </p>
              )}
            </div>

            {planRequestSent ? (
              <div className="space-y-4">
                <p className={`text-sm ${isNight ? 'text-zinc-300' : 'text-zinc-600'}`}>
                  {isKo
                    ? '요청이 접수되었습니다. 계좌이체 정보가 담긴 청구서를 이메일로 보내드렸습니다 — 입금 확인 후 24시간 이내에 활성화됩니다.'
                    : "Request sent — check your email for an invoice with bank transfer details. We'll activate it within 24 hours of confirming payment."}
                </p>
                <button
                  type="button"
                  onClick={() => setShowPlanModal(false)}
                  className="w-full px-4 py-2 bg-zinc-200 hover:bg-zinc-300 text-zinc-900 text-xs font-bold rounded-xl transition-[color,background-color,border-color,box-shadow,transform] active:scale-95"
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
                        if (ok) {
                          setPlanRequestSent(true);
                          fetchInvoices();
                        }
                      }}
                      className={`w-full text-left px-4 py-3 rounded-xl border transition-[color,background-color,border-color,box-shadow,transform] disabled:opacity-50 ${isNight ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-zinc-50 border-zinc-200 hover:bg-zinc-100'}`}
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
                          {seats.ft} FT + {seats.kt} KT {isKo ? '좌석' : 'seats'}
                        </span>
                      )}
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => setShowPlanModal(false)}
                  className={`w-full px-4 py-2 mt-2 text-xs font-bold rounded-xl transition-[color,background-color,border-color,box-shadow,transform] active:scale-95 ${isNight ? 'bg-white/5 text-zinc-300 hover:bg-white/10' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'}`}
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
