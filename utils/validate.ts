/**
 * validate.ts
 *
 * Small coercion helpers for data crossing an untrusted boundary — a
 * Firestore document or an AI-generated JSON response. TypeScript types
 * (e.g. `topic: string`) are a compile-time promise only; they don't survive
 * a database read or an LLM response that drifts from its schema. Without a
 * check at the boundary, a malformed field flows straight into state and
 * crashes later — e.g. a non-string `topic` field reaching `.trim()` deep in
 * a render, with no indication at the point where the bad data was actually
 * read.
 *
 * Use these right after `snap.data()` / `JSON.parse(...)` / an AI response,
 * before the value is handed to `setState`, instead of ad hoc
 * `typeof x === 'string' ? x : ''` checks scattered per call site.
 */

export function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

export function asStringArray(value: unknown, fallback: string[] = []): string[] {
  if (Array.isArray(value)) return value.filter((v): v is string => typeof v === 'string');
  return fallback;
}

export function asNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && !Number.isNaN(value) ? value : fallback;
}

export function asBoolean(value: unknown, fallback = false): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

/**
 * Joins a field that may arrive as either a string[] or an already-joined
 * string (both shapes appear across older/newer curriculum docs) into a
 * single display string.
 */
export function asJoinedString(value: unknown, separator = ', ', fallback = ''): string {
  if (Array.isArray(value)) return value.filter((v) => typeof v === 'string').join(separator);
  return asString(value, fallback);
}
