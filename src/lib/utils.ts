// ============================================================
// ShodhConnect – Utility Functions
// ============================================================
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Merges Tailwind class names safely (handles conflicts). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Formats an ISO date string into a human-readable relative time or short date. */
export function formatDate(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;

  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

/** Returns the initials of a full name (up to 2 chars). */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join('');
}

/** Returns a consistent Tailwind background color class based on a string seed. */
export function getAvatarColor(seed: string): string {
  const colors = [
    'bg-violet-500',
    'bg-blue-500',
    'bg-emerald-500',
    'bg-orange-500',
    'bg-pink-500',
    'bg-teal-500',
    'bg-indigo-500',
    'bg-rose-500',
  ];
  let hash = 0;
  for (const ch of seed) hash = (hash * 31 + ch.charCodeAt(0)) % colors.length;
  return colors[Math.abs(hash)];
}

/** Maps a collab_status enum to a human-readable label. */
export const COLLAB_STATUS_LABELS: Record<string, string> = {
  open_to_collab: 'Open to Collaborate',
  offering_mentorship: 'Offering Mentorship',
  looking_for_coauthor: 'Looking for Co-Author',
  busy: 'Busy',
};

/** Maps a post_type enum to a display label and colour. */
export const POST_TYPE_CONFIG: Record<
  string,
  { label: string; color: string; icon: string }
> = {
  thought: { label: 'Thought', color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300', icon: '💭' },
  question: { label: 'Question', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300', icon: '❓' },
  visual_abstract: { label: 'Visual Abstract', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300', icon: '🎨' },
  collab_pitch: { label: 'Collab Pitch', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300', icon: '🤝' },
};
