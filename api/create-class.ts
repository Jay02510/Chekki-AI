import type { VercelRequest, VercelResponse } from '@vercel/node';
import { adminDb, adminAuth } from './_lib/firebaseAdmin';

/**
 * Server-side seat-limit enforcement on class creation (audit §2/§10/§18).
 *
 * The client-side check in TeacherPage.tsx's handleCreateClass is advisory
 * only — it gives the teacher an instant "you're at your limit" message, but
 * a direct Firestore write from the browser could always bypass it. This
 * endpoint is now the only path that can create a `classes` doc:
 * firestore.rules denies client-side creates entirely, so the count check
 * here is a real boundary, not just UX.
 *
 * The limit is the school's total provisioned seats (ft + kt), the same
 * seatsTotal set by api/set-initial-role.ts / api/admin.ts and already
 * enforced for teacher invites in api/create-teacher-invite.ts — one number,
 * checked the same way everywhere, instead of the old dead `seatCount` field
 * that nothing ever wrote.
 */
function generateJoinCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const allowedOrigins = [
    'https://chekkiai.com',
    'https://www.chekkiai.com',
    'http://localhost:5173',
    'http://localhost:3000',
  ];
  const origin = req.headers.origin as string | undefined;
  const corsOrigin = origin && allowedOrigins.includes(origin) ? origin : allowedOrigins[0];

  res.setHeader('Access-Control-Allow-Origin', corsOrigin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing authorization header' });
  }
  const idToken = authHeader.split('Bearer ')[1].trim();

  const { name, level } = req.body || {};
  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'Missing class name' });
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    const userSnap = await adminDb.collection('users').doc(uid).get();
    const userData = userSnap.data();
    if (!userSnap.exists || (userData?.role !== 'teacher' && userData?.role !== 'director')) {
      return res.status(403).json({ error: 'Only teachers or directors can create classes' });
    }

    const schoolId: string | undefined = userData?.schoolId;
    let maxClasses = 1; // unconfirmed/no-school accounts get a single trial class
    if (schoolId) {
      const schoolSnap = await adminDb.collection('schools').doc(schoolId).get();
      const seatsTotal = schoolSnap.data()?.seatsTotal;
      if (seatsTotal) {
        maxClasses = Math.max(1, Number(seatsTotal.ft || 0) + Number(seatsTotal.kt || 0));
      }
    }

    const existingQuery = schoolId
      ? adminDb.collection('classes').where('schoolId', '==', schoolId)
      : adminDb.collection('classes').where('teacherUid', '==', uid);
    const existingSnap = await existingQuery.get();

    if (existingSnap.size >= maxClasses) {
      return res.status(400).json({
        error: `Class limit reached (${existingSnap.size}/${maxClasses}). Contact support@chekkiai.com to add more seats.`,
      });
    }

    const sanitizedName = name.trim().replace(/\s+/g, '-');
    const classId = `${schoolId || uid}_${sanitizedName}_${Date.now()}`;
    const newClass = {
      id: classId,
      schoolId: schoolId || `school_${uid.slice(0, 8)}`,
      schoolName: userData?.schoolName || 'B2B Academy',
      name: name.trim(),
      level: typeof level === 'string' && level.trim() ? level.trim() : 'General',
      teacherUid: uid,
      activeWeekNumber: 1,
      joinCode: generateJoinCode(),
      createdAt: new Date().toISOString(),
    };

    await adminDb.collection('classes').doc(classId).set(newClass);

    return res.status(200).json({ success: true, class: newClass });
  } catch (error: any) {
    console.error('[create-class] error:', error);
    return res.status(500).json({ error: 'Failed to create class' });
  }
}
