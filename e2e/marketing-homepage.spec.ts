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

test('marketing homepage introduces the product for signed-out visitors', async ({ page }) => {
  await page.goto('/landing');
  await expect(page.getByRole('heading', { name: /habits that follow your week/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /create your account/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /^support$/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: /how atlas works/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: /create your routine once/i })).toBeVisible();
  await expect(
    page.getByRole('heading', { name: /set reminders that fit your day/i }),
  ).toBeVisible();
  await expect(page.getByRole('heading', { name: /complete habits in seconds/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: /review progress with context/i })).toBeVisible();
  await expect(page.getByText(/step 1 - create/i)).toBeVisible();
  await expect(page.getByText(/step 2 - remind/i)).toBeVisible();
  await expect(page.getByText(/step 3 - complete/i)).toBeVisible();
  await expect(page.getByText(/step 4 - review/i)).toBeVisible();
  await expect(page.getByRole('heading', { name: /today \+ calendar workflow/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: /insights \(analytics\)/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: /achievements \+ milestones/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: /^reminders$/i })).toBeVisible();
  await expect(
    page.getByRole('heading', { name: /works even when your signal drops/i }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: /late-night grace window \(until 02:00\)/i }),
  ).toBeVisible();
  await expect(page.getByRole('heading', { name: /free vs pro at a glance/i })).toBeVisible();
  await expect(
    page.getByRole('heading', { name: /pro adds depth when you want it/i }),
  ).toBeVisible();
  await expect(page.getByRole('link', { name: /open support center/i })).toBeVisible();
});

test('marketing homepage CTA links navigate to sign-up, sign-in, support, and pro entrypoint', async ({
  page,
}) => {
  await page.goto('/landing');

  await page
    .getByRole('link', { name: /create your account/i })
    .first()
    .click();
  await expect(page).toHaveURL(/\/sign-up/, { timeout: 15_000 });

  await page.goto('/landing');
  await page
    .getByRole('link', { name: /sign in/i })
    .first()
    .click();
  await expect(page).toHaveURL(/\/sign-in/, { timeout: 15_000 });

  await page.goto('/landing');
  await page
    .getByRole('link', { name: /^support$/i })
    .first()
    .click();
  await expect(page).toHaveURL(/\/support/, { timeout: 15_000 });

  await page.goto('/landing');
  await page.getByRole('link', { name: /see atlas pro/i }).click();
  await expect(page).toHaveURL(/\/pro\?source=hero$/, { timeout: 15_000 });

  await page
    .getByRole('link', { name: /sign in to upgrade/i })
    .first()
    .click();
  await expect(page).toHaveURL(/\/sign-in(?:\?.*)?$/, { timeout: 15_000 });
  const signInUrl = new URL(page.url());
  expect(signInUrl.searchParams.get('from')).toBe('/pro?intent=upgrade&source=hero');
  expect(signInUrl.searchParams.get('intent')).toBe('pro_upgrade');
  expect(signInUrl.searchParams.get('source')).toBe('hero');
});

test('signed-out visitors are routed from root to /landing', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/landing$/, { timeout: 15_000 });
  await expect(page.getByRole('heading', { name: /habits that follow your week/i })).toBeVisible();
});

test('signed-in visitors are redirected to today', async ({ page, request }) => {
  await createVerifiedUser(page, request, 'marketing-home');
  await page.goto('/');
  await expect(page).toHaveURL(/\/today/, { timeout: 15_000 });
});

test('signed-in visitors can open landing from sidebar and return to dashboard', async ({
  page,
  request,
}) => {
  await createVerifiedUser(page, request, 'marketing-landing');
  await page.getByRole('link', { name: /^home$/i }).click();
  await expect(page).toHaveURL(/\/landing/, { timeout: 15_000 });
  await expect(page.getByRole('heading', { name: /habits that follow your week/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /go to dashboard/i }).first()).toBeVisible();
  await page
    .getByRole('link', { name: /go to dashboard/i })
    .first()
    .click();
  await expect(page).toHaveURL(/\/today/, { timeout: 15_000 });
});
