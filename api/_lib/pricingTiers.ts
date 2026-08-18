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

/**
 * Display names for the same plan ids as PLAN_SEATS above. This used to only
 * exist as a second, hand-copied object in src/pages/SchoolsLandingPage.tsx
 * (its old PRICING_TIERS.seats field) — that duplication is what let the
 * displayed FT/KT split drift from what set-initial-role.ts actually grants.
 * SchoolsLandingPage now imports PLAN_SEATS/PLAN_LABELS from here instead of
 * hardcoding its own copy; this file has no server-only imports so it's safe
 * to import from client code too.
 */
export const PLAN_LABELS: Record<string, { nameEn: string; nameKo: string }> = {
  trial: { nameEn: '7-Day Free Teacher Trial', nameKo: '7일 무료 학원 체험' },
  solo: { nameEn: 'Solo Tutor & Study Room (1 Seat)', nameKo: '공부방 / 개인 교습소 (1석 단독)' },
  starter: { nameEn: 'Starter Academy Pack', nameKo: '스타터 학원 패키지' },
  school_pro: { nameEn: 'Chekki Master School Pro (All-in-One Bundle)', nameKo: '체키 마스터 스쿨 프로 (완전 통합 패키지)' },
  enterprise: { nameEn: 'Large Academy & Franchise', nameKo: '대형 학원 & 프랜차이즈 네트워크' },
};

export function labelsForPlan(planId: string | undefined | null): { nameEn: string; nameKo: string } {
  if (!planId) return PLAN_LABELS.trial;
  return PLAN_LABELS[planId] || PLAN_LABELS.trial;
}

/**
 * Pricing/billing figures for the same plan ids. Previously only existed
 * inline in SchoolsLandingPage.tsx, so any other screen showing a plan
 * picker (e.g. the director dashboard's "Change Plan" request modal) had
 * no price to show at all — a director had to leave the dashboard and
 * find the marketing page just to see what a plan costs.
 */
export const PRICING_BILLING: Record<string, { monthly: { krw: number; usd: number }; yearly: { krw: number; usd: number }; minSeats: number; defaultTeachers: number }> = {
  trial: { monthly: { krw: 0, usd: 0 }, yearly: { krw: 0, usd: 0 }, minSeats: 1, defaultTeachers: 1 },
  solo: { monthly: { krw: 39000, usd: 29 }, yearly: { krw: 31000, usd: 23 }, minSeats: 1, defaultTeachers: 1 },
  starter: { monthly: { krw: 69000, usd: 49 }, yearly: { krw: 55000, usd: 39 }, minSeats: 1, defaultTeachers: 3 },
  school_pro: { monthly: { krw: 290000, usd: 220 }, yearly: { krw: 232000, usd: 175 }, minSeats: 5, defaultTeachers: 10 },
  enterprise: { monthly: { krw: 590000, usd: 450 }, yearly: { krw: 472000, usd: 360 }, minSeats: 10, defaultTeachers: 20 },
};
