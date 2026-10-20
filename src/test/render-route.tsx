import { render } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { routes } from '@/app/routes';
import { createWrapper } from './render';

/** Renders the real app routes at `path`, with fresh providers. */
export function renderRoute(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  const view = render(<RouterProvider router={router} />, { wrapper: createWrapper() });
  return { ...view, router };
}
