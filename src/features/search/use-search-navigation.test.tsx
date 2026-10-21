import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter, useLocation, useNavigate } from 'react-router';
import { describe, expect, it } from 'vitest';
import { countActiveFilters } from './search-params';
import { useSearchNavigation } from './use-search-navigation';

function setup(path: string) {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <MemoryRouter initialEntries={[path]}>{children}</MemoryRouter>
  );
  const view = renderHook(
    () => ({ nav: useSearchNavigation(), location: useLocation(), navigate: useNavigate() }),
    { wrapper },
  );
  const firstKey = view.result.current.location.key;
  return {
    ...view,
    nav: () => view.result.current.nav,
    search: () => view.result.current.location.search,
    back: () => act(() => void view.result.current.navigate(-1)),
    onFirstEntry: () => view.result.current.location.key === firstKey,
  };
}

describe('useSearchNavigation', () => {
  it('reads the feed view and the search from the URL', () => {
    const { nav } = setup('/?view=following&q=bees&category=science');
    expect(nav()).toMatchObject({
      searching: true,
      view: 'following',
      feedUrl: '/?view=following',
      filters: { keyword: 'bees', categories: ['science'] },
    });
  });

  it('enters search in one history step and refines it in place', async () => {
    const { nav, search, back, onFirstEntry } = setup('/');

    act(() => nav().search({ keyword: 'bees' }));
    expect(nav().fromFeed).toBe(true);
    act(() => nav().search({ keyword: 'bees', categories: ['science'] }));
    expect(search()).toBe('?q=bees&category=science');
    expect(nav().fromFeed).toBe(true); // still the same entry

    await back();
    expect(onFirstEntry()).toBe(true);
    expect(nav().searching).toBe(false);
  });

  it('steps back to the feed entry when the search is cleared', () => {
    const { nav, onFirstEntry } = setup('/');
    act(() => nav().search({ keyword: 'bees' }));

    act(() => nav().search({}));

    expect(onFirstEntry()).toBe(true);
  });

  it('replaces a search opened from a link instead of stepping out of the app', () => {
    const { nav, search, onFirstEntry } = setup('/?q=bees');
    expect(nav().fromFeed).toBe(false);

    act(() => nav().search({}));

    expect(search()).toBe('');
    expect(onFirstEntry()).toBe(false); // replaced, not navigated back
  });

  it('keeps the feed tab while searching', () => {
    const { nav, search } = setup('/?view=following');
    act(() => nav().search({ keyword: 'bees' }));
    expect(search()).toBe('?q=bees&view=following');
  });
});

describe('countActiveFilters', () => {
  it('counts a date range once', () => {
    expect(
      countActiveFilters({
        keyword: 'ignored',
        from: '2026-10-01',
        to: '2026-10-20',
        categories: ['world', 'science'],
        sources: ['nyt'],
        authors: ['A'],
      }),
    ).toBe(5);
    expect(countActiveFilters({})).toBe(0);
  });
});
