import type { APIRequestContext, Page } from '@playwright/test';
import { expect, test } from '@playwright/test';

const password = 'AtlasTestPassword123!';
const targetMonth = '2026-01';
const mondayDate = '2026-01-05';
const tuesdayDate = '2026-01-06';

function uniqueEmail(prefix: string) {
  const stamp = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${prefix}-${stamp}@example.com`;
}

function uniqueTitle(prefix: string) {
  const stamp = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${prefix} ${stamp}`;
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

async function openHabits(page: Page) {
  await page.goto('/habits');
  await expect(page.getByRole('heading', { name: /habits/i })).toBeVisible();
}

test('habit lifecycle from creation to archive', async ({ page, request }) => {
  await createVerifiedUser(page, request, 'habit-lifecycle');
  const habitTitle = uniqueTitle('Lifecycle habit');

  await openHabits(page);

  await page.getByLabel(/^title$/i).fill(habitTitle);
  await page.getByLabel(/description/i).fill('Lifecycle coverage test');

  for (const day of ['Tue', 'Thu', 'Fri', 'Sat', 'Sun']) {
    await page.getByRole('button', { name: day }).click();
  }

  await page.getByRole('button', { name: /create habit/i }).click();
  await expect(page.getByText(habitTitle)).toBeVisible();

  await page.goto(`/calendar?month=${targetMonth}&date=${mondayDate}`);
  const mondayCheckbox = page.getByRole('checkbox', { name: new RegExp(habitTitle, 'i') });
  await expect(mondayCheckbox).toBeVisible();

  await page.goto(`/calendar?month=${targetMonth}&date=${tuesdayDate}`);
  await expect(page.getByRole('main').getByText('No habits scheduled for this day.')).toBeVisible();

  await openHabits(page);
  await page.getByRole('button', { name: 'Edit' }).click();
  await page.getByRole('button', { name: 'Tue' }).nth(1).click();
  await page.getByRole('button', { name: /save changes/i }).click();
  await expect(page.getByText(habitTitle)).toBeVisible();

  await page.goto(`/calendar?month=${targetMonth}&date=${tuesdayDate}`);
  const tuesdayCheckbox = page.getByRole('checkbox', { name: new RegExp(habitTitle, 'i') });
  await expect(tuesdayCheckbox).toHaveAttribute('aria-checked', 'false');
  await tuesdayCheckbox.click();
  await expect(tuesdayCheckbox).toHaveAttribute('aria-checked', 'true');

  const tuesdayTile = page.locator(`[data-date-key="${tuesdayDate}"]`);
  await expect(tuesdayTile).toHaveClass(/bg-\[#FAB95B\]/);

  await openHabits(page);
  await page.getByRole('button', { name: 'Delete' }).click();
  await page.getByRole('button', { name: /delete habit/i }).click();
  await expect(page.getByText(habitTitle, { exact: true })).toHaveCount(0);

  await page.goto(`/calendar?month=${targetMonth}&date=${tuesdayDate}`);
  await expect(page.getByRole('main').getByText('No habits scheduled for this day.')).toBeVisible();
  await expect(page.locator(`[data-date-key="${tuesdayDate}"]`)).not.toHaveClass(/bg-\[#FAB95B\]/);
});
