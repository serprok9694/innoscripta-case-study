import { type InfiniteData, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import type { Article, SourceId } from '@/domain/article';
import {
  type Cursors,
  type FeedPage,
  fetchFeedPage,
  initialCursors,
  selectSources,
  type SourceFailure,
} from './aggregator';
import { type NewsFilters, normalizeFilters } from './filters';
import { useSourceCatalog } from './source-catalog-context';
import { useSourcesConfig } from './use-sources-config';

export interface Feed {
  articles: Article[];
  /** Latest failure per source across all loaded pages. */
  failures: SourceFailure[];
}

/** Flattens pages; pagination can shift between requests, so duplicates are dropped. */
function selectFeed(data: InfiniteData<FeedPage, Cursors>): Feed {
  const articles = new Map<string, Article>();
  const failures = new Map<SourceId, SourceFailure>();
  for (const page of data.pages) {
    for (const article of page.articles) {
      if (!articles.has(article.id)) articles.set(article.id, article);
    }
    for (const failure of page.failures) failures.set(failure.sourceId, failure);
  }
  return { articles: [...articles.values()], failures: [...failures.values()] };
}

/**
 * Infinite, multi-source article feed for the given filters.
 * Equivalent filters share a cache entry (see `normalizeFilters`).
 */
export function useArticles(filters: NewsFilters, { enabled = true }: { enabled?: boolean } = {}) {
  const catalog = useSourceCatalog();
  const config = useSourcesConfig();
  const normalized = normalizeFilters(filters);
  const sources = config.data ? selectSources(catalog.available(config.data), normalized) : [];

  const queryClient = useQueryClient();
  const queryKey = ['articles', normalized, sources.map((s) => s.id)];

  const query = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam, signal }) => fetchFeedPage(sources, normalized, pageParam, signal),
    initialPageParam: initialCursors(sources),
    getNextPageParam: (lastPage) => lastPage.next ?? undefined,
    enabled: enabled && sources.length > 0,
    select: selectFeed,
    // An infinite query refetches *every* loaded page when it goes stale and is
    // shown again: after scrolling 8 pages that's 8 requests per source. Feeds are
    // refreshed explicitly instead (`refresh`), always from the first page; an
    // unused feed is dropped after `gcTime` and starts fresh next time.
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  /** Start over from the first page (never re-request every loaded page). */
  const restart = () => queryClient.resetQueries({ queryKey, exact: true });

  return {
    articles: query.data?.articles ?? [],
    failures: query.data?.failures ?? [],
    isLoading: config.isLoading || query.isLoading,
    error: config.error ?? query.error,
    /** No source is configured or none of the picked ones is available. */
    hasNoSources: enabled && config.isSuccess && sources.length === 0,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    /** Loading a further page failed (the articles already loaded stay). */
    isFetchNextPageError: query.isFetchNextPageError,
    fetchNextPage: query.fetchNextPage,
    /** When the loaded articles were fetched (0 before the first load). */
    updatedAt: query.dataUpdatedAt,
    /** Reload the newest articles. */
    refresh: restart,
    /** Retry after sources failed. */
    retry: restart,
  };
}

export type ArticlesResult = ReturnType<typeof useArticles>;
