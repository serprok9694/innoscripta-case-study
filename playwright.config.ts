import { defineConfig, devices } from '@playwright/test';

/**
 * End-to-end tests against the production Docker image in demo mode: the
 * real bundle behind nginx and its CSP, no API keys and no network needed.
 *
 * - Locally, `npm run e2e` builds and starts the image itself.
 * - CI (or anyone with the app already running) sets E2E_BASE_URL.
 */
const externalUrl = process.env.E2E_BASE_URL;
const baseURL = externalUrl ?? 'http://localhost:4173';

export default defineConfig({
  testDir: './e2e',
  globalTeardown: './e2e/global-teardown.ts',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL,
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: externalUrl
    ? undefined
    : {
        command:
          'docker rm -f newsroom-e2e >/dev/null 2>&1; docker build -q -t newsroom:e2e . && docker run --rm --name newsroom-e2e -p 4173:80 newsroom:e2e',
        url: `${baseURL}/healthz`,
        timeout: 300_000,
        // Always test the current code: never reuse a server left from another run.
        reuseExistingServer: false,
      },
});
