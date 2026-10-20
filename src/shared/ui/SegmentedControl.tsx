import { useId } from 'react';
import { cx } from '@/shared/lib/cx';

interface SegmentedControlProps<T extends string> {
  label: string;
  options: ReadonlyArray<{ value: T; label: string }>;
  value: T;
  onChange: (value: T) => void;
}

/** Single choice built on native radio inputs (keyboard and screen-reader support for free). */
export function SegmentedControl<T extends string>({
  label,
  options,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  const name = useId();

  return (
    <fieldset>
      <legend className="sr-only">{label}</legend>
      <div className="inline-flex rounded-lg bg-zinc-200/60 p-1 dark:bg-zinc-800">
        {options.map((option) => (
          <label
            key={option.value}
            className={cx(
              'cursor-pointer rounded-md px-4 py-1.5 text-sm font-medium transition-colors',
              'has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-blue-600',
              option.value === value
                ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-950 dark:text-zinc-100'
                : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100',
            )}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={option.value === value}
              onChange={() => onChange(option.value)}
              className="sr-only"
            />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
