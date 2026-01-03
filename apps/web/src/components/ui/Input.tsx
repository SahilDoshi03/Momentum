import React from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  variant?: 'default' | 'alternate';
  icon?: React.ReactNode;
  suffix?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  variant = 'default',
  className,
  icon,
  suffix,
  ...props
}) => {
  const baseClasses = 'flex h-10 w-full rounded-md border border-[var(--border)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-primary)]/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';

  const variantClasses = {
    default: 'border-[var(--border)]',
    alternate: 'border-[var(--alternate)] bg-[var(--bg-secondary)]',
  };

  return (
    <div className="space-y-2">
      {label && (
        <label
          htmlFor={props.id}
          className="text-sm font-medium text-[var(--text-primary)]"
        >
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]">
            {icon}
          </div>
        )}
        <input
          className={cn(
            baseClasses,
            variantClasses[variant],
            icon && 'pl-10',
            suffix && 'pr-10',
            error && 'border-[var(--danger)] focus-visible:ring-[var(--danger)]',
            className
          )}
          {...props}
        />
        {suffix && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]">
            {suffix}
          </div>
        )}
      </div>
      {error && (
        <p className="text-sm text-[var(--danger)]">{error}</p>
      )}
    </div>
  );
};
