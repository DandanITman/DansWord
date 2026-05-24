import { defineConfig, devices } from '@playwright/test';

const PORT = 5173;
const BASE_URL = `http://localhost:${PORT}/test.html`;

export default defineConfig({
  testIgnore: ['**/electron/**'],
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
  ],
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    locale: 'en-US',
    timezoneId: 'UTC',
    colorScheme: 'light',
    reducedMotion: 'reduce',
  },
  expect: {
    toHaveScreenshot: {
      animations: 'disabled',
      maxDiffPixelRatio: 0.02,
    },
  },
  snapshotPathTemplate: '{testDir}/{testFileDir}/{testFileName}-snapshots/{arg}-{projectName}{ext}',
  webServer: {
    command: 'npm run dev:test',
    cwd: './apps/desktop',
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
  projects: [
    {
      name: 'chromium-desktop',
      testMatch: ['e2e/**/*.spec.ts', 'visual/screens.spec.ts', 'visual/extended.spec.ts'],
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 860 },
      },
    },
    {
      name: 'chromium-narrow',
      testMatch: ['visual/narrow.spec.ts'],
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 900, height: 700 },
      },
    },
  ],
  outputDir: 'test-results',
});
