import { useState } from 'react';
import { cx } from '@/shared/lib/cx';

/** Article image with a neutral placeholder when it's missing or fails to load. */
export function ArticleImage({ src, className }: { src?: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  const showImage = src && !failed;

  return (
    <div className={cx('aspect-[16/9] overflow-hidden bg-zinc-100 dark:bg-zinc-800', className)}>
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
