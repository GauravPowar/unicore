// ============================================================
// ResearchSetu – Unified Researcher Profile View Component
// Used by both /u/[username] and /profile/[id]
// ============================================================
'use client';

import Link from 'next/link';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { PostCard } from '@/components/feed/PostCard';
import { ArrowLeft, FileText } from 'lucide-react';
import type { Profile, Post } from '@/types';

interface ProfileViewProps {
  profile: Profile;
  posts: Post[];
}

export function ProfileView({ profile, posts }: ProfileViewProps) {
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

      {/* Main Profile Header Card with Custom Bio Editing & Vanity Link */}
      <ProfileHeader initialProfile={profile} />

      {/* Publications / Posts Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-brand-500" />
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Lab Insights &amp; Discussions by {profile.full_name}
          </h2>
        </div>

        {posts.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 text-center text-slate-400 text-sm">
            No posts published yet.
          </div>
        ) : (
          posts.map((post) => <PostCard key={post.id} post={post} />)
        )}
      </div>
    </div>
  );
}
