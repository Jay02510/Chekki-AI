import type { VercelRequest, VercelResponse } from '@vercel/node';

// STUB — Web payment validation (e.g., future PortOne or Stripe) will be implemented post-launch
export default async function handler(req: VercelRequest, res: VercelResponse) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    return res.status(200).json({
        success: false,
        status: 'not_implemented',
        message: 'Web payment validation is not yet available. Please subscribe via the mobile app.',
    });
}
