import { useQuery } from '@tanstack/react-query';
import { useSourceCatalog } from './source-catalog-context';

/** Which sources have an API key. Doesn't change while the app runs. */
export function useSourcesConfig() {
  const catalog = useSourceCatalog();
  return useQuery({
    queryKey: ['sources-config'],
    queryFn: ({ signal }) => catalog.loadConfig(signal),
    staleTime: Infinity,
  });
}
