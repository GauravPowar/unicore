// ============================================================
// ProfileHeader – Researcher profile header with custom bio editor
// Client Component
// ============================================================
'use client';

import { useState } from 'react';
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
} from 'lucide-react';

interface ProfileHeaderProps {
  initialProfile: Profile;
}

export function ProfileHeader({ initialProfile }: ProfileHeaderProps) {
  const router = useRouter();
  const { user } = useAuth();
  const isOwner = user?.id === initialProfile.id;

  const [profile, setProfile] = useState<Profile>(initialProfile);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Edit form state
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

    const updates = {
      bio: bio.trim() || null,
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
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (!error) {
        setProfile((prev) => ({
          ...prev,
          ...updates,
        }));
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

  return (
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
              <Link
                href={`/messages?to=${profile.id}&preset=coffee_chat`}
                className="flex-1 sm:flex-none"
              >
                <Button variant="primary" size="md" className="w-full gap-2 text-xs">
                  <Coffee className="w-4 h-4 text-saffron-300" /> Coffee Chat
                </Button>
              </Link>
              <Link href={`/messages?to=${profile.id}`} className="flex-1 sm:flex-none">
                <Button variant="secondary" size="md" className="w-full gap-2 text-xs">
                  <MessageSquare className="w-4 h-4" /> Message
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>

      {/* ── Edit Form Modal / Panel ────────────────────────── */}
      {isEditing && (
        <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800 space-y-4 bg-slate-50/50 dark:bg-slate-950/40 p-4 rounded-xl">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
            <Edit3 className="w-4 h-4 text-brand-500" /> Customize Your Researcher Bio &amp; Profile
          </h3>

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

          {/* City / State & Collab Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

          {/* Buttons */}
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
