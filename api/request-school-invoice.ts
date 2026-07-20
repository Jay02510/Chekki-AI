import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

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
      initializeApp({ projectId: 'homework-assistant-c00b9' });
    }
  } else {
    initializeApp({ projectId: 'homework-assistant-c00b9' });
  }
}

initAdmin();
const adminDb = getFirestore();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const {
      academyName,
      contactName,
      email,
      phone,
      bizRegNumber,
      planId,
      planName,
      teacherCount = 1,
    } = body || {};

    if (!academyName || !contactName || !email) {
      return res.status(400).json({ error: 'Missing required fields (academyName, contactName, email)' });
    }

    // Determine unit pricing based on planId
    let unitPrice = 49000;
    if (planId === 'medium' || teacherCount >= 3) unitPrice = 39000;
    if (planId === 'large' || teacherCount >= 6) unitPrice = 29000;

    const totalAmount = unitPrice * Math.max(1, Number(teacherCount));
    const invoiceId = `INV-${Date.now().toString().slice(-6)}`;

    const bankInfo = {
      bankName: 'Shinhan Bank (신한은행)',
      accountNumber: '110-524-889012',
      accountHolder: '(주)체키AI (Chekki AI Inc.)',
    };

    const invoicePayload = {
      invoiceId,
      academyName: String(academyName).trim(),
      contactName: String(contactName).trim(),
      email: String(email).trim().toLowerCase(),
      phone: String(phone || '').trim(),
      bizRegNumber: String(bizRegNumber || '').trim(),
      planId: planId || 'small',
      planName: planName || 'Small Academy Plan',
      teacherCount: Math.max(1, Number(teacherCount)),
      unitPrice,
      totalAmount,
      status: 'pending_payment',
      bankInfo,
      createdAt: new Date().toISOString(),
    };

    // Store in Firestore school_invoices collection
    await adminDb.collection('school_invoices').doc(invoiceId).set(invoicePayload);

    return res.status(200).json({
      success: true,
      message: 'Invoice request created successfully',
      invoice: invoicePayload,
    });
  } catch (err: any) {
    console.error('[request-school-invoice] Error:', err);
    return res.status(500).json({ error: err?.message || 'Internal server error' });
  }
}
