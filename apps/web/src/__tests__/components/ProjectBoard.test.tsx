import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProjectBoard } from '@/components/ProjectBoard';
import { apiClient } from '@/lib/api';

// Mocks
jest.mock('@/lib/api', () => ({
    apiClient: {
        getProjectById: jest.fn(),
        getCurrentUser: jest.fn(),
        updateTask: jest.fn(),
        updateTaskGroup: jest.fn(),
    },
}));

jest.mock('@/components/SortableTaskList', () => ({
    SortableTaskList: ({ list }: any) => <div data-testid={`list-${list.name}`}>{list.name}</div>
}));

jest.mock('@/components/AddList', () => ({
    AddList: () => <button>Add List</button>
}));

jest.mock('@/components/ProjectSettingsModal', () => ({
    ProjectSettingsModal: () => <div data-testid="project-settings-modal" />
}));

describe('ProjectBoard', () => {
    const mockProject = {
        _id: '1',
        name: 'Test Project',
        taskGroups: [
            { _id: 'g1', name: 'Todo', tasks: [], position: 0 },
            { _id: 'g2', name: 'Doing', tasks: [], position: 1 }
        ]
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders loading state initially', () => {
        (apiClient.getProjectById as jest.Mock).mockReturnValue(new Promise(() => { }));
        render(<ProjectBoard projectId="1" />);
        expect(screen.getByText('Loading project...')).toBeInTheDocument();
    });

    it('renders project board with lists', async () => {
        (apiClient.getProjectById as jest.Mock).mockResolvedValue({
            success: true,
            data: mockProject
        });
        (apiClient.getCurrentUser as jest.Mock).mockResolvedValue({
            success: true,
            data: { _id: 'u1' }
        });

        render(<ProjectBoard projectId="1" />);

        await waitFor(() => {
            expect(screen.getByText('Test Project')).toBeInTheDocument();
            expect(screen.getByTestId('list-Todo')).toBeInTheDocument();
            expect(screen.getByTestId('list-Doing')).toBeInTheDocument();
        });
    });

    it('renders empty state if project not found', async () => {
        (apiClient.getProjectById as jest.Mock).mockResolvedValue({
            success: false,
            data: null
        });
        (apiClient.getCurrentUser as jest.Mock).mockResolvedValue({
            success: true,
            data: { _id: 'u1' }
        });

        render(<ProjectBoard projectId="1" />);

        await waitFor(() => {
            expect(screen.getByText('Project not found')).toBeInTheDocument();
        });
    });
});
