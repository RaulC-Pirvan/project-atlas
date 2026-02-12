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
  await expect(page).toHaveURL(/\/calendar/, { timeout: 15_000 });
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

async function openAccount(page: Page) {
  await page.goto('/account');
  await expect(page.getByRole('heading', { name: /account/i })).toBeVisible();
}

async function openHabits(page: Page) {
  await page.goto('/habits');
  await expect(page.getByRole('heading', { name: /habits/i })).toBeVisible();
}

test('reminder settings save and persist', async ({ page, request }) => {
  await createVerifiedUser(page, request, 'reminder-settings');
  await openAccount(page);

  const digestSection = page.getByText('Daily digest').locator('..');
  await digestSection.getByRole('button', { name: 'On' }).click();

  await page.getByLabel('Digest time').fill('20:00');

  const quietSection = page.getByText('Quiet hours').locator('..');
  await quietSection.getByRole('button', { name: 'On' }).click();

  await page.getByLabel('Quiet hours start').fill('22:00');
  await page.getByLabel('Quiet hours end').fill('07:00');
  await page.getByLabel('Default snooze').fill('10');

  await page.getByRole('button', { name: /save reminder settings/i }).click();
  await expect(page.getByText('Reminder settings updated.')).toBeVisible();

  await openAccount(page);
  await expect(page.getByLabel('Digest time')).toHaveValue('20:00');
  await expect(page.getByLabel('Quiet hours start')).toHaveValue('22:00');
  await expect(page.getByLabel('Quiet hours end')).toHaveValue('07:00');
  await expect(page.getByLabel('Default snooze')).toHaveValue('10');
});

test('habit reminders support up to three times', async ({ page, request }) => {
  await createVerifiedUser(page, request, 'habit-reminders');
  await openHabits(page);

  await page.getByLabel(/^title$/i).fill('Hydrate');

  await page.getByRole('button', { name: /add time/i }).click();
  await page.getByLabel('Reminder time 1').fill('08:00');

  await page.getByRole('button', { name: /add time/i }).click();
  await page.getByLabel('Reminder time 2').fill('13:30');

  await page.getByRole('button', { name: /add time/i }).click();
  await page.getByLabel('Reminder time 3').fill('20:15');

  const addTimeButton = page.getByRole('button', { name: /add time/i });
  await expect(addTimeButton).toBeDisabled();

  await page.getByRole('button', { name: /create habit/i }).click();
  await expect(page.getByText('Hydrate')).toBeVisible();
  await expect(page.getByText('08:00')).toBeVisible();
  await expect(page.getByText('13:30')).toBeVisible();
  await expect(page.getByText('20:15')).toBeVisible();

  await page.getByRole('button', { name: 'Edit' }).click();
  await page.getByRole('button', { name: 'Remove' }).first().click();
  await page.getByRole('button', { name: /save changes/i }).click();

  await expect(page.getByText('08:00')).toHaveCount(0);
  await expect(page.getByText('13:30')).toBeVisible();
  await expect(page.getByText('20:15')).toBeVisible();

  await openHabits(page);
  await expect(page.getByText('13:30')).toBeVisible();
  await expect(page.getByText('20:15')).toBeVisible();
});
