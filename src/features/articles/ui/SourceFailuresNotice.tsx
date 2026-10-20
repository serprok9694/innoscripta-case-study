import { getSource } from '@/sources/registry';
import type { SourceFailure } from '../aggregator';

const REASONS: Record<SourceFailure['kind'], string> = {
  'rate-limit': 'request limit reached, try again in a minute',
  network: 'network error',
  http: 'the service returned an error',
  'invalid-response': 'unexpected response',
  unknown: 'unexpected error',
};

/** Non-blocking notice: the other sources' articles are still shown. */
export function SourceFailuresNotice({ failures }: { failures: readonly SourceFailure[] }) {
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
            {getSource(failure.sourceId).name} — {REASONS[failure.kind]}
          </li>
        ))}
      </ul>
    </div>
  );
}
