import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { mockJson } from '@/test/msw/mock-json';
import { renderRoute } from '@/test/render-route';

describe('AppLayout', () => {
  it('highlights the current page and navigates', async () => {
    mockJson('/api/config', { sources: {} });
    const { router } = renderRoute('/');
    const nav = screen.getByRole('navigation', { name: 'Main' });

    expect(within(nav).getByRole('link', { name: 'My feed' })).toHaveAttribute(
      'aria-current',
      'page',
    );

    await userEvent.click(within(nav).getByRole('link', { name: 'Search' }));
    expect(router.state.location.pathname).toBe('/search');
    expect(screen.getByRole('heading', { level: 1, name: 'Search' })).toBeInTheDocument();
  });

  it('shows a not-found page for unknown routes', () => {
    renderRoute('/nope');
    expect(screen.getByRole('heading', { level: 1, name: 'Page not found' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to your feed' })).toHaveAttribute('href', '/');
  });
});
