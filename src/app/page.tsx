// ============================================================
// Home Feed Page (Server Component)
// With cacheComponents: data is dynamic by default.
// PostCard is a Client Component — handles date rendering.
// ============================================================
import { mockData } from '@/lib/mock-data';
import { PostCard } from '@/components/feed/PostCard';
import { FeedComposerStub } from '@/components/feed/FeedComposerStub';
import { Rss } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Feed',
  description: 'Latest micro-thoughts, questions, and collab pitches from Indian researchers',
};

export default function HomePage() {
  const posts = mockData.getPosts();

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Rss className="w-5 h-5 text-brand-500" />
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Research Feed</h1>
      </div>

      {/* Composer stub (full composer built in Step 3) */}
      <FeedComposerStub />

      {/* Posts */}
      <div className="space-y-4">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  );
}
