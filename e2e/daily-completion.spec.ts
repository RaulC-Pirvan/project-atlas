import type { APIRequestContext, Page } from '@playwright/test';
import { expect, test } from '@playwright/test';

const password = 'AtlasTestPassword123!';
const retryableNetworkErrors = ['econnreset', 'econnrefused', 'socket hang up'];

function uniqueEmail(prefix: string) {
  const stamp = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${prefix}-${stamp}@example.com`;
}

function uniqueTitle(prefix: string) {
  const stamp = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${prefix} ${stamp}`;
}

function utcDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function utcMonthKey(date: Date): string {
  return date.toISOString().slice(0, 7);
}

function isoWeekday(date: Date): number {
  const day = date.getUTCDay();
  return day === 0 ? 7 : day;
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

function isRetryableNetworkError(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }
  const message = error.message.toLowerCase();
  return retryableNetworkErrors.some((fragment) => message.includes(fragment));
}

async function findHabitByTitle(request: APIRequestContext, title: string) {
  try {
    const response = await request.get('/api/habits', { timeout: 10_000 });
    if (!response.ok()) {
      return null;
    }
    const body = await response.json();
    const habits = (body?.data?.habits ?? []) as { id: string; title: string }[];
    return habits.find((habit) => habit.title === title) ?? null;
  } catch {
    return null;
  }
}

async function createHabit(page: Page, title: string, weekdays: number[]) {
  const payload = { title, description: 'Completion test', weekdays };
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await page.request.post('/api/habits', {
        data: payload,
        timeout: 10_000,
      });
      expect(response.ok()).toBeTruthy();
      const body = await response.json();
      return body.data.habit as { id: string; title: string };
    } catch (error) {
      lastError = error as Error;
      if (!isRetryableNetworkError(error)) {
        throw error;
      }
      const existingHabit = await findHabitByTitle(page.request, title);
      if (existingHabit) {
        return existingHabit;
      }
      await new Promise((resolve) => setTimeout(resolve, 250 * attempt));
    }
  }

  throw lastError ?? new Error('Unable to create habit.');
}

test('complete a habit for a selected day', async ({ page, request }) => {
  await createVerifiedUser(page, request, 'daily-complete');
  const today = new Date();
  const targetDate = utcDateKey(today);
  const targetMonth = utcMonthKey(today);
  const targetWeekday = isoWeekday(today);
  const habitTitle = uniqueTitle('Read');
  await createHabit(page, habitTitle, [targetWeekday]);

  await page.goto(`/calendar?month=${targetMonth}&date=${targetDate}`);

  const checkbox = page.getByRole('checkbox', { name: new RegExp(habitTitle, 'i') });
  await expect(checkbox).toHaveAttribute('aria-checked', 'false');
  await checkbox.click();
  await expect(checkbox).toHaveAttribute('aria-checked', 'true');
});

test('uncheck a completion', async ({ page, request }) => {
  await createVerifiedUser(page, request, 'daily-uncheck');
  const today = new Date();
  const targetDate = utcDateKey(today);
  const targetMonth = utcMonthKey(today);
  const targetWeekday = isoWeekday(today);
  const habitTitle = uniqueTitle('Stretch');
  await createHabit(page, habitTitle, [targetWeekday]);

  await page.goto(`/calendar?month=${targetMonth}&date=${targetDate}`);

  const checkbox = page.getByRole('checkbox', { name: new RegExp(habitTitle, 'i') });
  await checkbox.click();
  await expect(checkbox).toHaveAttribute('aria-checked', 'true');

  await checkbox.click();
  await expect(checkbox).toHaveAttribute('aria-checked', 'false');
});

test('prevent double completion', async ({ page, request }) => {
  await createVerifiedUser(page, request, 'daily-double');
  const today = new Date();
  const targetDate = utcDateKey(today);
  const targetWeekday = isoWeekday(today);
  const habitTitle = uniqueTitle('Hydrate');
  const habit = await createHabit(page, habitTitle, [targetWeekday]);

  const api = page.context().request;
  const payload = { habitId: habit.id, date: targetDate, completed: true };

  const first = await api.post('/api/completions', { data: payload });
  expect(first.ok()).toBeTruthy();

  const second = await api.post('/api/completions', { data: payload });
  expect(second.ok()).toBeTruthy();

  const list = await api.get(`/api/completions?date=${targetDate}`);
  expect(list.ok()).toBeTruthy();
  const body = await list.json();
  const matches = body.data.completions.filter(
    (completion: { habitId: string }) => completion.habitId === habit.id,
  );

  expect(matches).toHaveLength(1);
});
