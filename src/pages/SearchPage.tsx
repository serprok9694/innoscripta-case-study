import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import type { NewsFilters } from '@/features/articles/filters';
import { useArticles } from '@/features/articles/use-articles';
import { ArticleFeed } from '@/features/articles/ui/ArticleFeed';
import { parseSearchParams, toSearchParams } from '@/features/search/search-params';
import { SearchBox } from '@/features/search/ui/SearchBox';
import { SearchFilters } from '@/features/search/ui/SearchFilters';
import { useAuthorFollowing } from '@/features/preferences/use-author-following';
import { Button } from '@/shared/ui/Button';
import { Drawer } from '@/shared/ui/Drawer';
import { SlidersIcon } from '@/shared/ui/icons';
import { PageHeader } from './PageHeader';

function activeFilterCount({ from, to, categories = [], sources = [] }: NewsFilters): number {
  return (from || to ? 1 : 0) + categories.length + sources.length;
}

export function SearchPage() {
  const [params, setParams] = useSearchParams();
  const filters = useMemo(() => parseSearchParams(params), [params]);
  const feed = useArticles(filters);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const following = useAuthorFollowing();

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
          {/* Sidebar on large screens; a bottom-sheet drawer on smaller ones. */}
          <aside aria-label="Filters" className="hidden lg:block">
            <SearchFilters filters={filters} onChange={(next) => setFilters(next)} />
          </aside>

          <Button
            className="mb-6 w-full lg:hidden"
            aria-haspopup="dialog"
            onClick={() => setFiltersOpen(true)}
          >
            <SlidersIcon className="size-4" />
            Filters{count > 0 && ` (${count})`}
          </Button>
          <Drawer
            open={filtersOpen}
            onClose={() => setFiltersOpen(false)}
            title="Filters"
            footer={
              <Button variant="primary" className="w-full" onClick={() => setFiltersOpen(false)}>
                Show results
              </Button>
            }
          >
            {filtersOpen && (
              <SearchFilters filters={filters} onChange={(next) => setFilters(next)} />
            )}
          </Drawer>

          <section aria-label="Results">
            <ArticleFeed
              feed={feed}
              following={following}
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
