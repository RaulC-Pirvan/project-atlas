import crypto from 'node:crypto';

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

async function resolveUserIdFromDebugGoogleSignIn(
  request: APIRequestContext,
  email: string,
): Promise<string> {
  const response = await request.post('/api/auth/debug/google-sign-in', {
    data: {
      email,
      providerAccountId: `billing-debug-${Date.now()}`,
    },
    timeout: 10_000,
  });
  expect(response.ok()).toBeTruthy();
  const body = (await response.json()) as {
    ok: boolean;
    data?: {
      user?: {
        id?: string;
      };
    };
  };

  const userId = body.data?.user?.id;
  expect(typeof userId).toBe('string');
  expect((userId ?? '').length).toBeGreaterThan(0);
  return userId as string;
}

function buildStripeSignatureHeader(args: {
  payload: string;
  secret: string;
  timestamp: number;
}): string {
  const signedPayload = `${args.timestamp}.${args.payload}`;
  const signature = crypto
    .createHmac('sha256', args.secret)
    .update(signedPayload, 'utf8')
    .digest('hex');
  return `t=${args.timestamp},v1=${signature}`;
}

test('billing smoke: checkout start, webhook effect visibility, and restore fallback', async ({
  page,
  request,
}) => {
  const email = await createVerifiedUser(page, request, 'pro-billing-smoke');
  const userId = await resolveUserIdFromDebugGoogleSignIn(request, email);
  await page.goto('/pro');
  const upgradeLink = page.getByRole('link', { name: /upgrade to pro/i });
  await expect(upgradeLink).toHaveAttribute('href', '/api/billing/stripe/checkout');

  const checkoutResponse = await page.request.get('/api/billing/stripe/checkout', {
    maxRedirects: 0,
    timeout: 15_000,
  });
  expect(checkoutResponse.status()).toBe(303);
  const location = checkoutResponse.headers()['location'] ?? '';
  expect(location).toContain('checkout.stripe.test/session/');

  const restoreBeforeResponse = await page.request.post('/api/pro/restore', {
    data: { trigger: 'account' },
    timeout: 10_000,
  });
  expect(restoreBeforeResponse.ok()).toBeTruthy();
  const restoreBeforeBody = (await restoreBeforeResponse.json()) as {
    ok: boolean;
    data: { outcome: string; entitlement: { isPro: boolean; status: string } };
  };
  expect(restoreBeforeBody.ok).toBe(true);
  expect(restoreBeforeBody.data.outcome).toBe('not_found');
  expect(restoreBeforeBody.data.entitlement.isPro).toBe(false);

  const webhookSecret = 'whsec_test';
  const webhookPayload = JSON.stringify({
    id: `evt_checkout_${Date.now()}`,
    type: 'checkout.session.completed',
    created: Math.floor(Date.now() / 1000),
    data: {
      object: {
        id: `cs_checkout_${Date.now()}`,
        payment_intent: `pi_checkout_${Date.now()}`,
        customer: `cus_checkout_${Date.now()}`,
        amount_total: 1999,
        currency: 'usd',
        metadata: {
          userId,
          productKey: 'pro_lifetime_v1',
        },
      },
    },
  });
  const webhookSignature = buildStripeSignatureHeader({
    payload: webhookPayload,
    secret: webhookSecret,
    timestamp: Math.floor(Date.now() / 1000),
  });
  const webhookResponse = await page.request.post('/api/billing/stripe/webhook', {
    data: webhookPayload,
    headers: {
      'Content-Type': 'application/json',
      'stripe-signature': webhookSignature,
    },
    timeout: 10_000,
  });
  expect(webhookResponse.ok()).toBeTruthy();
  const webhookBody = (await webhookResponse.json()) as {
    ok: boolean;
    data: { ignored: boolean };
  };
  expect(webhookBody.ok).toBe(true);
  expect(webhookBody.data.ignored).toBe(false);

  const entitlementResponse = await page.request.get('/api/pro/entitlement', { timeout: 10_000 });
  expect(entitlementResponse.ok()).toBeTruthy();
  const body = (await entitlementResponse.json()) as {
    ok: boolean;
    data: { isPro: boolean; status: string; source: string | null };
  };

  expect(body.ok).toBe(true);
  expect(body.data.isPro).toBe(true);
  expect(body.data.status).toBe('active');
  expect(body.data.source).toBe('stripe');

  const restoreAfterResponse = await page.request.post('/api/pro/restore', {
    data: { trigger: 'account' },
    timeout: 10_000,
  });
  expect(restoreAfterResponse.ok()).toBeTruthy();
  const restoreAfterBody = (await restoreAfterResponse.json()) as {
    ok: boolean;
    data: { outcome: string };
  };
  expect(restoreAfterBody.ok).toBe(true);
  expect(restoreAfterBody.data.outcome).toBe('already_active');
});
