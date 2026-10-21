import { z } from 'zod';
import type { Article } from '@/domain/article';
import type { CategoryId } from '@/domain/category';
import type { NewsSource } from '@/domain/news-source';
import { invertCategoryMap, nativeValuesFor } from '../shared/category-map';
import { PAGE_SIZE } from '../shared/constants';
import { fetchJson, proxyUrl } from '../shared/http';
import { foldText } from '@/shared/lib/fold-text';
import { htmlToText, nonEmpty, webUrl } from '../shared/text';

/** Guardian section ids per category. https://open-platform.theguardian.com/documentation/search */
const SECTIONS: Record<CategoryId, readonly string[]> = {
  world: ['world'],
  politics: ['politics'],
  business: ['business', 'money'],
  technology: ['technology'],
  science: ['science', 'environment'],
  health: ['society', 'wellness'],
  sports: ['sport', 'football'],
  entertainment: ['culture', 'film', 'music', 'tv-and-radio', 'books', 'games', 'stage'],
};
const CATEGORY_BY_SECTION = invertCategoryMap(SECTIONS);

const tagSchema = z.object({ id: z.string(), type: z.string(), webTitle: z.string() });

const resultSchema = z.object({
  id: z.string(),
  sectionId: z.string(),
  webTitle: z.string(),
  webUrl: z.string(),
  webPublicationDate: z.string(),
  fields: z
    .object({
      trailText: z.string().optional(),
      byline: z.string().optional(),
      thumbnail: z.string().optional(),
    })
    .optional(),
  tags: z.array(tagSchema).optional(),
});

const searchResponseSchema = z.object({
  response: z.object({
    currentPage: z.number(),
    pages: z.number(),
    results: z.array(resultSchema),
  }),
});

const tagsResponseSchema = z.object({
  response: z.object({ results: z.array(tagSchema) }),
});

function toArticle(result: z.infer<typeof resultSchema>): Article {
  const contributors = (result.tags ?? [])
    .filter((tag) => tag.type === 'contributor')
    .map((tag) => tag.webTitle);
  // Agency copy has no contributor tags, only a byline ("Reuters").
  const byline = nonEmpty(result.fields?.byline);

  return {
    id: `guardian:${result.id}`,
    sourceId: 'guardian',
    publisher: 'The Guardian',
    title: result.webTitle,
    summary: htmlToText(result.fields?.trailText),
    url: result.webUrl,
    imageUrl: webUrl(result.fields?.thumbnail),
    authors: contributors.length ? contributors : byline ? [byline] : [],
    category: CATEGORY_BY_SECTION.get(result.sectionId),
    publishedAt: result.webPublicationDate,
  };
}

/**
 * The Guardian filters by author via contributor tags (`profile/fiona-harvey`),
 * so names are resolved to tag ids once and cached for the session.
 */
/** Lets one caller stop waiting for a shared promise without cancelling it for the others. */
function untilAborted<T>(promise: Promise<T>, signal?: AbortSignal): Promise<T> {
  if (!signal) return promise;
  signal.throwIfAborted();
  return new Promise<T>((resolve, reject) => {
    const onAbort = () => reject(signal.reason);
    signal.addEventListener('abort', onAbort, { once: true });
    promise.then(resolve, reject).finally(() => signal.removeEventListener('abort', onAbort));
  });
}

function createContributorResolver() {
  const cache = new Map<string, Promise<string | null>>();

  // Shared by concurrent callers, so it isn't tied to any one caller's
  // AbortSignal: one cancelled search mustn't fail another's lookup.
  async function lookup(name: string): Promise<string | null> {
    const url = proxyUrl('guardian', '/tags', { type: 'contributor', q: name, 'page-size': 10 });
    const { response } = await fetchJson('guardian', url, tagsResponseSchema);
    return response.results.find((tag) => foldText(tag.webTitle) === foldText(name))?.id ?? null;
  }

  return async function resolve(names: readonly string[], signal?: AbortSignal) {
    const ids = await Promise.all(
      names.map((name) => {
        const key = foldText(name);
        let pending = cache.get(key);
        if (!pending) {
          pending = lookup(name);
          cache.set(key, pending);
          // Don't cache failures: retry next time.
          pending.catch(() => cache.delete(key));
        }
        return untilAborted(pending, signal);
      }),
    );
    return ids.filter((id): id is string => id !== null);
  };
}

export function createGuardianSource(): NewsSource {
  const resolveContributors = createContributorResolver();

  return {
    id: 'guardian',
    name: 'The Guardian',

    async search(query, page, signal) {
      let tag: string | undefined;
      if (query.authors?.length) {
        const ids = await resolveContributors(query.authors, signal);
        // None of the authors writes for the Guardian.
        if (!ids.length) return { articles: [], nextPage: null };
        tag = ids.join('|');
      }

      const url = proxyUrl('guardian', '/search', {
        q: query.keyword,
        // `|` means OR in the Guardian API.
        section: nativeValuesFor(SECTIONS, query.categories).join('|'),
        tag,
        'from-date': query.from,
        'to-date': query.to,
        'order-by': query.sort === 'relevance' ? 'relevance' : 'newest',
        'show-fields': 'trailText,byline,thumbnail',
        'show-tags': 'contributor',
        'page-size': PAGE_SIZE,
        page,
      });
      const { response } = await fetchJson('guardian', url, searchResponseSchema, signal);

      return {
        articles: response.results.map(toArticle).filter((a) => webUrl(a.url)),
        nextPage: response.currentPage < response.pages ? response.currentPage + 1 : null,
      };
    },
  };
}

export const guardianSource = createGuardianSource();
