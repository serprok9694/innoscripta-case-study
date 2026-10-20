/**
 * Upstream news APIs reachable through the local `/api/<id>` proxy.
 *
 * Keys are injected server-side (Vite proxy in dev, nginx in Docker), so they
 * never reach the browser bundle. Keep this table in sync with
 * `docker/nginx/default.conf.template`.
 */
export type ApiAuth = { in: 'query'; name: string } | { in: 'header'; name: string };

export interface ApiSourceDefinition {
  id: string;
  target: string;
  envKey: string;
  auth: ApiAuth;
}

export const API_SOURCES = [
  {
    id: 'guardian',
    target: 'https://content.guardianapis.com',
    envKey: 'GUARDIAN_API_KEY',
    auth: { in: 'query', name: 'api-key' },
  },
  {
    id: 'nyt',
    target: 'https://api.nytimes.com',
    envKey: 'NYT_API_KEY',
    auth: { in: 'query', name: 'api-key' },
  },
  {
    id: 'newsapi',
    target: 'https://newsapi.org',
    envKey: 'NEWSAPI_API_KEY',
    auth: { in: 'header', name: 'X-Api-Key' },
  },
] as const satisfies readonly ApiSourceDefinition[];

export const API_PREFIX = '/api';
export const CONFIG_PATH = `${API_PREFIX}/config`;

export type SourcesConfig = { sources: Record<string, boolean> };

/** Which sources have a key configured. Exposed to the client as `/api/config`. */
export function buildSourcesConfig(env: Record<string, string | undefined>): SourcesConfig {
  return {
    sources: Object.fromEntries(API_SOURCES.map((s) => [s.id, Boolean(env[s.envKey]?.trim())])),
  };
}

/** Strips the `/api/<id>` prefix and adds the auth query param, if any. */
export function rewriteUpstreamPath(
  path: string,
  source: ApiSourceDefinition,
  apiKey: string,
): string {
  const url = new URL(path.slice(`${API_PREFIX}/${source.id}`.length) || '/', 'http://upstream');
  if (source.auth.in === 'query') {
    url.searchParams.set(source.auth.name, apiKey);
  }
  return url.pathname + url.search;
}
