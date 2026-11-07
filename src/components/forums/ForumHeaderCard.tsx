// ============================================================
// ForumHeaderCard – Header with interactive Join/Leave CTA
// Client Component rendered on /forums/[slug]
// ============================================================
'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/Badge';
import { getForumIcon } from '@/lib/forumIcons';
import { useAuth } from '@/components/providers/AuthProvider';
import {
  getForumPreferences,
  toggleForumJoined,
  FORUMS_UPDATED_EVENT,
  type ForumPreferences,
} from '@/lib/userForums';
import type { Forum } from '@/types';
import { Check, Plus, LogOut } from 'lucide-react';

interface ForumHeaderCardProps {
  forum: Forum;
}

export function ForumHeaderCard({ forum }: ForumHeaderCardProps) {
  const { user } = useAuth();
  const [prefs, setPrefs] = useState<ForumPreferences>(() =>
    getForumPreferences(user?.id)
  );
  const [isHovered, setIsHovered] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<ForumPreferences>;
      if (customEvent.detail) {
        setPrefs(customEvent.detail);
      } else {
        setPrefs(getForumPreferences(user?.id));
      }
    };

    setPrefs(getForumPreferences(user?.id));
    window.addEventListener(FORUMS_UPDATED_EVENT, handleUpdate);
    return () => window.removeEventListener(FORUMS_UPDATED_EVENT, handleUpdate);
  }, [user?.id]);

  const isJoined = prefs.joinedSlugs.includes(forum.slug);
  const Icon = getForumIcon(forum.slug);

  const handleToggle = async () => {
    setIsUpdating(true);
    try {
      const updated = await toggleForumJoined(forum.slug, user?.id, prefs);
      setPrefs(updated);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs transition-all">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-brand-500/10 dark:bg-brand-500/20 text-brand-600 dark:text-brand-400 flex items-center justify-center shrink-0 mt-0.5">
            <Icon className="w-5 h-5" />
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="category" className="text-[11px]">
                {forum.category}
              </Badge>
              <span className="text-xs text-slate-400">· Official Forum</span>
            </div>

            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              {forum.name}
            </h1>

            {forum.description && (
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-xl">
                {forum.description}
              </p>
            )}
          </div>
        </div>

        {/* Join / Leave Button */}
        <div className="shrink-0 self-start sm:self-center">
          <button
            type="button"
            onClick={handleToggle}
            disabled={isUpdating}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              isJoined
                ? isHovered
                  ? 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50'
                  : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60'
                : 'bg-brand-500 hover:bg-brand-600 text-white shadow-xs'
            }`}
          >
            {isJoined ? (
              isHovered ? (
                <>
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Leave Forum</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Joined</span>
                </>
              )
            ) : (
              <>
                <Plus className="w-3.5 h-3.5" />
                <span>Join Forum</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
