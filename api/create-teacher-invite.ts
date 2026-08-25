import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withSentry } from './_lib/withSentry.js';
import { adminDb, adminAuth } from './_lib/firebaseAdmin.js';
import { maxInvitesForRole } from './_lib/seatLimits.js';
import { applyCors } from './_lib/cors.js';
import { FieldValue } from 'firebase-admin/firestore';
import { createRateLimiter } from './_lib/rateLimit.js';
import { isValidAssignPayload, isValidRemoveTeacherPayload, canRemoveTeacher } from './_lib/rosterValidation.js';

const checkTeacherInviteLimit = createRateLimiter('teacher_invite', 20, 60);

class SeatLimitError extends Error {
  constructor(public count: number, public max: number) {
    super('Seat limit reached');
  }
}

/**
 * Director-only school-membership actions: create invite (default), assign
 * a teacher to a class, or remove a teacher entirely. Folded into one file
 * — was 3 separate endpoint files (create-teacher-invite, assign-class-
 * teacher, remove-teacher) until the Vercel Hobby plan's 12-function cap
 * blocked deployment. Dispatches on `action` in the request body; omitting
 * it defaults to the original invite-creation behavior so no existing
 * client call site needed to change.
 *
 * Audit §21: replaces the old single guessable `/teacher?invite={academySlug}`
 * link and the dead `staffEmails` field that nothing ever read. Every invite
 * is now its own Firestore doc under schools/{schoolId}/invites/{inviteId},
 * with `role` decided by the director at creation time — never guessed later
 * from an email substring or self-selected by the teacher. Seat limits are
 * enforced here by counting existing pending+claimed invites for the role
 * against schools/{schoolId}.seatsTotal, so it's structurally impossible to
 * hand out more invites than the plan allows.
 */
const ALLOWED_ROLES = new Set(['ft', 'kt']);

