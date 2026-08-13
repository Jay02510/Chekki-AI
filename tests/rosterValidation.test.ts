import { describe, it, expect } from 'vitest';
import { isValidAssignPayload, isValidRemoveTeacherPayload, canRemoveTeacher } from '../api/_lib/rosterValidation';

describe('isValidAssignPayload', () => {
  it('accepts a well-formed add/remove payload', () => {
    expect(isValidAssignPayload({ classId: 'c1', teacherUid: 't1', assignAction: 'add' })).toBe(true);
    expect(isValidAssignPayload({ classId: 'c1', teacherUid: 't1', assignAction: 'remove' })).toBe(true);
  });

  it('rejects missing or wrong-typed fields', () => {
    expect(isValidAssignPayload(undefined)).toBe(false);
    expect(isValidAssignPayload({})).toBe(false);
    expect(isValidAssignPayload({ classId: 'c1', teacherUid: 't1' })).toBe(false);
    expect(isValidAssignPayload({ classId: 1, teacherUid: 't1', assignAction: 'add' })).toBe(false);
  });

  it('rejects an assignAction outside add/remove', () => {
    expect(isValidAssignPayload({ classId: 'c1', teacherUid: 't1', assignAction: 'toggle' })).toBe(false);
  });

  it('rejects empty-string ids', () => {
    expect(isValidAssignPayload({ classId: '', teacherUid: 't1', assignAction: 'add' })).toBe(false);
  });
});

describe('isValidRemoveTeacherPayload', () => {
  it('accepts a non-empty teacherUid', () => {
    expect(isValidRemoveTeacherPayload({ teacherUid: 't1' })).toBe(true);
  });

  it('rejects missing/empty/wrong-typed teacherUid', () => {
    expect(isValidRemoveTeacherPayload(undefined)).toBe(false);
    expect(isValidRemoveTeacherPayload({})).toBe(false);
    expect(isValidRemoveTeacherPayload({ teacherUid: '' })).toBe(false);
    expect(isValidRemoveTeacherPayload({ teacherUid: 5 })).toBe(false);
  });
});

describe('canRemoveTeacher', () => {
  it('blocks self-removal', () => {
    expect(canRemoveTeacher('u1', 'u1')).toBe(false);
  });

  it('allows removing someone else', () => {
    expect(canRemoveTeacher('u1', 'u2')).toBe(true);
  });
});
