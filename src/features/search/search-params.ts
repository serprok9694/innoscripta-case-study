import { isSourceId } from '@/domain/article';
import { isCategoryId } from '@/domain/category';
import { type NewsFilters, normalizeFilters } from '@/features/articles/filters';
import { isPlausibleDate } from './plausible-date';

/**
 * Search filters live in the URL of the home page, so results can be shared
 * and the back button works:
 * `/?q=climate&from=2026-10-01&to=2026-10-20&category=science,world&source=nyt`
 * `/?author=Fiona+Harvey` doubles as an author page.
 */

const list = (params: URLSearchParams, key: string) =>
  params.get(key)?.split(',').filter(Boolean) ?? [];

const date = (params: URLSearchParams, key: string) => {
  const value = params.get(key);
  return value && isPlausibleDate(value) && !Number.isNaN(Date.parse(value)) ? value : undefined;
};

/** Reads filters from the URL, silently dropping anything invalid. */
export function parseSearchParams(params: URLSearchParams): NewsFilters {
  return normalizeFilters({
    keyword: params.get('q') ?? undefined,
    from: date(params, 'from'),
    to: date(params, 'to'),
    categories: list(params, 'category').filter(isCategoryId),
    sources: list(params, 'source').filter(isSourceId),
    // One author: names can contain commas, so this isn't a list.
    authors: [params.get('author') ?? ''],
    sort: params.get('sort') === 'relevance' ? 'relevance' : undefined,
  });
}

export function toSearchParams(filters: NewsFilters): URLSearchParams {
  const { keyword, from, to, categories, sources, authors, sort } = normalizeFilters(filters);
  const params = new URLSearchParams();
  if (keyword) params.set('q', keyword);
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  if (categories) params.set('category', categories.join(','));
  if (sources) params.set('source', sources.join(','));
  if (authors?.[0]) params.set('author', authors[0]);
  if (sort) params.set('sort', sort);
  return params;
}

/** The home page shows search results whenever the URL has a query or any filter. */
export function isSearching(filters: NewsFilters): boolean {
  const { sort: _sort, ...criteria } = normalizeFilters(filters);
  return Object.keys(criteria).length > 0;
}

/** Link to search results for `filters`. */
export function searchUrl(filters: NewsFilters): string {
  return `/?${toSearchParams(filters).toString()}`;
}
