import { test, expect, type Page } from '@playwright/test';
import { resetEmulators, seedDoc, setClaims, signUp } from './helpers';

// The Schools dashboard (/teacher) in a real browser, against the emulators:
// sign-in, the director dashboard, a student's drawer, settings, the FT
// first-login welcome, and a parent account landing here by mistake.

test.use({ viewport: { width: 1280, height: 900 }, locale: 'en-US' });

const SCHOOL = 'school_e2e';

test.beforeEach(async ({ request, page }) => {
  await resetEmulators(request);
  await page.addInitScript(() => localStorage.setItem('chekki_lang', 'en'));
});

async function staffAccount(request: any, profile: Record<string, unknown>) {
  const acct = await signUp(request);
  // The app writes uid onto every user doc (services/database.ts createUser).
  await seedDoc(request, `users/${acct.uid}`, { uid: acct.uid, email: acct.email, ...profile });
  if (profile.role) await setClaims(request, acct.uid, { role: profile.role, schoolId: profile.schoolId ?? null });
  return acct;
}

async function logIn(page: Page, email: string) {
  await page.goto('/teacher');
  await page.getByPlaceholder(/@school\.com/).fill(email);
  await page.getByPlaceholder('••••••••').first().fill('password123');
  await page.getByRole('button', { name: 'Log In' }).click();
}

async function seedDirectorSchool(request: any) {
  const director = await staffAccount(request, {
    name: 'E2E Director',
    role: 'director',
    schoolId: SCHOOL,
    schoolName: 'E2E Academy',
    plan: 'free',
  });
  await seedDoc(request, `schools/${SCHOOL}`, { name: 'E2E Academy', ownerUid: director.uid });
  await seedDoc(request, 'classes/class_e2e', {
    name: 'E2E Class',
    level: '7-year-old',
    schoolId: SCHOOL,
    teacherUid: director.uid,
    activeWeekNumber: 1,
  });
  const student = await signUp(request);
  await seedDoc(request, `users/${student.uid}`, {
    uid: student.uid,
    email: student.email,
    name: 'E2E Parent',
    studentName: 'Min-jun',
    classId: 'class_e2e',
    classStatus: 'active',
    schoolId: SCHOOL,
    plan: 'free',
  });
  return { director, student };
}

test('a director signs in and sees their class', async ({ page, request }) => {
  const { director } = await seedDirectorSchool(request);
  await logIn(page, director.email);
  await expect(page.getByLabel('Choose class')).toContainText('E2E Class');
});

test('a wrong password shows one generic error', async ({ page, request }) => {
  const { director } = await seedDirectorSchool(request);
  await page.goto('/teacher');
  await page.getByPlaceholder(/@school\.com/).fill(director.email);
  await page.getByPlaceholder('••••••••').first().fill('wrong-password');
  await page.getByRole('button', { name: 'Log In' }).click();
  await expect(page.getByText('Incorrect email or password.')).toBeVisible();
});

test("a director opens a student's drawer and flags them", async ({ page, request }) => {
  const { director } = await seedDirectorSchool(request);
  await logIn(page, director.email);
  await page.getByRole('button', { name: 'Students' }).first().click();
  await page.getByRole('button', { name: 'Details' }).filter({ visible: true }).first().click();

  const drawer = page.getByRole('dialog', { name: /Min-jun/ });
  await expect(drawer).toBeVisible();
  await drawer.getByRole('button', { name: 'Flag for Director' }).click();
  await drawer.getByPlaceholder(/Reason for flagging/).fill('Needs help with short vowels');
  await drawer.getByRole('button', { name: 'Submit Flag' }).click();
  await expect(drawer.getByText('Flagged for Director')).toBeVisible();

  await drawer.getByRole('button', { name: 'Close' }).first().click();
  await expect(drawer).toBeHidden();
});

test('settings open from the header and close again', async ({ page, request }) => {
  const { director } = await seedDirectorSchool(request);
  await logIn(page, director.email);
  await page.getByRole('button', { name: 'Teacher settings' }).first().click();
  const settings = page.getByRole('dialog', { name: 'Director settings' });
  await expect(settings).toBeVisible();
  await expect(settings).toContainText(director.email);
  await settings.getByRole('button', { name: 'Close' }).click();
  await expect(settings).toBeHidden();
});

test('an invited FT sees the welcome once, then the dashboard', async ({ page, request }) => {
  const ft = await staffAccount(request, {
    name: 'E2E Teacher',
    role: 'teacher',
    educatorRole: 'ft',
    schoolId: SCHOOL,
    schoolName: 'E2E Academy',
    plan: 'free',
  });
  await logIn(page, ft.email);
  await expect(page.getByText('Foreign Teacher (FT) Access')).toBeVisible();
  await page.getByRole('button', { name: /Next: Class Setup/ }).click();
  await page.getByRole('button', { name: /Done — Enter Dashboard/ }).click();
  await expect(page.getByRole('button', { name: 'Teacher settings' }).first()).toBeVisible();

  await page.reload();
  await expect(page.getByRole('button', { name: 'Teacher settings' }).first()).toBeVisible();
  await expect(page.getByText('Foreign Teacher (FT) Access')).toBeHidden();
});

test('a parent account signing in here is pointed back to the parent app', async ({ page, request }) => {
  const parent = await signUp(request);
  await seedDoc(request, `users/${parent.uid}`, { uid: parent.uid, email: parent.email, name: 'E2E Parent', plan: 'free' });
  await logIn(page, parent.email);
  await expect(page.getByText("You're signed in as a parent")).toBeVisible();
});
