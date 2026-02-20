import type { APIRequestContext, Page } from '@playwright/test';
import { expect, test } from '@playwright/test';

const password = 'AtlasTestPassword123!';

function uniqueEmail(prefix: string) {
  const stamp = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${prefix}-${stamp}@example.com`;
}

async function signUp(page: Page, email: string) {
  await page.goto('/sign-up');
  await page.getByLabel(/display name/i).fill('Atlas Legal Tester');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel(/^password$/i).fill(password);
  await page.getByLabel(/confirm password/i).fill(password);
  await page.getByRole('button', { name: /create account/i }).click();
  await expect(page.getByRole('heading', { name: /you're in\./i })).toBeVisible();
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
        if (token) return token;
        lastError = new Error('Token missing in response.');
      }
    } catch (error) {
      lastError = error as Error;
    }

    await new Promise((resolve) => setTimeout(resolve, 300));
  }

  throw lastError ?? new Error('Token request failed.');
}

async function signIn(page: Page, email: string) {
  await page.goto('/sign-in');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: /sign in/i }).click();
  await expect(page).toHaveURL(/\/today/, { timeout: 15_000 });
}

async function createVerifiedUser(page: Page, request: APIRequestContext, prefix: string) {
  const email = uniqueEmail(prefix);
  await signUp(page, email);
  const token = await fetchVerificationToken(request, email);
  await page.goto(`/verify-email?token=${encodeURIComponent(token)}`);
  await expect(page.getByRole('heading', { name: /email verified\./i })).toBeVisible();
  await signIn(page, email);
}

test('legal pages are publicly accessible and render metadata', async ({ page }) => {
  const routes = [
    { href: '/legal/privacy', heading: /privacy policy/i },
    { href: '/legal/terms', heading: /terms of service/i },
    { href: '/legal/refunds', heading: /refund policy/i },
    { href: '/legal/changes', heading: /policy changes/i },
  ];

  for (const route of routes) {
    await page.goto(route.href);
    await expect(page).toHaveURL(new RegExp(`${route.href.replace('/', '\\/')}$`));
    await expect(page.getByRole('heading', { name: route.heading })).toBeVisible();
    await expect(page.getByText(/^Version$/i)).toBeVisible();
    await expect(page.getByText(/^Effective date$/i)).toBeVisible();
    await expect(page.getByText(/^Last updated$/i)).toBeVisible();
  }
});

test('landing footer legal links navigate to legal and support routes', async ({ page }) => {
  await page.goto('/landing');

  const navigation = page.getByRole('navigation', { name: /landing legal and support links/i });

  await navigation.getByRole('link', { name: /privacy policy/i }).click();
  await expect(page).toHaveURL(/\/legal\/privacy$/, { timeout: 15_000 });

  await page.goto('/landing');
  await navigation.getByRole('link', { name: /terms of service/i }).click();
  await expect(page).toHaveURL(/\/legal\/terms$/, { timeout: 15_000 });

  await page.goto('/landing');
  await navigation.getByRole('link', { name: /refund policy/i }).click();
  await expect(page).toHaveURL(/\/legal\/refunds$/, { timeout: 15_000 });

  await page.goto('/landing');
  await navigation.getByRole('link', { name: /support center/i }).click();
  await expect(page).toHaveURL(/\/support$/, { timeout: 15_000 });
});

test('signed-in users can discover legal links from account and pro', async ({ page, request }) => {
  await createVerifiedUser(page, request, 'legal-links');

  await page.goto('/account');
  const accountLegalNav = page.getByRole('navigation', {
    name: /account legal and support links/i,
  });
  await expect(accountLegalNav).toBeVisible();
  await expect(accountLegalNav.getByRole('link', { name: /privacy policy/i })).toBeVisible();
  await expect(accountLegalNav.getByRole('link', { name: /terms of service/i })).toBeVisible();
  await expect(accountLegalNav.getByRole('link', { name: /refund policy/i })).toBeVisible();
  await expect(accountLegalNav.getByRole('link', { name: /support center/i })).toBeVisible();

  await page.goto('/pro');
  const proLegalNav = page.getByRole('navigation', { name: /pro legal and support links/i });
  await expect(proLegalNav).toBeVisible();
  await expect(proLegalNav.getByRole('link', { name: /privacy policy/i })).toBeVisible();
  await expect(proLegalNav.getByRole('link', { name: /terms of service/i })).toBeVisible();
  await expect(proLegalNav.getByRole('link', { name: /refund policy/i })).toBeVisible();
  await expect(proLegalNav.getByRole('link', { name: /support center/i })).toBeVisible();
});
