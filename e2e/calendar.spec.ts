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

test('calendar navigation opens daily view', async ({ page, request }) => {
  await createVerifiedUser(page, request, 'calendar-nav');

  await page.goto('/calendar?month=2026-01');
  await expect(page.getByRole('heading', { name: /calendar/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'January 2026' })).toBeVisible();

  await page.getByRole('link', { name: /next month/i }).click();
  await expect(page).toHaveURL(/calendar\?month=2026-02/);

  const febLink = page.getByRole('link', {
    name: /open daily view for February 5, 2026/i,
  });
  await expect(febLink).toBeVisible({ timeout: 15_000 });
  await febLink.click();
  await expect(page.getByRole('heading', { name: /daily view/i })).toBeVisible();
  await expect(page.getByText('February 5, 2026')).toBeVisible();
});
