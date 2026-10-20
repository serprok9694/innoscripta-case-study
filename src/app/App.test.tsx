import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { mockJson } from '@/test/msw/mock-json';
import { App } from './App';
import { AppProviders } from './AppProviders';

describe('App', () => {
  it('boots with the real providers and router', async () => {
    mockJson('/api/config', { sources: {} });
    render(
      <AppProviders>
        <App />
      </AppProviders>,
    );

    expect(screen.getByRole('heading', { level: 1, name: 'My feed' })).toBeInTheDocument();
    // No keys configured: the recorded sample is shown, with an explanation.
    expect(await screen.findByRole('note')).toHaveTextContent('Demo mode');
    expect(await screen.findByRole('list', { name: 'Articles' })).toBeInTheDocument();

    // The notice can be dismissed for the session.
    await userEvent.click(screen.getByRole('button', { name: 'Dismiss demo mode notice' }));
    expect(screen.queryByRole('note')).not.toBeInTheDocument();
    expect(sessionStorage.getItem('news-aggregator:demo-banner-dismissed')).toBe('1');
  });
});
