import type { APIRequestContext } from '@playwright/test';

const PROJECT = 'demo-chekki';
const AUTH = 'http://127.0.0.1:9099';
const FIRESTORE = `http://127.0.0.1:8080/v1/projects/${PROJECT}/databases/(default)/documents`;
// The emulator treats "Bearer owner" as an admin that bypasses rules.
const OWNER = { Authorization: 'Bearer owner' };

export const kstDate = () => new Date(Date.now() + 9 * 3_600_000).toISOString().slice(0, 10);

// Any string works as the photo: MOCK_GEMINI never looks at it.
export const fakeImage = (n = 0) => `data:image/jpeg;base64,${Buffer.from(`worksheet-${n}-${Math.random()}`).toString('base64')}`;

let ipCounter = 0;
// Each test gets its own client IP so per-IP limits don't leak between tests.
export const freshIp = () => `10.0.${Math.floor(++ipCounter / 250)}.${ipCounter % 250}`;

export async function resetEmulators(request: APIRequestContext) {
  await request.delete(`http://127.0.0.1:8080/emulator/v1/projects/${PROJECT}/databases/(default)/documents`);
  await request.delete(`${AUTH}/emulator/v1/projects/${PROJECT}/accounts`);
}

export async function signUp(request: APIRequestContext) {
  const email = `e2e-${Date.now()}-${Math.random().toString(36).slice(2)}@test.dev`;
  const res = await request.post(`${AUTH}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=demo-key`, {
    data: { email, password: 'password123', returnSecureToken: true },
  });
  const body = await res.json();
  return { uid: body.localId as string, idToken: body.idToken as string, email };
}

function toValue(v: unknown): unknown {
  if (v === null) return { nullValue: null };
  if (typeof v === 'boolean') return { booleanValue: v };
  if (typeof v === 'number') return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
  return { stringValue: String(v) };
}

const fields = (data: Record<string, unknown>) =>
  Object.fromEntries(Object.entries(data).map(([k, v]) => [k, toValue(v)]));

export const freeProfile = (overrides: Record<string, unknown> = {}) => ({
  name: 'E2E Parent',
  plan: 'free',
  scansUsedToday: 0,
  maxScansPerDay: 2,
  questionsUsedToday: 0,
  maxQuestionsPerDay: 5,
  lastScanDate: kstDate(),
  lastQuestionDate: kstDate(),
  schoolId: null,
  schoolName: null,
  ...overrides,
});

// Seeds a doc as the server would (bypasses rules).
export async function seedDoc(request: APIRequestContext, path: string, data: Record<string, unknown>) {
  const res = await request.patch(`${FIRESTORE}/${path}`, { headers: OWNER, data: { fields: fields(data) } });
  if (!res.ok()) throw new Error(`seed ${path}: ${res.status()} ${await res.text()}`);
}

// Writes/deletes a doc as the signed-in user (rules apply).
export async function userWrite(request: APIRequestContext, idToken: string, path: string, data?: Record<string, unknown>) {
  const headers = { Authorization: `Bearer ${idToken}` };
  return data
    ? request.patch(`${FIRESTORE}/${path}`, { headers, data: { fields: fields(data) } })
    : request.delete(`${FIRESTORE}/${path}`, { headers });
}

export function analyze(
  request: APIRequestContext,
  body: Record<string, unknown>,
  opts: { idToken?: string; ip?: string } = {}
) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (opts.idToken) headers.Authorization = `Bearer ${opts.idToken}`;
  if (opts.ip) headers['x-forwarded-for'] = opts.ip;
  return request.post('/api/analyze', { headers, data: body });
}
