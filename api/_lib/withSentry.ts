import type { VercelRequest, VercelResponse } from '@vercel/node';
import { captureException } from './sentry';

type Handler = (req: VercelRequest, res: VercelResponse) => Promise<void | VercelResponse>;

/**
 * Reports any error a handler throws to Sentry before failing the request,
 * so uncaught bugs in the ~12 api/*.ts endpoints show up in one place
 * instead of only in Vercel's function logs.
 */
export function withSentry(handler: Handler): Handler {
  return async (req, res) => {
    try {
      return await handler(req, res);
    } catch (error) {
      captureException(error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Internal server error' });
      }
      return undefined;
    }
  };
}
