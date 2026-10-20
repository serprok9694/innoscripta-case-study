import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { SourceId } from '@/domain/article';
import type { CategoryId } from '@/domain/category';
import { foldText } from '@/shared/lib/fold-text';

/**
 * NYT can't search several authors at once, so each followed author costs one
 * request per page — and its free quota is 5 requests per minute.
 */
export const MAX_FOLLOWED_AUTHORS = 5;

export interface PreferencesState {
  sources: SourceId[];
  categories: CategoryId[];
  authors: string[];
}

export const initialPreferences: PreferencesState = { sources: [], categories: [], authors: [] };

const cleanName = (name: string) => name.trim().replace(/\s+/g, ' ');

export function isFollowing(authors: readonly string[], name: string): boolean {
  return authors.some((author) => foldText(author) === foldText(name));
}

export function canFollowMore(authors: readonly string[]): boolean {
  return authors.length < MAX_FOLLOWED_AUTHORS;
}

export function hasPreferences({ sources, categories, authors }: PreferencesState): boolean {
  return sources.length + categories.length + authors.length > 0;
}

export const preferencesSlice = createSlice({
  name: 'preferences',
  initialState: initialPreferences,
  reducers: {
    setSources(state, action: PayloadAction<SourceId[]>) {
      state.sources = [...new Set(action.payload)];
    },
    setCategories(state, action: PayloadAction<CategoryId[]>) {
      state.categories = [...new Set(action.payload)];
    },
    /** Ignores blank names, duplicates (case/accent-insensitive) and names over the limit. */
    followAuthor(state, action: PayloadAction<string>) {
      const name = cleanName(action.payload);
      if (!name || !canFollowMore(state.authors) || isFollowing(state.authors, name)) return;
      state.authors.push(name);
    },
    unfollowAuthor(state, action: PayloadAction<string>) {
      state.authors = state.authors.filter((author) => !isFollowing([author], action.payload));
    },
    resetPreferences: () => initialPreferences,
  },
  selectors: {
    selectPreferences: (state) => state,
    selectAuthors: (state) => state.authors,
  },
});

export const { setSources, setCategories, followAuthor, unfollowAuthor, resetPreferences } =
  preferencesSlice.actions;
export const { selectPreferences, selectAuthors } = preferencesSlice.selectors;
