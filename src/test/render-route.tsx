import { createMemoryRouter, RouterProvider } from 'react-router';
import { routes } from '@/app/routes';
import { renderWithProviders, type TestProvidersOptions } from './render';

/** Renders the real app routes at `path`, with fresh providers. */
export function renderRoute(path: string, options?: TestProvidersOptions) {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  const view = renderWithProviders(<RouterProvider router={router} />, options);
  return { ...view, router };
}
