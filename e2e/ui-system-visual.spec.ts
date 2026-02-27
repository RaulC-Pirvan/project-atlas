import type { APIRequestContext, Page } from '@playwright/test';
import { expect, test } from '@playwright/test';

const password = 'AtlasTestPassword123!';
const targetDate = '2026-01-05';
const targetMonth = '2026-01';
const targetWeekday = 1; // Monday
const testNowHeader = 'x-atlas-test-now';
const setupNowForTargetDate = '2026-01-05T12:00:00.000Z';

function uniqueEmail(prefix: string) {
  const stamp = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${prefix}-${stamp}@example.com`;
}

async function signUp(page: Page, email: string) {
  await page.goto('/sign-up');
  await page.getByLabel(/display name/i).fill('Atlas Visual Tester');
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
  await expect(page).toHaveURL(/\/today/, { timeout: 15_000 });
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

async function createHabit(
  request: APIRequestContext,
  title: string,
  weekdays: number[],
  createdAt: string,
) {
  const response = await request.post('/api/habits/debug/create', {
    data: { title, description: 'Visual regression fixture', weekdays, createdAt },
    timeout: 10_000,
  });
  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  return body.data.habit as { id: string; title: string };
}

async function createCompletion(request: APIRequestContext, habitId: string, date: string) {
  const response = await request.post('/api/completions', {
    data: { habitId, date, completed: true },
    headers: { [testNowHeader]: setupNowForTargetDate },
    timeout: 10_000,
  });
  expect(response.ok()).toBeTruthy();
}

async function applyVisualStabilityStyles(page: Page) {
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
}

async function setThemePreference(page: Page, theme: 'light' | 'dark', accent: string) {
  await page.evaluate(
    ({ themeValue, accentValue }) => {
      localStorage.setItem('atlas-theme', themeValue);
      localStorage.setItem('atlas-accent-preset', accentValue);
    },
    { themeValue: theme, accentValue: accent },
  );
}

test('desktop visual regression for calendar completion states in dark blue preset', async ({
  page,
  request,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'dark' });

  await createVerifiedUser(page, request, 'ui-system-visual-desktop');

  const deepWork = await createHabit(page.request, 'Deep Work', [targetWeekday], '2026-01-01');
  await createHabit(page.request, 'Hydrate', [targetWeekday], '2026-01-01');
  await createCompletion(page.request, deepWork.id, targetDate);

  await setThemePreference(page, 'dark', 'blue');
  await page.goto(`/calendar?month=${targetMonth}&date=${targetDate}`, {
    waitUntil: 'domcontentloaded',
  });
  await applyVisualStabilityStyles(page);

  await expect(page.getByRole('heading', { name: 'January 2026' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'January 5, 2026' })).toBeVisible();

  await expect(page.getByTestId('calendar-grid')).toHaveScreenshot(
    'ui-system-calendar-desktop-dark-blue.png',
    {
      animations: 'disabled',
      caret: 'hide',
      maxDiffPixelRatio: 0.02,
      maxDiffPixels: 20000,
      timeout: 10_000,
    },
  );
});

test('mobile visual regression for compact calendar sheet and habits list in light green preset', async ({
  page,
  request,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'light' });

  await createVerifiedUser(page, request, 'ui-system-visual-mobile');

  const stretch = await createHabit(page.request, 'Stretch', [targetWeekday], '2026-01-01');
  await createHabit(page.request, 'Read', [targetWeekday], '2026-01-01');
  await createCompletion(page.request, stretch.id, targetDate);

  await setThemePreference(page, 'light', 'green');
  await page.goto(`/calendar?month=${targetMonth}&date=${targetDate}`, {
    waitUntil: 'domcontentloaded',
  });
  await applyVisualStabilityStyles(page);

  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveScreenshot(
    'ui-system-calendar-mobile-sheet-light-green.png',
    {
      animations: 'disabled',
      caret: 'hide',
      maxDiffPixelRatio: 0.02,
      maxDiffPixels: 14000,
      timeout: 10_000,
    },
  );

  await page.goto('/habits', { waitUntil: 'domcontentloaded' });
  await applyVisualStabilityStyles(page);
  await expect(page.getByText('Stretch')).toBeVisible();
  await expect(page.locator('main')).toHaveScreenshot('ui-system-habits-mobile-light-green.png', {
    animations: 'disabled',
    caret: 'hide',
    maxDiffPixelRatio: 0.02,
    maxDiffPixels: 14000,
    timeout: 10_000,
  });
});
