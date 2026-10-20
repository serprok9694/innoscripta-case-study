import type { Article, SourceId } from '@/domain/article';
import type { ArticleQuery } from '@/domain/news-source';
import { foldText } from '@/sources/shared/text';

/** Everything the user can filter by: the source-level query plus the source selection. */
export interface NewsFilters extends ArticleQuery {
  /** Restrict to these sources. Empty or missing means "all enabled sources". */
  sources?: readonly SourceId[];
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
export function toArticleQuery({
  keyword,
  from,
  to,
  categories,
  authors,
}: NewsFilters): ArticleQuery {
  return { keyword, from, to, categories, authors };
}

/**
 * Client-side safety net. Sources apply what their API supports; this
 * enforces the rest (e.g. dates on NewsAPI top headlines) and keeps author
 * searches precise (a name in `q` also matches articles that merely mention it).
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
    const authors = article.authors.map(foldText);
    const wanted = filters.authors.map(foldText);
    if (!wanted.some((name) => authors.some((author) => author.includes(name)))) return false;
  }

  return true;
}
