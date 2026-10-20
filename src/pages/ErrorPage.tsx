import { Link, useRouteError } from 'react-router';
import { Button } from '@/shared/ui/Button';
import { PageHeader } from './PageHeader';

/** Shown inside the app layout when a page throws, instead of a blank or framework error screen. */
export function ErrorPage() {
  const error = useRouteError();
  if (import.meta.env.DEV) console.error(error);

  return (
    <div role="alert">
      <PageHeader title="Something went wrong">
        This page ran into an unexpected problem. Reloading usually helps.
      </PageHeader>
      <div className="flex flex-wrap gap-3">
        <Button variant="primary" onClick={() => window.location.reload()}>
          Reload
        </Button>
        <Link
          to="/"
          reloadDocument
          className="inline-flex items-center rounded-lg px-4 py-2 text-sm font-medium text-blue-700 hover:underline dark:text-blue-400"
        >
          Back to the feed
        </Link>
      </div>
    </div>
  );
}
