import { useAppDispatch } from '@/app/hooks';
import { MoonIcon, SunIcon } from '@/shared/ui/icons';
import { setThemeMode } from '../theme-slice';
import { useResolvedTheme } from '../use-theme';

/** Quick light/dark switch. "Follow system" lives in Settings. */
export function ThemeToggle() {
  const theme = useResolvedTheme();
  const dispatch = useAppDispatch();
  const next = theme === 'dark' ? 'light' : 'dark';

  return (
    <button
      type="button"
      onClick={() => dispatch(setThemeMode(next))}
      aria-label={`Switch to ${next} theme`}
      title={`Switch to ${next} theme`}
      className="rounded-lg p-2 text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
    >
      {theme === 'dark' ? <SunIcon className="size-5" /> : <MoonIcon className="size-5" />}
    </button>
  );
}
