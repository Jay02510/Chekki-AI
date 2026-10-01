import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { dirname, resolve } from 'path';
import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import { FAQ_DATA } from './src/data/faq';
import { ROUTE_META } from './src/data/seo';
// import analyzeHandler from './api/analyze'; // Removed to avoid build issues

// Custom middleware to handle Vercel-like API routes in Vite
const apiMiddleware = ({ mode }: { mode: string }) => {
  // Load ALL env vars (not just VITE_ prefixed ones) for the backend mock
  process.env = { ...process.env, ...loadEnv(mode, process.cwd(), '') };

  return {
    name: 'api-middleware',
    configureServer(server: any) {
      server.middlewares.use(async (req: any, res: any, next: any) => {
        // In dev mode, let Vite serve index.html for / and app.html for /app.html
        // We will remove the manual redirect so the landing page works.

        const apiPath = req.url?.split('?')[0];
        // Shared helpers under api/_lib/ (e.g. pricingTiers.ts) are imported
        // as plain ES modules by frontend code, not called as endpoints —
        // Vite serves them by their real file path, which happens to start
        // with /api/ too. Without this guard the block below tries to
        // dynamic-import them as a serverless handler and appends ".ts" a
        // second time (pricingTiers.ts -> pricingTiers.ts.ts), 500ing and
        // breaking any page that imports from api/_lib/ (landing page,
        // TeacherPage, SchoolsLandingPage, etc.) in dev only — production
        // builds bundle the import directly and never hit this middleware.
        if (apiPath && apiPath.startsWith('/api/') && !apiPath.startsWith('/api/_lib/')) {
          // vercel.json rewrites these to /api/redeem in production; this
          // dev middleware doesn't read vercel.json, so without this map
          // every one of them 500s locally with "Module not found" even
          // though the route is fine in production (audit: parent invite-
          // code redemption unusable in local dev, api/redeem-class-code.ts
          // etc. never existed as real files).
          const VERCEL_API_REWRITES: Record<string, string> = {
            'redeem-class-code': 'redeem',
            'redeem-school-code': 'redeem',
            'redeem-teacher-code': 'redeem',
            'redeem-invite': 'redeem',
          };
          const rawEndpointName = apiPath.replace('/api/', '');
          const endpointName = VERCEL_API_REWRITES[rawEndpointName] ?? rawEndpointName;

          // Parse body if method is POST
          if (req.method === 'POST') {
            const buffers = [];
            for await (const chunk of req) {
              buffers.push(chunk);
            }
            const body = Buffer.concat(buffers).toString();
            try {
              req.body = JSON.parse(body);
            } catch (e) {
              req.body = {};
            }
          }

          // Mock Vercel response object properties needed by the handler
          const vercelRes = {
            setHeader: (key: string, value: string) => {
              res.setHeader(key, value);
            },
            status: (code: number) => {
              res.statusCode = code;
              return {
                json: (data: any) => {
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify(data));
                },
                end: () => {
                  res.end();
                },
              };
            },
            json: (data: any) => {
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(data));
            },
            end: () => {
              res.end();
            },
          };

          // Dynamic import to avoid loading this during build
          try {
            console.log(`[Vite Dev API] Handling ${req.method} ${req.url}`);
            const { default: handler } = await import(`./api/${endpointName}.ts`);
            await handler(req as any, vercelRes as any);
          } catch (e: any) {
            console.error(`[Vite Dev API Error] for ${endpointName}:`, e);
            res.statusCode = 500;
            res.end(JSON.stringify({ error: 'INTERNAL_DEV_ERROR', details: e.message }));
          }
          return;
        }
        next();
      });
    },
  };
};

// Vercel preview deployments serve the same build as production with no
// distinguishing robots directive, so a stray preview URL is as indexable as
// the live site. VERCEL_ENV is set by Vercel at build time ('production' |
// 'preview' | 'development'); local builds run outside Vercel and leave it
// unset, which also skips this (correct — nothing to protect there).
const noindexOnPreview = () => ({
  name: 'noindex-on-preview',
  transformIndexHtml(html: string) {
    if (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== 'production') {
      return html.replace('<head>', '<head>\n  <meta name="robots" content="noindex, nofollow">');
    }
    return html;
  },
});

// Every landing route is the same index.html, so non-JS crawlers (GPTBot,
// ClaudeBot, PerplexityBot, Naver Yeti) would see the Korean homepage's head
// and fallback text everywhere. After build, write one file per route and
// language with its own <head>, hreflang and crawlable content; vercel.json
// rewrites the clean URLs to them.
const SITE = 'https://www.chekkiai.com';
const esc = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const enPath = (p: string) => (p === '/' ? '/en' : `/en${p}`);

