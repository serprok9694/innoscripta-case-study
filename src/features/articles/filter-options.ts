import type { SourceId } from '@/domain/article';
import { CATEGORIES, CATEGORY_LABELS, type CategoryId } from '@/domain/category';
import type { ChipOption } from '@/shared/ui/ChipGroup';
import { NEWS_SOURCES } from '@/sources/registry';
import { useSourcesConfig } from './use-sources-config';

export const CATEGORY_OPTIONS: ChipOption<CategoryId>[] = CATEGORIES.map((id) => ({
  value: id,
  label: CATEGORY_LABELS[id],
}));

/** All sources; the ones without an API key are disabled with an explanation. */
export function useSourceOptions(): ChipOption<SourceId>[] {
  const { data } = useSourcesConfig();
  return NEWS_SOURCES.map((source) => {
    const available = data?.sources[source.id] === true;
    return {
      value: source.id,
      label: source.name,
      disabled: !available,
      hint: available ? undefined : 'Not configured: add an API key to enable this source',
    };
  });
}
