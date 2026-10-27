import { FieldValue, type Firestore, type DocumentReference } from 'firebase-admin/firestore';

// Request de-duplication for api/analyze.ts. The client sends one
// X-Idempotency-Key per scan and reuses it on retry, so a retried scan
// returns the first result instead of calling Gemini (and the quota) again.
//
// The claim used to be get() then set(): two requests with the same new key
// could both see "no doc" and both run. The claim is now decided inside a
// transaction, so exactly one request owns a key at a time.

const STALE_AFTER_SECONDS = 300;

export type IdempotencyDecision =
  | { kind: 'claim' } // no usable record: this request runs and owns the key
  | { kind: 'cached'; response: unknown } // finished earlier for this user
  | { kind: 'busy' } // another request for this key is still running
  | { kind: 'skip' }; // key belongs to someone else: run without it, touch nothing

export interface IdempotencyRecord {
  status?: string;
  userId?: string;
  response?: unknown;
  createdAt?: { toDate?: () => Date } | string | number | Date;
}

function createdAtMs(createdAt: IdempotencyRecord['createdAt']): number | null {
  if (!createdAt) return null;
  if (typeof createdAt === 'object' && 'toDate' in createdAt && typeof createdAt.toDate === 'function') {
    return createdAt.toDate().getTime();
  }
  const ms = new Date(createdAt as string | number | Date).getTime();
  return Number.isNaN(ms) ? null : ms;
}

// Pure decision, kept separate from Firestore so it's unit-testable.
export function decideIdempotency(
  record: IdempotencyRecord | undefined,
  uid: string,
  nowMs: number
): IdempotencyDecision {
  if (!record) return { kind: 'claim' };
  // Keys aren't scoped per user in Firestore. A key presented by another
  // user must never return their cached result (a child's graded homework),
  // and must not overwrite their record either.
  if (record.userId !== uid) return { kind: 'skip' };
  if (record.status === 'completed') return { kind: 'cached', response: record.response };
  if (record.status === 'processing') {
    const started = createdAtMs(record.createdAt);
    // No readable timestamp: treat as fresh rather than steal a live claim.
    const ageSeconds = started === null ? 0 : (nowMs - started) / 1000;
    if (ageSeconds <= STALE_AFTER_SECONDS) return { kind: 'busy' };
  }
  // Stale "processing" (the original request crashed or timed out) or an
  // unknown status: take it over.
  return { kind: 'claim' };
}

export async function claimIdempotencyKey(
  db: Firestore,
  ref: DocumentReference,
  uid: string,
  task: unknown
): Promise<IdempotencyDecision> {
  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const decision = decideIdempotency(snap.data() as IdempotencyRecord | undefined, uid, Date.now());
    if (decision.kind === 'claim') {
      tx.set(ref, {
        status: 'processing',
        userId: uid,
        createdAt: FieldValue.serverTimestamp(),
        // A Firestore TTL policy on expiresAt cleans these up after a day.
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        task: typeof task === 'string' ? task : null,
      });
    }
    return decision;
  });
}

// Called once the handler has finished, before the function returns (so
// Vercel can't freeze it mid-write): keep a success for retries, drop a
// failure so the client can retry for real.
export async function settleIdempotencyKey(
  ref: DocumentReference,
  statusCode: number,
  response: unknown
): Promise<void> {
  if (statusCode >= 200 && statusCode < 300 && response !== undefined) {
    await ref.update({ status: 'completed', response, completedAt: FieldValue.serverTimestamp() });
  } else {
    await ref.delete();
  }
}
