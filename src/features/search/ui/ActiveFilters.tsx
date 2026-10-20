import { CATEGORY_LABELS } from '@/domain/category';
import type { NewsFilters } from '@/features/articles/filters';
import { CloseIcon } from '@/shared/ui/icons';
import { getSource } from '@/sources/registry';

const formatDay = (iso: string) =>
  new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(
    new Date(`${iso}T00:00:00`),
  );

function dateLabel({ from, to }: NewsFilters): string | undefined {
  if (from && to) return `${formatDay(from)} – ${formatDay(to)}`;
  if (from) return `Since ${formatDay(from)}`;
  if (to) return `Until ${formatDay(to)}`;
  return undefined;
}

interface Chip {
  key: string;
  label: string;
  remove: NewsFilters;
}

/** Every applied filter as a removable chip — what's applied is always visible. */
function chipsFor(filters: NewsFilters): Chip[] {
  const without = (patch: Partial<NewsFilters>): NewsFilters => ({ ...filters, ...patch });
  const chips: Chip[] = [];
  const dates = dateLabel(filters);
  if (dates)
    chips.push({ key: 'dates', label: dates, remove: without({ from: undefined, to: undefined }) });
  for (const category of filters.categories ?? []) {
    chips.push({
      key: `category:${category}`,
      label: CATEGORY_LABELS[category],
      remove: without({ categories: filters.categories?.filter((c) => c !== category) }),
    });
  }
  for (const source of filters.sources ?? []) {
    chips.push({
      key: `source:${source}`,
      label: getSource(source).name,
      remove: without({ sources: filters.sources?.filter((s) => s !== source) }),
    });
  }
  for (const author of filters.authors ?? []) {
    chips.push({
      key: `author:${author}`,
      label: `By ${author}`,
      remove: without({ authors: undefined }),
    });
  }
  return chips;
}

interface ActiveFiltersProps {
  filters: NewsFilters;
  onChange: (filters: NewsFilters) => void;
  /** Articles loaded so far, and whether more can be loaded. */
  count: number;
  hasMore: boolean;
}

export function ActiveFilters({ filters, onChange, count, hasMore }: ActiveFiltersProps) {
  const chips = chipsFor(filters);

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <p className="mr-1 text-zinc-600 dark:text-zinc-400">
        {count}
        {hasMore && '+'} {count === 1 && !hasMore ? 'article' : 'articles'}
      </p>
      {chips.length > 0 && (
        <ul aria-label="Applied filters" className="flex flex-wrap gap-2">
          {chips.map((chip) => (
            <li
              key={chip.key}
              className="flex items-center gap-1 rounded-full bg-zinc-200/70 py-0.5 pr-0.5 pl-3 dark:bg-zinc-800"
            >
              {chip.label}
              <button
                type="button"
                aria-label={`Remove filter: ${chip.label}`}
                onClick={() => onChange(chip.remove)}
                className="rounded-full p-1 text-zinc-500 hover:bg-zinc-300 hover:text-zinc-900 dark:hover:bg-zinc-700 dark:hover:text-zinc-100"
              >
                <CloseIcon className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
      {chips.length > 1 && (
        <button
          type="button"
          onClick={() => onChange({ keyword: filters.keyword, sort: filters.sort })}
          className="font-medium text-blue-700 hover:underline dark:text-blue-400"
        >
          Clear all
        </button>
      )}
    </div>
  );
}
