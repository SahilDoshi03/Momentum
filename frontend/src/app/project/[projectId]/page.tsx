'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { TopNavbar } from '@/components/TopNavbar';
import { ProjectBoard } from '@/components/ProjectBoard';
import mockData from '@/data/mock-data.json';

export default function ProjectPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  
  const project = mockData.projects.find(p => p.id === projectId);

  if (!project) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)]">
        <TopNavbar />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-[var(--text-secondary)] mb-2">Project not found</h1>
            <p className="text-[var(--text-primary)]">The project you&apos;re looking for doesn&apos;t exist.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <TopNavbar projectName={project.name} projectID={projectId} />
      <ProjectBoard project={project} />
    </div>
  );
}
