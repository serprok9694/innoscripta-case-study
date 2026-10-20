import { useState } from 'react';
import { CloseIcon } from '@/shared/ui/icons';
import { isDemoMode } from '@/sources/registry';
import { useSourcesConfig } from '../use-sources-config';

const DISMISSED_KEY = 'news-aggregator:demo-banner-dismissed';

function wasDismissed(): boolean {
  try {
    return sessionStorage.getItem(DISMISSED_KEY) === '1';
  } catch {
    return false;
  }
}

/** Explains why the news isn't live when no API key is configured. Dismissible per session. */
export function DemoModeBanner() {
  const { data } = useSourcesConfig();
  const [dismissed, setDismissed] = useState(wasDismissed);
  if (!data || !isDemoMode(data) || dismissed) return null;

  const dismiss = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem(DISMISSED_KEY, '1');
    } catch {
      // Storage unavailable: hide it for this page view only.
    }
  };

  return (
    <div
      role="note"
      className="flex items-center justify-center gap-2 border-b border-amber-200 bg-amber-50 py-1.5 pr-2 pl-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200"
    >
      <p>
        <strong>Demo mode</strong> · sample articles, no API keys configured
      </p>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss demo mode notice"
        className="rounded p-1 hover:bg-amber-100 dark:hover:bg-amber-900"
      >
        <CloseIcon className="size-4" />
      </button>
    </div>
  );
}
