import type { ReactNode } from 'react';

interface EmptyStateProps {
  title: string;
  /** Explanation and, optionally, a way forward (links, buttons). */
  children?: ReactNode;
}

/** The one placeholder for "nothing to show" situations: empty results, errors, setup hints. */
export function EmptyState({ title, children }: EmptyStateProps) {
  return (
    <div className="rounded-xl border border-dashed border-zinc-300 px-6 py-12 text-center dark:border-zinc-700">
      <p className="font-medium text-zinc-900 dark:text-zinc-100">{title}</p>
      {children && (
        <div className="mt-2 space-y-4 text-sm text-zinc-600 dark:text-zinc-400">{children}</div>
      )}
    </div>
  );
}
