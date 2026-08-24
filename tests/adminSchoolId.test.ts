import { describe, it, expect } from 'vitest';
import { sanitizeSchoolId, isValidExistingDocId } from '../api/admin';

describe('isValidExistingDocId', () => {
  it('accepts a real self-serve schoolId as-is, case preserved', () => {
    // Self-serve director signups create schools as `school_${uid}` with a
    // mixed-case Firebase uid, never through sanitizeSchoolId — this must
    // stay exact or delete/upgrade/assign_teacher silently target the
    // wrong (nonexistent) doc.
    expect(isValidExistingDocId('school_AbC123xyz')).toBe(true);
  });

  it('accepts an admin-created uppercase schoolId as-is', () => {
    expect(isValidExistingDocId('MY-SCHOOL_01')).toBe(true);
  });

  it('rejects a path-traversal attempt via a slash', () => {
    expect(isValidExistingDocId('abc/../../evil')).toBe(false);
  });

  it('rejects empty or whitespace-only input', () => {
    expect(isValidExistingDocId('')).toBe(false);
    expect(isValidExistingDocId('   ')).toBe(false);
  });
});

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
