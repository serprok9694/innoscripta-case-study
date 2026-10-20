import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import guardianFixture from '@/sources/guardian/__fixtures__/search.json';
import guardianTags from '@/sources/guardian/__fixtures__/tags.json';
import nytFixture from '@/sources/nyt/__fixtures__/search.json';
import { mockJson } from '@/test/msw/mock-json';
import { renderRoute } from '@/test/render-route';

const GUARDIAN = '/api/guardian/search';
const NYT = '/api/nyt/svc/search/v2/articlesearch.json';

function mockSources() {
  mockJson('/api/config', { sources: { guardian: true, nyt: true, newsapi: false } });
  return { guardian: mockJson(GUARDIAN, guardianFixture), nyt: mockJson(NYT, nytFixture) };
}

const articles = async () => within(await screen.findByRole('list', { name: 'Articles' }));

describe('FeedPage', () => {
  it('invites first-time visitors to personalise, showing the latest news meanwhile', async () => {
    mockSources();
    renderRoute('/');

    expect(screen.getByText('Make it yours.')).toBeInTheDocument();
    expect(screen.getByText('All topics from all sources')).toBeInTheDocument();
    expect((await articles()).getAllByRole('article')).toHaveLength(8);
  });

  it('builds "For you" from preferred sources and topics', async () => {
    const { guardian, nyt } = mockSources();
    renderRoute('/', { preferences: { sources: ['guardian'], categories: ['science'] } });

    expect(screen.getByText('Science from The Guardian')).toBeInTheDocument();
    expect(screen.queryByText('Make it yours.')).not.toBeInTheDocument();
    expect((await articles()).getAllByRole('article')).toHaveLength(3);
    expect(guardian[0]?.searchParams.get('section')).toBe('science|environment');
    expect(nyt).toHaveLength(0);
  });

  it('asks to follow authors before showing the Following view, without fetching', () => {
    const { guardian } = mockSources();
    renderRoute('/?view=following');

    expect(screen.getByRole('link', { name: 'Following (0)' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByText('You’re not following anyone yet')).toBeInTheDocument();
    expect(guardian).toHaveLength(0);
  });

  it('shows articles by followed authors', async () => {
    const { guardian, nyt } = mockSources();
    mockJson('/api/guardian/tags', guardianTags);
    renderRoute('/?view=following', { preferences: { authors: ['Fiona Harvey'] } });

    expect(
      screen.getByText('Articles by the authors you follow, from all sources'),
    ).toBeInTheDocument();
    const list = await articles();
    expect(list.getAllByRole('article')).toHaveLength(1);
    expect(list.getByRole('button', { name: 'Follow Fiona Harvey' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(guardian[0]?.searchParams.get('tag')).toBe('profile/fiona-harvey');
    expect(nyt[0]?.searchParams.get('q')).toBe('Fiona Harvey');
  });

  it('follows an author straight from an article', async () => {
    mockSources();
    const { store } = renderRoute('/');

    await userEvent.click((await articles()).getByRole('button', { name: 'Follow Mark Cocker' }));

    expect(store.getState().preferences.authors).toEqual(['Mark Cocker']);
    await waitFor(() =>
      expect(screen.getByRole('link', { name: 'Following (1)' })).toBeInTheDocument(),
    );
  });
});
