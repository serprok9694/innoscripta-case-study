import type { Article } from '@/domain/article';

let sequence = 0;

export function makeArticle(overrides: Partial<Article> = {}): Article {
  sequence += 1;
  return {
    id: `guardian:article-${sequence}`,
    sourceId: 'guardian',
    publisher: 'The Guardian',
    title: `Article ${sequence}`,
    url: `https://example.com/article-${sequence}`,
    publishedAt: '2026-10-15T12:00:00Z',
    ...overrides,
  };
}
