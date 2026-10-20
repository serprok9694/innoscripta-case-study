import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { SOURCE_IDS } from '@/domain/article';
import { mockJson } from '@/test/msw/mock-json';
import { enabledSources, fetchSourcesConfig, getSource, NEWS_SOURCES } from './registry';

describe('source registry', () => {
  it('registers exactly one adapter per source id', () => {
    expect(NEWS_SOURCES.map((s) => s.id).sort()).toEqual([...SOURCE_IDS].sort());
  });

  it('enables only sources with a configured key', () => {
    const enabled = enabledSources({ sources: { guardian: true, nyt: false } });
    expect(enabled.map((s) => s.id)).toEqual(['guardian']);
  });

  it('looks sources up by id', () => {
    expect(getSource('nyt').name).toBe('The New York Times');
  });

  it('loads the proxy config', async () => {
    mockJson('/api/config', { sources: { guardian: true, nyt: true, newsapi: false } });
    await expect(fetchSourcesConfig()).resolves.toEqual({
      sources: { guardian: true, nyt: true, newsapi: false },
    });
  });

  it('rejects a malformed config', async () => {
    mockJson('/api/config', { sources: { guardian: 'yes' } });
    await expect(fetchSourcesConfig()).rejects.toBeInstanceOf(z.ZodError);
  });

  it('fails when the config endpoint is unavailable', async () => {
    mockJson('/api/config', {}, { status: 502 });
    await expect(fetchSourcesConfig()).rejects.toThrow('Failed to load source config (502)');
  });
});
