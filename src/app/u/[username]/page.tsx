// ============================================================
// /u/[username] – Researcher Profile by @Username Handle
// Direct rendering at canonical vanity URL (e.g. /u/gauravpowar)
// ============================================================
import { notFound, redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { fetchProfileByIdentifier } from '@/lib/profileResolver';
import { ProfileView } from '@/components/profile/ProfileView';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

interface VanityProps {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: VanityProps): Promise<Metadata> {
  const { username } = await params;
  const { profile } = await fetchProfileByIdentifier(username);

  if (!profile) {
    return { title: 'Researcher Not Found | ResearchSetu' };
  }

  const handle = profile.username ? ` (@${profile.username})` : '';
  const title = `${profile.full_name}${handle} | ResearchSetu`;
  const description =
    profile.bio ||
    `${profile.full_name} (${profile.institution || 'Researcher'}) on ResearchSetu Indian Interdisciplinary Network`;

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

export default async function VanityUsernamePage({ params }: VanityProps) {
  const { username } = await params;
  if (!username) notFound();

  const { profile, posts, canonicalUsername } = await fetchProfileByIdentifier(username);

  if (!profile) {
    notFound();
  }

  // Canonical redirect if username case or uuid alias was supplied
  if (canonicalUsername && username.toLowerCase() !== canonicalUsername.toLowerCase()) {
    redirect(`/u/${canonicalUsername}`);
  }

  return <ProfileView profile={profile} posts={posts} />;
}
