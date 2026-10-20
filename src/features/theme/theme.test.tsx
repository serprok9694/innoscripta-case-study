import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createWrapper } from '@/test/render';
import { isThemeMode, resolveTheme } from './theme-slice';
import { loadThemeMode, saveThemeMode, THEME_STORAGE_KEY } from './theme-storage';
import { applyTheme, useResolvedTheme } from './use-theme';

/** Controllable `prefers-color-scheme: dark` media query. */
function mockSystemTheme(dark: boolean) {
  const listeners = new Set<() => void>();
  const query = {
    get matches() {
      return dark;
    },
    addEventListener: (_: string, listener: () => void) => listeners.add(listener),
    removeEventListener: (_: string, listener: () => void) => listeners.delete(listener),
  };
  vi.stubGlobal('matchMedia', () => query);
  return {
    change(nextDark: boolean) {
      dark = nextDark;
      listeners.forEach((listener) => listener());
    },
  };
}

describe('theme', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('resolves "system" from the OS setting', () => {
    expect(resolveTheme('system', true)).toBe('dark');
    expect(resolveTheme('system', false)).toBe('light');
    expect(resolveTheme('light', true)).toBe('light');
    expect(resolveTheme('dark', false)).toBe('dark');
  });

  it('validates stored modes', () => {
    expect(isThemeMode('dark')).toBe(true);
    expect(isThemeMode('sepia')).toBe(false);

    saveThemeMode('light');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
    expect(loadThemeMode()).toBe('light');

    localStorage.setItem(THEME_STORAGE_KEY, 'sepia');
    expect(loadThemeMode()).toBeUndefined();
  });

  it('follows the OS setting live in system mode', () => {
    const system = mockSystemTheme(false);
    const { result } = renderHook(() => useResolvedTheme(), { wrapper: createWrapper() });
    expect(result.current).toBe('light');

    act(() => system.change(true));
    expect(result.current).toBe('dark');
  });

  it('applies the theme to the document', () => {
    const root = document.createElement('html');
    applyTheme('dark', root);
    expect(root).toHaveClass('dark');
    expect(root.style.colorScheme).toBe('dark');

    applyTheme('light', root);
    expect(root).not.toHaveClass('dark');
  });
});
