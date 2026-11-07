// ============================================================
// ResearcherCard – directory grid card
// ============================================================
import Link from 'next/link';
import { Avatar } from '@/components/ui/Avatar';
import { Badge, VerifiedBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { COLLAB_STATUS_LABELS } from '@/lib/utils';
import { MapPin, ExternalLink, Sparkles } from 'lucide-react';
import type { Profile } from '@/types';

interface ResearcherCardProps {
  profile: Profile;
}

const COLLAB_STATUS_COLORS: Record<string, string> = {
  open_to_collab: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  offering_mentorship: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  looking_for_coauthor: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  busy: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
};

export function ResearcherCard({ profile }: ResearcherCardProps) {
  const profileHref = profile.username ? `/u/${profile.username}` : `/profile/${profile.id}`;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col gap-3.5 hover:border-brand-300 dark:hover:border-brand-700 transition-all shadow-xs">
      {/* Top row */}
      <div className="flex items-start gap-3.5">
        <Link href={profileHref} className="hover:opacity-90 transition-opacity">
          <Avatar name={profile.full_name} src={profile.avatar_url} size="lg" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Link href={profileHref} className="font-semibold text-slate-900 dark:text-white text-base hover:underline">
              {profile.full_name}
            </Link>
            {profile.is_verified_researcher && <VerifiedBadge />}
            {profile.username && (
              <span className="text-xs font-mono text-brand-600 dark:text-brand-400">
                @{profile.username}
              </span>
            )}
          </div>
          {profile.institution && (
            <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mt-0.5 truncate">
              {profile.institution}
            </p>
          )}
          {profile.department && (
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
              {profile.department}
            </p>
          )}
          {profile.city_state && (
            <p className="flex items-center gap-1 text-[11px] text-slate-400 mt-1">
              <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
              {profile.city_state}
            </p>
          )}
        </div>
      </div>

      {/* Collab status badge */}
      <div>
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${COLLAB_STATUS_COLORS[profile.collab_status]}`}
        >
          <Sparkles className="w-3 h-3" />
          {COLLAB_STATUS_LABELS[profile.collab_status]}
        </span>
      </div>

      {/* Bio */}
      {profile.bio && (
        <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed">
          {profile.bio}
        </p>
      )}

      {/* Skills offered */}
      {profile.skills_offered.length > 0 && (
        <div>
          <p className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 dark:text-slate-500 mb-1.5">
            Skills Offered
          </p>
          <div className="flex flex-wrap gap-1.5">
            {profile.skills_offered.slice(0, 4).map((skill) => (
              <Badge key={skill} variant="verified" className="text-[11px]">
                {skill}
              </Badge>
            ))}
            {profile.skills_offered.length > 4 && (
              <Badge variant="default" className="text-[11px]">
                +{profile.skills_offered.length - 4} more
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* Skills needed */}
      {profile.skills_needed.length > 0 && (
        <div>
          <p className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 dark:text-slate-500 mb-1.5">
            Looking For / Needs
          </p>
          <div className="flex flex-wrap gap-1.5">
            {profile.skills_needed.slice(0, 4).map((skill) => (
              <Badge key={skill} variant="collab" className="text-[11px]">
                {skill}
              </Badge>
            ))}
            {profile.skills_needed.length > 4 && (
              <Badge variant="default" className="text-[11px]">
                +{profile.skills_needed.length - 4} more
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* ORCID badge & link */}
      {profile.orcid_id && (
        <div className="pt-1">
          <a
            href={`https://orcid.org/${profile.orcid_id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-brand-600 dark:text-brand-400 hover:underline font-mono bg-brand-50/50 dark:bg-brand-900/20 px-2 py-1 rounded"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            ORCID: {profile.orcid_id}
            <ExternalLink className="w-3 h-3 ml-0.5 opacity-70" />
          </a>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 mt-auto pt-3 border-t border-slate-100 dark:border-slate-800">
        <Link
          href={`/messages?to=${profile.id}&preset=coffee_chat`}
          className="flex-1"
        >
          <Button variant="primary" size="sm" className="w-full gap-1.5 text-xs">
            ☕ Request Coffee Chat
          </Button>
        </Link>
        <Link
          href={profileHref}
          className="flex-1"
        >
          <Button variant="secondary" size="sm" className="w-full gap-1.5 text-xs">
            View Profile
          </Button>
        </Link>
      </div>
    </div>
  );
}
