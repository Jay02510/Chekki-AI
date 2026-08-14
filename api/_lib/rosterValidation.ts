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

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface PendingStudentInput {
  name: string;
  parentEmail: string;
}

/** classId + 1-200 {name, parentEmail} rows, each with a non-empty name and a plausible email. */
export function isValidAddStudentsPayload(
  body: unknown
): body is { classId: string; students: PendingStudentInput[] } {
  if (!body || typeof body !== 'object') return false;
  const { classId, students } = body as Record<string, unknown>;
  if (typeof classId !== 'string' || !classId) return false;
  if (!Array.isArray(students) || students.length === 0 || students.length > 200) return false;
  return students.every((s) => {
    if (!s || typeof s !== 'object') return false;
    const { name, parentEmail } = s as Record<string, unknown>;
    return (
      typeof name === 'string' && name.trim().length > 0 && name.trim().length <= 100 &&
      typeof parentEmail === 'string' && EMAIL_RE.test(parentEmail.trim())
    );
  });
}
