import type { Article, SourceId } from '@/domain/article';
import { matchesQuery } from '@/domain/article-matching';
import type { NewsSource } from '@/domain/news-source';
import { foldText } from '@/shared/lib/fold-text';
import { PAGE_SIZE } from '../shared/constants';

export interface DemoDataset {
  /** ISO date the sample was recorded (see scripts/record-demo-data.ts). */
  recordedAt: string;
  articles: Article[];
}

/** Lazy, so the sample only downloads in demo mode. */
const loadDataset = (): Promise<DemoDataset> =>
  import('./demo-articles.json').then((module) => module.default as DemoDataset);

const words = (keyword: string | undefined) => (keyword ? foldText(keyword).split(/\s+/) : []);

function matchesKeyword(article: Article, keyword: string | undefined): boolean {
  const haystack = foldText(`${article.title} ${article.summary ?? ''}`);
  return words(keyword).every((word) => haystack.includes(word));
}

/** Simple stand-in for API relevance: title matches weigh more than summary ones. */
function relevance(article: Article, keyword: string | undefined): number {
  const title = foldText(article.title);
  const summary = foldText(article.summary ?? '');
  return words(keyword).reduce(
    (score, word) => score + (title.includes(word) ? 2 : 0) + (summary.includes(word) ? 1 : 0),
    0,
  );
}

const byDate = (a: Article, b: Article) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt);

/**
 * Offline stand-in for a real source, serving a recorded sample of its
 * articles. Implements the same contract, so the rest of the app can't tell
 * the difference — used when no API key is configured.
 */
export function createDemoSource(
  id: SourceId,
  name: string,
  load: () => Promise<DemoDataset> = loadDataset,
): NewsSource {
  return {
    id,
    name,
    async search(query, page) {
      const { articles } = await load();
      const matching = articles
        .filter((a) => a.sourceId === id && matchesKeyword(a, query.keyword))
        .filter((a) => matchesQuery(a, query))
        .sort(
          query.sort === 'relevance'
            ? (a, b) => relevance(b, query.keyword) - relevance(a, query.keyword) || byDate(a, b)
            : byDate,
        );

      const start = (page - 1) * PAGE_SIZE;
      return {
        articles: matching.slice(start, start + PAGE_SIZE),
        nextPage: start + PAGE_SIZE < matching.length ? page + 1 : null,
      };
    },
  };
}
