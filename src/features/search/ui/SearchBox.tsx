import { type FormEvent, useId, useState } from 'react';
import { useDebouncedCallback } from '@/shared/lib/use-debounced-callback';

interface SearchBoxProps {
  value: string;
  onChange: (value: string) => void;
  debounceMs?: number;
}

/** Search-as-you-type with debounce; Enter searches immediately. */
export function SearchBox({ value, onChange, debounceMs = 400 }: SearchBoxProps) {
  const inputId = useId();
  const [draft, setDraft] = useState(value);
  const debounced = useDebouncedCallback((next: string) => onChange(next.trim()), debounceMs);

  // Follow external changes (back/forward navigation, "reset filters").
  const [lastValue, setLastValue] = useState(value);
  if (value !== lastValue) {
    setLastValue(value);
    setDraft(value);
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    debounced.cancel();
    onChange(draft.trim());
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
            setDraft(event.target.value);
            debounced.run(event.target.value);
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
