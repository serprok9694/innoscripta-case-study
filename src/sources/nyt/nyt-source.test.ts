import { describe, expect, it } from 'vitest';
import { mockJson } from '@/test/msw/mock-json';
import fixture from './__fixtures__/search.json';
import { nytSource } from './nyt-source';

const PATH = '/api/nyt/svc/search/v2/articlesearch.json';

const withHits = (hits: number) => ({
  ...fixture,
  response: { ...fixture.response, metadata: { ...fixture.response.metadata, hits } },
});

describe('nytSource', () => {
  it('normalises docs into articles', async () => {
    mockJson(PATH, fixture);
    const { articles } = await nytSource.search({}, 1);

    expect(articles).toHaveLength(4);
    expect(articles[0]).toEqual({
      id: 'nyt:nyt://article/098ce4df-945c-5498-9a6a-67441efe63cc',
      sourceId: 'nyt',
      publisher: 'The New York Times',
      title: 'Ready for High Water in Low-Lying Delaware',
      summary:
        'In the state’s flattest county, flood preparation, and houses, rise to a new level.',
      url: 'https://www.nytimes.com/2026/10/20/realestate/flood-protection-efforts-delaware.html',
      imageUrl:
        'https://static01.nyt.com/images/2026/10/20/multimedia/20re-delaware-floods-04-jpzh/20re-delaware-floods-04-jpzh-articleLarge.jpg',
      author: 'Rachel Wharton',
      category: undefined, // Real Estate isn't one of our categories
      publishedAt: '2026-10-20T09:00:32Z',
    });
  });

  it('maps subsections and tolerates sparse or legacy-shaped fields', async () => {
    mockJson(PATH, fixture);
    const { articles } = await nytSource.search({}, 1);

    expect(articles[3]).toMatchObject({
      title: 'A politics story with sparse metadata',
      category: 'politics',
      summary: undefined,
      author: undefined,
      imageUrl: undefined, // `multimedia: []` (old API shape) is ignored, not fatal
    });
  });

  it('translates the query into NYT params', async () => {
    const requests = mockJson(PATH, fixture);
    await nytSource.search(
      {
        keyword: 'election',
        from: '2026-10-01',
        to: '2026-10-20',
        categories: ['world', 'politics', 'science'],
      },
      2,
    );

    const params = requests[0]?.searchParams;
    expect(params?.get('q')).toBe('election');
    expect(params?.get('fq')).toBe(
      'section.name:("World" "Science" "Climate") OR subsection.name:("Politics")',
    );
    expect(params?.get('begin_date')).toBe('20261001');
    expect(params?.get('end_date')).toBe('20261020');
    expect(params?.get('sort')).toBe('newest');
    expect(params?.get('page')).toBe('1'); // 0-based
  });

  it('omits the filter when no category is requested', async () => {
    const requests = mockJson(PATH, fixture);
    await nytSource.search({ keyword: 'x' }, 1);
    expect(requests[0]?.searchParams.has('fq')).toBe(false);
  });

  it('treats `docs: null` as an empty page', async () => {
    mockJson(PATH, { response: { docs: null, metadata: { hits: 0, offset: 0 } } });
    await expect(nytSource.search({ keyword: 'zzzz' }, 1)).resolves.toEqual({
      articles: [],
      nextPage: null,
    });
  });

  it('paginates by hit count and stops at the API page limit', async () => {
    mockJson(PATH, withHits(102));
    expect((await nytSource.search({}, 10)).nextPage).toBe(11);

    mockJson(PATH, withHits(102));
    expect((await nytSource.search({}, 11)).nextPage).toBeNull();

    mockJson(PATH, withHits(10_000));
    expect((await nytSource.search({}, 101)).nextPage).toBeNull();
  });
});
