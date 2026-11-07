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

  if (id.length === 36) {
    const { data: post } = await supabase.from('posts').select('id').eq('id', id).maybeSingle();
    if (post) redirect(`/post/${post.id}`);
  } else {
    // Prefix lookup: match short prefix (with or without hyphens)
    const { data: posts } = await supabase.from('posts').select('id');
    const cleanInput = id.replace(/-/g, '').toLowerCase();
    const matched = posts?.find(
      (p) =>
        p.id.toLowerCase().startsWith(id.toLowerCase()) ||
        p.id.replace(/-/g, '').toLowerCase().startsWith(cleanInput)
    );
    if (matched) redirect(`/post/${matched.id}`);
  }

  notFound();
}

