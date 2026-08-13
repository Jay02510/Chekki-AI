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
 */
export function computeInvoicePricing(
  planId: string | undefined | null,
  teacherCount: number,
  billingCycle: 'monthly' | 'yearly' | undefined
): InvoicePricing {
  let unitPrice = 49000;
  let actualSeats = Math.max(1, Number(teacherCount));
  const isTrial = planId === 'trial';

  if (isTrial) {
    unitPrice = 0;
    actualSeats = 1;
  } else if (planId === 'freelancer') {
    unitPrice = 35000;
    actualSeats = 1;
  } else if (planId === 'small') {
    unitPrice = 49000;
    actualSeats = Math.min(2, Math.max(1, actualSeats));
  } else if (planId === 'medium') {
    unitPrice = 39000;
    actualSeats = Math.max(3, actualSeats);
  } else if (planId === 'large') {
    unitPrice = 29000;
    actualSeats = Math.max(6, actualSeats);
  } else {
    if (actualSeats >= 6) unitPrice = 29000;
    else if (actualSeats >= 3) unitPrice = 39000;
    else unitPrice = 49000;
  }

  const months = billingCycle === 'yearly' ? 12 : 1;
  const discountMultiplier = billingCycle === 'yearly' ? 0.8 : 1.0;
  const totalAmount = isTrial ? 0 : Math.round(unitPrice * actualSeats * months * discountMultiplier);

  return { unitPrice, actualSeats, totalAmount };
}
