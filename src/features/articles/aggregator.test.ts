import { describe, expect, it, vi } from 'vitest';
import type { SourceId } from '@/domain/article';
import type { NewsSource, SourcePage } from '@/domain/news-source';
import { SourceError } from '@/sources/shared/source-error';
import { makeArticle } from '@/test/factories';
import {
  AllSourcesFailedError,
  fetchFeedPage,
  initialCursors,
  interleave,
  selectSources,
} from './aggregator';

function fakeSource(id: SourceId, respond: (page: number) => SourcePage | Promise<SourcePage>) {
  const search = vi.fn<NewsSource['search']>(async (_query, page) => respond(page));
  return { id, name: id, search } satisfies NewsSource;
}

const at = (sourceId: SourceId, publishedAt: string, extra = {}) =>
  makeArticle({ id: `${sourceId}:${publishedAt}`, sourceId, publishedAt, ...extra });

describe('selectSources', () => {
  const all = [fakeSource('guardian', vi.fn()), fakeSource('nyt', vi.fn())];

  it('returns every available source when none is picked', () => {
    expect(selectSources(all, {}).map((s) => s.id)).toEqual(['guardian', 'nyt']);
  });

  it('keeps only picked sources that are available', () => {
    expect(selectSources(all, { sources: ['nyt', 'newsapi'] }).map((s) => s.id)).toEqual(['nyt']);
  });
});

