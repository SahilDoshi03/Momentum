'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { ProfileIcon } from '@/components/ui/ProfileIcon';
import { Plus, Settings, UserPlus } from '@/components/icons';
import { cn } from '@/lib/utils';
import mockData from '@/data/mock-data.json';

interface Team {
  id: string;
  name: string;
  organizationID: string;
  members: Array<{
    id: string;
    username: string;
    fullName: string;
    email: string;
    initials: string;
    role: string;
  }>;
}

interface TeamDetailsProps {
  team: Team;
}

export const TeamDetails: React.FC<TeamDetailsProps> = ({ team }) => {
  const [activeTab, setActiveTab] = useState<'projects' | 'members'>('projects');

  // Get team projects
  const teamProjects = mockData.projects.filter(p => p.team?.id === team.id);
  const projectColors = ['#e362e3', '#7a6ff0', '#37c5ab', '#aa62e3', '#e8384f'];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[var(--text-secondary)] mb-2">{team.name}</h1>
          <p className="text-[var(--text-primary)]">Team management and collaboration</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <UserPlus width={16} height={16} className="mr-2" />
            Invite Members
          </Button>
          <Button variant="outline" size="sm">
            <Settings width={16} height={16} className="mr-2" />
            Settings
          </Button>
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
          Projects ({teamProjects.length})
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
          Members ({team.members.length})
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

          {teamProjects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {teamProjects.map((project, index) => (
                <Link
                  key={project.id}
                  href={`/project/${project.id}`}
                  className="group"
                >
                  <div
                    className="h-24 rounded-lg p-4 text-white relative overflow-hidden hover:scale-105 transition-transform"
                    style={{ backgroundColor: projectColors[index % projectColors.length] }}
                  >
                    <div className="absolute inset-0 bg-black/15" />
                    <div className="relative z-10">
                      <h3 className="font-semibold text-lg">{project.name}</h3>
                      <p className="text-sm opacity-90">{project.shortId}</p>
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
            <Button>
              <UserPlus width={16} height={16} className="mr-2" />
              Invite Member
            </Button>
          </div>

          <div className="bg-[var(--bg-secondary)] rounded-lg overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
              {team.members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center space-x-3 p-4 bg-[var(--bg-primary)] rounded-lg hover:bg-[var(--bg-secondary)] transition-colors"
                >
                  <ProfileIcon user={member} size="md" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-[var(--text-secondary)] truncate">
                      {member.fullName}
                    </h3>
                    <p className="text-sm text-[var(--text-primary)] truncate">
                      {member.email}
                    </p>
                    <span className={cn(
                      'inline-block px-2 py-1 text-xs rounded mt-1',
                      member.role === 'ADMIN' 
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
