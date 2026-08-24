import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withSentry } from './_lib/withSentry.js';
import { adminDb } from './_lib/firebaseAdmin.js';
import { applyCors } from './_lib/cors.js';
import { createRateLimiter, clientIp } from './_lib/rateLimit.js';
import { computeInvoicePricing } from './_lib/invoicePricing.js';

// This endpoint is public/unauthenticated (a sales lead form) and triggers a
// real Resend email per call — rate limit hard so it can't be used to spam
// arbitrary inboxes or run up the Resend bill.
const checkInvoiceLimit = createRateLimiter('invoice', 3, 3600);

// Public, unauthenticated input goes straight into HTML emails below (both
// the customer confirmation and the internal support notification) — must
// be escaped so a submitted `<script>`/`<a href=...>` can't inject arbitrary
// HTML/links into an email that looks like it came from Chekki AI (Audit:
// unescaped user input in HTML email templates). Also bounded to reasonable
// lengths since the only prior validation was presence, not size.
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function clamp(value: string, maxLen: number): string {
  return value.slice(0, maxLen);
}

async function handler(req: VercelRequest, res: VercelResponse) {
  applyCors(req, res);

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  {
    const { success } = await checkInvoiceLimit(clientIp(req));
    if (!success) {
      return res.status(429).json({ error: 'Too many requests. Try again later.' });
    }
  }

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
      // Present only when an already-onboarded director requests extra seats
      // from their own portal (vs. a fresh pre-signup sales lead). Lets
      // whoever reviews the resulting school_invoices doc apply the seats to
      // this existing school (via admin.ts upgrade_school) instead of
      // mistaking it for a brand-new academy signup.
      schoolId,
    } = body || {};

    if (!academyName || !contactName || !email) {
      return res.status(400).json({ error: 'Missing required fields (academyName, contactName, email)' });
    }
    if (
      String(academyName).length > 200 ||
      String(contactName).length > 100 ||
      String(email).length > 200 ||
      String(phone || '').length > 30 ||
      String(bizRegNumber || '').length > 50
    ) {
      return res.status(400).json({ error: 'One or more fields exceed the maximum allowed length.' });
    }

    const { unitPrice, totalAmount } = computeInvoicePricing(planId, teacherCount, billingCycle);
    const isTrial = planId === 'trial';
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
      // 'small' isn't a real plan id in pricingTiers.ts's catalog
      // (trial/solo/starter/school_pro/enterprise) — computeInvoicePricing
      // above already silently falls back to 'starter' pricing for an
      // unrecognized id, but this stored planId fed confirm_invoice's
      // seatsForPlan() untouched, which has its OWN separate fallback to
      // the trial tier (1 FT/1 KT). A ₩-charged starter-tier invoice with
      // no planId sent (e.g. SchoolsLandingPage's consultation form) was
      // silently activated at trial seat counts. Match computeInvoicePricing's
      // own fallback so the stored id and the applied price never diverge.
      planId: planId || 'starter',
      planName: planName || 'Starter Plan',
      teacherCount: Math.max(1, Number(teacherCount)),
      studentCount: String(studentCount || '').trim(),
      unitPrice,
      totalAmount,
      status: 'pending_payment',
      bankInfo,
      createdAt: new Date().toISOString(),
      // Informational only — this is an unauthenticated public endpoint, so
      // schoolId here is never verified to belong to the requester.
      // confirm_invoice (api/admin.ts) correctly ignores this field and
      // always mints its own schoolId; do not wire this value into any
      // future authorization or upgrade decision without first verifying
      // requester ownership of the school (audit: Low finding).
      ...(schoolId ? { schoolId: String(schoolId).trim() } : {}),
    };

    // Store in Firestore school_invoices collection. This write must succeed —
    // confirm_invoice (api/admin.ts) looks the invoice up by this doc ID later,
    // and there's no other record of the request. Swallowing a failure here
    // used to mean the customer got a payment email for an invoice that was
    // never actually persisted, so confirm_invoice would 404 once they paid
    // (Audit: silent invoice write failure).
    await adminDb.collection('school_invoices').doc(invoiceId).set(invoicePayload);

    // Escaped variants for HTML interpolation only — invoicePayload itself
    // stays raw for Firestore storage and admin-panel display.
    const safeAcademyName = escapeHtml(invoicePayload.academyName);
    const safeContactName = escapeHtml(invoicePayload.contactName);
    const safeEmail = escapeHtml(invoicePayload.email);
    const safePhone = escapeHtml(invoicePayload.phone);

    // Send automated email via Resend
    const resendApiKey = process.env.RESEND_API_KEY;
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
                
                <p style="font-size: 15px; color: #e4e4e7;">안녕하세요 <strong>${safeContactName}</strong> 님,</p>
                <p style="font-size: 14px; color: #a1a1aa; line-height: 1.6;">
                  <strong>${safeAcademyName}</strong>의 Chekki AI 학원 구독 신청이 성공적으로 접수되었습니다.<br/>
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

      // Internal notification — the customer confirmation above was the only
      // email this endpoint sent, so a new invoice request sat silently in
      // school_invoices with nobody on our side pinged to go confirm it
      // once the bank transfer actually lands.
      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Chekki AI <billing@chekkiai.com>',
            to: ['support@chekkiai.com'],
            subject: `[Invoice Request] ${invoicePayload.academyName} — ₩${totalAmount.toLocaleString()} (${invoiceId})`,
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 16px;">
                <p>New school invoice request pending payment.</p>
                <table style="border-collapse: collapse; font-size: 14px;">
                  <tr><td style="padding: 4px 12px 4px 0; color: #666;">Invoice ID</td><td><strong>${invoiceId}</strong></td></tr>
                  <tr><td style="padding: 4px 12px 4px 0; color: #666;">Academy</td><td>${safeAcademyName}</td></tr>
                  <tr><td style="padding: 4px 12px 4px 0; color: #666;">Contact</td><td>${safeContactName} (${safeEmail}${safePhone ? `, ${safePhone}` : ''})</td></tr>
                  <tr><td style="padding: 4px 12px 4px 0; color: #666;">Plan</td><td>${invoicePayload.planName} · ${invoicePayload.teacherCount} teacher(s) · ${billingCycle === 'yearly' ? 'yearly' : 'monthly'}</td></tr>
                  <tr><td style="padding: 4px 12px 4px 0; color: #666;">Total</td><td><strong>₩${totalAmount.toLocaleString()}</strong></td></tr>
                </table>
                <p style="color: #666; font-size: 13px;">Confirm via admin panel once the bank transfer is received.</p>
              </div>
            `,
          }),
        });
      } catch (internalEmailErr) {
        console.error('[request-school-invoice] Failed to send internal notification email:', internalEmailErr);
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Invoice request created successfully',
      invoice: invoicePayload,
    });
  } catch (err: any) {
    console.error('[request-school-invoice] Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export default withSentry(handler);
