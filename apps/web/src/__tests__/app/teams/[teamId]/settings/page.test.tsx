import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TeamSettingsPage from '@/app/teams/[teamId]/settings/page';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Mocks
jest.mock('next/navigation', () => ({
    useParams: jest.fn(),
    useRouter: jest.fn(),
}));

jest.mock('@tanstack/react-query', () => ({
    useQuery: jest.fn(),
    useMutation: jest.fn(),
    useQueryClient: jest.fn(),
}));

jest.mock('@/lib/api', () => ({
    apiClient: {
        getTeamById: jest.fn(),
        updateTeam: jest.fn(),
        deleteTeam: jest.fn(),
    }
}));

jest.mock('@/components/TopNavbar', () => ({
    TopNavbar: () => <div data-testid="top-navbar" />,
}));


jest.mock('@/components/ui/Button', () => ({
    Button: ({ children, onClick, disabled }: any) => (
        <button onClick={onClick} disabled={disabled}>{children}</button>
    ),
}));

jest.mock('@/components/ui/Input', () => ({
    Input: ({ value, onChange, label }: any) => (
        <label>
            {label}
            <input value={value} onChange={onChange} />
        </label>
    ),
}));

describe('TeamSettingsPage', () => {
    const mockTeamId = 'team-123';
    const mockRouter = { push: jest.fn() };

    beforeEach(() => {
        jest.clearAllMocks();
        (useParams as jest.Mock).mockReturnValue({ teamId: mockTeamId });
        (useRouter as jest.Mock).mockReturnValue(mockRouter);
        (useQueryClient as jest.Mock).mockReturnValue({ setQueryData: jest.fn() });
    });

    it('renders loading state', () => {
        (useQuery as jest.Mock).mockReturnValue({ isLoading: true });
        render(<TeamSettingsPage />);
        expect(screen.queryByText('Team Settings')).not.toBeInTheDocument();
    });

    it('renders team not found', () => {
        (useQuery as jest.Mock).mockReturnValue({ data: null, isLoading: false });
        render(<TeamSettingsPage />);
        expect(screen.getByText('Team not found')).toBeInTheDocument();
    });

    it('renders settings when loaded', () => {
        const mockTeam = { id: mockTeamId, name: 'Best Team' };
        (useQuery as jest.Mock).mockReturnValue({ data: mockTeam, isLoading: false });
        (useMutation as jest.Mock).mockReturnValue({ mutate: jest.fn() });

        render(<TeamSettingsPage />);

        expect(screen.getByText('Team Settings')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Best Team')).toBeInTheDocument();
    });

    it('handles team update', () => {
        const mockTeam = { id: mockTeamId, name: 'Best Team' };
        const mockMutate = jest.fn();

        (useQuery as jest.Mock).mockReturnValue({ data: mockTeam, isLoading: false });
        // First call is update, second is delete.
        // We can just rely on ordering if we are careful or check implementation.
        // Or simpler, just mock useMutation generally.
        (useMutation as jest.Mock).mockReturnValue({ mutate: mockMutate });

        render(<TeamSettingsPage />);

        const input = screen.getByDisplayValue('Best Team');
        fireEvent.change(input, { target: { value: 'New Name' } });

        fireEvent.click(screen.getByText('Save Changes'));

        expect(mockMutate).toHaveBeenCalledWith({ name: 'New Name' });
    });
});
