// ============================================================
// ForumsManagerModal – Personalize joined forums & custom order
// Client Component modal with drag/step reordering and join/leave
// ============================================================
'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  X,
  ChevronUp,
  ChevronDown,
  Check,
  Plus,
  SlidersHorizontal,
  RotateCcw,
  Sparkles,
  BookOpen,
  ArrowRight,
  LogOut,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { getForumIcon } from '@/lib/forumIcons';
import {
  type ForumPreferences,
  getForumPreferences,
  saveForumPreferences,
  toggleForumJoined,
  reorderJoinedForums,
  resetForumPreferences,
  organizeForums,
} from '@/lib/userForums';
import type { Forum } from '@/types';

interface ForumsManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  allForums: Forum[];
  userId?: string;
  userMetadataPrefs?: unknown;
}

export function ForumsManagerModal({
  isOpen,
  onClose,
  allForums,
  userId,
  userMetadataPrefs,
}: ForumsManagerModalProps) {
  const [prefs, setPrefs] = useState<ForumPreferences>(() =>
    getForumPreferences(userId, userMetadataPrefs)
  );

  // Sync preferences when modal opens or props change
  useEffect(() => {
    if (isOpen) {
      setPrefs(getForumPreferences(userId, userMetadataPrefs));
    }
  }, [isOpen, userId, userMetadataPrefs]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const { joined, unjoined } = organizeForums(allForums, prefs);

  const handleMoveUp = async (index: number) => {
    if (index <= 0) return;
    const currentJoinedSlugs = joined.map((f) => f.slug);
    const newOrder = [...currentJoinedSlugs];
    const temp = newOrder[index - 1];
    newOrder[index - 1] = newOrder[index];
    newOrder[index] = temp;

    // Combine with any unjoined slugs in the old order if present
    const updatedPrefs = await reorderJoinedForums(newOrder, userId, prefs);
    setPrefs(updatedPrefs);
  };

  const handleMoveDown = async (index: number) => {
    if (index >= joined.length - 1) return;
    const currentJoinedSlugs = joined.map((f) => f.slug);
    const newOrder = [...currentJoinedSlugs];
    const temp = newOrder[index + 1];
    newOrder[index + 1] = newOrder[index];
    newOrder[index] = temp;

    const updatedPrefs = await reorderJoinedForums(newOrder, userId, prefs);
    setPrefs(updatedPrefs);
  };

  const handleToggleJoin = async (slug: string) => {
    const updatedPrefs = await toggleForumJoined(slug, userId, prefs);
    setPrefs(updatedPrefs);
  };

  const handleReset = async () => {
    const defaults = await resetForumPreferences(userId);
    setPrefs(defaults);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-10 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand-500/10 dark:bg-brand-500/20 text-brand-600 dark:text-brand-400 flex items-center justify-center">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Personalize Your Forums
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Organize your sidebar navigation and customized research feed
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Section 1: Joined Forums with reordering */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Joined Forums
                </h3>
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300">
                  {joined.length}
                </span>
              </div>
              <span className="text-xs text-slate-400">
                Use ▲ / ▼ to reorder in your sidebar
              </span>
            </div>

            {joined.length === 0 ? (
              <div className="p-6 text-center rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/20">
                <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">
                  You haven&apos;t joined any forums yet.
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Browse available forums below to curate your interdisciplinary feed.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {joined.map((forum, index) => {
                  const Icon = getForumIcon(forum.slug);
                  const isFirst = index === 0;
                  const isLast = index === joined.length - 1;

                  return (
                    <div
                      key={forum.id}
                      className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-2xs"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1 mr-2">
                        {/* Order indicator */}
                        <span className="w-5 text-center text-xs font-semibold text-slate-400">
                          {index + 1}
                        </span>

                        <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700/60 flex items-center justify-center shrink-0 text-slate-700 dark:text-slate-200">
                          <Icon className="w-4 h-4" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm text-slate-900 dark:text-white truncate">
                              {forum.name}
                            </span>
                            <Badge variant="category" className="text-[10px] py-0 shrink-0">
                              {forum.category}
                            </Badge>
                          </div>
                          {forum.description && (
                            <p className="text-xs text-slate-400 truncate mt-0.5">
                              {forum.description}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Controls: Move Up, Move Down, Leave */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleMoveUp(index)}
                          disabled={isFirst}
                          title="Move up in order"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveDown(index)}
                          disabled={isLast}
                          title="Move down in order"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleJoin(forum.slug)}
                          className="ml-1 px-2.5 py-1 text-xs font-medium rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 border border-transparent hover:border-red-200 dark:hover:border-red-900/50 transition-colors flex items-center gap-1"
                          title="Leave this forum"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Leave</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 2: Explore & Join Other Forums */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Explore More Forums
              </h3>
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                {unjoined.length}
              </span>
            </div>

            {unjoined.length === 0 ? (
              <div className="p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-800/40 text-center text-xs text-emerald-700 dark:text-emerald-300">
                ✨ You are currently joined to all available research forums!
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2.5">
                {unjoined.map((forum) => {
                  const Icon = getForumIcon(forum.slug);

                  return (
                    <div
                      key={forum.id}
                      className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30 hover:border-slate-300 dark:hover:border-slate-700 transition-all"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1 mr-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-200/80 dark:bg-slate-700/80 flex items-center justify-center shrink-0 text-slate-600 dark:text-slate-300">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm text-slate-800 dark:text-slate-200 truncate">
                              {forum.name}
                            </span>
                            <Badge variant="category" className="text-[10px] py-0 shrink-0">
                              {forum.category}
                            </Badge>
                          </div>
                          {forum.description && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                              {forum.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleToggleJoin(forum.slug)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-brand-500 hover:bg-brand-600 text-white flex items-center gap-1.5 transition-colors shadow-2xs shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Join</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Default</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 transition-opacity"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
