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

/** `YYYY-MM-DD` → `YYYYMMDD` (NYT date format). */
export function compactDate(date: string | undefined): string | undefined {
  return date?.replaceAll('-', '');
}

/** An absolute http(s) URL, or `undefined` (e.g. `javascript:` or relative links from a feed). */
export function webUrl(value: string | null | undefined): string | undefined {
  const trimmed = nonEmpty(value);
  if (!trimmed) return undefined;
  try {
    const { protocol } = new URL(trimmed);
    return protocol === 'https:' || protocol === 'http:' ? trimmed : undefined;
  } catch {
    return undefined;
  }
}
