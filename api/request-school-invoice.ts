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
      studentCount = '',
      billingCycle = 'monthly',
    } = body || {};

    if (!academyName || !contactName || !email) {
      return res.status(400).json({ error: 'Missing required fields (academyName, contactName, email)' });
    }

    let unitPrice = 49000;
    let actualSeats = Math.max(1, Number(teacherCount));
    let isTrial = planId === 'trial';

    if (isTrial) {
      unitPrice = 0;
      actualSeats = 1;
    } else if (planId === 'freelancer') {
      unitPrice = 35000;
      actualSeats = 1;
    } else if (planId === 'small') {
      unitPrice = 49000;
      actualSeats = Math.min(2, Math.max(1, actualSeats));
    } else if (planId === 'medium') {
      unitPrice = 39000;
      actualSeats = Math.max(3, actualSeats);
    } else if (planId === 'large') {
      unitPrice = 29000;
      actualSeats = Math.max(6, actualSeats);
    } else {
      if (actualSeats >= 6) unitPrice = 29000;
      else if (actualSeats >= 3) unitPrice = 39000;
      else unitPrice = 49000;
    }

    const months = billingCycle === 'yearly' ? 12 : 1;
    const discountMultiplier = billingCycle === 'yearly' ? 0.8 : 1.0; // 20% discount on yearly
    const totalAmount = isTrial ? 0 : Math.round(unitPrice * actualSeats * months * discountMultiplier);
    const invoiceId = isTrial ? `TRIAL-${Date.now().toString().slice(-6)}` : `INV-${Date.now().toString().slice(-6)}`;

    const bankInfo = {
      bankName: 'Shinhan Bank (신한은행)',
      accountNumber: '110-623-147138',
      accountHolder: 'BENJAMIN JASON',
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
      studentCount: String(studentCount || '').trim(),
      unitPrice,
      totalAmount,
      status: 'pending_payment',
      bankInfo,
      createdAt: new Date().toISOString(),
    };

    // Store in Firestore school_invoices collection
    await adminDb.collection('school_invoices').doc(invoiceId).set(invoicePayload);

    // Send automated email via Resend
    const resendApiKey = process.env.RESEND_API_KEY || 're_M5DhPwyN_JpZFiMpUAt2sZoWd27zSKVfN';
    if (resendApiKey) {
      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Chekki AI <billing@chekkiai.com>',
            to: [invoicePayload.email],
            subject: `[Chekki AI] ${invoicePayload.academyName} - 학원 결제 요청 안내 (${invoiceId})`,
            html: `
              <div style="font-family: 'Apple SD Gothic Neo', sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background-color: #030305; color: #f4f4f5; border-radius: 16px;">
                <div style="text-align: center; margin-bottom: 24px;">
                  <h1 style="font-size: 28px; font-weight: 900; margin: 0; color: #ffffff;">Chekki<span style="color: #f97316;">ai</span></h1>
                  <p style="font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #a1a1aa; margin-top: 4px;">교육기관용 수강 청구서</p>
                </div>
                
                <p style="font-size: 15px; color: #e4e4e7;">안녕하세요 <strong>${invoicePayload.contactName}</strong> 님,</p>
                <p style="font-size: 14px; color: #a1a1aa; line-height: 1.6;">
                  <strong>${invoicePayload.academyName}</strong>의 Chekki AI 학원 구독 신청이 성공적으로 접수되었습니다.<br/>
                  아래 계좌로 수강료를 입금해 주시면, 확인 후 24시간 이내에 교사 인증 코드가 활성화됩니다.
                </p>

                <div style="background-color: #18181b; border: 1px solid #27272a; border-radius: 12px; padding: 16px; margin: 20px 0;">
                  <table style="width: 100%; font-size: 14px; color: #d4d4d8; border-collapse: collapse;">
                    <tr><td style="padding: 6px 0; color: #71717a;">청구서 번호</td><td style="text-align: right; font-weight: bold; color: #f97316;">${invoiceId}</td></tr>
                    <tr><td style="padding: 6px 0; color: #71717a;">선택 플랜</td><td style="text-align: right; font-weight: bold;">${invoicePayload.planName}</td></tr>
                    <tr><td style="padding: 6px 0; color: #71717a;">등록 강사 수</td><td style="text-align: right; font-weight: bold;">${invoicePayload.teacherCount}명</td></tr>
                    <tr><td style="padding: 6px 0; color: #71717a;">결제 주기</td><td style="text-align: right; font-weight: bold;">${billingCycle === 'yearly' ? '연간 결제 (20% 할인 반영)' : '월간 결제'}</td></tr>
                    <tr style="border-top: 1px solid #27272a;"><td style="padding: 10px 0 0 0; font-weight: bold; color: #ffffff;">총 결제 금액</td><td style="padding: 10px 0 0 0; text-align: right; font-size: 18px; font-weight: 900; color: #34d399;">₩${totalAmount.toLocaleString()}원</td></tr>
                  </table>
                </div>

                <div style="background-color: rgba(249, 115, 22, 0.1); border: 1px solid rgba(249, 115, 22, 0.3); border-radius: 12px; padding: 16px; margin-bottom: 24px;">
                  <p style="font-size: 12px; font-weight: bold; color: #fb923c; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 1px;">🏦 입금 계좌 정보</p>
                  <p style="margin: 4px 0; font-size: 14px; color: #ffffff;">은행: <strong>신한은행 (Shinhan Bank)</strong></p>
                  <p style="margin: 4px 0; font-size: 14px; color: #ffffff;">예금주: <strong>BENJAMIN JASON</strong></p>
                  <p style="margin: 8px 0 0 0; font-size: 20px; font-weight: 900; color: #ffffff; letter-spacing: 1px;">110-623-147138</p>
                </div>

                <p style="font-size: 12px; color: #71717a; text-align: center; margin-top: 24px;">
                  문의 사항이 있으시면 <a href="mailto:support@chekkiai.com" style="color: #f97316;">support@chekkiai.com</a> 로 연락해 주세요.<br/>
                  © 2026 Chekki AI Inc.
                </p>
              </div>
            `,
          }),
        });
      } catch (emailErr) {
        console.error('[request-school-invoice] Failed to send email via Resend:', emailErr);
      }
    }

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
