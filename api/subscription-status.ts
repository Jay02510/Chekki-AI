import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withSentry } from './_lib/withSentry.js';
import { adminDb, adminAuth } from './_lib/firebaseAdmin.js';
import { applyCors } from './_lib/cors.js';

async function handler(req: VercelRequest, res: VercelResponse) {
  applyCors(req, res, { methods: 'GET, OPTIONS' });

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  // Verify Firebase ID Token
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing authorization header' });
  }
  const idToken = authHeader.split('Bearer ')[1].trim();

  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const userId = decodedToken.uid;
    const nowStr = new Date().toISOString();

    // Check manual admin upgrade or school code first
    const userRef = adminDb.collection('users').doc(userId);
    const userDoc = await userRef.get();
    if (userDoc.exists) {
      const userData = userDoc.data()!;

      // Handle school code users
      if (userData.plan === 'pro' && userData.subscriptionPlatform === 'school_code') {
        return res.status(200).json({
          subscription_status: 'active',
          subscription_platform: 'school_code',
          subscription_expiry_date: null,
        });
      }

      // Handle admin upgrade users
      if (
        userData.plan === 'pro' &&
        userData.subscriptionPlatform === 'admin_upgrade' &&
        userData.nextBillingDate
      ) {
        const expirationMs = new Date(userData.nextBillingDate).getTime();
        if (Date.now() > expirationMs) {
          await userRef.update({
            plan: 'free',
            maxScansPerDay: 3,
            maxQuestionsPerDay: 5,
          });
          return res.status(200).json({
            subscription_status: 'expired',
            subscription_platform: 'admin_upgrade',
            subscription_expiry_date: userData.nextBillingDate,
          });
        } else {
          return res.status(200).json({
            subscription_status: 'active',
            subscription_platform: 'admin_upgrade',
            subscription_expiry_date: userData.nextBillingDate,
          });
        }
      }
    }

    let status = 'none';
    let platform = 'none';
    let expiryDate: string | null = null;
    let syncedFromRC = false;

    const rcKey = process.env.REVENUECAT_SECRET_KEY;

    if (rcKey) {
      try {
        const rcResponse = await fetch(`https://api.revenuecat.com/v1/subscribers/${userId}`, {
          headers: {
            Authorization: `Bearer ${rcKey}`,
            'Content-Type': 'application/json',
          },
        });

        if (rcResponse.ok) {
          const rcData = await rcResponse.json();
          const subscriber = rcData.subscriber || {};
          const entitlements = subscriber.entitlements || {};

          let activeEntitlement: any = null;
          for (const key of Object.keys(entitlements)) {
            const ent = entitlements[key];
            const expires = ent.expires_date ? new Date(ent.expires_date) : null;
            if (!expires || expires > new Date()) {
              activeEntitlement = ent;
              break;
            }
          }

          if (activeEntitlement) {
            status = 'active';
            platform =
              subscriber.subscriptions && Object.keys(subscriber.subscriptions).length > 0
                ? (Object.values(subscriber.subscriptions)[0] as any).store || 'revenuecat'
                : 'revenuecat';

            if (platform === 'app_store') platform = 'apple';
            else if (platform === 'play_store') platform = 'android';

            expiryDate = activeEntitlement.expires_date || null;
          } else {
            status = 'expired';
            if (Object.keys(entitlements).length > 0) {
              const lastEnt = Object.values(entitlements)[0] as any;
              expiryDate = lastEnt.expires_date || null;
            }
          }
          syncedFromRC = true;
        }
      } catch (rcErr) {
        console.error('[subscription-status] RevenueCat sync failed:', rcErr);
      }
    }

    if (syncedFromRC) {
      const subRef = adminDb.collection('subscriptions').doc(userId);
      await subRef.set(
        {
          user_id: userId,
          subscription_status: status,
          subscription_platform: platform,
          subscription_expiry_date: expiryDate,
          updated_at: nowStr,
        },
        { merge: true }
      );

      const userRef = adminDb.collection('users').doc(userId);
      const userDoc = await userRef.get();

      if (status === 'active') {
        await userRef.update({
          plan: 'pro',
          maxScansPerDay: 9999,
          maxQuestionsPerDay: 9999,
        });
      } else if (status === 'expired' && userDoc.exists) {
        const userData = userDoc.data()!;
        if (
          userData.plan === 'pro' &&
          ['apple', 'android', 'revenuecat', 'none'].includes(
            userData.subscriptionPlatform || 'none'
          )
        ) {
          await userRef.update({
            plan: 'free',
            maxScansPerDay: 3,
            maxQuestionsPerDay: 5,
          });
        }
      }

      return res.status(200).json({
        subscription_status: status,
        subscription_platform: platform,
        subscription_expiry_date: expiryDate,
      });
    }

    // --- FALLBACK DATABASE CHECK ---
    const subRef = adminDb.collection('subscriptions').doc(userId);
    const subDoc = await subRef.get();

    if (!subDoc.exists) {
      return res.status(200).json({
        subscription_status: 'none',
        subscription_platform: 'none',
        subscription_expiry_date: null,
      });
    }

    const data = subDoc.data()!;
    const now = new Date();
    const expiry = data.subscription_expiry_date ? new Date(data.subscription_expiry_date) : null;

    if (expiry && expiry < now && data.subscription_status === 'active') {
      await subRef.update({ subscription_status: 'expired', updated_at: now.toISOString() });
      data.subscription_status = 'expired';

      await adminDb.collection('users').doc(userId).update({
        plan: 'free',
        maxScansPerDay: 3,
        maxQuestionsPerDay: 5,
      });
    }

    return res.status(200).json({
      subscription_status: data.subscription_status || 'none',
      subscription_platform: data.subscription_platform || 'none',
      subscription_expiry_date: data.subscription_expiry_date || null,
    });
  } catch (err: any) {
    console.error('[subscription-status] Error:', err);
    if (err.code === 'auth/id-token-expired') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
}

export default withSentry(handler);
