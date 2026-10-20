import { act, fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import type { PreferencesState } from '@/features/preferences/preferences-slice';
import guardianFixture from '@/sources/guardian/__fixtures__/search.json';
import guardianTags from '@/sources/guardian/__fixtures__/tags.json';
import nytFixture from '@/sources/nyt/__fixtures__/search.json';
import { mockJson } from '@/test/msw/mock-json';
import { renderRoute } from '@/test/render-route';

const GUARDIAN = '/api/guardian/search';
const NYT = '/api/nyt/svc/search/v2/articlesearch.json';

function setup(path: string, preferences?: Partial<PreferencesState>) {
  mockJson('/api/config', { sources: { guardian: true, nyt: true, newsapi: false } });
  mockJson('/api/guardian/tags', guardianTags);
  const guardian = mockJson(GUARDIAN, guardianFixture);
  const nyt = mockJson(NYT, nytFixture);
  const view = renderRoute(path, { preferences });
  const search = () => new URLSearchParams(view.router.state.location.search);
  const initialKey = view.router.state.location.key;
  /** Back in history lands on the entry the test started on. */
  const isOnFirstEntry = () => view.router.state.location.key === initialKey;
  return { ...view, guardian, nyt, search, isOnFirstEntry };
}

const results = () => screen.findByRole('list', { name: 'Articles' });
const sidebar = () => screen.getByRole('complementary', { name: 'Filters' });
const heading = () => screen.getByRole('heading', { level: 1 });
const searchbox = () => screen.getByRole('searchbox');

describe('HomePage: search', () => {
  it('restores a search from the URL and queries the sources with it', async () => {
    const { guardian, nyt } = setup('/?q=climate&from=2026-10-01&to=2026-10-20&category=science');

    expect(heading()).toHaveTextContent('Results for “climate”');
    expect(searchbox()).toHaveValue('climate');
    expect(within(sidebar()).getByLabelText('From')).toHaveValue('2026-10-01');
    expect(within(sidebar()).getByRole('button', { name: 'Science' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    await results();
    expect(guardian[0]?.searchParams.get('q')).toBe('climate');
    expect(guardian[0]?.searchParams.get('section')).toBe('science|environment');
    expect(nyt[0]?.searchParams.get('begin_date')).toBe('20261001');
    // Only Guardian's environment articles are tagged "science" in the fixtures.
    expect(within(await results()).getAllByRole('article')).toHaveLength(3);
  });

  describe('feed ↔ results', () => {
    it('turns the feed into results while typing, without losing focus', async () => {
      const { guardian, search } = setup('/');
      await results();
      expect(heading()).toHaveTextContent('My feed');
      expect(screen.queryByRole('complementary', { name: 'Filters' })).not.toBeInTheDocument();

      await userEvent.type(searchbox(), 'bees');

      // Wait for what the user sees: the router state updates before React re-renders.
      await waitFor(() => expect(heading()).toHaveTextContent('Results for “bees”'));
      expect(search().get('q')).toBe('bees');
      expect(searchbox()).toHaveFocus();
      await waitFor(() => expect(guardian.at(-1)?.searchParams.get('q')).toBe('bees'));
    });

    it('is one history step however much the search is refined', async () => {
      const { router, search, isOnFirstEntry } = setup('/');
      await results();

      await userEvent.type(searchbox(), 'bees{Enter}');
      await userEvent.click(within(sidebar()).getByRole('button', { name: 'Science' }));
      await userEvent.type(searchbox(), ' sting{Enter}');
      expect(search().toString()).toBe('q=bees+sting&category=science');

      await act(() => router.navigate(-1));
      expect(isOnFirstEntry()).toBe(true);
      expect(heading()).toHaveTextContent('My feed');
      expect(searchbox()).toHaveValue('');
    });

    it.each([
      [
        '"Back to my feed"',
        () => userEvent.click(screen.getByRole('link', { name: '← Back to my feed' })),
      ],
      [
        'clearing the query',
        async () => {
          await userEvent.clear(searchbox());
          await userEvent.type(searchbox(), '{Enter}');
        },
      ],
    ])(
      'returns to the feed entry with %s, so Back can’t loop into results',
      async (_how, leave) => {
        const { isOnFirstEntry } = setup('/');
        await results();
        await userEvent.type(searchbox(), 'bees{Enter}');

        await leave();

        expect(heading()).toHaveTextContent('My feed');
        expect(isOnFirstEntry()).toBe(true);
      },
    );

    it('treats related searches from a feed preview like any search from the feed', async () => {
      const { isOnFirstEntry } = setup('/');
      await userEvent.click(within(await results()).getByRole('link', { name: /Country diary/ }));
      await userEvent.click(screen.getByRole('link', { name: 'More from The Guardian' }));
      expect(heading()).toHaveTextContent('Filtered news');

      await userEvent.click(screen.getByRole('link', { name: '← Back to my feed' }));

      expect(heading()).toHaveTextContent('My feed');
      expect(isOnFirstEntry()).toBe(true); // Back can't bring the results back
    });

    it('leaves results when the last filter is removed', async () => {
      const { isOnFirstEntry } = setup('/');
      await results();
      await userEvent.click(screen.getByRole('button', { name: 'Filters' }));
      await userEvent.click(
        within(screen.getByRole('dialog')).getByRole('button', { name: 'Technology' }),
      );
      await userEvent.click(screen.getByRole('button', { name: 'Show results' }));

      await userEvent.click(screen.getByRole('button', { name: 'Remove filter: Technology' }));

      expect(heading()).toHaveTextContent('My feed');
      expect(isOnFirstEntry()).toBe(true);
    });

    it('remembers the feed tab the search started from', async () => {
      setup('/?view=following', { authors: ['Fiona Harvey'] });
      await results();
      await userEvent.type(searchbox(), 'bees{Enter}');

      expect(screen.getByRole('link', { name: '← Back to my feed' })).toHaveAttribute(
        'href',
        '/?view=following',
      );
    });
  });

  it('opens filters from the feed; picking one shows results from all news', async () => {
    const { guardian, search } = setup('/', { sources: ['guardian'], categories: ['science'] });
    await results();

    await userEvent.click(screen.getByRole('button', { name: 'Filters' }));
    const drawer = screen.getByRole('dialog', { name: 'Filter news' });
    // Nothing is pre-selected: the feed follows Settings, filters belong to search.
    expect(within(drawer).getByRole('button', { name: 'Science' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );

    await userEvent.click(within(drawer).getByRole('button', { name: 'Technology' }));

    expect(search().toString()).toBe('category=technology');
    expect(heading()).toHaveTextContent('Filtered news');
    await waitFor(() => expect(guardian.at(-1)?.searchParams.get('section')).toBe('technology'));
    await userEvent.click(within(drawer).getByRole('button', { name: 'Show results' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('applies the feed’s sources and topics in one click', async () => {
    const { nyt, search } = setup('/?q=climate', {
      sources: ['guardian'],
      categories: ['science'],
    });
    await results();

    await userEvent.click(
      within(sidebar()).getByRole('button', { name: 'Use my sources & topics' }),
    );

    expect(search().get('source')).toBe('guardian');
    expect(search().get('category')).toBe('science');
    // Applied once: the chips are ordinary filters from here on.
    expect(within(sidebar()).queryByRole('button', { name: 'Use my sources & topics' })).toBeNull();
    const nytCalls = nyt.length;
    await waitFor(async () =>
      expect(within(await results()).getAllByRole('article')).toHaveLength(3),
    );
    expect(nyt).toHaveLength(nytCalls);
  });

  it('shows the applied filters, the article count and Clear all', async () => {
    const { search } = setup('/?q=climate&from=2026-10-01&category=world,science&source=nyt');
    await results();
    const applied = screen.getByRole('list', { name: 'Applied filters' });

    expect(
      within(applied)
        .getAllByRole('listitem')
        .map((li) => li.textContent),
    ).toEqual(['Since 1 Oct 2026', 'Science', 'World', 'The New York Times']);
    expect(screen.getByText(/^\d+\+? articles?$/)).toBeInTheDocument();

    await userEvent.click(within(applied).getByRole('button', { name: 'Remove filter: World' }));
    expect(search().get('category')).toBe('science');

    await userEvent.click(screen.getByRole('button', { name: 'Clear all' }));
    expect(search().toString()).toBe('q=climate');
  });

  it('only commits complete, plausible dates', async () => {
    const { search, router } = setup('/?q=climate');
    await results();
    const from = within(sidebar()).getByLabelText('From');
    const action = () => router.state.historyAction;

    // Typing a year digit by digit passes through implausible values.
    fireEvent.change(from, { target: { value: '0002-10-19' } });
    fireEvent.change(from, { target: { value: '0202-10-19' } });
    expect(search().has('from')).toBe(false);
    expect(from).toHaveValue('0202-10-19'); // the draft stays while typing

    fireEvent.change(from, { target: { value: '2026-10-19' } });
    expect(search().get('from')).toBe('2026-10-19');
    expect(action()).toBe('REPLACE'); // refining a search doesn't add history

    fireEvent.change(from, { target: { value: '' } });
    expect(search().has('from')).toBe(false);
  });

  it('limits results to the picked sources and disables unconfigured ones', async () => {
    const { guardian, nyt, search } = setup('/?q=climate');
    await results();
    const sources = within(sidebar()).getByRole('group', { name: 'Sources' });

    expect(within(sources).getByRole('button', { name: 'NewsAPI' })).toBeDisabled();

    await userEvent.click(within(sources).getByRole('button', { name: 'The New York Times' }));
    expect(search().get('source')).toBe('nyt');

    const guardianCalls = guardian.length;
    await waitFor(async () =>
      expect(within(await results()).getAllByRole('article')).toHaveLength(4),
    );
    expect(guardian).toHaveLength(guardianCalls);
    expect(nyt.length).toBeGreaterThan(1);
  });

  it('offers to clear filters when nothing matches', async () => {
    mockJson('/api/config', { sources: { guardian: true } });
    mockJson(GUARDIAN, { response: { currentPage: 1, pages: 0, results: [] } });
    const { router } = renderRoute('/?q=zzzz&category=world');

    expect(await screen.findByText('No articles match your search')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Clear filters' }));
    expect(router.state.location.search).toBe('?q=zzzz');
  });

  it('opens filters in a drawer on small screens', async () => {
    const { search } = setup('/?category=world,science');
    await results();

    await userEvent.click(screen.getByRole('button', { name: 'Filters (2)' }));
    const drawer = screen.getByRole('dialog', { name: 'Filter news' });
    await userEvent.click(within(drawer).getByRole('button', { name: 'Business' }));
    expect(search().get('category')).toBe('business,science,world');

    await userEvent.click(within(drawer).getByRole('button', { name: 'Show results' }));
    expect(screen.getByRole('button', { name: 'Filters (3)' })).toBeInTheDocument();
  });

  describe('author page', () => {
    it('shows an author’s articles with a Follow button', async () => {
      const { guardian, store } = setup('/?author=Fiona+Harvey');

      expect(heading()).toHaveTextContent('Fiona Harvey');
      await waitFor(() =>
        expect(guardian.at(-1)?.searchParams.get('tag')).toBe('profile/fiona-harvey'),
      );

      await userEvent.click(screen.getByRole('button', { name: 'Follow Fiona Harvey' }));
      expect(store.getState().preferences.authors).toEqual(['Fiona Harvey']);
      expect(screen.getByRole('button', { name: 'Following Fiona Harvey' })).toBeInTheDocument();

      await userEvent.click(screen.getByRole('button', { name: 'Remove filter: By Fiona Harvey' }));
      expect(heading()).toHaveTextContent('My feed'); // nothing left to search for
    });
  });

  it('offers sorting only with a keyword', async () => {
    const { guardian, nyt, search } = setup('/?category=world');
    await results();
    expect(screen.queryByRole('combobox', { name: 'Sort' })).not.toBeInTheDocument();

    await userEvent.type(searchbox(), 'climate{Enter}');
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Sort' }), 'Most relevant');

    expect(search().get('sort')).toBe('relevance');
    await waitFor(() => expect(guardian.at(-1)?.searchParams.get('order-by')).toBe('relevance'));
    expect(nyt.at(-1)?.searchParams.get('sort')).toBe('relevance');
  });
});
