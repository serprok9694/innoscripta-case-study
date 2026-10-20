import { foldText } from '@/shared/lib/fold-text';
import type { Article } from './article';
import type { ArticleQuery } from './news-source';

/**
 * Client-side safety net. Sources apply what their API supports; this
 * enforces the rest (e.g. dates on NewsAPI top headlines) and keeps author
 * searches precise (a name in `q` also matches articles that merely mention it).
 */
export function matchesQuery(article: Article, query: ArticleQuery): boolean {
  // Calendar day in UTC, the same convention the APIs use for date filters.
  const day = article.publishedAt.slice(0, 10);
  if (query.from && day < query.from) return false;
  if (query.to && day > query.to) return false;

  if (query.categories?.length) {
    if (!article.category || !query.categories.includes(article.category)) return false;
  }

  if (query.authors?.length) {
    const authors = article.authors.map(foldText);
    const wanted = query.authors.map(foldText);
    if (!wanted.some((name) => authors.some((author) => author.includes(name)))) return false;
  }

  return true;
}
