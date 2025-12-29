import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { TeamDetails } from '@/components/TeamDetails';
import { apiClient } from '@/lib/api';

// Mocks
jest.mock('@/lib/api', () => ({
    apiClient: {
        getProjects: jest.fn(),
        getTeamMembers: jest.fn(),
    },
}));

jest.mock('@tanstack/react-query', () => ({
    useQuery: jest.fn(),
}));

describe('TeamDetails', () => {
    const mockTeam = {
        _id: 't1',
        name: 'Test Team',
        organizationId: 'o1',
        createdAt: '',
        updatedAt: ''
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders team info and tabs', async () => {
        const { useQuery } = require('@tanstack/react-query');
        (useQuery as jest.Mock).mockImplementation(({ queryKey }: any) => {
            if (queryKey[0] === 'team-projects') return { data: [] };
            if (queryKey[0] === 'team-members') return { data: [] };
            return { data: [] };
        });

        render(<TeamDetails team={mockTeam} />);

        expect(screen.getByText('Test Team')).toBeInTheDocument();
        expect(screen.getByText('Projects (0)')).toBeInTheDocument();
        expect(screen.getByText('Members (0)')).toBeInTheDocument();
    });

    it('fetches and displays projects', async () => {
        const { useQuery } = require('@tanstack/react-query');
        useQuery.mockImplementation(({ queryKey }: any) => {
            if (queryKey[0] === 'team-projects') return { data: [{ _id: 'p1', name: 'Project A' }] };
            if (queryKey[0] === 'team-members') return { data: [] };
            return { data: [] };
        });

        render(<TeamDetails team={mockTeam} />);

        await waitFor(() => {
            expect(screen.getByText('Project A')).toBeInTheDocument();
        });
    });
});
