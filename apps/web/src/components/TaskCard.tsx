'use client';

import React, { useState } from 'react';
import {
  useSortable,
} from '@dnd-kit/sortable';
import {
  CSS,
} from '@dnd-kit/utilities';
import { Card } from '@/components/ui/Card';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { ProfileIcon } from '@/components/ui/ProfileIcon';
import { CheckCircle, Flag } from '@/components/icons';
import { cn } from '@/lib/utils';
import dayjs from 'dayjs';

import { toast } from 'react-toastify';

import { Task } from '@/lib/api';

interface TaskCardProps {
  task: Task;
  onUpdate: (taskId: string, updates: Partial<Task>) => void;
  onDelete: (taskId: string) => void;
  onClick: () => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onUpdate,
  onDelete,
  onClick,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(task.name);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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
    const newStatus = !task.complete;
    onUpdate(task._id, { complete: newStatus });
    toast.success(newStatus ? 'Task marked as completed' : 'Task marked as incomplete');
  };

  const handleTogglePriority = () => {
    // Cycle: medium -> high -> low -> medium
    let newPriority: 'low' | 'medium' | 'high' = 'medium';
    if (task.priority === 'medium' || !task.priority) newPriority = 'high';
    else if (task.priority === 'high') newPriority = 'low';
    else newPriority = 'medium';

    onUpdate(task._id, { priority: newPriority });

    let message = 'Task priority set to normal';
    if (newPriority === 'high') message = 'Task marked as high priority';
    if (newPriority === 'low') message = 'Task marked as low priority';
    toast.success(message);
  };

  const handleSaveEdit = () => {
    if (editName.trim() && editName !== task.name) {
      onUpdate(task._id, { name: editName.trim() });
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation();
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
          'p-3 hover:shadow-md transition-all group',
          task.complete && 'opacity-60',
          task.priority === 'high' && !task.complete && 'border-l-4 border-l-[var(--danger)]',
          task.priority === 'medium' && !task.complete && 'border-l-4 border-l-[var(--info)]',
          task._id.startsWith('temp-') && 'opacity-70 border-dashed border-2'
        )}
        onClick={onClick}
      >
        {/* Labels */}
        {task.labels && task.labels.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {task.labels
              .filter((label) => label.projectLabelId && label.projectLabelId.labelColorId)
              .map((label) => (
                <span
                  key={label._id}
                  className="px-2 py-1 text-xs rounded text-white"
                  style={{ backgroundColor: label.projectLabelId.labelColorId.colorHex }}
                >
                  {label.projectLabelId.name}
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
            onClick={(e) => e.stopPropagation()}
            className="w-full bg-transparent border-none outline-none text-[var(--text-primary)] font-medium"
            autoFocus
          />
        ) : (
          <div
            className="text-[var(--text-primary)] font-medium cursor-pointer hover:bg-[var(--bg-secondary)] -m-1 p-1 rounded"
            onClick={(e) => {
              e.stopPropagation();
              setIsEditing(true);
            }}
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
            {task.assigned && task.assigned.slice(0, 3).map((assignment) => (
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

          <div className="flex items-center space-x-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity md:pointer-events-none md:group-hover:pointer-events-auto">
            {/* Delete Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowDeleteConfirm(true);
              }}
              className="p-1 rounded hover:bg-[var(--bg-primary)] text-[var(--text-tertiary)] hover:text-[var(--danger)] transition-colors"
              title="Delete task"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18"></path>
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                <path d="M8 6V4c0-1 1-2 2-2h4c0 1 1 2 2 2v2"></path>
              </svg>
            </button>

            {/* Priority Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleTogglePriority();
              }}
              className={cn(
                'p-1 rounded hover:bg-[var(--bg-primary)] transition-colors',
                task.priority === 'high' ? 'text-[var(--danger)]' :
                  task.priority === 'low' ? 'text-[var(--info)]' :
                    'text-[var(--text-tertiary)] hover:text-[var(--danger)]'
              )}
              title={
                task.priority === 'high' ? 'Set to low priority' :
                  task.priority === 'low' ? 'Set to normal priority' :
                    'Set to high priority'
              }
            >
              <Flag
                width={14}
                height={14}
                fill={task.priority === 'high' || task.priority === 'low' ? 'currentColor' : 'none'}
              />
            </button>

            {/* Complete Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleToggleComplete();
              }}
              className={cn(
                'p-1 rounded hover:bg-[var(--bg-primary)] transition-colors hover:text-[var(--success)]',
                task.complete ? 'text-[var(--success)]' : 'text-[var(--text-primary)]'
              )}
              title={task.complete ? 'Mark as incomplete' : 'Mark as complete'}
            >
              <CheckCircle width={16} height={16} />
            </button>
          </div>
        </div>
      </Card>
      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={() => {
          onDelete(task._id);
          setShowDeleteConfirm(false);
        }}
        title="Delete Task"
        message="Are you sure you want to delete this task? This action cannot be undone."
        confirmText="Delete Task"
        variant="danger"
      />
    </div>
  );
};
