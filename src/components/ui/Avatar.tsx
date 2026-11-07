// ============================================================
// Avatar – researcher profile picture with fallback initials
// ============================================================
'use client';

import { useState } from 'react';
import { getInitials, getAvatarColor, cn } from '@/lib/utils';

interface AvatarProps {
  name: string;
  src?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const SIZE_MAP = {
  sm: { container: 'w-8 h-8', text: 'text-xs' },
  md: { container: 'w-10 h-10', text: 'text-sm' },
  lg: { container: 'w-14 h-14', text: 'text-base' },
  xl: { container: 'w-20 h-20', text: 'text-xl' },
};

export function Avatar({ name, src, size = 'md', className }: AvatarProps) {
  const { container, text } = SIZE_MAP[size];
  const initials = getInitials(name);
  const colorClass = getAvatarColor(name);
  const [imageError, setImageError] = useState(false);

  if (src && !imageError) {
    return (
      <div className={cn('relative rounded-full overflow-hidden shrink-0 bg-slate-100 dark:bg-slate-800', container, className)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={name}
          className="w-full h-full object-cover"
          onError={() => setImageError(true)}
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'rounded-full shrink-0 flex items-center justify-center font-semibold text-white',
        container,
        text,
        colorClass,
        className
      )}
      title={name}
    >
      {initials}
    </div>
  );
}

