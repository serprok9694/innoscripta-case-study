import { QueryClientProvider } from '@tanstack/react-query';
import { type ReactNode, useState } from 'react';
import { Provider } from 'react-redux';
import { SourceCatalogContext } from '@/features/articles/source-catalog-context';
import { sourceCatalog } from '@/sources/registry';
import { createQueryClient } from './query-client';
import { makeAppStore } from './store';

export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(createQueryClient);
  const [store] = useState(makeAppStore);

  return (
    // The composition root: concrete implementations are chosen here only.
    <Provider store={store}>
      <SourceCatalogContext value={sourceCatalog}>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </SourceCatalogContext>
    </Provider>
  );
}
