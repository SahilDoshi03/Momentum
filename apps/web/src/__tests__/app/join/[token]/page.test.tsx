import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import JoinTeamPage from '@/app/join/[token]/page';
import { apiClient } from '@/lib/api';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Mocks
jest.mock('next/navigation', () => ({
    useParams: jest.fn(),
    useRouter: jest.fn(),
}));

jest.mock('@/lib/api', () => ({
    apiClient: {
        getInviteDetails: jest.fn(),
        acceptTeamInvite: jest.fn(),
    }
}));

jest.mock('@tanstack/react-query', () => ({
    useQuery: jest.fn(),
    useMutation: jest.fn(),
    useQueryClient: jest.fn(),
}));

jest.mock('@/components/TopNavbar', () => ({
    TopNavbar: () => <div data-testid="top-navbar" />
}));

jest.mock('@/components/ui/Button', () => ({
    Button: ({ children, ...props }: any) => <button data-testid="mock-button" {...props}>{children}</button>,
}));

describe('JoinTeamPage', () => {
    const mockRouter = { push: jest.fn() };
    const mockQueryClient = { invalidateQueries: jest.fn() };
    const mockToken = 'valid-token';

    beforeEach(() => {
        jest.clearAllMocks();
        (useParams as jest.Mock).mockReturnValue({ token: mockToken });
        (useRouter as jest.Mock).mockReturnValue(mockRouter);
        (useQueryClient as jest.Mock).mockReturnValue(mockQueryClient);

        // Default useMutation mock
        (useMutation as jest.Mock).mockReturnValue({
            mutate: jest.fn(),
            isPending: false,
        });
    });

    it('renders loading state', () => {
        (useQuery as jest.Mock).mockReturnValue({
            data: undefined,
            isLoading: true,
            error: null
        });

        render(<JoinTeamPage />);
        // Checking for loading spinner indirectly by absence of content
        expect(screen.queryByText('Join Team')).not.toBeInTheDocument();
    });

    it('renders error state', () => {
        (useQuery as jest.Mock).mockReturnValue({
            data: undefined,
            isLoading: false,
            error: new Error('Invalid invite')
        });

        render(<JoinTeamPage />);
        expect(screen.getByText('Invite Error')).toBeInTheDocument();
        expect(screen.getByText('Invalid invite')).toBeInTheDocument();
    });

    it('renders invite details', () => {
        const mockInvite = { teamId: { name: 'Awesome Team' } };
        (useQuery as jest.Mock).mockReturnValue({
            data: mockInvite,
            isLoading: false,
            error: null
        });

        render(<JoinTeamPage />);
        expect(screen.getByRole('heading', { name: 'Join Team' })).toBeInTheDocument();
        expect(screen.getByText('Awesome Team')).toBeInTheDocument();
    });

    it('handles join team action', async () => {
        const mockMutate = jest.fn();
        (useMutation as jest.Mock).mockReturnValue({
            mutate: mockMutate,
            isPending: false
        });
        const mockInvite = { teamId: { name: 'Awesome Team' } };
        (useQuery as jest.Mock).mockReturnValue({
            data: mockInvite,
            isLoading: false,
            error: null
        });

        render(<JoinTeamPage />);

        fireEvent.click(screen.getByRole('button', { name: 'Join Team' }));
        expect(mockMutate).toHaveBeenCalled();
    });
});
