import type { APIRequestContext, Page } from '@playwright/test';
import { expect, test } from '@playwright/test';

const password = 'AtlasTestPassword123!';

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

async function openHabits(page: Page) {
  await page.goto('/habits');
  await expect(page.getByRole('heading', { name: /habits/i })).toBeVisible();
}

test('create habit with weekdays', async ({ page, request }) => {
  await createVerifiedUser(page, request, 'habit-create');
  await openHabits(page);

  await page.getByLabel(/^title$/i).fill('Read 10 pages');
  await page.getByLabel(/description/i).fill('Read nightly');

  for (const day of ['Tue', 'Thu', 'Sat', 'Sun']) {
    await page.getByRole('button', { name: day }).click();
  }

  await page.getByRole('button', { name: /create habit/i }).click();

  await expect(page.getByText('Read 10 pages')).toBeVisible();
});

test('edit habit title and weekdays', async ({ page, request }) => {
  await createVerifiedUser(page, request, 'habit-edit');
  await openHabits(page);

  await page.getByLabel(/^title$/i).fill('Read 10 pages');
  await page.getByRole('button', { name: /create habit/i }).click();
  await expect(page.getByText('Read 10 pages')).toBeVisible();

  await page.getByRole('button', { name: 'Edit' }).click();

  await page
    .getByLabel(/^title$/i)
    .nth(1)
    .fill('Read 20 pages');
  await page.getByRole('button', { name: 'Sun' }).nth(1).click();
  await page.getByRole('button', { name: /save changes/i }).click();

  await expect(page.getByText('Read 20 pages')).toBeVisible();
});

test('delete habit removes it from the list', async ({ page, request }) => {
  await createVerifiedUser(page, request, 'habit-delete');
  await openHabits(page);

  await page.getByLabel(/^title$/i).fill('Stretch');
  await page.getByRole('button', { name: /create habit/i }).click();
  await expect(page.getByText('Stretch')).toBeVisible();

  await page.getByRole('button', { name: 'Delete' }).click();
  await page.getByRole('button', { name: /delete habit/i }).click();

  await expect(page.getByText('Stretch', { exact: true })).toHaveCount(0);
  await expect(page.getByText('No habits yet.')).toBeVisible();
});

test('validation blocks empty weekday selection', async ({ page, request }) => {
  await createVerifiedUser(page, request, 'habit-validate');
  await openHabits(page);

  await page.getByLabel(/^title$/i).fill('Focus');

  for (const day of ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']) {
    await page.getByRole('button', { name: day }).click();
  }

  await page.getByRole('button', { name: /create habit/i }).click();

  await expect(page.getByText('Select at least one weekday.')).toBeVisible();
});
