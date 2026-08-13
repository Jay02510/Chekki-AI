import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withSentry } from './_lib/withSentry.js';
import { adminDb, adminAuth } from './_lib/firebaseAdmin.js';
import { maxClassesForSeats } from './_lib/seatLimits.js';
import { applyCors } from './_lib/cors.js';
import { createRateLimiter } from './_lib/rateLimit.js';
import { generateJoinCode } from './_lib/joinCode.js';

const checkCreateClassLimit = createRateLimiter('create_class', 20, 60);

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

async function handler(req: VercelRequest, res: VercelResponse) {
  applyCors(req, res);

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

    const { success } = await checkCreateClassLimit(uid);
    if (!success) {
      return res.status(429).json({ error: 'Too many requests. Please wait a minute and try again.' });
    }

    const userSnap = await adminDb.collection('users').doc(uid).get();
    const userData = userSnap.data();
    if (!userSnap.exists || (userData?.role !== 'teacher' && userData?.role !== 'director')) {
      return res.status(403).json({ error: 'Only teachers or directors can create classes' });
    }

    const schoolId: string | undefined = userData?.schoolId;
    let maxClasses = 1; // unconfirmed/no-school accounts get a single trial class
    if (schoolId) {
      const schoolSnap = await adminDb.collection('schools').doc(schoolId).get();
      const schoolData = schoolSnap.data();
      maxClasses = maxClassesForSeats(schoolData?.seatsTotal);

      // Soft-lock: trial expiry blocks new classes but leaves existing
      // classes, scans, and reports fully visible — only forward progress
      // is gated, not access to what's already there.
      if (schoolData?.planId === 'trial' && schoolData?.trialEndsAt && new Date(schoolData.trialEndsAt).getTime() < Date.now()) {
        return res.status(400).json({
          error: 'Your 7-day trial has ended. Upgrade your plan to create new classes.',
          trialExpired: true,
        });
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
      assignedTeacherUids: [uid],
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

export default withSentry(handler);
