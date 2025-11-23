import React from 'react';
import { cn } from '@/lib/utils';

interface ProfileIconProps {
  user: {
    fullName: string;
    initials: string;
    avatar?: string | null;
  };
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const ProfileIcon: React.FC<ProfileIconProps> = ({
  user,
  size = 'md',
  className,
}) => {
  const sizeClasses = {
    sm: 'h-6 w-6 text-xs',
    md: 'h-8 w-8 text-sm',
    lg: 'h-12 w-12 text-lg',
  };

  if (user.avatar) {
    return (
      <img
        src={user.avatar}
        alt={user.fullName}
        className={cn(
          'rounded-full object-cover',
          sizeClasses[size],
          className
        )}
      />
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
