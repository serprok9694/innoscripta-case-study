import { describe, expect, it } from 'vitest';
import { CATEGORIES, CATEGORY_LABELS, isCategoryId } from './category';

describe('categories', () => {
  it('recognises known category ids only', () => {
    expect(isCategoryId('science')).toBe(true);
    expect(isCategoryId('Science')).toBe(false);
    expect(isCategoryId('culture')).toBe(false);
  });

  it('has a label for every category', () => {
    expect(Object.keys(CATEGORY_LABELS).sort()).toEqual([...CATEGORIES].sort());
  });
});
