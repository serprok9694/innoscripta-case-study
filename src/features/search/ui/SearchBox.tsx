import { type FormEvent, useEffect, useId, useRef, useState } from 'react';
import { useDebouncedCallback } from '@/shared/lib/use-debounced-callback';

interface SearchBoxProps {
  value: string;
  onChange: (value: string) => void;
  debounceMs?: number;
  /** Search-as-you-type starts at this many characters (Enter always searches). */
  minLength?: number;
}

/** Search-as-you-type with debounce and a minimum length; Enter searches immediately. */
export function SearchBox({ value, onChange, debounceMs = 600, minLength = 2 }: SearchBoxProps) {
  const inputId = useId();
  const [draft, setDraft] = useState(value);
  /** The last value this box reported, to tell its own updates from outside ones. */
  const reported = useRef(value);
  const report = (next: string) => {
    reported.current = next.trim();
    onChange(next.trim());
  };
  const debounced = useDebouncedCallback(report, debounceMs);

  // Changed from outside (Back, "Back to my feed", clearing): a search still
  // pending from earlier typing must not fire and undo that navigation.
  const { cancel } = debounced;
  useEffect(() => {
    if (value !== reported.current) {
      cancel();
      reported.current = value;
    }
  }, [value, cancel]);

  // Follow external changes (back/forward navigation, "reset filters").
  const [lastValue, setLastValue] = useState(value);
  if (value !== lastValue) {
    setLastValue(value);
    setDraft(value);
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    debounced.cancel();
    report(draft);
  };

  return (
    <search>
      <form onSubmit={handleSubmit} className="relative">
        <label htmlFor={inputId} className="sr-only">
          Search articles
        </label>
        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-zinc-400"
        >
          <path
            fillRule="evenodd"
            d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.45 4.39l3.08 3.08a.75.75 0 1 1-1.06 1.06l-3.08-3.08A7 7 0 0 1 2 9Z"
            clipRule="evenodd"
          />
        </svg>
        <input
          id={inputId}
          type="search"
          value={draft}
          onChange={(event) => {
            const next = event.target.value;
            setDraft(next);
            // Each search costs a request per source, and the free API quotas are
            // small: wait for a pause and a meaningful query.
            const length = next.trim().length;
            if (length === 0 || length >= minLength) debounced.run(next);
            else debounced.cancel();
          }}
          placeholder="Search articles, e.g. climate, elections, AI…"
          autoComplete="off"
          enterKeyHint="search"
          className="w-full rounded-xl border border-zinc-300 bg-white py-3 pr-4 pl-10 text-base shadow-sm placeholder:text-zinc-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900"
        />
      </form>
    </search>
  );
}
