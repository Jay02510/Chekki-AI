import { describe, it, expect } from 'vitest';
import { extractLatestExpiry } from '../api/subscription-validate-apple';

describe('extractLatestExpiry', () => {
  it('returns null for empty or missing receipt info', () => {
    expect(extractLatestExpiry([])).toBeNull();
    expect(extractLatestExpiry(undefined as any)).toBeNull();
  });

  it('returns null when the latest entry has no expires_date_ms', () => {
    expect(extractLatestExpiry([{ expires_date_ms: undefined }])).toBeNull();
  });

  it('picks the entry with the furthest-out expiry, not just the last one in the array', () => {
    const result = extractLatestExpiry([
      { expires_date_ms: '1000' },
      { expires_date_ms: '3000' },
      { expires_date_ms: '2000' },
    ]);
    expect(result).toEqual(new Date(3000));
  });

  it('treats a missing expires_date_ms as 0 when sorting', () => {
    const result = extractLatestExpiry([{ expires_date_ms: '500' }, { expires_date_ms: undefined }]);
    expect(result).toEqual(new Date(500));
  });
});
