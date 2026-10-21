import { useId } from 'react';
import { Link } from 'react-router';
import type { Article } from '@/domain/article';
import { CATEGORY_LABELS } from '@/domain/category';
import type { SearchEntryState } from '@/features/search/search-entry';
import { searchUrl } from '@/features/search/search-params';
import { formatDateTime } from '@/shared/lib/format-date';
import { Drawer } from '@/shared/ui/Drawer';
import type { AuthorFollowing } from '../author-following';
import { useSourceCatalog } from '../source-catalog-context';
import { ArticleImage } from './ArticleImage';
import { FollowButton } from './FollowButton';

const LINK = 'font-medium text-blue-700 hover:underline dark:text-blue-400';

/**
 * History state for related-search links ("More by…"): they replace the
 * preview's entry, so a search opened from the feed must say so.
 */
type RelatedLinkState = SearchEntryState | undefined;

function PreviewBody({
  article,
  titleId,
  following,
  relatedLinkState,
}: {
  article: Article;
  titleId: string;
  following?: AuthorFollowing;
  relatedLinkState: RelatedLinkState;
}) {
  const sourceName = useSourceCatalog().nameOf(article.sourceId);

  return (
    <div className="space-y-6">
      <div>
        <ArticleImage src={article.imageUrl} className="-mx-4 -mt-5 mb-4" />
        <p className="text-xs font-medium tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
          {article.publisher}
          {article.category && ` · ${CATEGORY_LABELS[article.category]}`}
        </p>
        <h2 id={titleId} className="mt-1 text-xl leading-snug font-semibold">
          {article.title}
        </h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          <time dateTime={article.publishedAt}>{formatDateTime(article.publishedAt)}</time>
        </p>
        <p className="mt-4 text-zinc-700 dark:text-zinc-300">
          {article.summary ??
            `No summary from ${article.publisher}. Read the full article on the site.`}
        </p>
      </div>

      {article.authors.length > 0 && (
        <section aria-labelledby={`${titleId}-authors`}>
          <h3 id={`${titleId}-authors`} className="mb-2 text-sm font-semibold">
            Authors
          </h3>
          <ul className="space-y-2">
            {article.authors.map((name) => (
              <li key={name} className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-medium">{name}</p>
                  <Link
                    to={searchUrl({ authors: [name] })}
                    replace
                    state={relatedLinkState}
                    className={`text-sm ${LINK}`}
                  >
                    More by {name}
                  </Link>
                </div>
                {following && <FollowButton name={name} following={following} />}
              </li>
            ))}
          </ul>
          {following && !following.canFollow && (
            <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
              You’re following the maximum number of authors.{' '}
              <Link to="/settings" replace className={LINK}>
                Manage in Settings
              </Link>
            </p>
          )}
        </section>
      )}

      <section aria-labelledby={`${titleId}-explore`}>
        <h3 id={`${titleId}-explore`} className="mb-2 text-sm font-semibold">
          Explore
        </h3>
        <ul className="space-y-1 text-sm">
          {article.category && (
            <li>
              <Link
                to={searchUrl({ categories: [article.category] })}
                replace
                state={relatedLinkState}
                className={LINK}
              >
                More in {CATEGORY_LABELS[article.category]}
              </Link>
            </li>
          )}
          <li>
            {/* The source, not the publisher: NewsAPI can't filter by publisher. */}
            <Link
              to={searchUrl({ sources: [article.sourceId] })}
              replace
              state={relatedLinkState}
              className={LINK}
            >
              More from {sourceName}
            </Link>
          </li>
        </ul>
      </section>
    </div>
  );
}

interface ArticlePreviewProps {
  article: Article | undefined;
  onClose: () => void;
  following?: AuthorFollowing;
  relatedLinkState?: RelatedLinkState;
}

/**
 * Article details and actions in a side panel (bottom sheet on phones):
 * read on the original site, follow the authors, find related articles.
 * Built from already loaded data — APIs return snippets, not full text.
 */
export function ArticlePreview({
  article,
  onClose,
  following,
  relatedLinkState,
}: ArticlePreviewProps) {
  const titleId = useId();

  return (
    <Drawer
      open={Boolean(article)}
      onClose={onClose}
      title={article?.publisher ?? ''}
      labelledBy={titleId}
      placement="adaptive"
      footer={
        article && (
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            Read on {article.publisher}
            <span aria-hidden="true">↗</span> <span className="sr-only">(opens in a new tab)</span>
          </a>
        )
      }
    >
      {article && (
        <PreviewBody
          article={article}
          titleId={titleId}
          following={following}
          relatedLinkState={relatedLinkState}
        />
      )}
    </Drawer>
  );
}
