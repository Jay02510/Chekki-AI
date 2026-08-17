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
}

/**
 * Director-facing "Settings → Billing" view. Before this, plan/trial info
 * only ever appeared during the activation wizard or at the soft-lock
 * moment a trial expired (BillingModal.tsx is scoped entirely to the
 * parent app's consumer RevenueCat subscription, zero schoolId awareness)
 * — a director had no way to just check their plan/seats/renewal anytime.
 * Reads schools/{schoolId} directly (client SDK; firestore.rules already
 * scopes that read to the director whose own schoolId matches).
 */
export const SchoolBillingPanel: React.FC<Props> = ({ isNight = true, isKo = false, schoolId, seatsTotal, trialStatus }) => {
  const [planId, setPlanId] = useState<string | null>(null);
  const [createdAt, setCreatedAt] = useState<string | null>(null);
  const [usedSeats, setUsedSeats] = useState({ ft: 0, kt: 0 });

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
          <a
            href="/schools"
            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-95 inline-block text-center"
          >
            {isKo ? '요금제 변경 / 업그레이드' : 'Change Plan / Upgrade'}
          </a>
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
    </div>
  );
};
