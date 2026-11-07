// ============================================================
// Home Feed Page (Server Component)
// Live Supabase integration with zero mock data
// ============================================================
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { FeedClient } from '@/components/feed/FeedClient';
import { Rss } from 'lucide-react';
import type { Metadata } from 'next';
import type { Post } from '@/types';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Research Feed | ResearchSetu',
  description: 'Latest micro-thoughts, questions, and collab pitches from Indian researchers',
};

export default async function HomePage() {
  let posts: Post[] = [];

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('posts')
      .select('*, author:profiles!posts_author_id_fkey(*), forum:forums(*)')
      .order('created_at', { ascending: false });

    if (!error && data) {
      posts = data as unknown as Post[];
      try {
        const admin = createAdminClient();
        const { data: authUsers } = await admin.auth.admin.listUsers({ perPage: 500 });
        const userMap = new Map((authUsers?.users || []).map((u) => [u.id, u]));

        posts = posts.map((p) => {
          if (!p.author) return p;
          const authUser = userMap.get(p.author.id);
          return {
            ...p,
            author: {
              ...p.author,
              username: p.author.username || authUser?.user_metadata?.username || null,
            },
          };
        });
      } catch {
        // use raw posts
      }
    }
  } catch (err) {
    console.error('Error loading live posts:', err);
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Rss className="w-5 h-5 text-brand-500" />
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Research Feed</h1>
      </div>

      <FeedClient initialPosts={posts} />
    </div>
  );
}
