import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withSentry } from './_lib/withSentry';
import crypto from 'crypto';
import { adminDb } from './_lib/firebaseAdmin';
import { verifyAppleNotification, verifyAppleTransaction } from './_lib/appleWebhookVerifier';

/**
 * Apple Server-to-Server Notification Handler
 * Configure this URL in App Store Connect > App Information > App Store Server Notifications
 * URL: https://your-domain.vercel.app/api/subscription/webhook/apple
 */
async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Optional Secret Webhook Auth check using constant-time timingSafeEqual to prevent side-channel timing attacks
  const secret = process.env.APPLE_WEBHOOK_SECRET;
  if (secret) {
    const authHeader = (req.headers.authorization || '').trim();
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
    const secretBuf = Buffer.from(secret);
    const tokenBuf = Buffer.from(token);
    
    if (secretBuf.length !== tokenBuf.length || !crypto.timingSafeEqual(secretBuf, tokenBuf)) {
      console.warn('[webhook-apple] Unauthorized webhook verification failed');
      return res.status(401).json({ error: 'Unauthorized webhook request' });
    }
  }

  try {
    const payload = req.body;

    // Apple sends a 'signedPayload' (JWT) for version 2
    if (payload.signedPayload) {
      // Verify the outer notification JWS against Apple's real certificate
      // chain before trusting anything in it — a base64 decode alone (the
      // old behavior here) lets anyone POST a crafted payload and flip a
      // user to plan:'pro'.
      const decoded = await verifyAppleNotification(payload.signedPayload);
      const { notificationType, subtype, data } = decoded;

      // signedTransactionInfo is itself a separately-signed JWS and needs
      // its own verification, not just a base64 decode.
      let transactionInfo: any = null;
      if (data?.signedTransactionInfo) {
        transactionInfo = await verifyAppleTransaction(data.signedTransactionInfo).catch((e) => {
          console.error('[webhook-apple] Transaction JWS verification failed:', e);
          return null;
        });
      }

      await handleNotification(notificationType as string, subtype as string, transactionInfo);
    } else {
      // Version 1 fallback
      const { notification_type, latest_receipt_info } = payload;
      await handleV1Notification(notification_type, latest_receipt_info);
    }

    // Always return 200 to Apple to prevent retries
    return res.status(200).end();
  } catch (err: any) {
    console.error('[webhook-apple] Error processing notification:', err);
    return res.status(200).end();
  }
}

async function handleNotification(type: string, subtype: string, data: any) {
  if (!data) return;

  const now = new Date().toISOString();
  // appAccountToken is the UUID we set during purchase
  const userId = data.appAccountToken;
  const originalTransactionId = data.originalTransactionId;

  if (!userId && !originalTransactionId) {
    console.warn('[webhook-apple] No userId or originalTransactionId found');
    return;
  }

  const expiresDate = data.expiresDate ? new Date(data.expiresDate) : null;

  let status: string;
  switch (type) {
    case 'DID_RENEW':
    case 'SUBSCRIBED':
      status = 'active';
      break;
    case 'EXPIRED':
    case 'DID_FAIL_TO_RENEW':
      status = 'expired';
      break;
    case 'REVOKE':
    case 'REFUND':
      status = 'cancelled';
      break;
    default:
      console.log(`[webhook-apple] Unhandled notification type: ${type}`);
      return;
  }

  // Find user by ID or original transaction ID
  let userRef;
  if (userId) {
    userRef = adminDb.collection('subscriptions').doc(userId);
  } else {
    // Fallback: search by original transaction ID
    const query = await adminDb
      .collection('subscriptions')
      .where('apple_original_transaction_id', '==', originalTransactionId)
      .limit(1)
      .get();
    if (!query.empty) {
      userRef = query.docs[0].ref;
    }
  }

  if (userRef) {
    const finalUserId = userRef.id;
    const batch = adminDb.batch();
    const userProfileRef = adminDb.collection('users').doc(finalUserId);

    batch.update(userRef, {
      subscription_status: status,
      subscription_expiry_date: expiresDate ? expiresDate.toISOString() : null,
      updated_at: now,
    });

    if (status === 'active') {
      batch.update(userProfileRef, {
        plan: 'pro',
        maxScansPerDay: 9999,
        maxQuestionsPerDay: 9999,
      });
    } else if (status === 'expired' || status === 'cancelled') {
      batch.update(userProfileRef, {
        plan: 'free',
        maxScansPerDay: 3,
        maxQuestionsPerDay: 5,
      });
    }

    await batch.commit();
  }
}

async function handleV1Notification(notificationType: string, latestReceiptInfo: any) {
  console.log('[webhook-apple] V1 notification received:', notificationType);
}

export default withSentry(handler);
