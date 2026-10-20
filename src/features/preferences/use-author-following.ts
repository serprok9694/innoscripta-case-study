import { useAppDispatch, useAppSelector } from '@/app/hooks';
import type { AuthorFollowing } from '@/features/articles/author-following';
import {
  canFollowMore,
  followAuthor,
  isFollowing,
  selectAuthors,
  unfollowAuthor,
} from './preferences-slice';

/** Connects article cards' author buttons to the user's preferences. */
export function useAuthorFollowing(): AuthorFollowing {
  const authors = useAppSelector(selectAuthors);
  const dispatch = useAppDispatch();

  return {
    isFollowing: (name) => isFollowing(authors, name),
    canFollow: canFollowMore(authors),
    toggle: (name) =>
      dispatch(isFollowing(authors, name) ? unfollowAuthor(name) : followAuthor(name)),
  };
}
