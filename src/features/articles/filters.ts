import type { Article, SourceId } from '@/domain/article';
import type { ArticleQuery } from '@/domain/news-source';

/** Everything the user can filter by: the source-level query plus aggregator-level filters. */
export interface NewsFilters extends ArticleQuery {
  /** Restrict to these sources. Empty or missing means "all enabled sources". */
  sources?: readonly SourceId[];
  /** Keep articles by any of these authors (case- and accent-insensitive substring match). */
  authors?: readonly string[];
}

function normalizeList<T extends string>(values: readonly T[] | undefined): T[] | undefined {
  const unique = [...new Set(values?.map((v) => v.trim() as T).filter(Boolean))].sort();
  return unique.length ? unique : undefined;
}

/**
 * Canonical form of the filters: trimmed, sorted, empty values dropped and
 * the date range ordered. Equal filters → equal objects → one cache entry.
 */
export function normalizeFilters(filters: NewsFilters): NewsFilters {
  let { from, to } = filters;
  if (from && to && from > to) [from, to] = [to, from];

  const normalized: NewsFilters = {
    keyword: filters.keyword?.trim() || undefined,
    from: from || undefined,
    to: to || undefined,
    categories: normalizeList(filters.categories),
    sources: normalizeList(filters.sources),
    authors: normalizeList(filters.authors),
  };
  return Object.fromEntries(
    Object.entries(normalized).filter(([, value]) => value !== undefined),
  ) as NewsFilters;
}

/** The part of the filters that source adapters understand. */
export function toArticleQuery({ keyword, from, to, categories }: NewsFilters): ArticleQuery {
  return { keyword, from, to, categories };
}

const fold = (value: string) =>
  value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();

/**
 * Client-side safety net. Sources apply what their API supports; this
 * enforces the rest (e.g. dates on NewsAPI top headlines, authors everywhere).
 */
export function matchesFilters(article: Article, filters: NewsFilters): boolean {
  // Calendar day in UTC, the same convention the APIs use for date filters.
  const day = article.publishedAt.slice(0, 10);
  if (filters.from && day < filters.from) return false;
  if (filters.to && day > filters.to) return false;

  if (filters.categories?.length) {
    if (!article.category || !filters.categories.includes(article.category)) return false;
  }

  if (filters.authors?.length) {
    const author = article.author ? fold(article.author) : '';
    if (!filters.authors.some((name) => author.includes(fold(name)))) return false;
  }

  return true;
}
