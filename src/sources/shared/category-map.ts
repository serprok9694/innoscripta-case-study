import type { CategoryId } from '@/domain/category';

/** Native values (sections, desks…) of the requested categories. */
export function nativeValuesFor<T>(
  map: Partial<Record<CategoryId, readonly T[]>>,
  categories: readonly CategoryId[] = [],
): T[] {
  return [...new Set(categories.flatMap((c) => map[c] ?? []))];
}

/** Reverse lookup: native value → our category. */
export function invertCategoryMap(
  map: Partial<Record<CategoryId, readonly string[]>>,
): ReadonlyMap<string, CategoryId> {
  const entries = Object.entries(map) as [CategoryId, readonly string[]][];
  return new Map(
    entries.flatMap(([category, values]) => values.map((v) => [v, category] as const)),
  );
}
