import { withSentry } from './_lib/withSentry.js';
import { FieldValue, type DocumentReference } from 'firebase-admin/firestore';
import crypto from 'crypto';
import { adminDb, adminAuth as adminAuthClient } from './_lib/firebaseAdmin.js';
import { applyCors } from './_lib/cors.js';
import { createRateLimiter, clientIp } from './_lib/rateLimit.js';
import { reserveCounter, releaseCounter } from './_lib/usageQuota.js';
import { claimIdempotencyKey, settleIdempotencyKey } from './_lib/idempotency.js';
import { createGenAI, MOCK_GEMINI } from './_lib/analyze/gemini.js';
import { handleGenerateReportTask } from './_lib/analyze/staffReports.js';
import { handleVoiceLogFillTask } from './_lib/analyze/voiceLogFill.js';
import { handleCurriculumOcr } from './_lib/analyze/curriculumOcr.js';
import { handleGenerate, handleRefine, handleGenerateWorksheet } from './_lib/analyze/practice.js';
import { handleAskQuestion } from './_lib/analyze/askQuestion.js';
import { handleScan } from './_lib/analyze/scan.js';
import type { TaskContext } from './_lib/analyze/context.js';

// Korea's date for daily quotas; must match src/utils/localDate.ts kstDate.
const kstDate = () => new Date(Date.now() + 9 * 3_600_000).toISOString().slice(0, 10);

// Staff report drafting/voice fill: generous for a real teacher's day, a
// ceiling on anyone scripting it.
const checkStaffAiDailyLimit = createRateLimiter('staff_ai_daily', 300, 86400);

