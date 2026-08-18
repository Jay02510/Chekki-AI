import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { auth, dbInstance } from '../services/database';
import type { UserProfile } from '../types';

type ToastFn = (opts: { type: 'error' | 'success'; message: string }) => void;

// Director-only account/billing state: seat pool (for the invite panel,
// wizard + dashboard), plan id, and trial countdown — all gated on
// `user?.role === 'director'` at the source, so genuinely exclusive to that
// role (unlike the FT/KT buckets, which turned out to share most of their
// state — see the plan file's Phase 3 note).
export function useDirectorPortalState(
  user: Pick<UserProfile, 'schoolId' | 'role' | 'schoolName' | 'name' | 'email'> | null,
  showToast: ToastFn,
  isKo: boolean
) {
  const [schoolSeatsTotal, setSchoolSeatsTotal] = useState<{ ft: number; kt: number }>({ ft: 0, kt: 0 });
  const [schoolPlanId, setSchoolPlanId] = useState<string | null | undefined>(undefined);
  const [trialStatus, setTrialStatus] = useState<{ onTrial: boolean; daysRemaining: number; expired: boolean } | null>(null);

  // Load the school's seat pool for the director invite panel (wizard + dashboard).
  useEffect(() => {
    const schoolId = user?.schoolId;
    if (!schoolId || user?.role !== 'director') return;
    (async () => {
      try {
        const snap = await getDoc(doc(dbInstance, 'schools', schoolId));
        const seats = snap.data()?.seatsTotal;
        if (seats) setSchoolSeatsTotal({ ft: seats.ft || 0, kt: seats.kt || 0 });
        setSchoolPlanId(snap.data()?.planId || null);
      } catch (err) {
        console.warn('Failed to load school seat totals:', err);
      }
    })();
  }, [user?.schoolId, user?.role]);

  // Trial countdown banner + one-time day-5/6 Resend reminder (server-side
  // idempotency via trialReminderSentAt — see api/update-school-profile.ts).
  useEffect(() => {
    if (user?.role !== 'director') return;
    (async () => {
      try {
        const idToken = await auth.currentUser?.getIdToken();
        const response = await fetch('/api/update-school-profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
          body: JSON.stringify({ checkTrialStatus: true }),
        });
        const data = await response.json();
        if (response.ok) {
          setTrialStatus({
            onTrial: !!data.onTrial,
            daysRemaining: data.daysRemaining ?? 0,
            expired: !!data.expired,
          });
        }
      } catch (err) {
        console.warn('Failed to check trial status:', err);
      }
    })();
  }, [user?.schoolId, user?.role]);

  // Files a real school_invoices record + sends the director the actual bank
  // transfer email, same pipeline new-academy signups use. Previously this
  // button only wrote to sessionStorage and told the director an invoice had
  // been sent when nothing left the browser (Audit: fake seat-expansion
  // confirmation). A human still applies the seat increase via AdminPage's
  // upgrade_school action once payment clears — this just makes sure that
  // request actually exists somewhere real for them to act on.
  const handleRequestSeatExpansion = async (extraSeats: number): Promise<boolean> => {
    const schoolId = user?.schoolId;
    if (!schoolId) return false;
    try {
      const response = await fetch('/api/request-school-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schoolId,
          academyName: user?.schoolName || schoolId,
          contactName: user?.name || user?.schoolName || 'Director',
          email: user?.email || '',
          teacherCount: extraSeats,
          planName: `+${extraSeats} Seat Expansion`,
          billingCycle: 'monthly',
        }),
      });
      if (!response.ok) throw new Error(`Request failed with ${response.status}`);
      return true;
    } catch (err) {
      console.error('Failed to submit seat expansion request:', err);
      showToast({
        type: 'error',
        message: isKo
          ? '⚠️ 석 추가 요청을 보내지 못했습니다. 다시 시도해주세요.'
          : "⚠️ The seat request didn't go through. Please try again.",
      });
      return false;
    }
  };

  // Same request-only pattern as handleRequestSeatExpansion above: files a
  // school_invoices record + email, a human applies the plan change via
  // AdminPage once payment clears. "Change Plan / Upgrade" used to just
  // link out to the public /schools marketing page (Audit: director sent
  // off the dashboard with no way back to actually request the change).
  const handleRequestPlanChange = async (planId: string, planName: string): Promise<boolean> => {
    const schoolId = user?.schoolId;
    if (!schoolId) return false;
    try {
      const response = await fetch('/api/request-school-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schoolId,
          academyName: user?.schoolName || schoolId,
          contactName: user?.name || user?.schoolName || 'Director',
          email: user?.email || '',
          planId,
          planName,
          billingCycle: 'monthly',
        }),
      });
      if (!response.ok) throw new Error(`Request failed with ${response.status}`);
      return true;
    } catch (err) {
      console.error('Failed to submit plan change request:', err);
      showToast({
        type: 'error',
        message: isKo
          ? '⚠️ 요금제 변경 요청을 보내지 못했습니다. 다시 시도해주세요.'
          : "⚠️ The plan change request didn't go through. Please try again.",
      });
      return false;
    }
  };

  return {
    schoolSeatsTotal,
    schoolPlanId,
    handleRequestPlanChange,
    trialStatus,
    handleRequestSeatExpansion,
  };
}
