'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { TopNavbar } from '@/components/TopNavbar';
import { apiClient, User, Team } from '@/lib/api';

interface TeamMember {
    _id: string;
    userId: User;
    role: string;
}
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { toast } from 'react-toastify';
import { Trash } from '@/components/icons';
import { ProfileIcon } from '@/components/ui/ProfileIcon';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';



export default function TeamMembersPage() {
    const params = useParams();
    const teamId = params.teamId as string;
    const queryClient = useQueryClient();
    const [inviteEmail, setInviteEmail] = useState('');
    const [generatingInvite, setGeneratingInvite] = useState(false);
    const [inviteLink, setInviteLink] = useState('');
    const [memberToRemove, setMemberToRemove] = useState<TeamMember | null>(null);

    const { data: team, isLoading: isLoadingTeam } = useQuery({
        queryKey: ['team', teamId],
        queryFn: async () => {
            const response = await apiClient.getTeamById(teamId);
            return response.data || null;
        },
        enabled: !!teamId
    });

    const { data: members = [] } = useQuery({
        queryKey: ['team-members', teamId],
        queryFn: async () => {
            const response = await apiClient.getTeamMembers(teamId);
            return (response.data || []) as TeamMember[];
        },
        enabled: !!teamId
    });

    const { data: currentUser } = useQuery({
        queryKey: ['currentUser'],
        queryFn: async () => {
            const response = await apiClient.getCurrentUser();
            return response.data || null;
        }
    });

    const createInviteMutation = useMutation({
        mutationFn: (email: string) => apiClient.createTeamInvite(teamId, email),
        onSuccess: (response) => {
            if (response.success && response.data) {
                const link = `${window.location.origin}/join/${response.data.token}`;
                setInviteLink(link);
                navigator.clipboard.writeText(link);
                toast.success('Invite link generated and copied!');
            }
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onError: (error: any) => {
            const message = error?.message || 'Failed to generate invite link';
            toast.error(message);
        }
    });

    const removeMemberMutation = useMutation({
        mutationFn: (userId: string) => apiClient.removeTeamMember(teamId, userId),
        onSuccess: (_, userId) => {
            toast.success('Member removed successfully');
            queryClient.setQueryData(['team-members', teamId], (old: TeamMember[] | undefined) =>
                old ? old.filter(m => m.userId._id !== userId) : []
            );
            setMemberToRemove(null);
        },
        onError: () => {
            toast.error('Failed to remove member');
        }
    });

    const updateRoleMutation = useMutation({
        mutationFn: (variables: { userId: string; role: string }) =>
            apiClient.updateTeamMember(teamId, variables.userId, variables.role),
        onSuccess: (_, variables) => {
            toast.success('Member role updated successfully');
            queryClient.setQueryData(['team-members', teamId], (old: TeamMember[] | undefined) =>
                old ? old.map(m => m.userId._id === variables.userId ? { ...m, role: variables.role } : m) : []
            );
        },
        onError: () => {
            toast.error('Failed to update role');
        }
    });

    const handleGenerateInvite = async () => {
        if (!inviteEmail.trim()) {
            toast.error('Please enter an email address');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(inviteEmail)) {
            toast.error('Please enter a valid email address');
            return;
        }

        setGeneratingInvite(true);
        try {
            await createInviteMutation.mutateAsync(inviteEmail);
        } finally {
            setGeneratingInvite(false);
        }
    };

    const handleRemoveMember = async () => {
        if (!memberToRemove) return;
        removeMemberMutation.mutate(memberToRemove.userId._id);
    };

    const handleUpdateRole = async (userId: string, role: string) => {
        updateRoleMutation.mutate({ userId, role });
    };

    const currentUserMember = members.find(m => m.userId._id === currentUser?._id);
    const canManageMembers = currentUserMember && ['owner', 'admin'].includes(currentUserMember.role);

    if (isLoadingTeam) {
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
            <TopNavbar
                breadcrumbs={[
                    { label: team.name, href: `/teams/${teamId}` },
                    { label: 'Members' }
                ]}
            />
            <div className="max-w-4xl mx-auto px-4 py-8">
                <h1 className="text-2xl font-bold text-[var(--text-secondary)] mb-6">
                    {team.name} Members
                </h1>

                <div className="grid gap-8">
                    {/* Invite Section */}
                    <div className="bg-[var(--bg-secondary)] rounded-lg border border-[var(--border)] p-6">
                        <h2 className="text-lg font-medium text-[var(--text-secondary)] mb-4">Invite Members</h2>
                        <p className="text-sm text-[var(--text-primary)] mb-4">
                            Enter the email address of the person you want to invite. The generated link will only work for that email.
                        </p>

                        <div className="space-y-4">
                            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
                                <Input
                                    placeholder="Enter email address..."
                                    value={inviteEmail}
                                    onChange={(e) => setInviteEmail(e.target.value)}
                                    className="flex-1"
                                />
                                <Button
                                    onClick={handleGenerateInvite}
                                    disabled={generatingInvite}
                                    className="w-full sm:w-auto"
                                >
                                    {generatingInvite ? 'Generating...' : 'Generate Link'}
                                </Button>
                            </div>

                            {inviteLink && (
                                <div className="grid grid-cols-[1fr_auto] items-center gap-2 p-3 bg-[var(--bg-primary)] rounded border border-[var(--border)]">
                                    <p className="min-w-0 text-sm text-[var(--text-secondary)] truncate">{inviteLink}</p>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            navigator.clipboard.writeText(inviteLink);
                                            toast.success('Copied!');
                                        }}
                                    >
                                        Copy
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Members List */}
                    <div className="bg-[var(--bg-secondary)] rounded-lg border border-[var(--border)] overflow-hidden">
                        <div className="p-4 border-b border-[var(--border)]">
                            <h2 className="text-lg font-medium text-[var(--text-secondary)]">Team Members ({members.length})</h2>
                        </div>
                        <div className="divide-y divide-[var(--border)]">
                            {members.map((member) => (
                                <div key={member._id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-4 sm:gap-0">
                                    <div className="flex items-center space-x-3">
                                        <ProfileIcon user={member.userId} size="md" />
                                        <div>
                                            <p className="font-medium text-[var(--text-secondary)]">{member.userId.fullName}</p>
                                            <p className="text-sm text-[var(--text-tertiary)]">{member.userId.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-4">
                                        {canManageMembers && member.role !== 'owner' ? (
                                            <select
                                                value={member.role}
                                                onChange={(e) => handleUpdateRole(member.userId._id, e.target.value)}
                                                className="text-sm bg-[var(--bg-primary)] border border-[var(--border)] rounded px-2 py-1 text-[var(--text-secondary)] focus:outline-none focus:border-[var(--primary)]"
                                            >
                                                <option value="admin">Admin</option>
                                                <option value="member">Member</option>
                                                <option value="observer">Observer</option>
                                            </select>
                                        ) : (
                                            <span className="text-sm px-2 py-1 rounded bg-[var(--bg-primary)] text-[var(--text-primary)] capitalize">
                                                {member.role}
                                            </span>
                                        )}
                                        {member.role !== 'owner' && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-[var(--danger)] hover:bg-[var(--danger)]/10"
                                                onClick={() => setMemberToRemove(member)}
                                            >
                                                <Trash width={16} height={16} />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
            <ConfirmationModal
                isOpen={!!memberToRemove}
                onClose={() => setMemberToRemove(null)}
                onConfirm={handleRemoveMember}
                title="Remove Member"
                message="Are you sure you want to remove this member? They will lose access to all team projects."
                confirmText="Remove Member"
                variant="danger"
            />
        </div>
    );
}
