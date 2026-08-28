import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
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

export default defineConfig(({ mode }) => ({
  base: './',
  plugins: [react(), noindexOnPreview(), ...(mode === 'development' ? [apiMiddleware({ mode })] : [])],
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
