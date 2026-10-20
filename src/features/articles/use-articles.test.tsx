import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import guardianFixture from '@/sources/guardian/__fixtures__/search.json';
import guardianTags from '@/sources/guardian/__fixtures__/tags.json';
import nytFixture from '@/sources/nyt/__fixtures__/search.json';
import { mockJson } from '@/test/msw/mock-json';
import { createWrapper } from '@/test/render';
import type { NewsFilters } from './filters';
import { useArticles } from './use-articles';

const GUARDIAN = '/api/guardian/search';
const NYT = '/api/nyt/svc/search/v2/articlesearch.json';

function mockConfig(sources: Record<string, boolean>) {
  mockJson('/api/config', { sources });
}

function renderUseArticles(filters: NewsFilters = {}) {
  return renderHook(() => useArticles(filters), { wrapper: createWrapper() });
}

describe('useArticles', () => {
  it('loads enabled sources only and merges them newest first', async () => {
    mockConfig({ guardian: true, nyt: true, newsapi: false });
    const guardianRequests = mockJson(GUARDIAN, guardianFixture);
    const nytRequests = mockJson(NYT, nytFixture);
    // NewsAPI has no handler: an unexpected request would fail the test.

    const { result } = renderUseArticles({ keyword: 'climate' });

    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(guardianRequests).toHaveLength(1);
    expect(nytRequests).toHaveLength(1);
    expect(result.current.articles).toHaveLength(8);
    const dates = result.current.articles.map((a) => Date.parse(a.publishedAt));
    expect(dates).toEqual([...dates].sort((a, b) => b - a));
    expect(result.current.articles[0]?.sourceId).toBe('nyt'); // 09:00 beats Guardian's 06:00
    expect(result.current.failures).toEqual([]);
    expect(result.current.hasNextPage).toBe(true);
  });

  it('fetches the next page per source and drops duplicates', async () => {
    mockConfig({ guardian: true, nyt: true });
    const guardianRequests = mockJson(GUARDIAN, guardianFixture);
    const nytRequests = mockJson(NYT, nytFixture);
    const { result } = renderUseArticles();
    await waitFor(() => expect(result.current.articles).toHaveLength(8));

    await act(() => result.current.fetchNextPage());

    expect(guardianRequests.map((r) => r.searchParams.get('page'))).toEqual(['1', '2']);
    expect(nytRequests.map((r) => r.searchParams.get('page'))).toEqual(['0', '1']);
    // The mocks return the same articles again: they are not duplicated.
    expect(result.current.articles).toHaveLength(8);
  });

  it('shows the sources that work and reports the one that failed', async () => {
    mockConfig({ guardian: true, nyt: true });
    mockJson(GUARDIAN, guardianFixture);
    mockJson(NYT, { fault: { faultstring: 'Rate limit quota violation' } }, { status: 429 });

    const { result } = renderUseArticles();
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).toBeNull();
    expect(result.current.articles.every((a) => a.sourceId === 'guardian')).toBe(true);
    expect(result.current.failures).toEqual([
      { sourceId: 'nyt', kind: 'rate-limit', message: 'Rate limit quota violation' },
    ]);
  });

  it('applies the source filter', async () => {
    mockConfig({ guardian: true, nyt: true });
    const guardianRequests = mockJson(GUARDIAN, guardianFixture);
    const nytRequests = mockJson(NYT, nytFixture);

    const { result } = renderUseArticles({ sources: ['nyt'] });
    await waitFor(() => expect(result.current.articles).toHaveLength(4));

    expect(guardianRequests).toHaveLength(0);
    expect(nytRequests).toHaveLength(1);
  });

  it('applies client-side filters to source results', async () => {
    mockConfig({ guardian: true });
    mockJson('/api/guardian/tags', guardianTags);
    mockJson(GUARDIAN, guardianFixture);

    const { result } = renderUseArticles({ authors: ['fiona harvey'] });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.articles.map((a) => a.authors)).toEqual([['Fiona Harvey']]);
  });

  it('reports when no source is available, without requesting anything', async () => {
    mockConfig({ guardian: false, nyt: false, newsapi: false });

    const { result } = renderUseArticles();

    await waitFor(() => expect(result.current.hasNoSources).toBe(true));
    expect(result.current.isLoading).toBe(false);
    expect(result.current.articles).toEqual([]);
  });

  it('fails when every source fails', async () => {
    mockConfig({ guardian: true, nyt: true });
    mockJson(GUARDIAN, {}, { status: 500 });
    mockJson(NYT, {}, { status: 500 });

    const { result } = renderUseArticles();

    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect(result.current.error?.name).toBe('AllSourcesFailedError');
  });

  it('fails when the source config cannot be loaded', async () => {
    mockJson('/api/config', {}, { status: 502 });

    const { result } = renderUseArticles();

    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect(result.current.isLoading).toBe(false);
  });
});
