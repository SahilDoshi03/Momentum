'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Plus } from '@/components/icons';

interface AddListProps {
  onCreateList: (name: string) => void;
}

export const AddList: React.FC<AddListProps> = ({ onCreateList }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onCreateList(name.trim());
      setName('');
      setIsAdding(false);
    }
  };

  const handleCancel = () => {
    setName('');
    setIsAdding(false);
  };

  if (isAdding) {
    return (
      <div className="bg-[var(--bg-secondary)] rounded-lg p-4 w-80">
        <form onSubmit={handleSubmit} className="space-y-2">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter list title..."
            className="w-full p-2 text-sm bg-[var(--bg-primary)] border border-[var(--border)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--primary)] text-[var(--text-primary)]"
            autoFocus
          />
          <div className="flex items-center space-x-2">
            <Button type="submit" size="sm">
              Add list
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={handleCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <button
      onClick={() => setIsAdding(true)}
      className="bg-[var(--bg-secondary)] hover:bg-[var(--bg-primary)] rounded-lg p-4 w-80 min-h-[200px] flex items-center justify-center text-[var(--text-primary)] hover:text-[var(--text-secondary)] transition-colors border-2 border-dashed border-[var(--border)] hover:border-[var(--primary)]"
    >
      <div className="text-center">
        <Plus width={24} height={24} className="mx-auto mb-2" />
        <span className="text-sm">Add another list</span>
      </div>
    </button>
  );
};
