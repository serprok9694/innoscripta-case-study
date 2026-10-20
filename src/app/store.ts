import { combineSlices, configureStore, createListenerMiddleware, isAnyOf } from '@reduxjs/toolkit';
import { preferencesSlice } from '@/features/preferences/preferences-slice';
import { loadPreferences, savePreferences } from '@/features/preferences/preferences-storage';

/**
 * Client state only. Server state (articles, source config) lives in
 * TanStack Query, which handles caching, pagination and cancellation.
 */
const rootReducer = combineSlices(preferencesSlice);

export type RootState = ReturnType<typeof rootReducer>;

export function makeStore(preloadedState?: Partial<RootState>) {
  const persistence = createListenerMiddleware();
  persistence.startListening({
    matcher: isAnyOf(...Object.values(preferencesSlice.actions)),
    effect: (_action, api) => savePreferences((api.getState() as RootState).preferences),
  });

  return configureStore({
    reducer: rootReducer,
    preloadedState,
    middleware: (getDefault) => getDefault().prepend(persistence.middleware),
  });
}

/** Store for the running app, with preferences restored from the previous visit. */
export function makeAppStore() {
  const preferences = loadPreferences();
  return makeStore(preferences ? { preferences } : undefined);
}

export type AppStore = ReturnType<typeof makeStore>;
export type AppDispatch = AppStore['dispatch'];
