import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { makeArticle } from '@/test/factories';
import type { Article } from '@/domain/article';
import { formatAuthors } from '../format-authors';
import { ArticleCard } from './ArticleCard';

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

  describe('opening the preview', () => {
    it('opens the preview on a plain click instead of navigating', async () => {
      const onOpen = vi.fn<(article: Article) => void>();
      render(<ArticleCard article={article} onOpen={onOpen} />);
      const link = screen.getByRole('link', { name: 'Bees in decline' });

      expect(link).toHaveAttribute('aria-haspopup', 'dialog');
      expect(fireEvent.click(link)).toBe(false); // default (navigation) prevented
      expect(onOpen).toHaveBeenCalledWith(article);
    });

    it.each([
      ['Cmd', { metaKey: true }],
      ['Ctrl', { ctrlKey: true }],
      ['Shift', { shiftKey: true }],
      ['middle button', { button: 1 }],
    ])('leaves %s-clicks to the browser (open in a new tab)', (_name, init) => {
      const onOpen = vi.fn<(article: Article) => void>();
      render(<ArticleCard article={article} onOpen={onOpen} />);

      expect(fireEvent.click(screen.getByRole('link'), init)).toBe(true);
      expect(onOpen).not.toHaveBeenCalled();
    });

    it('is a plain external link without a preview', () => {
      render(<ArticleCard article={article} />);
      expect(screen.getByRole('link')).not.toHaveAttribute('aria-haspopup');
    });
  });

  it('lists authors as plain text', () => {
    render(<ArticleCard article={makeArticle({ authors: ['Rachel Wharton', 'Graham Dickie'] })} />);
    expect(screen.getByText('Rachel Wharton, Graham Dickie')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('shortens long author lists, keeping the full list in the tooltip', () => {
    const authors = ['Andrew Ross Sorkin', 'Bernhard Warner', 'Sarah Kessler', 'Ian Mount'];
    render(<ArticleCard article={makeArticle({ authors })} />);
    expect(screen.getByText('Andrew Ross Sorkin, Bernhard Warner +2')).toHaveAttribute(
      'title',
      authors.join(', '),
    );
  });

  it.each([
    [[], ''],
    [['A'], 'A'],
    [['A', 'B'], 'A, B'],
    [['A', 'B', 'C'], 'A, B +1'],
  ])('formatAuthors(%j) → %j', (authors, expected) => {
    expect(formatAuthors(authors)).toBe(expected);
  });

  it('loads above-the-fold images eagerly and the rest lazily', () => {
    const { container, rerender } = render(<ArticleCard article={article} priority />);
    expect(container.querySelector('img')).toHaveAttribute('loading', 'eager');
    expect(container.querySelector('img')).toHaveAttribute('fetchpriority', 'high');

    rerender(<ArticleCard article={article} />);
    expect(container.querySelector('img')).toHaveAttribute('loading', 'lazy');
  });
});
