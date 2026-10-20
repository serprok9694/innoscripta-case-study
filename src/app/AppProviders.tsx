import { QueryClientProvider } from '@tanstack/react-query';
import { type ReactNode, useState } from 'react';
import { Provider } from 'react-redux';
import { createQueryClient } from './query-client';
import { makeAppStore } from './store';

export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(createQueryClient);
  const [store] = useState(makeAppStore);

  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </Provider>
  );
}
