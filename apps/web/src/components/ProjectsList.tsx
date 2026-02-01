'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { toast } from 'react-toastify';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { Input } from '@/components/ui/Input';
import { Plus, Trash, CheckCircle } from '@/components/icons';
import { apiClient, Project, Team } from '@/lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/Skeleton';

const ProjectsListSkeleton = () => {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <Skeleton width={150} height={32} className="mb-2" />
          <Skeleton width={250} height={20} />
        </div>
        <div className="flex items-center space-x-2">
          <Skeleton width={100} height={40} />
          <Skeleton width={120} height={40} />
        </div>
      </div>

      {/* Personal Projects Skeleton */}
      <div className="mb-12">
        <Skeleton width={150} height={28} className="mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} height={96} className="rounded-lg" />
          ))}
        </div>
      </div>

      {/* Team Section Skeleton */}
      {[1, 2].map((i) => (
        <div key={i} className="mb-12">
          <div className="flex items-start justify-between mb-4">
            <Skeleton width={120} height={28} />
            <div className="flex gap-2">
              <Skeleton width={80} height={32} />
              <Skeleton width={80} height={32} />
              <Skeleton width={80} height={32} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[1, 2, 3].map((j) => (
              <Skeleton key={j} height={96} className="rounded-lg" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export const ProjectsList: React.FC = () => {
  const [showNewProject, setShowNewProject] = useState(false);
  const [showNewTeam, setShowNewTeam] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newTeamName, setNewTeamName] = useState('');

  // UI State
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  // Fetch projects
  const { data: projects = [], isPending: isProjectsPending } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const response = await apiClient.getProjects();
      return response.data || [];
    }
  });

  // Fetch teams
  const { data: teams = [], isPending: isTeamsPending } = useQuery({
    queryKey: ['teams'],
    queryFn: async () => {
      const response = await apiClient.getTeams();
      return response.data || [];
    }
  });

  const isPending = isProjectsPending || isTeamsPending;

  // Derived state
  const personalProjects = projects.filter((p: Project) => !p.teamId);
  const teamProjects = teams.map((team: Team) => ({
    ...team,
    projects: projects.filter((p: Project) =>
      (typeof p.teamId === 'string' ? p.teamId : p.teamId?._id) === team._id
    )
  }));

  const queryClient = useQueryClient();

  const createProjectMutation = useMutation({
    mutationFn: (data: { name: string; teamId?: string }) =>
      apiClient.createProject(data),
    onSuccess: (response) => {
      if (response.success) {
        queryClient.invalidateQueries({ queryKey: ['projects'] });
        toast.success(`Project "${response.data?.name}" created successfully!`);
        setNewProjectName('');
        setSelectedTeamId(null);
        setShowNewProject(false);
      }
    },
    onError: () => {
      toast.error('Failed to create project');
    }
  });

  const createTeamMutation = useMutation({
    mutationFn: (data: { name: string }) =>
      apiClient.createTeam(data),
    onSuccess: (response) => {
      if (response.success) {
        queryClient.invalidateQueries({ queryKey: ['teams'] });
        toast.success(`Team "${response.data?.name}" created successfully!`);
        setNewTeamName('');
        setShowNewTeam(false);
      }
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Failed to create team';
      console.error('Failed to create team:', error);
      toast.error(message);
    }
  });

  const deleteProjectMutation = useMutation({
    mutationFn: (id: string) => apiClient.deleteProject(id),
    onMutate: async (deletedProjectId) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: ['projects'] });

      // Snapshot the previous value
      const previousProjects = queryClient.getQueryData<Project[]>(['projects']);

      // Optimistically update to remove the project
      if (previousProjects) {
        queryClient.setQueryData<Project[]>(['projects'], (old) =>
          old ? old.filter((p) => p._id !== deletedProjectId) : []
        );
      }

      // Close modal immediately for better UX
      setShowDeleteConfirm(false);
      setProjectToDelete(null);

      // Return a context object with the snapshotted value
      return { previousProjects };
    },
    onSuccess: (_, id) => {
      // No need to invalidate immediately if we trust the optimistic update, 
      // but good practice to eventually sync. 
      // We already closed the modal in onMutate.
      toast.success('Project deleted successfully');
    },
    onError: (err, newTodo, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousProjects) {
        queryClient.setQueryData(['projects'], context.previousProjects);
      }
      toast.error('Failed to delete project');
      // Re-open modal or show error state if needed, but simple rollback is often enough or just toast
    },
    onSettled: () => {
      // Always refetch after error or success:
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  const handleDeleteProject = async () => {
    if (projectToDelete) {
      deleteProjectMutation.mutate(projectToDelete._id);
    }
  };

  const handleCreateProject = async () => {
    if (newProjectName.trim()) {
      createProjectMutation.mutate({
        name: newProjectName,
        teamId: selectedTeamId || undefined
      });
    }
  };

  const handleCreateTeam = async () => {
    if (newTeamName.trim()) {
      createTeamMutation.mutate({
        name: newTeamName,
      });
    }
  };

  const projectColors = ['#e362e3', '#7a6ff0', '#37c5ab', '#aa62e3', '#e8384f'];

  if (isPending) {
    return <ProjectsListSkeleton />;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-secondary)]">Projects</h1>
          <p className="text-[var(--text-primary)]">Manage your projects and teams</p>
        </div>
        <div className="flex items-center space-x-2">
          <Link href="/tasks">
            <Button variant="primary" className="flex items-center">
              <CheckCircle width={16} height={16} className="mr-2" />
              My Tasks
            </Button>
          </Link>
          <Button
            onClick={() => setShowNewTeam(true)}
            variant="outline"
          >
            <Plus width={16} height={16} className="mr-2" />
            Add Team
          </Button>
        </div>
      </div>

      {/* Personal Projects */}
      <div className="mb-12">
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
          Personal Projects
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {personalProjects.map((project, index) => (
            <div key={project._id} className="relative group">
              <Link
                href={`/project/${project._id}`}
                className="block"
              >
                <div
                  className="h-24 rounded-lg p-4 text-white relative overflow-visible hover:scale-105 transition-transform project-card"
                  style={{ backgroundColor: projectColors[index % projectColors.length] }}
                >
                  <div className="absolute inset-0 bg-black/15 rounded-lg" />
                  <div className="relative z-10 h-full flex flex-col justify-center">
                    <h3 className="font-semibold text-lg leading-tight text-clip-fix">{project.name}</h3>
                  </div>
                </div>
              </Link>
              {project.currentUserRole === 'owner' && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setProjectToDelete(project);
                    setShowDeleteConfirm(true);
                  }}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-black/20 text-white opacity-100 md:opacity-0 md:group-hover:opacity-100 md:pointer-events-none md:group-hover:pointer-events-auto hover:bg-black/40 transition-all z-20"
                  title="Delete project"
                >
                  <Trash width={14} height={14} />
                </button>
              )}
            </div>
          ))}

          {/* Create new project tile */}
          <button
            onClick={() => {
              setSelectedTeamId(null);
              setShowNewProject(true);
            }}
            className="h-24 rounded-lg border-2 border-dashed border-[var(--border)] bg-[var(--bg-secondary)] hover:border-[var(--primary)] hover:bg-[var(--bg-primary)] transition-colors flex items-center justify-center group"
          >
            <div className="text-center">
              <Plus width={24} height={24} className="mx-auto mb-2 text-[var(--text-primary)] group-hover:text-[var(--primary)]" />
              <span className="text-sm text-[var(--text-primary)] group-hover:text-[var(--primary)]">
                Create new project
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* Team Projects */}
      {teamProjects.map((team) => (
        <div key={team._id} className="mb-12">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
                {team.name}
              </h2>
            </div>
            <div className="flex flex-wrap gap-2 ml-4">
              <Link href={`/teams/${team._id}`}>
                <Button variant="outline" size="sm">Projects</Button>
              </Link>
              <Link href={`/teams/${team._id}/members`}>
                <Button variant="outline" size="sm">Members</Button>
              </Link>
              <Link href={`/teams/${team._id}/settings`}>
                <Button variant="outline" size="sm">Settings</Button>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {team.projects.map((project: Project, index: number) => (
              <div key={project._id} className="relative group">
                <Link
                  href={`/project/${project._id}`}
                  className="block"
                >
                  <div
                    className="h-24 rounded-lg p-4 text-white relative overflow-visible hover:scale-105 transition-transform project-card"
                    style={{ backgroundColor: projectColors[index % projectColors.length] }}
                  >
                    <div className="absolute inset-0 bg-black/15 rounded-lg" />
                    <div className="relative z-10 h-full flex flex-col justify-center">
                      <h3 className="font-semibold text-lg leading-tight text-clip-fix">{project.name}</h3>
                    </div>
                  </div>
                </Link>
                {project.currentUserRole === 'owner' && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setProjectToDelete(project);
                      setShowDeleteConfirm(true);
                    }}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-black/20 text-white opacity-100 md:opacity-0 md:group-hover:opacity-100 md:pointer-events-none md:group-hover:pointer-events-auto hover:bg-black/40 transition-all z-20"
                    title="Delete project"
                  >
                    <Trash width={14} height={14} />
                  </button>
                )}
              </div>
            ))}

            {/* Create new project tile for team */}
            <button
              onClick={() => {
                setSelectedTeamId(team._id);
                setShowNewProject(true);
              }}
              className="h-24 rounded-lg border-2 border-dashed border-[var(--border)] bg-[var(--bg-secondary)] hover:border-[var(--primary)] hover:bg-[var(--bg-primary)] transition-colors flex items-center justify-center group"
            >
              <div className="text-center">
                <Plus width={24} height={24} className="mx-auto mb-2 text-[var(--text-primary)] group-hover:text-[var(--primary)]" />
                <span className="text-sm text-[var(--text-primary)] group-hover:text-[var(--primary)]">
                  Create new project
                </span>
              </div>
            </button>
          </div>
        </div>
      ))}

      {/* New Project Modal */}
      <Modal
        isOpen={showNewProject}
        onClose={() => setShowNewProject(false)}
        title="Create New Project"
      >
        <div className="space-y-4">
          <Input
            label="Project Name"
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            placeholder="Enter project name"
          />
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setShowNewProject(false)}
              disabled={createProjectMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateProject}
              disabled={createProjectMutation.isPending}
            >
              {createProjectMutation.isPending ? 'Creating...' : 'Create Project'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* New Team Modal */}
      <Modal
        isOpen={showNewTeam}
        onClose={() => setShowNewTeam(false)}
        title="Create New Team"
      >
        <div className="space-y-4">
          <Input
            label="Team Name"
            value={newTeamName}
            onChange={(e) => setNewTeamName(e.target.value)}
            placeholder="Enter team name"
          />
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setShowNewTeam(false)}
              disabled={createTeamMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateTeam}
              disabled={createTeamMutation.isPending}
            >
              {createTeamMutation.isPending ? 'Creating...' : 'Create Team'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Project Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setProjectToDelete(null);
        }}
        onConfirm={handleDeleteProject}
        title="Delete Project"
        message={
          <p>
            Are you sure you want to delete the project <strong>{projectToDelete?.name}</strong>? This action cannot be undone and will delete all tasks and data associated with this project.
          </p>
        }
        confirmText="Delete Project"
        variant="danger"
        isLoading={deleteProjectMutation.isPending}
      />
    </div>
  );
};
