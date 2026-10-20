/** Trimmed string, or `undefined` for null/blank values. */
export function nonEmpty(value: string | null | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

/** Plain text from an HTML snippet (entities decoded, tags removed). Does not execute scripts. */
export function htmlToText(html: string | null | undefined): string | undefined {
  if (!html) return undefined;
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return nonEmpty(doc.body.textContent?.replace(/\s+/g, ' '));
}

/** Lower-cased and accent-free, for forgiving comparisons ("Ségolène" ≈ "segolene"). */
export function foldText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
}

/** `YYYY-MM-DD` → `YYYYMMDD` (NYT date format). */
export function compactDate(date: string | undefined): string | undefined {
  return date?.replaceAll('-', '');
}
