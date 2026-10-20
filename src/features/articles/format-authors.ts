/** Shown authors on a card; the full list is in the tooltip and the preview. */
const MAX_CARD_AUTHORS = 2;

/** "Andrew Ross Sorkin, Bernhard Warner +6" */
export function formatAuthors(authors: readonly string[]): string {
  const shown = authors.slice(0, MAX_CARD_AUTHORS).join(', ');
  const rest = authors.length - MAX_CARD_AUTHORS;
  return rest > 0 ? `${shown} +${rest}` : shown;
}
