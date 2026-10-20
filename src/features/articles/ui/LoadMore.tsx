import { useEffect, useRef } from 'react';
import { Button } from '@/shared/ui/Button';

interface LoadMoreProps {
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  onLoadMore: () => void;
  /** Number of items shown; auto-loading re-arms only when it grows. */
  itemCount: number;
}

/**
 * Infinite scroll with a button fallback.
 *
 * Auto-loading re-arms only when the list grew: if a page adds nothing
 * (e.g. everything was filtered out client-side) the user has to click,
 * so a sentinel that stays in view can't drain an API quota.
 */
export function LoadMore({
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
  itemCount,
}: LoadMoreProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadRef = useRef(onLoadMore);
  const fetchingRef = useRef(isFetchingNextPage);

  useEffect(() => {
    loadRef.current = onLoadMore;
    fetchingRef.current = isFetchingNextPage;
  });

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasNextPage || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && !fetchingRef.current) loadRef.current();
      },
      { rootMargin: '600px 0px' },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
    // `itemCount` is intentional: re-observing fires the callback again if the
    // sentinel is still in view, which is exactly "load more once the list grew".
    // oxlint-disable-next-line react/exhaustive-effect-dependencies
  }, [hasNextPage, itemCount]);

  if (!hasNextPage) return null;

  return (
    <div ref={sentinelRef} className="flex justify-center py-6">
      <Button onClick={onLoadMore} disabled={isFetchingNextPage}>
        {isFetchingNextPage ? 'Loading more…' : 'Load more'}
      </Button>
    </div>
  );
}
