import type { APIRequestContext, Page } from '@playwright/test';
import { expect, test } from '@playwright/test';

const password = 'AtlasTestPassword123!';

function uniqueEmail(prefix: string) {
  const stamp = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${prefix}-${stamp}@example.com`;
}

async function signUp(page: Page, email: string) {
  await page.goto('/sign-up');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel(/^password$/i).fill(password);
  await page.getByLabel(/confirm password/i).fill(password);
  await page.getByRole('button', { name: /create account/i }).click();
  await expect(
    page.getByText('Account created. Check your email for a verification link.'),
  ).toBeVisible();
}

async function signIn(page: Page, email: string, pass: string) {
  await page.goto('/sign-in');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(pass);
  await page.getByRole('button', { name: /sign in/i }).click();
}

async function fetchVerificationToken(request: APIRequestContext, email: string): Promise<string> {
  const response = await request.get(
    `/api/auth/debug/verification-token?email=${encodeURIComponent(email)}`,
  );
  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  return body.data.token as string;
}

test('signup creates unverified account', async ({ page }) => {
  const email = uniqueEmail('signup');

  await signUp(page, email);
  await signIn(page, email, password);

  await expect(page.getByText('Invalid email or password.')).toBeVisible();
});

test('verify link marks account verified and login works', async ({ page, request }) => {
  const email = uniqueEmail('verify');

  await signUp(page, email);
  const token = await fetchVerificationToken(request, email);

  await page.goto(`/verify-email?token=${encodeURIComponent(token)}`);
  await expect(page.getByText('Email verified. You can sign in.')).toBeVisible();

  await signIn(page, email, password);
  await expect(page).toHaveURL(/\/account/);
  await expect(page.getByText(email)).toBeVisible();
});

test('wrong password fails', async ({ page, request }) => {
  const email = uniqueEmail('wrongpass');

  await signUp(page, email);
  const token = await fetchVerificationToken(request, email);
  await page.goto(`/verify-email?token=${encodeURIComponent(token)}`);
  await expect(page.getByText('Email verified. You can sign in.')).toBeVisible();

  await signIn(page, email, 'WrongPassword!');
  await expect(page.getByText('Invalid email or password.')).toBeVisible();
});

test('logout ends session', async ({ page, request }) => {
  const email = uniqueEmail('logout');

  await signUp(page, email);
  const token = await fetchVerificationToken(request, email);
  await page.goto(`/verify-email?token=${encodeURIComponent(token)}`);
  await expect(page.getByText('Email verified. You can sign in.')).toBeVisible();

  await signIn(page, email, password);
  await expect(page).toHaveURL(/\/account/);

  await page.getByRole('button', { name: /sign out/i }).click();
  await expect(page).toHaveURL(/\/sign-in/);

  await page.goto('/account');
  await expect(page).toHaveURL(/\/sign-in/);
});

test('resend verification works', async ({ page, request }) => {
  const email = uniqueEmail('resend');

  await signUp(page, email);
  const tokenBefore = await fetchVerificationToken(request, email);

  await page.goto(`/verify-email?email=${encodeURIComponent(email)}`);
  await page.getByRole('button', { name: /resend verification email/i }).click();
  await expect(page.getByText(/verification email resent|link will be sent/i)).toBeVisible();

  const tokenAfter = await fetchVerificationToken(request, email);
  expect(tokenAfter).not.toEqual(tokenBefore);
});

test('account update works', async ({ page, request }) => {
  const email = uniqueEmail('account');
  const newPassword = 'AtlasUpdatedPassword123!';

  await signUp(page, email);
  const token = await fetchVerificationToken(request, email);
  await page.goto(`/verify-email?token=${encodeURIComponent(token)}`);
  await expect(page.getByText('Email verified. You can sign in.')).toBeVisible();

  await signIn(page, email, password);
  await expect(page).toHaveURL(/\/account/);

  await page.getByLabel(/^new password$/i).fill(newPassword);
  await page.getByLabel(/confirm new password/i).fill(newPassword);
  await page.getByRole('button', { name: /update account/i }).click();
  await expect(page.getByText('Account updated.')).toBeVisible();

  await page.getByRole('button', { name: /sign out/i }).click();
  await expect(page).toHaveURL(/\/sign-in/);

  await signIn(page, email, newPassword);
  await expect(page).toHaveURL(/\/account/);
});
