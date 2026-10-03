export interface ApprovedNote {
  studentName: string;
  studentUid: string | null;
  approvedText: string;
}

/**
 * Who gets a parent report for an approved class log, and which note each
 * one gets. Every enrolled student gets the class summary; a student's note
 * goes only to that student. `pending:` uids are invited students with no
 * account yet, so nobody could read theirs. Notes with no uid (a walk-in
 * typed by name) reach the parent only via KakaoTalk.
 */
export function parentReportRecipients(
  enrolledStudentUids: string[] | undefined,
  notes: ApprovedNote[]
): { studentUid: string; note: string | null }[] {
  const noteByUid = new Map(notes.filter((n) => n.studentUid).map((n) => [n.studentUid as string, n.approvedText]));
  const uids = [...new Set([...(enrolledStudentUids || []), ...noteByUid.keys()])].filter(
    (uid) => uid && !uid.startsWith('pending:')
  );
  return uids.map((studentUid) => ({ studentUid, note: noteByUid.get(studentUid) || null }));
}
