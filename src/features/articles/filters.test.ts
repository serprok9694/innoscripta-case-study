import { describe, expect, it } from 'vitest';
import { normalizeFilters, toArticleQuery } from './filters';

describe('normalizeFilters', () => {
  it('trims, sorts, de-duplicates and drops empty values', () => {
    expect(
      normalizeFilters({
        keyword: '  climate ',
        from: '',
        categories: ['science', 'world', 'science'],
        sources: [],
        authors: [' Fiona Harvey', '', 'Ajit Niranjan'],
      }),
    ).toEqual({
      keyword: 'climate',
      categories: ['science', 'world'],
      authors: ['Ajit Niranjan', 'Fiona Harvey'],
    });
  });

  it('orders a reversed date range', () => {
    expect(normalizeFilters({ from: '2026-10-20', to: '2026-10-01' })).toEqual({
      from: '2026-10-01',
      to: '2026-10-20',
    });
  });

  it('produces equal output for equivalent input', () => {
    expect(normalizeFilters({ categories: ['world', 'business'], keyword: 'x ' })).toEqual(
      normalizeFilters({ keyword: 'x', categories: ['business', 'world'], authors: [] }),
    );
  });
});

describe('toArticleQuery', () => {
  it('keeps only what source adapters understand', () => {
    expect(
      toArticleQuery({ keyword: 'a', categories: ['world'], sources: ['nyt'], authors: ['b'] }),
    ).toEqual({
      keyword: 'a',
      from: undefined,
      to: undefined,
      categories: ['world'],
      authors: ['b'],
    });
  });
});
