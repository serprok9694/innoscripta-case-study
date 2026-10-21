// @vitest-environment node
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { SOURCE_IDS } from '../src/domain/article.ts';
import { API_PREFIX, API_SOURCES } from './api-sources.ts';

/**
 * The source list has to exist in several places (client registry, Vite
 * proxy, nginx, the container's env). This test keeps them in sync, so adding
 * a source can't silently miss one.
 */
const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

interface NginxLocation {
  pattern: RegExp;
  body: string;
}

/** The template's regex `location ~ … { … }` blocks (nginx PCRE ≈ JS RegExp for these). */
function regexLocations(template: string): NginxLocation[] {
  return [...template.matchAll(/^ {4}location ~ (\S+) \{\n([\s\S]*?)^ {4}\}/gm)].map(
    ([, pattern, body]) => ({ pattern: new RegExp(pattern!), body: body! }),
  );
}

describe('source configuration stays in sync', () => {
  const nginx = read('docker/nginx/default.conf.template');
  const locations = regexLocations(nginx);

  it('proxies exactly the sources the app knows', () => {
    expect(API_SOURCES.map((s) => s.id).sort()).toEqual([...SOURCE_IDS].sort());
    expect(locations).toHaveLength(API_SOURCES.length);
  });

  describe.each(API_SOURCES.map((s) => [s.id, s] as const))('%s', (id, source) => {
    const prefix = `${API_PREFIX}/${id}`;
    const own = locations.filter((location) =>
      location.pattern.test(`${prefix}${source.paths[0]}`),
    );

    it('forwards exactly the allowed endpoints in nginx', () => {
      expect(own).toHaveLength(1);
      for (const path of source.paths) {
        expect(own[0]!.pattern.test(`${prefix}${path}`)).toBe(true);
      }
      // Anything else under the source is not forwarded by any rule.
      for (const path of ['/not-allowed', `${source.paths[0]}x`, '']) {
        expect(locations.some((l) => l.pattern.test(`${prefix}${path}`))).toBe(false);
      }
    });

    it('sends the key to the right upstream, and refuses without one', () => {
      const body = own[0]!.body;
      expect(body).toContain(`set $upstream ${source.target};`);
      expect(body).toContain(`set $api_key "\${${source.envKey}}";`);
      expect(body).toMatch(/if \(\$api_key = ""\) \{\s*return 503/);
      expect(body).toContain('upstream-proxy.conf');
      const keyUse =
        source.auth.in === 'query'
          ? `${source.auth.name}=\${${source.envKey}}`
          : `proxy_set_header ${source.auth.name} "\${${source.envKey}}"`;
      expect(body).toContain(keyUse);
    });

    it('declares the key in the container setup', () => {
      expect(read('docker/40-sources-config.sh')).toContain(source.envKey);
      expect(read('docker-compose.yml')).toContain(`${source.envKey}: \${${source.envKey}:-}`);
      expect(read('Dockerfile')).toContain(`${source.envKey}=""`);
      expect(read('.env.example')).toContain(`${source.envKey}=`);
    });
  });
});
