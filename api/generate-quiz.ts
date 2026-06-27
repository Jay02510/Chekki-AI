import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Type } from '@google/genai';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';

// ─── Vercel Config ────────────────────────────────────────────────────────────
export const config = {
  maxDuration: 60,
  api: {
    bodyParser: {
      sizeLimit: '256kb',
    },
  },
};

// ─── Upstash Rate Limiting ───────────────────────────────────────────────────
const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
const redis = redisUrl && redisToken ? new Redis({ url: redisUrl, token: redisToken }) : null;

// Pro users: max 5 quiz generations per minute (burst protection)
const ratelimit = redis
  ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(5, '60 s'), analytics: true })
  : null;

// ─── Firebase Admin ──────────────────────────────────────────────────────────
function getAdminApp() {
  if (getApps().length > 0) return getApps()[0];
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (serviceAccount) {
    try {
      const cleaned = serviceAccount.trim().replace(/\n/g, '').replace(/\r/g, '');
      return initializeApp({ credential: cert(JSON.parse(cleaned)) });
    } catch {
      return initializeApp({ projectId: 'homework-assistant-c00b9' });
    }
  }
  return initializeApp({ projectId: 'homework-assistant-c00b9' });
}

// ─── Gemini Setup ─────────────────────────────────────────────────────────────
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

// ─── Quiz Output Schema ───────────────────────────────────────────────────────
const QUIZ_SCHEMA = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      question:        { type: Type.STRING, description: 'The original question or prompt.' },
      correct_answer:  { type: Type.STRING, description: 'The correct answer.' },
      distractors:     {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: 'Exactly 3 plausible but incorrect answers for multiple-choice.',
      },
      explanation_ko:  { type: Type.STRING, description: 'A simple Korean explanation of why the correct answer is right (1-2 sentences, parent-friendly).' },
    },
    required: ['question', 'correct_answer', 'distractors', 'explanation_ko'],
  },
};

// ─── Monthly quota check ──────────────────────────────────────────────────────
const MONTHLY_QUIZ_LIMIT = 50; // Pro users: 50 quiz generations per calendar month

async function checkMonthlyQuota(db: FirebaseFirestore.Firestore, userId: string): Promise<boolean> {
  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const quotaRef = db.collection('quiz_quotas').doc(`${userId}_${monthKey}`);
  const quotaDoc = await quotaRef.get();

  if (!quotaDoc.exists) {
    await quotaRef.set({ count: 1, userId, month: monthKey, createdAt: FieldValue.serverTimestamp() });
    return true; // Within quota
  }

  const count = quotaDoc.data()?.count ?? 0;
  if (count >= MONTHLY_QUIZ_LIMIT) return false; // Exceeded

  await quotaRef.update({ count: FieldValue.increment(1) });
  return true;
}

