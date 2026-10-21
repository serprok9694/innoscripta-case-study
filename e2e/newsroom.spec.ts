import { expect, test } from './fixtures';

test.describe('feed', () => {
  test('loads the demo feed under the production CSP', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { level: 1, name: 'My feed' })).toBeVisible();
    await expect(page.getByRole('note')).toContainText('Demo mode');
    await expect(
      page.getByRole('list', { name: 'Articles' }).getByRole('article').first(),
    ).toBeVisible();
    await expect(page.getByText(/^Updated /)).toBeVisible();
  });
});

test.describe('search', () => {
  test('searches, filters and returns to the feed', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('article').first()).toBeVisible();

    await page.getByRole('searchbox').fill('climate');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Results for “climate”');
    await expect(page).toHaveURL(/\?q=climate$/);

    const filters = page.getByRole('complementary', { name: 'Filters' });
    await filters.getByRole('button', { name: 'Science', exact: true }).click();
    await expect(page).toHaveURL(/category=science/);
    await expect(
      page.getByRole('list', { name: 'Applied filters' }).getByRole('listitem'),
    ).toHaveText(['Science']);

    // One history step in, however much the search was refined: Back returns to the feed.
    await page.goBack();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('My feed');
    await expect(page).toHaveURL(/\/$/);
  });

  test('"Back to my feed" leaves results without a Back loop', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('article').first()).toBeVisible();
    await page.getByRole('searchbox').fill('climate');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Results for “climate”');

    await page.getByRole('link', { name: '← Back to my feed' }).click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('My feed');
    await page.goForward(); // the results are ahead of us, not behind
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Results for “climate”');
  });
});

test.describe('article preview', () => {
  test('opens, follows an author and closes with Back', async ({ page }) => {
    await page.goto('/');
    // A card that has authors (their names are in the footer's tooltip).
    const card = page
      .getByRole('article')
      .filter({ has: page.locator('span[title]') })
      .first();
    const title = (await card.getByRole('heading').textContent())!.trim();

    await card.getByRole('link').click();
    const preview = page.getByRole('dialog', { name: title });
    await expect(preview).toBeVisible();
    await expect(preview.getByRole('link', { name: /^Read on / })).toHaveAttribute(
      'target',
      '_blank',
    );

    const follow = preview.getByRole('button', { name: /^Follow / }).first();
    const author = (await follow.textContent())!.replace(/^Follow\s*/, '');
    await follow.click();
    await expect(preview.getByRole('button', { name: `Following ${author}` })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Following (1)' })).toBeAttached();

    await page.goBack();
    await expect(preview).toBeHidden();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('My feed');
  });
});

test.describe('settings and theme', () => {
  test('loads Settings on demand and keeps the theme across reloads without a flash', async ({
    page,
  }) => {
    await page.goto('/');
    await page
      .getByRole('navigation', { name: 'Main' })
      .first()
      .getByRole('link', { name: 'Settings' })
      .click();
    await expect(page.getByRole('heading', { level: 1, name: 'Settings' })).toBeVisible();

    // Click the visible label, as a reader does (the radio input itself is visually hidden).
    const theme = page.getByRole('group', { name: 'Theme' });
    await theme.getByText('Dark', { exact: true }).click();
    await expect(theme.getByRole('radio', { name: 'Dark' })).toBeChecked();
    await expect(page.locator('html')).toHaveClass(/\bdark\b/);

    // The pre-paint script applies the theme before React renders anything.
    await page.reload({ waitUntil: 'commit' });
    await page.waitForLoadState('domcontentloaded');
    expect(await page.evaluate(() => document.documentElement.classList.contains('dark'))).toBe(
      true,
    );
  });
});

test.describe('phone', () => {
  test.use({ viewport: { width: 375, height: 812 }, hasTouch: true });

  test('filters in a bottom sheet, tab bar navigation, no horizontal scroll', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('article').first()).toBeVisible();

    await page.getByRole('button', { name: 'Filters' }).click();
    const sheet = page.getByRole('dialog', { name: 'Filter news' });
    await sheet.getByRole('button', { name: 'Technology' }).click();
    await expect(page).toHaveURL(/category=technology/);
    await sheet.getByRole('button', { name: 'Show results' }).click();
    await expect(sheet).toBeHidden();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Filtered news');

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBe(0);

    // Only the bottom tab bar is visible at this width.
    const tabBar = page.getByRole('navigation', { name: 'Main' }).filter({ visible: true });
    await expect(tabBar).toHaveCount(1);
    await tabBar.getByRole('link', { name: 'Settings' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Settings' })).toBeVisible();
  });
});
