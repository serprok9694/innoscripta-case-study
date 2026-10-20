import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { mockJson } from '@/test/msw/mock-json';
import { server } from '@/test/msw/server';
import { fetchJson, proxyUrl } from './http';
import { SourceError } from './source-error';

const schema = z.object({ ok: z.boolean() });
const url = () => proxyUrl('guardian', '/search');

describe('proxyUrl', () => {
  it('points at the local proxy and skips empty params', () => {
    const result = new URL(
      proxyUrl('nyt', '/svc/search', { q: 'climate change', page: 0, fq: undefined, empty: '' }),
    );
    expect(result.pathname).toBe('/api/nyt/svc/search');
    expect([...result.searchParams]).toEqual([
      ['q', 'climate change'],
      ['page', '0'],
    ]);
  });
});

describe('fetchJson', () => {
  it('returns validated data', async () => {
    mockJson('/api/guardian/search', { ok: true, extra: 'ignored' });
    await expect(fetchJson('guardian', url(), schema)).resolves.toEqual({ ok: true });
  });

  it.each([
    [
      'NewsAPI',
      { status: 'error', message: 'Your API key is invalid.' },
      'Your API key is invalid.',
    ],
    ['Guardian', { response: { status: 'error', message: 'Invalid page' } }, 'Invalid page'],
    ['NYT', { fault: { faultstring: 'Invalid ApiKey' } }, 'Invalid ApiKey'],
    ['unknown', 'Bad gateway', 'Request failed with status 400'],
  ])('reports the %s error message', async (_api, body, message) => {
    mockJson('/api/guardian/search', body, { status: 400 });
    await expect(fetchJson('guardian', url(), schema)).rejects.toMatchObject({
      name: 'SourceError',
      sourceId: 'guardian',
      kind: 'http',
      status: 400,
      message,
    });
  });

  it('classifies 429 as rate limiting', async () => {
    mockJson('/api/guardian/search', {}, { status: 429 });
    await expect(fetchJson('guardian', url(), schema)).rejects.toMatchObject({
      kind: 'rate-limit',
      status: 429,
    });
  });

  it('rejects a response that does not match the schema', async () => {
    mockJson('/api/guardian/search', { ok: 'yes' });
    const error = await fetchJson('guardian', url(), schema).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(SourceError);
    expect(error).toMatchObject({ kind: 'invalid-response' });
    expect((error as Error).cause).toBeInstanceOf(z.ZodError);
  });

  it('wraps network failures', async () => {
    server.use(http.get('*/api/guardian/search', () => HttpResponse.error()));
    await expect(fetchJson('guardian', url(), schema)).rejects.toMatchObject({ kind: 'network' });
  });

  it('lets aborts propagate as-is', async () => {
    mockJson('/api/guardian/search', { ok: true });
    const controller = new AbortController();
    controller.abort();
    const error = await fetchJson('guardian', url(), schema, controller.signal).catch(
      (e: unknown) => e,
    );
    expect(error).not.toBeInstanceOf(SourceError);
    expect((error as Error).name).toBe('AbortError');
  });
});
