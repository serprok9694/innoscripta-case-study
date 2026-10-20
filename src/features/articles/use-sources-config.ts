import { useQuery } from '@tanstack/react-query';
import { fetchSourcesConfig } from '@/sources/registry';

/** Which sources have an API key. Doesn't change while the app runs. */
export function useSourcesConfig() {
  return useQuery({
    queryKey: ['sources-config'],
    queryFn: ({ signal }) => fetchSourcesConfig(signal),
    staleTime: Infinity,
  });
}
