import { adminDb } from './firebaseAdmin.js';

export type NotificationType = 'teacher_invite_accepted' | 'student_joined' | 'plan_upgraded';

interface NotificationInput {
  type: NotificationType;
  title: string;
  body: string;
  meta?: Record<string, unknown>;
}

// Fans a notification out to every director of a school. Admin SDK writes
// bypass firestore.rules, so this is the only path that can create a
// notification doc — the client-side rule only allows the owner to
// read/mark-read, never create.
export async function notifyDirectors(schoolId: string, notif: NotificationInput): Promise<void> {
  if (!schoolId) return;
  const directorsSnap = await adminDb
    .collection('users')
    .where('schoolId', '==', schoolId)
    .where('role', '==', 'director')
    .get();

  if (directorsSnap.empty) return;

  const batch = adminDb.batch();
  const createdAt = new Date().toISOString();
  directorsSnap.docs.forEach((directorDoc) => {
    const ref = adminDb.collection('users').doc(directorDoc.id).collection('notifications').doc();
    batch.set(ref, { ...notif, read: false, createdAt });
  });
  await batch.commit();
}
