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

async function signIn(page: Page, email: string, pass: string) {
  await page.goto('/sign-in');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(pass);
  await page.getByRole('button', { name: /sign in/i }).click();
}

async function fetchVerificationToken(request: APIRequestContext, email: string): Promise<string> {
  let lastError: Error | null = null;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      const response = await request.get(
        `/api/auth/debug/verification-token?email=${encodeURIComponent(email)}&t=${Date.now()}`,
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

async function waitForNewVerificationToken(
  request: APIRequestContext,
  email: string,
  previousToken: string,
): Promise<string> {
  let token = previousToken;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    token = await fetchVerificationToken(request, email);
    if (token !== previousToken) {
      return token;
    }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  return token;
}

test('signup creates unverified account', async ({ page }) => {
  const email = uniqueEmail('signup');

  await signUp(page, email);
  await signIn(page, email, password);

  await expect(
    page.getByText('Account not verified. Check your email for the verification link.'),
  ).toBeVisible();
});

test('verify link marks account verified and login works', async ({ page, request }) => {
  const email = uniqueEmail('verify');

  await signUp(page, email);
  const token = await fetchVerificationToken(request, email);

  await page.goto(`/verify-email?token=${encodeURIComponent(token)}`);
  await expect(page.getByRole('heading', { name: /email verified\./i })).toBeVisible();

  await signIn(page, email, password);
  await expect(page).toHaveURL(/\/calendar/, { timeout: 15_000 });
  await page.goto('/account');
  await expect(page.getByText(email)).toBeVisible();
});

test('wrong password fails', async ({ page, request }) => {
  const email = uniqueEmail('wrongpass');

  await signUp(page, email);
  const token = await fetchVerificationToken(request, email);
  await page.goto(`/verify-email?token=${encodeURIComponent(token)}`);
  await expect(page.getByRole('heading', { name: /email verified\./i })).toBeVisible();

  await signIn(page, email, 'WrongPassword!');
  await expect(page.getByText('Invalid email or password.')).toBeVisible();
});

test('logout ends session', async ({ page, request }) => {
  const email = uniqueEmail('logout');

  await signUp(page, email);
  const token = await fetchVerificationToken(request, email);
  await page.goto(`/verify-email?token=${encodeURIComponent(token)}`);
  await expect(page.getByRole('heading', { name: /email verified\./i })).toBeVisible();

  await signIn(page, email, password);
  await expect(page).toHaveURL(/\/calendar/, { timeout: 15_000 });

  await page
    .getByRole('navigation')
    .getByRole('button', { name: /sign out/i })
    .click();
  await expect(page).toHaveURL(/\/sign-in/);

  await page.goto('/account');
  await expect(page).toHaveURL(/\/sign-in/);
});

test('resend verification works', async ({ page, request }) => {
  const email = uniqueEmail('resend');

  await signUp(page, email);
  const tokenBefore = await fetchVerificationToken(request, email);

  await page.goto(`/verify-email?email=${encodeURIComponent(email)}`);
  const resendResponse = page.waitForResponse((response) =>
    response.url().includes('/api/auth/resend-verification'),
  );
  await page.getByRole('button', { name: /resend verification email/i }).click();
  await resendResponse;

  const tokenAfter = await waitForNewVerificationToken(request, email, tokenBefore);
  expect(tokenAfter).not.toEqual(tokenBefore);
});

test('account update works', async ({ page, request }) => {
  const email = uniqueEmail('account');
  const newPassword = 'AtlasUpdatedPassword123!';

  await signUp(page, email);
  const token = await fetchVerificationToken(request, email);
  await page.goto(`/verify-email?token=${encodeURIComponent(token)}`);
  await expect(page.getByRole('heading', { name: /email verified\./i })).toBeVisible();

  await signIn(page, email, password);
  await expect(page).toHaveURL(/\/calendar/, { timeout: 15_000 });
  await page.goto('/account');

  await page.getByLabel(/^new password$/i).fill(newPassword);
  await page.getByLabel(/confirm new password/i).fill(newPassword);
  await page.getByRole('button', { name: /update password/i }).click();
  await expect(page.getByText('Password updated.')).toBeVisible();

  await page
    .getByRole('navigation')
    .getByRole('button', { name: /sign out/i })
    .click();
  await expect(page).toHaveURL(/\/sign-in/);

  await signIn(page, email, newPassword);
  await expect(page).toHaveURL(/\/calendar/, { timeout: 15_000 });
  await page.goto('/account');
});

test('display name update works', async ({ page, request }) => {
  const email = uniqueEmail('display');

  await signUp(page, email);
  const token = await fetchVerificationToken(request, email);
  await page.goto(`/verify-email?token=${encodeURIComponent(token)}`);
  await expect(page.getByRole('heading', { name: /email verified\./i })).toBeVisible();

  await signIn(page, email, password);
  await expect(page).toHaveURL(/\/calendar/, { timeout: 15_000 });
  await page.goto('/account');

  await page.getByLabel(/^display name$/i).fill('Atlas Prime');
  await page.getByRole('button', { name: /update display name/i }).click();
  await expect(page.getByText('Display name updated.')).toBeVisible();
  await expect(page.getByText('Atlas Prime')).toBeVisible();
});

test('email update requires re-verification', async ({ page, request }) => {
  const email = uniqueEmail('email');
  const newEmail = uniqueEmail('email-updated');

  await signUp(page, email);
  const token = await fetchVerificationToken(request, email);
  await page.goto(`/verify-email?token=${encodeURIComponent(token)}`);
  await expect(page.getByRole('heading', { name: /email verified\./i })).toBeVisible();

  await signIn(page, email, password);
  await expect(page).toHaveURL(/\/calendar/, { timeout: 15_000 });
  await page.goto('/account');

  await page.getByLabel(/^email$/i).fill(newEmail);
  await page.getByLabel(/confirm password for email/i).fill(password);
  await page.getByRole('button', { name: /update email/i }).click();
  await expect(page.getByRole('heading', { name: /email updated/i })).toBeVisible();
  await page.getByRole('button', { name: /sign in again/i }).click();
  await expect(page).toHaveURL(/\/sign-in/);

  const updatedToken = await fetchVerificationToken(request, newEmail);
  await page.goto(`/verify-email?token=${encodeURIComponent(updatedToken)}`);
  await expect(page.getByRole('heading', { name: /email verified\./i })).toBeVisible();

  await signIn(page, newEmail, password);
  await expect(page).toHaveURL(/\/calendar/, { timeout: 15_000 });
  await page.goto('/account');
  await expect(page.getByText(newEmail)).toBeVisible();
});

test('account delete removes access', async ({ page, request }) => {
  const email = uniqueEmail('delete');

  await signUp(page, email);
  const token = await fetchVerificationToken(request, email);
  await page.goto(`/verify-email?token=${encodeURIComponent(token)}`);
  await expect(page.getByRole('heading', { name: /email verified\./i })).toBeVisible();

  await signIn(page, email, password);
  await expect(page).toHaveURL(/\/calendar/, { timeout: 15_000 });
  await page.goto('/account');

  await page.getByLabel(/^confirm$/i).fill('delete');
  await page.getByRole('button', { name: /request delete/i }).click();
  await expect(page.getByRole('heading', { name: /account deleted/i })).toBeVisible();
  await page.getByRole('button', { name: /create a new account/i }).click();
  await expect(page).toHaveURL(/\/sign-up/);

  await signIn(page, email, password);
  await expect(page.getByText('Invalid email or password.')).toBeVisible();
});
