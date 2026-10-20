import { describe, expect, it } from 'vitest';
import { invertCategoryMap, nativeValuesFor } from './category-map';

const map = { world: ['world'], science: ['science', 'environment'], business: ['business'] };

describe('nativeValuesFor', () => {
  it('collects native values of the requested categories without duplicates', () => {
    expect(nativeValuesFor(map, ['science', 'world', 'science'])).toEqual([
      'science',
      'environment',
      'world',
    ]);
  });

  it('skips categories the source does not support', () => {
    expect(nativeValuesFor(map, ['sports'])).toEqual([]);
    expect(nativeValuesFor(map, undefined)).toEqual([]);
  });
});

describe('invertCategoryMap', () => {
  it('maps every native value back to its category', () => {
    const inverted = invertCategoryMap(map);
    expect(inverted.get('environment')).toBe('science');
    expect(inverted.get('world')).toBe('world');
    expect(inverted.get('unknown')).toBeUndefined();
  });
});
