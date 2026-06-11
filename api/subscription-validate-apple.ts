import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

/**
 * Robust Firebase Admin Initialization
 */
function initAdmin() {
  if (getApps().length > 0) return;
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (serviceAccount) {
    try {
      const cleaned = serviceAccount.trim().replace(/\n/g, '').replace(/\r/g, '');
      const parsed = JSON.parse(cleaned);
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
const adminAuth = getAuth();

// Apple receipt validation endpoints
const APPLE_PRODUCTION_URL = 'https://buy.itunes.apple.com/verifyReceipt';
const APPLE_SANDBOX_URL = 'https://sandbox.itunes.apple.com/verifyReceipt';

// Your Apple App-Specific Shared Secret
const APPLE_SHARED_SECRET = process.env.APPLE_SHARED_SECRET || '2a83e06681154ff2b2cd9921dfd9efae';

async function validateWithApple(receiptData: string, useSandbox = false): Promise<any> {
  const url = useSandbox ? APPLE_SANDBOX_URL : APPLE_PRODUCTION_URL;
  const body = JSON.stringify({
    'receipt-data': receiptData,
    password: APPLE_SHARED_SECRET,
    'exclude-old-transactions': true,
  });

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  });

  return response.json();
}

function extractLatestExpiry(receiptInfo: any[]): Date | null {
  if (!receiptInfo || receiptInfo.length === 0) return null;

  const sorted = [...receiptInfo].sort((a, b) => {
    const aExp = parseInt(a.expires_date_ms || '0');
    const bExp = parseInt(b.expires_date_ms || '0');
    return bExp - aExp;
  });

  const latest = sorted[0];
  if (!latest.expires_date_ms) return null;
  return new Date(parseInt(latest.expires_date_ms));
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Verify Firebase ID Token
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing authorization header' });
  }
  const idToken = authHeader.split('Bearer ')[1].trim();

  const { receipt_data, user_id } = req.body || {};
  if (!receipt_data || !user_id) {
    return res.status(400).json({ error: 'Missing receipt_data or user_id' });
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    if (decodedToken.uid !== user_id) {
      return res.status(403).json({ error: 'Unauthorized: User ID mismatch' });
    }

    // Try production first
    let appleResponse = await validateWithApple(receipt_data, false);

    // Status 21007 means it's a sandbox receipt — retry with sandbox
    if (appleResponse.status === 21007) {
      appleResponse = await validateWithApple(receipt_data, true);
    }

    // Status 0 means success
    if (appleResponse.status !== 0) {
      console.error('[validate-apple] Apple rejection status:', appleResponse.status);
      return res.status(200).json({
        success: false,
        subscription_status: 'none',
        error: `Apple validation failed with status ${appleResponse.status}`,
      });
    }

    const latestReceiptInfo: any[] = appleResponse.latest_receipt_info || [];
    const expiryDate = extractLatestExpiry(latestReceiptInfo);
    const isActive = expiryDate ? expiryDate > new Date() : false;
    const status = isActive ? 'active' : 'expired';

    const latestTx = latestReceiptInfo[0] || {};
    const now = new Date().toISOString();
    const subData = {
      user_id,
      subscription_status: status,
      subscription_platform: 'apple',
      subscription_start_date:
        latestReceiptInfo[latestReceiptInfo.length - 1]?.purchase_date ?? now,
      subscription_expiry_date: expiryDate ? expiryDate.toISOString() : null,
      apple_receipt: receipt_data,
      apple_original_transaction_id: latestTx.original_transaction_id || null,
      apple_product_id: latestTx.product_id || null,
      google_purchase_token: null,
      web_subscription_id: null,
      updated_at: now,
      created_at: now,
    };

    // Use an atomic batch write to ensure database integrity
    const batch = adminDb.batch();
    const subRef = adminDb.collection('subscriptions').doc(user_id);
    const userRef = adminDb.collection('users').doc(user_id);

    batch.set(subRef, subData, { merge: true });

    if (isActive) {
      batch.update(userRef, {
        plan: 'pro',
        maxScansPerDay: 9999,
        maxQuestionsPerDay: 9999,
      });
    }

    await batch.commit();

    return res.status(200).json({
      success: true,
      subscription_status: status,
      subscription_platform: 'apple',
      subscription_expiry_date: expiryDate ? expiryDate.toISOString() : null,
    });
  } catch (err: any) {
    console.error('[validate-apple] Error:', err);
    return res.status(401).json({ error: 'Authentication failed' });
  }
}
