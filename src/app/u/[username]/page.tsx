// ============================================================
// /u/[username] – Vanity Handle Resolver
// Resolves @handle and redirects to /profile/[id]
// ============================================================
import { notFound, redirect } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

interface VanityProps {
  params: Promise<{ username: string }>;
}

export default async function VanityUsernamePage({ params }: VanityProps) {
  const { username } = await params;
  if (!username) notFound();

  const cleanHandle = decodeURIComponent(username).replace(/^@/, '').toLowerCase().trim();

  const admin = createAdminClient();

  // 1. If UUID passed directly
  if (cleanHandle.length === 36 && cleanHandle.includes('-')) {
    redirect(`/profile/${cleanHandle}`);
  }

  // 2. Search auth user metadata
  const { data: { users }, error } = await admin.auth.admin.listUsers();

  if (!error && users) {
    const matched = users.find(
      (u) => u.user_metadata?.username?.toLowerCase() === cleanHandle
    );

    if (matched) {
      redirect(`/profile/${matched.id}`);
    }
  }

  notFound();
}
