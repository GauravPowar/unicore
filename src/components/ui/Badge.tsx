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

// Convenience: Verified Researcher badge
export function VerifiedBadge() {
  return (
    <Badge variant="verified">
      <svg className="w-3 h-3" viewBox="0 0 12 12" fill="currentColor">
        <path d="M6 0l1.5 2.5L10 2l-.5 3L12 6l-2.5 1.5L10 10l-3-.5L6 12l-1.5-2.5L2 10l.5-3L0 6l2.5-1.5L2 2l3 .5L6 0z" />
      </svg>
      Verified Researcher
    </Badge>
  );
}

