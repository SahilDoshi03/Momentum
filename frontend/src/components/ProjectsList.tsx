'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { toast } from 'react-toastify';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Plus } from '@/components/icons';
import { cn } from '@/lib/utils';
import mockData from '@/data/mock-data.json';

export const ProjectsList: React.FC = () => {
  const [showNewProject, setShowNewProject] = useState(false);
  const [showNewTeam, setShowNewTeam] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newTeamName, setNewTeamName] = useState('');

  const { projects, teams } = mockData;

  // Separate personal and team projects
  const personalProjects = projects.filter(p => p.team === null);
  const teamProjects = teams.map(team => ({
    ...team,
    projects: projects.filter(p => p.team?.id === team.id)
  }));

  const handleCreateProject = () => {
    if (newProjectName.trim()) {
      console.log('Creating project:', newProjectName);
      toast.success(`Project "${newProjectName}" created successfully!`);
      setNewProjectName('');
      setShowNewProject(false);
    }
  };

  const handleCreateTeam = () => {
    if (newTeamName.trim()) {
      console.log('Creating team:', newTeamName);
      toast.success(`Team "${newTeamName}" created successfully!`);
      setNewTeamName('');
      setShowNewTeam(false);
    }
  };

  const projectColors = ['#e362e3', '#7a6ff0', '#37c5ab', '#aa62e3', '#e8384f'];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-secondary)]">Projects</h1>
          <p className="text-[var(--text-primary)]">Manage your projects and teams</p>
        </div>
        <Button
          onClick={() => setShowNewTeam(true)}
          variant="outline"
        >
          <Plus width={16} height={16} className="mr-2" />
          Add Team
        </Button>
      </div>

      {/* Personal Projects */}
      {personalProjects.length > 0 && (
        <div className="mb-12">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
            Personal Projects
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {personalProjects.map((project, index) => (
              <Link
                key={project.id}
                href={`/project/${project.id}`}
                className="group"
              >
                <div
                  className="h-24 rounded-lg p-4 text-white relative overflow-visible hover:scale-105 transition-transform project-card"
                  style={{ backgroundColor: projectColors[index % projectColors.length] }}
                >
                  <div className="absolute inset-0 bg-black/15 rounded-lg" />
                  <div className="relative z-10 h-full flex flex-col justify-center">
                    <h3 className="font-semibold text-lg leading-tight text-clip-fix">{project.name}</h3>
                    <p className="text-sm opacity-90 mt-1">{project.shortId}</p>
                  </div>
                </div>
              </Link>
            ))}
            
            {/* Create new project tile */}
            <button
              onClick={() => setShowNewProject(true)}
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
      )}

      {/* Team Projects */}
      {teamProjects.map((team) => (
        <div key={team.id} className="mb-12">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
                {team.name}
              </h2>
            </div>
            <div className="flex flex-wrap gap-2 ml-4">
              <Link href={`/teams/${team.id}`}>
                <Button variant="outline" size="sm">Projects</Button>
              </Link>
              <Link href={`/teams/${team.id}/members`}>
                <Button variant="outline" size="sm">Members</Button>
              </Link>
              <Link href={`/teams/${team.id}/settings`}>
                <Button variant="outline" size="sm">Settings</Button>
              </Link>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {team.projects.map((project, index) => (
              <Link
                key={project.id}
                href={`/project/${project.id}`}
                className="group"
              >
                <div
                  className="h-24 rounded-lg p-4 text-white relative overflow-visible hover:scale-105 transition-transform project-card"
                  style={{ backgroundColor: projectColors[index % projectColors.length] }}
                >
                  <div className="absolute inset-0 bg-black/15 rounded-lg" />
                  <div className="relative z-10 h-full flex flex-col justify-center">
                    <h3 className="font-semibold text-lg leading-tight text-clip-fix">{project.name}</h3>
                    <p className="text-sm opacity-90 mt-1">{project.shortId}</p>
                  </div>
                </div>
              </Link>
            ))}
            
            {/* Create new project tile for team */}
            <button
              onClick={() => setShowNewProject(true)}
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
            >
              Cancel
            </Button>
            <Button onClick={handleCreateProject}>
              Create Project
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
            >
              Cancel
            </Button>
            <Button onClick={handleCreateTeam}>
              Create Team
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
