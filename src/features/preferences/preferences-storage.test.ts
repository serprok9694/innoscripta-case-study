import { describe, expect, it } from 'vitest';
import { loadPreferences, savePreferences, STORAGE_KEY } from './preferences-storage';

const store = (value: unknown) => localStorage.setItem(STORAGE_KEY, JSON.stringify(value));

describe('preferences storage', () => {
  it('round-trips preferences', () => {
    const preferences = {
      sources: ['nyt' as const],
      categories: ['world' as const],
      authors: ['A'],
    };
    savePreferences(preferences);
    expect(loadPreferences()).toEqual(preferences);
  });

  it('returns nothing when nothing is stored', () => {
    expect(loadPreferences()).toBeUndefined();
  });

  it('keeps valid values and drops invalid ones', () => {
    store({
      version: 1,
      preferences: {
        sources: ['guardian', 'bbc'],
        categories: 'science',
        authors: ['A', 'B', 'C', 'D', 'E', 'F'],
      },
    });
    expect(loadPreferences()).toEqual({
      sources: ['guardian'],
      categories: [],
      authors: ['A', 'B', 'C', 'D', 'E'],
    });
  });

  it.each([
    ['malformed JSON', '{not json'],
    ['an unknown version', JSON.stringify({ version: 99, preferences: {} })],
    ['a wrong shape', JSON.stringify({ version: 1, preferences: 42 })],
  ])('ignores %s', (_case, raw) => {
    localStorage.setItem(STORAGE_KEY, raw);
    expect(loadPreferences()).toBeUndefined();
  });

  it('survives storage that throws', () => {
    const broken = {
      getItem: () => {
        throw new Error('SecurityError');
      },
      setItem: () => {
        throw new Error('QuotaExceededError');
      },
    } as unknown as Storage;

    expect(loadPreferences(broken)).toBeUndefined();
    expect(() =>
      savePreferences({ sources: [], categories: [], authors: [] }, broken),
    ).not.toThrow();
  });
});
