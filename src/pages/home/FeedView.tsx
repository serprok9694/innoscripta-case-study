import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { CATEGORY_LABELS } from '@/domain/category';
import { useArticles } from '@/features/articles/use-articles';
import { ArticleFeed } from '@/features/articles/ui/ArticleFeed';
import { useAppSelector } from '@/app/hooks';
import { hasPreferences, selectPreferences } from '@/features/preferences/preferences-slice';
import { useAuthorFollowing } from '@/features/preferences/use-author-following';
import { cx } from '@/shared/lib/cx';
import { FROM_FEED } from '@/features/search/search-entry';
import { getSource } from '@/sources/registry';
import { PageHeader } from '../PageHeader';

export type FeedViewName = 'for-you' | 'following';

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

/** The personalised feed: "For you" (preferred sources and topics) or "Following" (authors). */
export function FeedView({ view }: { view: FeedViewName }) {
  const preferences = useAppSelector(selectPreferences);
  const following = useAuthorFollowing();
  const { sources, categories, authors } = preferences;

  // Following an author is an explicit choice: their articles show from every source.
  const filters = view === 'following' ? { authors } : { sources, categories };
  const feed = useArticles(filters, { enabled: view === 'for-you' || authors.length > 0 });

  const from = sources.map((s) => getSource(s).name).join(', ') || 'all sources';
  const summary =
    view === 'following'
      ? 'Latest from the authors you follow, from all sources'
      : `${categories.map((c) => CATEGORY_LABELS[c]).join(', ') || 'All topics'} from ${from}`;
  const settingsAction = hasPreferences(preferences) ? 'Edit' : 'Personalise';

  const tabs: Array<{ view: FeedViewName; label: string; to: string }> = [
    { view: 'for-you', label: 'For you', to: '/' },
    { view: 'following', label: `Following (${authors.length})`, to: '/?view=following' },
  ];

  return (
    <>
      {/* One summary line, always present: following someone or changing settings
          never adds or removes anything above the feed, so it doesn't jump. */}
      <PageHeader title="My feed">
        <p className="line-clamp-2" title={summary}>
          {summary} ·{' '}
          <Link to="/settings" className="font-medium text-blue-700 underline dark:text-blue-400">
            {settingsAction}
          </Link>
        </p>
      </PageHeader>

      <nav aria-label="Feed views" className="mb-6">
        <ul className="inline-flex rounded-lg bg-zinc-200/60 p-1 dark:bg-zinc-800">
          {tabs.map((tab) => (
            <li key={tab.view}>
              <Link
                to={tab.to}
                aria-current={view === tab.view ? 'page' : undefined}
                className={cx(
                  // Tabular digits: "Following (1)" is as wide as "Following (0)".
                  'block rounded-md px-4 py-1.5 text-sm font-medium tabular-nums transition-colors',
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
          Open any article and follow its authors, or add authors in {settingsLink}.
        </Message>
      ) : (
        <ArticleFeed
          feed={feed}
          following={following}
          relatedLinkState={FROM_FEED}
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
