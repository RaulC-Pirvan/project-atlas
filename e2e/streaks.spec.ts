import type { APIRequestContext, Page } from '@playwright/test';
import { expect, test } from '@playwright/test';

const password = 'AtlasTestPassword123!';

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
  const payload = { title, description: 'Streak test', weekdays };
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

test('streaks update after completion toggle', async ({ page, request }) => {
  await createVerifiedUser(page, request, 'streaks-update');
  const habitTitle = uniqueTitle('Journal');
  await createHabit(page, habitTitle, [1, 2, 3, 4, 5, 6, 7]);

  const today = new Date();
  const dateKey = utcDateKey(today);
  const monthKey = utcMonthKey(today);

  await page.goto(`/calendar?month=${monthKey}&date=${dateKey}`);

  const panel = page.getByTestId('streaks-panel');
  await expect(panel).toContainText(/begin your first streak/i);

  const checkbox = page.getByRole('checkbox', { name: new RegExp(habitTitle, 'i') });
  await checkbox.click();
  await expect(checkbox).toHaveAttribute('aria-checked', 'true');

  await expect(panel).not.toContainText(/begin your first streak/i);

  const row = panel.getByText(habitTitle).locator('..');
  const values = row.locator('p');
  await expect(values.nth(1)).toHaveText('1');
  await expect(values.nth(2)).toHaveText('1');
});

test('empty state when no completions exist', async ({ page, request }) => {
  await createVerifiedUser(page, request, 'streaks-empty');
  const habitTitle = uniqueTitle('Stretch');
  await createHabit(page, habitTitle, [1, 2, 3, 4, 5, 6, 7]);

  const today = new Date();
  const dateKey = utcDateKey(today);
  const monthKey = utcMonthKey(today);

  await page.goto(`/calendar?month=${monthKey}&date=${dateKey}`);

  const panel = page.getByTestId('streaks-panel');
  await expect(panel).toContainText(/begin your first streak/i);
});
