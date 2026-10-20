import { QueryClient } from '@tanstack/react-query';
import { AllSourcesFailedError } from '@/features/articles/aggregator';
import { SourceError } from '@/sources/shared/source-error';

/** Retrying a rate-limited API only burns more of the quota (NYT: 5 req/min). */
function isRateLimited(error: unknown): boolean {
  if (error instanceof SourceError) return error.kind === 'rate-limit';
  if (error instanceof AllSourcesFailedError) {
    return error.failures.some((f) => f.kind === 'rate-limit');
  }
  return false;
}

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // News doesn't change by the second, and the APIs have tight quotas.
        staleTime: 5 * 60_000,
        refetchOnWindowFocus: false,
        retry: (failureCount, error) => !isRateLimited(error) && failureCount < 1,
      },
    },
  });
}
