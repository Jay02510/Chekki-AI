import { describe, it, expect } from 'vitest';
import { generateJoinCode } from '../api/_lib/joinCode';

describe('generateJoinCode', () => {
  it('generates a 6-character code', () => {
    expect(generateJoinCode()).toHaveLength(6);
  });

  it('only uses uppercase letters and digits', () => {
    for (let i = 0; i < 50; i++) {
      expect(generateJoinCode()).toMatch(/^[A-Z0-9]{6}$/);
    }
  });

  it('is not deterministic across calls', () => {
    const codes = new Set(Array.from({ length: 20 }, () => generateJoinCode()));
    expect(codes.size).toBeGreaterThan(1);
  });
});
