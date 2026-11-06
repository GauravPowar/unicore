// ============================================================
// DirectoryClient – searchable, filterable researcher grid
// Client Component
// ============================================================
'use client';

import { useState, useMemo, useEffect } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import type { Profile, DirectoryFilters, CollabStatus } from '@/types';
import { ResearcherCard } from '@/components/directory/ResearcherCard';
import { COLLAB_STATUS_LABELS } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';

interface DirectoryClientProps {
  profiles: Profile[];
}

const EMPTY_FILTERS: DirectoryFilters = {
  search: '',
  institution: '',
  collab_status: '',
  skill_offered: '',
  skill_needed: '',
};

export function DirectoryClient({ profiles }: DirectoryClientProps) {
  const [profileList, setProfileList] = useState<Profile[]>(profiles);
  const [filters, setFilters] = useState<DirectoryFilters>(EMPTY_FILTERS);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const fetchLiveProfiles = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data) {
          setProfileList(data as Profile[]);
        }
      } catch (err) {
        console.warn('Could not fetch live profiles:', err);
      }
    };

    fetchLiveProfiles();
  }, []);

  // Collect unique values for filter dropdowns
  const institutions = useMemo(
    () => Array.from(new Set(profileList.map((p) => p.institution).filter(Boolean))) as string[],
    [profileList]
  );

  const allSkillsOffered = useMemo(
    () => Array.from(new Set(profileList.flatMap((p) => p.skills_offered))).sort(),
    [profileList]
  );

  const allSkillsNeeded = useMemo(
    () => Array.from(new Set(profileList.flatMap((p) => p.skills_needed))).sort(),
    [profileList]
  );

  // Filter logic
  const filtered = useMemo(() => {
    const q = filters.search.toLowerCase();
    return profileList.filter((p) => {
      if (
        q &&
        !p.full_name.toLowerCase().includes(q) &&
        !p.institution?.toLowerCase().includes(q) &&
        !p.department?.toLowerCase().includes(q) &&
        !p.bio?.toLowerCase().includes(q) &&
        !p.skills_offered.some((s) => s.toLowerCase().includes(q)) &&
        !p.skills_needed.some((s) => s.toLowerCase().includes(q))
      )
        return false;

      if (filters.institution && p.institution !== filters.institution) return false;
      if (filters.collab_status && p.collab_status !== filters.collab_status) return false;
      if (filters.skill_offered && !p.skills_offered.includes(filters.skill_offered))
        return false;
      if (filters.skill_needed && !p.skills_needed.includes(filters.skill_needed))
        return false;

      return true;
    });
  }, [profileList, filters]);

  const hasActiveFilters = Object.values(filters).some(Boolean);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Researcher Directory</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {filtered.length} researcher{filtered.length !== 1 ? 's' : ''} found
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className="gap-2"
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filters
          {hasActiveFilters && (
            <span className="w-5 h-5 rounded-full bg-brand-500 text-white text-xs flex items-center justify-center">
              {Object.values(filters).filter(Boolean).length}
            </span>
          )}
        </Button>
      </div>

      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search by name, institution, skill, or keyword…"
          value={filters.search}
          onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
          className="w-full pl-10 pr-4 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Institution */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Institution</label>
            <select
              value={filters.institution}
              onChange={(e) => setFilters((f) => ({ ...f, institution: e.target.value }))}
              className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">All institutions</option>
              {institutions.map((inst) => (
                <option key={inst} value={inst}>{inst}</option>
              ))}
            </select>
          </div>

          {/* Collab status */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Collaboration Status</label>
            <select
              value={filters.collab_status}
              onChange={(e) =>
                setFilters((f) => ({ ...f, collab_status: e.target.value as CollabStatus | '' }))
              }
              className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">Any status</option>
              {Object.entries(COLLAB_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          {/* Skills offered */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Skills Offered</label>
            <select
              value={filters.skill_offered}
              onChange={(e) => setFilters((f) => ({ ...f, skill_offered: e.target.value }))}
              className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">Any skill offered</option>
              {allSkillsOffered.map((skill) => (
                <option key={skill} value={skill}>{skill}</option>
              ))}
            </select>
          </div>

          {/* Skills needed */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Skills Needed</label>
            <select
              value={filters.skill_needed}
              onChange={(e) => setFilters((f) => ({ ...f, skill_needed: e.target.value }))}
              className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">Any skill needed</option>
              {allSkillsNeeded.map((skill) => (
                <option key={skill} value={skill}>{skill}</option>
              ))}
            </select>
          </div>

          {/* Clear */}
          {hasActiveFilters && (
            <div className="sm:col-span-2 flex justify-end">
              <button
                onClick={() => setFilters(EMPTY_FILTERS)}
                className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600 transition-colors"
              >
                <X className="w-3 h-3" />
                Clear all filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* Researcher grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400 dark:text-slate-500">
          <p className="text-lg mb-1">No researchers match your filters.</p>
          <button
            onClick={() => setFilters(EMPTY_FILTERS)}
            className="text-sm text-brand-500 hover:underline"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((profile) => (
            <ResearcherCard key={profile.id} profile={profile} />
          ))}
        </div>
      )}
    </div>
  );
}

