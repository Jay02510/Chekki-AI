import { auth } from '../../services/database';

// Shared by StudentInvitePanel (add/upload) and StudentDatabaseGrid (resend/
// add-email/remove) — both mutate the same `pendingStudents` collection via
// api/create-class.ts, previously duplicated as two separate callEndpoint
// implementations.
export async function callStudentInviteEndpoint(body: unknown) {
  const idToken = await auth.currentUser?.getIdToken();
  const response = await fetch('/api/create-class', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export function resendPendingInvite(pendingStudentId: string) {
  return callStudentInviteEndpoint({ action: 'resend_student_invite', pendingStudentId });
}

export function addEmailAndSendInvite(pendingStudentId: string, parentEmail: string) {
  return callStudentInviteEndpoint({ action: 'resend_student_invite', pendingStudentId, parentEmail });
}

export function removePendingInvite(pendingStudentId: string) {
  return callStudentInviteEndpoint({ action: 'remove_pending_student', pendingStudentId });
}
