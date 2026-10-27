// Grade the generated worksheet photos with the production scan prompt and
// score the results against the known answers, with and without the
// teacher's answer key.
//
//   npm run eval:grading -- [--model=gemini-2.5-flash] [--limit=10]
//
// Needs API_KEY (Gemini) in .env and cases from book_pages.py + fill.mjs.
// Writes results-<model>-<timestamp>.json next to the cases.
import fs from 'node:fs';
import path from 'node:path';
import { GoogleGenAI } from '@google/genai';
import {
  buildCurriculumContext,
  buildScanSystemPrompt,
  scanGenerateConfig,
  SCAN_USER_TEXT,
  verifyKeyGrounding,
} from '../../api/_lib/analyze/scanPrompt';

type Item = {
  n: string;
  kind: 'pm' | 'wo' | 'yn';
  sentence: string;
  answer: string;
  options?: Record<string, string>;
  childAnswer: string;
  isCorrect: boolean;
};
type Case = { id: string; image: string; items: Item[] };

const arg = (name: string) => process.argv.find((a) => a.startsWith(`--${name}=`))?.split('=')[1];
const model = arg('model') || 'gemini-2.5-flash';
const limit = Number(arg('limit') || Infinity);
const casesDir = path.join(path.dirname(new URL(import.meta.url).pathname), 'cases');
try {
  process.loadEnvFile('.env');
} catch {
  // API_KEY may already be in the environment
}
if (!process.env.API_KEY) throw new Error('API_KEY missing (Gemini key, see .env.example)');
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const cases: Case[] = JSON.parse(fs.readFileSync(path.join(casesDir, 'cases.json'), 'utf8')).slice(
  0,
  limit
);

// What a teacher's upload of the book's answer-key page would give.
function answerKeyFor(c: Case) {
  return c.items.map((i) =>
    i.kind === 'wo'
      ? {
          questionText: `${i.n}. Circle the sentence that matches the picture.`,
          answer: `${i.answer}. ${i.sentence}`,
        }
      : { questionText: `${i.n}. ${i.sentence}`, answer: i.answer }
  );
}

const words = (s: unknown) =>
  new Set(
    String(s ?? '')
      .toLowerCase()
      .replace(/[^a-z0-9 ]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 1)
  );
function overlap(a: Set<string>, b: Set<string>) {
  let n = 0;
  for (const w of a) if (b.has(w)) n++;
  return n / Math.max(1, Math.min(a.size, b.size));
}

// Pair each true item with the model item that talks about the same sentence;
// whatever is left over is paired by position.
function match(truth: Item[], got: any[]) {
  const scored: [number, number, number][] = [];
  truth.forEach((t, ti) => {
    const want = words([t.sentence, ...Object.values(t.options || {})].join(' '));
    got.forEach((g, gi) =>
      scored.push([overlap(want, words(`${g.question_text} ${g.correct_answer}`)), ti, gi])
    );
  });
  scored.sort((a, b) => b[0] - a[0]);
  const pairs = new Map<number, number>();
  const used = new Set<number>();
  for (const [score, ti, gi] of scored) {
    if (score < 0.5 || pairs.has(ti) || used.has(gi)) continue;
    pairs.set(ti, gi);
    used.add(gi);
  }
  const freeGot = got.map((_, gi) => gi).filter((gi) => !used.has(gi));
  truth.forEach((_, ti) => {
    if (!pairs.has(ti) && freeGot.length) pairs.set(ti, freeGot.shift()!);
  });
  return pairs;
}

