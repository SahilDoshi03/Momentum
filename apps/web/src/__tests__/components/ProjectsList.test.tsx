import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { ProjectsList } from '../../components/ProjectsList';
import { apiClient } from '@/lib/api';
import '@testing-library/jest-dom';

// Mock API
jest.mock('@/lib/api', () => ({
    apiClient: {
        getProjects: jest.fn(),
        getTeams: jest.fn(),
        createProject: jest.fn(),
        createTeam: jest.fn(),
        deleteProject: jest.fn(),
    },
}));

// Mock Toast
jest.mock('react-toastify', () => ({
    toast: {
        success: jest.fn(),
        error: jest.fn(),
    },
}));

// Mock Child Components
jest.mock('../../components/ui/Modal', () => ({
    Modal: ({ isOpen, children, title }: any) => (
        isOpen ? <div data-testid="modal"><h1>{title}</h1>{children}</div> : null
    ),
}));

jest.mock('../../components/ui/ConfirmationModal', () => ({
    ConfirmationModal: ({ isOpen, onConfirm, title }: any) => (
        isOpen ? (
            <div data-testid="confirmation-modal">
                <h1>{title}</h1>
                <button onClick={onConfirm}>Confirm</button>
            </div>
        ) : null
    ),
}));

const mockProjects = [
    { _id: 'p1', name: 'Personal Project', teamId: null, currentUserRole: 'owner' },
    { _id: 'p2', name: 'Team Project', teamId: { _id: 't1', name: 'Team 1' }, currentUserRole: 'member' },
];

const mockTeams = [
    { _id: 't1', name: 'Team 1' },
];

describe('ProjectsList', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (apiClient.getProjects as jest.Mock).mockResolvedValue({ success: true, data: mockProjects });
        (apiClient.getTeams as jest.Mock).mockResolvedValue({ success: true, data: mockTeams });
    });

    it('renders projects and teams', async () => {
        render(<ProjectsList />);

        await waitFor(() => {
            expect(screen.getByText('Personal Project')).toBeInTheDocument();
            expect(screen.getByText('Team 1')).toBeInTheDocument();
            expect(screen.getByText('Team Project')).toBeInTheDocument();
        });
    });

    it('opens create project modal', async () => {
        render(<ProjectsList />);

        await waitFor(() => {
            expect(screen.getByText('Create new project')).toBeInTheDocument();
        });

        // Click the first "Create new project" button (Personal)
        const createButtons = screen.getAllByText('Create new project');
        fireEvent.click(createButtons[0]);

        expect(screen.getByTestId('modal')).toBeInTheDocument();
        expect(screen.getByText('Create New Project')).toBeInTheDocument();
    });

    it('creates a new project', async () => {
        (apiClient.createProject as jest.Mock).mockResolvedValue({
            success: true,
            data: { _id: 'p3', name: 'New Project', teamId: null, currentUserRole: 'owner' },
        });

        render(<ProjectsList />);

        await waitFor(() => {
            expect(screen.getAllByText('Create new project')[0]).toBeInTheDocument();
        });

        fireEvent.click(screen.getAllByText('Create new project')[0]);

        const input = screen.getByPlaceholderText('Enter project name');
        fireEvent.change(input, { target: { value: 'New Project' } });

        fireEvent.click(screen.getByText('Create Project'));

        await waitFor(() => {
            expect(apiClient.createProject).toHaveBeenCalledWith({
                name: 'New Project',
                teamId: undefined,
            });
            expect(screen.getByText('New Project')).toBeInTheDocument();
        });
    });

    it('opens create team modal', async () => {
        render(<ProjectsList />);

        await waitFor(() => {
            expect(screen.getByText('Add Team')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('Add Team'));

        expect(screen.getByTestId('modal')).toBeInTheDocument();
        expect(screen.getByText('Create New Team')).toBeInTheDocument();
    });

    it('deletes a project', async () => {
        (apiClient.deleteProject as jest.Mock).mockResolvedValue({ success: true });

        render(<ProjectsList />);

        await waitFor(() => {
            expect(screen.getByText('Personal Project')).toBeInTheDocument();
        });

        // Find delete button for Personal Project (it has owner role)
        // The delete button is hidden by opacity but present in DOM
        const deleteButtons = screen.getAllByTitle('Delete project');
        fireEvent.click(deleteButtons[0]);

        expect(screen.getByTestId('confirmation-modal')).toBeInTheDocument();

        fireEvent.click(screen.getByText('Confirm'));

        await waitFor(() => {
            expect(apiClient.deleteProject).toHaveBeenCalledWith('p1');
            expect(screen.queryByText('Personal Project')).not.toBeInTheDocument();
        });
    });
});
