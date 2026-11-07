// ============================================================
// ResearchSetu – Forum Personalization & Preference Management
// Allows users to join/leave forums and customize their order
// ============================================================
import { OFFICIAL_FORUMS } from '@/lib/constants';
import { createClient } from '@/lib/supabase/client';
import type { Forum } from '@/types';

export interface ForumPreferences {
  joinedSlugs: string[];
  order: string[];
}

export const FORUMS_UPDATED_EVENT = 'researchsetu:forums_updated';

// Canonical default slugs (excluding official broadcast channel)
export const DEFAULT_FORUM_SLUGS: string[] = OFFICIAL_FORUMS
  .filter((f) => f.slug !== 'team-updates' && f.id !== '77777777-7777-7777-7777-777777777777')
  .map((f) => f.slug);

export function getDefaultForumPreferences(): ForumPreferences {
  return {
    joinedSlugs: [...DEFAULT_FORUM_SLUGS],
    order: [...DEFAULT_FORUM_SLUGS],
  };
}

const STORAGE_PREFIX = 'researchsetu_forum_prefs_';

/**
 * Retrieve user's forum preferences from user_metadata or localStorage
 */
export function getForumPreferences(userId?: string, metadataPrefs?: unknown): ForumPreferences {
  // 1. If metadataPrefs passed from Supabase Auth profile
  if (
    metadataPrefs &&
    typeof metadataPrefs === 'object' &&
    'joinedSlugs' in metadataPrefs &&
    'order' in metadataPrefs
  ) {
    const p = metadataPrefs as ForumPreferences;
    if (Array.isArray(p.joinedSlugs) && Array.isArray(p.order)) {
      return {
        joinedSlugs: p.joinedSlugs,
        order: p.order,
      };
    }
  }

  // 2. Try localStorage
  if (typeof window !== 'undefined') {
    try {
      const key = STORAGE_PREFIX + (userId || 'guest');
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.joinedSlugs) && Array.isArray(parsed.order)) {
          return {
            joinedSlugs: parsed.joinedSlugs,
            order: parsed.order,
          };
        }
      }
    } catch {
      // Fallback
    }
  }

  return getDefaultForumPreferences();
}

/**
 * Persist preferences to localStorage & Supabase user_metadata if signed in
 */
export async function saveForumPreferences(
  prefs: ForumPreferences,
  userId?: string
): Promise<void> {
  if (typeof window !== 'undefined') {
    try {
      const key = STORAGE_PREFIX + (userId || 'guest');
      localStorage.setItem(key, JSON.stringify(prefs));
      window.dispatchEvent(
        new CustomEvent(FORUMS_UPDATED_EVENT, { detail: prefs })
      );
    } catch {
      // Ignore storage errors
    }
  }

  // Sync with Supabase Auth user_metadata if logged in
  if (userId) {
    try {
      const supabase = createClient();
      await supabase.auth.updateUser({
        data: {
          forum_preferences: prefs,
        },
      });
    } catch (err) {
      console.warn('Failed to sync forum preferences to Supabase:', err);
    }
  }
}

/**
 * Check if a specific forum slug is currently joined
 */
export function isForumJoined(slug: string, prefs: ForumPreferences): boolean {
  return prefs.joinedSlugs.includes(slug);
}

/**
 * Toggle join/leave state for a specific forum slug
 */
export async function toggleForumJoined(
  slug: string,
  userId?: string,
  currentPrefs?: ForumPreferences
): Promise<ForumPreferences> {
  const prefs = currentPrefs || getForumPreferences(userId);
  const isJoined = prefs.joinedSlugs.includes(slug);

  let newJoinedSlugs: string[];
  let newOrder = [...prefs.order];

  if (isJoined) {
    newJoinedSlugs = prefs.joinedSlugs.filter((s) => s !== slug);
  } else {
    newJoinedSlugs = [...prefs.joinedSlugs, slug];
    if (!newOrder.includes(slug)) {
      newOrder.push(slug);
    }
  }

  const updatedPrefs: ForumPreferences = {
    joinedSlugs: newJoinedSlugs,
    order: newOrder,
  };

  await saveForumPreferences(updatedPrefs, userId);
  return updatedPrefs;
}

/**
 * Reorder the joined forums list
 */
export async function reorderJoinedForums(
  newOrder: string[],
  userId?: string,
  currentPrefs?: ForumPreferences
): Promise<ForumPreferences> {
  const prefs = currentPrefs || getForumPreferences(userId);
  const updatedPrefs: ForumPreferences = {
    joinedSlugs: prefs.joinedSlugs,
    order: newOrder,
  };

  await saveForumPreferences(updatedPrefs, userId);
  return updatedPrefs;
}

/**
 * Reset user preferences back to default
 */
export async function resetForumPreferences(userId?: string): Promise<ForumPreferences> {
  const defaults = getDefaultForumPreferences();
  await saveForumPreferences(defaults, userId);
  return defaults;
}

/**
 * Organize and separate forums into Joined (sorted by user's custom order) and Unjoined
 */
export function organizeForums(
  allForums: Forum[],
  prefs: ForumPreferences
): { joined: Forum[]; unjoined: Forum[] } {
  // Exclude broadcast forum from regular categorization
  const eligible = allForums.filter(
    (f) => f.slug !== 'team-updates' && f.id !== '77777777-7777-7777-7777-777777777777'
  );

  const joinedMap = new Map<string, Forum>();
  const unjoined: Forum[] = [];

  for (const f of eligible) {
    if (prefs.joinedSlugs.includes(f.slug)) {
      joinedMap.set(f.slug, f);
    } else {
      unjoined.push(f);
    }
  }

  // Sort joined according to prefs.order
  const joined: Forum[] = [];
  for (const slug of prefs.order) {
    const f = joinedMap.get(slug);
    if (f) {
      joined.push(f);
      joinedMap.delete(slug);
    }
  }

  // Any remaining joined forums not in prefs.order
  joinedMap.forEach((f) => {
    joined.push(f);
  });

  return { joined, unjoined };
}

