
import { dbInstance } from '../services/database';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const { event, properties, userId, anonymousId } = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

    // Strict PII Filter: Ensure no names or emails are ever logged in the events stream
    const safeProperties = { ...properties };
    delete safeProperties.email;
    delete safeProperties.name;

    await addDoc(collection(dbInstance, "events"), {
      event,
      properties: safeProperties,
      userId: userId || null,
      anonymousId: anonymousId || null,
      timestamp: serverTimestamp(),
      userAgent: req.headers['user-agent'],
      platform: req.headers['sec-ch-ua-platform'] || 'unknown'
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: "LOGGING_FAILED" });
  }
}
