import React from 'react';
import { cn } from '@/lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  isDragging?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  onClick,
  isDragging = false,
}) => {
  return (
    <div
      className={cn(
        'rounded-md border border-[var(--border)] bg-[var(--bg-primary)] p-3 shadow-sm transition-all hover:shadow-md',
        onClick && 'cursor-pointer hover:border-[var(--primary)]',
        isDragging && 'opacity-50 rotate-2 scale-105',
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
};
