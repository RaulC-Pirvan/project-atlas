import type { APIRequestContext, Page } from '@playwright/test';
import { expect, test } from '@playwright/test';

const password = 'AtlasTestPassword123!';

function uniqueEmail(prefix: string) {
  const stamp = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${prefix}-${stamp}@example.com`;
}

async function signUp(page: Page, email: string) {
  await page.goto('/sign-up');
  await page.getByLabel(/display name/i).fill('Atlas Export Tester');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel(/^password$/i).fill(password);
  await page.getByLabel(/confirm password/i).fill(password);
  await page.getByRole('button', { name: /create account/i }).click();
  await expect(page.getByRole('heading', { name: /you're in\./i })).toBeVisible();
}

async function signIn(page: Page, email: string, passwordValue: string) {
  await page.goto('/sign-in');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(passwordValue);
  await page.getByRole('button', { name: /sign in/i }).click();
}

async function fetchVerificationToken(request: APIRequestContext, email: string): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const response = await request.get(
      `/api/auth/debug/verification-token?email=${encodeURIComponent(email)}&t=${Date.now()}`,
    );
    if (response.ok()) {
      const body = (await response.json()) as { data?: { token?: string } };
      const token = body.data?.token;
      if (token) return token;
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  throw new Error('Unable to fetch verification token for account export test.');
}

test('account data export smoke flow succeeds from account page', async ({ page, request }) => {
  const email = uniqueEmail('export');

  await signUp(page, email);
  const token = await fetchVerificationToken(request, email);
  await page.goto(`/verify-email?token=${encodeURIComponent(token)}`);
  await expect(page.getByRole('heading', { name: /email verified\./i })).toBeVisible();

  await signIn(page, email, password);
  await expect(page).toHaveURL(/\/today/, { timeout: 15_000 });

  await page.goto('/account');
  await page.route('**/api/account/exports/self', async (route) => {
    await route.fulfill({
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': 'attachment; filename="20260220T100000Z-atlas-data-export.json"',
        'Cache-Control': 'no-store',
      },
      body: JSON.stringify({
        schemaVersion: 1,
        generatedAt: '2026-02-20T10:00:00.000Z',
        userId: 'user-export-smoke',
        habits: [],
        completions: [],
        reminders: {
          settings: {
            dailyDigestEnabled: true,
            dailyDigestTimeMinutes: 1200,
            quietHoursEnabled: false,
            quietHoursStartMinutes: 1320,
            quietHoursEndMinutes: 420,
            snoozeDefaultMinutes: 10,
          },
          habitReminders: [],
        },
        achievements: {
          achievementUnlocks: [],
          habitMilestoneUnlocks: [],
        },
      }),
    });
  });

  const exportResponsePromise = page.waitForResponse(
    (response) =>
      response.url().includes('/api/account/exports/self') && response.request().method() === 'GET',
  );
  await page.getByRole('button', { name: /download my data \(json\)/i }).click();

  const exportResponse = await exportResponsePromise;
  expect(exportResponse.status()).toBe(200);
  expect(exportResponse.headers()['content-type']).toContain('application/json');
  expect(exportResponse.headers()['content-disposition']).toContain('atlas-data-export.json');

  const body = (await exportResponse.json()) as { schemaVersion: number; userId: string };
  expect(body.schemaVersion).toBe(1);
  expect(typeof body.userId).toBe('string');
  expect(body.userId.length).toBeGreaterThan(0);

  await expect(page.getByText(/data export downloaded\./i)).toBeVisible();
});
