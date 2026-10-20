import { CATEGORY_OPTIONS, useSourceOptions } from '@/features/articles/filter-options';
import type { NewsFilters } from '@/features/articles/filters';
import { todayIsoDate } from '@/shared/lib/format-date';
import { Button } from '@/shared/ui/Button';
import { ChipGroup } from '@/shared/ui/ChipGroup';

const DATE_INPUT =
  'mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:[color-scheme:dark]';

interface SearchFiltersProps {
  filters: NewsFilters;
  onChange: (filters: NewsFilters) => void;
}

export function SearchFilters({ filters, onChange }: SearchFiltersProps) {
  const sourceOptions = useSourceOptions();
  const today = todayIsoDate();
  const update = (patch: Partial<NewsFilters>) => onChange({ ...filters, ...patch });
  const hasFilters = Boolean(
    filters.from || filters.to || filters.categories?.length || filters.sources?.length,
  );

  return (
    <div className="space-y-5">
      <fieldset>
        <legend className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Published
        </legend>
        <div className="grid grid-cols-2 gap-3">
          <label className="text-xs text-zinc-500 dark:text-zinc-400">
            From
            <input
              type="date"
              value={filters.from ?? ''}
              max={filters.to ?? today}
              onChange={(e) => update({ from: e.target.value || undefined })}
              className={DATE_INPUT}
            />
          </label>
          <label className="text-xs text-zinc-500 dark:text-zinc-400">
            To
            <input
              type="date"
              value={filters.to ?? ''}
              min={filters.from}
              max={today}
              onChange={(e) => update({ to: e.target.value || undefined })}
              className={DATE_INPUT}
            />
          </label>
        </div>
      </fieldset>

      <ChipGroup
        label="Categories"
        options={CATEGORY_OPTIONS}
        selected={filters.categories ?? []}
        onChange={(categories) => update({ categories })}
      />

      <ChipGroup
        label="Sources"
        options={sourceOptions}
        selected={filters.sources ?? []}
        onChange={(sources) => update({ sources })}
      />

      {hasFilters && (
        <Button
          variant="ghost"
          className="-ml-4"
          onClick={() => onChange({ keyword: filters.keyword })}
        >
          Clear filters
        </Button>
      )}
    </div>
  );
}
