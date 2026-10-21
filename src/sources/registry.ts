import { z } from 'zod';
import { SOURCE_IDS, type SourceId } from '@/domain/article';
import type { NewsSource } from '@/domain/news-source';
import type { SourceCatalog, SourcesConfig } from '@/domain/source-catalog';
import { createDemoSource } from './demo/demo-source';
import { guardianSource } from './guardian/guardian-source';
import { newsApiSource } from './newsapi/newsapi-source';
import { nytSource } from './nyt/nyt-source';

/** All supported sources. Adding a source = writing an adapter and listing it here. */
export const NEWS_SOURCES: readonly NewsSource[] = [guardianSource, nytSource, newsApiSource];

const configSchema = z.object({
  sources: z.partialRecord(z.enum(SOURCE_IDS), z.boolean()),
}) satisfies z.ZodType<SourcesConfig>;

export type { SourcesConfig };

/** Which sources have an API key configured on the proxy. */
export async function fetchSourcesConfig(signal?: AbortSignal): Promise<SourcesConfig> {
  const response = await fetch('/api/config', { signal });
  if (!response.ok) throw new Error(`Failed to load source config (${response.status})`);
  return configSchema.parse(await response.json());
}

/** Offline stand-ins used when no API key is configured at all. */
const DEMO_SOURCES: readonly NewsSource[] = NEWS_SOURCES.map((s) => createDemoSource(s.id, s.name));

/** No key configured: serve the recorded sample so the app is still explorable. */
export function isDemoMode(config: SourcesConfig): boolean {
  return !Object.values(config.sources).some(Boolean);
}

/** Sources the app can use: live ones with a key, or every demo source in demo mode. */
export function availableSources(config: SourcesConfig): readonly NewsSource[] {
  return isDemoMode(config) ? DEMO_SOURCES : enabledSources(config);
}

export function isSourceAvailable(config: SourcesConfig, id: SourceId): boolean {
  return isDemoMode(config) || config.sources[id] === true;
}

export function enabledSources(
  config: SourcesConfig,
  sources: readonly NewsSource[] = NEWS_SOURCES,
): NewsSource[] {
  return sources.filter((source) => config.sources[source.id] === true);
}

export function getSource(id: SourceId): NewsSource {
  const source = NEWS_SOURCES.find((s) => s.id === id);
  if (!source) throw new Error(`Unknown source: ${id}`);
  return source;
}

/** The concrete catalog the app provides at its root (see `app/AppProviders`). */
export const sourceCatalog: SourceCatalog = {
  all: NEWS_SOURCES,
  loadConfig: fetchSourcesConfig,
  available: availableSources,
  isAvailable: isSourceAvailable,
  isDemoMode,
  nameOf: (id) => getSource(id).name,
};
