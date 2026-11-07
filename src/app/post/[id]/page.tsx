// ============================================================
// /post/[id] – Dedicated Post Permalink Page
// ============================================================
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { PostCard } from '@/components/feed/PostCard';
import { ArrowLeft } from 'lucide-react';
import type { Metadata } from 'next';
import type { Post } from '@/types';

export const dynamic = 'force-dynamic';

interface PostPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { id } = await params;
  try {
    const supabase = await createClient();
    const { data: post } = await supabase
      .from('posts')
      .select('title, content_markdown, author:profiles!posts_author_id_fkey(full_name)')
      .eq('id', id)
      .maybeSingle();

    if (post) {
      const authorName = (post.author as unknown as { full_name?: string })?.full_name ?? 'Researcher';
      const title = post.title || post.content_markdown?.slice(0, 60) || 'Research Post';
      return {
        title: `${title} by ${authorName} | UniCore`,
        description: post.content_markdown?.slice(0, 160),
      };
    }
  } catch {
    // fallback
  }

  return { title: 'Research Post | UniCore' };
}

export default async function PostPage({ params }: PostPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: post, error } = await supabase
    .from('posts')
    .select('*, author:profiles!posts_author_id_fkey(*), forum:forums(*)')
    .eq('id', id)
    .maybeSingle();

  if (error || !post) {
    notFound();
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-2">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 hover:text-brand-600 dark:hover:text-brand-400 transition-colors font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Feed
        </Link>
        {post.forum && (
          <>
            <span>/</span>
            <Link
              href={`/forums/${post.forum.slug}`}
              className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
            >
              {post.forum.name}
            </Link>
          </>
        )}
      </div>

      <PostCard post={post as unknown as Post} defaultShowComments={true} />
    </div>
  );
}
