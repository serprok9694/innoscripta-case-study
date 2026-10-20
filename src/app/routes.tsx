import type { RouteObject } from 'react-router';
import { ErrorPage } from '@/pages/ErrorPage';
import { HomePage } from '@/pages/HomePage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { AppLayout } from './AppLayout';

export const routes: RouteObject[] = [
  {
    element: <AppLayout />,
    // Last resort if the layout itself fails.
    errorElement: <ErrorPage />,
    children: [
      {
        // Page errors render inside the layout, keeping the header and navigation.
        errorElement: <ErrorPage />,
        children: [
          { index: true, element: <HomePage /> },
          {
            path: 'settings',
            // Loaded on demand: most visits never open Settings.
            lazy: async () => ({ Component: (await import('@/pages/SettingsPage')).SettingsPage }),
          },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
];
