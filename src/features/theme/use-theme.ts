import { useEffect, useSyncExternalStore } from 'react';
import { useAppSelector } from '@/app/hooks';
import { resolveTheme, selectThemeMode, type Theme } from './theme-slice';

const DARK_QUERY = '(prefers-color-scheme: dark)';

function subscribe(onChange: () => void) {
  if (typeof window.matchMedia !== 'function') return () => {};
  const query = window.matchMedia(DARK_QUERY);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
}

const prefersDark = () =>
  typeof window.matchMedia === 'function' && window.matchMedia(DARK_QUERY).matches;

/** The theme currently shown, following the OS setting live in "system" mode. */
export function useResolvedTheme(): Theme {
  const mode = useAppSelector(selectThemeMode);
  const systemPrefersDark = useSyncExternalStore(subscribe, prefersDark, () => false);
  return resolveTheme(mode, systemPrefersDark);
}

export function applyTheme(theme: Theme, root: HTMLElement = document.documentElement): void {
  root.classList.toggle('dark', theme === 'dark');
  root.style.colorScheme = theme;
}

/** Keeps the `dark` class on <html> in sync with the chosen theme. */
export function useApplyTheme(): void {
  const theme = useResolvedTheme();
  useEffect(() => applyTheme(theme), [theme]);
}
