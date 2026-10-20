import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { CATEGORY_OPTIONS, useSourceOptions } from '@/features/articles/filter-options';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import {
  hasPreferences,
  resetPreferences,
  selectPreferences,
  setCategories,
  setSources,
} from '@/features/preferences/preferences-slice';
import { AuthorsEditor } from '@/features/preferences/ui/AuthorsEditor';
import { ThemeSettings } from '@/features/theme/ui/ThemeSettings';
import { Button } from '@/shared/ui/Button';
import { ChipGroup } from '@/shared/ui/ChipGroup';
import { PageHeader } from './PageHeader';

function Section({ title, hint, children }: { title: string; hint: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="font-semibold">{title}</h2>
      <p className="mt-1 mb-4 text-sm text-zinc-600 dark:text-zinc-400">{hint}</p>
      {children}
    </section>
  );
}

export function SettingsPage() {
  const preferences = useAppSelector(selectPreferences);
  const dispatch = useAppDispatch();
  const sourceOptions = useSourceOptions();

  return (
    <div className="max-w-2xl">
      <PageHeader title="Settings">
        Personalise{' '}
        <Link to="/" className="underline">
          your feed
        </Link>
        . Changes are saved automatically in this browser.
      </PageHeader>

      <div className="space-y-6">
        <Section
          title="Sources"
          hint="Where your feed comes from. None selected means all sources."
        >
          <ChipGroup
            label="Preferred sources"
            options={sourceOptions}
            selected={preferences.sources}
            onChange={(sources) => dispatch(setSources(sources))}
          />
        </Section>

        <Section title="Topics" hint="What “For you” shows. None selected means all topics.">
          <ChipGroup
            label="Preferred categories"
            options={CATEGORY_OPTIONS}
            selected={preferences.categories}
            onChange={(categories) => dispatch(setCategories(categories))}
          />
        </Section>

        <Section title="Authors" hint="Their latest articles appear under “Following”.">
          <AuthorsEditor />
        </Section>

        <Section title="Appearance" hint="“System” follows your device’s light or dark mode.">
          <ThemeSettings />
        </Section>

        {hasPreferences(preferences) && (
          <Button variant="ghost" className="-ml-4" onClick={() => dispatch(resetPreferences())}>
            Reset all preferences
          </Button>
        )}
      </div>
    </div>
  );
}
