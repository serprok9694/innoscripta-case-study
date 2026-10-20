import { Link } from 'react-router';
import { PageHeader } from './PageHeader';

export function NotFoundPage() {
  return (
    <>
      <PageHeader title="Page not found">This page doesn’t exist.</PageHeader>
      <Link to="/" className="font-medium text-blue-700 underline dark:text-blue-400">
        Back to your feed
      </Link>
    </>
  );
}
