import { useArticles } from '@/features/articles/use-articles';
import { ArticleFeed } from '@/features/articles/ui/ArticleFeed';
import { PageHeader } from './PageHeader';

export function FeedPage() {
  const feed = useArticles({});

  return (
    <>
      <PageHeader title="My feed">The latest stories from all your sources.</PageHeader>
      <ArticleFeed feed={feed} />
    </>
  );
}
