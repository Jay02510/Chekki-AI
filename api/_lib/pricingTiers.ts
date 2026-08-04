/**
 * Server-side source of truth for per-role seat counts by plan.
 *
 * Audit §21b: seat counts must never be trusted from the client (that's how
 * `chekki_teacher_seats` ended up as a display-only sessionStorage number
 * with nothing enforcing it). This table is what api/create-teacher-invite.ts
 * and api/set-initial-role.ts check against — the client only ever sends a
 * planId, never a seat count.
 *
 * Keep the `seats` values here in sync with the display copy in
 * src/pages/SchoolsLandingPage.tsx's PRICING_TIERS.
 */
export const PLAN_SEATS: Record<string, { ft: number; kt: number }> = {
  trial: { ft: 1, kt: 1 },
  solo: { ft: 1, kt: 0 },
  starter: { ft: 2, kt: 1 },
  school_pro: { ft: 6, kt: 4 },
  enterprise: { ft: 12, kt: 8 },
};

export const DEFAULT_PLAN_SEATS = PLAN_SEATS.trial;

export function seatsForPlan(planId: string | undefined | null): { ft: number; kt: number } {
  if (!planId) return DEFAULT_PLAN_SEATS;
  return PLAN_SEATS[planId] || DEFAULT_PLAN_SEATS;
}
