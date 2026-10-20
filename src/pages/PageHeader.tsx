import type { ReactNode } from 'react';

export function PageHeader({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="mb-6">
      <title>{`${title} · Newsroom`}</title>
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
      {children && <div className="mt-1 text-zinc-600 dark:text-zinc-400">{children}</div>}
    </div>
  );
}
