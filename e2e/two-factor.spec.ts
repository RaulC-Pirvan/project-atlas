import type { APIRequestContext, Browser, Page } from '@playwright/test';
import { expect, test } from '@playwright/test';

import { generateTotpCode } from '../src/lib/auth/totp';

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

async function signInWithPassword(page: Page, email: string, pass = password) {
  await page.goto('/sign-in');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(pass);
  await page.getByRole('button', { name: /sign in/i }).click();
}

async function signOut(page: Page) {
  const sidebarSignOut = page
    .getByRole('complementary')
    .getByRole('button', { name: /sign out/i })
    .first();
  if (await sidebarSignOut.isVisible({ timeout: 1_000 }).catch(() => false)) {
    await sidebarSignOut.click();
    return;
  }

  const moreButton = page.getByRole('button', { name: /more/i });
  if (await moreButton.isVisible({ timeout: 1_000 }).catch(() => false)) {
    await moreButton.click();
    await page
      .getByRole('button', { name: /sign out/i })
      .first()
      .click();
    return;
  }

  await page
    .getByRole('button', { name: /sign out/i })
    .first()
    .click();
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

async function verifyEmail(page: Page, request: APIRequestContext, email: string) {
  const token = await fetchVerificationToken(request, email);
  await page.goto(`/verify-email?token=${encodeURIComponent(token)}`);
  await expect(page.getByRole('heading', { name: /email verified\./i })).toBeVisible();
}

async function waitForStableTotpCode(secret: string) {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const timestampMs = Date.now();
    const secondInStep = Math.floor(timestampMs / 1000) % 30;
    if (secondInStep <= 24) {
      return generateTotpCode(secret, { timestampMs });
    }
    await new Promise((resolve) => setTimeout(resolve, 800));
  }

  return generateTotpCode(secret, { timestampMs: Date.now() });
}

async function enableTwoFactor(page: Page) {
  await page.goto('/account');
  await page.getByRole('button', { name: /set up 2fa/i }).click();
  await expect(page.getByText(/scan qr code with your authenticator app/i)).toBeVisible();

  const secret = await page.locator('#manual-secret').inputValue();
  const setupCode = await waitForStableTotpCode(secret);
  await page.locator('#setup-code').fill(setupCode);
  await page.getByRole('button', { name: /enable 2fa/i }).click();

  const recoveryModal = page.getByRole('dialog', { name: /recovery codes/i });
  await expect(recoveryModal).toBeVisible();
  const firstRecoveryCode = await recoveryModal.locator('code').first().innerText();
  await recoveryModal.getByRole('button', { name: /i saved these codes/i }).click();

  return { secret, firstRecoveryCode };
}

async function createVerifiedSignedInUser(page: Page, request: APIRequestContext, prefix: string) {
  const email = uniqueEmail(prefix);
  await signUp(page, email);
  await verifyEmail(page, request, email);
  await signInWithPassword(page, email);
  await expect(page).toHaveURL(/\/today/, { timeout: 15_000 });
  return email;
}

async function signInSecondDevice(browser: Browser, email: string) {
  const context = await browser.newContext({ baseURL: 'http://localhost:3000' });
  const page = await context.newPage();
  await signInWithPassword(page, email);
  await expect(page).toHaveURL(/\/today/, { timeout: 15_000 });
  return { context, page };
}

test('2FA supports TOTP login and recovery-code fallback', async ({ page, request }) => {
  const email = await createVerifiedSignedInUser(page, request, 'two-factor-login');
  const { secret, firstRecoveryCode } = await enableTwoFactor(page);

  await signOut(page);
  await expect(page).toHaveURL(/\/sign-in/);

  await signInWithPassword(page, email);
  await expect(page.getByText(/two-factor verification is required/i)).toBeVisible();
  await page.getByLabel(/verification code/i).fill(await waitForStableTotpCode(secret));
  await page.getByRole('button', { name: /verify and sign in/i }).click();
  await expect(page).toHaveURL(/\/today/, { timeout: 15_000 });

  await signOut(page);
  await expect(page).toHaveURL(/\/sign-in/);

  await signInWithPassword(page, email);
  await expect(page.getByText(/two-factor verification is required/i)).toBeVisible();
  await page.getByRole('button', { name: /recovery code/i }).click();
  await page.getByLabel(/verification code/i).fill(firstRecoveryCode);
  await page.getByRole('button', { name: /verify and sign in/i }).click();
  await expect(page).toHaveURL(/\/today/, { timeout: 15_000 });

  await page.goto('/account');
  await expect(page.getByText(/active recovery codes:\s*9/i)).toBeVisible();
});

test('2FA disable removes challenge from subsequent sign-ins', async ({ page, request }) => {
  const email = await createVerifiedSignedInUser(page, request, 'two-factor-disable');
  const { secret } = await enableTwoFactor(page);

  await page.getByLabel(/type "disable 2fa"/i).fill('DISABLE 2FA');
  await page.getByLabel(/^current password$/i).fill(password);
  await page.locator('#disable-2fa-code').fill(await waitForStableTotpCode(secret));
  await page.getByRole('button', { name: /disable 2fa/i }).click();
  await expect(page.getByText(/two-factor authentication disabled\./i)).toBeVisible();

  await signOut(page);
  await expect(page).toHaveURL(/\/sign-in/);

  await signInWithPassword(page, email);
  await expect(page).toHaveURL(/\/today/, { timeout: 15_000 });
  await expect(page.getByText(/two-factor verification is required/i)).toHaveCount(0);
});

test('sign out all devices revokes sessions across contexts', async ({
  browser,
  page,
  request,
}) => {
  const email = await createVerifiedSignedInUser(page, request, 'session-revoke-all');
  const secondDevice = await signInSecondDevice(browser, email);

  await page.goto('/account');
  await page.getByRole('button', { name: /sign out all devices/i }).click();
  await expect(page).toHaveURL(/\/sign-in/, { timeout: 15_000 });

  await secondDevice.page.goto('/today');
  await expect(secondDevice.page).toHaveURL(/\/sign-in/, { timeout: 15_000 });
  await secondDevice.context.close();
});
