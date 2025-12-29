import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProjectSettingsModal } from '@/components/ProjectSettingsModal';
import { apiClient } from '@/lib/api';

// Mocks
jest.mock('@/lib/api', () => ({
    apiClient: {
        getTeamMembers: jest.fn(),
    },
}));

jest.mock('@tanstack/react-query', () => ({
    useQuery: jest.fn(),
}));

jest.mock('@/components/ui/Modal', () => ({
    Modal: ({ children, isOpen, title }: any) => isOpen ? (
        <div data-testid="modal">
            <h2>{title}</h2>
            {children}
        </div>
    ) : null
}));

describe('ProjectSettingsModal', () => {
    const mockProject = {
        _id: '1',
        name: 'Test Project',
        teamId: { _id: 't1' },
        members: []
    };
    const mockUser = {
        _id: 'u1',
        fullName: 'Current User',
        email: 'user@example.com',
        initials: 'CU',
        profileIcon: { bgColor: '#000', initials: 'CU' },
        bio: '',
        role: 'user',
        active: true,
        createdAt: '',
        updatedAt: ''
    };

    const mockProps = {
        isOpen: true,
        onClose: jest.fn(),
        project: mockProject as any,
        currentUser: mockUser,
        onUpdateProject: jest.fn(),
        onDeleteProject: jest.fn(),
        onAddMember: jest.fn(),
        onRemoveMember: jest.fn(),
        onUpdateMemberRole: jest.fn(),
    };

    beforeEach(() => {
        jest.clearAllMocks();
        const { useQuery } = require('@tanstack/react-query');
        (useQuery as jest.Mock).mockReturnValue({ data: [], isFetching: false });
    });

    it('renders general settings by default', () => {
        render(<ProjectSettingsModal {...mockProps} />);
        expect(screen.getByText('Project Settings')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Test Project')).toBeInTheDocument();
    });

    it('updates project name', async () => {
        const user = userEvent.setup();
        render(<ProjectSettingsModal {...mockProps} />);

        const input = screen.getByDisplayValue('Test Project');
        await user.clear(input);
        await user.type(input, 'New Name');
        await user.click(screen.getByText('Save'));

        expect(mockProps.onUpdateProject).toHaveBeenCalledWith({ name: 'New Name' });
    });

    it('switches to members tab', async () => {
        const user = userEvent.setup();
        render(<ProjectSettingsModal {...mockProps} />);

        await user.click(screen.getByText('Members'));

        expect(screen.getByText('Project Members (0)')).toBeInTheDocument();
    });

    it('renders delete options for owner', async () => {
        const ownerProps = {
            ...mockProps,
            project: {
                ...mockProject,
                members: [{ userId: { _id: 'u1' }, role: 'owner' }]
            } as any
        };
        const user = userEvent.setup();
        render(<ProjectSettingsModal {...ownerProps} />);

        expect(screen.getByText('Delete Project')).toBeInTheDocument();

        await user.click(screen.getByText('Delete Project'));
        expect(screen.getByText('Are you absolutely sure? This will delete all tasks and data.')).toBeInTheDocument();
    });
});
