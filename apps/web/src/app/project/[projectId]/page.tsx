'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { TopNavbar } from '@/components/TopNavbar';
import { ProjectBoard } from '@/components/ProjectBoard';
import { apiClient, Project } from '@/lib/api';

export default function ProjectPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const response = await apiClient.getProjectById(projectId);
        if (response.success && response.data) {
          setProject(response.data);
        } else {
          setError(true);
        }
      } catch (err) {
        console.error('Failed to fetch project:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      fetchProject();
    }
  }, [projectId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)]">
        <TopNavbar />
        <div className="flex items-center justify-center h-[calc(100vh-3rem)]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary)]"></div>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)]">
        <TopNavbar />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-[var(--text-secondary)] mb-2">Project not found</h1>
            <p className="text-[var(--text-primary)]">The project you&apos;re looking for doesn&apos;t exist or you don&apos;t have permission to view it.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <TopNavbar projectName={project.name} projectID={projectId} />
      <ProjectBoard projectId={projectId} />
    </div>
  );
}
