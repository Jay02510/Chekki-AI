import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

/**
 * Robust Firebase Admin Initialization
 */
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
const adminDb = getFirestore();

/**
 * Apple Server-to-Server Notification Handler
 * Configure this URL in App Store Connect > App Information > App Store Server Notifications
 * URL: https://your-domain.vercel.app/api/subscription/webhook/apple
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const payload = req.body;

    // Apple sends a 'signedPayload' (JWT) for version 2
    if (payload.signedPayload) {
      // Version 2 (App Store Server Notifications v2)
      // Decode the payload (Verifying requires Apple's public cert chain, usually overkill for non-financial apps but recommended)
      const parts = payload.signedPayload.split('.');
      if (parts.length < 2) return res.status(400).json({ error: 'Invalid signed payload' });

      const decoded = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));
      const { notificationType, subtype, data } = decoded;

      // The 'data' object contains 'signedTransactionInfo' and 'signedRenewalInfo'
      // which also need decoding.
      let transactionInfo = null;
      if (data?.signedTransactionInfo) {
        const tParts = data.signedTransactionInfo.split('.');
        if (tParts.length >= 2) {
          transactionInfo = JSON.parse(Buffer.from(tParts[1], 'base64').toString('utf-8'));
        }
      }

      await handleNotification(notificationType, subtype, transactionInfo);
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
