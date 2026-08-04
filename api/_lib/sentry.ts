import * as Sentry from '@sentry/node';

let initialized = false;

/**
 * No-op unless SENTRY_DSN is set in the Vercel project's env vars, so local
 * dev and any deploy without a DSN configured never tries to reach Sentry.
 */
function initSentry() {
  if (initialized) return;
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: process.env.VERCEL_ENV || 'development',
    tracesSampleRate: 0,
  });
  initialized = true;
}

export function captureException(error: unknown) {
  initSentry();
  if (!initialized) {
    console.error(error);
    return;
  }
  Sentry.captureException(error);
}
