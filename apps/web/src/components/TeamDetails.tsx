'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { ProfileIcon } from '@/components/ui/ProfileIcon';
import { Plus, Settings, UserPlus } from '@/components/icons';
import { cn } from '@/lib/utils';
import { apiClient, Team } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';

const projectColors = ['#e362e3', '#7a6ff0', '#37c5ab', '#aa62e3', '#e8384f'];

interface TeamDetailsProps {
  team: Team;
}



export const TeamDetails: React.FC<TeamDetailsProps> = ({ team }) => {
  const [activeTab, setActiveTab] = useState<'projects' | 'members'>('projects');
  const { data: projects = [] } = useQuery({
    queryKey: ['team-projects', team._id],
    queryFn: async () => {
      const response = await apiClient.getProjects(team._id);
      return response.data || [];
    },
    enabled: !!team._id
  });

  const { data: members = [] } = useQuery({
    queryKey: ['team-members', team._id],
    queryFn: async () => {
      const response = await apiClient.getTeamMembers(team._id);
      return response.data || [];
    },
    enabled: !!team._id
  });



  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[var(--text-secondary)] mb-2">{team.name}</h1>
          <p className="text-[var(--text-primary)]">Team management and collaboration</p>
        </div>
        <div className="flex items-center space-x-2">
          <Link href={`/teams/${team._id}/members`}>
            <Button variant="outline" size="sm">
              <UserPlus width={16} height={16} className="mr-2" />
              Manage Members
            </Button>
          </Link>
          <Link href={`/teams/${team._id}/settings`}>
            <Button variant="outline" size="sm">
              <Settings width={16} height={16} className="mr-2" />
              Settings
            </Button>
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-8 border-b border-[var(--border)]">
        <button
          onClick={() => setActiveTab('projects')}
          className={cn(
            'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
            activeTab === 'projects'
              ? 'border-[var(--primary)] text-[var(--primary)]'
              : 'border-transparent text-[var(--text-primary)] hover:text-[var(--text-secondary)]'
          )}
        >
          Projects ({projects.length})
        </button>
        <button
          onClick={() => setActiveTab('members')}
          className={cn(
            'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
            activeTab === 'members'
              ? 'border-[var(--primary)] text-[var(--primary)]'
              : 'border-transparent text-[var(--text-primary)] hover:text-[var(--text-secondary)]'
          )}
        >
          Members ({members.length})
        </button>
      </div>

      {/* Content */}
      {activeTab === 'projects' && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-[var(--text-secondary)]">Team Projects</h2>
            <Button>
              <Plus width={16} height={16} className="mr-2" />
              Create Project
            </Button>
          </div>

          {projects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {projects.map((project, index) => (
                <Link
                  key={project._id}
                  href={`/project/${project._id}`}
                  className="group"
                >
                  <div
                    className="h-24 rounded-lg p-4 text-white relative overflow-hidden hover:scale-105 transition-transform"
                    style={{ backgroundColor: projectColors[index % projectColors.length] }}
                  >
                    <div className="absolute inset-0 bg-black/15" />
                    <div className="relative z-10">
                      <h3 className="font-semibold text-lg">{project.name}</h3>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-[var(--bg-secondary)] rounded-lg flex items-center justify-center mx-auto mb-4">
                <Plus width={24} height={24} className="text-[var(--text-primary)]" />
              </div>
              <h3 className="text-lg font-medium text-[var(--text-secondary)] mb-2">No projects yet</h3>
              <p className="text-[var(--text-primary)] mb-4">Create your first project to get started</p>
              <Button>
                <Plus width={16} height={16} className="mr-2" />
                Create Project
              </Button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'members' && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-[var(--text-secondary)]">Team Members</h2>
            <Link href={`/teams/${team._id}/members`}>
              <Button>
                <UserPlus width={16} height={16} className="mr-2" />
                Manage Members
              </Button>
            </Link>
          </div>

          <div className="bg-[var(--bg-secondary)] rounded-lg overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {members.map((member: any) => (
                <div
                  key={member._id}
                  className="flex items-center space-x-3 p-4 bg-[var(--bg-primary)] rounded-lg hover:bg-[var(--bg-secondary)] transition-colors"
                >
                  <ProfileIcon user={member.userId} size="md" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-[var(--text-secondary)] truncate">
                      {member.userId.fullName}
                    </h3>
                    <p className="text-sm text-[var(--text-primary)] truncate">
                      {member.userId.email}
                    </p>
                    <span className={cn(
                      'inline-block px-2 py-1 text-xs rounded mt-1',
                      member.role === 'owner'
                        ? 'bg-[var(--primary)] text-white'
                        : 'bg-[var(--bg-secondary)] text-[var(--text-primary)]'
                    )}>
                      {member.role}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
