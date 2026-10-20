/**
 * History state of a search entered from the feed. Leaving such a search
 * steps back to the feed's history entry instead of adding a new one, so
 * Back never loops between feed and results.
 */
export interface SearchEntryState {
  fromFeed?: boolean;
}

export const FROM_FEED: SearchEntryState = { fromFeed: true };

export function isFromFeed(state: unknown): boolean {
  return (state as SearchEntryState | null)?.fromFeed === true;
}
