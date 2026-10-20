import { describe, expect, it } from 'vitest';
import { AllSourcesFailedError } from '@/features/articles/aggregator';
import { SourceError } from '@/sources/shared/source-error';
import { createQueryClient } from './query-client';

const retry = createQueryClient().getDefaultOptions().queries?.retry as (
  failureCount: number,
  error: unknown,
) => boolean;

describe('query client retry policy', () => {
  it('retries a transient failure once', () => {
    const error = new SourceError('nyt', 'network', 'Network error');
    expect(retry(0, error)).toBe(true);
    expect(retry(1, error)).toBe(false);
    expect(retry(0, new Error('boom'))).toBe(true);
  });

  it('never retries when rate limited', () => {
    expect(retry(0, new SourceError('nyt', 'rate-limit', 'Too many requests', 429))).toBe(false);
    expect(
      retry(
        0,
        new AllSourcesFailedError([
          { sourceId: 'nyt', kind: 'rate-limit', message: '' },
          { sourceId: 'guardian', kind: 'network', message: '' },
        ]),
      ),
    ).toBe(false);
  });
});
