import { isSourceId } from '@/domain/article';
import { isCategoryId } from '@/domain/category';
import { type NewsFilters, normalizeFilters } from '@/features/articles/filters';

/**
 * Search filters live in the URL so results can be shared and the back button works:
 * `/search?q=climate&from=2026-10-01&to=2026-10-20&category=science,world&source=nyt`
 */
const DATE = /^\d{4}-\d{2}-\d{2}$/;

const list = (params: URLSearchParams, key: string) =>
  params.get(key)?.split(',').filter(Boolean) ?? [];

const date = (params: URLSearchParams, key: string) => {
  const value = params.get(key);
  return value && DATE.test(value) && !Number.isNaN(Date.parse(value)) ? value : undefined;
};

/** Reads filters from the URL, silently dropping anything invalid. */
export function parseSearchParams(params: URLSearchParams): NewsFilters {
  return normalizeFilters({
    keyword: params.get('q') ?? undefined,
    from: date(params, 'from'),
    to: date(params, 'to'),
    categories: list(params, 'category').filter(isCategoryId),
    sources: list(params, 'source').filter(isSourceId),
  });
}

export function toSearchParams(filters: NewsFilters): URLSearchParams {
  const { keyword, from, to, categories, sources } = normalizeFilters(filters);
  const params = new URLSearchParams();
  if (keyword) params.set('q', keyword);
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  if (categories) params.set('category', categories.join(','));
  if (sources) params.set('source', sources.join(','));
  return params;
}
