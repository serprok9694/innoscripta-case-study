import { z } from 'zod';
import type { Article } from '@/domain/article';
import type { CategoryId } from '@/domain/category';
import type { ArticleQuery, NewsSource, SourcePage } from '@/domain/news-source';
import { invertCategoryMap, nativeValuesFor } from '../shared/category-map';
import { PAGE_SIZE } from '../shared/constants';
import { fetchJson, proxyUrl, type QueryParams } from '../shared/http';
import { mergePages } from '../shared/merge-pages';
import { nonEmpty, webUrl } from '../shared/text';

/**
 * NewsAPI categories (top-headlines only). World and politics have no
 * equivalent — `general` is a catch-all — so those categories are skipped.
 * https://newsapi.org/docs/endpoints/top-headlines
 */
const CATEGORIES: Partial<Record<CategoryId, readonly string[]>> = {
  business: ['business'],
  technology: ['technology'],
  science: ['science'],
  health: ['health'],
  sports: ['sports'],
  entertainment: ['entertainment'],
};
const CATEGORY_BY_NATIVE = invertCategoryMap(CATEGORIES);

/** Developer plan: at most 100 results per query. */
const MAX_RESULTS = 100;

const articleSchema = z.object({
  source: z.object({ name: z.string() }),
  author: z.string().nullish(),
  title: z.string(),
  description: z.string().nullish(),
  url: z.string(),
  urlToImage: z.string().nullish(),
  publishedAt: z.string(),
});

const responseSchema = z.object({
  totalResults: z.number(),
  articles: z.array(articleSchema),
});

type RawArticle = z.infer<typeof articleSchema>;

/** NewsAPI keeps deleted articles as `[Removed]` placeholders. */
function isRemoved(raw: RawArticle): boolean {
  return raw.title === '[Removed]' || raw.url === 'https://removed.com';
}

/** Placeholders some feeds put in the description. */
const JUNK_DESCRIPTIONS = new Set(['False', 'None', 'null', '[Removed]']);

/**
 * Headlines often end with " - Outlet" (sometimes an outlet other than the
 * listed source, e.g. "… - Yahoo Finance"). Strip a short, capitalised tail.
 */
export function stripOutletSuffix(title: string, publisher: string): string {
  const match = / - ([^-]{2,40})$/.exec(title);
  if (!match) return title;
  const tail = match[1]!.trim();
  const rest = title.slice(0, match.index).trim();
  const looksLikeOutlet =
    tail === publisher || (/^[A-Z0-9]/.test(tail) && tail.split(/\s+/).length <= 4);
  return looksLikeOutlet && rest.length >= 20 ? rest : title;
}

/** Some publishers put a URL in the author field. */
function parseAuthor(author: string | null | undefined): string[] {
  const name = nonEmpty(author);
  return name && !/^https?:\/\//.test(name) ? [name] : [];
}

/** `(keyword) AND ("A" OR "B")` — NewsAPI supports quotes, AND/OR and parentheses. */
function searchExpression({ keyword, authors = [] }: ArticleQuery): string | undefined {
  const byAuthor = authors.map((name) => `"${name.replaceAll('"', '')}"`).join(' OR ');
  if (keyword && byAuthor) return `(${keyword}) AND (${byAuthor})`;
  return keyword || byAuthor || undefined;
}

function toArticle(raw: RawArticle, category?: CategoryId): Article {
  const publisher = raw.source.name;
  // Headlines often end with " - Publisher".
  const title = stripOutletSuffix(raw.title, publisher);

  return {
    id: `newsapi:${raw.url}`,
    sourceId: 'newsapi',
    publisher,
    title,
    summary: JUNK_DESCRIPTIONS.has(raw.description?.trim() ?? '')
      ? undefined
      : nonEmpty(raw.description),
    url: raw.url,
    imageUrl: webUrl(raw.urlToImage),
    authors: parseAuthor(raw.author),
    category,
    publishedAt: raw.publishedAt,
  };
}

async function fetchPage(
  path: string,
  params: QueryParams,
  page: number,
  signal: AbortSignal | undefined,
  category?: CategoryId,
): Promise<SourcePage> {
  const url = proxyUrl('newsapi', path, { ...params, pageSize: PAGE_SIZE, page });
  const data = await fetchJson('newsapi', url, responseSchema, signal);
  const available = Math.min(data.totalResults, MAX_RESULTS);

  return {
    articles: data.articles
      .filter((a) => !isRemoved(a) && webUrl(a.url))
      .map((a) => toArticle(a, category)),
    nextPage: page * PAGE_SIZE < available ? page + 1 : null,
  };
}

/** Category filter needs top-headlines, which takes a single category: one request per category. */
async function searchByCategories(
  query: ArticleQuery,
  categories: string[],
  page: number,
  signal?: AbortSignal,
): Promise<SourcePage> {
  const pages = await Promise.all(
    categories.map((category) =>
      fetchPage(
        '/v2/top-headlines',
        { country: 'us', category, q: query.keyword },
        page,
        signal,
        CATEGORY_BY_NATIVE.get(category),
      ),
    ),
  );
  return mergePages(pages, page);
}

/**
 * Endpoint choice follows the API's constraints:
 * - categories → `top-headlines` (the only endpoint with categories; no date filter);
 * - keyword or authors → `everything` (search expression + date range; requires `q`);
 * - neither    → latest `top-headlines`.
 * Filters an endpoint can't apply are enforced client-side by the aggregator.
 */
export const newsApiSource: NewsSource = {
  id: 'newsapi',
  name: 'NewsAPI',

  async search(query, page, signal) {
    if (query.categories?.length) {
      const categories = nativeValuesFor(CATEGORIES, query.categories);
      if (!categories.length) return { articles: [], nextPage: null };
      return searchByCategories(query, categories, page, signal);
    }

    const q = searchExpression(query);
    if (q) {
      return fetchPage(
        '/v2/everything',
        {
          q,
          from: query.from,
          to: query.to,
          sortBy: query.sort === 'relevance' ? 'relevancy' : 'publishedAt',
          language: 'en',
        },
        page,
        signal,
      );
    }

    return fetchPage('/v2/top-headlines', { country: 'us' }, page, signal);
  },
};
