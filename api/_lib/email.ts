// Single Resend sender for every api/*.ts email. fetch doesn't throw on a
// non-2xx, so a rejected send (bad key, unverified domain) has to be checked
// explicitly — returns false instead of letting callers report a send that
// never happened.
const DEFAULT_FROM = 'Chekki AI <billing@chekkiai.com>';

export function isEmailConfigured(): boolean {
  return !!process.env.RESEND_API_KEY;
}

export async function sendEmail(opts: { to: string; subject: string; html: string; from?: string }): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return false;
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: opts.from || DEFAULT_FROM, to: [opts.to], subject: opts.subject, html: opts.html }),
    });
    if (!response.ok) {
      const body = await response.text().catch(() => '');
      console.error('[email] Resend rejected the request:', response.status, body, opts.to);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[email] Resend request failed:', opts.to, err);
    return false;
  }
}

export function escapeHtml(value: string): string {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Shared shell for the cream, centered card every Chekki email uses (brand tokens in tokens.css).
export function emailLayout(bodyHtml: string): string {
  return `
    <div style="font-family: 'Apple SD Gothic Neo', sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background-color: #fbf6ee; color: #2b211a; border-radius: 16px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="font-size: 28px; font-weight: 900; margin: 0; color: #2b211a;">Chekki<span style="color: #a84d06;">AI</span></h1>
      </div>
      ${bodyHtml}
      <p style="font-size: 12px; color: #76665a; text-align: center; margin-top: 24px;">
        문의 사항이 있으시면 <a href="mailto:support@chekkiai.com" style="color: #a84d06;">support@chekkiai.com</a> 로 연락해 주세요.
      </p>
    </div>
  `;
}

export function emailButton(href: string, label: string): string {
  return `<div style="text-align: center; margin: 24px 0;"><a href="${href}" style="display: inline-block; background-color: #ef7c1c; color: #2b211a; font-weight: 900; padding: 14px 28px; border-radius: 12px; text-decoration: none;">${label}</a></div>`;
}
