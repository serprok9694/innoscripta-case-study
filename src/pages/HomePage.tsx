import { type MouseEvent, useMemo, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router';
import { useAppSelector } from '@/app/hooks';
import type { NewsFilters } from '@/features/articles/filters';
import { selectPreferences } from '@/features/preferences/preferences-slice';
import { isSearching, parseSearchParams, toSearchParams } from '@/features/search/search-params';
import { FROM_FEED, isFromFeed } from '@/features/search/search-entry';
import { SearchBox } from '@/features/search/ui/SearchBox';
import { SearchFilters } from '@/features/search/ui/SearchFilters';
import { Button } from '@/shared/ui/Button';
import { Drawer } from '@/shared/ui/Drawer';
import { SlidersIcon } from '@/shared/ui/icons';
import { type FeedViewName, FeedView } from './home/FeedView';
import { SearchView } from './home/SearchView';

function activeFilterCount({
  from,
  to,
  categories = [],
  sources = [],
  authors = [],
}: NewsFilters): number {
  return (from || to ? 1 : 0) + categories.length + sources.length + authors.length;
}

/**
 * Home: the personalised feed (driven by Settings), with search on top.
 * Typing or picking a filter turns the page into search results across all
 * news — filters belong to search, never to the feed.
 */
export function HomePage() {
  const [params, setParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const filters = useMemo(() => parseSearchParams(params), [params]);
  const searching = isSearching(filters);
  const view: FeedViewName = params.get('view') === 'following' ? 'following' : 'for-you';
  const feedUrl = view === 'following' ? '/?view=following' : '/';
  const fromFeed = isFromFeed(location.state);
  const preferences = useAppSelector(selectPreferences);
  const [filtersOpen, setFiltersOpen] = useState(false);

  /**
   * History: entering search from the feed is one step; refining replaces it;
   * leaving goes back to that feed entry, so Back never loops into results.
   */
  const search = (next: NewsFilters) => {
    const nextSearching = isSearching(next);
    if (searching && !nextSearching && fromFeed) {
      navigate(-1);
      return;
    }
    const nextParams = toSearchParams(next);
    if (view === 'following') nextParams.set('view', view);
    if (!searching && nextSearching) {
      setParams(nextParams, { state: FROM_FEED });
    } else {
      setParams(nextParams, { replace: true, state: location.state });
    }
  };

  const backToFeed = (event: MouseEvent<HTMLAnchorElement>) => {
    if (!fromFeed) return; // a shared link: just follow it to the feed
    event.preventDefault();
    navigate(-1);
  };

  const count = activeFilterCount(filters);
  const filtersPanel = (
    <SearchFilters filters={filters} onChange={search} feedPreset={preferences} />
  );
  const filtersButton = (
    <Button aria-haspopup="dialog" onClick={() => setFiltersOpen(true)}>
      <SlidersIcon className="size-4" />
      Filters{count > 0 && ` (${count})`}
    </Button>
  );

  return (
    <>
      {/* Same position in both modes, so focus stays put when typing switches to results. */}
      <div className="mb-6 flex gap-2">
        <div className="min-w-0 flex-1">
          <SearchBox
            value={filters.keyword ?? ''}
            onChange={(keyword) => search({ ...filters, keyword })}
          />
        </div>
        {/* On the feed, filters are one click away; picking one starts a search. */}
        {!searching && filtersButton}
      </div>

      {searching ? (
        <div className="gap-8 lg:grid lg:grid-cols-[16rem_minmax(0,1fr)]">
          <aside aria-label="Filters" className="hidden self-start lg:sticky lg:top-20 lg:block">
            <h2 className="mb-4 font-semibold">Filter results</h2>
            {filtersPanel}
          </aside>
          <div className="min-w-0">
            <SearchView
              filters={filters}
              onChange={search}
              feedUrl={feedUrl}
              onBackToFeed={backToFeed}
              fromFeed={fromFeed}
              filtersButton={<div className="lg:hidden">{filtersButton}</div>}
            />
          </div>
        </div>
      ) : (
        <FeedView view={view} />
      )}

      <Drawer
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        title="Filter news"
        placement="adaptive"
        footer={
          <Button variant="primary" className="w-full" onClick={() => setFiltersOpen(false)}>
            {searching ? 'Show results' : 'Close'}
          </Button>
        }
      >
        {filtersOpen && filtersPanel}
      </Drawer>
    </>
  );
}
