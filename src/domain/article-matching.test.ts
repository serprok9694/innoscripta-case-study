import { describe, expect, it } from 'vitest';
import { makeArticle } from '@/test/factories';
import { matchesQuery } from './article-matching';

describe('matchesQuery', () => {
  const article = makeArticle({
    publishedAt: '2026-10-15T23:30:00Z',
    category: 'science',
    authors: ['Natan Odenheimer', 'Ségolène Le Stradic'],
  });

  it('matches when no filters are set', () => {
    expect(matchesQuery(article, {})).toBe(true);
  });

  it('applies an inclusive date range by UTC day', () => {
    expect(matchesQuery(article, { from: '2026-10-15', to: '2026-10-15' })).toBe(true);
    expect(matchesQuery(article, { from: '2026-10-16' })).toBe(false);
    expect(matchesQuery(article, { to: '2026-10-14' })).toBe(false);
  });

  it('requires one of the selected categories', () => {
    expect(matchesQuery(article, { categories: ['world', 'science'] })).toBe(true);
    expect(matchesQuery(article, { categories: ['world'] })).toBe(false);
    expect(matchesQuery(makeArticle({ category: undefined }), { categories: ['world'] })).toBe(
      false,
    );
  });

  it('matches authors by whole words, ignoring case and accents', () => {
    expect(matchesQuery(article, { authors: ['segolene le stradic'] })).toBe(true);
    expect(matchesQuery(article, { authors: ['Nobody', 'stradic'] })).toBe(true);
    expect(matchesQuery(article, { authors: ['Le Stradic'] })).toBe(true);
    // Whole words only: a short name mustn't match inside a longer one.
    expect(matchesQuery(article, { authors: ['Stra'] })).toBe(false);
    expect(matchesQuery(makeArticle({ authors: ['Brian Cox'] }), { authors: ['Ian'] })).toBe(false);
    expect(matchesQuery(article, { authors: ['Fiona Harvey'] })).toBe(false);
    expect(matchesQuery(makeArticle({ authors: [] }), { authors: ['x'] })).toBe(false);
  });
});
