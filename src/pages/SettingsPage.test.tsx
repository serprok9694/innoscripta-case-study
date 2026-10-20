import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { mockJson } from '@/test/msw/mock-json';
import { renderRoute } from '@/test/render-route';

describe('SettingsPage', () => {
  it('saves source and topic preferences as they are toggled', async () => {
    mockJson('/api/config', { sources: { guardian: true, nyt: true, newsapi: false } });
    const { store } = renderRoute('/settings');

    const sources = screen.getByRole('group', { name: 'Preferred sources' });
    await within(sources).findByRole('button', { name: 'The Guardian', pressed: false });
    expect(within(sources).getByRole('button', { name: 'NewsAPI' })).toBeDisabled();

    await userEvent.click(within(sources).getByRole('button', { name: 'The Guardian' }));
    const topics = screen.getByRole('group', { name: 'Preferred categories' });
    await userEvent.click(within(topics).getByRole('button', { name: 'Technology' }));

    expect(store.getState().preferences).toMatchObject({
      sources: ['guardian'],
      categories: ['technology'],
    });
    expect(within(sources).getByRole('button', { name: 'The Guardian' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('resets everything', async () => {
    mockJson('/api/config', { sources: { guardian: true } });
    const { store } = renderRoute('/settings', {
      preferences: { categories: ['world'], authors: ['Mark Cocker'] },
    });

    await userEvent.click(screen.getByRole('button', { name: 'Reset all preferences' }));

    expect(store.getState().preferences).toEqual({ sources: [], categories: [], authors: [] });
    expect(screen.queryByRole('button', { name: 'Reset all preferences' })).not.toBeInTheDocument();
  });
});
