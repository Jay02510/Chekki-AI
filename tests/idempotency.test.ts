import { describe, it, expect } from 'vitest';
import { decideIdempotency } from '../api/_lib/idempotency';

const NOW = Date.UTC(2026, 9, 27, 12, 0, 0);
const secondsAgo = (s: number) => new Date(NOW - s * 1000);

describe('decideIdempotency', () => {
  it('claims a key nobody has used', () => {
    expect(decideIdempotency(undefined, 'u1', NOW)).toEqual({ kind: 'claim' });
  });

  it('returns the cached response to the same user', () => {
    const rec = { status: 'completed', userId: 'u1', response: { items: [1] } };
    expect(decideIdempotency(rec, 'u1', NOW)).toEqual({ kind: 'cached', response: { items: [1] } });
  });

  it("never serves or takes over another user's key", () => {
    expect(decideIdempotency({ status: 'completed', userId: 'u2', response: {} }, 'u1', NOW)).toEqual({ kind: 'skip' });
    expect(decideIdempotency({ status: 'processing', userId: 'u2', createdAt: secondsAgo(999) }, 'u1', NOW)).toEqual({
      kind: 'skip',
    });
  });

  it('waits on a fresh in-flight request', () => {
    expect(decideIdempotency({ status: 'processing', userId: 'u1', createdAt: secondsAgo(10) }, 'u1', NOW)).toEqual({
      kind: 'busy',
    });
  });

  it('accepts a Firestore Timestamp-like createdAt', () => {
    const createdAt = { toDate: () => secondsAgo(10) };
    expect(decideIdempotency({ status: 'processing', userId: 'u1', createdAt }, 'u1', NOW).kind).toBe('busy');
  });

  it('takes over a stale in-flight request', () => {
    expect(decideIdempotency({ status: 'processing', userId: 'u1', createdAt: secondsAgo(301) }, 'u1', NOW)).toEqual({
      kind: 'claim',
    });
  });

  it('treats a missing timestamp as fresh', () => {
    expect(decideIdempotency({ status: 'processing', userId: 'u1' }, 'u1', NOW).kind).toBe('busy');
  });
});
