import type { SourceId } from '@/domain/article';
import { CATEGORIES, CATEGORY_LABELS, type CategoryId } from '@/domain/category';
import type { ChipOption } from '@/shared/ui/ChipGroup';
import { useSourceCatalog } from './source-catalog-context';
import { useSourcesConfig } from './use-sources-config';

export const CATEGORY_OPTIONS: ChipOption<CategoryId>[] = CATEGORIES.map((id) => ({
  value: id,
  label: CATEGORY_LABELS[id],
}));

/** All sources; the ones without an API key are disabled with an explanation. */
export function useSourceOptions(): ChipOption<SourceId>[] {
  const catalog = useSourceCatalog();
  const { data } = useSourcesConfig();
  return catalog.all.map((source) => {
    const available = data ? catalog.isAvailable(data, source.id) : false;
    return {
      value: source.id,
      label: source.name,
      disabled: !available,
      hint: available ? undefined : 'Sources without an API key are unavailable.',
    };
  });
}
