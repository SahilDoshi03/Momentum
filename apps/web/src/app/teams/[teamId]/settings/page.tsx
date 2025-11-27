'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { TopNavbar } from '@/components/TopNavbar';
import { apiClient, Team } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { toast } from 'react-toastify';

export default function TeamSettingsPage() {
    const params = useParams();
    const router = useRouter();
    const teamId = params.teamId as string;
    const [team, setTeam] = useState<Team | null>(null);
    const [loading, setLoading] = useState(true);
    const [name, setName] = useState('');

    useEffect(() => {
        const fetchTeam = async () => {
            try {
                const response = await apiClient.getTeamById(teamId);
                if (response.success && response.data) {
                    setTeam(response.data);
                    setName(response.data.name);
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

    const handleSave = async () => {
        if (!team) return;
        try {
            const response = await apiClient.updateTeam(teamId, { name });
            if (response.success) {
                toast.success('Team updated successfully');
                setTeam(prev => prev ? { ...prev, name } : null);
            }
        } catch (error) {
            console.error('Failed to update team:', error);
            toast.error('Failed to update team');
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this team?')) return;
        try {
            const response = await apiClient.deleteTeam(teamId);
            if (response.success) {
                toast.success('Team deleted successfully');
                router.push('/');
            }
        } catch (error) {
            console.error('Failed to delete team:', error);
            toast.error('Failed to delete team');
        }
    };

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
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--bg-primary)]">
            <TopNavbar />
            <div className="max-w-4xl mx-auto px-4 py-8">
                <h1 className="text-2xl font-bold text-[var(--text-secondary)] mb-6">
                    Team Settings
                </h1>

                <div className="space-y-6">
                    <div className="bg-[var(--bg-secondary)] rounded-lg border border-[var(--border)] p-6">
                        <h2 className="text-lg font-medium text-[var(--text-secondary)] mb-4">General</h2>
                        <div className="space-y-4">
                            <Input
                                label="Team Name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                            <Button onClick={handleSave} disabled={name === team.name}>
                                Save Changes
                            </Button>
                        </div>
                    </div>

                    <div className="bg-[var(--bg-secondary)] rounded-lg border border-[var(--border)] p-6">
                        <h2 className="text-lg font-medium text-red-500 mb-4">Danger Zone</h2>
                        <Button
                            variant="outline"
                            className="text-red-500 border-red-500 hover:bg-red-50"
                            onClick={handleDelete}
                        >
                            Delete Team
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