// ─── Main Handler ─────────────────────────────────────────────────────────────
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // ── 1. Auth ────────────────────────────────────────────────────────────────
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'UNAUTHORIZED: Missing authorization header' });
  }
  const idToken = authHeader.split('Bearer ')[1].trim();

  const app = getAdminApp();
  const adminAuth = getAuth(app);

  let decodedToken: any;
  try {
    decodedToken = await adminAuth.verifyIdToken(idToken);
  } catch {
    return res.status(401).json({ error: 'UNAUTHORIZED: Invalid or expired token' });
  }
  const userId = decodedToken.uid;

  // ── 2. Pro Plan Check ──────────────────────────────────────────────────────
  const db = getFirestore(app);
  const userDoc = await db.collection('users').doc(userId).get();
  const userPlan = userDoc.data()?.plan ?? 'free';

  if (userPlan !== 'pro') {
    return res.status(403).json({
      error: 'FORBIDDEN',
      message: 'Interactive Quizzes are a Pro feature. Please upgrade to access.',
    });
  }

  // ── 3. Rate Limiting ───────────────────────────────────────────────────────
  if (ratelimit) {
    const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'anonymous';
    const ipString = Array.isArray(ip) ? ip[0] : ip;
    const identifier = `quiz_${userId || ipString}`;
    const { success, limit, reset, remaining } = await ratelimit.limit(identifier);

    res.setHeader('X-RateLimit-Limit', limit.toString());
    res.setHeader('X-RateLimit-Remaining', remaining.toString());
    res.setHeader('X-RateLimit-Reset', reset.toString());

    if (!success) {
      return res.status(429).json({
        error: 'Too Many Requests',
        message: 'You are generating quizzes too quickly. Please wait a moment.',
      });
    }
  }

  // ── 4. Monthly Quota ───────────────────────────────────────────────────────
  const withinQuota = await checkMonthlyQuota(db, userId);
  if (!withinQuota) {
    return res.status(429).json({
      error: 'MONTHLY_QUOTA_EXCEEDED',
      message: `You have reached the ${MONTHLY_QUIZ_LIMIT} quiz limit for this month. Your quota resets on the 1st.`,
    });
  }

  // ── 5. Validate Input ──────────────────────────────────────────────────────
  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  const mistakes: Array<{ question_text?: string; correct_answer?: string }> = body?.mistakes ?? [];
  const language: string = body?.language ?? 'ko';

  // Filter to only valid entries
  const validMistakes = (Array.isArray(mistakes) ? mistakes : [])
    .slice(0, 10)
    .filter((m) => m.question_text && m.correct_answer);

  // We always need at least 1 valid mistake OR we generate a starter quiz from scratch
  const TARGET_QUIZ_SIZE = 5;
  const needsPadding = validMistakes.length < 3;
  const paddingNeeded = Math.max(0, TARGET_QUIZ_SIZE - validMistakes.length);

  // ── 6. Generate Quiz via Gemini ────────────────────────────────────────────
  const mistakesList = validMistakes.length > 0
    ? validMistakes.map((m, i) => `${i + 1}. Question: "${m.question_text}" | Correct Answer: "${m.correct_answer}"`).join('\n')
    : '(no mistakes provided yet)';

  const paddingInstruction = needsPadding
    ? `\n\nIMPORTANT: The child only has ${validMistakes.length} mistake(s) saved so far. To make a complete quiz, please ADD ${paddingNeeded} additional practice questions that are SIMILAR in style and topic (common English grammar mistakes for Korean kids in grades 1-3: subject-verb agreement, pronouns, verb tenses). Format these additional items the same way as the provided mistakes.`
    : '';

  const prompt = `You are a friendly English teacher for Korean elementary school kids.
You are given a list of mistakes a child made on their homework.
For EACH item, generate exactly 3 plausible but wrong distractors (they must sound believable to a child).
Also provide a short, warm explanation in Korean (1-2 sentences, no academic jargon) of why the correct answer is right.
Return ONLY valid JSON matching the schema — a single array with ALL items (real mistakes + any supplemental ones). No extra text.

Mistakes:
${mistakesList}${paddingInstruction}`;

  try {
    const result = await genAI.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        responseMimeType: 'application/json',
        responseSchema: QUIZ_SCHEMA,
        temperature: 0.7,
      },
    });

    const raw = result.text ?? '[]';
    let quizItems: any[];
    try {
      quizItems = JSON.parse(raw);
    } catch {
      return res.status(500).json({ error: 'PARSE_ERROR', message: 'Failed to parse quiz from AI response.' });
    }

    // Shuffle the answer options so the correct answer isn't always first
    const shuffled = quizItems.map((item) => {
      const options = [item.correct_answer, ...item.distractors].sort(() => Math.random() - 0.5);
      return { ...item, options };
    });

    return res.status(200).json({ quiz: shuffled, language });
  } catch (err: any) {
    console.error('[generate-quiz] Gemini error:', err.message);
    return res.status(500).json({ error: 'GEMINI_ERROR', message: 'Failed to generate quiz. Please try again.' });
  }
}
