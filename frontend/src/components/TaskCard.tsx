'use client';

import React, { useState } from 'react';
import {
  useSortable,
} from '@dnd-kit/sortable';
import {
  CSS,
} from '@dnd-kit/utilities';
import { Card } from '@/components/ui/Card';
import { ProfileIcon } from '@/components/ui/ProfileIcon';
import { CheckCircle } from '@/components/icons';
import { cn } from '@/lib/utils';
import dayjs from 'dayjs';

import { Task } from '@/lib/api';

interface TaskCardProps {
  task: Task;
  onUpdate: (taskId: string, updates: Partial<Task>) => void;
  onDelete: (taskId: string) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onUpdate,
  onDelete,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(task.name);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleToggleComplete = () => {
    onUpdate(task._id, { complete: !task.complete });
  };

  const handleSaveEdit = () => {
    if (editName.trim() && editName !== task.name) {
      onUpdate(task._id, { name: editName.trim() });
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      setEditName(task.name);
      setIsEditing(false);
    }
  };

  const isOverdue = task.dueDate && dayjs(task.dueDate).isBefore(dayjs(), 'day');
  const isDueSoon = task.dueDate && dayjs(task.dueDate).isBefore(dayjs().add(1, 'day'), 'day');

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        'cursor-grab active:cursor-grabbing',
        isDragging && 'opacity-50'
      )}
    >
      <Card
        className={cn(
          'p-3 hover:shadow-md transition-all',
          task.complete && 'opacity-60'
        )}
      >
        {/* Labels */}
        {task.labels && task.labels.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {task.labels.map((label: any) => (
              <span
                key={label._id}
                className="px-2 py-1 text-xs rounded text-white"
                style={{ backgroundColor: label.projectLabelId?.labelColorId?.colorHex || '#ccc' }}
              >
                {label.projectLabelId?.name || 'Label'}
              </span>
            ))}
          </div>
        )}

        {/* Task Name */}
        {isEditing ? (
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={handleSaveEdit}
            onKeyDown={handleKeyDown}
            className="w-full bg-transparent border-none outline-none text-[var(--text-primary)] font-medium"
            autoFocus
          />
        ) : (
          <div
            className="text-[var(--text-primary)] font-medium cursor-pointer hover:bg-[var(--bg-secondary)] -m-1 p-1 rounded"
            onClick={() => setIsEditing(true)}
          >
            {task.name}
          </div>
        )}

        {/* Due Date */}
        {task.dueDate && (
          <div className={cn(
            'text-xs mt-2 px-2 py-1 rounded inline-block',
            isOverdue ? 'bg-[var(--danger)] text-white' :
              isDueSoon ? 'bg-[var(--warning)] text-white' :
                'bg-[var(--bg-primary)] text-[var(--text-primary)]'
          )}>
            {dayjs(task.dueDate).format(task.hasTime ? 'MMM D [at] h:mm A' : 'MMM D')}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-3">
          {/* Assigned Users */}
          <div className="flex -space-x-1">
            {task.assigned && task.assigned.slice(0, 3).map((assignment: any) => (
              <ProfileIcon
                key={assignment._id}
                user={assignment.userId}
                size="sm"
                className="border-2 border-[var(--bg-primary)]"
              />
            ))}
            {task.assigned && task.assigned.length > 3 && (
              <div className="h-6 w-6 rounded-full bg-[var(--bg-primary)] border-2 border-[var(--bg-primary)] flex items-center justify-center text-xs text-[var(--text-primary)]">
                +{task.assigned.length - 3}
              </div>
            )}
          </div>

          {/* Complete Button */}
          <button
            onClick={handleToggleComplete}
            className={cn(
              'p-1 rounded hover:bg-[var(--bg-primary)] transition-colors',
              task.complete ? 'text-[var(--success)]' : 'text-[var(--text-primary)]'
            )}
          >
            <CheckCircle width={16} height={16} />
          </button>
        </div>
      </Card>
    </div>
  );
};
