import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export const THEME_MODES = ['system', 'light', 'dark'] as const;
export type ThemeMode = (typeof THEME_MODES)[number];
export type Theme = 'light' | 'dark';

export function isThemeMode(value: unknown): value is ThemeMode {
  return (THEME_MODES as readonly unknown[]).includes(value);
}

/** The theme actually shown: "system" follows the OS setting. */
export function resolveTheme(mode: ThemeMode, systemPrefersDark: boolean): Theme {
  if (mode === 'system') return systemPrefersDark ? 'dark' : 'light';
  return mode;
}

export const themeSlice = createSlice({
  name: 'theme',
  initialState: { mode: 'system' as ThemeMode },
  reducers: {
    setThemeMode(state, action: PayloadAction<ThemeMode>) {
      state.mode = action.payload;
    },
  },
  selectors: {
    selectThemeMode: (state) => state.mode,
  },
});

export const { setThemeMode } = themeSlice.actions;
export const { selectThemeMode } = themeSlice.selectors;
