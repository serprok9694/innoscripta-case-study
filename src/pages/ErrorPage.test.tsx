import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { routes } from '@/app/routes';
import { ErrorPage } from './ErrorPage';

function Boom(): never {
  throw new Error('boom');
}

describe('ErrorPage', () => {
  it('replaces a crashed page with a way out', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const router = createMemoryRouter([
      { path: '/', element: <Boom />, errorElement: <ErrorPage /> },
    ]);
    render(<RouterProvider router={router} />);

    expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong');
    expect(screen.getByRole('button', { name: 'Reload' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to the feed' })).toHaveAttribute('href', '/');
  });

  it('is wired for the layout and for pages inside it', () => {
    const [layout] = routes;
    expect(layout?.errorElement).toBeDefined();
    expect(layout?.children?.[0]?.errorElement).toBeDefined();
  });
});
