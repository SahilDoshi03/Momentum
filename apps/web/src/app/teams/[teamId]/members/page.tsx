'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { TopNavbar } from '@/components/TopNavbar';
import { apiClient, Team, User } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { toast } from 'react-toastify';
import { Trash, Plus, Search } from '@/components/icons';
import { ProfileIcon } from '@/components/ui/ProfileIcon';
import { useDebounce } from '@/hooks/useDebounce';

export default function TeamMembersPage() {
    const params = useParams();
    const teamId = params.teamId as string;
    const [team, setTeam] = useState<Team | null>(null);
    const [members, setMembers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<User[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const debouncedSearch = useDebounce(searchQuery, 300);

    const fetchTeamData = async () => {
        try {
            const [teamRes, membersRes] = await Promise.all([
                apiClient.getTeamById(teamId),
                apiClient.getTeamMembers(teamId)
            ]);

            if (teamRes.success && teamRes.data) {
                setTeam(teamRes.data);
            }
            if (membersRes.success && membersRes.data) {
                setMembers(membersRes.data);
            }
        } catch (error) {
            console.error('Failed to load team:', error);
            toast.error('Failed to load team data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (teamId) {
            fetchTeamData();
        }
    }, [teamId]);

    useEffect(() => {
        const searchUsers = async () => {
            if (!debouncedSearch.trim()) {
                setSearchResults([]);
                return;
            }

            setIsSearching(true);
            try {
                const response = await apiClient.searchUsers(debouncedSearch);
                if (response.success && response.data) {
                    // Filter out existing members
                    const memberIds = new Set(members.map(m => m.userId._id));
                    setSearchResults(response.data.filter(u => !memberIds.has(u._id)));
                }
            } catch (error) {
                console.error('Search failed:', error);
            } finally {
                setIsSearching(false);
            }
        };

        searchUsers();
    }, [debouncedSearch, members]);

    const handleAddMember = async (userId: string) => {
        try {
            const response = await apiClient.addTeamMember(teamId, userId);
            if (response.success) {
                toast.success('Member added successfully');
                setSearchQuery('');
                setSearchResults([]);
                // Refresh members list
                const membersRes = await apiClient.getTeamMembers(teamId);
                if (membersRes.success && membersRes.data) {
                    setMembers(membersRes.data);
                }
            }
        } catch (error) {
            console.error('Failed to add member:', error);
            toast.error('Failed to add member');
        }
    };

    const handleRemoveMember = async (userId: string) => {
        if (!confirm('Are you sure you want to remove this member?')) return;
        try {
            const response = await apiClient.removeTeamMember(teamId, userId);
            if (response.success) {
                toast.success('Member removed successfully');
                setMembers(prev => prev.filter(m => m.userId._id !== userId));
            }
        } catch (error) {
            console.error('Failed to remove member:', error);
            toast.error('Failed to remove member');
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
                    {team.name} Members
                </h1>

                <div className="grid gap-8">
                    {/* Add Member Section */}
                    <div className="bg-[var(--bg-secondary)] rounded-lg border border-[var(--border)] p-6">
                        <h2 className="text-lg font-medium text-[var(--text-secondary)] mb-4">Add Member</h2>
                        <div className="relative">
                            <Input
                                placeholder="Search users by name or email..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                icon={<Search width={16} height={16} />}
                            />

                            {/* Search Results Dropdown */}
                            {searchResults.length > 0 && (
                                <div className="absolute z-10 w-full mt-1 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-md shadow-lg max-h-60 overflow-y-auto">
                                    {searchResults.map(user => (
                                        <div
                                            key={user._id}
                                            className="flex items-center justify-between p-3 hover:bg-[var(--bg-primary)] cursor-pointer"
                                            onClick={() => handleAddMember(user._id)}
                                        >
                                            <div className="flex items-center space-x-3">
                                                <ProfileIcon user={user} size="sm" />
                                                <div>
                                                    <p className="text-sm font-medium text-[var(--text-secondary)]">{user.fullName}</p>
                                                    <p className="text-xs text-[var(--text-tertiary)]">{user.email}</p>
                                                </div>
                                            </div>
                                            <Plus width={16} height={16} className="text-[var(--primary)]" />
                                        </div>
                                    ))}
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
                                        <span className="text-sm px-2 py-1 rounded bg-[var(--bg-primary)] text-[var(--text-primary)] capitalize">
                                            {member.role}
                                        </span>
                                        {member.role !== 'owner' && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-[var(--danger)] hover:bg-[var(--danger)]/10"
                                                onClick={() => handleRemoveMember(member.userId._id)}
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
        </div>
    );
}
