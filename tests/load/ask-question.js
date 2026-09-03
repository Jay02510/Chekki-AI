// Load test for POST /api/analyze (task: ask_question) — the one no-auth
// endpoint, so it needs no test-user token setup to hit real concurrency.
// Run only against a staging deployment with MOCK_GEMINI=true (see
// api/analyze.ts createGenAI()) — never point BASE_URL at production.
//
// Usage:
//   BASE_URL=https://chekki-<preview-id>-kingjay2510-gmailcoms-projects.vercel.app k6 run tests/load/ask-question.js
//
// Override load shape ad hoc, e.g.:
//   k6 run --vus 50 --duration 60s tests/load/ask-question.js

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL;
if (!BASE_URL) {
  throw new Error('Set BASE_URL to the staging preview URL, e.g. BASE_URL=https://chekki-xxxx.vercel.app k6 run tests/load/ask-question.js');
}

const latency = new Trend('chekki_ask_question_duration', true);

const QUESTIONS = [
  '이 단어의 뜻이 뭐예요?',
  'How do I help my child with this worksheet?',
  '숙제를 언제까지 제출해야 하나요?',
  'What does this vocabulary word mean in context?',
  '발음 연습은 어떻게 하나요?',
];

export const options = {
  scenarios: {
    ramping_load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 20 },
        { duration: '1m', target: 20 },
        { duration: '30s', target: 50 },
        { duration: '1m', target: 50 },
        { duration: '30s', target: 0 },
      ],
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.05'],
    chekki_ask_question_duration: ['p(95)<3000'],
  },
};

export default function () {
  const question = QUESTIONS[Math.floor(Math.random() * QUESTIONS.length)];

  const res = http.post(
    `${BASE_URL}/api/analyze`,
    JSON.stringify({ task: 'ask_question', question, history: [] }),
    { headers: { 'Content-Type': 'application/json' } }
  );

  latency.add(res.timings.duration);

  check(res, {
    'status is 200': (r) => r.status === 200,
    'has answer field': (r) => {
      try {
        return typeof JSON.parse(r.body).answer === 'string';
      } catch {
        return false;
      }
    },
  });

  sleep(1);
}
