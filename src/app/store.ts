import { combineSlices, configureStore, createListenerMiddleware, isAnyOf } from '@reduxjs/toolkit';
import { preferencesSlice } from '@/features/preferences/preferences-slice';
import { loadPreferences, savePreferences } from '@/features/preferences/preferences-storage';
import { themeSlice } from '@/features/theme/theme-slice';
import { loadThemeMode, saveThemeMode } from '@/features/theme/theme-storage';

/**
 * Client state only. Server state (articles, source config) lives in
 * TanStack Query, which handles caching, pagination and cancellation.
 */
const rootReducer = combineSlices(preferencesSlice, themeSlice);

export type RootState = ReturnType<typeof rootReducer>;

export function makeStore(preloadedState?: Partial<RootState>) {
  // Saves client state to localStorage whenever it changes.
  const persistence = createListenerMiddleware();
  persistence.startListening({
    matcher: isAnyOf(...Object.values(preferencesSlice.actions)),
    effect: (_action, api) => savePreferences((api.getState() as RootState).preferences),
  });
  persistence.startListening({
    matcher: isAnyOf(...Object.values(themeSlice.actions)),
    effect: (_action, api) => saveThemeMode((api.getState() as RootState).theme.mode),
  });

  return configureStore({
    reducer: rootReducer,
    preloadedState,
    middleware: (getDefault) => getDefault().prepend(persistence.middleware),
  });
}

/** Store for the running app, with client state restored from the previous visit. */
export function makeAppStore() {
  const preferences = loadPreferences();
  const mode = loadThemeMode();
  return makeStore({
    ...(preferences && { preferences }),
    ...(mode && { theme: { mode } }),
  });
}

export type AppStore = ReturnType<typeof makeStore>;
export type AppDispatch = AppStore['dispatch'];
