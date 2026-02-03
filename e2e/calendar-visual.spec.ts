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
  await expect(page).toHaveURL(/\/calendar/);
}

async function fetchVerificationToken(request: APIRequestContext, email: string): Promise<string> {
  let lastError: Error | null = null;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      const response = await request.get(
        `/api/auth/debug/verification-token?email=${encodeURIComponent(email)}&t=${Date.now()}`,
        { timeout: 10_000 },
      );
      if (!response.ok()) {
        lastError = new Error(`Token request failed: ${response.status()}`);
      } else {
        const body = await response.json();
        const token = body?.data?.token as string | undefined;
        if (token) {
          return token;
        }
        lastError = new Error('Token missing in response.');
      }
    } catch (error) {
      lastError = error as Error;
    }
    await new Promise((resolve) => setTimeout(resolve, 300));
  }

  throw lastError ?? new Error('Token request failed.');
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

async function createHabit(request: APIRequestContext, title: string, weekdays: number[]) {
  const payload = { title, description: 'Visual test', weekdays };
  const response = await request.post('/api/habits', {
    data: payload,
    timeout: 10_000,
  });
  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  return body.data.habit as { id: string; title: string };
}

async function createCompletion(request: APIRequestContext, habitId: string, date: string) {
  const payload = { habitId, date, completed: true };
  const response = await request.post('/api/completions', {
    data: payload,
    timeout: 10_000,
  });
  expect(response.ok()).toBeTruthy();
}

test.use({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1 });

test('calendar visual regression', async ({ page, request }) => {
  test.setTimeout(30_000);
  await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'light' });
  page.setDefaultTimeout(10_000);

  await createVerifiedUser(page, request, 'calendar-visual');
  const readHabit = await createHabit(page.request, 'Read', [targetWeekday]);
  const hydrateHabit = await createHabit(page.request, 'Hydrate', [targetWeekday]);
  await createCompletion(page.request, readHabit.id, targetDate);
  await createCompletion(page.request, hydrateHabit.id, targetDate);

  await page.goto(`/calendar?month=${targetMonth}&date=${targetDate}`, {
    waitUntil: 'domcontentloaded',
  });
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

  const snapshotTarget = page.getByTestId('calendar-grid');
  await expect(snapshotTarget).toHaveScreenshot('calendar-grid.png', {
    animations: 'disabled',
    caret: 'hide',
    maxDiffPixelRatio: 0.02,
    maxDiffPixels: 20000,
    timeout: 10_000,
  });
});
