import React, { useEffect, useState } from 'react';
import { doc, collection, query, where, onSnapshot } from 'firebase/firestore';
import { dbInstance } from '../../services/database';
import { PLAN_LABELS } from '../../api/_lib/pricingTiers';

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
            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-95 inline-block text-center"
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

      {showPlanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowPlanModal(false)} />
          <div className={`relative w-full max-w-md rounded-2xl border p-6 space-y-4 ${isNight ? 'bg-brand-dark border-white/10' : 'bg-white border-zinc-200'}`}>
            <h4 className={`font-black text-lg ${isNight ? 'text-white' : 'text-zinc-900'}`}>
              {isKo ? '요금제 변경 요청' : 'Request a Plan Change'}
            </h4>

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
                      <span className={`block text-sm font-bold ${isNight ? 'text-white' : 'text-zinc-900'}`}>
                        {isKo ? label.nameKo : label.nameEn}
                      </span>
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
