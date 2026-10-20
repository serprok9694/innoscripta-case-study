import { isDemoMode } from '@/sources/registry';
import { useSourcesConfig } from '../use-sources-config';

/** Explains why the news isn't live when no API key is configured. */
export function DemoModeBanner() {
  const { data } = useSourcesConfig();
  if (!data || !isDemoMode(data)) return null;

  return (
    <div
      role="note"
      className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200"
    >
      <strong>Demo mode:</strong> no API keys are configured, so you’re browsing a saved sample of
      articles. Add keys to <code>.env</code> for live news (see the README).
    </div>
  );
}