const faqJsonLd = (lang: 'ko' | 'en') =>
  JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    inLanguage: lang,
    mainEntity: FAQ_DATA.map((f) => ({
      '@type': 'Question',
      name: lang === 'ko' ? f.questionKo : f.questionEn,
      acceptedAnswer: { '@type': 'Answer', text: lang === 'ko' ? f.answerKo : f.answerEn },
    })),
  }).replace(/</g, '\\u003c');

const faqBody = (lang: 'ko' | 'en') =>
  `<h1>${lang === 'ko' ? '채키 AI 자주 묻는 질문 (FAQ)' : 'Chekki AI — Frequently Asked Questions'}</h1>` +
  FAQ_DATA.map((f) =>
    lang === 'ko'
      ? `<section><h2>${esc(f.questionKo)}</h2><p>${esc(f.answerKo)}</p></section>`
      : `<section><h2>${esc(f.questionEn)}</h2><p>${esc(f.answerEn)}</p></section>`
  ).join('');

const BODIES: Record<keyof typeof ROUTE_META, Record<'ko' | 'en', string>> = {
  home: {
    ko: `<h1>채키 AI: 영어 숙제 AI 채점, 발음 코칭, 학원 학부모 리포트</h1>
      <p>채점은 채키가, 칭찬은 엄마가. 아이가 종이에 푼 영어 숙제를 사진 한 장으로 5초 안에 채점하고, 영어에 자신 없는 엄마도 아이를 도울 수 있도록 한국어 코칭 가이드와 원어민 발음을 제공합니다.</p>
      <ul>
        <li>영유·어학원 교재와 시판 교재 모두 템플릿 없이 AI(Google Gemini 멀티모달 OCR)로 채점.</li>
        <li>북미 표준 영어 음성 합성·음성 인식 기반 어린이 발음 코칭.</li>
        <li>무료: 하루 3회 스캔. Pro: 무제한 스캔.</li>
        <li>학원용: 원어민 선생님 수업 기록을 한국인 선생님 검토 후 카카오톡 학부모 리포트로 발송.</li>
      </ul>
      <p><a href="/faq">자주 묻는 질문</a> &middot; <a href="/schools">학원용 채키 AI</a> &middot; <a href="/en">English</a></p>`,
    en: `<h1>Chekki AI: AI Homework Help for Korean Families and English-Language Academies</h1>
      <p>Chekki AI helps parents check their child's paper homework in seconds using AI-powered worksheet scanning and pronunciation coaching, and helps English-language academies (hagwons) automate class logging and Korean-language parent reporting.</p>
      <ul>
        <li>Scan any handwritten worksheet or academy workbook and get instant answer checking, powered by Google Gemini multimodal OCR.</li>
        <li>Pronunciation coaching using North American English text-to-speech and speech recognition, calibrated for children.</li>
        <li>Free tier: 3 scans per day. Pro tier: unlimited scans.</li>
        <li>For academies: Foreign Teacher class logs are turned into Korean-language KakaoTalk parent updates, reviewed by a Korean Teacher before sending.</li>
      </ul>
      <p><a href="/en/faq">Frequently asked questions</a> &middot; <a href="/en/schools">Chekki AI for academies</a> &middot; <a href="/">한국어</a></p>`,
  },
  faq: {
    ko: faqBody('ko') + `<p><a href="/">채키 AI 홈</a> &middot; <a href="/schools">학원용 채키 AI</a> &middot; <a href="/en/faq">English</a></p>`,
    en: faqBody('en') + `<p><a href="/en">Chekki AI home</a> &middot; <a href="/en/schools">Chekki AI for academies</a> &middot; <a href="/faq">한국어</a></p>`,
  },
  schools: {
    ko: `<h1>학원용 채키 AI: 어학원 숙제 자동 채점과 학부모 리포트</h1>
      <p>정답지는 한 번만 등록하세요. 가정 숙제 스캔은 그 정답지 기준으로 자동 채점되고, 보강할 내용은 다음 수업 전에 미리 파악되며, 학부모 리포트까지 한 번에 정리됩니다.</p>
      <ul>
        <li>원어민 선생님(FT)은 30초 안에 수업 기록 작성, 한국인 선생님(KT)이 검토 후 카카오톡 학부모 리포트 발송.</li>
        <li>AI 추측이 아닌 학급의 실제 주간 정답지로 채점합니다.</li>
        <li>오답 맞춤 복습 프린트와 학원 브랜드 성적표.</li>
        <li>원장님 대시보드로 반·선생님 전체 현황 확인.</li>
        <li>요금제: 7일 무료 학원 체험, 공부방/개인 교습소, 스타터 학원 패키지, 마스터 스쿨 프로, 대형 학원 & 프랜차이즈.</li>
      </ul>
      <p><a href="/faq">자주 묻는 질문</a> &middot; <a href="/">학부모용 채키 AI</a> &middot; <a href="/teacher">선생님·원장님 로그인</a> &middot; <a href="/en/schools">English</a></p>`,
    en: `<h1>Chekki AI for English Academies: Homework Grading and Parent Reporting</h1>
      <p>Upload the week's answer key once, autograde every home scan against it, and know exactly what to reteach — before the parent report even goes out.</p>
      <ul>
        <li>Foreign Teacher (FT) logs class in under 30 seconds; a Korean Teacher (KT) reviews the AI-drafted KakaoTalk parent update before sending.</li>
        <li>Grades against the class's actual weekly answer key, not an AI guess.</li>
        <li>Printable review sheets from each student's wrong answers, and academy-branded report cards.</li>
        <li>Director dashboard across classes and teachers.</li>
        <li>Plans: 7-day free trial, solo tutor and study room, starter academy, School Pro, large academy and franchise.</li>
      </ul>
      <p><a href="/en/faq">FAQ</a> &middot; <a href="/en">Chekki AI for families</a> &middot; <a href="/teacher">Teacher &amp; Director portal</a> &middot; <a href="/schools">한국어</a></p>`,
  },
};

