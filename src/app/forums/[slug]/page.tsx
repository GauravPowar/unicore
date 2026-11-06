// ============================================================
// /forums/[slug] – Forum page (Server Component)
// With cacheComponents: data is dynamic by default; no need for force-dynamic.
// PostCard is a Client Component — handles date rendering client-side.
// ============================================================
import { notFound } from 'next/navigation';
import { mockData } from '@/lib/mock-data';
import { PostCard } from '@/components/feed/PostCard';
import { Badge } from '@/components/ui/Badge';
import { FeedComposerStub } from '@/components/feed/FeedComposerStub';
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

      {/* Composer stub */}
      <FeedComposerStub />

      {/* Posts */}
      {posts.length === 0 ? (
        <div className="text-center py-16 text-slate-400 dark:text-slate-500">
          <p className="text-lg mb-1">No posts yet in this forum.</p>
          <p className="text-sm">Be the first to start a discussion!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}

