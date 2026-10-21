import { useSourceCatalog } from '../source-catalog-context';
import type { SourceFailure } from '../aggregator';

const REASONS: Record<SourceFailure['kind'], string> = {
  'rate-limit': 'request limit reached, try again in a minute',
  network: 'network error',
  http: 'the service returned an error',
  'invalid-response': 'unexpected response',
  unknown: 'unexpected error',
};

/** Non-blocking notice: the other sources' articles are still shown. */
export function SourceFailuresNotice({
  failures,
  onRetry,
}: {
  failures: readonly SourceFailure[];
  onRetry: () => void;
}) {
  const catalog = useSourceCatalog();
  if (!failures.length) return null;

  return (
    <div
      role="status"
      className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200"
    >
      <p className="font-medium">Some sources are unavailable right now:</p>
      <ul className="mt-1 list-inside list-disc">
        {failures.map((failure) => (
          <li key={failure.sourceId}>
            {catalog.nameOf(failure.sourceId)} — {REASONS[failure.kind]}
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={onRetry}
        className="mt-2 font-medium underline hover:no-underline"
      >
        Retry
      </button>
    </div>
  );
}
