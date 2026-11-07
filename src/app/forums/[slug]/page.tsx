// ============================================================
// /forums/[slug] – Forum page (Server Component)
// Live Supabase integration with zero mock data
// ============================================================
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { FeedClient } from '@/components/feed/FeedClient';
import { ForumHeaderCard } from '@/components/forums/ForumHeaderCard';
import { OFFICIAL_FORUMS } from '@/lib/constants';
import type { Metadata } from 'next';
import type { Post } from '@/types';

export const dynamic = 'force-dynamic';

interface ForumPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ForumPageProps): Promise<Metadata> {
  const { slug } = await params;
  if (slug === 'team-updates') return { title: 'ResearchSetu Team Updates & Releases | ResearchSetu' };
  const localForum = OFFICIAL_FORUMS.find((f) => f.slug === slug);
  if (!localForum) return { title: 'Forum Not Found | ResearchSetu' };
  return { title: `${localForum.name} | ResearchSetu`, description: localForum.description ?? undefined };
}

export default async function ForumPage({ params }: ForumPageProps) {
  const { slug } = await params;
  if (slug === 'team-updates') {
    redirect('/updates');
  }

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
      let query = supabase
        .from('posts')
        .select('*, author:profiles!posts_author_id_fkey(*), forum:forums(*)')
        .order('created_at', { ascending: false });

      if (forum.slug === 'general') {
        query = query.or(`forum_id.is.null,forum_id.eq.${forum.id}`);
      } else {
        query = query.eq('forum_id', forum.id);
      }

      const { data: dbPosts } = await query;

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
      {/* Forum header with Join/Leave button */}
      <ForumHeaderCard forum={forum} />

      <FeedClient initialPosts={posts} defaultForumId={forum.id} />
    </div>
  );
}
