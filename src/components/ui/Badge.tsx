// ============================================================
// Badge – small status/label indicator
// ============================================================
import { cn } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'verified' | 'collab' | 'post-type' | 'category';
  className?: string;
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
        variant === 'default' && 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300',
        variant === 'verified' && 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300',
        variant === 'collab' && 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
        variant === 'post-type' && 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300',
        variant === 'category' && 'bg-saffron-100 dark:bg-orange-900/40 text-saffron-700 dark:text-orange-300',
        className
      )}
    >
      {children}
    </span>
  );
}

// Convenience: Verified Researcher badge (Standard verification blue across X/Bluesky)
export function VerifiedBadge({ showText = false }: { showText?: boolean }) {
  return (
    <span
      className="inline-flex items-center gap-1 text-sky-500 shrink-0 select-none"
      title="Verified Indian Researcher"
    >
      <svg className="w-4 h-4 fill-sky-500 text-sky-500" viewBox="0 0 24 24">
        <path d="m8.6 22.5l-1.9-3.2l-3.6-.8l.35-3.7L1 12l2.45-2.8l-.35-3.7l3.6-.8l1.9-3.2L12 2.9l3.4-1.4l1.9 3.2l3.6.8l-.35 3.7L23 12l-2.45 2.8l.35 3.7l-3.6.8l-1.9 3.2l-3.4-1.4zm2.35-6.55L16.6 10.3l-1.4-1.45l-4.25 4.25l-2.15-2.1l-1.4 1.4z" />
      </svg>
      {showText && <span className="text-xs font-semibold text-sky-600 dark:text-sky-400">Verified</span>}
    </span>
  );
}

