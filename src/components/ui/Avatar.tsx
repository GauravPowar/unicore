// ============================================================
// Avatar – researcher profile picture with fallback initials
// ============================================================
import Image from 'next/image';
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

  if (src) {
    return (
      <div className={cn('relative rounded-full overflow-hidden shrink-0', container, className)}>
        <Image
          src={src}
          alt={name}
          fill
          className="object-cover"
          sizes="80px"
          unoptimized={src.includes('dicebear.com')}
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

