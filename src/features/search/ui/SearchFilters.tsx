import type { SourceId } from '@/domain/article';
import type { CategoryId } from '@/domain/category';
import { CATEGORY_OPTIONS, useSourceOptions } from '@/features/articles/filter-options';
import type { NewsFilters } from '@/features/articles/filters';
import { todayIsoDate } from '@/shared/lib/format-date';
import { Button } from '@/shared/ui/Button';
import { ChipGroup } from '@/shared/ui/ChipGroup';
import { DateField } from './DateField';

/** The user's feed preferences, offered as a one-click starting point. */
export interface FeedPreset {
  sources: readonly SourceId[];
  categories: readonly CategoryId[];
}

interface SearchFiltersProps {
  filters: NewsFilters;
  onChange: (filters: NewsFilters) => void;
  feedPreset?: FeedPreset;
}

const sameSet = <T,>(a: readonly T[] = [], b: readonly T[] = []) =>
  a.length === b.length && a.every((value) => b.includes(value));

/** Facets for search results: date range, topics and sources. Changes apply immediately. */
export function SearchFilters({ filters, onChange, feedPreset }: SearchFiltersProps) {
  const sourceOptions = useSourceOptions();
  const today = todayIsoDate();
  const update = (patch: Partial<NewsFilters>) => onChange({ ...filters, ...patch });

  const presetIsUseful =
    feedPreset &&
    (feedPreset.sources.length > 0 || feedPreset.categories.length > 0) &&
    !(
      sameSet(filters.sources, feedPreset.sources) &&
      sameSet(filters.categories, feedPreset.categories)
    );

  return (
    <div className="space-y-5">
      {presetIsUseful && (
        <Button
          className="w-full"
          onClick={() =>
            update({ sources: [...feedPreset.sources], categories: [...feedPreset.categories] })
          }
        >
          Use my sources & topics
        </Button>
      )}

      <fieldset>
        <legend className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Published
        </legend>
        <div className="grid grid-cols-2 gap-3">
          <DateField
            label="From"
            value={filters.from}
            max={filters.to ?? today}
            onCommit={(from) => update({ from })}
          />
          <DateField
            label="To"
            value={filters.to}
            min={filters.from}
            max={today}
            onCommit={(to) => update({ to })}
          />
        </div>
      </fieldset>

      <ChipGroup
        label="Topics"
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
    </div>
  );
}
