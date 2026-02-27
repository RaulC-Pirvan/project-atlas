import type { APIRequestContext, Page } from '@playwright/test';
import { expect, test } from '@playwright/test';

const password = 'AtlasTestPassword123!';
const retryableNetworkErrors = ['econnreset', 'econnrefused', 'socket hang up'];
const everyDayWeekdays = [1, 2, 3, 4, 5, 6, 7];
const testNowHeader = 'x-atlas-test-now';

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

async function createDebugHabit(
  page: Page,
  title: string,
  weekdays: number[],
  createdAt: string,
): Promise<{ id: string; title: string }> {
  const response = await page.request.post('/api/habits/debug/create', {
    data: { title, description: 'Completion test', weekdays, createdAt },
    timeout: 10_000,
  });
  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  return body.data.habit as { id: string; title: string };
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

test('allows yesterday at 01:59 and blocks uncheck at 02:00', async ({ page, request }) => {
  await createVerifiedUser(page, request, 'daily-grace-window');
  const habitTitle = uniqueTitle('Grace');
  const habit = await createDebugHabit(page, habitTitle, everyDayWeekdays, '2026-02-01');
  const api = page.context().request;

  const allowed = await api.post('/api/completions', {
    data: { habitId: habit.id, date: '2026-02-11', completed: true },
    headers: { [testNowHeader]: '2026-02-12T01:59:00.000Z' },
  });
  expect(allowed.ok()).toBeTruthy();

  const blocked = await api.post('/api/completions', {
    data: { habitId: habit.id, date: '2026-02-11', completed: false },
    headers: { [testNowHeader]: '2026-02-12T02:00:00.000Z' },
  });
  expect(blocked.status()).toBe(400);
  const blockedBody = await blocked.json();
  expect(blockedBody.ok).toBe(false);
  expect(blockedBody.error.code).toBe('invalid_request');
  expect(blockedBody.error.message).toMatch(/yesterday can only be completed until 2:00 am/i);
});

test('keeps future-date guard and blocked-history guard with deterministic test time', async ({
  page,
  request,
}) => {
  await createVerifiedUser(page, request, 'daily-date-guards');
  const habitTitle = uniqueTitle('Date guard');
  const habit = await createDebugHabit(page, habitTitle, everyDayWeekdays, '2026-02-01');
  const api = page.context().request;

  const future = await api.post('/api/completions', {
    data: { habitId: habit.id, date: '2026-02-13', completed: true },
    headers: { [testNowHeader]: '2026-02-12T12:00:00.000Z' },
  });
  expect(future.status()).toBe(400);
  const futureBody = await future.json();
  expect(futureBody.ok).toBe(false);
  expect(futureBody.error.code).toBe('invalid_request');
  expect(futureBody.error.message).toMatch(/cannot complete future dates/i);

  const history = await api.post('/api/completions', {
    data: { habitId: habit.id, date: '2026-02-10', completed: true },
    headers: { [testNowHeader]: '2026-02-12T01:59:00.000Z' },
  });
  expect(history.status()).toBe(400);
  const historyBody = await history.json();
  expect(historyBody.ok).toBe(false);
  expect(historyBody.error.code).toBe('invalid_request');
  expect(historyBody.error.message).toMatch(/past dates cannot be completed/i);
});

test('today view shows progress strip and all-done completion state', async ({ page, request }) => {
  await createVerifiedUser(page, request, 'today-progress');
  const today = new Date();
  const targetWeekday = isoWeekday(today);
  const habitTitle = uniqueTitle('Today Complete');
  await createHabit(page, habitTitle, [targetWeekday]);

  await page.goto('/today');

  await expect(page.getByText('Done')).toBeVisible();
  await expect(page.getByText('Progress')).toBeVisible();
  await expect(page.getByText('0/1')).toBeVisible();

  const checkbox = page.getByRole('checkbox', { name: new RegExp(habitTitle, 'i') });
  await checkbox.click();
  await expect(checkbox).toHaveAttribute('aria-checked', 'true');

  await expect(page.getByText('Today complete', { exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: /open calendar/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /view achievements/i })).toBeVisible();
});
