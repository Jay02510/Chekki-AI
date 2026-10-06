import { adminAuth } from './firebaseAdmin.js';
import { sendEmail, emailLayout, emailButton } from './email.js';

/**
 * Claims that hand over a school purely because the caller's email matches
 * schools.ownerEmail must only trust a verified email — email/password
 * signup sets the address without proving the caller owns it. Reads the Auth
 * record, not the ID token, so a link clicked a minute ago counts without
 * waiting for the token to refresh.
 */
export async function isEmailVerified(uid: string): Promise<boolean> {
  const record = await adminAuth.getUser(uid);
  return record.emailVerified === true;
}

export async function sendVerificationEmail(email: string): Promise<boolean> {
  const link = await adminAuth.generateEmailVerificationLink(email, { url: 'https://www.chekkiai.com/teacher' });
  return sendEmail({
    to: email,
    subject: '[Chekki AI] 이메일 인증 후 원장님 계정이 연결됩니다',
    html: emailLayout(`
      <p style="font-size: 15px; color: #e4e4e7;">결제하신 학원 계정을 연결하려면 이메일 인증이 필요합니다.</p>
      <p style="font-size: 14px; color: #a1a1aa; line-height: 1.6;">아래 버튼을 눌러 인증한 뒤 Chekki 페이지를 새로고침하면 원장님 계정이 자동으로 연결됩니다.</p>
      ${emailButton(link, '이메일 인증하기')}
      <p style="font-size: 12px; color: #71717a; text-align: center;">Verify your email, then reload Chekki to connect your academy.</p>
    `),
  });
}

export const VERIFY_EMAIL_MESSAGE =
  'Please verify your email to connect your academy — we just sent a verification link. 이메일로 보낸 인증 링크를 눌러주세요.';
