// ============================================================
// ResearcherCard – directory grid card
// ============================================================
import { Avatar } from '@/components/ui/Avatar';
import { Badge, VerifiedBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { COLLAB_STATUS_LABELS } from '@/lib/utils';
import { MapPin, MessageSquare, ExternalLink } from 'lucide-react';
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
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col gap-3 hover:border-brand-300 dark:hover:border-brand-700 transition-colors">
      {/* Top row */}
      <div className="flex items-start gap-3">
        <Avatar name={profile.full_name} src={profile.avatar_url} size="lg" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-semibold text-slate-900 dark:text-white text-sm">
              {profile.full_name}
            </span>
            {profile.is_verified_researcher && <VerifiedBadge />}
          </div>
          {profile.institution && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
              {profile.institution}
            </p>
          )}
          {profile.department && (
            <p className="text-xs text-slate-400 dark:text-slate-500 truncate">
              {profile.department}
            </p>
          )}
          {profile.city_state && (
            <p className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
              <MapPin className="w-3 h-3" />
              {profile.city_state}
            </p>
          )}
        </div>
      </div>

      {/* Collab status */}
      <span
        className={`inline-flex self-start items-center px-2 py-0.5 rounded-full text-xs font-medium ${COLLAB_STATUS_COLORS[profile.collab_status]}`}
      >
        {COLLAB_STATUS_LABELS[profile.collab_status]}
      </span>

      {/* Bio */}
      {profile.bio && (
        <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed">
          {profile.bio}
        </p>
      )}

      {/* Skills offered */}
      {profile.skills_offered.length > 0 && (
        <div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Offers</p>
          <div className="flex flex-wrap gap-1">
            {profile.skills_offered.slice(0, 4).map((skill) => (
              <Badge key={skill} variant="verified" className="text-xs">
                {skill}
              </Badge>
            ))}
            {profile.skills_offered.length > 4 && (
              <Badge variant="default" className="text-xs">
                +{profile.skills_offered.length - 4} more
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* Skills needed */}
      {profile.skills_needed.length > 0 && (
        <div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Needs</p>
          <div className="flex flex-wrap gap-1">
            {profile.skills_needed.slice(0, 4).map((skill) => (
              <Badge key={skill} variant="collab" className="text-xs">
                {skill}
              </Badge>
            ))}
            {profile.skills_needed.length > 4 && (
              <Badge variant="default" className="text-xs">
                +{profile.skills_needed.length - 4} more
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* ORCID */}
      {profile.orcid_id && (
        <a
          href={`https://orcid.org/${profile.orcid_id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs text-brand-600 dark:text-brand-400 hover:underline"
        >
          <ExternalLink className="w-3 h-3" />
          ORCID: {profile.orcid_id}
        </a>
      )}

      {/* Actions */}
      <div className="flex gap-2 mt-auto pt-2 border-t border-slate-100 dark:border-slate-800">
        <Button variant="primary" size="sm" className="flex-1 gap-1.5">
          <MessageSquare className="w-3.5 h-3.5" />
          Coffee Chat
        </Button>
        <Button variant="secondary" size="sm" className="flex-1">
          View Profile
        </Button>
      </div>
    </div>
  );
}
