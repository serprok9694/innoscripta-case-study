import type { Article, SourceId } from '@/domain/article';
import type { NewsSource } from '@/domain/news-source';
import { SourceError, type SourceErrorKind } from '@/sources/shared/source-error';
import { matchesQuery } from '@/domain/article-matching';
import { type NewsFilters, toArticleQuery } from './filters';

/** Next page to request per source. A source missing from the map is exhausted (or failed). */
export type Cursors = Partial<Record<SourceId, number>>;

export interface SourceFailure {
  sourceId: SourceId;
  kind: SourceErrorKind | 'unknown';
  message: string;
}

export interface FeedPage {
  /** Newest first. */
  articles: Article[];
  /** Cursors for the next page, or `null` when every source is done. */
  next: Cursors | null;
  failures: SourceFailure[];
}

/** Thrown when every requested source failed, so there is nothing to show. */
export class AllSourcesFailedError extends Error {
  override readonly name = 'AllSourcesFailedError';
  readonly failures: SourceFailure[];

  constructor(failures: SourceFailure[]) {
    super('No news source could be reached');
    this.failures = failures;
  }
}

/** Enabled sources narrowed down to the ones the user picked (all if none picked). */
export function selectSources(
  available: readonly NewsSource[],
  filters: NewsFilters,
): NewsSource[] {
  const wanted = filters.sources;
  return wanted?.length ? available.filter((s) => wanted.includes(s.id)) : [...available];
}

export function initialCursors(sources: readonly NewsSource[]): Cursors {
  return Object.fromEntries(sources.map((s) => [s.id, 1]));
}

function toFailure(sourceId: SourceId, reason: unknown): SourceFailure {
  if (reason instanceof SourceError) {
    return { sourceId, kind: reason.kind, message: reason.message };
  }
  return { sourceId, kind: 'unknown', message: 'Unexpected error' };
}

const newestFirst = (a: Article, b: Article) =>
  Date.parse(b.publishedAt) - Date.parse(a.publishedAt);

/**
 * Fetches one page from every source that still has results, in parallel.
 *
 * - Articles are filtered client-side (see `matchesQuery`) and sorted newest first.
 * - A failing source is reported in `failures` and dropped from later pages, so
 *   infinite scrolling never hammers a broken or rate-limited API.
 * - Only when every source fails does the page itself fail.
 */
export async function fetchFeedPage(
  sources: readonly NewsSource[],
  filters: NewsFilters,
  cursors: Cursors,
  signal?: AbortSignal,
): Promise<FeedPage> {
  const query = toArticleQuery(filters);
  const active = sources.flatMap((source) => {
    const page = cursors[source.id];
    return page === undefined ? [] : [{ source, page }];
  });

  const results = await Promise.allSettled(
    active.map(({ source, page }) => source.search(query, page, signal)),
  );
  signal?.throwIfAborted();

  const articles: Article[] = [];
  const failures: SourceFailure[] = [];
  const next: Cursors = {};

  results.forEach((result, index) => {
    const { source } = active[index]!;
    if (result.status === 'rejected') {
      failures.push(toFailure(source.id, result.reason));
      return;
    }
    articles.push(...result.value.articles.filter((a) => matchesQuery(a, filters)));
    if (result.value.nextPage !== null) next[source.id] = result.value.nextPage;
  });

  if (active.length > 0 && failures.length === active.length) {
    throw new AllSourcesFailedError(failures);
  }

  return {
    articles: articles.sort(newestFirst),
    next: Object.keys(next).length ? next : null,
    failures,
  };
}
