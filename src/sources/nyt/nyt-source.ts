import { z } from 'zod';
import type { Article } from '@/domain/article';
import type { CategoryId } from '@/domain/category';
import type { ArticleQuery, NewsSource, SourcePage } from '@/domain/news-source';
import { invertCategoryMap, nativeValuesFor } from '../shared/category-map';
import { PAGE_SIZE } from '../shared/constants';
import { fetchJson, proxyUrl } from '../shared/http';
import { mergePages } from '../shared/merge-pages';
import { compactDate, nonEmpty, webUrl } from '../shared/text';

/**
 * NYT section names per category. Politics lives in a subsection (U.S. → Politics).
 * https://developer.nytimes.com/docs/articlesearch-product/1/overview
 */
const SECTIONS: Partial<Record<CategoryId, readonly string[]>> = {
  world: ['World'],
  business: ['Business', 'Your Money'],
  technology: ['Technology'],
  science: ['Science', 'Climate'],
  health: ['Health', 'Well'],
  sports: ['Sports'],
  entertainment: ['Arts', 'Movies', 'Theater', 'Books'],
};
const SUBSECTIONS: Partial<Record<CategoryId, readonly string[]>> = {
  politics: ['Politics'],
};
const CATEGORY_BY_SECTION = invertCategoryMap(SECTIONS);
const CATEGORY_BY_SUBSECTION = invertCategoryMap(SUBSECTIONS);

/** The API refuses pages beyond 100 (0-based), i.e. 1 010 results. */
const MAX_PAGE = 101;

const docSchema = z.object({
  _id: z.string(),
  web_url: z.string(),
  headline: z.object({ main: z.string() }),
  abstract: z.string().nullish(),
  pub_date: z.string(),
  section_name: z.string().nullish(),
  subsection_name: z.string().nullish(),
  // Decorative fields: a malformed value must not fail the whole page.
  byline: z.object({ original: z.string().nullish() }).nullish().catch(null),
  multimedia: z
    .object({ default: z.object({ url: z.string().nullish() }).nullish() })
    .nullish()
    .catch(null),
});

const searchResponseSchema = z.object({
  response: z.object({
    // `docs` is null when nothing matches.
    docs: z.array(docSchema).nullable(),
    metadata: z.object({ hits: z.number() }),
  }),
});

/** Lucene filter for the requested categories, e.g. `section.name:("World") OR subsection.name:("Politics")`. */
function categoryFilter(categories: readonly CategoryId[] | undefined): string | undefined {
  const clause = (field: string, values: string[]) =>
    values.length ? `${field}:(${values.map((v) => JSON.stringify(v)).join(' ')})` : undefined;

  const clauses = [
    clause('section.name', nativeValuesFor(SECTIONS, categories)),
    clause('subsection.name', nativeValuesFor(SUBSECTIONS, categories)),
  ].filter(Boolean);
  return clauses.length ? clauses.join(' OR ') : undefined;
}

/** "By Jane Doe, John Roe and Ann Poe" → ["Jane Doe", "John Roe", "Ann Poe"]. */
export function parseByline(byline: string | null | undefined): string[] {
  const names = nonEmpty(byline)?.replace(/^By\s+/i, '');
  return names ? names.split(/\s*,\s*|\s+and\s+/).filter(Boolean) : [];
}

function toArticle(doc: z.infer<typeof docSchema>): Article {
  const subsection = doc.subsection_name ?? '';
  const section = doc.section_name ?? '';
  return {
    id: `nyt:${doc._id}`,
    sourceId: 'nyt',
    publisher: 'The New York Times',
    title: doc.headline.main,
    summary: nonEmpty(doc.abstract),
    url: doc.web_url,
    imageUrl: webUrl(doc.multimedia?.default?.url),
    authors: parseByline(doc.byline?.original),
    category: CATEGORY_BY_SUBSECTION.get(subsection) ?? CATEGORY_BY_SECTION.get(section),
    publishedAt: doc.pub_date,
  };
}

async function searchPage(
  query: ArticleQuery,
  keyword: string | undefined,
  page: number,
  signal?: AbortSignal,
): Promise<SourcePage> {
  const url = proxyUrl('nyt', '/svc/search/v2/articlesearch.json', {
    q: keyword,
    fq: categoryFilter(query.categories),
    begin_date: compactDate(query.from),
    end_date: compactDate(query.to),
    sort: query.sort === 'relevance' ? 'relevance' : 'newest',
    page: page - 1, // NYT pages are 0-based
  });
  const { response } = await fetchJson('nyt', url, searchResponseSchema, signal);
  const docs = response.docs ?? [];
  const hasMore = docs.length > 0 && page * PAGE_SIZE < response.metadata.hits && page < MAX_PAGE;

  return {
    articles: docs.map(toArticle).filter((a) => webUrl(a.url)),
    nextPage: hasMore ? page + 1 : null,
  };
}

export function createNytSource(): NewsSource {
  /**
   * Authors whose results ran out, per query: the free quota is 5 requests a
   * minute, so later pages only ask about authors that still have articles.
   */
  const exhausted = new Set<string>();
  const authorKey = (query: ArticleQuery, author: string) =>
    JSON.stringify([query.keyword, query.from, query.to, query.categories, query.sort, author]);

  return {
    id: 'nyt',
    name: 'The New York Times',

    async search(query, page, signal) {
      if (!query.authors?.length) return searchPage(query, query.keyword, page, signal);

      // Byline filters no longer work and `q` has no OR, so search each author's
      // name separately; the aggregator then keeps only real bylines.
      const authors = query.authors.filter(
        (author) => page === 1 || !exhausted.has(authorKey(query, author)),
      );
      const pages = await Promise.all(
        authors.map(async (author) => {
          const result = await searchPage(
            query,
            [query.keyword, author].filter(Boolean).join(' '),
            page,
            signal,
          );
          const key = authorKey(query, author);
          if (result.nextPage === null) exhausted.add(key);
          else exhausted.delete(key);
          return result;
        }),
      );
      return mergePages(pages, page);
    },
  };
}

export const nytSource = createNytSource();
