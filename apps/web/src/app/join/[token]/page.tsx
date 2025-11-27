'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { TopNavbar } from '@/components/TopNavbar';
import { toast } from 'react-toastify';

export default function JoinTeamPage() {
    const params = useParams();
    const router = useRouter();
    const token = params.token as string;

    const [invite, setInvite] = useState<{ teamId: { _id: string; name: string }; creatorId: string } | null>(null);
    const [loading, setLoading] = useState(true);
    const [joining, setJoining] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchInvite = async () => {
            try {
                const response = await apiClient.getInviteDetails(token);
                if (response.success && response.data) {
                    setInvite(response.data);
                }
            } catch (err: any) {
                console.error('Failed to load invite:', err);
                setError(err.message || 'Invalid or expired invite link');
            } finally {
                setLoading(false);
            }
        };

        if (token) {
            fetchInvite();
        }
    }, [token]);

    const handleJoinTeam = async () => {
        setJoining(true);
        try {
            const response = await apiClient.acceptTeamInvite(token);
            if (response.success) {
                toast.success('Successfully joined the team!');
                router.push(`/teams/${response.data?.teamId}`);
            }
        } catch (err: any) {
            console.error('Failed to join team:', err);
            toast.error(err.message || 'Failed to join team');
        } finally {
            setJoining(false);
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
