import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import type { Article } from '@/domain/article';
import { makeArticle } from '@/test/factories';
import type { AuthorFollowing } from '../author-following';
import { ArticlePreview } from './ArticlePreview';

const article = makeArticle({
  sourceId: 'newsapi',
  publisher: 'BBC News',
  title: 'Bees in decline',
  summary: 'Most wild bee species are declining.',
  url: 'https://example.com/bees',
  category: 'science',
  authors: ['Ajit Niranjan', 'Fiona Harvey'],
  publishedAt: '2026-10-20T09:00:00Z',
});

function renderPreview(value: Article | undefined, following?: AuthorFollowing) {
  const onClose = vi.fn<() => void>();
  const router = createMemoryRouter(
    [
      {
        path: '/',
        element: <ArticlePreview article={value} onClose={onClose} following={following} />,
      },
    ],
    { initialEntries: ['/'] },
  );
  render(<RouterProvider router={router} />);
  return { onClose, router };
}

const following = (overrides: Partial<AuthorFollowing> = {}): AuthorFollowing => ({
  isFollowing: (name) => name === 'Fiona Harvey',
  canFollow: true,
  toggle: vi.fn<(name: string) => void>(),
  ...overrides,
});

describe('ArticlePreview', () => {
  it('is closed without an article', () => {
    renderPreview(undefined);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('shows the article, named by its headline', () => {
    renderPreview(article);
    const dialog = screen.getByRole('dialog', { name: 'Bees in decline' });

    expect(dialog).toHaveTextContent('Most wild bee species are declining.');
    expect(within(dialog).getByText(/BBC News · Science/)).toBeInTheDocument();
    expect(within(dialog).getByRole('time')).toHaveAttribute('datetime', article.publishedAt);
  });

  it('links to the original article on the publisher’s site', () => {
    renderPreview(article);
    const link = screen.getByRole('link', { name: 'Read on BBC News (opens in a new tab)' });
    expect(link).toHaveAttribute('href', 'https://example.com/bees');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('explains a missing summary', () => {
    renderPreview({ ...article, summary: undefined });
    expect(
      screen.getByText('No summary from BBC News. Read the full article on the site.'),
    ).toBeInTheDocument();
  });

  it('offers related searches by author, topic and source', async () => {
    const { router } = renderPreview(article);

    expect(screen.getByRole('link', { name: 'More in Science' })).toHaveAttribute(
      'href',
      '/?category=science',
    );
    // The source, not the publisher: NewsAPI can't filter by publisher.
    expect(screen.getByRole('link', { name: 'More from NewsAPI' })).toHaveAttribute(
      'href',
      '/?source=newsapi',
    );

    await userEvent.click(screen.getByRole('link', { name: 'More by Fiona Harvey' }));
    expect(router.state.location.search).toBe('?author=Fiona+Harvey');
    expect(router.state.historyAction).toBe('REPLACE');
  });

  it('lets each author be followed', async () => {
    const props = following();
    renderPreview(article, props);

    expect(screen.getByRole('button', { name: 'Following Fiona Harvey' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Follow Ajit Niranjan' }));
    expect(props.toggle).toHaveBeenCalledWith('Ajit Niranjan');
  });

  it('explains the follow limit, still allowing unfollow', () => {
    renderPreview(article, following({ canFollow: false }));

    expect(screen.getByRole('button', { name: 'Follow Ajit Niranjan' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Following Fiona Harvey' })).toBeEnabled();
    expect(screen.getByText(/maximum number of authors/)).toBeInTheDocument();
  });

  it('hides sections without data', () => {
    renderPreview({ ...article, authors: [], category: undefined });
    expect(screen.queryByRole('heading', { name: 'Authors' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /More in/ })).not.toBeInTheDocument();
  });
});
