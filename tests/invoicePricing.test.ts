import { describe, it, expect } from 'vitest';
import { computeInvoicePricing } from '../api/_lib/invoicePricing';
import { PRICING_BILLING } from '../api/_lib/pricingTiers';

describe('computeInvoicePricing', () => {
  it('is free for a trial plan regardless of teacher count or billing cycle', () => {
    expect(computeInvoicePricing('trial', 5, 'yearly')).toEqual({
      unitPrice: 0,
      actualSeats: 1,
      totalAmount: 0,
    });
  });

  it('prices a solo plan at its real monthly rate', () => {
    expect(computeInvoicePricing('solo', 1, 'monthly')).toEqual({
      unitPrice: PRICING_BILLING.solo.monthly.krw,
      actualSeats: 1,
      totalAmount: PRICING_BILLING.solo.monthly.krw,
    });
  });

  it('floors seat count at the plan\'s minSeats', () => {
    expect(computeInvoicePricing('school_pro', 1, 'monthly').actualSeats).toBe(PRICING_BILLING.school_pro.minSeats);
    expect(computeInvoicePricing('school_pro', 20, 'monthly').actualSeats).toBe(20);
  });

  it('falls back to the starter plan for an unrecognized planId', () => {
    expect(computeInvoicePricing('not_a_real_plan', 2, 'monthly').unitPrice).toBe(PRICING_BILLING.starter.monthly.krw);
  });

  it('applies the plan\'s real yearly discount across 12 months, monthly stays undiscounted', () => {
    const monthly = computeInvoicePricing('enterprise', 10, 'monthly');
    const yearly = computeInvoicePricing('enterprise', 10, 'yearly');
    expect(monthly.totalAmount).toBe(PRICING_BILLING.enterprise.monthly.krw);
    expect(yearly.totalAmount).toBe(PRICING_BILLING.enterprise.yearly.krw * 12);
  });

  it('defaults an unspecified billing cycle to monthly pricing', () => {
    expect(computeInvoicePricing('starter', 1, undefined).totalAmount).toBe(PRICING_BILLING.starter.monthly.krw);
  });
});
