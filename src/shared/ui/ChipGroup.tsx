import { useId } from 'react';
import { cx } from '@/shared/lib/cx';

export interface ChipOption<T extends string> {
  value: T;
  label: string;
  disabled?: boolean;
  /** Shown as a tooltip, e.g. why an option is disabled. */
  hint?: string;
}

interface ChipGroupProps<T extends string> {
  label: string;
  options: readonly ChipOption<T>[];
  selected: readonly T[];
  onChange: (selected: T[]) => void;
}

/** Multi-select as a row of toggle buttons. Nothing selected means "all". */
export function ChipGroup<T extends string>({
  label,
  options,
  selected,
  onChange,
}: ChipGroupProps<T>) {
  const hintId = useId();
  // Why options are unavailable, visible to everyone (a `title` tooltip isn't
  // shown on touch devices or to keyboard users).
  const hints = [...new Set(options.filter((o) => o.disabled && o.hint).map((o) => o.hint))];

  const toggle = (value: T) =>
    onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value]);

  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const pressed = selected.includes(option.value);
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={pressed}
              disabled={option.disabled}
              aria-describedby={option.disabled && option.hint ? hintId : undefined}
              onClick={() => toggle(option.value)}
              className={cx(
                'rounded-full border px-3 py-1 text-sm transition-colors',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600',
                'disabled:cursor-not-allowed disabled:opacity-40',
                pressed
                  ? 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900'
                  : 'border-zinc-300 text-zinc-700 hover:border-zinc-500 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-500',
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
      {hints.length > 0 && (
        <p id={hintId} className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
          {hints.join(' ')}
        </p>
      )}
    </fieldset>
  );
}
