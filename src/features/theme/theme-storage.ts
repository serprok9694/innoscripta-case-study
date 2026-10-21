import { isThemeMode, type ThemeMode } from './theme-slice';

/**
 * Stored as a plain string so the pre-paint theme script can read it
 * before React loads (`public/theme-init.js`; keep the key in sync there).
 */
export const THEME_STORAGE_KEY = 'news-aggregator:theme';

export function loadThemeMode(storage?: Storage): ThemeMode | undefined {
  try {
    const value = (storage ?? window.localStorage).getItem(THEME_STORAGE_KEY);
    return isThemeMode(value) ? value : undefined;
  } catch {
    return undefined;
  }
}

export function saveThemeMode(mode: ThemeMode, storage?: Storage): void {
  try {
    (storage ?? window.localStorage).setItem(THEME_STORAGE_KEY, mode);
  } catch {
    // Storage unavailable: the choice still applies for this session.
  }
}
