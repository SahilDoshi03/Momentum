import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ProjectSettingsModal } from '../../components/ProjectSettingsModal';
import { apiClient } from '@/lib/api';
import '@testing-library/jest-dom';

// Mock API
jest.mock('@/lib/api', () => ({
    apiClient: {
        getTeamMembers: jest.fn(),
    },
}));

// Mock Toast
jest.mock('react-toastify', () => ({
    toast: {
        success: jest.fn(),
    },
}));

// Mock Modal
jest.mock('../../components/ui/Modal', () => ({
    Modal: ({ isOpen, children, title }: any) => (
        isOpen ? <div data-testid="modal"><h1>{title}</h1>{children}</div> : null
    ),
}));

// Mock Icons
jest.mock('@/components/icons', () => ({
    Trash: () => <div data-testid="trash-icon" />,
    Plus: () => <div data-testid="plus-icon" />,
    X: () => <div data-testid="x-icon" />,
}));

const mockUser = {
    _id: 'user1',
    fullName: 'Test User',
    email: 'test@example.com',
    initials: 'TU',
    profileIcon: { bgColor: '#000' },
};

const mockProject = {
    _id: 'p1',
    name: 'Test Project',
    teamId: 't1',
    members: [
        { _id: 'm1', userId: mockUser, role: 'owner' },
    ],
};

const mockTeamMembers = [
    { userId: { _id: 'user2', fullName: 'Other User', email: 'other@example.com', initials: 'OU' } },
];

describe('ProjectSettingsModal', () => {
    const mockOnClose = jest.fn();
    const mockOnUpdateProject = jest.fn();
    const mockOnDeleteProject = jest.fn();
    const mockOnAddMember = jest.fn();
    const mockOnRemoveMember = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        (apiClient.getTeamMembers as jest.Mock).mockResolvedValue({ success: true, data: mockTeamMembers });
    });

    it('renders correctly when open', () => {
        render(
            <ProjectSettingsModal
                isOpen={true}
                onClose={mockOnClose}
                project={mockProject as any}
                currentUser={mockUser as any}
                onUpdateProject={mockOnUpdateProject}
                onDeleteProject={mockOnDeleteProject}
                onAddMember={mockOnAddMember}
                onRemoveMember={mockOnRemoveMember}
            />
        );

        expect(screen.getByTestId('modal')).toBeInTheDocument();
        expect(screen.getByText('Project Settings')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Test Project')).toBeInTheDocument();
    });

    it('updates project name', async () => {
        render(
            <ProjectSettingsModal
                isOpen={true}
                onClose={mockOnClose}
                project={mockProject as any}
                currentUser={mockUser as any}
                onUpdateProject={mockOnUpdateProject}
                onDeleteProject={mockOnDeleteProject}
                onAddMember={mockOnAddMember}
                onRemoveMember={mockOnRemoveMember}
            />
        );

        const input = screen.getByDisplayValue('Test Project');
        fireEvent.change(input, { target: { value: 'Updated Project' } });

        fireEvent.click(screen.getByText('Save'));

        await waitFor(() => {
            expect(mockOnUpdateProject).toHaveBeenCalledWith({ name: 'Updated Project' });
        });
    });

    it('shows delete confirmation for owner', () => {
        render(
            <ProjectSettingsModal
                isOpen={true}
                onClose={mockOnClose}
                project={mockProject as any}
                currentUser={mockUser as any}
                onUpdateProject={mockOnUpdateProject}
                onDeleteProject={mockOnDeleteProject}
                onAddMember={mockOnAddMember}
                onRemoveMember={mockOnRemoveMember}
            />
        );

        expect(screen.getByText('Danger Zone')).toBeInTheDocument();

        fireEvent.click(screen.getByText('Delete Project'));

        expect(screen.getByText(/Are you absolutely sure/)).toBeInTheDocument();

        fireEvent.click(screen.getByText('Yes, Delete Project'));

        expect(mockOnDeleteProject).toHaveBeenCalled();
    });

    it('switches to members tab and loads members', async () => {
        render(
            <ProjectSettingsModal
                isOpen={true}
                onClose={mockOnClose}
                project={mockProject as any}
                currentUser={mockUser as any}
                onUpdateProject={mockOnUpdateProject}
                onDeleteProject={mockOnDeleteProject}
                onAddMember={mockOnAddMember}
                onRemoveMember={mockOnRemoveMember}
            />
        );

        fireEvent.click(screen.getByText('Members'));

        expect(screen.getByText('Project Members (1)')).toBeInTheDocument();
        expect(screen.getByText('Test User')).toBeInTheDocument();

        // Check if API was called to fetch team members for search
        await waitFor(() => {
            expect(apiClient.getTeamMembers).toHaveBeenCalledWith('t1');
        });
    });

    it('adds a member', async () => {
        render(
            <ProjectSettingsModal
                isOpen={true}
                onClose={mockOnClose}
                project={mockProject as any}
                currentUser={mockUser as any}
                onUpdateProject={mockOnUpdateProject}
                onDeleteProject={mockOnDeleteProject}
                onAddMember={mockOnAddMember}
                onRemoveMember={mockOnRemoveMember}
            />
        );

        fireEvent.click(screen.getByText('Members'));

        // Focus input to trigger search/dropdown
        const searchInput = screen.getByPlaceholderText('Search team members...');
        fireEvent.focus(searchInput);

        await waitFor(() => {
            expect(screen.getByText('Other User')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('Other User'));

        expect(mockOnAddMember).toHaveBeenCalledWith('user2');
    });

    it('removes a member', async () => {
        const projectWithTwoMembers = {
            ...mockProject,
            members: [
                ...mockProject.members,
                { _id: 'm2', userId: { _id: 'user2', fullName: 'Other User', initials: 'OU' }, role: 'member' },
            ],
        };

        render(
            <ProjectSettingsModal
                isOpen={true}
                onClose={mockOnClose}
                project={projectWithTwoMembers as any}
                currentUser={mockUser as any}
                onUpdateProject={mockOnUpdateProject}
                onDeleteProject={mockOnDeleteProject}
                onAddMember={mockOnAddMember}
                onRemoveMember={mockOnRemoveMember}
            />
        );

        fireEvent.click(screen.getByText('Members'));

        expect(screen.getByText('Other User')).toBeInTheDocument();

        // Find remove button (X icon)
        const removeButtons = screen.getAllByTitle('Remove member');
        fireEvent.click(removeButtons[0]);

        expect(mockOnRemoveMember).toHaveBeenCalledWith('user2');
    });
});
