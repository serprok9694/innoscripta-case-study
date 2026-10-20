import type { Article, SourceId } from './article';
import type { CategoryId } from './category';

/** Calendar date in `YYYY-MM-DD` format (what `<input type="date">` produces). */
export type IsoDate = string;

/**
 * What the user is looking for. Adapters translate as much of it as their API
 * supports into request params; the rest is applied client-side.
 */
export interface ArticleQuery {
  keyword?: string;
  from?: IsoDate;
  to?: IsoDate;
  /** Match any of these. Empty or missing means "all categories". */
  categories?: readonly CategoryId[];
  /** Articles by any of these authors. Sources narrow by author where their API allows it. */
  authors?: readonly string[];
}

export interface SourcePage {
  articles: Article[];
  /** 1-based page to request next, or `null` when the source is exhausted. */
  nextPage: number | null;
}

/** Contract every news API adapter implements. The UI depends only on this. */
export interface NewsSource {
  readonly id: SourceId;
  readonly name: string;
  /** @param page 1-based page number. */
  search(query: ArticleQuery, page: number, signal?: AbortSignal): Promise<SourcePage>;
}
