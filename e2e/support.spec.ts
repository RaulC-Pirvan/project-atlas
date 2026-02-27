import type { APIRequestContext, Page } from '@playwright/test';
import { expect, test } from '@playwright/test';

const password = 'AtlasTestPassword123!';

function uniqueEmail(prefix: string) {
  const stamp = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${prefix}-${stamp}@example.com`;
}

function uniqueClientAddress(prefix: string): string {
  const entropy = Math.random().toString(36).slice(2);
  return `e2e-${prefix}-${Date.now()}-${entropy}`;
}

async function isolateSupportIp(page: Page, ipAddress: string) {
  await page.route('**/api/support/tickets', async (route) => {
    const headers = {
      ...route.request().headers(),
      'x-forwarded-for': ipAddress,
    };
    await route.continue({ headers });
  });
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

test('signed-out users can submit support requests', async ({ page }) => {
  await isolateSupportIp(page, uniqueClientAddress('support-public-ui'));
  await page.goto('/support');

  await page.getByLabel(/name/i).fill('Atlas Visitor');
  await page.getByLabel(/email/i).fill(uniqueEmail('support-public'));
  await page.getByLabel(/subject/i).fill('Need help with account settings');
  await page
    .getByLabel(/message/i)
    .fill('I need help understanding how to update my account security settings.');

  await page.getByRole('button', { name: /send support request/i }).click();

  await expect(
    page.getByText(/support request sent\. we will get back to you soon\./i),
  ).toBeVisible();
});

test('signed-in users see prefilled support name and email', async ({ page, request }) => {
  const email = await createVerifiedUser(page, request, 'support-prefill');
  await page.goto('/support');

  await expect(page.getByLabel(/name/i)).toHaveValue('Atlas Tester');
  await expect(page.getByLabel(/email/i)).toHaveValue(email);
});

test('mobile sidebar support link opens contact hash route without runtime errors', async ({
  page,
  request,
}) => {
  const pageErrors: string[] = [];
  page.on('pageerror', (error) => {
    pageErrors.push(error.message);
  });

  await page.setViewportSize({ width: 390, height: 844 });
  await createVerifiedUser(page, request, 'support-mobile-hash');

  await page.getByRole('button', { name: /more/i }).click();
  await page
    .getByRole('complementary')
    .getByRole('link', { name: /^support$/i })
    .click();

  await expect(page).toHaveURL(/\/support#contact-form/, { timeout: 15_000 });
  await expect(page.locator('#contact-form')).toBeVisible();
  expect(pageErrors).toEqual([]);
});

test('support endpoint enforces submission rate limits', async ({ request }) => {
  const email = uniqueEmail('support-rate');
  const ipAddress = uniqueClientAddress('support-rate-limit');
  let rateLimited = false;

  for (let attempt = 0; attempt < 6; attempt += 1) {
    const response = await request.post('/api/support/tickets', {
      headers: { 'Content-Type': 'application/json', 'x-forwarded-for': ipAddress },
      data: {
        name: 'Rate Limit Tester',
        email,
        category: 'account',
        subject: `Rate test ${attempt}`,
        message: 'This request validates support endpoint rate-limit behavior in automated tests.',
        honeypot: '',
      },
    });

    if (response.status() === 429) {
      rateLimited = true;
      break;
    }

    expect(response.status()).toBe(200);
  }

  expect(rateLimited).toBe(true);
});

test('support endpoint rejects invalid payloads', async ({ request }) => {
  const ipAddress = uniqueClientAddress('support-invalid');
  const response = await request.post('/api/support/tickets', {
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': ipAddress },
    data: {
      name: 'A',
      email: 'not-an-email',
      category: 'invalid-category',
      subject: 'x',
      message: 'short',
      honeypot: '',
    },
  });

  expect(response.status()).toBe(400);
  const body = (await response.json()) as { ok: boolean; error?: { code?: string } };
  expect(body.ok).toBe(false);
  expect(body.error?.code).toBe('invalid_request');
});
