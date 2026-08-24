import { PRICING_BILLING } from './pricingTiers.js';

export interface InvoicePricing {
  unitPrice: number;
  actualSeats: number;
  totalAmount: number;
}

/**
 * Pricing/seat math for api/request-school-invoice.ts. Extracted so the
 * exact numbers a director sees on their bank-transfer invoice — the thing
 * that was wrong in the planName/billingCycle bug — can be regression
 * tested without mocking Firestore/Resend.
 *
 * Was previously its own hardcoded plan-id vocabulary
 * (trial/freelancer/small/medium/large) that never matched the real plan
 * catalog every other screen uses (trial/solo/starter/school_pro/enterprise,
 * from pricingTiers.ts's PLAN_SEATS/PRICING_BILLING) — the frontend never
 * sends 'freelancer'/'small'/'medium'/'large', so every real invoice request
 * fell through to the generic per-seat-count else branch, pricing a
 * school_pro or enterprise plan as if it were an ungraded small academy.
 * Now reads the same PRICING_BILLING table SchoolsLandingPage and the
 * director dashboard's plan picker already use, so the number on the
 * invoice matches what was actually quoted.
 */
export function computeInvoicePricing(
  planId: string | undefined | null,
  teacherCount: number,
  billingCycle: 'monthly' | 'yearly' | undefined
): InvoicePricing {
  const isTrial = planId === 'trial';
  if (isTrial) {
    return { unitPrice: 0, actualSeats: 1, totalAmount: 0 };
  }

  const billing = (planId && PRICING_BILLING[planId]) || PRICING_BILLING.starter;
  const isYearly = billingCycle === 'yearly';
  const actualSeats = Math.max(billing.minSeats, 1, Number(teacherCount) || 0);

  // PRICING_BILLING's `yearly` figure is already the discounted effective
  // monthly rate (matches the site's own display) — the invoice total for a
  // yearly commitment is that rate times 12 months, paid upfront.
  const unitPrice = isYearly ? billing.yearly.krw : billing.monthly.krw;
  const totalAmount = isYearly ? unitPrice * 12 : unitPrice;

  return { unitPrice, actualSeats, totalAmount };
}
