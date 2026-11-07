// ============================================================
// ProfileHeader – Researcher profile header with custom bio editor,
// avatar upload, username handle, links, follow/mute, and account deletion
// Client Component
// ============================================================
'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Avatar } from '@/components/ui/Avatar';
import { Badge, VerifiedBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/components/providers/AuthProvider';
import { createClient } from '@/lib/supabase/client';
import { COLLAB_STATUS_LABELS } from '@/lib/utils';
import type { Profile, CollabStatus } from '@/types';
import {
  MapPin,
  Building,
  ExternalLink,
  MessageSquare,
  Sparkles,
  Edit3,
  Check,
  X,
  Coffee,
  Camera,
  Trash2,
  Upload,
  AtSign,
  Globe,
  GraduationCap,
  Link as LinkIcon,
  UserPlus,
  UserCheck,
  VolumeX,
  Volume2,
  MoreHorizontal,
} from 'lucide-react';

function GithubIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
      />
    </svg>
  );
}

interface ProfileHeaderProps {
  initialProfile: Profile;
}

export function ProfileHeader({ initialProfile }: ProfileHeaderProps) {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const isOwner = user?.id === initialProfile.id;

  const [profile, setProfile] = useState<Profile>(initialProfile);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Social graph state (Follow & Mute) - 100% Real Supabase Data
  const initialFollowing = (user?.user_metadata?.following as string[]) || [];
  const initialMuted = (user?.user_metadata?.muted as string[]) || [];
  const [isFollowing, setIsFollowing] = useState(initialFollowing.includes(initialProfile.id));
  const [isMuted, setIsMuted] = useState(initialMuted.includes(initialProfile.id));
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [optionsMenuOpen, setOptionsMenuOpen] = useState(false);

  // Fetch real followers and following count from database
  useEffect(() => {
    fetch(`/api/profile/${initialProfile.id}/follow`)
      .then((r) => r.json())
      .then((d) => {
        if (d.followersCount !== undefined) setFollowersCount(d.followersCount);
        if (d.followingCount !== undefined) setFollowingCount(d.followingCount);
        if (d.isFollowing !== undefined) setIsFollowing(d.isFollowing);
      })
      .catch(() => {});
  }, [initialProfile.id, user]);

  // Edit form state
  const [username, setUsername] = useState(initialProfile.username || '');
  const [avatarUrl, setAvatarUrl] = useState(initialProfile.avatar_url || '');
  const [bio, setBio] = useState(initialProfile.bio || '');
  const [institution, setInstitution] = useState(initialProfile.institution || '');
  const [department, setDepartment] = useState(initialProfile.department || '');
  const [cityState, setCityState] = useState(initialProfile.city_state || '');
  const [collabStatus, setCollabStatus] = useState<CollabStatus>(initialProfile.collab_status);
  const [skillsOfferedInput, setSkillsOfferedInput] = useState(
    initialProfile.skills_offered?.join(', ') || ''
  );
  const [skillsNeededInput, setSkillsNeededInput] = useState(
    initialProfile.skills_needed?.join(', ') || ''
  );

  // Links state – ALWAYS read from the profile being viewed (initialProfile.links), NOT the viewer!
  const targetLinks = (initialProfile.links as Record<string, string>) || {};
  const [labWebsite, setLabWebsite] = useState(targetLinks.labWebsite || '');
  const [googleScholar, setGoogleScholar] = useState(targetLinks.googleScholar || '');
  const [githubUrl, setGithubUrl] = useState(targetLinks.githubUrl || '');
  const [personalWebsite, setPersonalWebsite] = useState(targetLinks.personalWebsite || '');

  // Synchronize links specifically for this profile ID
  useEffect(() => {
    fetch(`/api/profile/${initialProfile.id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.profile?.links) {
          const l = d.profile.links;
          setLabWebsite(l.labWebsite || '');
          setGoogleScholar(l.googleScholar || '');
          setGithubUrl(l.githubUrl || '');
          setPersonalWebsite(l.personalWebsite || '');
        }
        if (d.profile?.username) {
          setUsername(d.profile.username);
        }
      })
      .catch(() => {});
  }, [initialProfile.id]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        if (data.url) {
          setAvatarUrl(data.url);
        }
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to upload image');
      }
    } catch {
      alert('Error uploading avatar image');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleToggleFollow = async () => {
    if (!user) {
      alert('Please sign in to follow researchers.');
      window.location.href = '/login';
      return;
    }

    const nextAction = isFollowing ? 'unfollow' : 'follow';
    const nextState = !isFollowing;
    setIsFollowing(nextState);
    setFollowersCount((c) => (nextState ? c + 1 : Math.max(0, c - 1)));

    try {
      const res = await fetch(`/api/profile/${initialProfile.id}/follow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: nextAction }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.followersCount !== undefined) setFollowersCount(data.followersCount);
        if (data.followingCount !== undefined) setFollowingCount(data.followingCount);
      }
    } catch {
      // rollback
      setIsFollowing(!nextState);
      setFollowersCount((c) => (nextState ? Math.max(0, c - 1) : c + 1));
    }
  };

  const handleToggleMute = async () => {
    if (!user) return;
    const nextState = !isMuted;
    setIsMuted(nextState);
    setOptionsMenuOpen(false);

    try {
      const supabase = createClient();
      const currentList: string[] = (user.user_metadata?.muted as string[]) || [];
      const updatedList = nextState
        ? Array.from(new Set([...currentList, initialProfile.id]))
        : currentList.filter((id) => id !== initialProfile.id);

      await supabase.auth.updateUser({
        data: { muted: updatedList },
      });
      alert(nextState ? `Muted @${initialProfile.full_name}` : `Unmuted @${initialProfile.full_name}`);
    } catch {
      setIsMuted(!nextState);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);

    const skillsOffered = skillsOfferedInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const skillsNeeded = skillsNeededInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');

    const updates: Record<string, unknown> = {
      bio: bio.trim() || null,
      avatar_url: avatarUrl.trim() || null,
      institution: institution.trim() || null,
      department: department.trim() || null,
      city_state: cityState.trim() || null,
      collab_status: collabStatus,
      skills_offered: skillsOffered,
      skills_needed: skillsNeeded,
      updated_at: new Date().toISOString(),
    };

    try {
      const supabase = createClient();

      // 1. Update user metadata for username and links
      await supabase.auth.updateUser({
        data: {
          username: cleanUsername,
          links: {
            labWebsite: labWebsite.trim(),
            googleScholar: googleScholar.trim(),
            githubUrl: githubUrl.trim(),
            personalWebsite: personalWebsite.trim(),
          },
        },
      });

      // 2. Update profiles table
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (!error) {
        setProfile((prev) => ({
          ...prev,
          ...updates,
          username: cleanUsername || prev.username,
          links: {
            labWebsite: labWebsite.trim(),
            googleScholar: googleScholar.trim(),
            githubUrl: githubUrl.trim(),
            personalWebsite: personalWebsite.trim(),
          },
        } as Profile));
        setIsEditing(false);
        router.refresh();
      } else {
        alert(`Could not save changes: ${error.message}`);
      }
    } catch (err) {
      console.error('Profile update error:', err);
      alert('Network error while updating profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to PERMANENTLY delete your UniCore account? This will erase your profile, publications, and all posts. This action cannot be reversed.'
    );
    if (!confirmed) return;

    setIsDeletingAccount(true);
    try {
      const res = await fetch('/api/account', { method: 'DELETE' });
      if (res.ok) {
        await signOut();
        window.location.href = '/';
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete account');
      }
    } catch {
      alert('Network error while requesting account deletion.');
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const displayUsername = profile.username || (user?.id === profile.id ? user?.user_metadata?.username : null);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row items-start gap-5">
        <div className="relative group">
          <Avatar name={profile.full_name} src={profile.avatar_url} size="xl" />
          {isOwner && (
            <button
              onClick={() => setIsEditing(true)}
              className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-brand-500 text-white shadow-md hover:bg-brand-600 transition-colors"
              title="Change profile picture"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              {profile.full_name}
            </h1>
            {profile.is_verified_researcher && <VerifiedBadge />}
          </div>

          {displayUsername && (
            <p className="text-xs font-mono text-brand-600 dark:text-brand-400 mt-0.5">
              @{displayUsername}
            </p>
          )}

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

          {/* Followers & Following Stats */}
          <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 mt-2 ml-5">
            <span>
              <strong className="text-slate-800 dark:text-slate-200">{followingCount}</strong> Following
            </span>
            <span>·</span>
            <span>
              <strong className="text-slate-800 dark:text-slate-200">{followersCount}</strong> Followers
            </span>
          </div>

          {/* Badges & Links Row */}
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

            {/* Custom Profile Links */}
            {labWebsite && (
              <a
                href={labWebsite.startsWith('http') ? labWebsite : `https://${labWebsite}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs text-brand-600 dark:text-brand-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full hover:underline"
              >
                <Globe className="w-3 h-3" /> Lab
              </a>
            )}

            {googleScholar && (
              <a
                href={googleScholar.startsWith('http') ? googleScholar : `https://${googleScholar}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full hover:underline"
              >
                <GraduationCap className="w-3 h-3" /> Scholar
              </a>
            )}

            {githubUrl && (
              <a
                href={githubUrl.startsWith('http') ? githubUrl : `https://${githubUrl}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full hover:underline"
              >
                <GithubIcon className="w-3 h-3" /> Code
              </a>
            )}

            {personalWebsite && (
              <a
                href={personalWebsite.startsWith('http') ? personalWebsite : `https://${personalWebsite}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full hover:underline"
              >
                <LinkIcon className="w-3 h-3" /> Site
              </a>
            )}
          </div>
        </div>

        {/* Action CTAs */}
        <div className="flex sm:flex-col gap-2 w-full sm:w-auto shrink-0 pt-2 sm:pt-0">
          {isOwner ? (
            <Button
              variant={isEditing ? 'secondary' : 'primary'}
              size="md"
              onClick={() => setIsEditing(!isEditing)}
              className="gap-2 text-xs w-full"
            >
              {isEditing ? (
                <>
                  <X className="w-4 h-4" /> Cancel Edit
                </>
              ) : (
                <>
                  <Edit3 className="w-4 h-4" /> Edit Profile &amp; Bio
                </>
              )}
            </Button>
          ) : (
            <>
              {/* Follow / Unfollow Button */}
              <Button
                variant={isFollowing ? 'secondary' : 'primary'}
                size="md"
                onClick={handleToggleFollow}
                className="w-full gap-1.5 text-xs"
              >
                {isFollowing ? (
                  <>
                    <UserCheck className="w-4 h-4 text-emerald-500" /> Following
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" /> Follow
                  </>
                )}
              </Button>

              {/* Message Request Button */}
              <Link
                href={`/messages?to=${profile.id}&req=1`}
                className="flex-1 sm:flex-none"
              >
                <Button variant="secondary" size="md" className="w-full gap-1.5 text-xs">
                  <MessageSquare className="w-4 h-4 text-brand-500" /> Message Request
                </Button>
              </Link>

              {/* Coffee Chat Pitch */}
              <Link
                href={`/messages?to=${profile.id}&preset=coffee_chat`}
                className="flex-1 sm:flex-none"
              >
                <Button variant="ghost" size="sm" className="w-full gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                  <Coffee className="w-3.5 h-3.5 text-saffron-500" /> Request Coffee Chat
                </Button>
              </Link>

              {/* More options menu (Mute) */}
              <div className="relative">
                <button
                  onClick={() => setOptionsMenuOpen(!optionsMenuOpen)}
                  className="w-full py-1 text-center text-xs text-slate-400 hover:text-slate-600 flex items-center justify-center gap-1"
                >
                  <MoreHorizontal className="w-3.5 h-3.5" /> More
                </button>
                {optionsMenuOpen && (
                  <div className="absolute right-0 top-full mt-1 w-32 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg py-1 z-20">
                    <button
                      onClick={handleToggleMute}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      {isMuted ? (
                        <>
                          <Volume2 className="w-3.5 h-3.5 text-emerald-500" /> Unmute
                        </>
                      ) : (
                        <>
                          <VolumeX className="w-3.5 h-3.5 text-red-500" /> Mute @user
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Edit Form Modal / Panel ────────────────────────── */}
      {isEditing && (
        <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800 space-y-4 bg-slate-50/50 dark:bg-slate-950/40 p-4 rounded-xl">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
            <Edit3 className="w-4 h-4 text-brand-500" /> Customize Your Researcher Bio, Links &amp; Profile
          </h3>

          {/* Profile Picture Upload */}
          <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg flex items-center gap-4">
            <Avatar name={profile.full_name} src={avatarUrl} size="lg" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">Profile Picture</p>
              <p className="text-[11px] text-slate-500">JPG, PNG or GIF up to 5MB.</p>
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  isLoading={isUploadingAvatar}
                  className="text-xs gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" /> Upload Photo
                </Button>
                {avatarUrl && (
                  <button
                    type="button"
                    onClick={() => setAvatarUrl('')}
                    className="text-xs text-red-500 hover:underline"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Username & Collab Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Permanent Handle (@username)
              </label>
              <div className="relative">
                <AtSign className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  placeholder="e.g. gaurav_powar"
                  maxLength={24}
                  className="w-full text-xs pl-8 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Collaboration Status
              </label>
              <select
                value={collabStatus}
                onChange={(e) => setCollabStatus(e.target.value as CollabStatus)}
                className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-100"
              >
                <option value="open_to_collab">Open to Collaboration</option>
                <option value="offering_mentorship">Offering Mentorship</option>
                <option value="looking_for_coauthor">Looking for Co-Authors</option>
                <option value="busy">Currently Busy</option>
              </select>
            </div>
          </div>

          {/* Academic Links Section */}
          <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg space-y-3">
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <LinkIcon className="w-3.5 h-3.5 text-brand-500" /> External Research &amp; Lab Links
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-0.5">Lab Website</label>
                <input
                  type="text"
                  value={labWebsite}
                  onChange={(e) => setLabWebsite(e.target.value)}
                  placeholder="https://lab.iiserbpr.ac.in"
                  className="w-full text-xs px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-0.5">Google Scholar</label>
                <input
                  type="text"
                  value={googleScholar}
                  onChange={(e) => setGoogleScholar(e.target.value)}
                  placeholder="https://scholar.google.com/citations?user=..."
                  className="w-full text-xs px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-0.5">GitHub / GitLab</label>
                <input
                  type="text"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  placeholder="https://github.com/..."
                  className="w-full text-xs px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-0.5">Personal / Portfolio</label>
                <input
                  type="text"
                  value={personalWebsite}
                  onChange={(e) => setPersonalWebsite(e.target.value)}
                  placeholder="https://..."
                  className="w-full text-xs px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md"
                />
              </div>
            </div>
          </div>

          {/* Bio Textarea */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Custom Research Focus &amp; Bio
            </label>
            <textarea
              rows={4}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell fellow researchers about your lab focus, current projects, methodologies (e.g. CRISPR, DFT calculations, cryo-EM), and collaboration goals..."
              className="w-full text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 leading-relaxed"
            />
          </div>

          {/* Institution & Department */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Institution
              </label>
              <input
                type="text"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                placeholder="e.g. IISER Berhampur, IISc, IIT Delhi"
                className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Department
              </label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="e.g. Department of Biological Sciences"
                className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          {/* City / State */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              City, State
            </label>
            <input
              type="text"
              value={cityState}
              onChange={(e) => setCityState(e.target.value)}
              placeholder="e.g. Berhampur, Odisha or Bengaluru, Karnataka"
              className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-100"
            />
          </div>

          {/* Skills Offered & Needed */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Skills &amp; Expertise Offered (comma-separated)
              </label>
              <input
                type="text"
                value={skillsOfferedInput}
                onChange={(e) => setSkillsOfferedInput(e.target.value)}
                placeholder="e.g. Molecular Biology, Python, Genomics"
                className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Looking for Collaboration On (comma-separated)
              </label>
              <input
                type="text"
                value={skillsNeededInput}
                onChange={(e) => setSkillsNeededInput(e.target.value)}
                placeholder="e.g. Computational Modelling, Cryo-EM"
                className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          {/* Danger Zone: Delete Account */}
          <div className="pt-4 mt-2 border-t border-red-200 dark:border-red-900/50">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-red-50/50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/40 rounded-lg">
              <div>
                <p className="text-xs font-semibold text-red-600 dark:text-red-400">Permanently Delete Account</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Deletes your researcher profile, posts, comments, and messages permanently.
                </p>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleDeleteAccount}
                isLoading={isDeletingAccount}
                className="text-xs text-red-600 hover:text-red-700 border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/40 shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete Account
              </Button>
            </div>
          </div>

          {/* Save & Cancel Buttons */}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsEditing(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSave}
              isLoading={isSaving}
              className="gap-1.5"
            >
              <Check className="w-4 h-4" /> Save Bio &amp; Profile
            </Button>
          </div>
        </div>
      )}

      {/* ── Bio Display ────────────────────────────────────── */}
      <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between mb-1.5">
          <h2 className="text-xs uppercase font-semibold tracking-wider text-slate-400 dark:text-slate-500">
            Research Focus &amp; Bio
          </h2>
          {isOwner && !profile.bio && (
            <button
              onClick={() => setIsEditing(true)}
              className="text-[11px] text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
            >
              <Edit3 className="w-3 h-3" /> Add Bio
            </button>
          )}
        </div>
        {profile.bio ? (
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
            {profile.bio}
          </p>
        ) : (
          <p className="text-xs text-slate-400 italic">
            No bio provided yet. {isOwner ? 'Click "Edit Profile & Bio" above to share your research focus.' : ''}
          </p>
        )}
      </div>

      {/* ── Skills Offered & Needed Grid ────────────────────── */}
      <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <h2 className="text-xs uppercase font-semibold tracking-wider text-slate-400 dark:text-slate-500 mb-2">
            Skills Offered
          </h2>
          <div className="flex flex-wrap gap-1.5">
            {profile.skills_offered && profile.skills_offered.length > 0 ? (
              profile.skills_offered.map((skill) => (
                <Badge key={skill} variant="verified" className="text-xs py-1 px-2.5">
                  {skill}
                </Badge>
              ))
            ) : (
              <span className="text-xs text-slate-400 italic">None listed</span>
            )}
          </div>
        </div>

        <div>
          <h2 className="text-xs uppercase font-semibold tracking-wider text-slate-400 dark:text-slate-500 mb-2">
            Looking for Collaboration On
          </h2>
          <div className="flex flex-wrap gap-1.5">
            {profile.skills_needed && profile.skills_needed.length > 0 ? (
              profile.skills_needed.map((skill) => (
                <Badge key={skill} variant="collab" className="text-xs py-1 px-2.5">
                  {skill}
                </Badge>
              ))
            ) : (
              <span className="text-xs text-slate-400 italic">None listed</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
