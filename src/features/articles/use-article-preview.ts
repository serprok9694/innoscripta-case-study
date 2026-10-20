import { useLocation, useNavigate } from 'react-router';
import type { Article } from '@/domain/article';
import { articleSchema } from './article-schema';

/** History state can outlive a deploy: only trust a valid article. */
function readPreview(state: unknown): Article | undefined {
  const preview = (state as { preview?: unknown } | null)?.preview;
  const parsed = articleSchema.safeParse(preview);
  return parsed.success ? parsed.data : undefined;
}

/**
 * The article preview lives in the history entry's state:
 * - opening pushes an entry, so Back (and the Android back gesture) closes it;
 * - it's a snapshot of loaded data, so opening makes no request and survives a reload;
 * - the URL doesn't change: previews aren't shareable (NYT/NewsAPI have no stable ids).
 */
export function useArticlePreview() {
  const location = useLocation();
  const navigate = useNavigate();
  const here = { pathname: location.pathname, search: location.search, hash: location.hash };

  return {
    article: readPreview(location.state),
    open: (article: Article) =>
      navigate(here, { state: { preview: article }, preventScrollReset: true }),
    close: () => {
      // Opened in this session: step back. Restored on a fresh load: just drop the state.
      if (location.key !== 'default') navigate(-1);
      else navigate(here, { replace: true, state: null, preventScrollReset: true });
    },
  };
}
