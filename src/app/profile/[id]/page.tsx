// ============================================================
// /profile/[id] – Dedicated Researcher Profile View
// ============================================================
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { PostCard } from '@/components/feed/PostCard';
import { ArrowLeft, FileText } from 'lucide-react';
import type { Metadata } from 'next';
import type { Profile, Post } from '@/types';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

interface ProfilePageProps {
  params: Promise<{ id: string }>;
}

async function fetchProfileData(id: string): Promise<{ profile: Profile | null; posts: Post[] }> {
  try {
    const supabase = await createClient();
    const { data: dbProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (dbProfile) {
      const { data: dbPosts } = await supabase
        .from('posts')
        .select('*, author:profiles!posts_author_id_fkey(*), forum:forums(*)')
        .eq('author_id', id)
        .order('created_at', { ascending: false });

      // Retrieve target user's specific links and username from auth metadata
      let links = null;
      let username = dbProfile.username;
      try {
        const adminClient = createAdminClient();
        const { data: authUserData } = await adminClient.auth.admin.getUserById(id);
        if (authUserData?.user) {
          links = authUserData.user.user_metadata?.links || null;
          if (!username) {
            username = authUserData.user.user_metadata?.username || null;
          }
        }
      } catch (err) {
        console.warn('Could not fetch user metadata links:', err);
      }

      return {
        profile: {
          ...(dbProfile as Profile),
          links,
          username,
        },
        posts: (dbPosts as unknown as Post[]) || [],
      };
    }

    // Auto-heal: If profile record is missing from public.profiles, retrieve from auth.users
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const adminClient = createAdminClient();
      const { data: authUserData } = await adminClient.auth.admin.getUserById(id);
      if (authUserData?.user) {
        const u = authUserData.user;
        const isAcademic = Boolean(
          u.email &&
            (u.email.endsWith('.ac.in') ||
              u.email.endsWith('.edu.in') ||
              u.email.endsWith('.res.in'))
        );
        const autoProfile: Profile = {
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
        };

        try {
          await adminClient.from('profiles').upsert(autoProfile);
        } catch {
          // ignore
        }

        return {
          profile: autoProfile,
          posts: [],
        };
      }
    }
  } catch (err) {
    console.error('Error fetching profile:', err);
  }

  return { profile: null, posts: [] };
}

export async function generateMetadata({ params }: ProfilePageProps): Promise<Metadata> {
  const { id } = await params;
  const { profile } = await fetchProfileData(id);
  if (!profile) return { title: 'Researcher Not Found | ResearchSetu' };
  return {
    title: `${profile.full_name} | ResearchSetu`,
    description: profile.bio ?? `${profile.full_name} on ResearchSetu Indian Researcher Network`,
  };
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { id } = await params;
  const { profile, posts: userPosts } = await fetchProfileData(id);

  if (!profile) notFound();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back button */}
      <div>
        <Link
          href="/directory"
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-brand-500 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Researcher Directory
        </Link>
      </div>

      {/* Main Profile Header Card with Custom Bio Editing */}
      <ProfileHeader initialProfile={profile} />

      {/* Publications / Posts Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-brand-500" />
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Lab Insights &amp; Discussions by {profile.full_name}
          </h2>
        </div>

        {userPosts.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 text-center text-slate-400 text-sm">
            No posts published yet.
          </div>
        ) : (
          userPosts.map((post) => <PostCard key={post.id} post={post} />)
        )}
      </div>
    </div>
  );
}
