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
        // Redirect root to app.html in dev mode if requested
        if (req.url === '/' || req.url === '/index.html') {
          req.url = '/app.html';
        }

        const apiPath = req.url?.split('?')[0];
        if (apiPath && apiPath.startsWith('/api/')) {
          const endpointName = apiPath.replace('/api/', '');

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
                }
              };
            },
            json: (data: any) => {
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(data));
            },
            end: () => {
              res.end();
            }
          };

          // Dynamic import to avoid loading this during build
          try {
            console.log(`[Vite Dev API] Handling ${req.method} ${req.url}`);
            const { default: handler } = await import(`./api/${endpointName}`);
            await handler(req as any, vercelRes as any);
          } catch (e: any) {
            console.error(`[Vite Dev API Error] for ${endpointName}:`, e);
            res.statusCode = 500;
            res.end(JSON.stringify({ error: "INTERNAL_DEV_ERROR", details: e.message }));
          }
          return;
        }
        next();
      });
    },
  };
};

export default defineConfig(({ mode }) => ({
  base: './',
  plugins: [react(), ...(mode === 'development' ? [apiMiddleware({ mode })] : [])],
  server: {
    port: 3000,
    host: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        app: resolve(__dirname, 'app.html')
      },
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        }
      }

    }
  }
}));
