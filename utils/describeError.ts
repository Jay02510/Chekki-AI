/**
 * describeError.ts
 *
 * One place to turn a caught error — a Firebase Auth/Firestore error code, a
 * failed `/api/*` fetch response, or a plain Error — into a short, safe,
 * user-facing message. Before this, every feature hand-rolled its own
 * mapping in its own catch block, so the same underlying failure (e.g. a
 * network drop) surfaced as a silent empty list in one place, a generic
 * "couldn't load from cloud" banner in another, and a bare error code
 * ("ANALYSIS_FAILED") in a third. New catch blocks should call
 * `describeError()` instead of writing another one-off mapping, so failures
 * are at least consistent even when the underlying cause differs.
 */

const KNOWN_ERROR_MESSAGES: Record<string, string> = {
  'auth/user-not-found': 'No account found with this email.',
  'auth/wrong-password': 'Incorrect password.',
  'auth/invalid-credential': 'Invalid email or password. Please try again.',
  'auth/email-already-in-use': 'Email already registered.',
  'auth/invalid-email': 'Please enter a valid email address.',
  'auth/too-many-requests': 'Too many attempts. Please wait and try again.',
  'auth/network-request-failed': 'Network error. Please check your internet connection.',
  'permission-denied': "You don't have permission to do that.",
  unavailable: "Couldn't reach the server. Check your connection and try again.",
};

export function describeError(err: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (!err) return fallback;

  const code = (err as any)?.code;
  if (typeof code === 'string' && KNOWN_ERROR_MESSAGES[code]) {
    return KNOWN_ERROR_MESSAGES[code];
  }

  // Our own /api/* routes return { error: 'SOME_CODE', details: '<human
  // readable reason>' } (see api/analyze.ts) — prefer details when present,
  // since it's the actual cause rather than a machine-readable code.
  const details = (err as any)?.details;
  if (typeof details === 'string' && details.trim()) return details;

  const message = (err as any)?.message;
  if (typeof message === 'string' && message.trim() && message !== 'Failed to fetch') {
    return message;
  }

  return fallback;
}

/**
 * Turns a failed `fetch()` JSON response into an Error whose `.message` is
 * already the best available user-facing text — `data.details`, then
 * `data.error`, then a generic message with the HTTP status. Pairs with
 * `describeError()`: `if (!res.ok) throw parseApiError(res, data);`
 */
export function parseApiError(res: Response, data: any): Error & { code?: string } {
  const message =
    (typeof data?.details === 'string' && data.details) ||
    (typeof data?.error === 'string' && data.error) ||
    `Request failed (${res.status})`;
  const error = new Error(message) as Error & { code?: string };
  if (typeof data?.error === 'string') error.code = data.error;
  return error;
}
