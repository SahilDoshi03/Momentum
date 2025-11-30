'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { TopNavbar } from '@/components/TopNavbar';
import { TeamDetails } from '@/components/TeamDetails';
import { apiClient, Team } from '@/lib/api';
import { toast } from 'react-toastify';

export default function TeamPage() {
  const params = useParams();
  const teamId = params.teamId as string;
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        const response = await apiClient.getTeamById(teamId);
        if (response.success && response.data) {
          setTeam(response.data);
        }
      } catch (error) {
        console.error('Failed to load team:', error);
        toast.error('Failed to load team data');
      } finally {
        setLoading(false);
      }
    };

    if (teamId) {
      fetchTeam();
    }
  }, [teamId]);

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
      <TopNavbar breadcrumbs={[{ label: team.name }]} />
      <TeamDetails team={team} />
    </div>
  );
}
