import { describe, expect, it } from 'vitest';
import { makeArticle } from '@/test/factories';
import { mergePages } from './merge-pages';

describe('mergePages', () => {
  const a = makeArticle({ id: 'a', category: 'science' });
  const aAgain = { ...a, category: 'world' as const };
  const b = makeArticle({ id: 'b' });

  it('keeps the first copy of duplicates', () => {
    const merged = mergePages(
      [
        { articles: [a], nextPage: null },
        { articles: [aAgain, b], nextPage: null },
      ],
      1,
    );
    expect(merged.articles).toEqual([a, b]);
  });

  it('continues while any page has more', () => {
    expect(
      mergePages(
        [
          { articles: [], nextPage: null },
          { articles: [], nextPage: 4 },
        ],
        3,
      ).nextPage,
    ).toBe(4);
    expect(mergePages([{ articles: [], nextPage: null }], 3).nextPage).toBeNull();
    expect(mergePages([], 1)).toEqual({ articles: [], nextPage: null });
  });
});
