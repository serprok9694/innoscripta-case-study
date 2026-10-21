import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, type RenderOptions } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';
import { Provider } from 'react-redux';
import { type AppStore, makeStore } from '@/app/store';
import type { SourceCatalog } from '@/domain/source-catalog';
import { SourceCatalogContext } from '@/features/articles/source-catalog-context';
import {
  initialPreferences,
  type PreferencesState,
} from '@/features/preferences/preferences-slice';
import { sourceCatalog } from '@/sources/registry';

export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
}

export interface TestProvidersOptions {
  /** Initial user preferences (merged over the defaults). */
  preferences?: Partial<PreferencesState>;
  /** Sources to inject (defaults to the real registry, with the network mocked by MSW). */
  catalog?: SourceCatalog;
}

/** Fresh store and query client per test, so tests never share state. */
export function createTestProviders({
  preferences,
  catalog = sourceCatalog,
}: TestProvidersOptions = {}) {
  const store = makeStore({ preferences: { ...initialPreferences, ...preferences } });
  const queryClient = createTestQueryClient();

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <Provider store={store}>
        <SourceCatalogContext value={catalog}>
          <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        </SourceCatalogContext>
      </Provider>
    );
  }
  return { store, queryClient, Wrapper };
}

/** Wrapper for `renderHook`. */
export function createWrapper(options?: TestProvidersOptions) {
  return createTestProviders(options).Wrapper;
}

export function renderWithProviders(
  ui: ReactElement,
  options: TestProvidersOptions & Omit<RenderOptions, 'wrapper'> = {},
): ReturnType<typeof render> & { store: AppStore } {
  const { preferences, catalog, ...renderOptions } = options;
  const { store, Wrapper } = createTestProviders({ preferences, catalog });
  return { ...render(ui, { wrapper: Wrapper, ...renderOptions }), store };
}
