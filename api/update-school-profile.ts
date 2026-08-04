import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withSentry } from './_lib/withSentry';
import { adminDb, adminAuth } from './_lib/firebaseAdmin';
import { applyCors } from './_lib/cors';

// Lets a director set their own school's display name (and logo, later)
// after api/set-initial-role.ts creates the school doc with a placeholder
// name. Ownership is checked server-side against schools/{schoolId}.ownerUid
// — the client never gets to pick which school it's writing to.
async function handler(req: VercelRequest, res: VercelResponse) {
  applyCors(req, res);

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing authorization header' });
  }
  const idToken = authHeader.split('Bearer ')[1].trim();

  const { academyName, logoUrl } = req.body || {};
  if (!academyName || typeof academyName !== 'string' || !academyName.trim()) {
    return res.status(400).json({ error: 'Missing academyName' });
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    const userSnap = await adminDb.collection('users').doc(uid).get();
    const schoolId = userSnap.data()?.schoolId;
    if (!schoolId) {
      return res.status(404).json({ error: 'No school associated with this account' });
    }

    const schoolRef = adminDb.collection('schools').doc(schoolId);
    const schoolSnap = await schoolRef.get();
    if (!schoolSnap.exists || schoolSnap.data()?.ownerUid !== uid) {
      return res.status(403).json({ error: 'Not the owner of this school' });
    }

    const update: Record<string, string> = { name: academyName.trim() };
    if (typeof logoUrl === 'string' && logoUrl.trim()) {
      update.logoUrl = logoUrl.trim();
    }
    await schoolRef.update(update);
    await adminDb.collection('users').doc(uid).update({ schoolName: academyName.trim() });

    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('[update-school-profile] error:', error);
    return res.status(500).json({ error: 'Failed to update school profile' });
  }
}

export default withSentry(handler);
