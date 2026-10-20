import { render, screen } from '@testing-library/react';
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
    expect(await screen.findByText('No news sources available')).toBeInTheDocument();
  });
});
