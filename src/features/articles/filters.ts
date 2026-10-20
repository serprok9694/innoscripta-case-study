import type { SourceId } from '@/domain/article';
import type { ArticleQuery } from '@/domain/news-source';

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
