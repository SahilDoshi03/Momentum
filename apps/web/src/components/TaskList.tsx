'use client';

import React, { useState } from 'react';
import {
  useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Button } from '@/components/ui/Button';
import { TaskCard } from './TaskCard';
import { CardComposer } from './CardComposer';
import { Plus } from '@/components/icons';
import { cn } from '@/lib/utils';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';

import { Task } from '@/lib/api';

interface TaskListProps {
  list: {
    _id: string;
    name: string;
    position: number;
    tasks: Task[];
  };
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
  onDeleteTask: (taskId: string) => void;
  onCreateTask: (listId: string, name: string) => void;
  onDeleteList: (listId: string) => void;
  onUpdateList: (listId: string, updates: { name: string }) => void;
  onTaskClick: (task: Task) => void;
  isDragOverlay?: boolean;
}

export const TaskList: React.FC<TaskListProps> = ({
  list,
  onUpdateTask,
  onDeleteTask,
  onCreateTask,
  onDeleteList,
  onUpdateList,
  onTaskClick,
  isDragOverlay = false,
}) => {
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [title, setTitle] = useState(list.name);
  const { setNodeRef, isOver } = useDroppable({
    id: list._id,
  });

  const handleCreateTask = (name: string) => {
    if (name.trim()) {
      onCreateTask(list._id, name.trim());
      setIsAddingCard(false);
    }
  };

  const handleTitleSubmit = () => {
    if (title.trim() && title !== list.name) {
      onUpdateList(list._id, { name: title.trim() });
    } else {
      setTitle(list.name);
    }
    setIsEditingTitle(false);
  };

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'bg-[var(--bg-secondary)] rounded-lg p-4 min-h-[200px] transition-colors group',
        isOver && 'bg-[var(--primary)]/10',
        isDragOverlay && 'opacity-50'
      )}
    >
      {/* List Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 flex-1">
          {isEditingTitle ? (
            <input
              autoFocus
              className="font-semibold text-[var(--text-secondary)] bg-transparent border-b border-[var(--primary)] focus:outline-none w-full"
              value={title}
              onChange={(e) => setTitle(e.target.value)}

              onBlur={handleTitleSubmit}
              onPointerDown={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onKeyDown={(e) => {
                e.stopPropagation();
                if (e.key === 'Enter') handleTitleSubmit();
                if (e.key === 'Escape') {
                  setTitle(list.name);
                  setIsEditingTitle(false);
                }
              }}
            />
          ) : (
            <h3
              className="font-semibold text-[var(--text-secondary)] cursor-pointer hover:bg-[var(--bg-primary)] px-2 -ml-2 rounded"
              onClick={() => setIsEditingTitle(true)}
              onPointerDown={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
            >
              {list.name}
            </h3>
          )}
          <span className="text-sm text-[var(--text-primary)] bg-[var(--bg-primary)] px-2 py-1 rounded">
            {list.tasks.length}
          </span>
        </div>
        <div className="group/header opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity md:pointer-events-none md:group-hover:pointer-events-auto">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-[var(--text-tertiary)] hover:text-red-500"
            onClick={(e) => {
              // Prevent drag start
              e.stopPropagation();
              e.preventDefault();
              setIsDeleteModalOpen(true);
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18"></path>
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
            </svg>
          </Button>
        </div>
      </div>

      {/* Tasks */}
      <SortableContext items={list.tasks.map(t => t._id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {list.tasks.map((task) => (
            <TaskCard
              key={task._id}
              task={task}
              onUpdate={onUpdateTask}
              onDelete={onDeleteTask}
              onClick={() => onTaskClick(task)}
            />
          ))}
        </div>
      </SortableContext>

      {/* Add Card */}
      {isAddingCard ? (
        <CardComposer
          onSave={handleCreateTask}
          onCancel={() => setIsAddingCard(false)}
        />
      ) : (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsAddingCard(true)}
          className="w-full mt-2 text-[var(--text-primary)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-primary)]"
        >
          <Plus width={16} height={16} className="mr-2" />
          Add a card
        </Button>
      )}

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={() => {
          onDeleteList(list._id);
          setIsDeleteModalOpen(false);
        }}
        title="Delete List"
        message="Are you sure you want to delete this list and all its tasks? This action cannot be undone."
        variant="danger"
        confirmText="Delete List"
      />
    </div>
  );
};
