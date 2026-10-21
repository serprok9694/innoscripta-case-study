import type { MouseEvent, ReactNode } from 'react';
import { Link } from 'react-router';
import { isArticleSort } from '@/domain/news-source';
import type { NewsFilters } from '@/features/articles/filters';
import { useArticles } from '@/features/articles/use-articles';
import { ArticleFeed } from '@/features/articles/ui/ArticleFeed';
import { FollowButton } from '@/features/articles/ui/FollowButton';
import { useAuthorFollowing } from '@/features/preferences/use-author-following';
import { FROM_FEED } from '@/features/search/search-entry';
import { ActiveFilters } from '@/features/search/ui/ActiveFilters';
import { EmptyState } from '@/shared/ui/EmptyState';
import { PageHeader } from '../PageHeader';

function title({ keyword, authors }: NewsFilters): string {
  if (authors?.[0]) return authors[0];
  return keyword ? `Results for “${keyword}”` : 'Filtered news';
}

interface SearchViewProps {
  filters: NewsFilters;
  onChange: (filters: NewsFilters) => void;
  /** Link back to the feed the search started from. */
  feedUrl: string;
  onBackToFeed: (event: MouseEvent<HTMLAnchorElement>) => void;
  /** This search was entered from the feed (see `SearchEntryState`). */
  fromFeed: boolean;
  /** Mobile-only "Filters" button (the sidebar takes over on large screens). */
  filtersButton: ReactNode;
}

/** Search results across all news; `/?author=…` doubles as an author page. */
export function SearchView({
  filters,
  onChange,
  feedUrl,
  onBackToFeed,
  fromFeed,
  filtersButton,
}: SearchViewProps) {
  const feed = useArticles(filters);
  const following = useAuthorFollowing();
  const author = filters.authors?.[0];

  return (
    <>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
        <PageHeader title={title(filters)}>
          <Link
            to={feedUrl}
            onClick={onBackToFeed}
            className="font-medium text-blue-700 hover:underline dark:text-blue-400"
          >
            ← Back to my feed
          </Link>
        </PageHeader>
        {/* With an author filter, the results double as the author's page. */}
        {author && (
          <div className="mb-6">
            <FollowButton name={author} following={following} />
          </div>
        )}
      </div>

      <section aria-label="Results">
        <div className="mb-4 flex items-center justify-between gap-3">
          {filtersButton}
          {/* Relevance needs a keyword, so sorting only shows up with one. */}
          {filters.keyword && (
            <label className="ml-auto flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
              Sort
              <select
                value={filters.sort ?? 'newest'}
                onChange={(event) => {
                  const sort = event.target.value;
                  if (isArticleSort(sort)) onChange({ ...filters, sort });
                }}
                className="rounded-lg border border-zinc-300 bg-white py-1.5 pr-8 pl-3 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              >
                <option value="newest">Newest</option>
                <option value="relevance">Most relevant</option>
              </select>
            </label>
          )}
        </div>

        <div className="mb-6">
          <ActiveFilters
            filters={filters}
            onChange={onChange}
            count={feed.articles.length}
            hasMore={feed.hasNextPage}
          />
        </div>

        <ArticleFeed
          feed={feed}
          following={following}
          relatedLinkState={fromFeed ? FROM_FEED : undefined}
          empty={
            <EmptyState title="No articles match your search">
              <p>Try different keywords, a wider date range or fewer filters.</p>
              <button
                type="button"
                onClick={() => onChange({ keyword: filters.keyword })}
                className="font-medium text-blue-700 hover:underline dark:text-blue-400"
              >
                Clear filters
              </button>
            </EmptyState>
          }
        />
      </section>
    </>
  );
}
