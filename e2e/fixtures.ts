import { expect, test as base } from '@playwright/test';

/**
 * Every test runs offline (requests to other hosts, i.e. publishers' images,
 * are blocked so results don't depend on the internet) and fails on page
 * errors or Content-Security-Policy violations.
 */
export const test = base.extend<{ problems: string[] }>({
  problems: [
    async ({ page, baseURL }, use) => {
      const problems: string[] = [];
      await page.route(
        (url) => url.origin !== new URL(baseURL!).origin,
        (route) => route.abort(),
      );
      page.on('pageerror', (error) => problems.push(`page error: ${error.message}`));
      page.on('console', (message) => {
        if (/Content Security Policy|Refused to/i.test(message.text())) {
          problems.push(`CSP: ${message.text()}`);
        }
      });

      await use(problems);

      expect(problems, 'page errors or CSP violations').toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };
