'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { TopNavbar } from '@/components/TopNavbar';
import { apiClient, Team, User } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { toast } from 'react-toastify';
import { Trash } from '@/components/icons';
import { ProfileIcon } from '@/components/ui/ProfileIcon';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';

interface TeamMember {
    _id: string;
    userId: User;
    role: string;
}

export default function TeamMembersPage() {
    const params = useParams();
    const teamId = params.teamId as string;
    const [team, setTeam] = useState<Team | null>(null);
    const [members, setMembers] = useState<TeamMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteLink, setInviteLink] = useState('');
    const [generatingInvite, setGeneratingInvite] = useState(false);
    const [memberToRemove, setMemberToRemove] = useState<string | null>(null);

    const [currentUser, setCurrentUser] = useState<User | null>(null);

    const fetchTeamData = useCallback(async () => {
        try {
            const [teamRes, membersRes, userRes] = await Promise.all([
                apiClient.getTeamById(teamId),
                apiClient.getTeamMembers(teamId),
                apiClient.getCurrentUser()
            ]);

            if (teamRes.success && teamRes.data) {
                setTeam(teamRes.data);
            }
            if (membersRes.success && membersRes.data) {
                setMembers(membersRes.data as TeamMember[]);
            }
            if (userRes.success && userRes.data) {
                setCurrentUser(userRes.data);
            }
        } catch (error) {
            console.error('Failed to load team:', error);
            toast.error('Failed to load team data');
        } finally {
            setLoading(false);
        }
    }, [teamId]);

    useEffect(() => {
        if (teamId) {
            fetchTeamData();
        }
    }, [teamId, fetchTeamData]);

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
            const response = await apiClient.createTeamInvite(teamId, inviteEmail);
            if (response.success && response.data) {
                const link = `${window.location.origin}/join/${response.data.token}`;
                setInviteLink(link);
                navigator.clipboard.writeText(link);
                toast.success('Invite link generated and copied!');
            }
        } catch (error: unknown) {
            console.error('Failed to generate invite:', error);
            const message = error instanceof Error ? error.message : 'Failed to generate invite link';
            toast.error(message);
        } finally {
            setGeneratingInvite(false);
        }
    };

    const handleRemoveMember = async () => {
        if (!memberToRemove) return;
        try {
            const response = await apiClient.removeTeamMember(teamId, memberToRemove);
            if (response.success) {
                toast.success('Member removed successfully');
                setMembers(prev => prev.filter(m => m.userId._id !== memberToRemove));
                setMemberToRemove(null);
            }
        } catch (error) {
            console.error('Failed to remove member:', error);
            toast.error('Failed to remove member');
        }
    };

    const handleUpdateRole = async (userId: string, role: string) => {
        try {
            const response = await apiClient.updateTeamMember(teamId, userId, role);
            if (response.success) {
                setMembers(prev => prev.map(m => m.userId._id === userId ? { ...m, role } : m));
                toast.success('Member role updated successfully');
            }
        } catch (error) {
            console.error('Failed to update role:', error);
            toast.error('Failed to update role');
        }
    };

    const currentUserMember = members.find(m => m.userId._id === currentUser?._id);
    const canManageMembers = currentUserMember && ['owner', 'admin'].includes(currentUserMember.role);

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
                            <div className="flex space-x-3">
                                <Input
                                    placeholder="Enter email address..."
                                    value={inviteEmail}
                                    onChange={(e) => setInviteEmail(e.target.value)}
                                    className="flex-1"
                                />
                                <Button onClick={handleGenerateInvite} disabled={generatingInvite}>
                                    {generatingInvite ? 'Generating...' : 'Generate Link'}
                                </Button>
                            </div>

                            {inviteLink && (
                                <div className="flex items-center space-x-2 p-3 bg-[var(--bg-primary)] rounded border border-[var(--border)]">
                                    <p className="flex-1 text-sm text-[var(--text-secondary)] truncate">{inviteLink}</p>
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
                                <div key={member._id} className="flex items-center justify-between p-4">
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
                                                onClick={() => setMemberToRemove(member.userId._id)}
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
