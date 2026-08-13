import { describe, it, expect } from 'vitest';
import { computeInvoicePricing } from '../api/_lib/invoicePricing';

describe('computeInvoicePricing', () => {
  it('is free for a trial plan regardless of teacher count or billing cycle', () => {
    expect(computeInvoicePricing('trial', 5, 'yearly')).toEqual({
      unitPrice: 0,
      actualSeats: 1,
      totalAmount: 0,
    });
  });

  it('prices a freelancer plan as a single seat', () => {
    expect(computeInvoicePricing('freelancer', 4, 'monthly')).toEqual({
      unitPrice: 35000,
      actualSeats: 1,
      totalAmount: 35000,
    });
  });

  it('floors a small plan at 1 seat and caps it at 2', () => {
    expect(computeInvoicePricing('small', 0, 'monthly').actualSeats).toBe(1);
    expect(computeInvoicePricing('small', 5, 'monthly').actualSeats).toBe(2);
  });

  it('floors a medium plan at 3 seats', () => {
    expect(computeInvoicePricing('medium', 1, 'monthly').actualSeats).toBe(3);
    expect(computeInvoicePricing('medium', 4, 'monthly').actualSeats).toBe(4);
  });

  it('floors a large plan at 6 seats', () => {
    expect(computeInvoicePricing('large', 2, 'monthly').actualSeats).toBe(6);
    expect(computeInvoicePricing('large', 10, 'monthly').actualSeats).toBe(10);
  });

  it('falls back to seat-count tiering for an unrecognized planId', () => {
    expect(computeInvoicePricing('not_a_real_plan', 2, 'monthly').unitPrice).toBe(49000);
    expect(computeInvoicePricing('not_a_real_plan', 4, 'monthly').unitPrice).toBe(39000);
    expect(computeInvoicePricing('not_a_real_plan', 8, 'monthly').unitPrice).toBe(29000);
  });

  it('applies the 20% yearly discount across 12 months, monthly stays undiscounted', () => {
    const monthly = computeInvoicePricing('medium', 3, 'monthly');
    const yearly = computeInvoicePricing('medium', 3, 'yearly');
    expect(monthly.totalAmount).toBe(39000 * 3 * 1);
    expect(yearly.totalAmount).toBe(Math.round(39000 * 3 * 12 * 0.8));
  });

  it('defaults an unspecified billing cycle to monthly pricing', () => {
    expect(computeInvoicePricing('small', 1, undefined).totalAmount).toBe(49000);
  });
});
