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

function uniqueTitle(prefix: string) {
  const stamp = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${prefix} ${stamp}`;
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
  const payload = { title, description: 'Completion test', weekdays };
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

test('complete a habit for a selected day', async ({ page, request }) => {
  await createVerifiedUser(page, request, 'daily-complete');
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
