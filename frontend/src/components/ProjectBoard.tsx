'use client';

import React, { useState } from 'react';
import { toast } from 'react-toastify';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Button } from '@/components/ui/Button';
import { CheckCircle, Sort, Filter, Tags } from '@/components/icons';
import { TaskList } from './TaskList';
import { AddList } from './AddList';
import { cn } from '@/lib/utils';

interface Project {
  id: string;
  name: string;
  shortId: string;
  team?: {
    id: string;
    name: string;
  } | null;
  members: Array<{
    id: string;
    username: string;
    fullName: string;
    email: string;
    initials: string;
    role: string;
  }>;
  taskGroups: Array<{
    id: string;
    name: string;
    position: number;
    tasks: Array<{
      id: string;
      name: string;
      shortId: string;
      description?: string;
      complete: boolean;
      position: number;
      dueDate?: {
        at: string;
      } | null;
      hasTime: boolean;
      assigned: Array<{
        id: string;
        username: string;
        fullName: string;
        email: string;
        initials: string;
      }>;
      labels: Array<{
        id: string;
        name: string;
        color: string;
      }>;
    }>;
  }>;
  labels: Array<{
    id: string;
    name: string;
    color: string;
  }>;
}

interface ProjectBoardProps {
  project: Project;
}

export const ProjectBoard: React.FC<ProjectBoardProps> = ({ project }) => {
  const [taskGroups, setTaskGroups] = useState(project.taskGroups);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Find the task and its current list
    let activeTask = null;
    let activeListId = null;
    
    for (const list of taskGroups) {
      const task = list.tasks.find(t => t.id === activeId);
      if (task) {
        activeTask = task;
        activeListId = list.id;
        break;
      }
    }

    if (!activeTask) return;

    // Check if dropping on a list
    const targetList = taskGroups.find(list => list.id === overId);
    if (targetList) {
      // Moving task to a different list
      if (activeListId !== overId) {
        setTaskGroups(prev => prev.map(list => {
          if (list.id === activeListId) {
            return {
              ...list,
              tasks: list.tasks.filter(t => t.id !== activeId)
            };
          }
          if (list.id === overId) {
            return {
              ...list,
              tasks: [...list.tasks, { ...activeTask, position: list.tasks.length }]
            };
          }
          return list;
        }));
      }
      return;
    }

    // Check if dropping on another task
    let targetListId = null;
    let targetTask = null;
    
    for (const list of taskGroups) {
      const task = list.tasks.find(t => t.id === overId);
      if (task) {
        targetTask = task;
        targetListId = list.id;
        break;
      }
    }

    if (targetTask && targetListId) {
      // Reordering within the same list or moving to a different list
      setTaskGroups(prev => prev.map(list => {
        if (list.id === activeListId && list.id === targetListId) {
          // Reordering within same list
          const tasks = [...list.tasks];
          const activeIndex = tasks.findIndex(t => t.id === activeId);
          const targetIndex = tasks.findIndex(t => t.id === overId);
          
          if (activeIndex !== -1 && targetIndex !== -1) {
            const [removed] = tasks.splice(activeIndex, 1);
            tasks.splice(targetIndex, 0, removed);
          }
          
          return { ...list, tasks };
        } else if (list.id === activeListId) {
          // Remove from source list
          return {
            ...list,
            tasks: list.tasks.filter(t => t.id !== activeId)
          };
        } else if (list.id === targetListId) {
          // Add to target list
          const targetIndex = list.tasks.findIndex(t => t.id === overId);
          const tasks = [...list.tasks];
          tasks.splice(targetIndex, 0, { ...activeTask, position: targetIndex });
          return { ...list, tasks };
        }
        return list;
      }));
    }
  };

  const handleCreateTask = (listId: string, name: string) => {
    const newTask = {
      id: `task-${Date.now()}`,
      name,
      shortId: `${taskGroups.find(l => l.id === listId)?.tasks.length || 0 + 1}`,
      description: '',
      complete: false,
      position: 0,
      dueDate: null,
      hasTime: false,
      assigned: [],
      labels: [],
    };

    setTaskGroups(prev => prev.map(list => 
      list.id === listId 
        ? { ...list, tasks: [...list.tasks, newTask] }
        : list
    ));
    
    toast.success(`Task "${name}" created successfully!`);
  };

  const handleCreateList = (name: string) => {
    const newList = {
      id: `list-${Date.now()}`,
      name,
      position: taskGroups.length,
      tasks: [],
    };

    setTaskGroups(prev => [...prev, newList]);
    toast.success(`List "${name}" created successfully!`);
  };

  const handleUpdateTask = (taskId: string, updates: Partial<any>) => {
    setTaskGroups(prev => prev.map(list => ({
      ...list,
      tasks: list.tasks.map(task => 
        task.id === taskId ? { ...task, ...updates } : task
      )
    })));
  };

  const handleDeleteTask = (taskId: string) => {
    setTaskGroups(prev => prev.map(list => ({
      ...list,
      tasks: list.tasks.filter(task => task.id !== taskId)
    })));
  };

  return (
    <div className="flex-1 p-6">
      {/* Board Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm">
            <CheckCircle width={16} height={16} className="mr-2" />
            All Tasks
          </Button>
          <Button variant="ghost" size="sm">
            <Sort width={16} height={16} className="mr-2" />
            Sort
          </Button>
          <Button variant="ghost" size="sm">
            <Filter width={16} height={16} className="mr-2" />
            Filter
          </Button>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm">
            <Tags width={16} height={16} className="mr-2" />
            Labels
          </Button>
        </div>
      </div>

      {/* Board Content */}
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex space-x-4 overflow-x-auto pb-4">
          {taskGroups.map((list) => (
            <div key={list.id} className="flex-shrink-0 w-80">
              <TaskList
                list={list}
                onUpdateTask={handleUpdateTask}
                onDeleteTask={handleDeleteTask}
                onCreateTask={handleCreateTask}
                isDragOverlay={activeId && list.tasks.some(t => t.id === activeId)}
              />
            </div>
          ))}
          <div className="flex-shrink-0">
            <AddList onCreateList={handleCreateList} />
          </div>
        </div>
      </DndContext>
    </div>
  );
};
