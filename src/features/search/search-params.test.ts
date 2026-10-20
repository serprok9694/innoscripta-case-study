import { describe, expect, it } from 'vitest';
import { parseSearchParams, toSearchParams } from './search-params';

describe('parseSearchParams', () => {
  it('reads every filter', () => {
    expect(
      parseSearchParams(
        new URLSearchParams(
          'q=climate+change&from=2026-10-01&to=2026-10-20&category=world,science&source=nyt,guardian',
        ),
      ),
    ).toEqual({
      keyword: 'climate change',
      from: '2026-10-01',
      to: '2026-10-20',
      categories: ['science', 'world'],
      sources: ['guardian', 'nyt'],
    });
  });

  it('drops invalid values', () => {
    expect(
      parseSearchParams(
        new URLSearchParams('q=%20&from=yesterday&to=2026-13-45&category=world,cats&source=bbc'),
      ),
    ).toEqual({ categories: ['world'] });
  });

  it('returns no filters for an empty query string', () => {
    expect(parseSearchParams(new URLSearchParams())).toEqual({});
  });
});

describe('toSearchParams', () => {
  it('writes a compact, canonical query string', () => {
    expect(
      toSearchParams({
        keyword: ' ai ',
        categories: ['technology', 'business'],
        sources: [],
        sort: 'newest',
      }).toString(),
    ).toBe('q=ai&category=business%2Ctechnology');
  });

  it('writes the author and relevance sort', () => {
    expect(
      toSearchParams({ keyword: 'ai', authors: ['Fiona Harvey'], sort: 'relevance' }).toString(),
    ).toBe('q=ai&author=Fiona+Harvey&sort=relevance');
  });

  it('drops relevance sort without a keyword', () => {
    expect(toSearchParams({ sort: 'relevance' }).toString()).toBe('');
  });

  it('round-trips', () => {
    const filters = {
      keyword: 'election',
      from: '2026-10-01',
      to: '2026-10-20',
      categories: ['politics' as const],
      sources: ['nyt' as const],
      authors: ['Smith, Jr.'],
      sort: 'relevance' as const,
    };
    expect(parseSearchParams(toSearchParams(filters))).toEqual(filters);
  });
});
