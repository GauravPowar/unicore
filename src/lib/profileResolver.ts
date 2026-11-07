// ============================================================
// ResearchSetu – Profile Resolver Utility
// Resolves researcher profiles by UUID or @username handle
// ============================================================
import { createAdminClient } from '@/lib/supabase/admin';
import type { Profile, Post } from '@/types';

export interface ResolvedProfileData {
  profile: Profile | null;
  posts: Post[];
  canonicalUsername: string | null;
}

/**
 * Resolves a profile and their posts by either UUID or @username handle.
 */
export async function fetchProfileByIdentifier(
  identifier: string
): Promise<ResolvedProfileData> {
  const clean = decodeURIComponent(identifier).replace(/^@/, '').trim();
  if (!clean) {
    return { profile: null, posts: [], canonicalUsername: null };
  }

  const admin = createAdminClient();
  const isUUID = clean.length === 36 && clean.includes('-');

  let targetId: string | null = null;
  let canonicalUsername: string | null = null;
  let authLinks: Record<string, string> | null = null;

  if (isUUID) {
    targetId = clean;
    try {
      const { data: authUser } = await admin.auth.admin.getUserById(targetId);
      if (authUser?.user) {
        canonicalUsername = authUser.user.user_metadata?.username || null;
        authLinks = authUser.user.user_metadata?.links || null;
      }
    } catch (err) {
      console.warn('Error fetching auth user by id:', err);
    }
  } else {
    // Search auth users by username metadata
    const cleanLower = clean.toLowerCase();
    try {
      const { data: authUsers } = await admin.auth.admin.listUsers({ perPage: 1000 });
      const matched = (authUsers?.users || []).find(
        (u) => u.user_metadata?.username?.toLowerCase() === cleanLower
      );
      if (matched) {
        targetId = matched.id;
        canonicalUsername = matched.user_metadata?.username || clean;
        authLinks = matched.user_metadata?.links || null;
      }
    } catch (err) {
      console.warn('Error searching auth user by username:', err);
    }
  }

  if (!targetId) {
    return { profile: null, posts: [], canonicalUsername: null };
  }

  // Fetch profile row from public.profiles
  const { data: dbProfile } = await admin
    .from('profiles')
    .select('*')
    .eq('id', targetId)
    .maybeSingle();

  // Fetch user posts
  const { data: dbPosts } = await admin
    .from('posts')
    .select('*, author:profiles!posts_author_id_fkey(*), forum:forums(*)')
    .eq('author_id', targetId)
    .order('created_at', { ascending: false });

  let finalProfile: Profile | null = null;

  if (dbProfile) {
    finalProfile = {
      ...(dbProfile as Profile),
      username: canonicalUsername || dbProfile.username || null,
      links: authLinks || null,
    };
  } else {
    // Auto-heal if profile row is missing from public.profiles
    try {
      const { data: authUser } = await admin.auth.admin.getUserById(targetId);
      if (authUser?.user) {
        const u = authUser.user;
        const isAcademic = Boolean(
          u.email &&
            (u.email.endsWith('.ac.in') ||
              u.email.endsWith('.edu.in') ||
              u.email.endsWith('.res.in'))
        );
        finalProfile = {
          id: u.id,
          full_name:
            u.user_metadata?.full_name || u.email?.split('@')[0] || 'Researcher',
          institution: u.user_metadata?.institution || null,
          department: u.user_metadata?.department || null,
          city_state: null,
          bio: u.user_metadata?.bio || null,
          avatar_url: u.user_metadata?.avatar_url || null,
          orcid_id: u.user_metadata?.orcid_id || null,
          is_verified_researcher: isAcademic,
          collab_status: u.user_metadata?.collab_status || 'open_to_collab',
          skills_offered: [],
          skills_needed: [],
          created_at: u.created_at,
          updated_at: u.updated_at || u.created_at,
          username: canonicalUsername || u.user_metadata?.username || null,
          links: authLinks || null,
        };

        await admin.from('profiles').upsert(finalProfile);
      }
    } catch {
      // ignore
    }
  }

  return {
    profile: finalProfile,
    posts: (dbPosts as unknown as Post[]) || [],
    canonicalUsername,
  };
}

/**
 * Returns the canonical profile URL for a user or profile object.
 * Prefers /u/[username] if username is available, falls back to /profile/[id].
 */
export function getProfileUrl(
  profileOrUser: { id?: string; username?: string | null } | null | undefined
): string {
  if (!profileOrUser) return '/directory';
  if (profileOrUser.username) {
    const handle = profileOrUser.username.replace(/^@/, '').trim();
    if (handle) return `/u/${handle}`;
  }
  return profileOrUser.id ? `/profile/${profileOrUser.id}` : '/directory';
}
