// @vitest-environment node
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { SOURCE_IDS } from '../src/domain/article.ts';
import { API_SOURCES } from './api-sources.ts';

/**
 * The source list has to exist in several places (client registry, Vite
 * proxy, nginx, the container's env). This test keeps them in sync, so adding
 * a source can't silently miss one.
 */
const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

describe('source configuration stays in sync', () => {
  it('proxies exactly the sources the app knows', () => {
    expect(API_SOURCES.map((s) => s.id).sort()).toEqual([...SOURCE_IDS].sort());
  });

  it.each(API_SOURCES.map((s) => [s.id, s] as const))('%s is wired everywhere', (id, source) => {
    const nginx = read('docker/nginx/default.conf.template');
    expect(nginx).toContain(`/api/${id}/`);
    // Same allowed endpoints as the dev proxy (nginx regexes escape dots).
    for (const path of source.paths) {
      const lastSegment = path.split('/').at(-1)!.replaceAll('.', '\\.');
      expect(nginx).toContain(lastSegment);
    }
    expect(nginx).toContain(source.target);
    expect(nginx).toContain(`\${${source.envKey}}`);

    expect(read('docker/40-sources-config.sh')).toContain(source.envKey);
    expect(read('docker-compose.yml')).toContain(source.envKey);
    expect(read('Dockerfile')).toContain(source.envKey);
    expect(read('.env.example')).toContain(`${source.envKey}=`);
  });
});
