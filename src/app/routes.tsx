import type { RouteObject } from 'react-router';
import { HomePage } from '@/pages/HomePage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { SearchRedirect } from '@/pages/SearchRedirect';
import { SettingsPage } from '@/pages/SettingsPage';
import { AppLayout } from './AppLayout';

export const routes: RouteObject[] = [
  {
    element: <AppLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'search', element: <SearchRedirect /> },
      { path: 'settings', element: <SettingsPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
];
