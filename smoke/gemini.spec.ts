import { readFileSync } from 'fs';
import { test, expect, type APIRequestContext } from '@playwright/test';
import { analyze, freeProfile, freshIp, resetEmulators, seedDoc, signUp } from '../e2e/helpers';

// One real Gemini call per SDK feature api/analyze.ts relies on: image and
// audio inlineData, responseSchema, safetySettings, systemInstruction,
// multi-turn contents, and gemini-2.5-pro with thinkingConfig. Assertions
// check shape plus one or two facts the model can't get right without
// actually reading the input, so a silently-broken request fails here.
//
// Fixtures: worksheet.jpg is a rendered sheet whose answer 2 ("childs") is
// wrong on purpose; class-log.wav is macOS `say` reading a class log.

const b64 = (file: string) => readFileSync(`smoke/fixtures/${file}`).toString('base64');

async function account(request: APIRequestContext, profile: Record<string, unknown>) {
  const { uid, idToken } = await signUp(request);
  await seedDoc(request, `users/${uid}`, freeProfile(profile));
  return idToken;
}

test.describe.configure({ mode: 'serial' });

let parent: string;
let proParent: string;
let teacher: string;

test.beforeAll(async ({ request }) => {
  await resetEmulators(request);
  parent = await account(request, {});
  proParent = await account(request, { plan: 'pro', maxScansPerDay: 9999 });
  teacher = await account(request, { role: 'teacher', plan: 'pro' });
});

test('scan: image + responseSchema + safetySettings', async ({ request }) => {
  const res = await analyze(request, { task: 'analyze', image: b64('worksheet.jpg'), language: 'en' }, { idToken: parent, ip: freshIp() });
  expect(res.status(), await res.text()).toBe(200);
  const body = await res.json();

  expect(typeof body.worksheet_summary.title_en).toBe('string');
  expect(body.worksheet_summary.has_handwriting).toBe(true);
  expect(body.items.length).toBeGreaterThanOrEqual(4);
  for (const item of body.items) {
    expect(typeof item.question_text).toBe('string');
    expect(typeof item.correct_answer).toBe('string');
    expect(typeof item.is_correct).toBe('boolean');
  }
  const children = body.items.find((i: any) => /child/i.test(i.question_text));
  expect(children?.is_correct).toBe(false);
});

test('pro scan of a blank page: gemini-2.5-pro + thinkingConfig fallback', async ({ request }) => {
  // A pro scan that finds 0 questions retries on 2.5-pro with thinking.
  const res = await analyze(request, { task: 'analyze', image: b64('blank.jpg') }, { idToken: proParent, ip: freshIp() });
  expect(res.status(), await res.text()).toBe(200);
  expect(Array.isArray((await res.json()).items)).toBe(true);
});

test('ask_question: systemInstruction + multi-turn history', async ({ request }) => {
  const history = [
    { role: 'user', text: 'What is a plural noun?' },
    { role: 'model', text: 'A plural noun names more than one thing, like "cats".' },
  ];
  const res = await analyze(
    request,
    { task: 'ask_question', question: 'What is the plural of "child"?', history, language: 'en' },
    { idToken: parent, ip: freshIp() }
  );
  expect(res.status(), await res.text()).toBe(200);
  expect((await res.json()).answer).toMatch(/children/i);
});

test('generate: JSON mime type without schema', async ({ request }) => {
  const originalItems = [{ id: 1, question_text: 'I have two ___. (child / children)', correct_answer: 'children' }];
  const res = await analyze(request, { task: 'generate', originalItems, language: 'en' }, { idToken: proParent, ip: freshIp() });
  expect(res.status(), await res.text()).toBe(200);
  expect(await res.json()).toBeTruthy();
});

test('generate_worksheet: nested responseSchema', async ({ request }) => {
  const res = await analyze(
    request,
    {
      task: 'generate_worksheet',
      curriculum: { topic: 'Animals', vocabWords: ['lion', 'zebra', 'monkey'] },
      worksheetType: 'vocabulary',
      questionStyle: 'multiple_choice',
    },
    { idToken: proParent, ip: freshIp() }
  );
  expect(res.status(), await res.text()).toBe(200);
  const body = await res.json();
  const sheet = body.worksheet ?? body;
  expect(typeof sheet.title_en).toBe('string');
  expect(sheet.questions.length).toBeGreaterThan(0);
});

test('generate_report: plain string contents + schema', async ({ request }) => {
  const res = await analyze(
    request,
    {
      task: 'generate_report',
      type: 'summary',
      payload: {
        className: 'Kinder Blue',
        date: '2026-10-22',
        lessonTopic: 'The water cycle',
        textbook: 'Bricks Reading 100',
        energyLevel: 'High Energy and Engaged',
        activities: ['Reading', 'Worksheet'],
        generalComments: 'Everyone joined the evaporation experiment.',
      },
    },
    { idToken: teacher, ip: freshIp() }
  );
  expect(res.status(), await res.text()).toBe(200);
  const body = await res.json();
  // On a Gemini failure this endpoint still returns 200 with a template.
  expect(body.fallback).toBe(false);
  expect(body.korean).toMatch(/[가-힣]/);
  expect(body.english.length).toBeGreaterThan(20);
});

test('voice_log_fill: audio inlineData + schema', async ({ request }) => {
  const res = await analyze(
    request,
    { task: 'voice_log_fill', audio: b64('class-log.wav'), mimeType: 'audio/wav', history: [], currentFields: {}, language: 'en' },
    { idToken: teacher, ip: freshIp() }
  );
  expect(res.status(), await res.text()).toBe(200);
  const { updatedFields } = await res.json();
  expect(updatedFields.lessonTopic).toMatch(/water/i);
  expect(updatedFields.textbook).toMatch(/bricks/i);
});
