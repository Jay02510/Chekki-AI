import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';

// Shared rate-limit factory — previously each endpoint (admin.ts, analyze.ts,
// request-school-invoice.ts) duplicated its own Redis/Ratelimit init and
// in-memory fallback. Centralized so every endpoint gets the same
// preview/non-Redis-env fallback behavior for free, and new endpoints don't
// have to re-derive it (Audit: rate-limit coverage gaps).
// Vercel's Upstash integration names these KV_REST_API_*; a direct Upstash
// setup uses UPSTASH_REDIS_REST_*. Accept either.
const redisUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
const redis = redisUrl && redisToken ? new Redis({ url: redisUrl, token: redisToken }) : null;

// The in-memory fallback is per serverless instance, so in production it
// limits almost nothing. Say so loudly instead of degrading silently.
if (!redis && process.env.VERCEL_ENV === 'production') {
  console.error('[rateLimit] Upstash Redis is not configured in production — rate limits are per-instance only.');
}

const memoryStores = new Map<string, Map<string, number[]>>();

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

/**
 * Creates a rate limiter scoped to `name` (used as the Redis key prefix and
 * in-memory store key), allowing `limit` requests per `windowSeconds`.
 * Falls back to an in-process sliding-window map when Redis env vars aren't
 * configured (local dev / preview deploys).
 */
export function createRateLimiter(name: string, limit: number, windowSeconds: number) {
  const ratelimit = redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(limit, `${windowSeconds} s`),
        analytics: true,
        prefix: `ratelimit:${name}`,
      })
    : null;

  const windowMs = windowSeconds * 1000;
  if (!memoryStores.has(name)) memoryStores.set(name, new Map());
  const memoryStore = memoryStores.get(name)!;

  return async function checkLimit(identifier: string): Promise<RateLimitResult> {
    if (ratelimit) {
      const { success, limit: lim, remaining, reset } = await ratelimit.limit(identifier);
      return { success, limit: lim, remaining, reset };
    }

    const now = Date.now();
    const windowStart = now - windowMs;
    const timestamps = (memoryStore.get(identifier) || []).filter((t) => t > windowStart);
    const reset = now + windowMs;

    if (timestamps.length >= limit) {
      return { success: false, limit, remaining: 0, reset };
    }

    timestamps.push(now);
    memoryStore.set(identifier, timestamps);
    return { success: true, limit, remaining: limit - timestamps.length, reset };
  };
}

// x-forwarded-for can be a "client, proxy1, proxy2" list; the client is the
// first entry. Without the split, one IP behind different proxies became
// several rate-limit identities.
export function clientIp(req: { headers: Record<string, any>; socket?: { remoteAddress?: string } }): string {
  const raw = req.headers['x-forwarded-for'];
  const first = (Array.isArray(raw) ? raw[0] : raw)?.split(',')[0].trim();
  return first || req.headers['x-real-ip'] || req.socket?.remoteAddress || 'anonymous';
}
