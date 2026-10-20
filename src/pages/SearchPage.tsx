import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import type { NewsFilters } from '@/features/articles/filters';
import { useArticles } from '@/features/articles/use-articles';
import { ArticleFeed } from '@/features/articles/ui/ArticleFeed';
import { parseSearchParams, toSearchParams } from '@/features/search/search-params';
import { SearchBox } from '@/features/search/ui/SearchBox';
import { SearchFilters } from '@/features/search/ui/SearchFilters';
import { cx } from '@/shared/lib/cx';
import { Button } from '@/shared/ui/Button';
import { PageHeader } from './PageHeader';

function activeFilterCount({ from, to, categories = [], sources = [] }: NewsFilters): number {
  return (from || to ? 1 : 0) + categories.length + sources.length;
}

export function SearchPage() {
  const [params, setParams] = useSearchParams();
  const filters = useMemo(() => parseSearchParams(params), [params]);
  const feed = useArticles(filters);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Typing replaces the history entry; filter changes are navigable with Back.
  const setFilters = (next: NewsFilters, replace = false) =>
    setParams(toSearchParams(next), { replace });

  const count = activeFilterCount(filters);

  return (
    <>
      <PageHeader title="Search">Find articles across all sources.</PageHeader>

      <div className="space-y-6">
        <SearchBox
          value={filters.keyword ?? ''}
          onChange={(keyword) => setFilters({ ...filters, keyword }, true)}
        />

        <div className="gap-8 lg:grid lg:grid-cols-[16rem_minmax(0,1fr)]">
          <aside aria-label="Filters" className="mb-6 lg:mb-0">
            <Button
              className="w-full lg:hidden"
              aria-expanded={filtersOpen}
              aria-controls="search-filters"
              onClick={() => setFiltersOpen((open) => !open)}
            >
              {filtersOpen ? 'Hide filters' : 'Show filters'}
              {count > 0 && ` (${count})`}
            </Button>
            <div
              id="search-filters"
              className={cx(filtersOpen ? 'block' : 'hidden', 'mt-4 lg:mt-0 lg:block')}
            >
              <SearchFilters filters={filters} onChange={(next) => setFilters(next)} />
            </div>
          </aside>

          <section aria-label="Results">
            <ArticleFeed
              feed={feed}
              empty={
                <div className="rounded-xl border border-dashed border-zinc-300 px-6 py-12 text-center dark:border-zinc-700">
                  <p className="font-medium">No articles match your search</p>
                  <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                    Try different keywords, a wider date range or fewer filters.
                  </p>
                </div>
              }
            />
          </section>
        </div>
      </div>
    </>
  );
}
