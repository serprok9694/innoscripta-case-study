import { describe, expect, it } from 'vitest';
import { mockJson } from '@/test/msw/mock-json';
import everything from './__fixtures__/everything.json';
import topHeadlines from './__fixtures__/top-headlines.json';
import { newsApiSource } from './newsapi-source';

const EVERYTHING = '/api/newsapi/v2/everything';
const TOP = '/api/newsapi/v2/top-headlines';

describe('newsApiSource', () => {
  describe('keyword search', () => {
    it('uses /everything with keyword and date range', async () => {
      const requests = mockJson(EVERYTHING, everything);
      await newsApiSource.search({ keyword: 'climate', from: '2026-10-01', to: '2026-10-20' }, 2);

      expect(Object.fromEntries(requests[0]?.searchParams ?? [])).toEqual({
        q: 'climate',
        from: '2026-10-01',
        to: '2026-10-20',
        sortBy: 'publishedAt',
        language: 'en',
        pageSize: '10',
        page: '2',
      });
    });

    it('normalises articles and drops [Removed] placeholders', async () => {
      mockJson(EVERYTHING, everything);
      const { articles } = await newsApiSource.search({ keyword: 'climate' }, 1);

      expect(articles).toHaveLength(4);
      expect(articles.some((a) => a.title === '[Removed]')).toBe(false);
      expect(articles[1]).toEqual({
        id: `newsapi:${everything.articles[1]?.url}`,
        sourceId: 'newsapi',
        publisher: everything.articles[1]?.source.name,
        title: everything.articles[1]?.title,
        summary: everything.articles[1]?.description,
        url: everything.articles[1]?.url,
        imageUrl: everything.articles[1]?.urlToImage,
        author: 'Polly Davis Doig',
        category: undefined,
        publishedAt: everything.articles[1]?.publishedAt,
      });
    });

    it('ignores URLs in the author field and empty images', async () => {
      mockJson(EVERYTHING, everything);
      const { articles } = await newsApiSource.search({ keyword: 'climate' }, 1);
      expect(articles.at(-1)).toMatchObject({ author: undefined, imageUrl: undefined });
    });

    it('stops paginating at the 100-result cap of the developer plan', async () => {
      mockJson(EVERYTHING, everything); // totalResults: 6772
      expect((await newsApiSource.search({ keyword: 'climate' }, 9)).nextPage).toBe(10);

      mockJson(EVERYTHING, everything);
      expect((await newsApiSource.search({ keyword: 'climate' }, 10)).nextPage).toBeNull();
    });
  });

  describe('category filter', () => {
    it('requests top headlines per category and tags the articles', async () => {
      const requests = mockJson(TOP, topHeadlines);
      const { articles } = await newsApiSource.search(
        { keyword: 'ai', categories: ['technology', 'business'] },
        1,
      );

      expect(requests.map((r) => r.searchParams.get('category'))).toEqual([
        'technology',
        'business',
      ]);
      expect(requests[0]?.searchParams.get('q')).toBe('ai');
      expect(requests[0]?.searchParams.get('country')).toBe('us');
      // Same fixture for both categories: duplicates are merged.
      expect(articles).toHaveLength(3);
      expect(articles[0]?.category).toBe('technology');
    });

    it('strips the " - Publisher" suffix from headlines', async () => {
      mockJson(TOP, topHeadlines);
      const { articles } = await newsApiSource.search({ categories: ['technology'] }, 1);
      expect(articles.map((a) => a.title)).toEqual([
        "Cyberleek drops more NSFW Lucia videos, threatens to release 'GTA 6' in full",
        "Players on Steam so far seem delighted with Modern Warfare 4's campaign, making it one of the most well-received Call of Dutys in recent history",
        'What Is The Most Affordable Gaming Console In 2026?',
      ]);
    });

    it('returns nothing without a request when no category is supported', async () => {
      const requests = mockJson(TOP, topHeadlines);
      await expect(newsApiSource.search({ categories: ['world', 'politics'] }, 1)).resolves.toEqual(
        { articles: [], nextPage: null },
      );
      expect(requests).toHaveLength(0);
    });
  });

  it('falls back to latest US top headlines without keyword or category', async () => {
    const requests = mockJson(TOP, topHeadlines);
    await newsApiSource.search({}, 1);
    expect(Object.fromEntries(requests[0]?.searchParams ?? [])).toEqual({
      country: 'us',
      pageSize: '10',
      page: '1',
    });
  });

  it('surfaces API errors as SourceError', async () => {
    mockJson(
      EVERYTHING,
      { status: 'error', code: 'rateLimited', message: 'You have made too many requests.' },
      { status: 429 },
    );
    await expect(newsApiSource.search({ keyword: 'x' }, 1)).rejects.toMatchObject({
      sourceId: 'newsapi',
      kind: 'rate-limit',
      message: 'You have made too many requests.',
    });
  });
});
