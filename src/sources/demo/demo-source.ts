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

function matchesKeyword(article: Article, keyword: string | undefined): boolean {
  if (!keyword) return true;
  const haystack = foldText(`${article.title} ${article.summary ?? ''}`);
  return foldText(keyword)
    .split(/\s+/)
    .every((word) => haystack.includes(word));
}

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
        .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));

      const start = (page - 1) * PAGE_SIZE;
      return {
        articles: matching.slice(start, start + PAGE_SIZE),
        nextPage: start + PAGE_SIZE < matching.length ? page + 1 : null,
      };
    },
  };
}
