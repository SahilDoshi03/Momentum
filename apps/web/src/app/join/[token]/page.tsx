'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { toast } from 'react-toastify';
import { TopNavbar } from '@/components/TopNavbar';


export default function JoinTeamPage() {
    const params = useParams();
    const router = useRouter();
    const token = params.token as string;
    const queryClient = useQueryClient();

    const { data: invite, isLoading, error: queryError } = useQuery({
        queryKey: ['invite', token],
        queryFn: async () => {
            const response = await apiClient.getInviteDetails(token);
            if (!response.success || !response.data) {
                throw new Error('Invalid or expired invite link');
            }
            return response.data;
        },
        enabled: !!token,
        retry: false
    });

    const joinTeamMutation = useMutation({
        mutationFn: () => apiClient.acceptTeamInvite(token),
        onSuccess: (response) => {
            if (response.success) {
                toast.success('Successfully joined team!');
                // Invalidate projects and user queries to refresh UI
                queryClient.invalidateQueries({ queryKey: ['projects'] });
                queryClient.invalidateQueries({ queryKey: ['currentUser'] });
                router.push('/');
            }
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onError: (error: any) => {
            const message = error?.message || 'Failed to join team';
            toast.error(message);
        }
    });

    const handleJoinTeam = () => {
        joinTeamMutation.mutate();
    };

    const joining = joinTeamMutation.isPending;
    const error = queryError ? (queryError as Error).message : '';

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

    if (error) {
        return (
            <div className="min-h-screen bg-[var(--bg-primary)]">
                <TopNavbar />
                <div className="flex items-center justify-center h-[calc(100vh-3rem)]">
                    <div className="text-center max-w-md px-4">
                        <h1 className="text-2xl font-bold text-[var(--danger)] mb-2">Invite Error</h1>
                        <p className="text-[var(--text-primary)] mb-6">{error}</p>
                        <Button onClick={() => router.push('/')}>Go Home</Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--bg-primary)]">
            <TopNavbar />
            <div className="flex items-center justify-center h-[calc(100vh-3rem)]">
                <div className="bg-[var(--bg-secondary)] p-8 rounded-lg border border-[var(--border)] max-w-md w-full text-center shadow-lg">
                    <h1 className="text-2xl font-bold text-[var(--text-secondary)] mb-2">Join Team</h1>
                    <p className="text-[var(--text-primary)] mb-6">
                        You have been invited to join <strong>{invite?.teamId.name}</strong>
                    </p>

                    <div className="flex flex-col space-y-3">
                        <Button
                            size="lg"
                            onClick={handleJoinTeam}
                            disabled={joining}
                            className="w-full"
                        >
                            {joining ? 'Joining...' : 'Join Team'}
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={() => router.push('/')}
                            className="w-full"
                        >
                            Cancel
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
