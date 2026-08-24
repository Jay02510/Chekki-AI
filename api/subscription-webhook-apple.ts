import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withSentry } from './_lib/withSentry.js';
import crypto from 'crypto';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from './_lib/firebaseAdmin.js';
import { verifyAppleNotification, verifyAppleTransaction } from './_lib/appleWebhookVerifier.js';
import { captureException } from './_lib/sentry.js';

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
      const { notificationType, subtype, data, notificationUUID, signedDate } = decoded as any;

      // Apple redelivers notifications on retry (and doesn't guarantee
      // in-order delivery) — without recording which notificationUUIDs
      // were already applied, a redelivered SUBSCRIBED could reprocess
      // after a later REFUND already downgraded the account, resurrecting
      // an already-refunded subscription.
      if (notificationUUID) {
        const dedupeRef = adminDb.collection('processedAppleNotifications').doc(notificationUUID);
        const alreadyProcessed = await adminDb.runTransaction(async (t) => {
          const snap = await t.get(dedupeRef);
          if (snap.exists) return true;
          t.set(dedupeRef, { notificationType, subtype: subtype || null, processedAt: new Date().toISOString() });
          return false;
        });
        if (alreadyProcessed) {
          console.log(`[webhook-apple] Skipping already-processed notification ${notificationUUID}`);
          return res.status(200).end();
        }
      }

      // signedTransactionInfo is itself a separately-signed JWS and needs
      // its own verification, not just a base64 decode.
      let transactionInfo: any = null;
      if (data?.signedTransactionInfo) {
        transactionInfo = await verifyAppleTransaction(data.signedTransactionInfo).catch((e) => {
          console.error('[webhook-apple] Transaction JWS verification failed:', e);
          return null;
        });
      }

      await handleNotification(notificationType as string, subtype as string, transactionInfo, signedDate as number | undefined);
    } else {
      // Apple deprecated v1 App Store Server Notifications; only v2
      // (signedPayload, verified above) carries a real signature. A v1 body
      // is unauthenticated request data — refuse it outright rather than
      // parsing it, so this branch can never become a silent "any POST
      // flips plan to pro" bypass the way the v2 path was before its JWS
      // verification was added (audit: Medium finding — unverified v1
      // webhook path).
      console.warn('[webhook-apple] Rejected unverified v1 notification payload');
      return res.status(200).end();
    }

    // Always return 200 to Apple to prevent retries
    return res.status(200).end();
  } catch (err: any) {
    console.error('[webhook-apple] Error processing notification:', err);
    return res.status(200).end();
  }
}

async function handleNotification(type: string, subtype: string, data: any, signedDate?: number) {
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

    // Apple doesn't guarantee delivery order — a redelivered/delayed older
    // event (e.g. a retried SUBSCRIBED) could otherwise land after a newer
    // one (a REFUND) already applied and stomp it with stale state. Only
    // apply this event if it's not older than the last one we accepted.
    if (signedDate) {
      const existingSnap = await userRef.get();
      const existingSignedDate = existingSnap.exists ? existingSnap.data()?.apple_last_signed_date : null;
      if (existingSignedDate && signedDate <= existingSignedDate) {
        console.log(`[webhook-apple] Dropping out-of-order notification for ${finalUserId} (event ${signedDate} <= last-applied ${existingSignedDate})`);
        return;
      }
    }

    const batch = adminDb.batch();
    const userProfileRef = adminDb.collection('users').doc(finalUserId);

    batch.update(userRef, {
      subscription_status: status,
      subscription_expiry_date: expiresDate ? expiresDate.toISOString() : null,
      apple_last_signed_date: signedDate || FieldValue.delete(),
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
  } else if (originalTransactionId) {
    // No subscriptions/{uid} doc exists yet — most likely this webhook beat
    // the client's own subscription-validate-apple.ts call (app backgrounded
    // right after purchase). Apple gets a 200 either way and will never
    // retry, so without persisting this somewhere the event is lost forever
    // and the purchase may never activate. Stash it so a reconciliation
    // pass (or a future validate-apple call matching this
    // originalTransactionId) can still apply it, and surface it — this
    // should be rare, not silent.
    await adminDb.collection('pendingAppleNotifications').doc(originalTransactionId).set({
      notificationType: type,
      subtype: subtype || null,
      status,
      expiresDate: expiresDate ? expiresDate.toISOString() : null,
      originalTransactionId,
      receivedAt: now,
    });
    captureException(
      new Error(`[webhook-apple] No matching subscriptions doc for originalTransactionId ${originalTransactionId} (type=${type}) — stashed as pending`)
    );
  }
}

export default withSentry(handler);