const prerenderRoutes = () => ({
  name: 'prerender-routes',
  apply: 'build' as const,
  closeBundle() {
    const base = readFileSync(resolve(__dirname, 'dist/index.html'), 'utf8');
    for (const key of Object.keys(ROUTE_META) as (keyof typeof ROUTE_META)[]) {
      const { path } = ROUTE_META[key];
      for (const lang of ['ko', 'en'] as const) {
        const { title, description } = ROUTE_META[key][lang];
        const url = SITE + (lang === 'en' ? enPath(path) : path);
        let html = base
          .replace(/<html lang="[^"]*"/, `<html lang="${lang}"`)
          .replace(/<title>[^<]*<\/title>/, `<title>${esc(title)}</title>`)
          .replace(/(<meta name="description" content=")[^"]*/, `$1${esc(description)}`)
          .replace(/(<meta property="og:title" content=")[^"]*/, `$1${esc(title)}`)
          .replace(/(<meta property="og:description" content=")[^"]*/, `$1${esc(description)}`)
          .replace(/(<meta property="og:url" content=")[^"]*/, `$1${url}`)
          .replace(/(<meta property="og:locale" content=")[^"]*/, `$1${lang === 'ko' ? 'ko_KR' : 'en_US'}`)
          .replace(/(<meta property="og:locale:alternate" content=")[^"]*/, `$1${lang === 'ko' ? 'en_US' : 'ko_KR'}`)
          .replace(/(<link rel="canonical" href=")[^"]*/, `$1${url}`)
          .replace(/(hreflang="ko" href=")[^"]*/, `$1${SITE}${path}`)
          .replace(/(hreflang="en" href=")[^"]*/, `$1${SITE}${enPath(path)}`)
          .replace(/(hreflang="x-default" href=")[^"]*/, `$1${SITE}${path}`)
          .replace(/<main class="sr-only">[\s\S]*?<\/main>/, `<main class="sr-only">${BODIES[key][lang]}</main>`)
          // base: './' would resolve to /en/assets/... under /en/faq.
          .replace(/(src|href)="\.\//g, '$1="/');
        if (key === 'faq') {
          html = html.replace(
            /<script type="application\/ld\+json">\s*\{\s*"@context": "https:\/\/schema.org",\s*"@type": "FAQPage"[\s\S]*?<\/script>/,
            `<script type="application/ld+json">${faqJsonLd(lang)}</script>`
          );
        }
        const file = (lang === 'en' ? enPath(path) : path === '/' ? '/index' : path) + '.html';
        mkdirSync(dirname(resolve(__dirname, 'dist' + file)), { recursive: true });
        writeFileSync(resolve(__dirname, 'dist' + file), html);
      }
    }
  },
});

export default defineConfig(({ mode }) => ({
  base: './',
  plugins: [react(), noindexOnPreview(), prerenderRoutes(), ...(mode === 'development' ? [apiMiddleware({ mode })] : [])],
  server: {
    port: 3000,
    host: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    chunkSizeWarningLimit: 3000,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        app: resolve(__dirname, 'app.html'),
      },
      output: {
        manualChunks(id) {
          // xlsx is only dynamically imported inside StudentInvitePanel's
          // Excel-upload handler — dumping it into the eager `vendor` chunk
          // (like everything else in node_modules) would defeat that lazy
          // load and add ~370KB gzip to every page load for a feature only
          // directors/KTs use, and rarely.
          if (id.includes('node_modules/xlsx')) {
            return undefined;
          }
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
      },
    },
  },
}));
