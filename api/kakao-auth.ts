import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withSentry } from './_lib/withSentry.js';
import { adminAuth } from './_lib/firebaseAdmin.js';
import { applyCors } from './_lib/cors.js';

async function handler(req: VercelRequest, res: VercelResponse) {
  applyCors(req, res);

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
        try {
          await adminAuth.createUser(createParams);
        } catch (createErr: any) {
          // Firebase enforces unique emails, so this can't silently take
          // over an existing email/Google/Apple account — it fails loudly.
          // Give the user an actionable message instead of a raw 500.
          if (createErr.code === 'auth/email-already-exists') {
            return res.status(409).json({
              error: 'An account with this email already exists. Please sign in using your original method.',
            });
          }
          throw createErr;
        }
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
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export default withSentry(handler);
