/**
 * Records the demo-mode sample by running the real source adapters through
 * the local key-injecting proxy. Needs API keys in .env.
 *
 *   npm run demo:record
 */
import { writeFile } from 'node:fs/promises';
import { JSDOM } from 'jsdom';
import { createServer, isRunnableDevEnvironment } from 'vite';

// Minimal view of the app modules this script uses. Kept local so the Node
// type-check doesn't pull in browser code.
type ArticleQuery = { categories?: string[] };
interface Article {
  id: string;
}
interface NewsSource {
  id: string;
  search(query: ArticleQuery, page: number): Promise<{ articles: Article[] }>;
}
interface Registry {
  enabledSources(config: unknown): NewsSource[];
}

const OUTPUT = new URL('../src/sources/demo/demo-articles.json', import.meta.url);
const CATEGORIES = [
  'world',
  'politics',
  'business',
  'technology',
  'science',
  'health',
  'sports',
  'entertainment',
] as const;
/** NYT allows 5 requests per minute. */
const DELAY_MS: Record<string, number> = { nyt: 12_500 };

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const server = await createServer({ server: { port: 0 }, logLevel: 'warn' });
await server.listen();
const address = server.httpServer?.address();
const origin = `http://localhost:${typeof address === 'object' && address ? address.port : 5173}`;

// The adapters run in a browser: give them `window.location` and `DOMParser`.
const { window } = new JSDOM('', { url: origin });
Object.assign(globalThis, { window, DOMParser: window.DOMParser });

try {
  // Load the app code through the dev server, so aliases and transforms apply.
  const ssr = server.environments.ssr;
  if (!ssr || !isRunnableDevEnvironment(ssr)) throw new Error('No runnable SSR environment');
  const registry: Registry = await ssr.runner.import('/src/sources/registry.ts');
  const config: unknown = await fetch(`${origin}/api/config`).then((r) => r.json());
  const sources = registry.enabledSources(config);
  if (!sources.length) throw new Error('No API keys configured in .env');

  const queries: Array<[ArticleQuery, number]> = [
    [{}, 1],
    [{}, 2],
    ...CATEGORIES.map((category): [ArticleQuery, number] => [{ categories: [category] }, 1]),
  ];

  const articles = new Map<string, Article>();
  for (const source of sources) {
    for (const [query, page] of queries) {
      try {
        const result = await source.search(query, page);
        for (const article of result.articles) {
          if (!articles.has(article.id)) articles.set(article.id, article);
        }
        console.log(`${source.id} ${JSON.stringify(query)} p${page}: ${result.articles.length}`);
      } catch (error) {
        console.warn(`${source.id} ${JSON.stringify(query)} failed:`, (error as Error).message);
      }
      await sleep(DELAY_MS[source.id] ?? 300);
    }
  }

  const dataset = {
    recordedAt: new Date().toISOString().slice(0, 10),
    articles: [...articles.values()],
  };
  await writeFile(OUTPUT, `${JSON.stringify(dataset, null, 2)}\n`);
  console.log(`Saved ${dataset.articles.length} articles to ${OUTPUT.pathname}`);
} finally {
  await server.close();
}
