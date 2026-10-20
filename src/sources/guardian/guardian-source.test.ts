import { describe, expect, it } from 'vitest';
import { mockJson } from '@/test/msw/mock-json';
import fixture from './__fixtures__/search.json';
import { guardianSource } from './guardian-source';

const PATH = '/api/guardian/search';

describe('guardianSource', () => {
  it('normalises results into articles', async () => {
    mockJson(PATH, fixture);
    const { articles } = await guardianSource.search({}, 1);

    expect(articles).toHaveLength(4);
    expect(articles[0]).toEqual({
      id: 'guardian:environment/2026/oct/20/countries-pushing-vital-global-climate-report-delayed',
      sourceId: 'guardian',
      publisher: 'The Guardian',
      title: 'Why have countries been pushing for a vital global climate report to be delayed?',
      summary:
        'Saudi Arabia, Russia and China among those claiming developed countries have skewed findings of IPCC review',
      url: 'https://www.theguardian.com/environment/2026/oct/20/countries-pushing-vital-global-climate-report-delayed',
      imageUrl:
        'https://media.guim.co.uk/4e8bc175614db946e21c0ce67854ce34f497f5af/599_0_6827_5464/500.jpg',
      author: 'Fiona Harvey Environment editor',
      category: 'science',
      publishedAt: '2026-10-20T06:00:20Z',
    });
  });

  it('handles HTML summaries, unmapped sections and missing fields', async () => {
    mockJson(PATH, fixture);
    const { articles } = await guardianSource.search({}, 1);

    expect(articles[1]?.summary).toMatch(/^Ouse Fen, Cambridgeshire: The great egret/);
    expect(articles[3]).toMatchObject({
      summary: 'Bold claims & links',
      category: undefined,
      author: undefined,
      imageUrl: undefined,
    });
  });

  it('translates the query into Guardian params', async () => {
    const requests = mockJson(PATH, fixture);
    await guardianSource.search(
      {
        keyword: 'climate',
        from: '2026-10-01',
        to: '2026-10-20',
        categories: ['world', 'science'],
      },
      3,
    );

    const params = requests[0]?.searchParams;
    expect(params?.get('q')).toBe('climate');
    expect(params?.get('section')).toBe('world|science|environment');
    expect(params?.get('from-date')).toBe('2026-10-01');
    expect(params?.get('to-date')).toBe('2026-10-20');
    expect(params?.get('page')).toBe('3');
    expect(params?.get('page-size')).toBe('10');
    expect(params?.get('order-by')).toBe('newest');
    expect(params?.get('show-fields')).toBe('trailText,byline,thumbnail');
  });

  it('omits filters that are not set', async () => {
    const requests = mockJson(PATH, fixture);
    await guardianSource.search({ categories: [] }, 1);

    const keys = [...(requests[0]?.searchParams.keys() ?? [])];
    expect(keys).not.toContain('q');
    expect(keys).not.toContain('section');
    expect(keys).not.toContain('from-date');
  });

  it('paginates until the last page', async () => {
    mockJson(PATH, fixture);
    expect((await guardianSource.search({}, 1)).nextPage).toBe(2);

    mockJson(PATH, { response: { ...fixture.response, currentPage: 31, pages: 31 } });
    expect((await guardianSource.search({}, 31)).nextPage).toBeNull();
  });

  it('fails with a SourceError on an unexpected payload', async () => {
    mockJson(PATH, { response: { results: 'nope' } });
    await expect(guardianSource.search({}, 1)).rejects.toMatchObject({
      sourceId: 'guardian',
      kind: 'invalid-response',
    });
  });
});
