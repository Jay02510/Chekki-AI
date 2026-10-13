import { describe, expect, it } from 'vitest';
import { kstDate, localDate } from './localDate';

describe('localDate', () => {
  it('uses local calendar fields, padded', () => {
    expect(localDate(new Date(2026, 0, 5, 0, 30))).toBe('2026-01-05');
    expect(localDate(new Date(2026, 11, 31, 23, 59))).toBe('2026-12-31');
  });
});

describe('kstDate', () => {
  it('rolls over at midnight in Korea, not UTC', () => {
    expect(kstDate(new Date('2026-10-12T14:59:00Z'))).toBe('2026-10-12'); // 23:59 KST
    expect(kstDate(new Date('2026-10-12T15:00:00Z'))).toBe('2026-10-13'); // 00:00 KST
  });
});
