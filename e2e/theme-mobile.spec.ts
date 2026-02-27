import type { APIRequestContext, Page } from '@playwright/test';
import { expect, test } from '@playwright/test';

const password = 'AtlasTestPassword123!';

function uniqueEmail(prefix: string) {
  const stamp = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${prefix}-${stamp}@example.com`;
}

function utcDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function utcMonthKey(date: Date): string {
  return date.toISOString().slice(0, 7);
}

async function signUp(page: Page, email: string) {
  await page.goto('/sign-up');
  await page.getByLabel(/display name/i).fill('Atlas Mobile Tester');
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

async function createDebugHabit(
  request: APIRequestContext,
  options: { title: string; weekdays: number[]; createdAt: string },
) {
  const response = await request.post('/api/habits/debug/create', {
    data: options,
    timeout: 10_000,
  });
  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  return body.data.habit as { id: string; title: string };
}

async function assertNoHorizontalOverflow(page: Page) {
  const hasOverflow = await page.evaluate(() => {
    return document.documentElement.scrollWidth > document.documentElement.clientWidth;
  });
  expect(hasOverflow).toBe(false);
}

test.describe('theme + mobile compact flows', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('persists theme and accent selection across routes and reload', async ({
    page,
    request,
  }) => {
    await createVerifiedUser(page, request, 'theme-mobile-persistence');

    await page.goto('/today');

    const accentSelect = page.getByLabel('Accent preset').first();
    await accentSelect.selectOption('pink');
    await page.getByRole('button', { name: /switch to dark theme/i }).click();

    await expect
      .poll(() => page.evaluate(() => document.documentElement.dataset.atlasAccent))
      .toBe('pink');
    await expect
      .poll(() => page.evaluate(() => document.documentElement.classList.contains('dark')))
      .toBe(true);

    await page.goto('/habits');
    await expect(page.getByLabel('Accent preset').first()).toHaveValue('pink');
    await expect
      .poll(() => page.evaluate(() => document.documentElement.classList.contains('dark')))
      .toBe(true);

    await page.goto('/account');
    await expect(page.getByLabel('Accent preset').first()).toHaveValue('pink');
    await expect
      .poll(() => page.evaluate(() => document.documentElement.dataset.atlasAccent))
      .toBe('pink');

    await page.reload();
    await expect(page.getByLabel('Accent preset').first()).toHaveValue('pink');
    await expect
      .poll(() => page.evaluate(() => document.documentElement.classList.contains('dark')))
      .toBe(true);
  });

  test('supports compact mobile interactions without overflow regressions', async ({
    page,
    request,
  }) => {
    await createVerifiedUser(page, request, 'theme-mobile-compact');

    const now = new Date();
    const todayDate = utcDateKey(now);
    const todayMonth = utcMonthKey(now);

    await createDebugHabit(page.request, {
      title: 'Mobile Compact Habit',
      weekdays: [1, 2, 3, 4, 5, 6, 7],
      createdAt: '2026-01-01',
    });

    await page.goto(`/calendar?month=${todayMonth}&date=${todayDate}`);
    await expect(page.getByRole('dialog')).toBeVisible();
    await assertNoHorizontalOverflow(page);

    const completionToggle = page.getByRole('checkbox', { name: /mobile compact habit/i }).first();
    await expect(completionToggle).toBeVisible();
    const toggleBox = await completionToggle.boundingBox();
    expect(toggleBox).not.toBeNull();
    expect(toggleBox!.height).toBeGreaterThanOrEqual(44);
    await completionToggle.click();
    await expect(completionToggle).toHaveAttribute('aria-checked', 'true');

    await page.goto('/habits');
    await assertNoHorizontalOverflow(page);
    await expect(page.getByRole('button', { name: /create habit/i })).toBeVisible();

    await page.goto('/account');
    await assertNoHorizontalOverflow(page);
    await expect(page.getByRole('button', { name: /sign out all devices/i })).toBeVisible();
  });
});
