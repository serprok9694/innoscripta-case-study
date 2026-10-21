import { type MouseEvent, useMemo } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router';
import type { NewsFilters } from '@/features/articles/filters';
import { FROM_FEED, isFromFeed } from './search-entry';
import { isSearching, parseSearchParams, toSearchParams } from './search-params';

/** The home page's feed tabs. */
export type FeedViewName = 'for-you' | 'following';

/**
 * The home page's navigation model, in one place: search filters live in the
 * URL, and the browser history stays sensible.
 *
 * - Entering search from the feed is one history step;
 * - refining a search replaces that step;
 * - leaving it steps back to the feed's entry, so Back never loops into results.
 */
export function useSearchNavigation() {
  const [params, setParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  const filters = useMemo(() => parseSearchParams(params), [params]);
  const searching = isSearching(filters);
  const view: FeedViewName = params.get('view') === 'following' ? 'following' : 'for-you';
  // The feed tab is kept while searching, so leaving returns to it.
  const feedUrl = view === 'following' ? '/?view=following' : '/';
  const fromFeed = isFromFeed(location.state);

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

  /** For the "Back to my feed" link: step back when the search came from the feed. */
  const backToFeed = (event: MouseEvent<HTMLAnchorElement>) => {
    if (!fromFeed) return; // a shared link: just follow it to the feed
    event.preventDefault();
    navigate(-1);
  };

  return { filters, searching, view, feedUrl, fromFeed, search, backToFeed };
}
