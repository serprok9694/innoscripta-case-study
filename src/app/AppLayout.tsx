import { NavLink, Outlet, ScrollRestoration } from 'react-router';
import { cx } from '@/shared/lib/cx';

const NAV = [
  { to: '/', label: 'My feed', end: true },
  { to: '/search', label: 'Search', end: false },
  { to: '/settings', label: 'Settings', end: false },
];

export function AppLayout() {
  return (
    <div className="flex min-h-dvh flex-col bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded focus:bg-white focus:px-3 focus:py-2 focus:shadow dark:focus:bg-zinc-900"
      >
        Skip to content
      </a>

      <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/90 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/90">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
          <NavLink to="/" className="text-lg font-bold tracking-tight">
            Newsroom
          </NavLink>
          <nav aria-label="Main">
            <ul className="flex gap-1">
              {NAV.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      cx(
                        'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                          : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100',
                      )
                    }
                  >
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </header>

      <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:py-8">
        <Outlet />
      </main>

      <footer className="border-t border-zinc-200 py-6 text-center text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
        Articles from The Guardian, The New York Times and NewsAPI.org.
      </footer>

      <ScrollRestoration />
    </div>
  );
}
