// ============================================================
// /p/[id] – Fast Shortlink Resolver
// Resolves 8-char prefixes or full UUIDs and redirects to /post/[id]
// ============================================================
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

interface ShortlinkProps {
  params: Promise<{ id: string }>;
}

export default async function ShortlinkPage({ params }: ShortlinkProps) {
  const { id } = await params;
  if (!id) notFound();

  const supabase = await createClient();
  let query = supabase.from('posts').select('id');

  if (id.length === 36) {
    query = query.eq('id', id);
  } else {
    // 8-character or partial prefix match
    query = query.ilike('id', `${id}%`);
  }

  const { data: post, error } = await query.maybeSingle();

  if (error || !post) {
    notFound();
  }

  redirect(`/post/${post.id}`);
}

