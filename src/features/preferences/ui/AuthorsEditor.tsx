import { type FormEvent, useId, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { Button } from '@/shared/ui/Button';
import {
  canFollowMore,
  followAuthor,
  isFollowing,
  MAX_FOLLOWED_AUTHORS,
  selectAuthors,
  unfollowAuthor,
} from '../preferences-slice';

export function AuthorsEditor() {
  const authors = useAppSelector(selectAuthors);
  const dispatch = useAppDispatch();
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const inputId = useId();
  const full = !canFollowMore(authors);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;
    if (isFollowing(authors, name)) {
      setError(`You already follow ${name.trim()}.`);
      return;
    }
    dispatch(followAuthor(name));
    setName('');
    setError(null);
  };

  return (
    <div className="space-y-3">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <label htmlFor={inputId} className="sr-only">
          Author name
        </label>
        <input
          id={inputId}
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setError(null);
          }}
          disabled={full}
          placeholder={full ? 'Limit reached' : 'e.g. Fiona Harvey'}
          autoComplete="off"
          aria-describedby={`${inputId}-help`}
          className="min-w-0 flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 focus:outline-none disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900"
        />
        <Button type="submit" variant="primary" disabled={full || !name.trim()}>
          Follow
        </Button>
      </form>

      <p id={`${inputId}-help`} className="text-xs text-zinc-500 dark:text-zinc-400">
        {authors.length} of {MAX_FOLLOWED_AUTHORS} followed. Tip: click an author’s name on any
        article to follow them.
      </p>
      <p role="alert" className="text-sm text-red-700 empty:hidden dark:text-red-400">
        {error}
      </p>

      {authors.length > 0 && (
        <ul aria-label="Followed authors" className="flex flex-wrap gap-2">
          {authors.map((author) => (
            <li
              key={author}
              className="flex items-center gap-1 rounded-full border border-zinc-300 py-1 pr-1 pl-3 text-sm dark:border-zinc-700"
            >
              {author}
              <button
                type="button"
                aria-label={`Unfollow ${author}`}
                onClick={() => dispatch(unfollowAuthor(author))}
                className="rounded-full p-1 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline-2 focus-visible:outline-blue-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                  className="size-3.5"
                >
                  <path d="M4.28 3.22a.75.75 0 0 0-1.06 1.06L6.94 8l-3.72 3.72a.75.75 0 1 0 1.06 1.06L8 9.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L9.06 8l3.72-3.72a.75.75 0 0 0-1.06-1.06L8 6.94 4.28 3.22Z" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
