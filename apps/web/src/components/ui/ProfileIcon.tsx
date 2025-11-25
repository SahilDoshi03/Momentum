import Image from 'next/image';
import { cn } from '@/lib/utils';

interface ProfileIconProps {
  user: {
    fullName: string;
    initials: string;
    avatar?: string | null;
  };
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

export const ProfileIcon: React.FC<ProfileIconProps> = ({
  user,
  size = 'md',
  className,
}) => {
  const sizeClasses = {
    xs: 'h-5 w-5 text-[10px]',
    sm: 'h-6 w-6 text-xs',
    md: 'h-8 w-8 text-sm',
    lg: 'h-12 w-12 text-lg',
  };

  if (user.avatar) {
    return (
      <div className={cn('relative rounded-full overflow-hidden', sizeClasses[size], className)}>
        <Image
          src={user.avatar}
          alt={user.fullName}
          fill
          className="object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full bg-[var(--primary)] text-white font-medium',
        sizeClasses[size],
        className
      )}
    >
      {user.initials}
    </div>
  );
};
