import React, { useEffect, useState } from 'react';
import { doc, collection, query, where, onSnapshot } from 'firebase/firestore';
import { auth, dbInstance } from '../../services/database';
import { PLAN_LABELS, PLAN_SEATS, PRICING_BILLING } from '../../api/_lib/pricingTiers';
import { DownloadSimple, X } from '@phosphor-icons/react';
import { useDialogA11y } from '../../hooks/useDialogA11y';
import { staffUi, msgTone } from './staffUi';

interface Props {
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
export const SchoolBillingPanel: React.FC<Props> = ({ isKo = false, schoolId, seatsTotal, trialStatus, onRequestPlanChange }) => {
  const [planId, setPlanId] = useState<string | null>(null);
  const [createdAt, setCreatedAt] = useState<string | null>(null);
  const [usedSeats, setUsedSeats] = useState({ ft: 0, kt: 0 });
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [isSubmittingPlanChange, setIsSubmittingPlanChange] = useState(false);
  const planDialogRef = useDialogA11y<HTMLDivElement>({ isOpen: showPlanModal, onClose: () => setShowPlanModal(false) });
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

  // No renewal/next-billing-date field exists anywhere for school billing
  // (only trialEndsAt, for the trial tier) — derived instead from the most
  // recently *paid* invoice for the current plan: paidAt + 30 or 365 days
  // depending on that invoice's billingCycle. Approximate (a manual plan
  // change mid-cycle isn't accounted for) but the only real signal
  // available without adding a new tracked field.
  const renewsAt = React.useMemo(() => {
    if (!invoices || !planId || planId === 'trial') return null;
    const paidForPlan = invoices
      .filter((inv) => inv.status === 'paid' && inv.planId === planId && inv.paidAt)
      .sort((a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime());
    const latest = paidForPlan[0];
    if (!latest) return null;
    const cycleDays = latest.billingCycle === 'yearly' ? 365 : 30;
    return new Date(new Date(latest.paidAt).getTime() + cycleDays * 24 * 60 * 60 * 1000);
  }, [invoices, planId]);

  const planPrice = (planId && PRICING_BILLING[planId as keyof typeof PRICING_BILLING]?.monthly.krw) || 0;
  const fmtDate = (d: string | Date) => new Date(d).toLocaleDateString(isKo ? 'ko-KR' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  return (
    <div className={`${staffUi.page} space-y-10`}>
      <section>
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-[13px] font-bold text-ink-3">{isKo ? '현재 요금제' : 'Current plan'}</p>
            <h2 className={staffUi.h2}>{planLabel}</h2>
            <p className={staffUi.sub}>
              {[
                planPrice > 0 && `₩${planPrice.toLocaleString()}${isKo ? '/월' : '/mo'}`,
                createdAt && (isKo ? `시작일 ${fmtDate(createdAt)}` : `Since ${fmtDate(createdAt)}`),
                renewsAt && (isKo ? `다음 결제일 ${fmtDate(renewsAt)}` : `Renews ${fmtDate(renewsAt)}`),
              ].filter(Boolean).join(' · ')}
            </p>
          </div>
          <button type="button" onClick={() => { setPlanRequestSent(false); setShowPlanModal(true); }} className={staffUi.primaryBtn}>
            {isKo ? '요금제 변경' : 'Change plan'}
          </button>
        </div>

        {trialStatus?.onTrial && (
          <p className={`mt-4 rounded-lg p-4 text-[15px] font-bold ${trialStatus.expired ? 'bg-wrong-soft text-wrong' : 'bg-line-soft text-ink'}`}>
            {trialStatus.expired
              ? (isKo ? '무료 체험이 끝났어요. 계속하려면 요금제를 선택하세요.' : 'Your trial has ended. Choose a plan to continue.')
              : (isKo ? `무료 체험 ${trialStatus.daysRemaining}일 남음` : `${trialStatus.daysRemaining} day${trialStatus.daysRemaining === 1 ? '' : 's'} left in trial`)}
          </p>
        )}

        <dl className="mt-6 grid grid-cols-2 divide-x divide-rule border-y border-rule">
          {([
            ['ft', isKo ? 'FT 좌석 사용' : 'FT seats in use'],
            ['kt', isKo ? 'KT 좌석 사용' : 'KT seats in use'],
          ] as const).map(([k, label], i) => (
            <div key={k} className={i === 0 ? 'py-4 pr-4' : 'py-4 pl-4'}>
              <dt className="text-[13px] font-bold text-ink-3">{label}</dt>
              <dd className="mt-1 text-[28px] font-extrabold tabular-nums">
                {usedSeats[k]}
                <span className="text-[14px] font-semibold text-ink-3"> / {seatsTotal[k]}</span>
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section>
        <h3 className={staffUi.h3}>{isKo ? '요청 내역' : 'Billing history'}</h3>
        {invoicesError ? (
          <p className={`mt-2 ${msgTone('error')}`}>{invoicesError}</p>
        ) : invoices === null ? (
          <p className={`mt-2 ${staffUi.sub}`}>{isKo ? '불러오는 중...' : 'Loading...'}</p>
        ) : invoices.length === 0 ? (
          <p className={`mt-2 ${staffUi.notice}`}>{isKo ? '아직 요청한 청구서가 없습니다.' : 'No billing requests yet.'}</p>
        ) : (
          <ul className={`mt-1 ${staffUi.rows}`}>
            {invoices.map((inv) => (
              <li key={inv.invoiceId} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate text-[15px] font-bold">{inv.planName}</p>
                  <p className="truncate text-[13px] text-ink-3">
                    {[inv.invoiceId, isKo ? `${inv.teacherCount}명` : `${inv.teacherCount} ${inv.teacherCount === 1 ? 'teacher' : 'teachers'}`, fmtDate(inv.createdAt)].join(' · ')}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-[16px] font-extrabold tabular-nums">₩{Number(inv.totalAmount || 0).toLocaleString()}</p>
                  <span className={inv.status === 'paid' ? staffUi.pill.good : staffUi.pill.warm}>
                    {inv.status === 'paid' ? (isKo ? '결제 확인됨' : 'Paid') : (isKo ? '입금 대기' : 'Awaiting payment')}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h3 className={staffUi.h3}>{isKo ? '데이터 관리' : 'Your data'}</h3>
        <p className={`${staffUi.sub} mb-3`}>
          {isKo ? '학원의 모든 데이터를 내보내거나 삭제를 요청할 수 있습니다.' : 'Export everything tied to your school, or request full deletion.'}
        </p>
        <div className="flex flex-wrap items-center gap-4">
          <button type="button" onClick={handleExport} disabled={isExporting} className={staffUi.quietBtn}>
            <DownloadSimple size={16} weight="bold" aria-hidden="true" />
            {isExporting ? (isKo ? '내보내는 중...' : 'Exporting...') : (isKo ? '전체 데이터 내보내기' : 'Export all data')}
          </button>
          {deletionRequested ? (
            <span className={staffUi.pill.good}>{isKo ? '삭제 요청 접수됨' : 'Deletion requested'}</span>
          ) : (
            <button type="button" onClick={handleDeleteRequest} disabled={isRequestingDeletion} className={`${staffUi.dangerText} min-h-10`}>
              {isRequestingDeletion ? (isKo ? '요청 중...' : 'Requesting...') : (isKo ? '데이터 삭제 요청' : 'Request data deletion')}
            </button>
          )}
        </div>
        {dataActionError && <p className={`mt-2 ${msgTone('error')}`}>{dataActionError}</p>}
      </section>

      {showPlanModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
          <div className="absolute inset-0 bg-[#2b211a]/55" onClick={() => setShowPlanModal(false)} aria-hidden="true" />
          <div
            ref={planDialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="plan-change-title"
            tabIndex={-1}
            className="modal-enter relative w-full max-w-md space-y-4 rounded-t-lg bg-surface p-6 text-ink shadow-[0_24px_60px_-20px_rgba(43,33,26,0.45)] sm:rounded-lg"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 id="plan-change-title" className="text-[20px] font-extrabold">{isKo ? '요금제 변경 요청' : 'Request a plan change'}</h3>
                {!planRequestSent && (
                  <p className="mt-1 text-[14px] text-ink-2">
                    {isKo
                      ? '월간 요금 기준입니다. 요청 즉시 계좌이체 정보가 담긴 청구서 이메일이 발송되며, 입금 확인 후 24시간 이내에 활성화됩니다.'
                      : "Prices shown are monthly. You'll get an invoice email with bank transfer details right away — activation follows within 24 hours of us confirming payment."}
                  </p>
                )}
              </div>
              <button type="button" onClick={() => setShowPlanModal(false)} aria-label={isKo ? '닫기' : 'Close'} className={staffUi.iconBtn}>
                <X size={20} weight="bold" />
              </button>
            </div>

            {planRequestSent ? (
              <div className="space-y-4">
                <p className="rounded-lg bg-right-soft p-4 text-[15px]">
                  {isKo
                    ? '요청이 접수되었습니다. 계좌이체 정보가 담긴 청구서를 이메일로 보내드렸습니다 — 입금 확인 후 24시간 이내에 활성화됩니다.'
                    : "Request sent — check your email for an invoice with bank transfer details. We'll activate it within 24 hours of confirming payment."}
                </p>
                <button type="button" onClick={() => setShowPlanModal(false)} className={`${staffUi.primaryBtn} w-full`}>
                  {isKo ? '확인' : 'Done'}
                </button>
              </div>
            ) : (
              <ul className={staffUi.rows}>
                {SELECTABLE_PLAN_IDS.filter((id) => id !== planId).map((id) => {
                  const label = PLAN_LABELS[id];
                  const seats = PLAN_SEATS[id];
                  const billing = PRICING_BILLING[id];
                  return (
                    <li key={id}>
                      <button
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
                        className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-md px-2 py-3 text-left hover:bg-sunken disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <span className="min-w-0">
                          <span className="block text-[15px] font-bold">{isKo ? label.nameKo : label.nameEn}</span>
                          {seats && (
                            <span className="block text-[13px] text-ink-3">
                              {seats.ft} FT + {seats.kt} KT {isKo ? '좌석' : 'seats'}
                            </span>
                          )}
                        </span>
                        {billing && (
                          <span className="shrink-0 text-[15px] font-extrabold tabular-nums text-line-ink">
                            {billing.monthly.krw > 0 ? `₩${billing.monthly.krw.toLocaleString()}${isKo ? '/월' : '/mo'}` : (isKo ? '무료' : 'Free')}
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
