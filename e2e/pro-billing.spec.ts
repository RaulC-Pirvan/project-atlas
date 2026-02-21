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
}

test('optional smoke: checkout entrypoint and entitlement visibility', async ({
  page,
  request,
}) => {
  test.skip(
    !process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_PRICE_PRO_LIFETIME,
    'Requires Stripe checkout env vars for optional billing smoke.',
  );

  await createVerifiedUser(page, request, 'pro-billing-smoke');
  await page.goto('/pro');
  const upgradeLink = page.getByRole('link', { name: /upgrade to pro/i });
  await expect(upgradeLink).toHaveAttribute('href', '/api/billing/stripe/checkout');

  const checkoutResponse = await page.request.get('/api/billing/stripe/checkout', {
    maxRedirects: 0,
    timeout: 15_000,
  });
  expect(checkoutResponse.status()).toBe(303);
  const location = checkoutResponse.headers()['location'] ?? '';
  expect(location.length).toBeGreaterThan(0);

  // Optional smoke keeps checkout external and simulates completed purchase via test-only grant.
  const grantResponse = await page.request.post('/api/pro/debug/grant', { timeout: 10_000 });
  expect(grantResponse.ok()).toBeTruthy();

  const entitlementResponse = await page.request.get('/api/pro/entitlement', { timeout: 10_000 });
  expect(entitlementResponse.ok()).toBeTruthy();
  const body = (await entitlementResponse.json()) as {
    ok: boolean;
    data: { isPro: boolean; status: string };
  };

  expect(body.ok).toBe(true);
  expect(body.data.isPro).toBe(true);
  expect(body.data.status).toBe('active');
});
