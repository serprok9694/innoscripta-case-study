import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { makeArticle } from '@/test/factories';
import { ArticleCard } from './ArticleCard';

describe('ArticleCard', () => {
  const article = makeArticle({
    title: 'Bees in decline',
    url: 'https://example.com/bees',
    publisher: 'The Guardian',
    category: 'science',
    summary: 'Most wild bee species are declining.',
    author: 'Ajit Niranjan',
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
        article={makeArticle({ category: undefined, summary: undefined, author: undefined })}
      />,
    );
    expect(screen.queryByText('·')).not.toBeInTheDocument();
  });
});
