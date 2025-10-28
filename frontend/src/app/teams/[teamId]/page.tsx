'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { TopNavbar } from '@/components/TopNavbar';
import { TeamDetails } from '@/components/TeamDetails';
import mockData from '@/data/mock-data.json';

export default function TeamPage() {
  const params = useParams();
  const teamId = params.teamId as string;
  
  const team = mockData.teams.find(t => t.id === teamId);

  if (!team) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)]">
        <TopNavbar />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-[var(--text-secondary)] mb-2">Team not found</h1>
            <p className="text-[var(--text-primary)]">The team you&apos;re looking for doesn&apos;t exist.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <TopNavbar projectName={team.name} />
      <TeamDetails team={team} />
    </div>
  );
}
