import { z } from 'zod';
import { SOURCE_IDS, type SourceId } from '@/domain/article';
import type { NewsSource } from '@/domain/news-source';
import { guardianSource } from './guardian/guardian-source';
import { newsApiSource } from './newsapi/newsapi-source';
import { nytSource } from './nyt/nyt-source';

/** All supported sources. Adding a source = writing an adapter and listing it here. */
export const NEWS_SOURCES: readonly NewsSource[] = [guardianSource, nytSource, newsApiSource];

const configSchema = z.object({
  sources: z.partialRecord(z.enum(SOURCE_IDS), z.boolean()),
});

export type SourcesConfig = z.infer<typeof configSchema>;

/** Which sources have an API key configured on the proxy. */
export async function fetchSourcesConfig(signal?: AbortSignal): Promise<SourcesConfig> {
  const response = await fetch('/api/config', { signal });
  if (!response.ok) throw new Error(`Failed to load source config (${response.status})`);
  return configSchema.parse(await response.json());
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
