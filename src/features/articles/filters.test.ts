import { describe, expect, it } from 'vitest';
import { makeArticle } from '@/test/factories';
import { matchesFilters, normalizeFilters, toArticleQuery } from './filters';

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

describe('matchesFilters', () => {
  const article = makeArticle({
    publishedAt: '2026-10-15T23:30:00Z',
    category: 'science',
    authors: ['Natan Odenheimer', 'Ségolène Le Stradic'],
  });

  it('matches when no filters are set', () => {
    expect(matchesFilters(article, {})).toBe(true);
  });

  it('applies an inclusive date range by UTC day', () => {
    expect(matchesFilters(article, { from: '2026-10-15', to: '2026-10-15' })).toBe(true);
    expect(matchesFilters(article, { from: '2026-10-16' })).toBe(false);
    expect(matchesFilters(article, { to: '2026-10-14' })).toBe(false);
  });

  it('requires one of the selected categories', () => {
    expect(matchesFilters(article, { categories: ['world', 'science'] })).toBe(true);
    expect(matchesFilters(article, { categories: ['world'] })).toBe(false);
    expect(matchesFilters(makeArticle({ category: undefined }), { categories: ['world'] })).toBe(
      false,
    );
  });

  it('matches authors by case- and accent-insensitive substring', () => {
    expect(matchesFilters(article, { authors: ['segolene le stradic'] })).toBe(true);
    expect(matchesFilters(article, { authors: ['Nobody', 'stradic'] })).toBe(true);
    expect(matchesFilters(article, { authors: ['Fiona Harvey'] })).toBe(false);
    expect(matchesFilters(makeArticle({ authors: [] }), { authors: ['x'] })).toBe(false);
  });
});
