import 'dotenv/config';

import type { APIRequestContext, Page } from '@playwright/test';
import { expect, test } from '@playwright/test';

import { generateTotpCode } from '../src/lib/auth/totp';
import { prisma } from '../src/lib/db/prisma';

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

async function verifyAccount(page: Page, request: APIRequestContext, email: string) {
  const token = await fetchVerificationToken(request, email);
  await page.goto(`/verify-email?token=${encodeURIComponent(token)}`);
  await expect(page.getByRole('heading', { name: /email verified\./i })).toBeVisible();
}

async function promoteToAdmin(email: string) {
  await prisma.user.updateMany({ where: { email }, data: { role: 'admin' } });
}

async function getWithRetry(
  request: APIRequestContext,
  url: string,
  expectedStatus: number,
): Promise<import('@playwright/test').APIResponse> {
  let lastError: Error | null = null;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await request.get(url);
      if (response.status() === expectedStatus) {
        return response;
      }
      lastError = new Error(`Unexpected status ${response.status()} for ${url}`);
    } catch (error) {
      lastError = error as Error;
    }
    await new Promise((resolve) => setTimeout(resolve, 400));
  }

  throw lastError ?? new Error(`Request failed for ${url}`);
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

async function completeAdminTwoFactorEnrollment(page: Page) {
  await expect(page).toHaveURL(/\/(today|account\?admin2fa=required)/, { timeout: 15_000 });

  if (!page.url().includes('/account?admin2fa=required')) {
    return false;
  }

  await page.getByRole('button', { name: /set up 2fa/i }).click();
  await expect(page.getByText(/scan qr code with your authenticator app/i)).toBeVisible();

  const secret = await page.locator('#manual-secret').inputValue();
  const setupCode = await waitForStableTotpCode(secret);
  await page.locator('#setup-code').fill(setupCode);
  await page.getByRole('button', { name: /enable 2fa/i }).click();

  const recoveryModal = page.getByRole('dialog', { name: /recovery codes/i });
  await expect(recoveryModal).toBeVisible();
  await recoveryModal.getByRole('button', { name: /i saved these codes/i }).click();
  return true;
}

test.afterAll(async () => {
  await prisma.$disconnect();
});

test('non-admin users are redirected from /admin and blocked on admin APIs', async ({ page }) => {
  const email = uniqueEmail('admin-guard');

  await signUp(page, email);
  await verifyAccount(page, page.request, email);
  await signIn(page, email, password);
  await expect(page).toHaveURL(/\/today/, { timeout: 15_000 });
  await page.goto('/admin', { waitUntil: 'domcontentloaded' });
  await page.waitForURL(/\/today/);

  const response = await getWithRetry(page.request, '/api/admin/health', 403);
  expect(response.status()).toBe(403);
});

test('admin users can access the admin dashboard and APIs', async ({ page }) => {
  const email = uniqueEmail('admin-access');

  await signUp(page, email);
  await verifyAccount(page, page.request, email);
  await promoteToAdmin(email);

  await signIn(page, email, password);
  await completeAdminTwoFactorEnrollment(page);

  await page.goto('/admin');
  await expect(page.getByRole('heading', { name: /admin dashboard/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: /conversion/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: /health status/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: /users/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: /habits/i })).toBeVisible();
  await expect(page.getByText(/landing -> first completion rate/i).first()).toBeVisible();
  await expect(page.getByText(/funnel transitions \(read-only\)/i)).toBeVisible();
  await expect(page.getByText(/event totals \(read-only\)/i)).toBeVisible();

  const response = await getWithRetry(page.request, '/api/admin/health', 200);
  expect(response.status()).toBe(200);

  const exportResponse = await getWithRetry(page.request, '/api/admin/exports/users', 200);
  expect(exportResponse.status()).toBe(200);
  expect(exportResponse.headers()['content-type']).toContain('text/csv');
});
