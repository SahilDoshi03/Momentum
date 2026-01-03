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
import {
  SortableContext,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Button } from '@/components/ui/Button';
import { CheckCircle, Sort, Filter, Tags, Settings } from '@/components/icons';
import { SortableTaskList } from './SortableTaskList';
import { AddList } from './AddList';
import { apiClient, Project, Task, User } from '@/lib/api';
import { Dropdown, DropdownItem, DropdownHeader } from '@/components/ui/Dropdown';
import { TaskDetailModal } from './TaskDetailModal';
import { ProjectSettingsModal } from './ProjectSettingsModal';
import { useRouter } from 'next/navigation';

// Project interface is now imported from api.ts

interface ProjectBoardProps {
  projectId: string;
}

interface TaskGroup {
  _id: string;
  id?: string; // For compatibility if needed, but backend uses _id
  name: string;
  position: number;
  tasks: Task[];
}

export const ProjectBoard: React.FC<ProjectBoardProps> = ({ projectId }) => {
  const [project, setProject] = useState<Project | null>(null);
  const [taskGroups, setTaskGroups] = useState<TaskGroup[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Filter and Sort State
  const [filterBy, setFilterBy] = useState<'all' | 'mine' | 'completed' | 'incomplete'>('all');
  const [sortBy, setSortBy] = useState<'none' | 'name-asc' | 'name-desc' | 'date-asc' | 'date-desc'>('none');
  const [labelFilter, setLabelFilter] = useState<string[]>([]);
  const [otherFilters, setOtherFilters] = useState<string[]>([]); // 'overdue', 'no-date'

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Load project data and current user
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const [projectRes, userRes] = await Promise.all([
          apiClient.getProjectById(projectId),
          apiClient.getCurrentUser()
        ]);

        if (projectRes.success && projectRes.data) {
          setProject(projectRes.data);
          setTaskGroups((projectRes.data.taskGroups || []).map((group) => ({
            ...group,
            tasks: group.tasks || []
          })));
        }

        if (userRes.success && userRes.data) {
          setCurrentUser(userRes.data);
        }
      } catch (error) {
        console.error('Failed to load data:', error);
        toast.error('Failed to load project data');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [projectId]);

  // Derived state for filtered and sorted tasks
  const getFilteredTaskGroups = () => {
    return taskGroups.map(group => {
      let filteredTasks = [...group.tasks];

      // 1. Filter by Status/Ownership
      if (filterBy === 'mine' && currentUser) {
        filteredTasks = filteredTasks.filter(task =>
          task.assigned?.some(a => a.userId._id === currentUser._id)
        );
      } else if (filterBy === 'completed') {
        filteredTasks = filteredTasks.filter(task => task.complete);
      } else if (filterBy === 'incomplete') {
        filteredTasks = filteredTasks.filter(task => !task.complete);
      }

      // 2. Filter by Labels
      if (labelFilter.length > 0) {
        filteredTasks = filteredTasks.filter(task =>
          task.labels?.some(l => labelFilter.includes(l.projectLabelId._id))
        );
      }

      // 3. Other Filters
      if (otherFilters.includes('overdue')) {
        const now = new Date();
        filteredTasks = filteredTasks.filter(task =>
          task.dueDate && new Date(task.dueDate) < now && !task.complete
        );
      }
      if (otherFilters.includes('no-date')) {
        filteredTasks = filteredTasks.filter(task => !task.dueDate);
      }

      // 4. Sort
      if (sortBy === 'name-asc') {
        filteredTasks.sort((a, b) => a.name.localeCompare(b.name));
      } else if (sortBy === 'name-desc') {
        filteredTasks.sort((a, b) => b.name.localeCompare(a.name));
      } else if (sortBy === 'date-asc') {
        filteredTasks.sort((a, b) => {
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        });
      } else if (sortBy === 'date-desc') {
        filteredTasks.sort((a, b) => {
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime();
        });
      } else {
        // Default sort by position
        filteredTasks.sort((a, b) => a.position - b.position);
      }

      return {
        ...group,
        tasks: filteredTasks
      };
    });
  };

  const filteredTaskGroups = getFilteredTaskGroups();

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId === overId) return;

    // Check if we're dragging a task group (list)
    const activeGroup = taskGroups.find(group => group._id === activeId);
    const overGroup = taskGroups.find(group => group._id === overId);

    if (activeGroup && overGroup) {
      // Reordering task groups
      const previousTaskGroups = taskGroups;
      const oldIndex = taskGroups.findIndex(group => group._id === activeId);
      const newIndex = taskGroups.findIndex(group => group._id === overId);

      if (oldIndex !== newIndex) {
        // Optimistically update UI
        const newTaskGroups = [...taskGroups];
        const [removed] = newTaskGroups.splice(oldIndex, 1);
        newTaskGroups.splice(newIndex, 0, removed);

        // Update positions
        const updatedGroups = newTaskGroups.map((group, index) => ({
          ...group,
          position: index
        }));

        setTaskGroups(updatedGroups);

        // Persist to backend
        try {
          await Promise.all(
            updatedGroups.map((group) =>
              apiClient.updateTaskGroup(group._id, { position: group.position })
            )
          );
        } catch (error) {
          console.error('Failed to update task group positions:', error);
          toast.error('Failed to update list positions');
          // Rollback on error
          setTaskGroups(previousTaskGroups);
        }
      }
      return;
    }

    // Find the task and its current list
    let activeTask = null;
    let activeListId = null;

    for (const list of taskGroups) {
      const task = list.tasks.find((t: Task) => t._id === activeId);
      if (task) {
        activeTask = task;
        activeListId = list._id;
        break;
      }
    }

    if (!activeTask) return;

    // Store previous state for rollback on error
    const previousTaskGroups = taskGroups;

    // Check if dropping on a list
    const targetList = taskGroups.find(list => list._id === overId);
    if (targetList) {
      // Moving task to a different list
      if (activeListId !== overId) {
        // Optimistically update UI
        const newTaskGroups = taskGroups.map(list => {
          if (list._id === activeListId) {
            return {
              ...list,
              tasks: list.tasks.filter((t: Task) => t._id !== activeId)
            };
          }
          if (list._id === overId) {
            return {
              ...list,
              tasks: [...list.tasks, { ...activeTask!, position: list.tasks.length }]
            };
          }
          return list;
        });
        setTaskGroups(newTaskGroups);

        // Persist to backend
        try {
          await apiClient.updateTask(activeId, {
            taskGroupId: overId,
            position: targetList.tasks.length
          });
        } catch (error) {
          console.error('Failed to move task:', error);
          toast.error('Failed to move task');
          // Rollback on error
          setTaskGroups(previousTaskGroups);
        }
      }
      return;
    }

    // Check if dropping on another task
    let targetListId = null;
    let targetTask = null;

    for (const list of taskGroups) {
      const task = list.tasks.find((t: Task) => t._id === overId);
      if (task) {
        targetTask = task;
        targetListId = list._id;
        break;
      }
    }

    if (targetTask && targetListId) {
      // Reordering within the same list or moving to a different list
      const newTaskGroups = taskGroups.map(list => {
        if (list._id === activeListId && list._id === targetListId) {
          // Reordering within same list
          const tasks = [...list.tasks];
          const activeIndex = tasks.findIndex((t: Task) => t._id === activeId);
          const targetIndex = tasks.findIndex((t: Task) => t._id === overId);

          if (activeIndex !== -1 && targetIndex !== -1) {
            const [removed] = tasks.splice(activeIndex, 1);
            tasks.splice(targetIndex, 0, removed);

            // Update positions for all tasks in the list
            return {
              ...list,
              tasks: tasks.map((t, index) => ({ ...t, position: index }))
            };
          }

          return { ...list, tasks };
        } else if (list._id === activeListId) {
          // Remove from source list and update positions
          const tasks = list.tasks.filter((t: Task) => t._id !== activeId);
          return {
            ...list,
            tasks: tasks.map((t, index) => ({ ...t, position: index }))
          };
        } else if (list._id === targetListId) {
          // Add to target list at the target position
          const targetIndex = list.tasks.findIndex((t: Task) => t._id === overId);
          const tasks = [...list.tasks];
          tasks.splice(targetIndex, 0, { ...activeTask!, position: targetIndex });
          return {
            ...list,
            tasks: tasks.map((t, index) => ({ ...t, position: index }))
          };
        }
        return list;
      });

      setTaskGroups(newTaskGroups);

      // Persist to backend
      try {
        if (activeListId === targetListId) {
          // Reordering within same list - update all task positions
          const updatedList = newTaskGroups.find(list => list._id === activeListId);
          if (updatedList) {
            await Promise.all(
              updatedList.tasks.map((task, index) =>
                apiClient.updateTask(task._id, { position: index })
              )
            );
          }
        } else {
          // Moving between lists - update taskGroupId and positions
          const sourceList = newTaskGroups.find(list => list._id === activeListId);
          const targetList = newTaskGroups.find(list => list._id === targetListId);

          const updates = [];

          // Update moved task
          const targetIndex = targetList?.tasks.findIndex((t: Task) => t._id === activeId) ?? 0;
          updates.push(
            apiClient.updateTask(activeId, {
              taskGroupId: targetListId,
              position: targetIndex
            })
          );

          // Update positions in source list
          if (sourceList) {
            sourceList.tasks.forEach((task, index) => {
              updates.push(apiClient.updateTask(task._id, { position: index }));
            });
          }

          // Update positions in target list
          if (targetList) {
            targetList.tasks.forEach((task, index) => {
              updates.push(apiClient.updateTask(task._id, { position: index }));
            });
          }

          await Promise.all(updates);
        }
      } catch (error) {
        console.error('Failed to update task positions:', error);
        toast.error('Failed to update task positions');
        // Rollback on error
        setTaskGroups(previousTaskGroups);
      }
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
      if (!project) return;

      const response = await apiClient.createTaskGroup({
        projectId: project._id,
        name,
        position: taskGroups.length,
      });

      if (response.success && response.data) {
        const newGroup = response.data;
        setTaskGroups(prev => [...prev, newGroup]);
        toast.success(`List "${name}" created successfully!`);
      }
    } catch (error) {
      console.error('Failed to create task group:', error);
      toast.error('Failed to create task group');
    }
  };

  const handleUpdateTask = async (taskId: string, updates: Partial<Task>) => {
    try {
      const response = await apiClient.updateTask(taskId, updates);
      if (response.success && response.data) {
        setTaskGroups(prev => prev.map(list => ({
          ...list,
          tasks: (list.tasks || []).map((task: Task) =>
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
          tasks: (list.tasks || []).filter((task: Task) => task._id !== taskId)
        })));
        toast.success('Task deleted successfully!');
      }
    } catch (error) {
      console.error('Failed to delete task:', error);
      toast.error('Failed to delete task');
    }
  };

  const handleDeleteList = async (listId: string) => {
    try {
      const response = await apiClient.deleteTaskGroup(listId);
      if (response.success) {
        setTaskGroups(prev => prev.filter(list => list._id !== listId));
        toast.success('List deleted successfully!');
      }
    } catch (error) {
      console.error('Failed to delete list:', error);
      toast.error('Failed to delete list');
    }
  };

  const handleUpdateList = async (listId: string, updates: { name: string }) => {
    try {
      const response = await apiClient.updateTaskGroup(listId, updates);
      if (response.success) {
        setTaskGroups(prev => prev.map(list =>
          list._id === listId ? { ...list, ...updates } : list
        ));
      }
    } catch (error) {
      console.error('Failed to update list:', error);
      toast.error('Failed to update list');
    }
  };

  const toggleLabelFilter = (labelId: string) => {
    setLabelFilter(prev =>
      prev.includes(labelId)
        ? prev.filter(id => id !== labelId)
        : [...prev, labelId]
    );
  };

  const toggleOtherFilter = (filter: string) => {
    setOtherFilters(prev =>
      prev.includes(filter)
        ? prev.filter(f => f !== filter)
        : [...prev, filter]
    );
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
  };

  const handleCloseModal = () => {
    setSelectedTask(null);
  };

  // Settings Modal State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const router = useRouter();

  const handleUpdateProject = async (updates: Partial<Project>) => {
    if (!project) return;
    try {
      const response = await apiClient.updateProject(project._id, updates);
      if (response.success && response.data) {
        setProject(prev => prev ? { ...prev, ...updates } : null);
      }
    } catch (error) {
      console.error('Failed to update project:', error);
      toast.error('Failed to update project');
    }
  };

  const handleDeleteProject = async () => {
    if (!project) return;
    try {
      const response = await apiClient.deleteProject(project._id);
      if (response.success) {
        toast.success('Project deleted successfully');
        router.push('/');
      }
    } catch (error) {
      console.error('Failed to delete project:', error);
      toast.error('Failed to delete project');
    }
  };

  const handleAddMember = async (userId: string) => {
    if (!project) return;
    try {
      const response = await apiClient.addProjectMember(project._id, userId);
      if (response.success) {
        // Refresh project data to get updated members list
        const projectRes = await apiClient.getProjectById(project._id);
        if (projectRes.success && projectRes.data) {
          setProject(projectRes.data);
          toast.success('Member added successfully');
        }
      }
    } catch (error) {
      console.error('Failed to add member:', error);
      toast.error('Failed to add member');
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!project) return;
    try {
      const response = await apiClient.removeProjectMember(project._id, userId);
      if (response.success) {
        // Optimistically update local state
        setProject(prev => prev ? {
          ...prev,
          members: prev.members?.filter(m => m.userId._id !== userId)
        } : null);
        toast.success('Member removed successfully');
      }
    } catch (error) {
      console.error('Failed to remove member:', error);
      toast.error('Failed to remove member');
    }
  };

  const handleUpdateMemberRole = async (userId: string, role: string) => {
    if (!project) return;
    try {
      const response = await apiClient.updateProjectMember(project._id, userId, role);
      if (response.success) {
        // Optimistically update local state
        setProject(prev => prev ? {
          ...prev,
          members: prev.members?.map(m => m.userId._id === userId ? { ...m, role } : m)
        } : null);
        toast.success('Member role updated successfully');
      }
    } catch (error) {
      console.error('Failed to update member role:', error);
      toast.error('Failed to update member role');
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
      <div className="flex flex-col gap-4 mb-6">
        {/* Top Row: Title and Settings */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-[var(--text-secondary)] truncate">{project.name}</h1>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsSettingsOpen(true)}
            className="text-[var(--text-primary)] hover:text-[var(--text-secondary)]"
          >
            <Settings width={20} height={20} />
          </Button>
        </div>

        {/* Bottom Row: Controls Toolbar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide md:pb-0 md:flex-wrap md:overflow-visible">
          {/* All Tasks / Filter View */}
          <Dropdown
            trigger={
              <Button variant="ghost" size="sm" className="whitespace-nowrap flex-shrink-0">
                <CheckCircle width={16} height={16} className="mr-2" />
                {filterBy === 'all' ? 'All Tasks' :
                  filterBy === 'mine' ? 'My Tasks' :
                    filterBy === 'completed' ? 'Completed' : 'Incomplete'}
              </Button>
            }
          >
            <DropdownItem active={filterBy === 'all'} onClick={() => setFilterBy('all')}>
              All Tasks
            </DropdownItem>
            <DropdownItem active={filterBy === 'mine'} onClick={() => setFilterBy('mine')}>
              My Tasks
            </DropdownItem>
            <DropdownItem active={filterBy === 'completed'} onClick={() => setFilterBy('completed')}>
              Completed Tasks
            </DropdownItem>
            <DropdownItem active={filterBy === 'incomplete'} onClick={() => setFilterBy('incomplete')}>
              Incomplete Tasks
            </DropdownItem>
          </Dropdown>

          <div className="w-px h-6 bg-[var(--border)] mx-1 flex-shrink-0" />

          {/* Sort */}
          <Dropdown
            trigger={
              <Button variant="ghost" size="sm" className="whitespace-nowrap flex-shrink-0">
                <Sort width={16} height={16} className="mr-2" />
                Sort
              </Button>
            }
          >
            <DropdownHeader>Sort By</DropdownHeader>
            <DropdownItem active={sortBy === 'none'} onClick={() => setSortBy('none')}>
              None
            </DropdownItem>
            <DropdownItem active={sortBy === 'name-asc'} onClick={() => setSortBy('name-asc')}>
              Name (A-Z)
            </DropdownItem>
            <DropdownItem active={sortBy === 'name-desc'} onClick={() => setSortBy('name-desc')}>
              Name (Z-A)
            </DropdownItem>
            <DropdownItem active={sortBy === 'date-asc'} onClick={() => setSortBy('date-asc')}>
              Due Date (Earliest)
            </DropdownItem>
            <DropdownItem active={sortBy === 'date-desc'} onClick={() => setSortBy('date-desc')}>
              Due Date (Latest)
            </DropdownItem>
          </Dropdown>

          {/* Filter */}
          <Dropdown
            trigger={
              <Button variant="ghost" size="sm" className="whitespace-nowrap flex-shrink-0">
                <Filter width={16} height={16} className="mr-2" />
                Filter
              </Button>
            }
          >
            <DropdownHeader>Filter By</DropdownHeader>
            <DropdownItem
              active={otherFilters.includes('overdue')}
              onClick={() => toggleOtherFilter('overdue')}
            >
              Overdue
            </DropdownItem>
            <DropdownItem
              active={otherFilters.includes('no-date')}
              onClick={() => toggleOtherFilter('no-date')}
            >
              No Due Date
            </DropdownItem>
          </Dropdown>

          {/* Labels */}
          <Dropdown
            align="left"
            trigger={
              <Button variant="ghost" size="sm" className="whitespace-nowrap flex-shrink-0">
                <Tags width={16} height={16} className="mr-2" />
                Labels
              </Button>
            }
          >
            <DropdownHeader>Filter by Label</DropdownHeader>
            {project.labels && project.labels.length > 0 ? (
              project.labels.map(label => (
                <DropdownItem
                  key={label._id}
                  active={labelFilter.includes(label._id)}
                  onClick={() => toggleLabelFilter(label._id)}
                >
                  <div className="flex items-center">
                    <div
                      className="w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: label.labelColorId.colorHex }}
                    />
                    {label.name}
                  </div>
                </DropdownItem>
              ))
            ) : (
              <div className="px-4 py-2 text-sm text-[var(--text-tertiary)]">No labels found</div>
            )}
          </Dropdown>
        </div>
      </div>

      {/* Project Settings Modal */}
      {project && (
        <ProjectSettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          project={project}
          currentUser={currentUser}
          onUpdateProject={handleUpdateProject}
          onDeleteProject={handleDeleteProject}
          onAddMember={handleAddMember}
          onRemoveMember={handleRemoveMember}
          onUpdateMemberRole={handleUpdateMemberRole}
        />
      )}

      {/* Board Content */}
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={filteredTaskGroups.map(group => group._id)}
          strategy={horizontalListSortingStrategy}
        >
          <div className="flex space-x-4 overflow-x-auto pb-4">
            {filteredTaskGroups.map((list) => (
              <SortableTaskList
                key={list._id}
                list={list}
                onUpdateTask={handleUpdateTask}
                onDeleteTask={handleDeleteTask}
                onCreateTask={handleCreateTask}
                onDeleteList={handleDeleteList}
                onUpdateList={handleUpdateList}
                onTaskClick={handleTaskClick} // Pass this down
                isDragOverlay={!!(activeId && (list.tasks || []).some((t: Task) => t._id === activeId))}
              />
            ))}
            <div className="flex-shrink-0">
              <AddList onCreateList={handleCreateList} />
            </div>
          </div>
        </SortableContext>
      </DndContext>

      {/* Task Detail Modal */}
      {selectedTask && project && (
        <TaskDetailModal
          isOpen={!!selectedTask}
          onClose={handleCloseModal}
          task={selectedTask}
          project={project}

          onUpdateTask={(taskId, updates) => {
            handleUpdateTask(taskId, updates);
            // Update local selected task state to reflect changes immediately in modal
            setSelectedTask(prev => prev ? { ...prev, ...updates } : null);
          }}
          onDeleteTask={handleDeleteTask}
          onUpdateProject={(updatedProject) => setProject(updatedProject)}
        />
      )}
    </div>
  );
};
