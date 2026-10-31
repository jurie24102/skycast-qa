import { defineConfig, devices } from '@playwright/test';

/**
 * SkyCast QA — Playwright configuration.
 *
 * By default the suite boots a dependency-free static server for the sibling
 * `skycast` app (../skycast) on port 4173. Point BASE_URL at any deployed
 * instance (e.g. the GitHub Pages URL) to run against it instead — the local
 * server is skipped automatically when BASE_URL is set.
 */

const PORT = 4173;
const baseURL = process.env.BASE_URL ?? `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI
    ? [['github'], ['html', { open: 'never' }]]
    : [['list'], ['html', { open: 'never' }]],

  use: {
    baseURL,
    // Dynamic waits: every action auto-waits for the element; timeouts are a
    // safety net, not a sleep(). Assertions get their own generous budget.
    actionTimeout: 10_000,
    navigationTimeout: 15_000,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  expect: { timeout: 7_000 },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],

  webServer: process.env.BASE_URL
    ? undefined
    : {
        command: 'node scripts/static-server.mjs',
        url: `http://127.0.0.1:${PORT}`,
        reuseExistingServer: !process.env.CI,
        timeout: 15_000,
      },
});