async function grade(c: Case, withKey: boolean) {
  const answerKey = withKey ? answerKeyFor(c) : [];
  const curriculumContext = withKey
    ? buildCurriculumContext({
        schoolName: 'Eval Academy',
        className: 'Eval Class',
        week: 1,
        vocab: [],
        phonics: [],
        passage: '',
        answerKey,
      })
    : '';
  const image = fs.readFileSync(path.join(casesDir, c.image)).toString('base64');
  const started = Date.now();
  for (let attempt = 0; ; attempt++) {
    try {
      const res = await ai.models.generateContent({
        model,
        contents: [
          {
            role: 'user',
            parts: [
              { inlineData: { mimeType: 'image/jpeg', data: image } },
              { text: SCAN_USER_TEXT },
            ],
          },
        ],
        config: scanGenerateConfig(buildScanSystemPrompt({ curriculumContext, language: 'ko' })),
      });
      const parsed = JSON.parse((res.text || '{}').replace(/```json\n?|```/g, '').trim());
      return { items: verifyKeyGrounding(parsed.items || [], answerKey), ms: Date.now() - started };
    } catch (e: any) {
      if (
        attempt < 2 &&
        /429|503|RESOURCE_EXHAUSTED|UNAVAILABLE|overloaded/i.test(`${e?.status} ${e?.message}`)
      ) {
        await new Promise((r) => setTimeout(r, 5000 * (attempt + 1)));
        continue;
      }
      return { items: [], ms: Date.now() - started, error: String(e?.message || e) };
    }
  }
}

function score(c: Case, items: any[]) {
  const pairs = match(c.items, items);
  return c.items.map((t, ti) => {
    const g = pairs.has(ti) ? items[pairs.get(ti)!] : undefined;
    return {
      n: t.n,
      truth: t.isCorrect,
      found: !!g,
      said: g ? g.is_correct !== false : undefined,
      grounded: !!g?.graded_against_key,
      childAnswer: t.childAnswer,
      modelResponse: g?.student_response,
    };
  });
}

const results: any[] = [];
const queue = cases.flatMap((c) => [false, true].map((withKey) => ({ c, withKey })));
let done = 0;
await Promise.all(
  Array.from({ length: 4 }, async () => {
    for (let job = queue.shift(); job; job = queue.shift()) {
      const r = await grade(job.c, job.withKey);
      results.push({
        case: job.c.id,
        withKey: job.withKey,
        ms: r.ms,
        error: r.error,
        items: score(job.c, r.items),
      });
      process.stdout.write(`\r${++done}/${cases.length * 2}`);
    }
  })
);

const pct = (a: number, b: number) => (b ? `${((100 * a) / b).toFixed(1)}%` : '-');
console.log(`\n\nmodel ${model}, ${cases.length} pages`);
for (const withKey of [false, true]) {
  const rs = results.filter((r) => r.withKey === withKey);
  const its = rs.flatMap((r) => r.items);
  const found = its.filter((i) => i.found);
  const mistakes = its.filter((i) => !i.truth);
  const rightAnswers = its.filter((i) => i.truth);
  const pagesPerfect = rs.filter((r) =>
    r.items.every((i: any) => i.found && i.said === i.truth)
  ).length;
  console.log(`\n${withKey ? 'WITH answer key' : 'NO answer key (AI judgment)'}`);
  console.log(
    `  graded correctly     ${pct(its.filter((i) => i.found && i.said === i.truth).length, its.length)} of ${its.length} items`
  );
  console.log(`  pages fully right    ${pct(pagesPerfect, rs.length)} of ${rs.length}`);
  console.log(
    `  mistakes caught      ${pct(mistakes.filter((i) => i.said === false).length, mistakes.length)} of ${mistakes.length}`
  );
  console.log(
    `  false alarms         ${pct(rightAnswers.filter((i) => i.said === false).length, rightAnswers.length)} of ${rightAnswers.length} right answers marked wrong`
  );
  console.log(`  items found          ${pct(found.length, its.length)}`);
  if (withKey)
    console.log(
      `  marked as key-graded ${pct(found.filter((i) => i.grounded).length, found.length)}`
    );
  console.log(
    `  avg latency          ${(rs.reduce((s, r) => s + r.ms, 0) / Math.max(1, rs.length) / 1000).toFixed(1)}s`
  );
  const errors = rs.filter((r) => r.error).length;
  if (errors) console.log(`  API errors           ${errors}`);
}
const out = path.join(
  casesDir,
  `results-${model}-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
);
fs.writeFileSync(out, JSON.stringify(results, null, 1));
console.log(`\nper-item results: ${out}`);
