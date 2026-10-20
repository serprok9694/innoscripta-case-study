import { z } from 'zod';
import type { Article } from '@/domain/article';
import type { CategoryId } from '@/domain/category';
import type { NewsSource } from '@/domain/news-source';
import { invertCategoryMap, nativeValuesFor } from '../shared/category-map';
import { PAGE_SIZE } from '../shared/constants';
import { fetchJson, proxyUrl } from '../shared/http';
import { htmlToText, nonEmpty } from '../shared/text';

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
});

const searchResponseSchema = z.object({
  response: z.object({
    currentPage: z.number(),
    pages: z.number(),
    results: z.array(resultSchema),
  }),
});

function toArticle(result: z.infer<typeof resultSchema>): Article {
  return {
    id: `guardian:${result.id}`,
    sourceId: 'guardian',
    publisher: 'The Guardian',
    title: result.webTitle,
    summary: htmlToText(result.fields?.trailText),
    url: result.webUrl,
    imageUrl: nonEmpty(result.fields?.thumbnail),
    author: nonEmpty(result.fields?.byline),
    category: CATEGORY_BY_SECTION.get(result.sectionId),
    publishedAt: result.webPublicationDate,
  };
}

export const guardianSource: NewsSource = {
  id: 'guardian',
  name: 'The Guardian',

  async search(query, page, signal) {
    const url = proxyUrl('guardian', '/search', {
      q: query.keyword,
      // `|` means OR in the Guardian API.
      section: nativeValuesFor(SECTIONS, query.categories).join('|'),
      'from-date': query.from,
      'to-date': query.to,
      'order-by': 'newest',
      'show-fields': 'trailText,byline,thumbnail',
      'page-size': PAGE_SIZE,
      page,
    });
    const { response } = await fetchJson('guardian', url, searchResponseSchema, signal);

    return {
      articles: response.results.map(toArticle),
      nextPage: response.currentPage < response.pages ? response.currentPage + 1 : null,
    };
  },
};
