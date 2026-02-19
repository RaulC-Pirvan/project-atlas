import type { APIRequestContext } from '@playwright/test';
import { expect, test } from '@playwright/test';

const password = 'AtlasTestPassword123!';

function uniqueEmail(prefix: string) {
  const stamp = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${prefix}-${stamp}@example.com`;
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

test('google oauth happy path signs in and lands on today', async ({ page }) => {
  await page.goto('/sign-in');
  await expect(page.getByRole('button', { name: /continue with google/i })).toBeVisible();

  await page.getByRole('button', { name: /continue with google/i }).click();
  await expect(page).toHaveURL(/\/today/, { timeout: 15_000 });

  await page.goto('/account');
  await expect(page.getByLabel(/^email$/i)).toHaveValue(/@example\.com$/i);
});

test('credentials fallback login still works when google sign-in is available', async ({
  page,
  request,
}) => {
  const email = uniqueEmail('oauth-fallback');

  await page.goto('/sign-up');
  await expect(page.getByRole('button', { name: /continue with google/i })).toBeVisible();
  await page.getByLabel(/display name/i).fill('Atlas Credentials User');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel(/^password$/i).fill(password);
  await page.getByLabel(/confirm password/i).fill(password);
  await page.getByRole('button', { name: /create account/i }).click();
  await expect(page.getByRole('heading', { name: /you're in\./i })).toBeVisible();

  const token = await fetchVerificationToken(request, email);
  await page.goto(`/verify-email?token=${encodeURIComponent(token)}`);
  await expect(page.getByRole('heading', { name: /email verified\./i })).toBeVisible();

  await page.goto('/sign-in');
  await expect(page.getByRole('button', { name: /continue with google/i })).toBeVisible();
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: /^sign in$/i }).click();
  await expect(page).toHaveURL(/\/today/, { timeout: 15_000 });
});
