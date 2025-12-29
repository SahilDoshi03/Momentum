import React from 'react';
import { render, screen } from '@testing-library/react';
import ProjectPage from '@/app/project/[projectId]/page';
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
        getProjectById: jest.fn(),
    }
}));

jest.mock('@/components/TopNavbar', () => ({
    TopNavbar: ({ projectName, projectID }: any) => <div data-testid="top-navbar">{projectName} - {projectID}</div>,
}));

jest.mock('@/components/ProjectBoard', () => ({
    ProjectBoard: ({ projectId }: any) => <div data-testid="project-board">{projectId}</div>,
}));

describe('ProjectPage', () => {
    const mockProjectId = 'proj-123';

    beforeEach(() => {
        jest.clearAllMocks();
        (useParams as jest.Mock).mockReturnValue({ projectId: mockProjectId });
    });

    it('renders loading state', () => {
        (useQuery as jest.Mock).mockReturnValue({
            data: undefined,
            isLoading: true,
            isError: false
        });

        render(<ProjectPage />);
        // Helper to find spinner or loading indicator
        expect(screen.queryByTestId('top-navbar')).not.toBeTheDocument; // Should check for actual loading UI
        // In the component, loading renders a spinner.
        // We can check for the absence of main content
        expect(screen.queryByTestId('project-board')).not.toBeInTheDocument();
    });

    it('renders error state when project not found', () => {
        (useQuery as jest.Mock).mockReturnValue({
            data: undefined,
            isLoading: false,
            isError: true
        });

        render(<ProjectPage />);
        expect(screen.getByText('Project not found')).toBeInTheDocument();
    });

    it('renders project board when data is loaded', () => {
        const mockProject = { id: mockProjectId, name: 'My Project' };
        (useQuery as jest.Mock).mockReturnValue({
            data: mockProject,
            isLoading: false,
            isError: false
        });

        render(<ProjectPage />);

        expect(screen.getByTestId('top-navbar')).toHaveTextContent('My Project - proj-123');
        expect(screen.getByTestId('project-board')).toHaveTextContent('proj-123');
    });
});
