import { useEffect, useState } from 'react';
import { formatRelativeTime } from '@/shared/lib/format-date';

/** Re-render every minute so "updated … ago" stays true. */
function useNow(intervalMs = 60_000): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);
  return now;
}

/**
 * The feed doesn't refetch on its own (that would re-request every loaded
 * page): it says how fresh it is and lets the reader refresh.
 */
export function FreshnessBar({
  updatedAt,
  onRefresh,
}: {
  updatedAt: number;
  onRefresh: () => void;
}) {
  const now = useNow();
  if (!updatedAt) return null;

  return (
    <p className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
      <span>Updated {formatRelativeTime(new Date(updatedAt).toISOString(), now)}</span>
      <span aria-hidden="true">·</span>
      <button
        type="button"
        onClick={onRefresh}
        className="font-medium text-blue-700 hover:underline dark:text-blue-400"
      >
        Refresh
      </button>
    </p>
  );
}
