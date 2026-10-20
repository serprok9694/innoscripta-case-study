import { foldText } from '@/shared/lib/fold-text';
import type { Article } from './article';
import type { ArticleQuery } from './news-source';

const words = (name: string) =>
  foldText(name)
    .split(/[\s.,]+/)
    .filter(Boolean);

/** Whole-word match: "Harvey" matches "Fiona Harvey", but "Ian" doesn't match "Brian". */
function containsWords(byline: readonly string[], name: readonly string[]): boolean {
  return name.every((word) => byline.includes(word));
}

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
    const bylines = article.authors.map(words);
    const wanted = query.authors.map(words);
    if (!wanted.some((name) => bylines.some((byline) => containsWords(byline, name)))) {
      return false;
    }
  }

  return true;
}
