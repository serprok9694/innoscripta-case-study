import { describe, expect, it } from 'vitest';
import { API_SOURCES, buildSourcesConfig, rewriteUpstreamPath } from './api-sources.ts';

const [guardian, , newsapi] = API_SOURCES;

describe('rewriteUpstreamPath', () => {
  it('strips the proxy prefix and appends the key as a query param', () => {
    expect(rewriteUpstreamPath('/api/guardian/search?q=climate&page=2', guardian, 'k3y')).toBe(
      '/search?q=climate&page=2&api-key=k3y',
    );
  });

  it('works without an existing query string', () => {
    expect(rewriteUpstreamPath('/api/guardian/sections', guardian, 'k3y')).toBe(
      '/sections?api-key=k3y',
    );
  });

  it('overrides a client-supplied key', () => {
    expect(rewriteUpstreamPath('/api/guardian/search?api-key=evil', guardian, 'k3y')).toBe(
      '/search?api-key=k3y',
    );
  });

  it('leaves the query untouched for header-based auth', () => {
    expect(rewriteUpstreamPath('/api/newsapi/v2/everything?q=ai', newsapi, 'k3y')).toBe(
      '/v2/everything?q=ai',
    );
  });
});

describe('buildSourcesConfig', () => {
  it('marks sources as enabled only when a non-blank key is set', () => {
    expect(
      buildSourcesConfig({ GUARDIAN_API_KEY: 'a', NYT_API_KEY: '  ', NEWSAPI_API_KEY: undefined }),
    ).toEqual({ sources: { guardian: true, nyt: false, newsapi: false } });
  });
});
