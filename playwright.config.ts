import { defineConfig, devices } from '@playwright/test';

// Run via `npm run test:e2e`, which starts the Firebase auth + Firestore
// emulators around this. The dev server runs in e2e mode (.env.e2e): demo
// project, emulators, MOCK_GEMINI — nothing here can reach production.
export default defineConfig({
  testDir: 'e2e',
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:3100',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npx vite --mode e2e --port 3100 --strictPort',
    url: 'http://localhost:3100/app.html',
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
