import { act, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import guardianFixture from '@/sources/guardian/__fixtures__/search.json';
import guardianTags from '@/sources/guardian/__fixtures__/tags.json';
import nytFixture from '@/sources/nyt/__fixtures__/search.json';
import { mockJson } from '@/test/msw/mock-json';
import { makeArticle } from '@/test/factories';
import { renderRoute } from '@/test/render-route';

const GUARDIAN = '/api/guardian/search';
const NYT = '/api/nyt/svc/search/v2/articlesearch.json';

function mockSources() {
  mockJson('/api/config', { sources: { guardian: true, nyt: true, newsapi: false } });
  return { guardian: mockJson(GUARDIAN, guardianFixture), nyt: mockJson(NYT, nytFixture) };
}

const articles = async () => within(await screen.findByRole('list', { name: 'Articles' }));
/** The line under the page title. */
const summary = () => screen.getByRole('heading', { level: 1 }).nextElementSibling;
/** Everything rendered above the feed tabs, to detect layout jumps. */
const aboveTabs = () => {
  const tabs = screen.getByRole('navigation', { name: 'Feed views' });
  const nodes = [...tabs.parentElement!.children];
  return nodes.slice(0, nodes.indexOf(tabs)).map((node) => node.tagName);
};

describe('HomePage: feed', () => {
  it('invites first-time visitors to personalise, showing the latest news meanwhile', async () => {
    mockSources();
    renderRoute('/');

    expect(summary()).toHaveTextContent('All topics from all sources · Personalise');
    expect(screen.getByRole('link', { name: 'Personalise' })).toHaveAttribute('href', '/settings');
    expect((await articles()).getAllByRole('article')).toHaveLength(8);
  });

  it('builds "For you" from preferred sources and topics', async () => {
    const { guardian, nyt } = mockSources();
    renderRoute('/', { preferences: { sources: ['guardian'], categories: ['science'] } });

    expect(summary()).toHaveTextContent('Science from The Guardian · Edit');
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
    // Source preferences don't hide followed authors.
    renderRoute('/?view=following', {
      preferences: { authors: ['Fiona Harvey'], sources: ['guardian'] },
    });

    expect(summary()).toHaveTextContent(
      'Latest from the authors you follow, from all sources · Edit',
    );
    const list = await articles();
    expect(list.getAllByRole('article')).toHaveLength(1);
    expect(guardian[0]?.searchParams.get('tag')).toBe('profile/fiona-harvey');
    expect(nyt[0]?.searchParams.get('q')).toBe('Fiona Harvey');
  });

  describe('article preview', () => {
    const openArticle = async (title: RegExp) =>
      userEvent.click((await articles()).getByRole('link', { name: title }));

    it('opens from the feed without any request and closes with Back', async () => {
      const { guardian, nyt } = mockSources();
      const { router } = renderRoute('/');
      await articles();
      const requests = guardian.length + nyt.length;

      await openArticle(/Why have countries been pushing/);

      const dialog = screen.getByRole('dialog', { name: /Why have countries been pushing/ });
      expect(within(dialog).getByRole('link', { name: /Read on The Guardian/ })).toHaveAttribute(
        'href',
        expect.stringContaining('theguardian.com'),
      );
      expect(guardian.length + nyt.length).toBe(requests);
      expect(router.state.location.pathname).toBe('/'); // the URL doesn't change

      await act(() => router.navigate(-1));
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(router.state.location.pathname).toBe('/');
    });

    it('follows an author from the preview, without the feed jumping', async () => {
      mockSources();
      const { store } = renderRoute('/');
      await articles();
      const before = aboveTabs();

      await openArticle(/Country diary/);
      await userEvent.click(screen.getByRole('button', { name: 'Follow Mark Cocker' }));

      expect(store.getState().preferences.authors).toEqual(['Mark Cocker']);
      expect(screen.getByRole('button', { name: 'Following Mark Cocker' })).toBeInTheDocument();
      // Nothing appears or disappears above the feed: no layout jump.
      expect(aboveTabs()).toEqual(before);
      expect(summary()).toHaveTextContent('All topics from all sources · Edit');
      expect(screen.getByRole('link', { name: 'Following (1)', hidden: true })).toBeInTheDocument();
    });

    it('returns focus to the article when closed', async () => {
      mockSources();
      renderRoute('/');
      await openArticle(/Country diary/);

      await userEvent.click(screen.getByRole('button', { name: 'Close' }));

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect((await articles()).getByRole('link', { name: /Country diary/ })).toHaveFocus();
    });

    it('is restored from history state, e.g. after a reload', async () => {
      mockSources();
      const article = makeArticle({ title: 'Restored article', authors: [] });
      const { router } = renderRoute({ pathname: '/', state: { preview: article } });

      expect(screen.getByRole('dialog', { name: 'Restored article' })).toBeInTheDocument();
      await userEvent.click(screen.getByRole('button', { name: 'Close' }));
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(router.state.location.state).toBeNull();
    });

    it.each([
      ['a partial object', { title: 'Not an article' }],
      ['an unknown source', { ...makeArticle(), sourceId: 'bbc' }],
      ['an invalid date', { ...makeArticle(), publishedAt: 'yesterday' }],
      ['a non-web URL', { ...makeArticle(), url: 'javascript:alert(1)' }],
    ])('ignores history state with %s', (_case, preview) => {
      mockSources();
      renderRoute({ pathname: '/', state: { preview } });
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });
});
