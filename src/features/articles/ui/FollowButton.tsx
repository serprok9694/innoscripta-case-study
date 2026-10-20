import { cx } from '@/shared/lib/cx';
import type { AuthorFollowing } from '../author-following';

/**
 * Follow toggle for one author. The visible label is part of the accessible
 * name ("Follow Fiona Harvey" / "Following Fiona Harvey"), so it reads the
 * same for sighted and screen-reader users.
 */
export function FollowButton({ name, following }: { name: string; following: AuthorFollowing }) {
  const followed = following.isFollowing(name);

  return (
    <button
      type="button"
      onClick={() => following.toggle(name)}
      disabled={!followed && !following.canFollow}
      className={cx(
        'shrink-0 rounded-full border px-3 py-1 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50',
        followed
          ? 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900'
          : 'border-zinc-300 hover:border-zinc-500 dark:border-zinc-700 dark:hover:border-zinc-500',
      )}
    >
      {/* The space must sit outside the hidden span, or names read as "FollowAjit". */}
      {followed ? 'Following' : 'Follow'} <span className="sr-only">{name}</span>
    </button>
  );
}
