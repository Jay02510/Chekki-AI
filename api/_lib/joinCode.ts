import { randomInt } from 'crypto';

/**
 * 6-character class join code generator, extracted from api/create-class.ts
 * so its format/charset invariants have direct test coverage.
 *
 * Uses crypto.randomInt rather than Math.random — this code is an
 * access-granting token (redeem.ts also requires the caller's email to
 * match the invite's parentEmail, but the code itself shouldn't be the
 * weak link) (audit: Low finding — non-cryptographic join codes).
 */
export function generateJoinCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(randomInt(chars.length));
  }
  return code;
}
