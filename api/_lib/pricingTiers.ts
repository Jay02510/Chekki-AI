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
