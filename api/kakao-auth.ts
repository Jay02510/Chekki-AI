import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

function initAdmin() {
  if (getApps().length > 0) return;
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (serviceAccount) {
    try {
      const parsed = JSON.parse(serviceAccount);
      initializeApp({ credential: cert(parsed) });
    } catch (e) {
      console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT:', e);
      initializeApp();
    }
  } else {
    initializeApp();
  }
}

initAdmin();
const adminAuth = getAuth();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { accessToken } = req.body || {};
  if (!accessToken) {
    return res.status(400).json({ error: 'Missing Kakao access token' });
  }

  try {
    // Verify access token with Kakao API
    const kakaoRes = await fetch('https://kapi.kakao.com/v2/user/me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!kakaoRes.ok) {
      const errText = await kakaoRes.text();
      return res.status(kakaoRes.status).json({ error: `Kakao verification failed: ${errText}` });
    }

    const kakaoUser = (await kakaoRes.json()) as any;
    if (!kakaoUser || !kakaoUser.id) {
      return res.status(400).json({ error: 'Invalid Kakao user data returned' });
    }

    const kakaoUid = `kakao:${kakaoUser.id}`;

    // Get user profile details
    const email = kakaoUser.kakao_account?.email || '';
    const name =
      kakaoUser.properties?.nickname || kakaoUser.kakao_account?.profile?.nickname || 'Kakao User';

    // Check if user exists in Firebase Auth, otherwise create them
    try {
      await adminAuth.getUser(kakaoUid);
    } catch (err: any) {
      if (err.code === 'auth/user-not-found') {
        const createParams: any = {
          uid: kakaoUid,
          displayName: name,
        };
        if (email) {
          createParams.email = email;
        }
        await adminAuth.createUser(createParams);
      } else {
        throw err;
      }
    }

    // Generate Firebase Custom Token
    const customToken = await adminAuth.createCustomToken(kakaoUid);

    return res.status(200).json({
      success: true,
      customToken,
      profile: {
        uid: kakaoUid,
        name,
        email,
      },
    });
  } catch (err: any) {
    console.error('[kakao-auth] Error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
