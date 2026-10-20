import { useState } from 'react';
import { isPlausibleDate } from '../plausible-date';

const INPUT =
  'mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:[color-scheme:dark]';

interface DateFieldProps {
  label: string;
  value: string | undefined;
  min?: string;
  max?: string;
  onCommit: (value: string | undefined) => void;
}

/**
 * Date input that keeps what's being typed locally and only reports
 * complete, plausible dates (or clearing), so half-typed years never reach
 * the URL, the history or the APIs.
 */
export function DateField({ label, value = '', min, max, onCommit }: DateFieldProps) {
  const [draft, setDraft] = useState(value);

  // Follow external changes ("Clear all", back/forward navigation).
  const [lastValue, setLastValue] = useState(value);
  if (value !== lastValue) {
    setLastValue(value);
    setDraft(value);
  }

  return (
    <label className="text-xs text-zinc-500 dark:text-zinc-400">
      {label}
      <input
        type="date"
        value={draft}
        min={min}
        max={max}
        onChange={(event) => {
          const next = event.target.value;
          setDraft(next);
          if (next === '') onCommit(undefined);
          else if (isPlausibleDate(next)) onCommit(next);
        }}
        className={INPUT}
      />
    </label>
  );
}
