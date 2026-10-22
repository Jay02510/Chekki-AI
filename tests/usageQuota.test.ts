import { describe, it, expect } from 'vitest';
import { decideReserve } from '../api/_lib/usageQuota';

describe('decideReserve', () => {
  it('allows up to max within one window, then refuses', () => {
    let doc = undefined as any;
    for (let i = 0; i < 2; i++) {
      const r = decideReserve(doc, 'scans', '2026-10-22', 2);
      expect(r.allowed).toBe(true);
      doc = r.next;
    }
    expect(doc).toEqual({ window: '2026-10-22', scans: 2 });
    expect(decideReserve(doc, 'scans', '2026-10-22', 2).allowed).toBe(false);
  });

  it('starts fresh in a new window and drops stale fields', () => {
    const r = decideReserve({ window: '2026-10-21', scans: 2, questions: 5 }, 'scans', '2026-10-22', 2);
    expect(r).toEqual({ allowed: true, next: { window: '2026-10-22', scans: 1 } });
  });

  it('keeps other fields in the same window', () => {
    const r = decideReserve({ window: 'd', scans: 1 }, 'questions', 'd', 5);
    expect(r.next).toEqual({ window: 'd', scans: 1, questions: 1 });
  });

  it('honours a legacy floor so a migration never grants a fresh quota', () => {
    expect(decideReserve(undefined, 'scans', 'd', 2, 2).allowed).toBe(false);
    expect(decideReserve(undefined, 'scans', 'd', 2, 1).next).toEqual({ window: 'd', scans: 2 });
  });

  it('ignores negative or junk stored values', () => {
    expect(decideReserve({ window: 'd', scans: -9999 }, 'scans', 'd', 2, -50).next).toEqual({ window: 'd', scans: 1 });
    expect(decideReserve({ window: 'd', scans: 'x' }, 'scans', 'd', 2).next).toEqual({ window: 'd', scans: 1 });
  });
});
