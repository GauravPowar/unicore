// ============================================================
// Home Feed Page (Server Component)
// Live Supabase integration with zero mock data
// ============================================================
import { createClient } from '@/lib/supabase/server';
import { FeedClient } from '@/components/feed/FeedClient';
import { Rss } from 'lucide-react';
import type { Metadata } from 'next';
import type { Post } from '@/types';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Research Feed | UniCore',
  description: 'Latest micro-thoughts, questions, and collab pitches from Indian researchers',
};

export default async function HomePage() {
  let posts: Post[] = [];

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('posts')
      .select('*, author:profiles(*), forum:forums(*)')
      .order('created_at', { ascending: false });

    if (!error && data) {
      posts = data as unknown as Post[];
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
