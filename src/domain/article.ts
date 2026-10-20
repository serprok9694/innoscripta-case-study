import type { CategoryId } from './category';

export const SOURCE_IDS = ['guardian', 'nyt', 'newsapi'] as const;

export type SourceId = (typeof SOURCE_IDS)[number];

export function isSourceId(value: string): value is SourceId {
  return (SOURCE_IDS as readonly string[]).includes(value);
}

/** Source-agnostic article. Every adapter normalises its API response into this shape. */
export interface Article {
  /** Unique across sources: `<sourceId>:<native id>`. */
  id: string;
  sourceId: SourceId;
  /** Publication shown to the user. NewsAPI aggregates many publishers, so it can differ per article. */
  publisher: string;
  title: string;
  summary?: string;
  url: string;
  imageUrl?: string;
  /** Author names; empty when unknown. */
  authors: string[];
  category?: CategoryId;
  /** ISO 8601 timestamp. */
  publishedAt: string;
}
