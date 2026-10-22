import { defineConfig } from '@playwright/test';

// Real-Gemini smoke test: `npm run test:smoke`. Not in CI (costs money,
// needs API_KEY). Run it before and after any @google/genai upgrade.
export default defineConfig({
  testDir: 'smoke',
  workers: 1,
  timeout: 180_000,
  reporter: 'list',
  use: { baseURL: 'http://localhost:3101' },
  webServer: {
    command: 'npx vite --mode smoke --port 3101 --strictPort',
    url: 'http://localhost:3101/app.html',
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
