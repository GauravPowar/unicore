// ============================================================
// /profile/[id] – Dedicated Researcher Profile View
// ============================================================
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { mockData } from '@/lib/mock-data';
import { Avatar } from '@/components/ui/Avatar';
import { Badge, VerifiedBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { PostCard } from '@/components/feed/PostCard';
import { COLLAB_STATUS_LABELS } from '@/lib/utils';
import {
  MapPin,
  Building,
  ExternalLink,
  MessageSquare,
  Sparkles,
  ArrowLeft,
  FileText,
} from 'lucide-react';
import type { Metadata } from 'next';

interface ProfilePageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: ProfilePageProps): Promise<Metadata> {
  const { id } = await params;
  const profile = mockData.getProfileById(id);
  if (!profile) return { title: 'Researcher Not Found' };
  return {
    title: `${profile.full_name} | UniCore`,
    description: profile.bio ?? `${profile.full_name} on UniCore`,
  };
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { id } = await params;
  const profile = mockData.getProfileById(id);

  if (!profile) notFound();

  // Get posts authored by this researcher
  const userPosts = mockData.getPosts().filter((p) => p.author_id === profile.id);

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

      {/* Main Profile Header Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start gap-5">
          <Avatar name={profile.full_name} src={profile.avatar_url} size="xl" />

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                {profile.full_name}
              </h1>
              {profile.is_verified_researcher && <VerifiedBadge />}
            </div>

            {profile.institution && (
              <p className="flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300 mt-1">
                <Building className="w-4 h-4 text-slate-400 shrink-0" />
                {profile.institution}
              </p>
            )}

            {profile.department && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 ml-5">
                {profile.department}
              </p>
            )}

            {profile.city_state && (
              <p className="flex items-center gap-1 text-xs text-slate-400 mt-1 ml-5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                {profile.city_state}
              </p>
            )}

            <div className="mt-3 flex flex-wrap gap-2 items-center">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                <Sparkles className="w-3 h-3" />
                {COLLAB_STATUS_LABELS[profile.collab_status]}
              </span>

              {profile.orcid_id && (
                <a
                  href={`https://orcid.org/${profile.orcid_id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-mono text-brand-600 dark:text-brand-400 bg-brand-50/60 dark:bg-brand-950/40 px-2.5 py-1 rounded-full border border-brand-200/50 dark:border-brand-800/40 hover:underline"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  ORCID: {profile.orcid_id}
                  <ExternalLink className="w-3 h-3 ml-0.5 opacity-70" />
                </a>
              )}
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex sm:flex-col gap-2 w-full sm:w-auto shrink-0 pt-2 sm:pt-0">
            <Link
              href={`/messages?to=${profile.id}&preset=coffee_chat`}
              className="flex-1 sm:flex-none"
            >
              <Button variant="primary" size="md" className="w-full gap-2 text-xs">
                ☕ Coffee Chat
              </Button>
            </Link>
            <Link href={`/messages?to=${profile.id}`} className="flex-1 sm:flex-none">
              <Button variant="secondary" size="md" className="w-full gap-2 text-xs">
                <MessageSquare className="w-4 h-4" /> Message
              </Button>
            </Link>
          </div>
        </div>

        {/* Bio */}
        {profile.bio && (
          <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
            <h2 className="text-xs uppercase font-semibold tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
              Research Focus &amp; Bio
            </h2>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              {profile.bio}
            </p>
          </div>
        )}

        {/* Skills Offered & Needed Grid */}
        <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <h2 className="text-xs uppercase font-semibold tracking-wider text-slate-400 dark:text-slate-500 mb-2">
              Skills Offered
            </h2>
            <div className="flex flex-wrap gap-1.5">
              {profile.skills_offered.map((skill) => (
                <Badge key={skill} variant="verified" className="text-xs py-1 px-2.5">
                  {skill}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-xs uppercase font-semibold tracking-wider text-slate-400 dark:text-slate-500 mb-2">
              Looking for Collaboration On
            </h2>
            <div className="flex flex-wrap gap-1.5">
              {profile.skills_needed.map((skill) => (
                <Badge key={skill} variant="collab" className="text-xs py-1 px-2.5">
                  {skill}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>

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

// Pre-render known profile IDs
export async function generateStaticParams() {
  return mockData.getProfiles().map((p) => ({ id: p.id }));
}
