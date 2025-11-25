'use client';

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { TaskList } from './TaskList';
import { Task } from '@/lib/api';

interface SortableTaskListProps {
    list: {
        _id: string;
        name: string;
        position: number;
        tasks: Task[];
    };
    onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
    onDeleteTask: (taskId: string) => void;
    onCreateTask: (listId: string, name: string) => void;
    onTaskClick: (task: Task) => void;
    isDragOverlay: boolean;
}

export const SortableTaskList: React.FC<SortableTaskListProps> = ({
    list,
    onUpdateTask,
    onDeleteTask,
    onCreateTask,
    onTaskClick,
    isDragOverlay,
}) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: list._id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="flex-shrink-0 w-80"
        >
            <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
                <TaskList
                    list={list}
                    onUpdateTask={onUpdateTask}
                    onDeleteTask={onDeleteTask}
                    onCreateTask={onCreateTask}
                    onTaskClick={onTaskClick}
                    isDragOverlay={isDragOverlay}
                />
            </div>
        </div>
    );
};
