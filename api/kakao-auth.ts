import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withSentry } from './_lib/withSentry.js';
import { adminAuth } from './_lib/firebaseAdmin.js';
import { applyCors } from './_lib/cors.js';
import { createRateLimiter, clientIp } from './_lib/rateLimit.js';

// Unauthenticated (this IS the login flow) and each call hits Kakao's API
// plus potentially creates a Firebase Auth user — no throttle meant it could
// be hammered for cost/DoS (Audit: no rate limit on kakao-auth.ts).
const checkLoginLimit = createRateLimiter('kakao_auth', 10, 60);

async function handler(req: VercelRequest, res: VercelResponse) {
  applyCors(req, res);

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { success } = await checkLoginLimit(clientIp(req));
  if (!success) {
    return res.status(429).json({ error: 'Too many attempts. Please wait a minute and try again.' });
  }

  const { accessToken } = req.body || {};
  if (!accessToken) {
    return res.status(400).json({ error: 'Missing Kakao access token' });
  }

  try {
    // /v2/user/me only proves the token is *some* valid Kakao access token —
    // it never checks which app requested it. Without this, an access token
    // minted for a totally unrelated third-party Kakao app (leaked, phished,
    // or from a malicious app the victim installed) would still pass here
    // and log the caller in as that Kakao user (Audit: no app_id check on
    // kakao-auth.ts). access_token_info returns the app_id that requested
    // the token, which we pin to this app's own Kakao App ID.
    const expectedAppId = process.env.KAKAO_APP_ID;
    if (expectedAppId) {
      const tokenInfoRes = await fetch('https://kapi.kakao.com/v1/user/access_token_info', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!tokenInfoRes.ok) {
        const errText = await tokenInfoRes.text();
        return res.status(tokenInfoRes.status).json({ error: `Kakao verification failed: ${errText}` });
      }
      const tokenInfo = (await tokenInfoRes.json()) as any;
      if (String(tokenInfo?.app_id) !== String(expectedAppId)) {
        console.error('[kakao-auth] Token app_id mismatch:', tokenInfo?.app_id);
        return res.status(401).json({ error: 'This token was not issued for this app.' });
      }
    } else {
      console.warn('[kakao-auth] KAKAO_APP_ID is not set — skipping app_id verification.');
    }

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
