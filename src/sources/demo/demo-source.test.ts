import { describe, expect, it } from 'vitest';
import { makeArticle } from '@/test/factories';
import { createDemoSource, type DemoDataset } from './demo-source';

const dataset: DemoDataset = {
  recordedAt: '2026-10-20',
  articles: [
    ...Array.from({ length: 12 }, (_, i) =>
      makeArticle({
        id: `guardian:${i}`,
        sourceId: 'guardian',
        title: i === 3 ? 'Climate talks stall' : `Story ${i}`,
        category: i % 2 ? 'science' : 'world',
        authors: i === 5 ? ['Fiona Harvey'] : [],
        publishedAt: `2026-10-${String(i + 1).padStart(2, '0')}T10:00:00Z`,
      }),
    ),
    makeArticle({ id: 'nyt:1', sourceId: 'nyt', title: 'Climate in New York' }),
  ],
};

const source = createDemoSource('guardian', 'The Guardian', async () => dataset);

describe('createDemoSource', () => {
  it('serves its own source’s articles newest first, in pages', async () => {
    const page1 = await source.search({}, 1);
    expect(page1.articles).toHaveLength(10);
    expect(page1.articles[0]?.id).toBe('guardian:11');
    expect(page1.articles.every((a) => a.sourceId === 'guardian')).toBe(true);
    expect(page1.nextPage).toBe(2);

    const page2 = await source.search({}, 2);
    expect(page2.articles.map((a) => a.id)).toEqual(['guardian:1', 'guardian:0']);
    expect(page2.nextPage).toBeNull();
  });

  it('matches keywords against title and summary, ignoring case', async () => {
    const { articles } = await source.search({ keyword: 'CLIMATE talks' }, 1);
    expect(articles.map((a) => a.title)).toEqual(['Climate talks stall']);
  });

  it('applies the same filters as the live sources', async () => {
    const byCategory = await source.search({ categories: ['science'], to: '2026-10-04' }, 1);
    expect(byCategory.articles.map((a) => a.id)).toEqual(['guardian:3', 'guardian:1']);

    const byAuthor = await source.search({ authors: ['fiona harvey'] }, 1);
    expect(byAuthor.articles.map((a) => a.id)).toEqual(['guardian:5']);
  });
});
