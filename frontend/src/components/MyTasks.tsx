'use client';

import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/Button';
import { CheckCircle, Sort } from '@/components/icons';
import { ProfileIcon } from '@/components/ui/ProfileIcon';
import { apiClient } from '@/lib/api';
import dayjs from 'dayjs';

type TaskStatus = 'all' | 'complete' | 'incomplete';
type TaskSort = 'none' | 'dueDate' | 'project' | 'name';

export const MyTasks: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<TaskStatus>('all');
  const [sortBy, setSortBy] = useState<TaskSort>('none');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['recently-assigned']));

  const [allTasks, setAllTasks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch tasks on mount
  React.useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await apiClient.getMyTasks();
        if (response.success && response.data) {
          setAllTasks(response.data.tasks);
        }
      } catch (error) {
        console.error('Failed to fetch tasks:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTasks();
  }, []);

  // Filter and sort tasks
  const filteredTasks = useMemo(() => {
    let filtered = allTasks;

    // Filter by status
    if (statusFilter === 'complete') {
      filtered = filtered.filter(task => task.complete);
    } else if (statusFilter === 'incomplete') {
      filtered = filtered.filter(task => !task.complete);
    }

    // Sort tasks
    if (sortBy === 'dueDate') {
      filtered = filtered.sort((a, b) => {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return dayjs(a.dueDate.at).diff(dayjs(b.dueDate.at));
      });
    } else if (sortBy === 'project') {
      filtered = filtered.sort((a, b) => a.project.name.localeCompare(b.project.name));
    } else if (sortBy === 'name') {
      filtered = filtered.sort((a, b) => a.name.localeCompare(b.name));
    }

    return filtered;
  }, [allTasks, statusFilter, sortBy]);

  // Group tasks
  const groupedTasks = useMemo(() => {
    if (sortBy === 'project') {
      const groups: { [key: string]: typeof filteredTasks } = {};
      filteredTasks.forEach(task => {
        if (!groups[task.project.id]) {
          groups[task.project.id] = [];
        }
        groups[task.project.id].push(task);
      });
      return Object.entries(groups).map(([projectId, tasks]) => ({
        id: projectId,
        name: tasks[0].project.name,
        tasks,
      }));
    } else {
      return [{
        id: 'recently-assigned',
        name: 'Recently Assigned',
        tasks: filteredTasks,
      }];
    }
  }, [filteredTasks, sortBy]);

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  };

  const isOverdue = (dueDate: { at: string }) => {
    return dayjs(dueDate.at).isBefore(dayjs(), 'day');
  };

  const isDueSoon = (dueDate: { at: string }) => {
    return dayjs(dueDate.at).isBefore(dayjs().add(1, 'day'), 'day');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-secondary)]">My Tasks</h1>
          <p className="text-[var(--text-primary)]">Tasks assigned to you</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4 mb-6">
        <div className="flex items-center space-x-2">
          <Button
            variant={statusFilter === 'all' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setStatusFilter('all')}
          >
            <CheckCircle width={16} height={16} className="mr-2" />
            All Tasks
          </Button>
          <Button
            variant={statusFilter === 'incomplete' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setStatusFilter('incomplete')}
          >
            Incomplete
          </Button>
          <Button
            variant={statusFilter === 'complete' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setStatusFilter('complete')}
          >
            Complete
          </Button>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant={sortBy === 'none' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setSortBy('none')}
          >
            <Sort width={16} height={16} className="mr-2" />
            Sort
          </Button>
          <Button
            variant={sortBy === 'dueDate' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setSortBy('dueDate')}
          >
            Due Date
          </Button>
          <Button
            variant={sortBy === 'project' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setSortBy('project')}
          >
            Project
          </Button>
          <Button
            variant={sortBy === 'name' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setSortBy('name')}
          >
            Name
          </Button>
        </div>
      </div>

      {/* Tasks Table */}
      <div className="bg-[var(--bg-secondary)] rounded-lg overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 p-4 border-b border-[var(--border)] text-sm font-medium text-[var(--text-primary)]">
          <div className="col-span-6">Task name</div>
          <div className="col-span-2">Due date</div>
          <div className="col-span-2">Project</div>
          <div className="col-span-2">Members</div>
        </div>

        {/* Task Groups */}
        {groupedTasks.map((group) => (
          <div key={group.id}>
            {group.name && (
              <div className="p-4 border-b border-[var(--border)]">
                <button
                  onClick={() => toggleGroup(group.id)}
                  className="flex items-center space-x-2 text-[var(--text-primary)] hover:text-[var(--text-secondary)]"
                >
                  <span className="text-lg">
                    {expandedGroups.has(group.id) ? '▼' : '▶'}
                  </span>
                  <span className="font-medium">{group.name}</span>
                  <span className="text-sm text-[var(--text-primary)]">
                    ({group.tasks.length})
                  </span>
                </button>
              </div>
            )}

            {/* Tasks */}
            {expandedGroups.has(group.id) && (
              <div className="divide-y divide-[var(--border)]">
                {group.tasks.map((task) => (
                  <div
                    key={task.id}
                    className="grid grid-cols-12 gap-4 p-4 hover:bg-[var(--bg-primary)] transition-colors"
                  >
                    {/* Task Name */}
                    <div className="col-span-6 flex items-center space-x-3">
                      <button className="text-[var(--text-primary)] hover:text-[var(--success)]">
                        <CheckCircle
                          width={16}
                          height={16}
                          className={task.complete ? 'text-[var(--success)]' : 'text-[var(--text-primary)]'}
                        />
                      </button>
                      <span className={`text-[var(--text-primary)] ${task.complete ? 'line-through opacity-60' : ''}`}>
                        {task.name}
                      </span>
                    </div>

                    {/* Due Date */}
                    <div className="col-span-2">
                      {task.dueDate ? (
                        <span className={`text-xs px-2 py-1 rounded ${isOverdue(task.dueDate) ? 'bg-[var(--danger)] text-white' :
                          isDueSoon(task.dueDate) ? 'bg-[var(--warning)] text-white' :
                            'bg-[var(--bg-primary)] text-[var(--text-primary)]'
                          }`}>
                          {dayjs(task.dueDate.at).format(task.hasTime ? 'MMM D [at] h:mm A' : 'MMM D')}
                        </span>
                      ) : (
                        <span className="text-[var(--text-primary)] text-sm">No due date</span>
                      )}
                    </div>

                    {/* Project */}
                    <div className="col-span-2">
                      <span className="text-sm text-[var(--text-primary)] bg-[var(--bg-primary)] px-2 py-1 rounded">
                        {task.project?.name || 'Unknown Project'}
                      </span>
                    </div>

                    {/* Members */}
                    <div className="col-span-2">
                      <div className="flex -space-x-1">
                        {task.assigned?.slice(0, 3).map((assignment: any) => (
                          <ProfileIcon
                            key={assignment._id}
                            user={assignment.userId}
                            size="sm"
                            className="border-2 border-[var(--bg-secondary)]"
                          />
                        ))}
                        {(task.assigned?.length || 0) > 3 && (
                          <div className="h-6 w-6 rounded-full bg-[var(--bg-primary)] border-2 border-[var(--bg-secondary)] flex items-center justify-center text-xs text-[var(--text-primary)]">
                            +{(task.assigned?.length || 0) - 3}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* Empty State */}
        {filteredTasks.length === 0 && (
          <div className="p-8 text-center">
            <p className="text-[var(--text-primary)]">No tasks found</p>
          </div>
        )}
      </div>
    </div>
  );
};
