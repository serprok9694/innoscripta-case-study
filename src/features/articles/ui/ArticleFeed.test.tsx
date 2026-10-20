import { render as rtlRender, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { MemoryRouter } from 'react-router';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { makeArticle } from '@/test/factories';
import type { ArticlesResult } from '../use-articles';
import { ArticleFeed } from './ArticleFeed';

function feed(overrides: Partial<ArticlesResult> = {}): ArticlesResult {
  return {
    articles: [],
    failures: [],
    isLoading: false,
    error: null,
    hasNoSources: false,
    hasNextPage: false,
    isFetchingNextPage: false,
    fetchNextPage: vi.fn<ArticlesResult['fetchNextPage']>(),
    refetch: vi.fn<ArticlesResult['refetch']>(),
    ...overrides,
  } as ArticlesResult;
}

/** The feed opens previews through the router. */
const render = (ui: ReactElement) => rtlRender(<MemoryRouter>{ui}</MemoryRouter>);

describe('ArticleFeed', () => {
  it('shows skeletons while loading', () => {
    render(<ArticleFeed feed={feed({ isLoading: true })} />);
    expect(screen.getByRole('status', { name: 'Loading articles' })).toBeInTheDocument();
  });

  it('explains when no source is configured', () => {
    render(<ArticleFeed feed={feed({ hasNoSources: true })} />);
    expect(screen.getByText('No news sources available')).toBeInTheDocument();
  });

  it('offers a retry when loading failed', async () => {
    const refetch = vi.fn<ArticlesResult['refetch']>();
    render(<ArticleFeed feed={feed({ error: new Error('down'), refetch })} />);

    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(refetch).toHaveBeenCalledOnce();
  });

  it('shows the given empty state', () => {
    render(<ArticleFeed feed={feed()} empty={<p>Nothing here</p>} />);
    expect(screen.getByText('Nothing here')).toBeInTheDocument();
  });

  it('lists articles and partial failures together', () => {
    render(
      <ArticleFeed
        feed={feed({
          articles: [makeArticle({ title: 'One' }), makeArticle({ title: 'Two' })],
          failures: [{ sourceId: 'nyt', kind: 'rate-limit', message: 'Too many requests' }],
        })}
      />,
    );

    expect(
      screen.getAllByRole('listitem').filter((li) => li.querySelector('article')),
    ).toHaveLength(2);
    expect(screen.getByRole('status')).toHaveTextContent(
      'The New York Times — request limit reached, try again in a minute',
    );
  });
});
