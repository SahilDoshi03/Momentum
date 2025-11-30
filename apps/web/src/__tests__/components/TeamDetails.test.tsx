import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TeamDetails } from '../../components/TeamDetails';
import { apiClient } from '@/lib/api';
import '@testing-library/jest-dom';

// Mock API
jest.mock('@/lib/api', () => ({
    apiClient: {
        getProjects: jest.fn(),
        getTeamMembers: jest.fn(),
    },
}));

// Mock Toast
jest.mock('react-toastify', () => ({
    toast: {
        error: jest.fn(),
    },
}));

// Mock Next Link
jest.mock('next/link', () => {
    return ({ children, href }: any) => <a href={href}>{children}</a>;
});

// Mock Icons
jest.mock('@/components/icons', () => ({
    Plus: () => <div data-testid="plus-icon" />,
    Settings: () => <div data-testid="settings-icon" />,
    UserPlus: () => <div data-testid="user-plus-icon" />,
}));

// Mock ProfileIcon
jest.mock('@/components/ui/ProfileIcon', () => ({
    ProfileIcon: () => <div data-testid="profile-icon" />,
}));

const mockTeam = {
    _id: 't1',
    name: 'Test Team',
};

const mockProjects = [
    { _id: 'p1', name: 'Project 1' },
    { _id: 'p2', name: 'Project 2' },
];

const mockMembers = [
    {
        _id: 'm1',
        userId: { _id: 'u1', fullName: 'User 1', email: 'user1@example.com' },
        role: 'owner',
    },
    {
        _id: 'm2',
        userId: { _id: 'u2', fullName: 'User 2', email: 'user2@example.com' },
        role: 'member',
    },
];

describe('TeamDetails', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (apiClient.getProjects as jest.Mock).mockResolvedValue({ success: true, data: mockProjects });
        (apiClient.getTeamMembers as jest.Mock).mockResolvedValue({ success: true, data: mockMembers });
    });

    it('renders team details and fetches data', async () => {
        render(<TeamDetails team={mockTeam as any} />);

        expect(screen.getByText('Test Team')).toBeInTheDocument();
        expect(screen.getByText('Team management and collaboration')).toBeInTheDocument();

        await waitFor(() => {
            expect(apiClient.getProjects).toHaveBeenCalledWith('t1');
            expect(apiClient.getTeamMembers).toHaveBeenCalledWith('t1');
        });

        expect(await screen.findByText('Projects (2)')).toBeInTheDocument();
        expect(screen.getByText('Members (2)')).toBeInTheDocument();
    });

    it('renders projects tab by default', async () => {
        render(<TeamDetails team={mockTeam as any} />);

        await waitFor(() => {
            expect(screen.getByText('Project 1')).toBeInTheDocument();
            expect(screen.getByText('Project 2')).toBeInTheDocument();
        });
    });

    it('switches to members tab', async () => {
        render(<TeamDetails team={mockTeam as any} />);

        await waitFor(() => {
            expect(screen.getByText('Members (2)')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('Members (2)'));

        expect(screen.getByText('Team Members')).toBeInTheDocument();
        expect(screen.getByText('User 1')).toBeInTheDocument();
        expect(screen.getByText('User 2')).toBeInTheDocument();
        expect(screen.getByText('owner')).toBeInTheDocument();
        expect(screen.getByText('member')).toBeInTheDocument();
    });

    it('handles empty projects', async () => {
        (apiClient.getProjects as jest.Mock).mockResolvedValue({ success: true, data: [] });

        render(<TeamDetails team={mockTeam as any} />);

        await waitFor(() => {
            expect(screen.getByText('No projects yet')).toBeInTheDocument();
            expect(screen.getByText('Create your first project to get started')).toBeInTheDocument();
        });
    });

    it('handles API errors', async () => {
        (apiClient.getProjects as jest.Mock).mockRejectedValue(new Error('Failed'));

        // Suppress console error for this test
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { });

        render(<TeamDetails team={mockTeam as any} />);

        await waitFor(() => {
            expect(require('react-toastify').toast.error).toHaveBeenCalledWith('Failed to load team details');
        });

        consoleSpy.mockRestore();
    });
});
