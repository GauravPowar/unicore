// ============================================================
// /forums/[slug] – Forum page (Server Component)
// With cacheComponents: data is dynamic by default.
// PostCard is a Client Component — handles date rendering.
// ============================================================
import { notFound } from 'next/navigation';
import { mockData } from '@/lib/mock-data';
import { FeedClient } from '@/components/feed/FeedClient';
import { Badge } from '@/components/ui/Badge';
import type { Metadata } from 'next';

interface ForumPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ForumPageProps): Promise<Metadata> {
  const { slug } = await params;
  const forum = mockData.getForumBySlug(slug);
  if (!forum) return { title: 'Forum Not Found' };
  return { title: forum.name, description: forum.description ?? undefined };
}

export default async function ForumPage({ params }: ForumPageProps) {
  const { slug } = await params;
  const forum = mockData.getForumBySlug(slug);

  if (!forum) notFound();

  const posts = mockData.getPostsByForum(forum.id);

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Forum header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
        <Badge variant="category" className="mb-2">{forum.category}</Badge>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
          {forum.name}
        </h1>
        {forum.description && (
          <p className="text-sm text-slate-500 dark:text-slate-400">{forum.description}</p>
        )}
      </div>

      {/* Feed with composer pre-set to this forum */}
      {posts.length === 0 ? (
        <div className="space-y-4">
          <FeedClient initialPosts={[]} defaultForumId={forum.id} />
          <div className="text-center py-8 text-slate-400 dark:text-slate-500">
            <p className="text-sm">Be the first to start a discussion in this forum!</p>
          </div>
        </div>
      ) : (
        <FeedClient initialPosts={posts} defaultForumId={forum.id} />
      )}
    </div>
  );
}

// Pre-render known forum slugs
export async function generateStaticParams() {
  return mockData.getForums().map((f) => ({ slug: f.slug }));
}
