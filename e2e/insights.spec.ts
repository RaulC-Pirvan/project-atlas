import { type APIRequestContext, expect, type Page, test } from '@playwright/test';

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

async function grantProEntitlement(page: Page) {
  const response = await page.request.post('/api/pro/debug/grant', { timeout: 10_000 });
  if (!response.ok()) {
    throw new Error(`Unable to grant Pro: ${response.status()}`);
  }
}

test('free users see insights preview and upgrade CTA', async ({ page, request }) => {
  await createVerifiedUser(page, request, 'insights-preview');

  await page.goto('/insights');
  await expect(page.getByTestId('insights-preview')).toBeVisible();
  await expect(page.getByTestId('insights-upgrade-card')).toBeVisible();
  await expect(page.getByRole('link', { name: /upgrade to pro/i })).toBeVisible();
});

test('pro users see full insights dashboard', async ({ page, request }) => {
  await createVerifiedUser(page, request, 'insights-pro');
  await grantProEntitlement(page);

  await page.goto('/insights');
  await expect(page.getByTestId('insights-dashboard')).toBeVisible();
  await expect(page.getByTestId('insights-upgrade-card')).toHaveCount(0);
});
