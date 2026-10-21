import type { MouseEvent } from 'react';
import type { Article } from '@/domain/article';
import { CATEGORY_LABELS } from '@/domain/category';
import { formatDateTime, formatRelativeTime } from '@/shared/lib/format-date';
import { formatAuthors } from '../format-authors';
import { ArticleImage } from './ArticleImage';

/** A plain left click, i.e. not "open in a new tab/window". */
function isPlainClick(event: MouseEvent) {
  return event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
}

interface ArticleCardProps {
  article: Article;
  /**
   * Opens the in-app preview on a plain click. The card stays a real link,
   * so Cmd/Ctrl/middle click still open the original article in a new tab.
   */
  onOpen?: (article: Article) => void;
  /** One of the first cards on screen: its image loads eagerly. */
  priority?: boolean;
}

export function ArticleCard({ article, onOpen, priority }: ArticleCardProps) {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (!onOpen || !isPlainClick(event)) return;
    event.preventDefault();
    onOpen(article);
  };

  return (
    <article className="group relative flex w-full flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
      <ArticleImage src={article.imageUrl} priority={priority} />

      <div className="flex flex-1 flex-col gap-2 p-4">
        <p className="flex flex-wrap items-center gap-x-2 text-xs font-medium tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
          <span>{article.publisher}</span>
          {article.category && (
            <>
              <span aria-hidden="true">·</span>
              <span className="text-blue-700 dark:text-blue-400">
                {CATEGORY_LABELS[article.category]}
              </span>
            </>
          )}
        </p>

        <h3 className="line-clamp-3 text-lg leading-snug font-semibold text-zinc-900 dark:text-zinc-50">
          {/* The ::after overlay makes the whole card clickable while keeping one link;
              it also draws the focus ring (Tailwind 4 variants apply left to right). */}
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleClick}
            aria-haspopup={onOpen ? 'dialog' : undefined}
            className="group-hover:underline after:absolute after:inset-0 focus-visible:outline-none focus-visible:after:rounded-xl focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-blue-600 dark:focus-visible:after:outline-blue-400"
          >
            {article.title}
          </a>
        </h3>

        {article.summary && (
          <p className="line-clamp-3 text-sm text-zinc-600 dark:text-zinc-400">{article.summary}</p>
        )}

        {/* Authors wrap instead of being cut off; the time stays on the right. */}
        <p className="mt-auto flex items-start justify-between gap-3 pt-2 text-xs text-zinc-500 dark:text-zinc-400">
          {article.authors.length > 0 && (
            <span className="min-w-0" title={article.authors.join(', ')}>
              {formatAuthors(article.authors)}
            </span>
          )}
          <time
            dateTime={article.publishedAt}
            title={formatDateTime(article.publishedAt)}
            className="ml-auto shrink-0"
          >
            {formatRelativeTime(article.publishedAt)}
          </time>
        </p>
      </div>
    </article>
  );
}

export function ArticleCardSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="animate-pulse overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800"
    >
      <div className="aspect-[16/9] bg-zinc-200 dark:bg-zinc-800" />
      <div className="space-y-3 p-4">
        <div className="h-3 w-1/3 rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-5 w-full rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-5 w-2/3 rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-3 w-1/2 rounded bg-zinc-200 dark:bg-zinc-800" />
      </div>
    </div>
  );
}
