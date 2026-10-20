import type { Connect, Plugin, ProxyOptions } from 'vite';
import {
  API_PREFIX,
  API_SOURCES,
  buildSourcesConfig,
  CONFIG_PATH,
  rewriteUpstreamPath,
} from './api-sources.ts';

/**
 * Dev/preview counterpart of the nginx proxy: forwards `/api/<id>/*` to the
 * upstream API with the key attached, and serves `/api/config`.
 */
export function apiProxy(env: Record<string, string | undefined>): Plugin {
  const proxy: Record<string, ProxyOptions> = {};

  for (const source of API_SOURCES) {
    const apiKey = env[source.envKey]?.trim();
    if (!apiKey) continue;

    proxy[`${API_PREFIX}/${source.id}/`] = {
      target: source.target,
      changeOrigin: true,
      rewrite: (path) => rewriteUpstreamPath(path, source, apiKey),
      headers: source.auth.in === 'header' ? { [source.auth.name]: apiKey } : {},
      configure: (p) => p.on('proxyReq', (req) => req.removeHeader('origin')),
    };
  }

  const serveConfig: Connect.NextHandleFunction = (req, res, next) => {
    if (req.url !== CONFIG_PATH) return next();
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(buildSourcesConfig(env)));
  };

  return {
    name: 'news-api-proxy',
    config: () => ({ server: { proxy }, preview: { proxy } }),
    configureServer: (server) => void server.middlewares.use(serveConfig),
    configurePreviewServer: (server) => void server.middlewares.use(serveConfig),
  };
}
