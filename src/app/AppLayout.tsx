import type { ComponentType, SVGProps } from 'react';
import { NavLink, Outlet, ScrollRestoration } from 'react-router';
import { DemoModeBanner } from '@/features/articles/ui/DemoModeBanner';
import { ThemeToggle } from '@/features/theme/ui/ThemeToggle';
import { useApplyTheme } from '@/features/theme/use-theme';
import { cx } from '@/shared/lib/cx';
import { NewspaperIcon, SlidersIcon } from '@/shared/ui/icons';

interface NavItem {
  to: string;
  label: string;
  end: boolean;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
}

const NAV: NavItem[] = [
  { to: '/', label: 'Home', end: true, Icon: NewspaperIcon },
  { to: '/settings', label: 'Settings', end: false, Icon: SlidersIcon },
];

/** Top links on larger screens. */
function DesktopNav() {
  return (
    <nav aria-label="Main" className="hidden sm:block">
      <ul className="flex gap-1">
        {NAV.map(({ to, label, end }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                cx(
                  'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                    : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100',
                )
              }
            >
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/** Thumb-friendly tab bar on phones. */
function MobileNav() {
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-zinc-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur sm:hidden dark:border-zinc-800 dark:bg-zinc-900/95"
    >
      <ul className="grid grid-cols-2">
        {NAV.map(({ to, label, end, Icon }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                cx(
                  'flex flex-col items-center gap-0.5 py-2 text-xs font-medium',
                  isActive
                    ? 'text-zinc-900 dark:text-zinc-100'
                    : 'text-zinc-500 dark:text-zinc-400',
                )
              }
            >
              <Icon className="size-6" />
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function AppLayout() {
  useApplyTheme();

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
          <NavLink to="/" className="flex items-center gap-2 text-lg font-bold tracking-tight">
            <img src="/favicon.svg" alt="" className="size-7" />
            Newsroom
          </NavLink>
          <div className="flex items-center gap-2">
            <DesktopNav />
            <ThemeToggle />
          </div>
        </div>
      </header>
      <DemoModeBanner />

      <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:py-8">
        <Outlet />
      </main>

      {/* Bottom padding on phones keeps the footer clear of the tab bar. */}
      <footer className="border-t border-zinc-200 pt-6 pb-24 text-center text-xs text-zinc-500 sm:pb-6 dark:border-zinc-800 dark:text-zinc-400">
        Articles from The Guardian, The New York Times and NewsAPI.org.
      </footer>

      <MobileNav />
      <ScrollRestoration />
    </div>
  );
}
