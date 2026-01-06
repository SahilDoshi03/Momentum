'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/Button';

interface CardComposerProps {
  onSave: (name: string) => void;
  onCancel: () => void;
  placeholder?: string;
}

export const CardComposer: React.FC<CardComposerProps> = ({
  onSave,
  onCancel,
  placeholder = 'Enter a title for this card...',
}) => {
  const [name, setName] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSave(name.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Stop propagation to prevent dnd-kit from picking up the event (e.g. Space key)
    e.stopPropagation();

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <textarea
        ref={textareaRef}
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-full p-2 text-sm bg-[var(--bg-primary)] border border-[var(--border)] rounded resize-none focus:outline-none focus:ring-2 focus:ring-[var(--primary)] text-[var(--text-primary)]"
        rows={3}
      />
      <div className="flex items-center space-x-2">
        <Button type="submit" size="sm">
          Add card
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
};
