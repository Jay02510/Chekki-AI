import { verifyAuth } from '../utils/auth';

export const config = {
  maxDuration: 10,
};

export default async function handler(req: any, res: any) {
  const allowedOrigins = [
    'capacitor://localhost',
    'http://localhost',
    'https://chekki-ai.vercel.app',
  ];

  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });

  try {
    await verifyAuth(req);
    return res.status(200).json({
      success: true,
      message: 'FEEDBACK_SUBMITTED',
    });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED' || error.message === 'INVALID_TOKEN') {
      return res.status(401).json({ error: error.message });
    }
    return res.status(500).json({ error: 'INTERNAL_SERVER_ERROR' });
  }
}
