import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { makeArticle } from '@/test/factories';
import { ArticleCard, type AuthorFollowing } from './ArticleCard';

describe('ArticleCard', () => {
  const article = makeArticle({
    title: 'Bees in decline',
    url: 'https://example.com/bees',
    publisher: 'The Guardian',
    category: 'science',
    summary: 'Most wild bee species are declining.',
    authors: ['Ajit Niranjan'],
    imageUrl: 'https://example.com/bees.jpg',
    publishedAt: '2026-10-20T09:00:00Z',
  });

  it('renders the article with a safe external link', () => {
    render(<ArticleCard article={article} />);

    const link = screen.getByRole('link', { name: 'Bees in decline' });
    expect(link).toHaveAttribute('href', 'https://example.com/bees');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Bees in decline');
    expect(screen.getByText('The Guardian')).toBeInTheDocument();
    expect(screen.getByText('Science')).toBeInTheDocument();
    expect(screen.getByText('Most wild bee species are declining.')).toBeInTheDocument();
    expect(screen.getByText('Ajit Niranjan')).toBeInTheDocument();
    expect(screen.getByRole('time')).toHaveAttribute('datetime', '2026-10-20T09:00:00Z');
  });

  it('falls back to a placeholder when the image is missing or broken', () => {
    const { container, rerender } = render(<ArticleCard article={article} />);
    const img = container.querySelector('img');
    expect(img).toHaveAttribute('src', 'https://example.com/bees.jpg');

    fireEvent.error(img!);
    expect(screen.getByTestId('image-placeholder')).toBeInTheDocument();

    rerender(<ArticleCard article={{ ...article, id: 'other', imageUrl: undefined }} />);
    expect(screen.getByTestId('image-placeholder')).toBeInTheDocument();
  });

  it('omits optional parts', () => {
    render(
      <ArticleCard
        article={makeArticle({ category: undefined, summary: undefined, authors: [] })}
      />,
    );
    expect(screen.queryByText('·')).not.toBeInTheDocument();
  });

  describe('following authors', () => {
    const multi = makeArticle({ authors: ['Rachel Wharton', 'Graham Dickie'] });
    const following = (overrides: Partial<AuthorFollowing> = {}): AuthorFollowing => ({
      isFollowing: (name) => name === 'Rachel Wharton',
      canFollow: true,
      toggle: vi.fn<(name: string) => void>(),
      ...overrides,
    });

    it('shows plain names when following is not offered', () => {
      render(<ArticleCard article={multi} />);
      expect(screen.getByRole('time').parentElement).toHaveTextContent(
        'Rachel Wharton, Graham Dickie',
      );
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('lets each author be followed or unfollowed', async () => {
      const props = following();
      render(<ArticleCard article={multi} following={props} />);

      const rachel = screen.getByRole('button', { name: 'Follow Rachel Wharton' });
      const graham = screen.getByRole('button', { name: 'Follow Graham Dickie' });
      expect(rachel).toHaveAttribute('aria-pressed', 'true');
      expect(graham).toHaveAttribute('aria-pressed', 'false');

      await userEvent.click(graham);
      expect(props.toggle).toHaveBeenCalledWith('Graham Dickie');
    });

    it('disables following new authors at the limit, but still allows unfollowing', () => {
      render(<ArticleCard article={multi} following={following({ canFollow: false })} />);
      expect(screen.getByRole('button', { name: 'Follow Graham Dickie' })).toBeDisabled();
      expect(screen.getByRole('button', { name: 'Follow Rachel Wharton' })).toBeEnabled();
    });
  });
});
