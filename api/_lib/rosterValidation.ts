/**
 * Pure input-shape guards for api/create-teacher-invite.ts's roster-mutation
 * actions, extracted so the validation rules (not the Firestore plumbing
 * around them) have direct test coverage.
 */
export interface AssignClassTeacherPayload {
  classId: string;
  teacherUid: string;
  assignAction: 'add' | 'remove';
}

export function isValidAssignPayload(body: unknown): body is AssignClassTeacherPayload {
  if (!body || typeof body !== 'object') return false;
  const { classId, teacherUid, assignAction } = body as Record<string, unknown>;
  return (
    typeof classId === 'string' &&
    classId.length > 0 &&
    typeof teacherUid === 'string' &&
    teacherUid.length > 0 &&
    (assignAction === 'add' || assignAction === 'remove')
  );
}

export function isValidRemoveTeacherPayload(body: unknown): body is { teacherUid: string } {
  if (!body || typeof body !== 'object') return false;
  const { teacherUid } = body as Record<string, unknown>;
  return typeof teacherUid === 'string' && teacherUid.length > 0;
}

// A director can't remove their own teacher record through this action.
export function canRemoveTeacher(callerUid: string, teacherUid: string): boolean {
  return callerUid !== teacherUid;
}
