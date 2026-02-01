'use client';

import React, { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { TopNavbar } from '@/components/TopNavbar';
import { ProjectBoard } from '@/components/ProjectBoard';
import { apiClient } from '@/lib/api';
import { ProjectBoardSkeleton } from '@/components/ProjectBoardSkeleton';
import { useSocket } from '@/providers/SocketProvider';

export default function ProjectPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const queryClient = useQueryClient();
  const { socket, isConnected } = useSocket();

  const { data: project, isLoading, isError } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const response = await apiClient.getProjectById(projectId);
      if (!response.success || !response.data) {
        throw new Error('Failed to fetch project');
      }
      return response.data;
    },
    enabled: !!projectId,
    retry: false
  });

  // Socket logic for real-time updates
  useEffect(() => {
    if (!socket || !isConnected || !projectId) return;

    // Join the project room
    socket.emit('join_project', projectId);

    // Listen for updates
    const handleUpdate = (data: any) => {
      console.log('Real-time update received:', data);

      // Invalidate the project query to trigger a re-fetch
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });

      // Also invalidate 'my-tasks' just in case the user is looking at them
      queryClient.invalidateQueries({ queryKey: ['my-tasks'] });
    };

    socket.on('task_updated', handleUpdate);
    socket.on('project_updated', handleUpdate);

    return () => {
      socket.emit('leave_project', projectId);
      socket.off('task_updated', handleUpdate);
      socket.off('project_updated', handleUpdate);
    };
  }, [socket, isConnected, projectId, queryClient]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)]">
        <TopNavbar />
        <ProjectBoardSkeleton />
      </div>
    );
  }

  if (isError || !project) {
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
