import { createMemoryRouter, type InitialEntry, RouterProvider } from 'react-router';
import { routes } from '@/app/routes';
import { renderWithProviders, type TestProvidersOptions } from './render';

/** Renders the real app routes at `path` (optionally with history state), with fresh providers. */
export function renderRoute(path: InitialEntry, options?: TestProvidersOptions) {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  const view = renderWithProviders(<RouterProvider router={router} />, options);
  return { ...view, router };
}
