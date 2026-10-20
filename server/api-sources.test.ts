import { describe, expect, it } from 'vitest';
import {
  API_SOURCES,
  buildSourcesConfig,
  proxyRoutePattern,
  rewriteUpstreamPath,
} from './api-sources.ts';

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

describe('proxyRoutePattern', () => {
  const [guardianApi, nytApi] = API_SOURCES;
  const matches = (source: (typeof API_SOURCES)[number], url: string) =>
    new RegExp(proxyRoutePattern(source)).test(url);

  it('lets only the allowed endpoints through', () => {
    expect(matches(guardianApi, '/api/guardian/search?q=climate')).toBe(true);
    expect(matches(guardianApi, '/api/guardian/tags')).toBe(true);
    expect(matches(guardianApi, '/api/guardian/sections')).toBe(false);
    expect(matches(guardianApi, '/api/guardian/searchx')).toBe(false);
    expect(matches(nytApi, '/api/nyt/svc/search/v2/articlesearch.json?q=x')).toBe(true);
    expect(matches(nytApi, '/api/nyt/svc/search/v2/articlesearchXjson')).toBe(false);
  });
});
