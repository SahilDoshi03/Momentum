'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { Button } from '@/components/ui/Button';
import { CheckCircle, Sort, Filter, Tags } from '@/components/icons';
import { TaskList } from './TaskList';
import { AddList } from './AddList';
import { cn } from '@/lib/utils';
import { apiClient, Project, Task } from '@/lib/api';

// Project interface is now imported from api.ts

interface ProjectBoardProps {
  projectId: string;
}

export const ProjectBoard: React.FC<ProjectBoardProps> = ({ projectId }) => {
  const [project, setProject] = useState<Project | null>(null);
  const [taskGroups, setTaskGroups] = useState<any[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Load project data
  useEffect(() => {
    const loadProject = async () => {
      try {
        setIsLoading(true);
        const response = await apiClient.getProjectById(projectId);
        if (response.success && response.data) {
          setProject(response.data);
          setTaskGroups(response.data.taskGroups || []);
        }
      } catch (error) {
        console.error('Failed to load project:', error);
        toast.error('Failed to load project');
      } finally {
        setIsLoading(false);
      }
    };

    loadProject();
  }, [projectId]);

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

  const handleCreateTask = async (listId: string, name: string) => {
    try {
      const response = await apiClient.createTask({
        taskGroupId: listId,
        name,
        description: '',
        hasTime: false,
      });

      if (response.success && response.data) {
        const newTask = response.data;
        setTaskGroups(prev => prev.map(list => 
          list._id === listId 
            ? { ...list, tasks: [...(list.tasks || []), newTask] }
            : list
        ));
        toast.success(`Task "${name}" created successfully!`);
      }
    } catch (error) {
      console.error('Failed to create task:', error);
      toast.error('Failed to create task');
    }
  };

  const handleCreateList = async (name: string) => {
    try {
      // Note: Task group creation would need to be implemented in the backend
      // For now, we'll just show a message
      toast.info('Task group creation not yet implemented');
    } catch (error) {
      console.error('Failed to create task group:', error);
      toast.error('Failed to create task group');
    }
  };

  const handleUpdateTask = async (taskId: string, updates: Partial<any>) => {
    try {
      const response = await apiClient.updateTask(taskId, updates);
      if (response.success && response.data) {
        setTaskGroups(prev => prev.map(list => ({
          ...list,
          tasks: (list.tasks || []).map(task => 
            task._id === taskId ? { ...task, ...updates } : task
          )
        })));
      }
    } catch (error) {
      console.error('Failed to update task:', error);
      toast.error('Failed to update task');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      const response = await apiClient.deleteTask(taskId);
      if (response.success) {
        setTaskGroups(prev => prev.map(list => ({
          ...list,
          tasks: (list.tasks || []).filter(task => task._id !== taskId)
        })));
        toast.success('Task deleted successfully!');
      }
    } catch (error) {
      console.error('Failed to delete task:', error);
      toast.error('Failed to delete task');
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary)] mx-auto"></div>
          <p className="mt-2 text-[var(--text-primary)]">Loading project...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex-1 p-6 flex items-center justify-center">
        <div className="text-center">
          <p className="text-[var(--text-primary)]">Project not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6">
      {/* Board Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-[var(--text-secondary)]">{project.name}</h1>
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
            <div key={list._id} className="flex-shrink-0 w-80">
              <TaskList
                list={list}
                onUpdateTask={handleUpdateTask}
                onDeleteTask={handleDeleteTask}
                onCreateTask={handleCreateTask}
                isDragOverlay={!!(activeId && (list.tasks || []).some(t => t._id === activeId))}
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
