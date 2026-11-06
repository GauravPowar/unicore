// ============================================================
// /forums/[slug] – Forum page (Server Component)
// Live Supabase integration with zero mock data
// ============================================================
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { FeedClient } from '@/components/feed/FeedClient';
import { Badge } from '@/components/ui/Badge';
import { OFFICIAL_FORUMS } from '@/lib/constants';
import type { Metadata } from 'next';
import type { Post } from '@/types';

export const dynamic = 'force-dynamic';

interface ForumPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ForumPageProps): Promise<Metadata> {
  const { slug } = await params;
  const localForum = OFFICIAL_FORUMS.find((f) => f.slug === slug);
  if (!localForum) return { title: 'Forum Not Found | UniCore' };
  return { title: `${localForum.name} | UniCore`, description: localForum.description ?? undefined };
}

export default async function ForumPage({ params }: ForumPageProps) {
  const { slug } = await params;

  let forum = OFFICIAL_FORUMS.find((f) => f.slug === slug);
  let posts: Post[] = [];

  try {
    const supabase = await createClient();
    const { data: dbForum } = await supabase
      .from('forums')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();

    if (dbForum) {
      forum = dbForum;
    }

    if (forum) {
      const { data: dbPosts } = await supabase
        .from('posts')
        .select('*, author:profiles(*), forum:forums(*)')
        .eq('forum_id', forum.id)
        .order('created_at', { ascending: false });

      if (dbPosts) {
        posts = dbPosts as unknown as Post[];
      }
    }
  } catch (err) {
    console.warn('Could not query forum data:', err);
  }

  if (!forum) notFound();

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

      <FeedClient initialPosts={posts} defaultForumId={forum.id} />
    </div>
  );
}
