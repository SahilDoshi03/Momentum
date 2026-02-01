'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/Button';
import { CheckCircle, Sort, Search, Filter, Flag, Tags, Trash } from '@/components/icons';
import { ProfileIcon } from '@/components/ui/ProfileIcon';
import { cn } from '@/lib/utils';
import { apiClient, Task, Project } from '@/lib/api';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';
import { TaskDetailModal } from './TaskDetailModal';
import { Dropdown, DropdownItem, DropdownHeader, DropdownDivider } from '@/components/ui/Dropdown';
import { useQuery } from '@tanstack/react-query';

type TaskStatus = 'all' | 'complete' | 'incomplete';
type TaskSort = 'none' | 'dueDate' | 'project' | 'name' | 'priority';
type Priority = 'low' | 'medium' | 'high';

export const MyTasks: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [statusFilter, setStatusFilter] = useState<TaskStatus>('all');
  const [sortBy, setSortBy] = useState<TaskSort>('none');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
  const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>([]);
  const [selectedPriorities, setSelectedPriorities] = useState<Priority[]>([]);

  const [filtersLoaded, setFiltersLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Modal state
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Load filters from localStorage
  useEffect(() => {
    const savedFilters = localStorage.getItem('momentum_my_tasks_filters_v2');
    if (savedFilters) {
      try {
        const parsed = JSON.parse(savedFilters);
        if (parsed.statusFilter) setStatusFilter(parsed.statusFilter);
        if (parsed.sortBy) setSortBy(parsed.sortBy);
        if (parsed.selectedProjectIds) setSelectedProjectIds(parsed.selectedProjectIds);
        if (parsed.selectedLabelIds) setSelectedLabelIds(parsed.selectedLabelIds);
        if (parsed.selectedPriorities) setSelectedPriorities(parsed.selectedPriorities);
      } catch (e) {
        console.error('Failed to parse saved filters', e);
      }
    }
    setFiltersLoaded(true);
  }, []);

  // Save filters to localStorage
  useEffect(() => {
    if (filtersLoaded) {
      localStorage.setItem('momentum_my_tasks_filters_v2', JSON.stringify({
        statusFilter,
        sortBy,
        selectedProjectIds,
        selectedLabelIds,
        selectedPriorities
      }));
    }
  }, [statusFilter, sortBy, selectedProjectIds, selectedLabelIds, selectedPriorities, filtersLoaded]);

  const clearFilters = () => {
    setStatusFilter('all');
    setSortBy('none');
    setSelectedProjectIds([]);
    setSelectedLabelIds([]);
    setSelectedPriorities([]);
    setSearchQuery('');
  };

  const hasActiveFilters = statusFilter !== 'all' || sortBy !== 'none' || selectedProjectIds.length > 0 || selectedLabelIds.length > 0 || selectedPriorities.length > 0 || searchQuery !== '';

  // Fetch projects for filter
  const { data: projectsData } = useQuery({
    queryKey: ['projects-minimal'],
    queryFn: async () => {
      const response = await apiClient.getProjects();
      return response.data || [];
    }
  });

  // Extract labels from tasks for filtering
  const allAvailableLabels = useMemo(() => {
    const labelMap = new Map();
    tasks.forEach(task => {
      task.labels?.forEach(label => {
        if (label.projectLabelId && !labelMap.has(label.projectLabelId._id)) {
          labelMap.set(label.projectLabelId._id, label.projectLabelId);
        }
      });
    });
    return Array.from(labelMap.values());
  }, [tasks]);

  // Load tasks on component mount
  useEffect(() => {
    const loadTasks = async () => {
      try {
        setIsLoading(true);
        // Fetch all tasks for local filtering/sorting
        const response = await apiClient.getMyTasks('ALL', 'NONE', '', [], []);
        if (response.success && response.data) {
          setTasks(response.data.tasks);
        }
      } catch (error: unknown) {
        console.error('Failed to load tasks:', error);
        toast.error('Failed to load tasks');
      } finally {
        setIsLoading(false);
      }
    };

    loadTasks();
  }, []); // Only fetch on mount

  // We filter & sort based on the MOST UP TO DATE state of each task in the tasks array
  const filteredTasks = useMemo(() => {
    let result = tasks.filter(task => {
      // 1. Filter by status
      if (statusFilter === 'incomplete' && task.complete) return false;
      if (statusFilter === 'complete' && !task.complete) return false;

      // 2. Filter by project
      if (selectedProjectIds.length > 0) {
        const projectId = (typeof task.taskGroupId !== 'string' && task.taskGroupId?.projectId)
          ? (typeof task.taskGroupId.projectId === 'string' ? task.taskGroupId.projectId : task.taskGroupId.projectId._id)
          : null;
        if (!projectId || !selectedProjectIds.includes(projectId)) return false;
      }

      // 3. Filter by labels
      if (selectedLabelIds.length > 0) {
        const hasMatchingLabel = task.labels?.some(l =>
          l.projectLabelId && selectedLabelIds.includes(l.projectLabelId._id)
        );
        if (!hasMatchingLabel) return false;
      }

      // 4. Filter by priority
      if (selectedPriorities.length > 0) {
        if (!selectedPriorities.includes(task.priority)) return false;
      }

      // 5. Filter by search
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!task.name.toLowerCase().includes(query)) return false;
      }

      return true;
    });

    // 5. Apply Sorting
    if (sortBy === 'dueDate') {
      result.sort((a, b) => {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      });
    } else if (sortBy === 'project') {
      result.sort((a, b) => {
        const projA = (typeof a.taskGroupId !== 'string' && typeof a.taskGroupId?.projectId !== 'string') ? (a.taskGroupId?.projectId?.name || '') : '';
        const projB = (typeof b.taskGroupId !== 'string' && typeof b.taskGroupId?.projectId !== 'string') ? (b.taskGroupId?.projectId?.name || '') : '';
        return projA.localeCompare(projB);
      });
    } else if (sortBy === 'priority') {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      result.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
    } else {
      // Default: sort by newest created first roughly, or keep original order
      // (assuming original order from backend is useful)
    }

    return result;
  }, [tasks, statusFilter, selectedProjectIds, selectedLabelIds, selectedPriorities, searchQuery, sortBy]);

  const toggleProjectId = (id: string) => {
    setSelectedProjectIds(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const toggleLabelId = (id: string) => {
    setSelectedLabelIds(prev =>
      prev.includes(id) ? prev.filter(l => l !== id) : [...prev, id]
    );
  };

  const togglePriorityId = (p: Priority) => {
    setSelectedPriorities(prev =>
      prev.includes(p) ? prev.filter(item => item !== p) : [...prev, p]
    );
  };

  const isOverdue = (dueDate: string) => {
    return dayjs(dueDate).isBefore(dayjs(), 'day');
  };

  const isDueSoon = (dueDate: string) => {
    return dayjs(dueDate).isBefore(dayjs().add(1, 'day'), 'day');
  };

  const handleTaskClick = async (task: Task) => {
    try {
      setSelectedTask(task);
      setIsModalOpen(true);

      // Get the project ID from the populated taskGroupId
      const projectId = (typeof task.taskGroupId !== 'string' && typeof task.taskGroupId?.projectId !== 'string')
        ? task.taskGroupId?.projectId?._id
        : (typeof task.taskGroupId !== 'string' ? task.taskGroupId?.projectId : null);

      if (projectId && typeof projectId === 'string') {
        const response = await apiClient.getProjectById(projectId);
        if (response.success && response.data) {
          setSelectedProject(response.data);
        }
      }
    } catch (error) {
      console.error('Failed to load project for task:', error);
    }
  };

  const handleUpdateTask = (taskId: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(t => t._id === taskId ? { ...t, ...updates } : t));
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks(prev => prev.filter(t => t._id !== taskId));
    setIsModalOpen(false);
  };

  const handleUpdatePriority = async (taskId: string, priority: Priority) => {
    try {
      // Optimistic update
      setTasks(currentTasks =>
        currentTasks.map(t => t._id === taskId ? { ...t, priority } : t)
      );

      const response = await apiClient.updateTask(taskId, { priority });
      if (!response.success) {
        toast.error('Failed to update priority');
        // Rollback would require fetching or keeping old state
      }
    } catch (error) {
      console.error('Failed to update priority:', error);
      toast.error('Failed to update priority');
    }
  };

  const handleDirectDelete = async (e: React.MouseEvent, taskId: string) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this task?')) return;

    try {
      const response = await apiClient.deleteTask(taskId);
      if (response.success) {
        setTasks(prev => prev.filter(t => t._id !== taskId));
        toast.success('Task deleted');
      } else {
        toast.error('Failed to delete task');
      }
    } catch (error) {
      console.error('Failed to delete task:', error);
      toast.error('Failed to delete task');
    }
  };

  const toggleTaskCompletion = async (e: React.MouseEvent, task: Task) => {
    e.stopPropagation();
    try {
      const newStatus = !task.complete;

      // OPTIMISTIC UPDATE: Update the local state immediately
      setTasks(currentTasks =>
        currentTasks.map(t => t._id === task._id ? { ...t, complete: newStatus } : t)
      );

      const response = await apiClient.updateTask(task._id, { complete: newStatus });
      if (response.success) {
        toast.success(newStatus ? 'Task completed' : 'Task marked as incomplete');
      } else {
        // Rollback on failure
        setTasks(currentTasks =>
          currentTasks.map(t => t._id === task._id ? { ...t, complete: !newStatus } : t)
        );
        toast.error('Failed to update task');
      }
    } catch (error) {
      console.error('Failed to update task:', error);
      toast.error('Failed to update task status');
    }
  };

  if (isLoading && tasks.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary)] mx-auto"></div>
          <p className="mt-2 text-[var(--text-primary)]">Loading tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-secondary)]">My Tasks</h1>
            <p className="text-[var(--text-primary)]">Tasks assigned to you</p>
          </div>
          {isLoading && tasks.length > 0 && (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[var(--primary)]"></div>
          )}
        </div>

        {/* Search */}
        <div className="relative w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search width={16} height={16} className="text-[var(--text-tertiary)]" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-[var(--border)] rounded-md leading-5 bg-[var(--bg-secondary)] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] focus:border-[var(--primary)] sm:text-sm"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
            }}
          />
          {searchQuery && (
            <button
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
              onClick={() => {
                setSearchQuery('');
              }}
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Filters & Tabs */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        {/* Status Dropdown */}
        <Dropdown
          trigger={
            <Button variant="ghost" size="sm" className="bg-[var(--bg-secondary)] border border-[var(--border)]">
              <CheckCircle width={16} height={16} className="mr-2" />
              {statusFilter === 'all' ? 'All Tasks' : statusFilter === 'complete' ? 'Complete' : 'Incomplete'}
              <span className="ml-2 opacity-50 text-xs">▼</span>
            </Button>
          }
        >
          <DropdownHeader>Status</DropdownHeader>
          <DropdownItem active={statusFilter === 'all'} onClick={() => setStatusFilter('all')}>
            All Tasks
          </DropdownItem>
          <DropdownItem active={statusFilter === 'incomplete'} onClick={() => setStatusFilter('incomplete')}>
            Incomplete
          </DropdownItem>
          <DropdownItem active={statusFilter === 'complete'} onClick={() => setStatusFilter('complete')}>
            Complete
          </DropdownItem>
        </Dropdown>

        {/* Priority Dropdown */}
        <Dropdown
          trigger={
            <Button variant="ghost" size="sm" className={cn(
              "bg-[var(--bg-secondary)] border border-[var(--border)]",
              selectedPriorities.length > 0 && "text-[var(--primary)] border-[var(--primary)]"
            )}>
              <Flag width={16} height={16} className="mr-2" />
              Priority
              {selectedPriorities.length > 0 && <span className="ml-1 font-bold">({selectedPriorities.length})</span>}
              <span className="ml-2 opacity-50 text-xs">▼</span>
            </Button>
          }
        >
          <DropdownHeader>Filter by Priority</DropdownHeader>
          {(['high', 'medium', 'low'] as Priority[]).map(p => (
            <DropdownItem
              key={p}
              onClick={() => togglePriorityId(p)}
              className="flex items-center"
            >
              <div className="flex items-center flex-1 capitalize">
                <Flag
                  width={14}
                  height={14}
                  className={cn(
                    "mr-2",
                    p === 'high' ? 'text-red-500' : p === 'medium' ? 'text-yellow-500' : 'text-blue-500'
                  )}
                />
                {p}
              </div>
              {selectedPriorities.includes(p) && <CheckCircle width={12} height={12} className="text-[var(--success)] ml-2" />}
            </DropdownItem>
          ))}
        </Dropdown>

        {/* Labels Dropdown */}
        <Dropdown
          trigger={
            <Button variant="ghost" size="sm" className={cn(
              "bg-[var(--bg-secondary)] border border-[var(--border)]",
              selectedLabelIds.length > 0 && "text-[var(--primary)] border-[var(--primary)]"
            )}>
              <Tags width={16} height={16} className="mr-2" />
              Labels
              {selectedLabelIds.length > 0 && <span className="ml-1 font-bold">({selectedLabelIds.length})</span>}
              <span className="ml-2 opacity-50 text-xs">▼</span>
            </Button>
          }
        >
          <DropdownHeader>Filter by Labels</DropdownHeader>
          {allAvailableLabels.length === 0 ? (
            <div className="px-4 py-2 text-xs text-[var(--text-tertiary)] italic">No labels in current tasks</div>
          ) : (
            allAvailableLabels.map(label => (
              <DropdownItem
                key={label._id}
                onClick={() => toggleLabelId(label._id)}
                className="flex items-center"
              >
                <div className="flex items-center flex-1">
                  <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: label.labelColorId.colorHex }} />
                  {label.name}
                </div>
                {selectedLabelIds.includes(label._id) && <CheckCircle width={12} height={12} className="text-[var(--success)] ml-2" />}
              </DropdownItem>
            ))
          )}
        </Dropdown>

        {/* Projects Dropdown */}
        <Dropdown
          trigger={
            <Button variant="ghost" size="sm" className={cn(
              "bg-[var(--bg-secondary)] border border-[var(--border)]",
              selectedProjectIds.length > 0 && "text-[var(--primary)] border-[var(--primary)]"
            )}>
              <Filter width={16} height={16} className="mr-2" />
              Projects
              {selectedProjectIds.length > 0 && <span className="ml-1 font-bold">({selectedProjectIds.length})</span>}
              <span className="ml-2 opacity-50 text-xs">▼</span>
            </Button>
          }
        >
          <DropdownHeader>Filter by Projects</DropdownHeader>
          {projectsData?.length ? (
            projectsData.map(project => (
              <DropdownItem
                key={project._id}
                onClick={() => toggleProjectId(project._id)}
                className="flex items-center"
              >
                <span className="flex-1">{project.name}</span>
                {selectedProjectIds.includes(project._id) && <CheckCircle width={12} height={12} className="text-[var(--success)] ml-2" />}
              </DropdownItem>
            ))
          ) : (
            <div className="px-4 py-2 text-xs text-[var(--text-tertiary)] italic">No projects found</div>
          )}
        </Dropdown>

        <DropdownDivider className="hidden md:block mx-1" />

        {/* Sort Dropdown */}
        <Dropdown
          trigger={
            <Button variant="ghost" size="sm" className="bg-[var(--bg-secondary)] border border-[var(--border)]">
              <Sort width={16} height={16} className="mr-2" />
              Sort: {sortBy === 'none' ? 'Default' : sortBy === 'dueDate' ? 'Due Date' : sortBy === 'project' ? 'Project' : 'Name'}
              <span className="ml-2 opacity-50 text-xs">▼</span>
            </Button>
          }
        >
          <DropdownHeader>Sort Order</DropdownHeader>
          <DropdownItem active={sortBy === 'none'} onClick={() => setSortBy('none')}>
            Default (Newest First)
          </DropdownItem>
          <DropdownItem active={sortBy === 'dueDate'} onClick={() => setSortBy('dueDate')}>
            Due Date
          </DropdownItem>
          <DropdownItem active={sortBy === 'project'} onClick={() => setSortBy('project')}>
            Project Name
          </DropdownItem>
          <DropdownItem active={sortBy === 'name'} onClick={() => setSortBy('name')}>
            Task Name
          </DropdownItem>
          <DropdownItem active={sortBy === 'priority'} onClick={() => setSortBy('priority')}>
            Priority (High to Low)
          </DropdownItem>
        </Dropdown>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 ml-auto"
          >
            Clear All
          </Button>
        )}
      </div>

      {/* Tasks Table */}
      <div className={cn(
        "bg-[var(--bg-secondary)] rounded-lg overflow-hidden",
        isLoading && tasks.length === 0 ? "opacity-60" : "opacity-100"
      )}>
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 p-4 text-sm font-medium text-[var(--text-primary)]">
          <div className="col-span-5">Task name</div>
          <div className="col-span-2">Due date</div>
          <div className="col-span-3">Project</div>
          <div className="col-span-1 text-center">Priority</div>
          <div className="col-span-1 text-right">Actions</div>
        </div>

        <div className="">
          {filteredTasks.map((task) => (
            <div
              key={task._id}
              onClick={() => handleTaskClick(task)}
              className="grid grid-cols-12 gap-4 p-4 border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-primary)] transition-colors cursor-pointer items-center"
            >
              {/* Task Name */}
              <div className="col-span-5 flex items-center space-x-3">
                <button
                  onClick={(e) => toggleTaskCompletion(e, task)}
                  className="text-[var(--text-primary)] hover:text-[var(--success)] shrink-0"
                >
                  {(() => {
                    const status = task.complete ? 'complete' : 'incomplete';
                    return (
                      <CheckCircle
                        width={16}
                        height={16}
                        className={cn(
                          task.complete ? 'text-[var(--success)]' : 'text-[var(--text-primary)]'
                        )}
                      />
                    );
                  })()}
                </button>
                <div className="flex flex-col min-w-0">
                  <span className={cn(
                    'text-[var(--text-primary)] font-medium truncate',
                    task.complete && 'line-through opacity-50'
                  )}>
                    {task.name}
                  </span>
                  {task.labels && task.labels.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {task.labels.map(l => (
                        l.projectLabelId && (
                          <div
                            key={l._id}
                            className="h-1 w-4 rounded-full"
                            style={{ backgroundColor: l.projectLabelId.labelColorId.colorHex }}
                            title={l.projectLabelId.name}
                          />
                        )
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Due Date */}
              <div className="col-span-2 flex items-center">
                {task.dueDate ? (
                  <span className={cn(
                    'text-xs px-2 py-1 rounded inline-flex items-center font-medium',
                    isOverdue(task.dueDate) ? 'bg-[var(--danger)] text-white' :
                      isDueSoon(task.dueDate) ? 'bg-[var(--warning)] text-white' :
                        'bg-[var(--bg-primary)] text-[var(--text-primary)] border border-[var(--border)]'
                  )}>
                    {dayjs(task.dueDate).format(task.hasTime ? 'MMM D [at] h:mm A' : 'MMM D')}
                  </span>
                ) : (
                  <span className="text-[var(--text-tertiary)] text-xs italic">No due date</span>
                )}
              </div>

              {/* Project */}
              <div className="col-span-3 flex items-center">
                <span className="text-xs font-semibold text-[var(--text-secondary)] bg-[var(--bg-secondary)] px-2 py-1 rounded-full truncate border border-[var(--border)] max-w-full">
                  {(() => {
                    const tg = task.taskGroupId;
                    if (tg && typeof tg !== 'string') {
                      const proj = tg.projectId;
                      if (proj && typeof proj !== 'string') return proj.name;
                      if (typeof proj === 'string') return proj;
                    }
                    return 'Unknown Project';
                  })()}
                </span>
              </div>

              {/* Priority Selector */}
              <div className="col-span-1 flex justify-center">
                <Dropdown
                  trigger={
                    <button
                      onClick={(e) => e.stopPropagation()}
                      className="p-1 rounded hover:bg-[var(--bg-secondary)] transition-colors"
                    >
                      <Flag
                        width={16}
                        height={16}
                        className={cn(
                          task.priority === 'high' ? 'text-red-500' :
                            task.priority === 'medium' ? 'text-yellow-500' : 'text-blue-500'
                        )}
                      />
                    </button>
                  }
                >
                  <DropdownHeader>Set Priority</DropdownHeader>
                  {(['high', 'medium', 'low'] as Priority[]).map(p => (
                    <DropdownItem
                      key={p}
                      active={task.priority === p}
                      onClick={() => handleUpdatePriority(task._id, p)}
                      className="flex items-center capitalize"
                    >
                      <Flag
                        width={14}
                        height={14}
                        className={cn(
                          "mr-2",
                          p === 'high' ? 'text-red-500' : p === 'medium' ? 'text-yellow-500' : 'text-blue-500'
                        )}
                      />
                      {p}
                    </DropdownItem>
                  ))}
                </Dropdown>
              </div>

              {/* Actions */}
              <div className="col-span-1 flex justify-end">
                <button
                  onClick={(e) => handleDirectDelete(e, task._id)}
                  className="p-1.5 text-[var(--text-tertiary)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-md transition-all"
                  title="Delete task"
                >
                  <Trash width={16} height={16} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredTasks.length === 0 && (
          <div className="p-8 text-center">
            <p className="text-[var(--text-primary)]">No tasks found</p>
          </div>
        )}
      </div>

      {/* Task Details Modal */}
      {selectedTask && selectedProject && (
        <TaskDetailModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          task={selectedTask}
          project={selectedProject}
          onUpdateTask={handleUpdateTask}
          onDeleteTask={handleDeleteTask}
        />
      )}
    </div>
  );
};
