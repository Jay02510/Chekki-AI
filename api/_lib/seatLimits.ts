/**
 * Pure seat-limit math shared by api/create-class.ts and
 * api/create-teacher-invite.ts, extracted so the actual limit logic (not
 * just the Firestore plumbing around it) has test coverage.
 */
export interface SeatsTotal {
  ft?: number;
  kt?: number;
}

// A school with no seatsTotal on record still gets a single trial class,
// matching create-class.ts's pre-extraction behavior.
export function maxClassesForSeats(seatsTotal: SeatsTotal | undefined | null): number {
  if (!seatsTotal) return 1;
  return Math.max(1, Number(seatsTotal.ft || 0) + Number(seatsTotal.kt || 0));
}

export function maxInvitesForRole(seatsTotal: SeatsTotal | undefined | null, role: 'ft' | 'kt'): number {
  return Number(seatsTotal?.[role] ?? 0);
}
