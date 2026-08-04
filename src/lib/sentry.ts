import * as Sentry from '@sentry/react';

let initialized = false;

/**
 * No-op unless VITE_SENTRY_DSN is set (e.g. in Vercel env vars), so local
 * dev and any deploy without a DSN configured never tries to reach Sentry.
 */
export function initSentry() {
  if (initialized) return;
  const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    tracesSampleRate: 0,
  });
  initialized = true;
}
