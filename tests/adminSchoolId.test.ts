import { describe, it, expect } from 'vitest';
import { sanitizeSchoolId } from '../api/admin';

describe('sanitizeSchoolId', () => {
  it('uppercases and trims', () => {
    expect(sanitizeSchoolId('  abc123  ')).toBe('ABC123');
  });

  it('strips characters outside A-Z0-9_- (closes a Firestore doc-path injection gap)', () => {
    expect(sanitizeSchoolId('abc/../../evil')).toBe('ABCEVIL');
    expect(sanitizeSchoolId('school id!')).toBe('SCHOOLID');
  });

  it('keeps hyphens and underscores', () => {
    expect(sanitizeSchoolId('my-school_01')).toBe('MY-SCHOOL_01');
  });

  it('returns an empty string for input that is entirely disallowed characters', () => {
    expect(sanitizeSchoolId('///')).toBe('');
  });
});
