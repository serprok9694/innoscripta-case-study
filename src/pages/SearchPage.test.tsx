import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import guardianFixture from '@/sources/guardian/__fixtures__/search.json';
import nytFixture from '@/sources/nyt/__fixtures__/search.json';
import { mockJson } from '@/test/msw/mock-json';
import { renderRoute } from '@/test/render-route';

const GUARDIAN = '/api/guardian/search';
const NYT = '/api/nyt/svc/search/v2/articlesearch.json';

function setup(path: string) {
  mockJson('/api/config', { sources: { guardian: true, nyt: true, newsapi: false } });
  const guardian = mockJson(GUARDIAN, guardianFixture);
  const nyt = mockJson(NYT, nytFixture);
  const view = renderRoute(path);
  const search = () => new URLSearchParams(view.router.state.location.search);
  return { ...view, guardian, nyt, search };
}

const results = () => screen.findByRole('list', { name: 'Articles' });
const filters = () => screen.getByRole('complementary', { name: 'Filters' });

describe('SearchPage', () => {
  it('restores filters from the URL and queries the sources with them', async () => {
    const { guardian, nyt } = setup(
      '/search?q=climate&from=2026-10-01&to=2026-10-20&category=science',
    );

    expect(screen.getByRole('searchbox')).toHaveValue('climate');
    expect(within(filters()).getByLabelText('From')).toHaveValue('2026-10-01');
    expect(within(filters()).getByRole('button', { name: 'Science' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    await results();
    expect(guardian[0]?.searchParams.get('q')).toBe('climate');
    expect(guardian[0]?.searchParams.get('section')).toBe('science|environment');
    expect(nyt[0]?.searchParams.get('begin_date')).toBe('20261001');
    // Only Guardian's environment articles are tagged "science" in the fixtures.
    const items = within(await results()).getAllByRole('article');
    expect(items).toHaveLength(3);
  });

  it('searches as the user types and keeps the keyword in the URL', async () => {
    const { guardian, search } = setup('/search');
    await results();

    await userEvent.type(screen.getByRole('searchbox'), 'bees');

    await waitFor(() => expect(search().get('q')).toBe('bees'));
    await waitFor(() => expect(guardian.at(-1)?.searchParams.get('q')).toBe('bees'));
  });

  it('updates the URL and results when filters change', async () => {
    const { nyt, search } = setup('/search?q=climate');
    await results();

    await userEvent.click(within(filters()).getByRole('button', { name: 'Politics' }));
    expect(search().get('category')).toBe('politics');
    await waitFor(() =>
      expect(nyt.at(-1)?.searchParams.get('fq')).toBe('subsection.name:("Politics")'),
    );
    // Only the NYT politics story matches; Guardian has no politics articles here.
    await waitFor(async () =>
      expect(within(await results()).getAllByRole('article')).toHaveLength(1),
    );

    await userEvent.click(within(filters()).getByRole('button', { name: 'Clear filters' }));
    expect(search().toString()).toBe('q=climate');
  });

  it('limits results to the picked sources and disables unconfigured ones', async () => {
    const { guardian, nyt, search } = setup('/search');
    await results();
    const sources = within(filters()).getByRole('group', { name: 'Sources' });

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

  it('filters by publication date', async () => {
    const { guardian, search } = setup('/search');
    await results();

    await userEvent.type(within(filters()).getByLabelText('From'), '2026-10-05');
    await userEvent.type(within(filters()).getByLabelText('To'), '2026-10-12');

    expect(search().get('from')).toBe('2026-10-05');
    expect(search().get('to')).toBe('2026-10-12');
    await waitFor(() => expect(guardian.at(-1)?.searchParams.get('to-date')).toBe('2026-10-12'));

    await userEvent.clear(within(filters()).getByLabelText('To'));
    expect(search().has('to')).toBe(false);
  });

  it('shows a helpful empty state', async () => {
    mockJson('/api/config', { sources: { guardian: true } });
    mockJson(GUARDIAN, { response: { currentPage: 1, pages: 0, results: [] } });
    renderRoute('/search?q=zzzz');

    expect(await screen.findByText('No articles match your search')).toBeInTheDocument();
  });

  it('opens filters in a drawer on small screens', async () => {
    const { search } = setup('/search?category=world,science');
    await results();

    await userEvent.click(screen.getByRole('button', { name: 'Filters (2)' }));
    const drawer = screen.getByRole('dialog', { name: 'Filters' });

    await userEvent.click(within(drawer).getByRole('button', { name: 'Business' }));
    expect(search().get('category')).toBe('business,science,world');

    await userEvent.click(within(drawer).getByRole('button', { name: 'Show results' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Filters (3)' })).toBeInTheDocument();
  });
});
