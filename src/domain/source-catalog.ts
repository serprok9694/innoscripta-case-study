import type { SourceId } from './article';
import type { NewsSource } from './news-source';

/** Which sources have an API key configured on the proxy. */
export interface SourcesConfig {
  sources: Partial<Record<SourceId, boolean>>;
}

/**
 * Everything the UI needs to know about news sources, as an abstraction:
 * hooks and components depend on this, and the app's root provides the
 * implementation (`sources/registry.ts`). Tests can provide their own.
 */
export interface SourceCatalog {
  /** Every supported source (e.g. for pickers), configured or not. */
  readonly all: readonly NewsSource[];
  loadConfig(signal?: AbortSignal): Promise<SourcesConfig>;
  /** Sources that can serve articles under this configuration. */
  available(config: SourcesConfig): readonly NewsSource[];
  isAvailable(config: SourcesConfig, id: SourceId): boolean;
  /** No key configured at all: a recorded sample is served instead. */
  isDemoMode(config: SourcesConfig): boolean;
  /** Display name, e.g. "The New York Times". */
  nameOf(id: SourceId): string;
}
