import { defineConfig, devices } from '@playwright/test';

const webServerEnv = {
  ...process.env,
  ENABLE_TEST_ENDPOINTS: 'true',
  ENABLE_TEST_GOOGLE_OAUTH_PROVIDER: process.env.ENABLE_TEST_GOOGLE_OAUTH_PROVIDER ?? 'true',
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ?? 'test-secret',
  NEXTAUTH_URL: process.env.NEXTAUTH_URL ?? 'http://localhost:3000',
};
const isWindows = process.platform === 'win32';
const devCommand = isWindows ? 'node ./node_modules/next/dist/bin/next dev -p 3000' : 'npm run dev';

export default defineConfig({
  testDir: './e2e',
  globalSetup: './playwright.global-setup.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? 'github' : 'list',
  updateSnapshots: process.env.CI ? 'missing' : 'none',
  snapshotPathTemplate: '{testDir}/{testFilePath}-snapshots/{arg}{-projectName}{ext}',

  timeout: 30_000,
  expect: {
    timeout: 5_000,
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.005,
      maxDiffPixels: 1000,
    },
  },

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      testIgnore: /calendar-visual\.spec\.ts/,
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
      testIgnore: /calendar-visual\.spec\.ts/,
    },
    {
      name: 'visual',
      testMatch: /calendar-visual\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
      workers: 1,
    },
  ],

  webServer: process.env.CI
    ? {
        command: 'npm run start:test',
        url: 'http://localhost:3000',
        env: webServerEnv,
        reuseExistingServer: false,
        timeout: 120_000,
      }
    : {
        command: devCommand,
        url: 'http://localhost:3000',
        env: webServerEnv,
        reuseExistingServer: process.env.PLAYWRIGHT_REUSE_SERVER === 'true',
        timeout: 30_000,
      },
});