describe('fetchFeedPage', () => {
  it('merges sources newest first and returns the next cursors', async () => {
    const guardian = fakeSource('guardian', () => ({
      articles: [at('guardian', '2026-10-20T10:00:00Z'), at('guardian', '2026-10-18T10:00:00Z')],
      nextPage: 2,
    }));
    const nyt = fakeSource('nyt', () => ({
      articles: [at('nyt', '2026-10-19T10:00:00Z')],
      nextPage: 2,
    }));

    const page = await fetchFeedPage([guardian, nyt], {}, initialCursors([guardian, nyt]));

    expect(page.articles.map((a) => a.id)).toEqual([
      'guardian:2026-10-20T10:00:00Z',
      'nyt:2026-10-19T10:00:00Z',
      'guardian:2026-10-18T10:00:00Z',
    ]);
    expect(page.next).toEqual({ guardian: 2, nyt: 2 });
    expect(page.failures).toEqual([]);
  });

  it('passes the adapter query and each source its own page', async () => {
    const guardian = fakeSource('guardian', () => ({ articles: [], nextPage: null }));
    const nyt = fakeSource('nyt', () => ({ articles: [], nextPage: null }));
    const signal = new AbortController().signal;

    await fetchFeedPage(
      [guardian, nyt],
      { keyword: 'ai', categories: ['technology'], authors: ['x'], sources: ['guardian', 'nyt'] },
      { guardian: 3, nyt: 7 },
      signal,
    );

    const query = {
      keyword: 'ai',
      from: undefined,
      to: undefined,
      categories: ['technology'],
      authors: ['x'],
    };
    expect(guardian.search).toHaveBeenCalledWith(query, 3, signal);
    expect(nyt.search).toHaveBeenCalledWith(query, 7, signal);
  });

  it('skips exhausted sources and ends when all are done', async () => {
    const guardian = fakeSource('guardian', () => ({ articles: [], nextPage: null }));
    const nyt = fakeSource('nyt', () => ({ articles: [], nextPage: null }));

    const page = await fetchFeedPage([guardian, nyt], {}, { nyt: 4 });

    expect(guardian.search).not.toHaveBeenCalled();
    expect(page.next).toBeNull();
  });

  it('applies client-side filters the source could not', async () => {
    const newsapi = fakeSource('newsapi', () => ({
      articles: [
        at('newsapi', '2026-10-19T10:00:00Z', { authors: ['Jane Doe'] }),
        at('newsapi', '2026-09-01T10:00:00Z', { authors: ['Jane Doe'] }),
        at('newsapi', '2026-10-19T09:00:00Z', { authors: ['John Roe'] }),
      ],
      nextPage: null,
    }));

    const page = await fetchFeedPage(
      [newsapi],
      { from: '2026-10-01', authors: ['jane'] },
      {
        newsapi: 1,
      },
    );

    expect(page.articles.map((a) => a.id)).toEqual(['newsapi:2026-10-19T10:00:00Z']);
  });

  it('reports a failing source, keeps the others and drops it from later pages', async () => {
    const guardian = fakeSource('guardian', () => ({
      articles: [at('guardian', '2026-10-20T10:00:00Z')],
      nextPage: 2,
    }));
    const nyt = fakeSource('nyt', () => {
      throw new SourceError('nyt', 'rate-limit', 'Too many requests', 429);
    });

    const page = await fetchFeedPage([guardian, nyt], {}, initialCursors([guardian, nyt]));

    expect(page.articles).toHaveLength(1);
    expect(page.failures).toEqual([
      { sourceId: 'nyt', kind: 'rate-limit', message: 'Too many requests' },
    ]);
    expect(page.next).toEqual({ guardian: 2 });
  });

  it('does not leak details of unexpected errors', async () => {
    const guardian = fakeSource('guardian', () => ({ articles: [], nextPage: null }));
    const nyt = fakeSource('nyt', () => {
      throw new TypeError('x is undefined');
    });

    const page = await fetchFeedPage([guardian, nyt], {}, initialCursors([guardian, nyt]));
    expect(page.failures).toEqual([
      { sourceId: 'nyt', kind: 'unknown', message: 'Unexpected error' },
    ]);
  });

  it('fails when every source fails', async () => {
    const guardian = fakeSource('guardian', () => {
      throw new SourceError('guardian', 'network', 'Network error');
    });
    const nyt = fakeSource('nyt', () => {
      throw new SourceError('nyt', 'http', 'Invalid key', 401);
    });

    const error = await fetchFeedPage([guardian, nyt], {}, initialCursors([guardian, nyt])).catch(
      (e: unknown) => e,
    );

    expect(error).toBeInstanceOf(AllSourcesFailedError);
    expect((error as AllSourcesFailedError).failures.map((f) => f.sourceId)).toEqual([
      'guardian',
      'nyt',
    ]);
  });

  it('propagates cancellation', async () => {
    const controller = new AbortController();
    const guardian = fakeSource('guardian', () => {
      controller.abort();
      return { articles: [], nextPage: 2 };
    });

    await expect(
      fetchFeedPage([guardian], {}, { guardian: 1 }, controller.signal),
    ).rejects.toMatchObject({ name: 'AbortError' });
  });

  it('keeps each source’s ranking when sorting by relevance', async () => {
    const guardian = fakeSource('guardian', () => ({
      articles: [at('guardian', '2026-10-01T10:00:00Z'), at('guardian', '2026-10-20T10:00:00Z')],
      nextPage: null,
    }));
    const nyt = fakeSource('nyt', () => ({
      articles: [at('nyt', '2026-10-15T10:00:00Z')],
      nextPage: null,
    }));

    const page = await fetchFeedPage(
      [guardian, nyt],
      { keyword: 'x', sort: 'relevance' },
      initialCursors([guardian, nyt]),
    );

    // Best match of each source first, not newest first.
    expect(page.articles.map((a) => a.id)).toEqual([
      'guardian:2026-10-01T10:00:00Z',
      'nyt:2026-10-15T10:00:00Z',
      'guardian:2026-10-20T10:00:00Z',
    ]);
  });
});

describe('interleave', () => {
  it('takes one item per list per round', () => {
    expect(interleave([[1, 2, 3], [10], [], [20, 21]])).toEqual([1, 10, 20, 2, 21, 3]);
    expect(interleave([])).toEqual([]);
  });
});
