import { z } from 'zod';
import { isSourceId } from '@/domain/article';
import { isCategoryId } from '@/domain/category';
import { MAX_FOLLOWED_AUTHORS, type PreferencesState } from './preferences-slice';

export const STORAGE_KEY = 'news-aggregator:preferences';
const VERSION = 1;

/** Stored data comes from the user's browser: validate it and keep what's still valid. */
const storedSchema = z.object({
  version: z.literal(VERSION),
  preferences: z.object({
    sources: z
      .array(z.string())
      .catch([])
      .transform((ids) => ids.filter(isSourceId)),
    categories: z
      .array(z.string())
      .catch([])
      .transform((ids) => ids.filter(isCategoryId)),
    authors: z
      .array(z.string())
      .catch([])
      .transform((names) => names.slice(0, MAX_FOLLOWED_AUTHORS)),
  }),
});

/** `localStorage` can be missing or throw (privacy modes, disabled storage). */
function getStorage(): Storage | undefined {
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}

export function loadPreferences(storage = getStorage()): PreferencesState | undefined {
  try {
    const raw = storage?.getItem(STORAGE_KEY);
    if (!raw) return undefined;
    const parsed = storedSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data.preferences : undefined;
  } catch {
    return undefined;
  }
}

export function savePreferences(preferences: PreferencesState, storage = getStorage()): void {
  try {
    storage?.setItem(STORAGE_KEY, JSON.stringify({ version: VERSION, preferences }));
  } catch {
    // Quota exceeded or storage disabled: preferences still work for this session.
  }
}