export const config = {
  maxDuration: 300,
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

// 10 requests per 10 seconds per uid (or IP when signed out).
const checkAnalyzeLimit = createRateLimiter('analyze', 10, 10);

if (!process.env.GOOGLE_CLOUD_PROJECT && !process.env.FIRESTORE_EMULATOR_HOST) {
  process.env.GOOGLE_CLOUD_PROJECT = 'homework-assistant-c00b9';
}

// Quota reservations made during this request, given back if it fails.
type Refund = () => Promise<void>;

// Work the handler leaves for after it returns, once res.statusCode is final.
interface HandlerContext {
  refunds: Refund[];
  idempotencyRef: DocumentReference | null;
  responseBody: unknown;
}

async function handler(req: any, res: any, ctx: HandlerContext) {
  const adminAuth = adminAuthClient;

  applyCors(req, res, { headers: 'Content-Type, Authorization, X-Idempotency-Key' });

  // Handle preflight
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // --- SECURITY: Verify Firebase ID Token ---
  const authHeader = req.headers.authorization;
  let body: any;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch {
    return res.status(400).json({ error: 'INVALID_JSON' });
  }
  const task = body?.task;

  // ask_question allows anonymous/no-auth access (guest detection is done via Firestore lookup below)
  const requiresAuth = task !== 'ask_question';

  // Track whether Firebase Admin is functional (requires FIREBASE_SERVICE_ACCOUNT env var)
  // (or the Firestore emulator, which needs no credentials — see .env.e2e)
  let firebaseAdminAvailable =
    !!process.env.FIREBASE_SERVICE_ACCOUNT || !!process.env.FIRESTORE_EMULATOR_HOST;

  let decodedToken: any = null;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const idToken = authHeader.split('Bearer ')[1].trim();
    if (idToken) {
      try {
        decodedToken = await adminAuth.verifyIdToken(idToken);
      } catch (err: any) {
        // CRITICAL FIX: If FIREBASE_SERVICE_ACCOUNT is missing, verifyIdToken() will throw
        // a credential error (NOT an invalid token error). We must distinguish between:
        //   (a) A genuinely invalid/expired user token → return 401
        //   (b) A server-side credential misconfiguration → log warning and degrade gracefully
        const isCredentialError =
          err.code === 'app/invalid-credential' ||
          err.message?.includes('credential') ||
          err.message?.includes('UNAUTHENTICATED') ||
          err.message?.includes('Could not load') ||
          err.message?.includes('service account');

        if (isCredentialError) {
          console.error(
            '[analyze.ts] Firebase Admin credential error — FIREBASE_SERVICE_ACCOUNT may be missing from Vercel env vars.',
            err.message
          );
          firebaseAdminAvailable = false;
          // Fail closed for anything that requires auth: a broken service
          // account must never be treated as "let the request through
          // unverified", since that used to let a client-supplied plan
          // (see userData fallback below) bypass paid-tier quota checks.
          if (requiresAuth) {
            return res.status(503).json({ error: 'Service temporarily unavailable' });
          }
        } else {
          console.error('[analyze.ts] Token Verification Failed (invalid token):', err.message);
          if (requiresAuth) {
            return res.status(401).json({ error: 'UNAUTHORIZED: Invalid or expired token' });
          }
        }
        // For ask_question, or credential errors, continue without a verified token
      }
    }
  } else if (requiresAuth) {
    return res.status(401).json({ error: 'UNAUTHORIZED: Missing authorization header' });
  }
  // --- END SECURITY CHECK ---

  // --- RATE LIMITING ---
  const ipString = clientIp(req);
  const identifier = decodedToken?.uid || ipString;
  {
    const { success, limit, reset, remaining } = await checkAnalyzeLimit(identifier);
    res.setHeader('X-RateLimit-Limit', limit.toString());
    res.setHeader('X-RateLimit-Remaining', remaining.toString());
    res.setHeader('X-RateLimit-Reset', reset.toString());
    if (!success) {
      console.warn(`[analyze.ts] Rate limit exceeded for identifier: ${identifier}`);
      return res.status(429).json({
        error: 'Too Many Requests',
        message: 'You have exceeded the rate limit. Please try again later.',
      });
    }
  }
  // --- END RATE LIMITING ---

  // Staff-only text tasks skip the OCR idempotency/scan-quota path below.
  // They used to accept any signed-in account — including anonymous guest
  // sessions — as free, unmetered Gemini access.
  if (task === 'generate_report' || task === 'voice_log_fill') {
    const callerSnap = await adminDb.collection('users').doc(decodedToken.uid).get();
    const callerRole = callerSnap.data()?.role;
    if (callerRole !== 'teacher' && callerRole !== 'director') {
      return res.status(403).json({ error: 'STAFF_ONLY' });
    }
    const { success: underDailyCap } = await checkStaffAiDailyLimit(decodedToken.uid);
    if (!underDailyCap) {
      return res.status(429).json({ error: 'DAILY_LIMIT_REACHED' });
    }
    return task === 'generate_report'
      ? handleGenerateReportTask(res, body)
      : handleVoiceLogFillTask(res, body);
  }

  // --- IDEMPOTENCY KEY CHECK ---
  const rawIdempotencyKey = req.headers['x-idempotency-key'] || req.headers['X-Idempotency-Key'];
  const idempotencyKey = typeof rawIdempotencyKey === 'string' ? rawIdempotencyKey.trim() : null;

  if (idempotencyKey && firebaseAdminAvailable && decodedToken) {
    try {
      const idempotencyRef = adminDb.collection('idempotency_keys').doc(idempotencyKey);
      // Poll a running duplicate for up to ~15s before telling the client
      // to come back.
      let decision = await claimIdempotencyKey(adminDb, idempotencyRef, decodedToken.uid, task);
      for (let attempt = 0; decision.kind === 'busy' && attempt < 10; attempt++) {
        await new Promise((resolve) => setTimeout(resolve, 1500));
        decision = await claimIdempotencyKey(adminDb, idempotencyRef, decodedToken.uid, task);
      }

      if (decision.kind === 'cached') return res.status(200).json(decision.response);
      if (decision.kind === 'busy') {
        res.setHeader('Retry-After', '2');
        return res.status(202).json({
          retry_after: 2,
          message: 'Analysis is in progress, please retry shortly.',
        });
      }
      if (decision.kind === 'claim') {
        // Record the response body; handlerWithRefunds settles the key once
        // this handler has finished.
        ctx.idempotencyRef = idempotencyRef;
        const originalJson = res.json.bind(res);
        res.json = (bodyData: any) => {
          ctx.responseBody = bodyData;
          return originalJson(bodyData);
        };
      }
    } catch (idempotencyErr) {
      console.warn(
        '⚠️ [idempotency] Failed to perform initial idempotency checks. Degrading gracefully:',
        idempotencyErr
      );
    }
  }

  try {
    const {
      task: _task,
      image,
      originalItems,
      userPlan: clientPlan,
      childAge,
      childEnglishLevel,
      parentEnglishLevel,
      language = 'ko',
    } = body;

    // --- SECURITY: Fetch Real User Data ---
    // Plan always defaults to 'free' regardless of what the client sends —
    // clientPlan is read above for logging/back-compat only, never trusted
    // for quota enforcement (a client could otherwise self-report 'pro').
    let userData: any = {
      plan: 'free',
      scansUsedToday: 0,
      maxScansPerDay: 2,
      lastScanDate: '',
      questionsUsedToday: 0,
      maxQuestionsPerDay: 5,
      lastQuestionDate: '',
      generatesUsedToday: 0,
      maxGeneratesPerDay: 5,
      lastGenerateDate: '',
    };
    let userRef: any = null;
    let userSnap: any = null;

    if (decodedToken && firebaseAdminAvailable) {
      try {
        const db = adminDb;
        userRef = db.collection('users').doc(decodedToken.uid);
        userSnap = await userRef.get();
        if (userSnap.exists) {
          userData = userSnap.data();
        }
      } catch (dbError: any) {
        // Without the user doc there's no plan or quota to enforce — fail
        // closed rather than serve unmetered Gemini calls.
        console.error('[analyze.ts] Could not read user doc:', dbError?.message);
        return res.status(503).json({ error: 'Service temporarily unavailable' });
      }
    } else if (!firebaseAdminAvailable) {
      console.warn(
        '⚠️ [DEGRADED MODE] Firebase Admin unavailable — skipping Firestore user lookup. Trusting client-supplied plan.'
      );
    }

    // Check Scan Limits
    const realUserPlan = userData?.plan || 'free';
    const today = kstDate();
    const isNewDay = userData?.lastScanDate !== today;
    const currentScans = isNewDay ? 0 : userData?.scansUsedToday || 0;
    const maxScans = userData?.maxScansPerDay || 3;

    const isNewGenerateDay = userData?.lastGenerateDate !== today;
    const currentGenerates = isNewGenerateDay ? 0 : userData?.generatesUsedToday || 0;
    const maxGenerates = userData?.maxGeneratesPerDay || 5;

    // Reserve quota atomically BEFORE calling Gemini, in the server-only
    // usage/{uid} doc (see api/_lib/usageQuota.ts for why users/{uid} can't
    // be trusted for this). The users/{uid} counters are still bumped
    // below for the app's "scans left" display, and seed the floor so this
    // never grants more than the old counter would have.
    // Keyed by uid even when users/{uid} is missing — a signed-in account
    // with no user doc used to get unmetered scans (counters read as 0 and
    // the increments below only run when the doc exists).
    const usageRef = decodedToken ? adminDb.collection('usage').doc(decodedToken.uid) : null;
    const reserve = async (field: string, max: number, floor: number) => {
      const ok = await reserveCounter(adminDb, usageRef!, field, today, max, floor);
      if (ok) ctx.refunds.push(() => releaseCounter(adminDb, usageRef!, field, today));
      return ok;
    };
    const metered = !!usageRef && firebaseAdminAvailable && realUserPlan !== 'pro';
    if (metered) {
      try {
        if (!['generate', 'refine', 'generate_worksheet', 'ask_question'].includes(task)) {
          if (!(await reserve('scans', maxScans, currentScans))) {
            return res.status(403).json({ error: 'SCAN_LIMIT_REACHED' });
          }
        }
        if (['generate', 'refine', 'generate_worksheet'].includes(task)) {
          if (!(await reserve('generates', maxGenerates, currentGenerates))) {
            return res.status(403).json({ error: 'GENERATE_LIMIT_REACHED' });
          }
        }
      } catch (quotaErr: any) {
        console.error('[analyze.ts] Quota reservation failed:', quotaErr?.message);
        return res.status(503).json({ error: 'Service temporarily unavailable' });
      }
    }

    // Input Validation: Prevent Payload Bloat
    if (image && image.length > 10 * 1024 * 1024) {
      // 10MB Limit
      return res.status(413).json({ error: 'PAYLOAD_TOO_LARGE' });
    }

    // --- DETERMINISTIC IMAGE CACHE LOOKUP ---
    let cacheKey = '';
    const isAnalysisTask = !['generate', 'refine', 'generate_worksheet', 'ask_question'].includes(
      task
    );
    // Enrolled students are graded against their class's answer key, which
    // the cache key doesn't capture — don't serve or store them a shared,
    // ungrounded result.
    const isEnrolledStudent = !!(userData?.classId && userData?.classStatus === 'active');
    if (image && typeof image === 'string' && isAnalysisTask && !isEnrolledStudent) {
      try {
        const paramString = JSON.stringify({
          childAge: childAge || '',
          childEnglishLevel: childEnglishLevel || '',
          parentEnglishLevel: parentEnglishLevel || '',
          language: language || 'ko',
          plan: realUserPlan || 'free',
        });
        const imageSha256 = crypto.createHash('sha256').update(image).digest('hex');
        cacheKey = crypto
          .createHash('sha256')
          .update(imageSha256 + paramString)
          .digest('hex');

        if (firebaseAdminAvailable) {
          const db = adminDb;
          const cachedDoc = await db.collection('image_analyses_cache').doc(cacheKey).get();
          if (cachedDoc.exists) {
            const cachedData = cachedDoc.data();
            if (cachedData && cachedData.response) {
              console.log(
                `[cache] Deterministic image cache HIT for key: ${cacheKey}. Returning cached response.`
              );

              // Increment scans used today for non-pro users since they successfully got a scan
              if (userSnap && userSnap.exists && realUserPlan !== 'pro') {
                try {
                  await userRef.update({
                    scansUsedToday: isNewDay ? 1 : FieldValue.increment(1),
                    lastScanDate: today,
                  });
                } catch (dbLimitErr) {
                  console.warn(
                    '[cache] Failed to update user scans limit on cache hit:',
                    dbLimitErr
                  );
                }
              }

              return res.status(200).json(cachedData.response);
            }
          }
        }
      } catch (cacheReadErr) {
        console.warn(
          '⚠️ [cache] Failed to read from image cache. Proceeding to run live LLM:',
          cacheReadErr
        );
      }
    }

    if (!MOCK_GEMINI && !process.env.API_KEY)
      return res.status(500).json({ error: 'API_KEY_MISSING' });

    const ai = createGenAI();

    const mode = body?.mode;

    const taskCtx: TaskContext = {
      res,
      body,
      ai,
      task,
      mode,
      language,
      image,
      originalItems,
      childAge,
      childEnglishLevel,
      parentEnglishLevel,
      userData,
      userRef,
      userSnap,
      realUserPlan,
      today,
      isNewDay,
      isNewGenerateDay,
      decodedToken,
      ipString,
      firebaseAdminAvailable,
      metered,
      reserve,
      cacheKey,
    };

    // `return await` keeps a rejected task inside this try, so the catch below
    // still maps Gemini outages to AI_TEMPORARILY_UNAVAILABLE.
    if (mode === 'textbook_curriculum_ocr' || mode === 'syllabus_course_plan') {
      return await handleCurriculumOcr(taskCtx);
    }
    if (task === 'generate') return await handleGenerate(taskCtx);
    if (task === 'refine') return await handleRefine(taskCtx);
    if (task === 'generate_worksheet') return await handleGenerateWorksheet(taskCtx);
    if (task === 'ask_question') return await handleAskQuestion(taskCtx);
    return await handleScan(taskCtx);
  } catch (error: any) {
    console.error('[Backend Security Error]:', error);
    // Gemini rate-limited/overloaded (429 RESOURCE_EXHAUSTED, 503 UNAVAILABLE)
    // used to fall through to the generic ANALYSIS_FAILED path, and the
    // client showed "Analysis failed, retake the photo in better lighting" —
    // actively wrong advice for a transient API outage that has nothing to
    // do with the photo. Distinguish it so the client can show the right
    // message and let the user just retry shortly.
    const errText = `${error?.status || ''} ${error?.message || ''}`;
    const isTransient = /429|503|RESOURCE_EXHAUSTED|UNAVAILABLE|overloaded/i.test(errText);
    if (isTransient) {
      return res.status(503).json({
        error: 'AI_TEMPORARILY_UNAVAILABLE',
        details: 'The AI service is temporarily busy. Please try again in a moment.',
      });
    }
    // error.message is the AI provider's own rejection reason (bad/undecodable
    // image, unsupported mimeType, etc.) — surfacing it lets the client show
    // something more actionable than a bare "ANALYSIS_FAILED" code, without
    // leaking stack traces or internal details.
    return res.status(500).json({
      error: 'ANALYSIS_FAILED',
      details:
        typeof error?.message === 'string'
          ? error.message.slice(0, 300)
          : 'An unexpected error occurred during analysis.',
    });
  }
}

// The handler awaits all its work before resolving, so statusCode is final
// here, and this cleanup finishes before Vercel freezes the function.
async function handlerWithRefunds(req: any, res: any) {
  const ctx: HandlerContext = { refunds: [], idempotencyRef: null, responseBody: undefined };
  // A throw becomes a 500 in withSentry after this returns, so treat it as a
  // failure here: refund the quota and release the idempotency key.
  let threw = false;
  try {
    await handler(req, res, ctx);
  } catch (e) {
    threw = true;
    throw e;
  } finally {
    const status = threw ? 500 : res.statusCode;
    if (status >= 400) {
      for (const refund of ctx.refunds) {
        await refund().catch((e) => console.error('[analyze.ts] Quota refund failed:', e?.message));
      }
    }
    if (ctx.idempotencyRef) {
      await settleIdempotencyKey(ctx.idempotencyRef, status, ctx.responseBody).catch((e) =>
        console.error('[idempotency] Failed to settle key:', e?.message)
      );
    }
  }
}

export default withSentry(handlerWithRefunds as any);
