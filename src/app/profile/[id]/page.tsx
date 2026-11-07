// ============================================================
// /profile/[id] – Dedicated Researcher Profile View
// Automatically redirects to /u/[username] if handle is chosen
// ============================================================
import { notFound, redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { fetchProfileByIdentifier } from '@/lib/profileResolver';
import { ProfileView } from '@/components/profile/ProfileView';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

interface ProfilePageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: ProfilePageProps): Promise<Metadata> {
  const { id } = await params;
  const { profile } = await fetchProfileByIdentifier(id);

  if (!profile) return { title: 'Researcher Not Found | ResearchSetu' };

  const handle = profile.username ? ` (@${profile.username})` : '';
  const title = `${profile.full_name}${handle} | ResearchSetu`;
  const description =
    profile.bio ||
    `${profile.full_name} (${profile.institution || 'Researcher'}) on ResearchSetu Indian Researcher Network`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'profile',
      siteName: 'ResearchSetu',
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
  };
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { id } = await params;
  const { profile, posts, canonicalUsername } = await fetchProfileByIdentifier(id);

  if (!profile) notFound();

  // If user has chosen a handle, redirect to their canonical vanity URL /u/[username]
  if (canonicalUsername) {
    redirect(`/u/${canonicalUsername}`);
  }

  return <ProfileView profile={profile} posts={posts} />;
}
