import type { VercelRequest, VercelResponse } from '@vercel/node';

// Single source of truth for allowed origins. Previously each api/*.ts file
// hand-copied its own list and they drifted apart — 8 endpoints were
// missing 'capacitor://localhost'/'http://localhost', even though the
// native iOS/Android app bundles call those endpoints directly (confirmed
// via grep on the shipped app bundles), so Capacitor WebView requests to
// those 8 endpoints were getting the wrong Access-Control-Allow-Origin.
const ALLOWED_ORIGINS = [
  'capacitor://localhost',
  'http://localhost',
  'https://chekkiai.com',
  'https://www.chekkiai.com',
  'http://localhost:5173',
  'http://localhost:3000',
];

export function applyCors(
  req: VercelRequest,
  res: VercelResponse,
  opts?: { methods?: string; headers?: string }
): string {
  const origin = req.headers.origin as string | undefined;
  const corsOrigin = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];

  res.setHeader('Access-Control-Allow-Origin', corsOrigin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', opts?.methods || 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', opts?.headers || 'Content-Type, Authorization');

  return corsOrigin;
}
