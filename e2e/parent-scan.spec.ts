import { test, expect, type Page } from '@playwright/test';
import { resetEmulators } from './helpers';

// The core parent loop in a real browser: sign up, photograph a worksheet,
// see the graded result, and the free-scan counter goes down.

test.use({ viewport: { width: 420, height: 900 }, locale: 'en-US' });

test.beforeEach(async ({ request }) => {
  await resetEmulators(request);
});

async function signUpAsParent(page: Page) {
  await page.goto('/app.html');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.getByText('Sign up', { exact: true }).click();
  await page.getByLabel('Your name').fill('E2E Parent');
  await page.getByLabel('Email address').fill(`ui-${Date.now()}@test.dev`);
  await page.getByLabel('Password', { exact: true }).fill('password123');
  await page.getByRole('button', { name: 'Sign up', exact: true }).click();
  await page.getByRole('button', { name: 'Skip for now' }).click();
}

async function scanWorksheet(page: Page) {
  await page.locator('input[type=file]').first().setInputFiles('e2e/fixtures/worksheet.jpg');
  const graded = page.waitForResponse((r) => r.url().includes('/api/analyze'));
  await page.getByRole('button', { name: 'Grade' }).click();
  return graded;
}

test('parent signs up, scans a worksheet and sees the graded result', async ({ page }) => {
  await signUpAsParent(page);
  await expect(page.getByText(/Free scans left today\s*2/)).toBeVisible();

  const res = await scanWorksheet(page);
  expect(res.status()).toBe(200);
  await expect(page.getByText('Explanations')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Scan again' })).toBeVisible();

  // Reload so the count comes from Firestore (bumped server-side), not
  // local state. The app reopens on the last result, so go home first.
  await page.reload();
  await page.getByRole('button', { name: 'Return to Home' }).click();
  await page.getByRole('button', { name: 'Start over' }).click();
  await expect(page.getByText(/Free scans left today\s*1/)).toBeVisible();
});
