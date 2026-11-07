// ============================================================
// DirectoryClient – Searchable, Filterable Researcher Grid
// Features case-insensitive institution search & grouping by email domain
// ============================================================
'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  Search,
  SlidersHorizontal,
  X,
  Building,
  LayoutGrid,
  Layers,
  Sparkles,
} from 'lucide-react';
import type { Profile, DirectoryFilters, CollabStatus } from '@/types';
import { ResearcherCard } from '@/components/directory/ResearcherCard';
import { COLLAB_STATUS_LABELS } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

interface DirectoryClientProps {
  profiles: Profile[];
}

const EMPTY_FILTERS: DirectoryFilters = {
  search: '',
  institution: '',
  email_domain: '',
  collab_status: '',
  skill_offered: '',
  skill_needed: '',
};

export function DirectoryClient({ profiles }: DirectoryClientProps) {
  const [profileList, setProfileList] = useState<Profile[]>(profiles);
  const [filters, setFilters] = useState<DirectoryFilters>(EMPTY_FILTERS);
  const [showFilters, setShowFilters] = useState(false);
  const [groupByDomain, setGroupByDomain] = useState(false);

  // Sync latest enriched profiles from API
  useEffect(() => {
    fetch('/api/directory')
      .then((r) => r.json())
      .then((data) => {
        if (data.profiles && Array.isArray(data.profiles) && data.profiles.length > 0) {
          setProfileList(data.profiles);
        }
      })
      .catch((err) => console.warn('Could not refresh directory profiles:', err));
  }, []);

  // Collect unique institutions normalized case-insensitively
  const institutions = useMemo(() => {
    const map = new Map<string, string>(); // lowerKey -> canonical display name
    profileList.forEach((p) => {
      const inst = p.institution?.trim();
      if (!inst) return;
      const lower = inst.toLowerCase();
      if (!map.has(lower)) {
        map.set(lower, inst);
      }
    });
    return Array.from(map.values()).sort((a, b) => a.localeCompare(b));
  }, [profileList]);

  // Collect unique institutional email domains
  const emailDomains = useMemo(() => {
    const set = new Set<string>();
    profileList.forEach((p) => {
      if (p.email_domain) {
        set.add(p.email_domain.toLowerCase().trim());
      }
    });
    return Array.from(set).sort();
  }, [profileList]);

  const allSkillsOffered = useMemo(
    () => Array.from(new Set(profileList.flatMap((p) => p.skills_offered || []))).sort(),
    [profileList]
  );

  const allSkillsNeeded = useMemo(
    () => Array.from(new Set(profileList.flatMap((p) => p.skills_needed || []))).sort(),
    [profileList]
  );

  // Case-insensitive filtering logic
  const filtered = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    const instFilter = filters.institution.trim().toLowerCase();
    const domainFilter = filters.email_domain?.trim().toLowerCase();

    return profileList.filter((p) => {
      if (q) {
        const matchesName = p.full_name.toLowerCase().includes(q);
        const matchesInst = p.institution?.toLowerCase().includes(q);
        const matchesDept = p.department?.toLowerCase().includes(q);
        const matchesDomain = p.email_domain?.toLowerCase().includes(q);
        const matchesUsername = p.username?.toLowerCase().includes(q);
        const matchesBio = p.bio?.toLowerCase().includes(q);
        const matchesSkillsOffered = p.skills_offered?.some((s) => s.toLowerCase().includes(q));
        const matchesSkillsNeeded = p.skills_needed?.some((s) => s.toLowerCase().includes(q));

        if (
          !matchesName &&
          !matchesInst &&
          !matchesDept &&
          !matchesDomain &&
          !matchesUsername &&
          !matchesBio &&
          !matchesSkillsOffered &&
          !matchesSkillsNeeded
        ) {
          return false;
        }
      }

      // Case-insensitive institution matching
      if (instFilter && p.institution?.trim().toLowerCase() !== instFilter) {
        return false;
      }

      // Email domain matching
      if (domainFilter && p.email_domain?.trim().toLowerCase() !== domainFilter) {
        return false;
      }

      if (filters.collab_status && p.collab_status !== filters.collab_status) return false;
      if (filters.skill_offered && !p.skills_offered?.includes(filters.skill_offered)) return false;
      if (filters.skill_needed && !p.skills_needed?.includes(filters.skill_needed)) return false;

      return true;
    });
  }, [profileList, filters]);

  // Group filtered researchers by email domain / institution
  const groupedResearchers = useMemo(() => {
    if (!groupByDomain) return [];

    const map = new Map<
      string,
      { key: string; title: string; domain?: string | null; profiles: Profile[] }
    >();

    filtered.forEach((p) => {
      const domainKey = p.email_domain?.toLowerCase().trim();
      const instName = p.institution?.trim();

      // Key: domain if available, else institution, else 'other'
      const key = domainKey || (instName ? instName.toLowerCase() : 'other');
      const title = instName || (domainKey ? domainKey : 'Other Affiliations');

      if (!map.has(key)) {
        map.set(key, {
          key,
          title,
          domain: domainKey || null,
          profiles: [],
        });
      }

      map.get(key)!.profiles.push(p);
    });

    return Array.from(map.values()).sort((a, b) => b.profiles.length - a.profiles.length);
  }, [filtered, groupByDomain]);

  const hasActiveFilters = Object.values(filters).some(Boolean);

  return (
    <div className="space-y-5">
      {/* Header & View Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Researcher Directory</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {filtered.length} researcher{filtered.length !== 1 ? 's' : ''} found
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Group by Domain / Institution toggle */}
          <Button
            variant={groupByDomain ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setGroupByDomain(!groupByDomain)}
            className="gap-1.5 text-xs"
            title="Toggle grouping researchers by institutional email domain"
          >
            {groupByDomain ? (
              <>
                <LayoutGrid className="w-3.5 h-3.5" /> Grid View
              </>
            ) : (
              <>
                <Layers className="w-3.5 h-3.5" /> Group by Domain
              </>
            )}
          </Button>

          {/* Filter toggle */}
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="gap-2 text-xs"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Filters
            {hasActiveFilters && (
              <span className="w-4 h-4 rounded-full bg-brand-500 text-white text-[10px] flex items-center justify-center">
                {Object.values(filters).filter(Boolean).length}
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search by researcher name, institution, @handle, @email domain, or skill…"
          value={filters.search}
          onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
          className="w-full pl-10 pr-4 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-2xs"
        />
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 shadow-sm">
          {/* Institution (Case-Insensitive) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
              <Building className="w-3.5 h-3.5 text-brand-500" /> Institution (Case-Insensitive)
            </label>
            <select
              value={filters.institution}
              onChange={(e) => setFilters((f) => ({ ...f, institution: e.target.value }))}
              className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">All Institutions</option>
              {institutions.map((inst) => (
                <option key={inst} value={inst}>
                  {inst}
                </option>
              ))}
            </select>
          </div>

          {/* Institutional Email Domain */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-saffron-500" /> Email Domain (@domain)
            </label>
            <select
              value={filters.email_domain || ''}
              onChange={(e) => setFilters((f) => ({ ...f, email_domain: e.target.value }))}
              className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
            >
              <option value="">All Domains</option>
              {emailDomains.map((domain) => (
                <option key={domain} value={domain}>
                  @{domain}
                </option>
              ))}
            </select>
          </div>

          {/* Collab status */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Collaboration Status
            </label>
            <select
              value={filters.collab_status}
              onChange={(e) =>
                setFilters((f) => ({ ...f, collab_status: e.target.value as CollabStatus | '' }))
              }
              className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">Any Status</option>
              {Object.entries(COLLAB_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Skills offered */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Skills Offered
            </label>
            <select
              value={filters.skill_offered}
              onChange={(e) => setFilters((f) => ({ ...f, skill_offered: e.target.value }))}
              className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">Any Skill Offered</option>
              {allSkillsOffered.map((skill) => (
                <option key={skill} value={skill}>
                  {skill}
                </option>
              ))}
            </select>
          </div>

          {/* Skills needed */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Skills Needed
            </label>
            <select
              value={filters.skill_needed}
              onChange={(e) => setFilters((f) => ({ ...f, skill_needed: e.target.value }))}
              className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">Any Skill Needed</option>
              {allSkillsNeeded.map((skill) => (
                <option key={skill} value={skill}>
                  {skill}
                </option>
              ))}
            </select>
          </div>

          {/* Clear button */}
          {hasActiveFilters && (
            <div className="sm:col-span-2 lg:col-span-3 flex justify-end pt-1">
              <button
                onClick={() => setFilters(EMPTY_FILTERS)}
                className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-600 transition-colors font-medium"
              >
                <X className="w-3.5 h-3.5" />
                Clear All Filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* Researcher listing */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-slate-400 dark:text-slate-500">
          <p className="text-base font-semibold mb-1">No researchers match your filter criteria.</p>
          <p className="text-xs mb-3">Try adjusting your search query or reset the filters.</p>
          <button
            onClick={() => setFilters(EMPTY_FILTERS)}
            className="text-xs font-medium text-brand-600 dark:text-brand-400 hover:underline"
          >
            Clear all filters
          </button>
        </div>
      ) : groupByDomain ? (
        /* Grouped by Institutional Email Domain / Institution */
        <div className="space-y-6">
          {groupedResearchers.map((group) => (
            <div
              key={group.key}
              className="bg-white/60 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5 space-y-4"
            >
              {/* Group Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-200/60 dark:border-slate-800/60">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-brand-500/10 text-brand-500 flex items-center justify-center shrink-0">
                    <Building className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 flex-wrap">
                      <span>{group.title}</span>
                      {group.domain && (
                        <span className="text-xs font-mono font-normal text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/60 px-2 py-0.5 rounded-md border border-brand-200/60 dark:border-brand-800/40">
                          @{group.domain}
                        </span>
                      )}
                    </h2>
                  </div>
                </div>

                <span className="text-xs font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full shrink-0">
                  {group.profiles.length} researcher{group.profiles.length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Group Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {group.profiles.map((profile) => (
                  <ResearcherCard key={profile.id} profile={profile} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Standard Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((profile) => (
            <ResearcherCard key={profile.id} profile={profile} />
          ))}
        </div>
      )}
    </div>
  );
}
