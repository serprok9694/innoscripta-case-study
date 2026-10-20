/**
 * Lets readers follow authors. Provided by pages (wired to the preferences
 * store), so article components stay store-agnostic.
 */
export interface AuthorFollowing {
  isFollowing: (name: string) => boolean;
  /** False once the follow limit is reached. */
  canFollow: boolean;
  toggle: (name: string) => void;
}
