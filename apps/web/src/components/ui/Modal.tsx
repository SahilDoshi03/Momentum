import React, { useEffect } from 'react';
import { cn } from '@/lib/utils';
import { X } from '@/components/icons';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
  footer?: React.ReactNode;
  showCloseButton?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  className,
  footer,
  showCloseButton = true,
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={cn(
          'relative m-2 z-10 w-full max-w-md rounded-lg bg-[var(--bg-primary)] border border-[var(--border)] shadow-lg flex flex-col max-h-[90vh]',
          className
        )}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className={cn(
            "flex items-center justify-between p-6 border-b border-[var(--border)]",
            !title && "border-none pb-0" // If no title, reduce padding/border
          )}>
            {title && (
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                {title}
              </h2>
            )}
            {showCloseButton && (
              <button
                onClick={onClose}
                className={cn(
                  "text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors",
                  !title && "absolute top-4 right-4" // Position absolute if no title to avoid taking up flow space
                )}
              >
                <X width={20} height={20} />
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="p-6 border-t border-[var(--border)] bg-[var(--bg-secondary)]/50 rounded-b-lg">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
