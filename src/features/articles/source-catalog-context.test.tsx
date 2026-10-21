import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useSourceCatalog } from './source-catalog-context';

describe('useSourceCatalog', () => {
  it('fails loudly when the app forgot to provide a catalog', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useSourceCatalog())).toThrow(/SourceCatalogContext provider/);
  });
});
