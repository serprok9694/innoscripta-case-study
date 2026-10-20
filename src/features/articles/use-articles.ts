import { type InfiniteData, useInfiniteQuery } from '@tanstack/react-query';
import type { Article, SourceId } from '@/domain/article';
import { enabledSources } from '@/sources/registry';
import {
  type Cursors,
  type FeedPage,
  fetchFeedPage,
  initialCursors,
  selectSources,
  type SourceFailure,
} from './aggregator';
import { type NewsFilters, normalizeFilters } from './filters';
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
export function useArticles(filters: NewsFilters) {
  const config = useSourcesConfig();
  const normalized = normalizeFilters(filters);
  const sources = config.data ? selectSources(enabledSources(config.data), normalized) : [];

  const query = useInfiniteQuery({
    queryKey: ['articles', normalized, sources.map((s) => s.id)],
    queryFn: ({ pageParam, signal }) => fetchFeedPage(sources, normalized, pageParam, signal),
    initialPageParam: initialCursors(sources),
    getNextPageParam: (lastPage) => lastPage.next ?? undefined,
    enabled: sources.length > 0,
    select: selectFeed,
  });

  return {
    articles: query.data?.articles ?? [],
    failures: query.data?.failures ?? [],
    isLoading: config.isLoading || query.isLoading,
    error: config.error ?? query.error,
    /** No source is configured or none of the picked ones is available. */
    hasNoSources: config.isSuccess && sources.length === 0,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    fetchNextPage: query.fetchNextPage,
    refetch: query.refetch,
  };
}
