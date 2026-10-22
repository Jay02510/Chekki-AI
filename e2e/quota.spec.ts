import { test, expect } from '@playwright/test';
import { analyze, fakeImage, freeProfile, freshIp, resetEmulators, seedDoc, signUp, userWrite } from './helpers';

// API-level checks that the free-tier quota can't be bypassed. Each one is a
// hole that existed before quota moved to the server-only usage/{uid} doc.

test.beforeEach(async ({ request }) => {
  await resetEmulators(request);
});

const scan = (request: any, idToken: string, ip: string, n = 0) =>
  analyze(request, { task: 'analyze', image: fakeImage(n) }, { idToken, ip });

test('a free parent gets exactly 2 scans a day', async ({ request }) => {
  const { uid, idToken } = await signUp(request);
  await seedDoc(request, `users/${uid}`, freeProfile());
  const ip = freshIp();

  expect((await scan(request, idToken, ip, 1)).status()).toBe(200);
  expect((await scan(request, idToken, ip, 2)).status()).toBe(200);
  const third = await scan(request, idToken, ip, 3);
  expect(third.status()).toBe(403);
  expect((await third.json()).error).toBe('SCAN_LIMIT_REACHED');
});

test('parallel scans cannot race past the limit', async ({ request }) => {
  const { uid, idToken } = await signUp(request);
  await seedDoc(request, `users/${uid}`, freeProfile());
  const ip = freshIp();

  const statuses = (await Promise.all([1, 2, 3, 4, 5, 6].map((n) => scan(request, idToken, ip, n)))).map((r) => r.status());
  expect(statuses.filter((s) => s === 200)).toHaveLength(2);
  expect(statuses.filter((s) => s === 403)).toHaveLength(4);
});

test('deleting and recreating the user doc does not reset the quota', async ({ request }) => {
  const { uid, idToken } = await signUp(request);
  await seedDoc(request, `users/${uid}`, freeProfile());
  const ip = freshIp();
  await scan(request, idToken, ip, 1);
  await scan(request, idToken, ip, 2);

  expect((await userWrite(request, idToken, `users/${uid}`)).ok()).toBe(true);
  expect((await userWrite(request, idToken, `users/${uid}`, freeProfile())).ok()).toBe(true);

  expect((await scan(request, idToken, ip, 3)).status()).toBe(403);
});

test('rules refuse a recreated doc that grants itself quota', async ({ request }) => {
  const { uid, idToken } = await signUp(request);
  const res = await userWrite(request, idToken, `users/${uid}`, freeProfile({ scansUsedToday: -9999 }));
  expect(res.status()).toBe(403);
});

test('a signed-in account with no user doc is still metered', async ({ request }) => {
  const { idToken } = await signUp(request);
  const ip = freshIp();
  expect((await scan(request, idToken, ip, 1)).status()).toBe(200);
  expect((await scan(request, idToken, ip, 2)).status()).toBe(200);
  expect((await scan(request, idToken, ip, 3)).status()).toBe(403);
});

test('a failed scan gives its quota back', async ({ request }) => {
  const { uid, idToken } = await signUp(request);
  await seedDoc(request, `users/${uid}`, freeProfile());
  const ip = freshIp();

  const bad = await analyze(request, { task: 'analyze', image: 12345 }, { idToken, ip });
  expect(bad.status()).toBe(400);
  expect((await scan(request, idToken, ip, 1)).status()).toBe(200);
  expect((await scan(request, idToken, ip, 2)).status()).toBe(200);
});

test('follow-ups are capped instead of unlimited', async ({ request }) => {
  const { uid, idToken } = await signUp(request);
  // 1 question a day -> 4 follow-ups a day (FOLLOWUPS_PER_QUESTION).
  await seedDoc(request, `users/${uid}`, freeProfile({ maxQuestionsPerDay: 1 }));
  const ask = (history: unknown[]) =>
    analyze(request, { task: 'ask_question', question: 'What is a noun?', history }, { idToken, ip: freshIp() });
  const fakeHistory = [
    { role: 'user', text: 'hi' },
    { role: 'model', text: 'hello' },
  ];

  expect((await ask([])).status()).toBe(200);
  expect((await ask([])).status()).toBe(403);
  for (let i = 0; i < 4; i++) expect((await ask(fakeHistory)).status()).toBe(200);
  const over = await ask(fakeHistory);
  expect(over.status()).toBe(403);
  expect((await over.json()).error).toBe('QUESTION_LIMIT_REACHED');
});

test('guest burst limit holds under parallel requests', async ({ request }) => {
  const ip = freshIp();
  const statuses = (
    await Promise.all(
      [1, 2, 3, 4, 5, 6].map(() => analyze(request, { task: 'ask_question', question: 'What is a verb?' }, { ip }))
    )
  ).map((r) => r.status());
  expect(statuses.filter((s) => s === 200)).toHaveLength(5);
  expect(statuses.filter((s) => s === 429)).toHaveLength(1);
});
