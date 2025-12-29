import React from 'react';
import { render, screen } from '@testing-library/react';
import TeamPage from '@/app/teams/[teamId]/page';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';

// Mocks
jest.mock('next/navigation', () => ({
    useParams: jest.fn(),
}));

jest.mock('@tanstack/react-query', () => ({
    useQuery: jest.fn(),
}));

jest.mock('@/lib/api', () => ({
    apiClient: {
        getTeamById: jest.fn(),
    }
}));

jest.mock('@/components/TopNavbar', () => ({
    TopNavbar: ({ breadcrumbs }: any) => <div data-testid="top-navbar">{breadcrumbs ? breadcrumbs[0].label : 'Navbar'}</div>,
}));

jest.mock('@/components/TeamDetails', () => ({
    TeamDetails: ({ team }: any) => <div data-testid="team-details">{team.name}</div>,
}));

describe('TeamPage', () => {
    const mockTeamId = 'team-123';

    beforeEach(() => {
        jest.clearAllMocks();
        (useParams as jest.Mock).mockReturnValue({ teamId: mockTeamId });
    });

    it('renders loading state', () => {
        (useQuery as jest.Mock).mockReturnValue({
            data: undefined,
            isLoading: true,
            isError: false
        });

        render(<TeamPage />);
        // Loading spins
        expect(screen.queryByTestId('team-details')).not.toBeInTheDocument();
    });

    it('renders error state', () => {
        (useQuery as jest.Mock).mockReturnValue({
            data: undefined,
            isLoading: false,
            isError: true
        });

        render(<TeamPage />);
        expect(screen.getByText('Team not found')).toBeInTheDocument();
    });

    it('renders team details when loaded', () => {
        const mockTeam = { id: mockTeamId, name: 'Best Team' };
        (useQuery as jest.Mock).mockReturnValue({
            data: mockTeam,
            isLoading: false,
            isError: false
        });

        render(<TeamPage />);
        expect(screen.getByTestId('top-navbar')).toHaveTextContent('Best Team');
        expect(screen.getByTestId('team-details')).toHaveTextContent('Best Team');
    });
});