function generateInviteId(): string {
  return `inv_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

async function handleCreateInvite(req: VercelRequest, res: VercelResponse, corsOrigin: string, uid: string, schoolId: string) {
  const { role, email, classId } = req.body || {};
  if (!ALLOWED_ROLES.has(role)) {
    return res.status(400).json({ error: 'role must be "ft" or "kt"' });
  }
  // A teacher used to land with no class after accepting an invite — either
  // self-serving a standalone class disconnected from the director's real
  // roster, or waiting on a separate after-the-fact assignment step. The
  // class is now picked here, before the invite exists, same as role.
  if (typeof classId !== 'string' || !classId) {
    return res.status(400).json({ error: 'classId is required — pick the class this teacher will join' });
  }
  const classSnap = await adminDb.collection('classes').doc(classId).get();
  if (!classSnap.exists || classSnap.data()?.schoolId !== schoolId) {
    return res.status(404).json({ error: 'That class does not belong to your school' });
  }
  const className = classSnap.data()?.name || classId;
  const cleanEmail = typeof email === 'string' && email.trim() ? email.trim().toLowerCase() : undefined;

  const schoolRef = adminDb.collection('schools').doc(schoolId);
  const schoolSnap = await schoolRef.get();
  if (!schoolSnap.exists) {
    return res.status(404).json({ error: 'School not found' });
  }
  const schoolData = schoolSnap.data() || {};

  // Soft-lock: trial expiry blocks new invites but leaves existing
  // teachers, classes, and data fully accessible.
  if (schoolData.planId === 'trial' && schoolData.trialEndsAt && new Date(schoolData.trialEndsAt).getTime() < Date.now()) {
    return res.status(400).json({
      error: 'Your 7-day trial has ended. Upgrade your plan to invite more teachers.',
      trialExpired: true,
    });
  }

  const seatsTotal = schoolData.seatsTotal || { ft: 0, kt: 0 };
  const maxForRole = maxInvitesForRole(seatsTotal, role);

  const invitesRef = adminDb.collection('invites');
  const existingForRoleQuery = invitesRef
    .where('schoolId', '==', schoolId)
    .where('role', '==', role)
    .where('status', 'in', ['pending', 'claimed']);

  const inviteId = generateInviteId();
  const invitePayload = {
    schoolId,
    role,
    classId,
    status: 'pending' as const,
    email: cleanEmail || null,
    claimedByUid: null,
    createdAt: new Date().toISOString(),
    createdByUid: uid,
  };

  // Count-then-write outside a transaction let two concurrent invite
  // requests for the same role both read the same count, both pass the
  // < maxForRole check, and both persist — exceeding the seat limit this
  // check exists to enforce, the same race already present in
  // api/create-class.ts's class-count check (audit: TOCTOU on invite seat
  // limit).
  try {
    await adminDb.runTransaction(async (tx) => {
      const existingForRole = await tx.get(existingForRoleQuery);
      if (existingForRole.size >= maxForRole) {
        throw new SeatLimitError(existingForRole.size, maxForRole);
      }
      tx.set(invitesRef.doc(inviteId), invitePayload);
    });
  } catch (err: any) {
    if (err instanceof SeatLimitError) {
      return res.status(400).json({
        error: `No ${role.toUpperCase()} seats remaining (${err.count}/${err.max} used).`,
      });
    }
    throw err;
  }

  // Always build the invite link against a real https origin — corsOrigin
  // can resolve to 'capacitor://localhost' when the request comes from
  // the native app's WebView, which would produce a broken link. This is
  // also the fallback for the exact case Universal/App Links exist to
  // fix — a director inviting a teacher FROM the app — so it must land on
  // whichever host actually verifies. chekkiai.com (no www) permanently
  // redirects to www.chekkiai.com, and neither Apple's nor Google's
  // link-verification crawlers follow redirects when fetching
  // apple-app-site-association/assetlinks.json, so a link built on the
  // apex would never open the app no matter how the native config is set
  // up (audit: native-app invite links used the domain that fails
  // verification).
  const linkOrigin = corsOrigin.startsWith('http') ? corsOrigin : 'https://www.chekkiai.com';
  const inviteUrl = `${linkOrigin}/teacher?invite=${inviteId}`;

  // Email the invite directly if we have an address — reuses the same
  // Resend integration already wired up for invoice emails (audit §22),
  // so the director doesn't have to manually forward a link.
  const resendApiKey = process.env.RESEND_API_KEY;
  // Tracked so the response can tell the director whether the email
  // actually went out — fetch doesn't throw on a non-2xx, so a rejected
  // Resend request (bad key, unverified domain, malformed payload) used to
  // fail completely silently and "Invite sent!" showed regardless (Audit:
  // invite email reports success while the send failed).
  let emailSent = false;
  if (resendApiKey && cleanEmail) {
    try {
      const emailResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Chekki AI <billing@chekkiai.com>',
          to: [cleanEmail],
          subject: `[Chekki AI] ${schoolData.name || 'Your academy'}에서 선생님을 초대했습니다 (${role.toUpperCase()})`,
          html: `
            <div style="font-family: 'Apple SD Gothic Neo', sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background-color: #030305; color: #f4f4f5; border-radius: 16px;">
              <div style="text-align: center; margin-bottom: 24px;">
                <h1 style="font-size: 28px; font-weight: 900; margin: 0; color: #ffffff;">Chekki<span style="color: #f97316;">ai</span></h1>
              </div>
              <p style="font-size: 15px; color: #e4e4e7;">${schoolData.name || 'An academy'}에서 회원님을 <strong>${role === 'ft' ? '원어민 선생님(FT)' : '한국인 선생님(KT)'}</strong>으로 초대했습니다.</p>
              <p style="font-size: 14px; color: #e4e4e7;">배정된 학급: <strong style="color: #f97316;">${className}</strong></p>
              <p style="font-size: 14px; color: #a1a1aa; line-height: 1.6;">아래 링크로 접속해 비밀번호만 설정하면 바로 시작할 수 있습니다.</p>
              <div style="text-align: center; margin: 24px 0;">
                <a href="${inviteUrl}" style="display: inline-block; background-color: #f97316; color: #ffffff; font-weight: 900; padding: 14px 28px; border-radius: 12px; text-decoration: none;">초대 수락하기</a>
              </div>
              <p style="font-size: 12px; color: #71717a; text-align: center;">${inviteUrl}</p>
              <p style="font-size: 12px; color: #71717a; text-align: center; margin-top: 24px;">
                문의 사항이 있으시면 <a href="mailto:support@chekkiai.com" style="color: #f97316;">support@chekkiai.com</a> 로 연락해 주세요.
              </p>
            </div>
          `,
        }),
      });
      if (emailResponse.ok) {
        emailSent = true;
      } else {
        const body = await emailResponse.text().catch(() => '');
        console.error('[create-teacher-invite] Resend API rejected the request:', emailResponse.status, body, cleanEmail);
      }
    } catch (emailErr) {
      console.warn('[create-teacher-invite] Resend email failed (invite still created):', emailErr);
    }
  }

  return res.status(200).json({
    success: true,
    inviteId,
    inviteUrl,
    role,
    email: cleanEmail || null,
    emailSent,
    resendConfigured: !!resendApiKey,
  });
}

async function handleAssignClassTeacher(req: VercelRequest, res: VercelResponse, schoolId: string) {
  if (!isValidAssignPayload(req.body)) {
    return res.status(400).json({ error: 'classId, teacherUid, and assignAction ("add"|"remove") are required' });
  }
  const { classId, teacherUid, assignAction } = req.body;

  const classRef = adminDb.collection('classes').doc(classId);
  const classSnap = await classRef.get();
  if (!classSnap.exists) return res.status(404).json({ error: 'Class not found' });
  if (classSnap.data()?.schoolId !== schoolId) {
    return res.status(403).json({ error: 'That class does not belong to your school' });
  }

  const teacherSnap = await adminDb.collection('users').doc(teacherUid).get();
  const teacherData = teacherSnap.data();
  if (!teacherSnap.exists || teacherData?.role !== 'teacher' || teacherData?.schoolId !== schoolId) {
    return res.status(400).json({ error: 'That teacher does not belong to your school' });
  }

  await classRef.update({
    assignedTeacherUids: assignAction === 'add' ? FieldValue.arrayUnion(teacherUid) : FieldValue.arrayRemove(teacherUid),
  });

  return res.status(200).json({ success: true });
}

async function handleRemoveTeacher(req: VercelRequest, res: VercelResponse, callerUid: string, schoolId: string) {
  if (!isValidRemoveTeacherPayload(req.body)) {
    return res.status(400).json({ error: 'teacherUid is required' });
  }
  const { teacherUid } = req.body;
  if (!canRemoveTeacher(callerUid, teacherUid)) {
    return res.status(400).json({ error: 'Cannot remove yourself' });
  }

  const teacherRef = adminDb.collection('users').doc(teacherUid);
  const teacherSnap = await teacherRef.get();
  const teacherData = teacherSnap.data();
  if (!teacherSnap.exists || teacherData?.role !== 'teacher' || teacherData?.schoolId !== schoolId) {
    return res.status(400).json({ error: 'That teacher does not belong to your school' });
  }

  await teacherRef.update({
    role: FieldValue.delete(),
    schoolId: FieldValue.delete(),
    schoolName: FieldValue.delete(),
    educatorRole: FieldValue.delete(),
    removedFromSchoolAt: new Date().toISOString(),
  });

  const inviteSnap = await adminDb
    .collection('invites')
    .where('schoolId', '==', schoolId)
    .where('claimedByUid', '==', teacherUid)
    .where('status', '==', 'claimed')
    .get();
  await Promise.all(inviteSnap.docs.map((d) => d.ref.update({ status: 'revoked', revokedAt: new Date().toISOString() })));

  const classesSnap = await adminDb
    .collection('classes')
    .where('schoolId', '==', schoolId)
    .where('assignedTeacherUids', 'array-contains', teacherUid)
    .get();
  await Promise.all(
    classesSnap.docs.map((d) => d.ref.update({ assignedTeacherUids: FieldValue.arrayRemove(teacherUid) }))
  );

  return res.status(200).json({ success: true });
}

/**
 * Cancels a pending (never-claimed) invite so it stops occupying a seat.
 * handleRemoveTeacher above only unlinks a teacher who already claimed their
 * invite — there was no way to cancel one that's still sitting unclaimed,
 * so a mistyped/duplicate invite permanently ate a seat with no fix but
 * contacting support.
 */
async function handleRevokeInvite(req: VercelRequest, res: VercelResponse, schoolId: string) {
  const { inviteId } = req.body || {};
  if (typeof inviteId !== 'string' || !inviteId) {
    return res.status(400).json({ error: 'inviteId is required' });
  }

  const inviteRef = adminDb.collection('invites').doc(inviteId);
  const inviteSnap = await inviteRef.get();
  const inviteData = inviteSnap.data();
  if (!inviteSnap.exists || inviteData?.schoolId !== schoolId) {
    return res.status(404).json({ error: 'Invite not found' });
  }
  if (inviteData?.status !== 'pending') {
    return res.status(400).json({ error: 'Only a pending invite can be revoked' });
  }

  await inviteRef.update({ status: 'revoked', revokedAt: new Date().toISOString() });
  return res.status(200).json({ success: true });
}

/**
 * Cron-only (Vercel Cron, see vercel.json "crons"): one digest email per KT
 * per day, instead of a separate email every time an FT submits a log.
 * A school with 20 kids submitting logs used to mean 20 back-to-back emails
 * to the KT that day — this batches everything still `pending_review` and
 * not yet included in an earlier digest into a single summary.
 *
 * `digestNotifiedAt` on the log doc is the dedupe marker: once a log has
 * been mentioned in a digest, it's not repeated in tomorrow's even though
 * `reviewStatus` stays `pending_review` until the KT actually reviews it.
 */
interface KtDigestRecipient {
  email: string;
  enabled: boolean;
  hourKst: number;
}

// Cron now runs hourly (see vercel.json) so it can serve each KT's own
// preferred hour instead of one fixed daily slot for everyone — this
// computes which hour it currently is in KST to filter against.
function currentKstHour(): number {
  const kstNow = new Date(Date.now() + 9 * 60 * 60 * 1000); // UTC+9, no DST
  return kstNow.getUTCHours();
}

async function handleSendPendingDigests(_req: VercelRequest, res: VercelResponse) {
  const classesSnap = await adminDb.collection('classes').get();
  const thisHourKst = currentKstHour();

  // schoolId -> Map<ktEmail, { className, count }[]>
  const byKtEmail = new Map<string, { className: string; count: number }[]>();
  const logRefsToMark: FirebaseFirestore.DocumentReference[] = [];
  const ktRecipientCache = new Map<string, KtDigestRecipient[]>(); // classId -> resolved KT recipients

  for (const classDoc of classesSnap.docs) {
    const classData = classDoc.data() || {};
    const schoolId = classData.schoolId as string | undefined;
    if (!schoolId) continue;

    const logsSnap = await classDoc.ref
      .collection('logs')
      .where('reviewStatus', '==', 'pending_review')
      .get();
    const newLogs = logsSnap.docs.filter((d) => !d.data()?.digestNotifiedAt);
    if (newLogs.length === 0) continue;

    let ktRecipients = ktRecipientCache.get(classDoc.id);
    if (!ktRecipients) {
      const toRecipient = (data: FirebaseFirestore.DocumentData | undefined): KtDigestRecipient | null => {
        const email = data?.email;
        if (typeof email !== 'string' || !email) return null;
        return {
          email,
          enabled: data?.notifyDigestEnabled !== false, // absent = enabled, matches the pre-existing always-9am default
          hourKst: typeof data?.notifyDigestHourKst === 'number' ? data.notifyDigestHourKst : 9,
        };
      };

      const assignedTeacherUids: string[] = Array.isArray(classData.assignedTeacherUids)
        ? classData.assignedTeacherUids
        : [];
      ktRecipients = [];
      if (assignedTeacherUids.length > 0) {
        const assignedSnaps = await Promise.all(
          assignedTeacherUids.map((u) => adminDb.collection('users').doc(u).get())
        );
        ktRecipients = assignedSnaps
          .filter((s) => s.exists && s.data()?.educatorRole === 'kt')
          .map((s) => toRecipient(s.data()))
          .filter((r): r is KtDigestRecipient => !!r);
      }
      if (ktRecipients.length === 0) {
        const ktSnap = await adminDb
          .collection('users')
          .where('schoolId', '==', schoolId)
          .where('educatorRole', '==', 'kt')
          .get();
        ktRecipients = ktSnap.docs
          .map((d) => toRecipient(d.data()))
          .filter((r): r is KtDigestRecipient => !!r);
      }
      ktRecipientCache.set(classDoc.id, ktRecipients);
    }

    // Only recipients whose preference is enabled and whose preferred hour
    // is right now. Known limitation: digestNotifiedAt is a per-log flag,
    // not per-recipient — if this class has two KTs on different preferred
    // hours, whichever hour's run marks these logs first suppresses the
    // digest for the other KT's later hour. Fine for the common one-KT-
    // per-class case; a real fix needs a per-recipient marker.
    const eligibleThisHour = ktRecipients.filter((r) => r.enabled && r.hourKst === thisHourKst);
    if (eligibleThisHour.length === 0) continue; // leave newLogs unmarked so a later hour can still catch them

    for (const { email } of eligibleThisHour) {
      const existing = byKtEmail.get(email) || [];
      existing.push({ className: classData.name || classDoc.id, count: newLogs.length });
      byKtEmail.set(email, existing);
    }
    logRefsToMark.push(...newLogs.map((d) => d.ref));
  }

  const resendApiKey = process.env.RESEND_API_KEY;
  let sent = 0;
  if (resendApiKey) {
    for (const [email, entries] of byKtEmail.entries()) {
      const totalCount = entries.reduce((sum, e) => sum + e.count, 0);
      const listHtml = entries
        .map((e) => `<li style="margin-bottom:4px;">${e.className}: ${e.count}건</li>`)
        .join('');
      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Chekki AI <billing@chekkiai.com>',
            to: [email],
            subject: `[Chekki AI] 검토 대기 중인 수업 일지 ${totalCount}건`,
            html: `
              <div style="font-family: 'Apple SD Gothic Neo', sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background-color: #030305; color: #f4f4f5; border-radius: 16px;">
                <div style="text-align: center; margin-bottom: 24px;">
                  <h1 style="font-size: 28px; font-weight: 900; margin: 0; color: #ffffff;">Chekki<span style="color: #f97316;">ai</span></h1>
                </div>
                <p style="font-size: 15px; color: #e4e4e7;">오늘 원어민 선생님들이 제출한 수업 일지 ${totalCount}건이 검토를 기다리고 있습니다.</p>
                <ul style="font-size: 14px; color: #a1a1aa; line-height: 1.6; padding-left: 20px;">${listHtml}</ul>
                <div style="text-align: center; margin: 24px 0;">
                  <a href="https://chekkiai.com/teacher" style="display: inline-block; background-color: #f97316; color: #ffffff; font-weight: 900; padding: 14px 28px; border-radius: 12px; text-decoration: none;">지금 검토하기</a>
                </div>
                <p style="font-size: 12px; color: #71717a; text-align: center; margin-top: 24px;">
                  문의 사항이 있으시면 <a href="mailto:support@chekkiai.com" style="color: #f97316;">support@chekkiai.com</a> 로 연락해 주세요.
                </p>
              </div>
            `,
          }),
        });
        sent += 1;
      } catch (emailErr) {
        console.warn('[create-teacher-invite:send_pending_digests] Resend email failed:', email, emailErr);
      }
    }
  }

  await Promise.all(
    logRefsToMark.map((ref) => ref.update({ digestNotifiedAt: FieldValue.serverTimestamp() }))
  );

  return res.status(200).json({ success: true, digestsSent: sent, logsMarked: logRefsToMark.length });
}

async function handler(req: VercelRequest, res: VercelResponse) {
  const corsOrigin = applyCors(req, res);

  if (req.method === 'OPTIONS') return res.status(200).end();

  // Vercel Cron hits this as a plain GET, authenticated via CRON_SECRET
  // rather than a Firebase user token (see vercel.json "crons").
  if (req.method === 'GET' && req.query?.action === 'send_pending_digests') {
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret || req.headers.authorization !== `Bearer ${cronSecret}`) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    try {
      return await handleSendPendingDigests(req, res);
    } catch (error: any) {
      console.error('[create-teacher-invite:send_pending_digests] error:', error);
      return res.status(500).json({ error: 'Request failed' });
    }
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing authorization header' });
  }
  const idToken = authHeader.split('Bearer ')[1].trim();

  const action = req.body?.action; // undefined => 'invite' (original default behavior)

  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    const { success } = await checkTeacherInviteLimit(uid);
    if (!success) {
      return res.status(429).json({ error: 'Too many requests. Please wait a minute and try again.' });
    }

    const userSnap = await adminDb.collection('users').doc(uid).get();
    const userData = userSnap.data();

    if (!userSnap.exists || userData?.role !== 'director' || !userData?.schoolId) {
      return res.status(403).json({ error: 'Only a director with a school can perform this action' });
    }
    const schoolId = userData.schoolId as string;

    if (action === 'assign') return await handleAssignClassTeacher(req, res, schoolId);
    if (action === 'remove') return await handleRemoveTeacher(req, res, uid, schoolId);
    if (action === 'revoke_invite') return await handleRevokeInvite(req, res, schoolId);
    return await handleCreateInvite(req, res, corsOrigin, uid, schoolId);
  } catch (error: any) {
    console.error('[create-teacher-invite] error:', error);
    return res.status(500).json({ error: 'Request failed' });
  }
}

export default withSentry(handler);
