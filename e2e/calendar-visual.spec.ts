import type { APIRequestContext, Page } from '@playwright/test';
import { expect, test } from '@playwright/test';

const password = 'AtlasTestPassword123!';
const targetDate = '2026-01-05';
const targetMonth = '2026-01';
const targetWeekday = 1; // Monday

function uniqueEmail(prefix: string) {
  const stamp = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${prefix}-${stamp}@example.com`;
}

async function signUp(page: Page, email: string) {
  await page.goto('/sign-up');
  await page.getByLabel(/display name/i).fill('Atlas Tester');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel(/^password$/i).fill(password);
  await page.getByLabel(/confirm password/i).fill(password);
  await page.getByRole('button', { name: /create account/i }).click();
  await expect(page.getByRole('heading', { name: /you're in\./i })).toBeVisible();
}

async function signIn(page: Page, email: string) {
  await page.goto('/sign-in');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: /sign in/i }).click();
  await expect(page).toHaveURL(/\/account/);
}

async function fetchVerificationToken(request: APIRequestContext, email: string): Promise<string> {
  const response = await request.get(
    `/api/auth/debug/verification-token?email=${encodeURIComponent(email)}`,
  );
  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  return body.data.token as string;
}

async function createVerifiedUser(page: Page, request: APIRequestContext, prefix: string) {
  const email = uniqueEmail(prefix);
  await signUp(page, email);
  const token = await fetchVerificationToken(request, email);
  await page.goto(`/verify-email?token=${encodeURIComponent(token)}`);
  await expect(page.getByRole('heading', { name: /email verified\./i })).toBeVisible();
  await signIn(page, email);
  return email;
}

async function createHabit(page: Page, title: string, weekdays: number[]) {
  const payload = { title, description: 'Visual test', weekdays };
  const result = await page.evaluate(async (data) => {
    const response = await fetch('/api/habits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await response.json().catch(() => null);
    return { ok: response.ok, json };
  }, payload);

  expect(result.ok).toBeTruthy();
  return result.json.data.habit as { id: string; title: string };
}

async function createCompletion(page: Page, habitId: string, date: string) {
  const payload = { habitId, date, completed: true };
  const result = await page.evaluate(async (data) => {
    const response = await fetch('/api/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await response.json().catch(() => null);
    return { ok: response.ok, json };
  }, payload);

  expect(result.ok).toBeTruthy();
}

test.use({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1 });

test('calendar visual regression', async ({ page, request }) => {
  await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'light' });

  await createVerifiedUser(page, request, 'calendar-visual');
  const readHabit = await createHabit(page, 'Read', [targetWeekday]);
  const hydrateHabit = await createHabit(page, 'Hydrate', [targetWeekday]);
  await createCompletion(page, readHabit.id, targetDate);
  await createCompletion(page, hydrateHabit.id, targetDate);

  await page.goto(`/calendar?month=${targetMonth}&date=${targetDate}`);
  await page.addStyleTag({
    content: `
      button[aria-label="Open Next.js Dev Tools"],
      button[aria-label="Open issues overlay"],
      button[aria-label="Collapse issues badge"],
      #__nextjs-devtools,
      #__nextjs-devtools-issues {
        display: none !important;
      }
      *,
      *::before,
      *::after {
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        transition-duration: 0s !important;
        transition-delay: 0s !important;
      }
    `,
  });

  await expect(page.getByRole('heading', { name: 'January 2026' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'January 5, 2026' })).toBeVisible();

  await expect(page).toHaveScreenshot('calendar-visual.png', {
    fullPage: true,
    animations: 'disabled',
    caret: 'hide',
  });
});
