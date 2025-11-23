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
  isDragOverlay?: boolean;
}

export const TaskList: React.FC<TaskListProps> = ({
  list,
  onUpdateTask,
  onDeleteTask,
  onCreateTask,
  isDragOverlay = false,
}) => {
  const [isAddingCard, setIsAddingCard] = useState(false);
  const { setNodeRef, isOver } = useDroppable({
    id: list._id,
  });

  const handleCreateTask = (name: string) => {
    if (name.trim()) {
      onCreateTask(list._id, name.trim());
      setIsAddingCard(false);
    }
  };

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'bg-[var(--bg-secondary)] rounded-lg p-4 min-h-[200px] transition-colors',
        isOver && 'bg-[var(--primary)]/10',
        isDragOverlay && 'opacity-50'
      )}
    >
      {/* List Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-[var(--text-secondary)]">{list.name}</h3>
        <span className="text-sm text-[var(--text-primary)] bg-[var(--bg-primary)] px-2 py-1 rounded">
          {list.tasks.length}
        </span>
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
    </div>
  );
};
