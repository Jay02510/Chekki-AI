// Draw a child's pencil circles on the book pages from book_pages.py and save
// them as phone-photo-like JPEGs, with the true answer for every item.
//
//   node scripts/grading-eval/fill.mjs [pagesDir] [casesDir] [variantsPerPage]
//
// Each variant picks the child's answers with a fixed seed (page + variant),
// so a rerun produces the same cases. Mistake rate: 35% on variant 0, 15% on
// the others, so cases range from several mistakes to none.
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const dir = path.dirname(new URL(import.meta.url).pathname);
const pagesDir = process.argv[2] || path.join(dir, 'pages');
const casesDir = process.argv[3] || path.join(dir, 'cases');
const variants = Number(process.argv[4] || 2);
fs.mkdirSync(casesDir, { recursive: true });

// Small seeded RNG (mulberry32) so cases are reproducible.
function rng(seedText) {
  let a = [...seedText].reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 2654435761) >>> 0, 7);
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const optionsOf = (item) => (item.kind === 'yn' ? ['Yes', 'No'] : ['A', 'B', 'C']);

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 900, height: 1250 },
  deviceScaleFactor: 1.6,
});
const cases = [];

for (const file of fs
  .readdirSync(pagesDir)
  .filter((f) => f.endsWith('.json'))
  .sort()) {
  const meta = JSON.parse(fs.readFileSync(path.join(pagesDir, file), 'utf8'));
  for (let v = 0; v < variants; v++) {
    const rand = rng(`${meta.pageId}#${v}`);
    const mistakeRate = v === 0 ? 0.35 : 0.15;
    const items = meta.items.map((item) => {
      const options = optionsOf(item);
      const wrong = options.filter((o) => o !== item.answer);
      const childAnswer =
        rand() < mistakeRate ? wrong[Math.floor(rand() * wrong.length)] : item.answer;
      return { ...item, childAnswer, isCorrect: childAnswer === item.answer };
    });

    await page.goto(pathToFileURL(path.join(pagesDir, `${meta.pageId}.html`)).href, {
      waitUntil: 'load',
    });
    const marks = items.map((item) => ({
      kind: item.kind,
      pick: item.childAnswer,
      colour: ['#3b3b3b', '#3b3b3b', '#c8372d', '#2456b8'][Math.floor(rand() * 4)],
      width: 3 + rand() * 2.5,
      start: rand() * Math.PI * 2,
      phase: [rand() * 6.28, rand() * 6.28],
    }));
    const tilt = (rand() - 0.5) * 5;
    const ok = await page.evaluate(
      ({ marks, tilt }) => {
        const els = [...document.querySelectorAll('.item.pm, .item.wo, .item.yn')];
        if (els.length !== marks.length)
          return `found ${els.length} items, expected ${marks.length}`;
        const sheet = document.querySelector('.page');
        sheet.style.position = 'relative';
        const base = sheet.getBoundingClientRect();
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute(
          'style',
          'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:50'
        );
        els.forEach((el, i) => {
          const m = marks[i];
          const targets =
            m.kind === 'pm'
              ? [...el.querySelectorAll('.tile')].map((t) => [
                  t.querySelector('.lab')?.textContent.trim(),
                  t,
                ])
              : m.kind === 'wo'
                ? [...el.querySelectorAll('.opt')].map((t) => [
                    t.querySelector('.olab')?.textContent.trim(),
                    t,
                  ])
                : [...el.querySelectorAll('.pill')].map((t) => [t.textContent.trim(), t]);
          const target = targets.find(([label]) => label === m.pick)?.[1];
          if (!target) return;
          const r = target.getBoundingClientRect();
          const cx = r.left - base.left + r.width / 2;
          const cy = r.top - base.top + r.height / 2;
          const rx = r.width / 2 + 6;
          const ry = r.height / 2 + 6;
          // A wobbly loop that overshoots its start, like a child's circle.
          const pts = Array.from({ length: 60 }, (_, k) => {
            const a = m.start + (k / 59) * Math.PI * 2.25;
            const wob =
              1 +
              0.05 * Math.sin(2 * a + m.phase[0]) +
              0.03 * Math.sin(3 * a + m.phase[1]) +
              k * 0.0012;
            return `${(cx + Math.cos(a) * rx * wob).toFixed(1)},${(cy + Math.sin(a) * ry * wob).toFixed(1)}`;
          });
          const p = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
          p.setAttribute('points', pts.join(' '));
          p.setAttribute(
            'style',
            `fill:none;stroke:${m.colour};stroke-width:${m.width};stroke-linecap:round;stroke-linejoin:round;opacity:.82`
          );
          svg.appendChild(p);
        });
        sheet.appendChild(svg);
        // Phone photo of the page on a table: tilted, a little dim.
        document.body.style.cssText = 'margin:0;padding:40px;background:#9c8a76';
        sheet.style.transform = `rotate(${tilt}deg)`;
        sheet.style.background = '#FFF8EC'; // ko-a4 paper (the print body sets it, not the page)
        sheet.style.filter = 'brightness(.96) contrast(.94)';
        sheet.style.boxShadow = '0 8px 30px rgba(0,0,0,.35)';
        return 'ok';
      },
      { marks, tilt }
    );
    if (ok !== 'ok') {
      console.warn(`skip ${meta.pageId} v${v}: ${ok}`);
      continue;
    }
    const box = await page.locator('.page').boundingBox();
    const id = `${meta.pageId}-v${v}`;
    await page.screenshot({
      path: path.join(casesDir, `${id}.jpg`),
      type: 'jpeg',
      quality: 82,
      clip: {
        x: Math.max(0, box.x - 24),
        y: Math.max(0, box.y - 24),
        width: box.width + 48,
        height: box.height + 48,
      },
      fullPage: true,
    });
    cases.push({ id, pageId: meta.pageId, activity: meta.activity, image: `${id}.jpg`, items });
  }
}

await browser.close();
fs.writeFileSync(path.join(casesDir, 'cases.json'), JSON.stringify(cases, null, 1));
const total = cases.reduce((s, c) => s + c.items.length, 0);
const wrong = cases.reduce((s, c) => s + c.items.filter((i) => !i.isCorrect).length, 0);
console.log(`wrote ${cases.length} cases (${total} items, ${wrong} child mistakes) to ${casesDir}`);
