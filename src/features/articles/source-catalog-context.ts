import { createContext, useContext } from 'react';
import type { SourceCatalog } from '@/domain/source-catalog';

/**
 * Dependency injection for the source catalog. No default value on purpose:
 * a default would hard-wire the concrete registry here again.
 */
export const SourceCatalogContext = createContext<SourceCatalog | null>(null);

export function useSourceCatalog(): SourceCatalog {
  const catalog = useContext(SourceCatalogContext);
  if (!catalog) {
    throw new Error(
      'useSourceCatalog needs a SourceCatalogContext provider (see app/AppProviders)',
    );
  }
  return catalog;
}
