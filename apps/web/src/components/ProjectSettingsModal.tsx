import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-toastify';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { apiClient, Project, User } from '@/lib/api';
import { Plus, X } from '@/components/icons';
import { useQuery } from '@tanstack/react-query';

const EMPTY_ARRAY: User[] = [];

interface ProjectSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    project: Project;
    currentUser: User | null;
    onUpdateProject: (updates: Partial<Project>) => Promise<void>;
    onDeleteProject: () => Promise<void>;
    onAddMember: (userId: string) => Promise<void>;
    onRemoveMember: (userId: string) => Promise<void>;
    onUpdateMemberRole: (userId: string, role: string) => Promise<void>;
}

export const ProjectSettingsModal: React.FC<ProjectSettingsModalProps> = ({
    isOpen,
    onClose,
    project,
    currentUser,
    onUpdateProject,
    onDeleteProject,
    onAddMember,
    onRemoveMember,
    onUpdateMemberRole,
}) => {
    const [activeTab, setActiveTab] = useState<'general' | 'members'>('general');
    const [projectName, setProjectName] = useState(project.name);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // Member search state
    const [searchQuery, setSearchQuery] = useState('');
    // Removed searchResults state to prevent infinite loop

    useEffect(() => {
        setProjectName(project.name);
    }, [project]);

    // Fetch team members for search
    const { data: teamMembersData, isFetching: isSearching } = useQuery({
        queryKey: ['team-members', typeof project.teamId === 'string' ? project.teamId : project.teamId?._id],
        queryFn: async () => {
            const teamId = typeof project.teamId === 'string' ? project.teamId : project.teamId?._id;
            if (!teamId) return [];
            const response = await apiClient.getTeamMembers(teamId);
            return response.data || [];
        },
        enabled: activeTab === 'members' && !!(typeof project.teamId === 'string' ? project.teamId : project.teamId?._id),
    });

    const teamMembers = teamMembersData || EMPTY_ARRAY;

    // Filter members based on search query
    const searchResults = useMemo(() => {
        if (!teamMembers.length) {
            return EMPTY_ARRAY;
        }

        const existingMemberIds = project.members?.map(m => m.userId._id) || [];
        const query = searchQuery.toLowerCase();

        return teamMembers
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .map((tm: any) => tm.userId)
            .filter((user: User) =>
                !existingMemberIds.includes(user._id) &&
                (user.fullName.toLowerCase().includes(query) ||
                    user.email.toLowerCase().includes(query))
            );
    }, [searchQuery, teamMembers, project.members]);

    const handleSaveGeneral = async () => {
        if (projectName.trim() !== project.name) {
            await onUpdateProject({ name: projectName });
            toast.success('Project updated successfully');
        }
    };

    const isOwner = project.members?.find(m => m.userId._id === currentUser?._id)?.role === 'owner';
    const isAdmin = project.members?.find(m => m.userId._id === currentUser?._id)?.role === 'admin';
    const canManageMembers = isOwner || isAdmin;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Project Settings"
            className="max-w-2xl"
        >
            <div className="flex flex-col h-[500px]">
                {/* Tabs */}
                <div className="flex border-b border-[var(--border)] mb-4">
                    <button
                        className={`px-4 py-2 text-sm font-medium ${activeTab === 'general'
                            ? 'text-[var(--primary)] border-b-2 border-[var(--primary)]'
                            : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                            }`}
                        onClick={() => setActiveTab('general')}
                    >
                        General
                    </button>
                    <button
                        className={`px-4 py-2 text-sm font-medium ${activeTab === 'members'
                            ? 'text-[var(--primary)] border-b-2 border-[var(--primary)]'
                            : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                            }`}
                        onClick={() => setActiveTab('members')}
                    >
                        Members
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto">
                    {activeTab === 'general' && (
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                                    Project Name
                                </label>
                                <div className="flex gap-2">
                                    <Input
                                        value={projectName}
                                        onChange={(e) => setProjectName(e.target.value)}
                                        placeholder="Project Name"
                                    />
                                    <Button onClick={handleSaveGeneral} disabled={projectName === project.name}>
                                        Save
                                    </Button>
                                </div>
                            </div>

                            {isOwner && (
                                <div className="pt-6 border-t border-[var(--border)]">
                                    <h3 className="text-lg font-medium text-red-500 mb-2">Danger Zone</h3>
                                    <p className="text-sm text-[var(--text-secondary)] mb-4">
                                        Deleting a project is permanent and cannot be undone.
                                    </p>
                                    {!showDeleteConfirm ? (
                                        <Button
                                            variant="outline"
                                            className="text-red-500 border-red-500 hover:bg-red-50"
                                            onClick={() => setShowDeleteConfirm(true)}
                                        >
                                            Delete Project
                                        </Button>
                                    ) : (
                                        <div className="bg-red-50 p-4 rounded-md border border-red-200">
                                            <p className="text-sm text-red-700 mb-3">
                                                Are you absolutely sure? This will delete all tasks and data.
                                            </p>
                                            <div className="flex gap-2">
                                                <Button
                                                    className="bg-red-600 hover:bg-red-700 text-white"
                                                    onClick={onDeleteProject}
                                                >
                                                    Yes, Delete Project
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    onClick={() => setShowDeleteConfirm(false)}
                                                >
                                                    Cancel
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'members' && (
                        <div className="space-y-6">
                            {/* Add Member Section */}
                            {canManageMembers && (
                                <div className="relative">
                                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                                        Add Member from Team
                                    </label>
                                    <Input
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search team members..."
                                        icon={<Plus width={16} height={16} />}
                                        onFocus={() => {
                                            if (searchResults.length === 0 && !searchQuery) {
                                                // Trigger search to show all available team members
                                                setSearchQuery('');
                                            }
                                        }}
                                    />

                                    {/* Search Results Dropdown */}
                                    {(searchQuery || searchResults.length > 0) && (
                                        <div className="absolute z-10 w-full mt-1 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-md shadow-lg max-h-60 overflow-y-auto">
                                            {isSearching ? (
                                                <div className="p-4 text-center text-sm text-[var(--text-tertiary)]">
                                                    Loading team members...
                                                </div>
                                            ) : searchResults.length > 0 ? (
                                                searchResults.map(user => (
                                                    <button
                                                        key={user._id}
                                                        className="w-full text-left px-4 py-2 hover:bg-[var(--bg-primary)] flex items-center gap-3"
                                                        onClick={() => {
                                                            onAddMember(user._id);
                                                            setSearchQuery('');
                                                        }}
                                                    >
                                                        <div
                                                            className="w-8 h-8 rounded-full flex items-center justify-center text-xs text-white"
                                                            style={{ backgroundColor: user.profileIcon?.bgColor || '#000' }}
                                                        >
                                                            {user.initials}
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-medium text-[var(--text-primary)]">
                                                                {user.fullName}
                                                            </div>
                                                            <div className="text-xs text-[var(--text-tertiary)]">
                                                                {user.email}
                                                            </div>
                                                        </div>
                                                    </button>
                                                ))
                                            ) : (
                                                <div className="p-4 text-center text-sm text-[var(--text-tertiary)]">
                                                    <p>No matching team members found.</p>
                                                    <p className="mt-2">
                                                        Need to add someone new?{' '}
                                                        <a
                                                            href={`/teams/${typeof project.teamId === 'string' ? project.teamId : project.teamId?._id}/members`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-[var(--primary)] hover:underline"
                                                        >
                                                            Invite them to the Team first
                                                        </a>
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Members List */}
                            <div>
                                <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-3">
                                    Project Members ({project.members?.length || 0})
                                </h3>
                                <div className="space-y-2">
                                    {project.members?.map((member) => (
                                        <div
                                            key={member._id}
                                            className="flex items-center justify-between p-3 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border)]"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs text-white"
                                                    style={{ backgroundColor: member.userId.profileIcon?.bgColor || '#000' }}
                                                >
                                                    {member.userId.initials}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-medium text-[var(--text-primary)]">
                                                        {member.userId.fullName}
                                                    </div>
                                                    {canManageMembers && member.role !== 'owner' ? (
                                                        <select
                                                            value={member.role}
                                                            onChange={(e) => onUpdateMemberRole(member.userId._id, e.target.value)}
                                                            className="text-xs bg-[var(--bg-primary)] border border-[var(--border)] rounded px-1 py-0.5 text-[var(--text-secondary)] focus:outline-none focus:border-[var(--primary)]"
                                                        >
                                                            <option value="admin">Admin</option>
                                                            <option value="member">Member</option>
                                                            <option value="observer">Observer</option>
                                                        </select>
                                                    ) : (
                                                        <div className="text-xs text-[var(--text-tertiary)] capitalize">
                                                            {member.role}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {canManageMembers && member.role !== 'owner' && (
                                                <button
                                                    onClick={() => onRemoveMember(member.userId._id)}
                                                    className="text-[var(--text-tertiary)] hover:text-red-500 p-1"
                                                    title="Remove member"
                                                >
                                                    <X width={16} height={16} />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
};
