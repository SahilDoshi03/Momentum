'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Plus, Settings } from '@/components/icons';
import { ProjectBoard } from './ProjectBoard';
import { apiClient, Project } from '@/lib/api';
import { toast } from 'react-toastify';

export const ProjectsList: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Load projects on component mount
  useEffect(() => {
    const loadProjects = async () => {
      try {
        setIsLoading(true);
        const response = await apiClient.getProjects();
        if (response.success && response.data) {
          setProjects(response.data);
        }
      } catch (error) {
        console.error('Failed to load projects:', error);
        toast.error('Failed to load projects');
      } finally {
        setIsLoading(false);
      }
    };

    loadProjects();
  }, []);

  const handleCreateProject = async () => {
    try {
      const response = await apiClient.createProject({
        name: 'New Project',
        shortId: 'NP',
      });
      
      if (response.success && response.data) {
        setProjects(prev => [...prev, response.data]);
        setSelectedProject(response.data._id);
        toast.success('Project created successfully!');
      }
    } catch (error) {
      console.error('Failed to create project:', error);
      toast.error('Failed to create project');
    }
  };

  if (selectedProject) {
    return <ProjectBoard projectId={selectedProject} />;
  }

  if (isLoading) {
    return (
      <div className="flex-1 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary)] mx-auto"></div>
          <p className="mt-2 text-[var(--text-primary)]">Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[var(--text-secondary)]">Projects</h1>
        <Button onClick={handleCreateProject}>
          <Plus width={16} height={16} className="mr-2" />
          New Project
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <Card
            key={project._id}
            className="p-6 cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setSelectedProject(project._id)}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-[var(--text-secondary)] mb-1">
                  {project.name}
                </h3>
                <p className="text-sm text-[var(--text-primary)]">
                  {project.teamId ? 'Team Project' : 'Personal Project'}
                </p>
              </div>
              <Button variant="ghost" size="sm">
                <Settings width={16} height={16} />
              </Button>
            </div>

            <div className="flex items-center justify-between text-sm text-[var(--text-primary)]">
              <span>{project.taskGroups?.length || 0} lists</span>
              <span>{project.members?.length || 0} members</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
