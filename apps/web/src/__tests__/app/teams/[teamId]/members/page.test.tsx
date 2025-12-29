import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import TeamMembersPage from '@/app/teams/[teamId]/members/page';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Mocks
jest.mock('next/navigation', () => ({
    useParams: jest.fn(),
}));

jest.mock('@tanstack/react-query', () => ({
    useQuery: jest.fn(),
    useMutation: jest.fn(),
    useQueryClient: jest.fn(),
}));

jest.mock('@/lib/api', () => ({
    apiClient: {
        getTeamById: jest.fn(),
        getTeamMembers: jest.fn(),
        getCurrentUser: jest.fn(),
        createTeamInvite: jest.fn(),
    }
}));

jest.mock('@/components/TopNavbar', () => ({
    TopNavbar: () => <div data-testid="top-navbar" />,
}));

jest.mock('@/components/ui/Button', () => ({
    Button: ({ children, onClick }: any) => <button onClick={onClick}>{children}</button>,
}));

jest.mock('@/components/ui/Input', () => ({
    Input: (props: any) => <input data-testid="invite-input" {...props} />,
}));

describe('TeamMembersPage', () => {
    const mockTeamId = 'team-123';

    beforeEach(() => {
        jest.clearAllMocks();
        (useParams as jest.Mock).mockReturnValue({ teamId: mockTeamId });
        (useQueryClient as jest.Mock).mockReturnValue({
            setQueryData: jest.fn(),
        });

        // Mock clipboard
        Object.assign(navigator, {
            clipboard: {
                writeText: jest.fn(),
            },
        });
    });

    it('renders loading state', () => {
        (useQuery as jest.Mock).mockReturnValue({ isLoading: true });
        render(<TeamMembersPage />);
        // Spinner checks (omitted for brevity, basic rendering check)
        expect(screen.queryByText('Invite Members')).not.toBeInTheDocument();
    });

    it('renders team not found', () => {
        (useQuery as jest.Mock).mockImplementation(({ queryKey }) => {
            if (queryKey[0] === 'team') return { data: null, isLoading: false };
            return { data: [], isLoading: false };
        });

        render(<TeamMembersPage />);
        expect(screen.getByText('Team not found')).toBeInTheDocument();
    });

    it('renders members and invite section', () => {
        const mockTeam = { id: mockTeamId, name: 'Best Team' };
        const mockMembers = [
            { _id: 'm1', userId: { _id: 'u1', fullName: 'User One', email: 'u1@test.com' }, role: 'owner' },
            { _id: 'm2', userId: { _id: 'u2', fullName: 'User Two', email: 'u2@test.com' }, role: 'member' }
        ];

        (useQuery as jest.Mock).mockImplementation(({ queryKey }) => {
            if (queryKey[0] === 'team') return { data: mockTeam, isLoading: false };
            if (queryKey[0] === 'team-members') return { data: mockMembers, isLoading: false };
            if (queryKey[0] === 'currentUser') return { data: { _id: 'u1' } };
            return { data: undefined };
        });

        (useMutation as jest.Mock).mockReturnValue({ mutate: jest.fn(), mutateAsync: jest.fn() });

        render(<TeamMembersPage />);

        expect(screen.getByText('Best Team Members')).toBeInTheDocument();
        expect(screen.getByText('User One')).toBeInTheDocument();
        expect(screen.getByText('User Two')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Enter email address...')).toBeInTheDocument();
    });
});
