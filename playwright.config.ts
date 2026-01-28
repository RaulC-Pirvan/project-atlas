import { defineConfig, devices } from '@playwright/test';

const webServerEnv = {
  ...process.env,
  ENABLE_TEST_ENDPOINTS: 'true',
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ?? 'test-secret',
  NEXTAUTH_URL: process.env.NEXTAUTH_URL ?? 'http://localhost:3000',
};

export default defineConfig({
  testDir: './e2e',
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
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
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
        command: 'npm run dev',
        url: 'http://localhost:3000',
        env: webServerEnv,
        reuseExistingServer: true,
        timeout: 30_000,
      },
});
