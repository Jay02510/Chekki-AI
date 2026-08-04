import { describe, it, expect } from 'vitest';
import { seatsForPlan, PLAN_SEATS, DEFAULT_PLAN_SEATS } from '../api/_lib/pricingTiers';

describe('seatsForPlan', () => {
  it('returns the correct seat counts for every known plan', () => {
    for (const [planId, seats] of Object.entries(PLAN_SEATS)) {
      expect(seatsForPlan(planId)).toEqual(seats);
    }
  });

  it('falls back to the trial default for an unknown plan', () => {
    expect(seatsForPlan('not_a_real_plan')).toEqual(DEFAULT_PLAN_SEATS);
  });

  it('falls back to the trial default for null/undefined', () => {
    expect(seatsForPlan(undefined)).toEqual(DEFAULT_PLAN_SEATS);
    expect(seatsForPlan(null)).toEqual(DEFAULT_PLAN_SEATS);
  });
});
