import type { Article } from '@/domain/article';
import type { SourcePage } from '@/domain/news-source';

/**
 * Combines pages fetched in parallel for the same page number (one request
 * per category/author). Keeps the first copy of a duplicate and continues
 * while any request has more.
 */
export function mergePages(pages: readonly SourcePage[], page: number): SourcePage {
  const unique = new Map<string, Article>();
  for (const article of pages.flatMap((p) => p.articles)) {
    if (!unique.has(article.id)) unique.set(article.id, article);
  }
  return {
    articles: [...unique.values()],
    nextPage: pages.some((p) => p.nextPage !== null) ? page + 1 : null,
  };
}
