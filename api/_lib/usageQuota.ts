import type { Firestore, DocumentReference } from 'firebase-admin/firestore';

// Atomic fixed-window counters for quotas and per-IP limits.
//
// Quota used to be check-then-increment against users/{uid}: the check read
// scansUsedToday, the Gemini call ran, and only then was the counter bumped.
// Ten parallel requests all read 0 and all passed, and since a user may
// delete and recreate their own users/{uid} doc (self-serve account
// deletion), recreating it zeroed the counters. These counters live in
// server-only docs (no client rule matches usage/ or ratelimits/) and are
// reserved inside a transaction BEFORE the expensive work runs.

export interface CounterDoc {
  window?: string;
  [field: string]: unknown;
}

// Pure decision, kept separate from Firestore so it's unit-testable.
// `floor` lets a caller seed the count from a legacy counter (e.g. the
// users/{uid} counter the day this shipped) so nobody gets a fresh quota.
export function decideReserve(
  current: CounterDoc | undefined,
  field: string,
  window: string,
  max: number,
  floor = 0
): { allowed: boolean; next: CounterDoc | null } {
  const sameWindow = current?.window === window;
  const stored = sameWindow ? Number(current?.[field]) || 0 : 0;
  const used = Math.max(stored, floor, 0);
  if (used >= max) return { allowed: false, next: null };
  // A new window drops every other field's count too.
  const base: CounterDoc = sameWindow ? { ...current } : { window };
  return { allowed: true, next: { ...base, [field]: used + 1 } };
}

export async function reserveCounter(
  db: Firestore,
  ref: DocumentReference,
  field: string,
  window: string,
  max: number,
  floor = 0
): Promise<boolean> {
  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const { allowed, next } = decideReserve(snap.data() as CounterDoc | undefined, field, window, max, floor);
    if (allowed && next) tx.set(ref, next);
    return allowed;
  });
}

// Gives back a reservation whose request failed, so a Gemini outage or a
// bad photo doesn't burn the user's quota.
export async function releaseCounter(
  db: Firestore,
  ref: DocumentReference,
  field: string,
  window: string
): Promise<void> {
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const data = snap.data() as CounterDoc | undefined;
    const used = Number(data?.[field]) || 0;
    if (data?.window === window && used > 0) tx.update(ref, { [field]: used - 1 });
  });
}
