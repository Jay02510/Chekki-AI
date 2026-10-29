// Answer-key upload test: send book pages through the production curriculum
// OCR handler and check the answers it extracts and how it labels them.
//
//   npm run eval:ocr -- [--limit=10]
//
// Two uploads a teacher might make:
//   teacher copy  a page filled in correctly by hand -> answers, "handwritten"
//   blank page    the page with nothing written -> answers worked out, "inferred"
// Uses the all-correct photos from fill.mjs and renders blank pages from
// book_pages.py's HTML. Needs API_KEY (Gemini) in .env.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from '@playwright/test';
import { GoogleGenAI } from '@google/genai';
import { handleCurriculumOcr } from '../../api/_lib/analyze/curriculumOcr';

type Item = { n: string; kind: string; sentence: string; answer: string; isCorrect: boolean };
type Case = { id: string; image: string; items: Item[] };

const arg = (name: string) => process.argv.find((a) => a.startsWith(`--${name}=`))?.split('=')[1];
const limit = Number(arg('limit') || Infinity);
const dir = path.dirname(new URL(import.meta.url).pathname);
try {
  process.loadEnvFile('.env');
} catch {
  // API_KEY may already be in the environment
}
if (!process.env.API_KEY) throw new Error('API_KEY missing (Gemini key, see .env.example)');
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const all: Case[] = JSON.parse(fs.readFileSync(path.join(dir, 'cases', 'cases.json'), 'utf8'));
const filled = all.filter((c) => c.items.every((i) => i.isCorrect)).slice(0, limit);

// Blank renders of the same pages, same viewport as fill.mjs.
const blankDir = path.join(dir, 'cases', 'blank');
fs.mkdirSync(blankDir, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 900, height: 1250 }, deviceScaleFactor: 1.6 });
const blanks: Case[] = [];
for (const c of filled) {
  const pageId = c.id.replace(/-v\d+$/, '');
  if (blanks.some((b) => b.id === pageId)) continue;
  const image = path.join(blankDir, `${pageId}.jpg`);
  if (!fs.existsSync(image)) {
    await page.goto(pathToFileURL(path.join(dir, 'pages', `${pageId}.html`)).href);
    await page.locator('.page').screenshot({ path: image, type: 'jpeg', quality: 80 });
  }
  blanks.push({ id: pageId, image, items: c.items });
}
await browser.close();

async function ocr(imagePath: string) {
  const out: any = {};
  const res = {
    status(code: number) {
      out.status = code;
      return res;
    },
    json(b: any) {
      out.body = b;
      return res;
    },
  };
  const t0 = Date.now();
  // A network error counts as a failed call, not the end of the run.
  await handleCurriculumOcr({
    res,
    body: { image_base64: fs.readFileSync(imagePath).toString('base64'), mimeType: 'image/jpeg' },
    ai,
    mode: 'textbook_curriculum_ocr',
    userSnap: null,
  } as any).catch((e) => Object.assign(out, { status: 0, body: { error: String(e) } }));
  return { ...out, ms: Date.now() - t0 };
}

// "B", "Picture B (cat)" or the option's own sentence all mean B; written
// answers compare as words.
const words = (s: unknown) => String(s ?? '').toLowerCase().replace(/[^a-z' ]/g, '').trim();
function sameAnswer(item: Item, got: unknown) {
  const g = String(got ?? '').trim();
  if (/^[abc]$/i.test(item.answer)) {
    const letter = (g.match(/picture\s+([abc])\b/i) ?? g.match(/^\(?([abc])\b/i))?.[1];
    if (letter) return letter.toUpperCase() === item.answer;
    // The picture's word ("bag (yellow backpack)") or the sentence itself.
    const sentence = words(item.sentence);
    return words(g) === sentence || ` ${sentence} `.includes(` ${words(g).split(' ')[0]} `);
  }
  return words(g) === item.answer.toLowerCase();
}

async function run(label: string, set: Case[], expectSource: string) {
  let items = 0, found = 0, right = 0, labelled = 0, ms = 0, failed = 0;
  const sources: Record<string, number> = {};
  const misses: string[] = [];
  for (const c of set) {
    const r = await ocr(path.resolve(dir, 'cases', c.image));
    process.stdout.write(`${c.id} ${(r.ms / 1000).toFixed(0)}s ${r.status}  `);
    ms += r.ms;
    const answers: any[] = r.body?.analysis?.detectedAnswers ?? [];
    if (r.status !== 200) failed++;
    for (const item of c.items) {
      items++;
      const a = answers.find((x) => String(x.questionNumber).replace(/\D/g, '') === item.n);
      if (!a) {
        misses.push(`${c.id}#${item.n} missing`);
        continue;
      }
      found++;
      if (sameAnswer(item, a.answer)) right++;
      else misses.push(`${c.id}#${item.n} want ${item.answer} got ${JSON.stringify(a.answer)}`);
      if (a.source === expectSource) labelled++;
      sources[a.source] = (sources[a.source] ?? 0) + 1;
    }
  }
  const pct = (n: number, d: number) => `${((100 * n) / Math.max(1, d)).toFixed(1)}%`;
  console.log(`\n${label} (${set.length} pages, ${items} items)`);
  console.log(`  failed calls         ${failed}`);
  console.log(`  items found          ${pct(found, items)}`);
  console.log(`  answers right        ${pct(right, items)}`);
  console.log(`  labelled ${expectSource.padEnd(12)}${pct(labelled, found)}`);
  console.log(`  sources              ${JSON.stringify(sources)}`);
  console.log(`  avg latency          ${(ms / set.length / 1000).toFixed(1)}s`);
  if (misses.length) console.log(`  misses: ${misses.slice(0, 15).join('; ')}`);
}

await run('TEACHER COPY (filled in by hand)', filled, 'handwritten');
await run('BLANK PAGE (no answers shown)', blanks, 'inferred');
