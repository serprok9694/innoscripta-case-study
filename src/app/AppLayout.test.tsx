import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { THEME_STORAGE_KEY } from '@/features/theme/theme-storage';
import { mockJson } from '@/test/msw/mock-json';
import { renderRoute } from '@/test/render-route';

/** Every page asks the proxy for its config (demo mode banner): let it settle. */
async function renderSettled(path: string) {
  mockJson('/api/config', { sources: {} });
  const view = renderRoute(path);
  await screen.findByRole('note'); // demo mode banner
  return view;
}

describe('AppLayout', () => {
  it('offers the same navigation on desktop (top) and phones (bottom tab bar)', async () => {
    const { router } = await renderSettled('/');

    // Only one is visible at a time (CSS); jsdom renders both.
    const [desktop, mobile] = screen.getAllByRole('navigation', { name: 'Main' });
    for (const nav of [desktop!, mobile!]) {
      expect(within(nav).getByRole('link', { name: 'Home' })).toHaveAttribute(
        'aria-current',
        'page',
      );
      expect(
        within(nav)
          .getAllByRole('link')
          .map((a) => a.textContent),
      ).toEqual(['Home', 'Settings']);
    }

    await userEvent.click(within(mobile!).getByRole('link', { name: 'Settings' }));
    expect(router.state.location.pathname).toBe('/settings');
    expect(screen.getByRole('heading', { level: 1, name: 'Settings' })).toBeInTheDocument();
  });

  it('switches between light and dark themes and remembers the choice', async () => {
    await renderSettled('/');

    expect(document.documentElement).not.toHaveClass('dark');
    await userEvent.click(screen.getByRole('button', { name: 'Switch to dark theme' }));

    expect(document.documentElement).toHaveClass('dark');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');

    await userEvent.click(screen.getByRole('button', { name: 'Switch to light theme' }));
    expect(document.documentElement).not.toHaveClass('dark');
  });

  it('shows a not-found page for unknown routes', async () => {
    await renderSettled('/nope');
    expect(screen.getByRole('heading', { level: 1, name: 'Page not found' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to your feed' })).toHaveAttribute('href', '/');
  });
});
