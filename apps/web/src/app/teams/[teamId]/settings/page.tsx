'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { TopNavbar } from '@/components/TopNavbar';
import { apiClient } from '@/lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { toast } from 'react-toastify';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';

export default function TeamSettingsPage() {
    const params = useParams();
    const router = useRouter();
    const teamId = params.teamId as string;
    const queryClient = useQueryClient();
    const { data: team, isLoading } = useQuery({
        queryKey: ['team', teamId],
        queryFn: async () => {
            const response = await apiClient.getTeamById(teamId);
            if (!response.success || !response.data) {
                throw new Error('Failed to fetch team');
            }
            return response.data;
        },
        enabled: !!teamId
    });

    const [name, setName] = useState('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    useEffect(() => {
        if (team) {
            setName(team.name);
        }
    }, [team]);

    const updateTeamMutation = useMutation({
        mutationFn: (updates: { name: string }) => apiClient.updateTeam(teamId, updates),
        onSuccess: (response) => {
            if (response.success && response.data) {
                queryClient.setQueryData(['team', teamId], response.data);
                toast.success('Team updated successfully');
            }
        },
        onError: () => {
            toast.error('Failed to update team');
        }
    });

    const deleteTeamMutation = useMutation({
        mutationFn: () => apiClient.deleteTeam(teamId),
        onSuccess: (response) => {
            if (response.success) {
                toast.success('Team deleted successfully');
                router.push('/');
            }
        },
        onError: () => {
            toast.error('Failed to delete team');
        }
    });

    const handleSave = async () => {
        if (!team) return;
        updateTeamMutation.mutate({ name });
    };

    const handleDelete = async () => {
        deleteTeamMutation.mutate();
    };

    if (isLoading) {
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
                            onClick={() => setShowDeleteConfirm(true)}
                        >
                            Delete Team
                        </Button>
                    </div>
                </div>
            </div>
            <ConfirmationModal
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={handleDelete}
                title="Delete Team"
                message="Are you sure you want to delete this team? This action cannot be undone and all projects within this team will be deleted."
                confirmText="Delete Team"
                variant="danger"
            />
        </div >
    );
}
