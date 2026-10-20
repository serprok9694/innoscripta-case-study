import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { SOURCE_IDS } from '@/domain/article';
import { mockJson } from '@/test/msw/mock-json';
import {
  availableSources,
  enabledSources,
  fetchSourcesConfig,
  getSource,
  isDemoMode,
  isSourceAvailable,
  NEWS_SOURCES,
} from './registry';

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

  describe('demo mode', () => {
    it('kicks in only when no key is configured at all', () => {
      expect(isDemoMode({ sources: {} })).toBe(true);
      expect(isDemoMode({ sources: { guardian: false, nyt: false } })).toBe(true);
      expect(isDemoMode({ sources: { guardian: false, nyt: true } })).toBe(false);
    });

    it('offers every source as an offline stand-in', () => {
      const demo = availableSources({ sources: {} });
      expect(demo.map((s) => s.id)).toEqual(['guardian', 'nyt', 'newsapi']);
      expect(demo).not.toContain(NEWS_SOURCES[0]);
      expect(isSourceAvailable({ sources: {} }, 'newsapi')).toBe(true);
    });

    it('uses live sources as soon as one key is configured', () => {
      const config = { sources: { nyt: true } };
      expect(availableSources(config)).toEqual([getSource('nyt')]);
      expect(isSourceAvailable(config, 'guardian')).toBe(false);
    });
  });
});
