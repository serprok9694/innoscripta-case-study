import { describe, expect, it } from 'vitest';
import {
  canFollowMore,
  followAuthor,
  hasPreferences,
  initialPreferences,
  isFollowing,
  MAX_FOLLOWED_AUTHORS,
  preferencesSlice,
  type PreferencesState,
  resetPreferences,
  setCategories,
  setSources,
  unfollowAuthor,
} from './preferences-slice';

const { reducer } = preferencesSlice;
const withAuthors = (authors: string[]): PreferencesState => ({ ...initialPreferences, authors });

describe('preferences slice', () => {
  it('starts empty', () => {
    const state = reducer(undefined, { type: '@@init' });
    expect(state).toEqual({ sources: [], categories: [], authors: [] });
    expect(hasPreferences(state)).toBe(false);
  });

  it('sets sources and categories without duplicates', () => {
    let state = reducer(initialPreferences, setSources(['nyt', 'guardian', 'nyt']));
    state = reducer(state, setCategories(['science', 'science']));
    expect(state).toEqual({ sources: ['nyt', 'guardian'], categories: ['science'], authors: [] });
    expect(hasPreferences(state)).toBe(true);
  });

  it('follows authors with cleaned-up names, ignoring blanks and duplicates', () => {
    let state = reducer(initialPreferences, followAuthor('  Fiona   Harvey '));
    state = reducer(state, followAuthor('fiona harvey'));
    state = reducer(state, followAuthor('   '));
    expect(state.authors).toEqual(['Fiona Harvey']);
    expect(isFollowing(state.authors, 'FIONA HARVEY')).toBe(true);
  });

  it('caps the number of followed authors', () => {
    const full = withAuthors(Array.from({ length: MAX_FOLLOWED_AUTHORS }, (_, i) => `A${i}`));
    expect(canFollowMore(full.authors)).toBe(false);
    expect(reducer(full, followAuthor('One too many')).authors).toHaveLength(MAX_FOLLOWED_AUTHORS);
  });

  it('unfollows regardless of case and accents', () => {
    const state = reducer(
      withAuthors(['Ségolène Le Stradic', 'Mark Cocker']),
      unfollowAuthor('segolene le stradic'),
    );
    expect(state.authors).toEqual(['Mark Cocker']);
  });

  it('resets everything', () => {
    const state = reducer(
      { sources: ['nyt'], categories: ['world'], authors: ['A'] },
      resetPreferences(),
    );
    expect(state).toEqual(initialPreferences);
  });
});
