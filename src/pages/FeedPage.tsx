import type { ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router';
import { CATEGORY_LABELS } from '@/domain/category';
import { useArticles } from '@/features/articles/use-articles';
import { ArticleFeed } from '@/features/articles/ui/ArticleFeed';
import { useAppSelector } from '@/app/hooks';
import { hasPreferences, selectPreferences } from '@/features/preferences/preferences-slice';
import { useAuthorFollowing } from '@/features/preferences/use-author-following';
import { cx } from '@/shared/lib/cx';
import { getSource } from '@/sources/registry';
import { PageHeader } from './PageHeader';

type View = 'for-you' | 'following';

function Message({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-zinc-300 px-6 py-12 text-center dark:border-zinc-700">
      <p className="font-medium">{title}</p>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{children}</p>
    </div>
  );
}

const settingsLink = (
  <Link to="/settings" className="font-medium text-blue-700 underline dark:text-blue-400">
    Settings
  </Link>
);

export function FeedPage() {
  const [params] = useSearchParams();
  const view: View = params.get('view') === 'following' ? 'following' : 'for-you';
  const preferences = useAppSelector(selectPreferences);
  const following = useAuthorFollowing();
  const { sources, categories, authors } = preferences;

  const filters = view === 'following' ? { sources, authors } : { sources, categories };
  const feed = useArticles(filters, { enabled: view === 'for-you' || authors.length > 0 });

  const from = sources.map((s) => getSource(s).name).join(', ') || 'all sources';
  const summary =
    view === 'following'
      ? `Articles by the authors you follow, from ${from}`
      : `${categories.map((c) => CATEGORY_LABELS[c]).join(', ') || 'All topics'} from ${from}`;

  const tabs: Array<{ view: View; label: string; to: string }> = [
    { view: 'for-you', label: 'For you', to: '/' },
    { view: 'following', label: `Following (${authors.length})`, to: '/?view=following' },
  ];

  return (
    <>
      <PageHeader title="My feed">{summary}</PageHeader>

      {!hasPreferences(preferences) && (
        <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-100">
          <strong>Make it yours.</strong> Pick your sources, topics and authors in {settingsLink} —
          for now you’re seeing the latest from everywhere.
        </div>
      )}

      <nav aria-label="Feed views" className="mb-6">
        <ul className="inline-flex rounded-lg bg-zinc-200/60 p-1 dark:bg-zinc-800">
          {tabs.map((tab) => (
            <li key={tab.view}>
              <Link
                to={tab.to}
                aria-current={view === tab.view ? 'page' : undefined}
                className={cx(
                  'block rounded-md px-4 py-1.5 text-sm font-medium transition-colors',
                  view === tab.view
                    ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-950 dark:text-zinc-100'
                    : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100',
                )}
              >
                {tab.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {view === 'following' && authors.length === 0 ? (
        <Message title="You’re not following anyone yet">
          Click an author’s name on any article, or add authors in {settingsLink}.
        </Message>
      ) : (
        <ArticleFeed
          feed={feed}
          following={following}
          empty={
            <Message title="Nothing here yet">
              {view === 'following'
                ? 'Your authors haven’t published anything recently in the selected sources.'
                : 'No recent articles match your preferences. Try more topics or sources.'}
            </Message>
          }
        />
      )}
    </>
  );
}
