import { useState } from 'react';
import type { Article } from '@/domain/article';
import { CATEGORY_LABELS } from '@/domain/category';
import { formatDateTime, formatRelativeTime } from '@/shared/lib/format-date';

function ArticleImage({ src }: { src?: string }) {
  const [failed, setFailed] = useState(false);
  const showImage = src && !failed;

  return (
    <div className="aspect-[16/9] overflow-hidden bg-zinc-100 dark:bg-zinc-800">
      {showImage ? (
        <img
          src={src}
          alt=""
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
          className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      ) : (
        <div
          data-testid="image-placeholder"
          className="size-full bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-900"
        />
      )}
    </div>
  );
}

export function ArticleCard({ article }: { article: Article }) {
  return (
    <article className="group relative flex w-full flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
      <ArticleImage src={article.imageUrl} />

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
          {/* The ::after overlay makes the whole card clickable while keeping one link. */}
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group-hover:underline after:absolute after:inset-0 focus-visible:outline-none after:focus-visible:rounded-xl after:focus-visible:outline-2 after:focus-visible:outline-blue-600"
          >
            {article.title}
          </a>
        </h3>

        {article.summary && (
          <p className="line-clamp-3 text-sm text-zinc-600 dark:text-zinc-400">{article.summary}</p>
        )}

        <p className="mt-auto flex items-center gap-2 pt-2 text-xs text-zinc-500 dark:text-zinc-400">
          {article.author && (
            <>
              <span className="min-w-0 truncate">{article.author}</span>
              <span aria-hidden="true">·</span>
            </>
          )}
          <time
            dateTime={article.publishedAt}
            title={formatDateTime(article.publishedAt)}
            className="shrink-0"
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
