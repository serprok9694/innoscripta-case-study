import { describe, expect, it } from 'vitest';
import { followAuthor, setCategories } from '@/features/preferences/preferences-slice';
import { savePreferences, STORAGE_KEY } from '@/features/preferences/preferences-storage';
import { makeAppStore, makeStore } from './store';

describe('store', () => {
  it('saves preferences whenever they change', () => {
    const store = makeStore();
    store.dispatch(setCategories(['world']));
    store.dispatch(followAuthor('Mark Cocker'));

    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')).toEqual({
      version: 1,
      preferences: { sources: [], categories: ['world'], authors: ['Mark Cocker'] },
    });
  });

  it('restores preferences from the previous visit', () => {
    savePreferences({ sources: ['guardian'], categories: [], authors: ['A'] });
    expect(makeAppStore().getState().preferences).toEqual({
      sources: ['guardian'],
      categories: [],
      authors: ['A'],
    });
  });

  it('starts with defaults when nothing was saved', () => {
    expect(makeAppStore().getState().preferences).toEqual({
      sources: [],
      categories: [],
      authors: [],
    });
  });
});
