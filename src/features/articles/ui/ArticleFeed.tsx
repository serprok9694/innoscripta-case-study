import type { ReactNode } from 'react';
import type { Article } from '@/domain/article';
import { Button } from '@/shared/ui/Button';
import type { ArticlesResult } from '../use-articles';
import type { SearchEntryState } from '@/features/search/search-entry';
import type { AuthorFollowing } from '../author-following';
import { useArticlePreview } from '../use-article-preview';
import { ArticleCard, ArticleCardSkeleton } from './ArticleCard';
import { ArticlePreview } from './ArticlePreview';
import { LoadMore } from './LoadMore';
import { SourceFailuresNotice } from './SourceFailuresNotice';

// Explicit columns (minmax(0, 1fr)) so long unbreakable text can't widen the grid.
const GRID = 'grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3';

function Message({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-zinc-300 px-6 py-12 text-center dark:border-zinc-700">
      <p className="font-medium text-zinc-900 dark:text-zinc-100">{title}</p>
      {children && <div className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{children}</div>}
    </div>
  );
}

interface ArticleFeedProps {
  feed: ArticlesResult;
  /** Shown when the query succeeded but nothing matched. */
  empty?: ReactNode;
  /** Enables Follow buttons in the article preview. */
  following?: AuthorFollowing;
  /** History state for the preview's related-search links. */
  relatedLinkState?: SearchEntryState;
}

/**
 * An article feed in every state (loading, error, empty, results, pagination),
 * plus the preview that opens when an article is clicked.
 */
export function ArticleFeed({ feed, empty, following, relatedLinkState }: ArticleFeedProps) {
  const preview = useArticlePreview();

  return (
    <>
      <FeedContent feed={feed} empty={empty} onOpen={preview.open} />
      <ArticlePreview
        article={preview.article}
        onClose={preview.close}
        following={following}
        relatedLinkState={relatedLinkState}
      />
    </>
  );
}

function FeedContent({
  feed,
  empty,
  onOpen,
}: Omit<ArticleFeedProps, 'following' | 'relatedLinkState'> & {
  onOpen: (article: Article) => void;
}) {
  if (feed.hasNoSources) {
    return (
      <Message title="No news sources available">
        Add API keys to <code>.env</code> (see the README), or pick a different source.
      </Message>
    );
  }

  if (feed.isLoading) {
    return (
      <div className={GRID} role="status" aria-label="Loading articles">
        {Array.from({ length: 6 }, (_, i) => (
          <ArticleCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  // Only when there's nothing to show: a failed further page keeps the list.
  if (feed.error && feed.articles.length === 0) {
    return (
      <Message title="Couldn’t load the news">
        <p>None of the news sources could be reached.</p>
        <Button className="mt-4" onClick={() => void feed.retry()}>
          Try again
        </Button>
      </Message>
    );
  }

  return (
    <div className="space-y-6">
      {/* Announces results to screen readers as they load. */}
      <p className="sr-only" aria-live="polite">
        {feed.articles.length === 1 ? '1 article' : `${feed.articles.length} articles`} loaded
      </p>
      <SourceFailuresNotice failures={feed.failures} onRetry={() => void feed.retry()} />

      {feed.articles.length === 0 && !feed.hasNextPage ? (
        (empty ?? <Message title="No articles found" />)
      ) : (
        <>
          {/* Keeps the heading outline intact: page h1 → (this) h2 → card h3. */}
          <h2 className="sr-only">Articles</h2>
          <ul className={GRID} aria-label="Articles">
            {feed.articles.map((article) => (
              <li key={article.id} className="flex min-w-0">
                <ArticleCard article={article} onOpen={onOpen} />
              </li>
            ))}
          </ul>
          {feed.isFetchNextPageError && (
            <p role="alert" className="text-center text-sm text-zinc-600 dark:text-zinc-400">
              Couldn’t load more articles.{' '}
              <button
                type="button"
                onClick={() => void feed.fetchNextPage()}
                className="font-medium text-blue-700 underline dark:text-blue-400"
              >
                Try again
              </button>
            </p>
          )}
          <LoadMore
            hasNextPage={feed.hasNextPage}
            isFetchingNextPage={feed.isFetchingNextPage}
            onLoadMore={() => void feed.fetchNextPage()}
            itemCount={feed.articles.length}
          />
        </>
      )}
    </div>
  );
}
