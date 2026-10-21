import type { SourceId } from '@/domain/article';
import type { NewsSource } from '@/domain/news-source';
import type { SourceCatalog } from '@/domain/source-catalog';

const NAMES: Record<SourceId, string> = {
  guardian: 'The Guardian',
  nyt: 'The New York Times',
  newsapi: 'NewsAPI',
};

/**
 * In-memory `SourceCatalog` for unit tests: no registry, no network.
 * Pass `sources` to control exactly what the app can fetch from.
 */
export function fakeCatalog(sources: readonly NewsSource[] = []): SourceCatalog {
  return {
    all: sources,
    loadConfig: async () => ({
      sources: Object.fromEntries(sources.map((s) => [s.id, true])),
    }),
    available: () => sources,
    isAvailable: (_config, id) => sources.some((s) => s.id === id),
    isDemoMode: () => false,
    nameOf: (id) => NAMES[id],
  };
}
