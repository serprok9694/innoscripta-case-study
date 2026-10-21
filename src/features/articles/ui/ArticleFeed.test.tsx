import { render as rtlRender, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { MemoryRouter } from 'react-router';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { makeArticle } from '@/test/factories';
import { fakeCatalog } from '@/test/fake-catalog';
import { SourceCatalogContext } from '../source-catalog-context';
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
    retry: vi.fn<ArticlesResult['retry']>(),
    ...overrides,
  } as ArticlesResult;
}

/** The feed opens previews through the router and names sources through the catalog. */
const render = (ui: ReactElement) =>
  rtlRender(
    <SourceCatalogContext value={fakeCatalog()}>
      <MemoryRouter>{ui}</MemoryRouter>
    </SourceCatalogContext>,
  );

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
    const retry = vi.fn<ArticlesResult['retry']>();
    render(<ArticleFeed feed={feed({ error: new Error('down'), retry })} />);

    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(retry).toHaveBeenCalledOnce();
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

  it('keeps the loaded articles when a further page fails', async () => {
    const fetchNextPage = vi.fn<ArticlesResult['fetchNextPage']>();
    render(
      <ArticleFeed
        feed={feed({
          articles: [makeArticle({ title: 'Still here' })],
          error: new Error('page 2 failed'),
          isFetchNextPageError: true,
          hasNextPage: true,
          fetchNextPage,
        })}
      />,
    );

    expect(screen.getByText('Still here')).toBeInTheDocument();
    expect(screen.queryByText('Couldn’t load the news')).not.toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Couldn’t load more articles.');
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(fetchNextPage).toHaveBeenCalledOnce();
  });

  it('lets unavailable sources be retried', async () => {
    const retry = vi.fn<ArticlesResult['retry']>();
    render(
      <ArticleFeed
        feed={feed({
          articles: [makeArticle()],
          failures: [{ sourceId: 'nyt', kind: 'rate-limit', message: '' }],
          retry,
        })}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(retry).toHaveBeenCalledOnce();
  });
});
