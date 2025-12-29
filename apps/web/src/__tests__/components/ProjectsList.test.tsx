import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { ProjectsList } from '@/components/ProjectsList';
import { apiClient } from '@/lib/api';
import { renderWithClient } from '../utils';
import { toast } from 'react-toastify';
import '@testing-library/jest-dom';

// Mock next/link
jest.mock('next/link', () => {
    return ({ children, href }: { children: React.ReactNode; href: string }) => {
        return <a href={href}>{children}</a>;
    };
});

// Mock react-toastify
jest.mock('react-toastify', () => ({
    toast: {
        success: jest.fn(),
        error: jest.fn(),
    },
}));

// Mock UI components
jest.mock('@/components/ui/Button', () => ({
    Button: ({ children, onClick, variant, size, className, ...props }: any) => (
        <button onClick={onClick} className={className} data-variant={variant} data-size={size} {...props}>
            {children}
        </button>
    ),
}));

jest.mock('@/components/ui/Modal', () => ({
    Modal: ({ isOpen, onClose, title, children }: any) => {
        if (!isOpen) return null;
        return (
            <div data-testid="modal">
                {title && <h2>{title}</h2>}
                <div>{children}</div>
                <button onClick={onClose}>Close</button>
            </div>
        );
    },
}));

jest.mock('@/components/ui/Input', () => ({
    Input: ({ label, value, onChange, placeholder, ...props }: any) => (
        <div>
            {label && <label htmlFor={props.id || label}>{label}</label>}
            <input
                id={props.id || label}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                {...props}
            />
        </div>
    ),
}));

jest.mock('@/components/ui/ConfirmationModal', () => ({
    ConfirmationModal: ({ isOpen, onClose, onConfirm, title, message, confirmText, variant }: any) => {
        if (!isOpen) return null;
        return (
            <div data-testid="confirmation-modal">
                <h2>{title}</h2>
                <div>{message}</div>
                <button onClick={onClose}>Cancel</button>
                <button onClick={onConfirm}>{confirmText || 'Confirm'}</button>
            </div>
        );
    },
}));

// Mock icons
jest.mock('@/components/icons', () => ({
    Plus: ({ className, width, height }: { className?: string; width?: number; height?: number }) => (
        <svg data-testid="plus-icon" className={className} width={width} height={height} />
    ),
    Trash: ({ className, width, height }: { className?: string; width?: number; height?: number }) => (
        <svg data-testid="trash-icon" className={className} width={width} height={height} />
    ),
    X: ({ className, width, height }: { className?: string; width?: number; height?: number }) => (
        <svg data-testid="x-icon" className={className} width={width} height={height} />
    ),
}));

// Mock API client
jest.mock('@/lib/api', () => ({
    apiClient: {
        getProjects: jest.fn(),
        getTeams: jest.fn(),
        createProject: jest.fn(),
        createTeam: jest.fn(),
        deleteProject: jest.fn(),
    },
}));

describe('ProjectsList - Main Dashboard', () => {
    const mockProjects = [
        {
            _id: 'project1',
            name: 'Personal Project 1',
            createdAt: '2024-01-01T00:00:00.000Z',
            currentUserRole: 'owner',
        },
        {
            _id: 'project2',
            name: 'Personal Project 2',
            createdAt: '2024-01-02T00:00:00.000Z',
            currentUserRole: 'member',
        },
        {
            _id: 'project3',
            name: 'Team Project 1',
            teamId: 'team1',
            createdAt: '2024-01-03T00:00:00.000Z',
            currentUserRole: 'owner',
        },
    ];

    const mockTeams = [
        {
            _id: 'team1',
            name: 'Engineering Team',
            organizationId: 'org1',
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-01T00:00:00.000Z',
        },
        {
            _id: 'team2',
            name: 'Design Team',
            organizationId: 'org1',
            createdAt: '2024-01-02T00:00:00.000Z',
            updatedAt: '2024-01-02T00:00:00.000Z',
        },
    ];

    beforeEach(() => {
        jest.clearAllMocks();
        (apiClient.getProjects as jest.Mock).mockResolvedValue({
            success: true,
            data: mockProjects,
        });
        (apiClient.getTeams as jest.Mock).mockResolvedValue({
            success: true,
            data: mockTeams,
        });
    });

    describe('Initial Rendering', () => {
        it('should render the dashboard header correctly', async () => {
            renderWithClient(<ProjectsList />);

            await waitFor(() => {
                expect(screen.getByText('Projects')).toBeInTheDocument();
                expect(screen.getByText('Manage your projects and teams')).toBeInTheDocument();
            });
        });

        it('should render the "Add Team" button', async () => {
            renderWithClient(<ProjectsList />);

            await waitFor(() => {
                expect(screen.getByRole('button', { name: /add team/i })).toBeInTheDocument();
            });
        });

        it('should display "Personal Projects" section', async () => {
            renderWithClient(<ProjectsList />);

            await waitFor(() => {
                expect(screen.getByText('Personal Projects')).toBeInTheDocument();
            });
        });

        it('should fetch and display projects on mount', async () => {
            renderWithClient(<ProjectsList />);

            await waitFor(() => {
                expect(apiClient.getProjects).toHaveBeenCalledTimes(1);
                expect(screen.getByText('Personal Project 1')).toBeInTheDocument();
                expect(screen.getByText('Personal Project 2')).toBeInTheDocument();
            });
        });

        it('should fetch and display teams on mount', async () => {
            renderWithClient(<ProjectsList />);

            await waitFor(() => {
                expect(apiClient.getTeams).toHaveBeenCalledTimes(1);
                expect(screen.getByText('Engineering Team')).toBeInTheDocument();
                expect(screen.getByText('Design Team')).toBeInTheDocument();
            });
        });
    });

    describe('Personal Projects Section', () => {
        it('should display only personal projects (without teamId)', async () => {
            renderWithClient(<ProjectsList />);

            await waitFor(() => {
                const personalSection = screen.getByText('Personal Projects').closest('div');
                expect(within(personalSection!).getByText('Personal Project 1')).toBeInTheDocument();
                expect(within(personalSection!).getByText('Personal Project 2')).toBeInTheDocument();
            });
        });

        it('should render "Create new project" button for personal projects', async () => {
            renderWithClient(<ProjectsList />);

            await waitFor(() => {
                const createButtons = screen.getAllByText('Create new project');
                expect(createButtons.length).toBeGreaterThan(0);
            });
        });

        it('should show delete button only for projects where user is owner', async () => {
            renderWithClient(<ProjectsList />);

            await waitFor(() => {
                // Find project name elements specifically, avoiding the section header "Personal Projects"
                const project1 = screen.getByText('Personal Project 1');
                const project2 = screen.getByText('Personal Project 2');
                expect(project1).toBeInTheDocument();
                expect(project2).toBeInTheDocument();
            });

            // Project 1 has owner role, should have delete button
            const project1Name = screen.getByText('Personal Project 1');
            const project1Group = project1Name.closest('.group');
            const deleteButton1 = within(project1Group!).queryByTitle('Delete project');
            expect(deleteButton1).toBeInTheDocument();

            // Project 2 has member role, should NOT have delete button
            const project2Name = screen.getByText('Personal Project 2');
            const project2Group = project2Name.closest('.group');
            const deleteButton2 = within(project2Group!).queryByTitle('Delete project');
            expect(deleteButton2).not.toBeInTheDocument();
        });

        it('should apply correct colors to project cards', async () => {
            renderWithClient(<ProjectsList />);

            await waitFor(() => {
                const project1Card = screen.getByText('Personal Project 1').closest('div');
                expect(project1Card).toHaveStyle({ backgroundColor: expect.any(String) });
            });
        });
    });

    describe('Team Projects Section', () => {
        it('should display team sections with team names', async () => {
            renderWithClient(<ProjectsList />);

            await waitFor(() => {
                expect(screen.getByText('Engineering Team')).toBeInTheDocument();
                expect(screen.getByText('Design Team')).toBeInTheDocument();
            });
        });

        it('should display team navigation buttons (Projects, Members, Settings)', async () => {
            renderWithClient(<ProjectsList />);

            await waitFor(() => {
                const projectsButtons = screen.getAllByRole('button', { name: /projects/i });
                const membersButtons = screen.getAllByRole('button', { name: /members/i });
                const settingsButtons = screen.getAllByRole('button', { name: /settings/i });

                expect(projectsButtons.length).toBe(mockTeams.length);
                expect(membersButtons.length).toBe(mockTeams.length);
                expect(settingsButtons.length).toBe(mockTeams.length);
            });
        });

        it('should filter and display projects belonging to each team', async () => {
            renderWithClient(<ProjectsList />);

            await waitFor(() => {
                expect(screen.getByText('Team Project 1')).toBeInTheDocument();
            });
        });

        it('should render "Create new project" button for each team', async () => {
            renderWithClient(<ProjectsList />);

            await waitFor(() => {
                const createButtons = screen.getAllByText('Create new project');
                // One for personal + one for each team
                expect(createButtons.length).toBe(1 + mockTeams.length);
            });
        });
    });

    describe('Create Project Modal', () => {
        it('should open create project modal when clicking "Create new project" for personal', async () => {
            renderWithClient(<ProjectsList />);

            await waitFor(() => {
                const createButtons = screen.getAllByText('Create new project');
                fireEvent.click(createButtons[0]);
            });

            await waitFor(() => {
                expect(screen.getByText('Create New Project')).toBeInTheDocument();
                expect(screen.getByLabelText('Project Name')).toBeInTheDocument();
            });
        });

        it('should close modal when clicking Cancel', async () => {
            renderWithClient(<ProjectsList />);

            await waitFor(() => {
                const createButtons = screen.getAllByText('Create new project');
                fireEvent.click(createButtons[0]);
            });

            await waitFor(() => {
                expect(screen.getByText('Create New Project')).toBeInTheDocument();
            });

            const cancelButton = screen.getByRole('button', { name: /cancel/i });
            fireEvent.click(cancelButton);

            await waitFor(() => {
                expect(screen.queryByText('Create New Project')).not.toBeInTheDocument();
            });
        });

        it('should allow typing in project name input', async () => {
            renderWithClient(<ProjectsList />);

            await waitFor(() => {
                const createButtons = screen.getAllByText('Create new project');
                fireEvent.click(createButtons[0]);
            });

            const input = screen.getByLabelText('Project Name') as HTMLInputElement;
            fireEvent.change(input, { target: { value: 'New Test Project' } });

            expect(input.value).toBe('New Test Project');
        });

        it('should create a personal project successfully', async () => {
            const newProject = {
                _id: 'project4',
                name: 'New Test Project',
                createdAt: '2024-01-04T00:00:00.000Z',
                currentUserRole: 'owner',
            };

            (apiClient.createProject as jest.Mock).mockResolvedValue({
                success: true,
                data: newProject,
            });

            renderWithClient(<ProjectsList />);

            await waitFor(() => {
                const createButtons = screen.getAllByText('Create new project');
                fireEvent.click(createButtons[0]);
            });

            const input = screen.getByLabelText('Project Name');
            fireEvent.change(input, { target: { value: 'New Test Project' } });

            const createButton = screen.getByRole('button', { name: /create project/i });
            fireEvent.click(createButton);

            await waitFor(() => {
                expect(apiClient.createProject).toHaveBeenCalledWith({
                    name: 'New Test Project',
                    teamId: undefined,
                });
                expect(toast.success).toHaveBeenCalledWith('Project "New Test Project" created successfully!');
            });
        });

        it('should create a team project when opened from team section', async () => {
            const newProject = {
                _id: 'project5',
                name: 'New Team Project',
                teamId: 'team1',
                createdAt: '2024-01-05T00:00:00.000Z',
                currentUserRole: 'owner',
            };

            (apiClient.createProject as jest.Mock).mockResolvedValue({
                success: true,
                data: newProject,
            });

            renderWithClient(<ProjectsList />);

            await waitFor(() => {
                const createButtons = screen.getAllByText('Create new project');
                // Click the second one (first team's create button)
                fireEvent.click(createButtons[1]);
            });

            const input = screen.getByLabelText('Project Name');
            fireEvent.change(input, { target: { value: 'New Team Project' } });

            const createButton = screen.getByRole('button', { name: /create project/i });
            fireEvent.click(createButton);

            await waitFor(() => {
                expect(apiClient.createProject).toHaveBeenCalledWith({
                    name: 'New Team Project',
                    teamId: 'team1',
                });
            });
        });

        it('should handle project creation error', async () => {
            (apiClient.createProject as jest.Mock).mockRejectedValue(
                new Error('Failed to create project')
            );

            renderWithClient(<ProjectsList />);

            await waitFor(() => {
                const createButtons = screen.getAllByText('Create new project');
                fireEvent.click(createButtons[0]);
            });

            const input = screen.getByLabelText('Project Name');
            fireEvent.change(input, { target: { value: 'Failed Project' } });

            const createButton = screen.getByRole('button', { name: /create project/i });
            fireEvent.click(createButton);

            await waitFor(() => {
                expect(toast.error).toHaveBeenCalledWith('Failed to create project');
            });
        });

        it('should not create project with empty name', async () => {
            renderWithClient(<ProjectsList />);

            await waitFor(() => {
                const createButtons = screen.getAllByText('Create new project');
                fireEvent.click(createButtons[0]);
            });

            const createButton = screen.getByRole('button', { name: /create project/i });
            fireEvent.click(createButton);

            // Should not call API with empty name
            expect(apiClient.createProject).not.toHaveBeenCalled();
        });
    });

    describe('Create Team Modal', () => {
        it('should open create team modal when clicking "Add Team"', async () => {
            renderWithClient(<ProjectsList />);

            await waitFor(() => {
                const addTeamButton = screen.getByRole('button', { name: /add team/i });
                fireEvent.click(addTeamButton);
            });

            await waitFor(() => {
                expect(screen.getByText('Create New Team')).toBeInTheDocument();
                expect(screen.getByLabelText('Team Name')).toBeInTheDocument();
            });
        });

        it('should close team modal when clicking Cancel', async () => {
            renderWithClient(<ProjectsList />);

            await waitFor(() => {
                const addTeamButton = screen.getByRole('button', { name: /add team/i });
                fireEvent.click(addTeamButton);
            });

            await waitFor(() => {
                expect(screen.getByText('Create New Team')).toBeInTheDocument();
            });

            const cancelButton = screen.getByRole('button', { name: /cancel/i });
            fireEvent.click(cancelButton);

            await waitFor(() => {
                expect(screen.queryByText('Create New Team')).not.toBeInTheDocument();
            });
        });

        it('should create a team successfully', async () => {
            const newTeam = {
                _id: 'team3',
                name: 'New Test Team',
                organizationId: 'org1',
                createdAt: '2024-01-06T00:00:00.000Z',
                updatedAt: '2024-01-06T00:00:00.000Z',
            };

            (apiClient.createTeam as jest.Mock).mockResolvedValue({
                success: true,
                data: newTeam,
            });

            renderWithClient(<ProjectsList />);

            await waitFor(() => {
                const addTeamButton = screen.getByRole('button', { name: /add team/i });
                fireEvent.click(addTeamButton);
            });

            const input = screen.getByLabelText('Team Name');
            fireEvent.change(input, { target: { value: 'New Test Team' } });

            const createButton = screen.getByRole('button', { name: /create team/i });
            fireEvent.click(createButton);

            await waitFor(() => {
                expect(apiClient.createTeam).toHaveBeenCalledWith({
                    name: 'New Test Team',
                });
                expect(toast.success).toHaveBeenCalledWith('Team "New Test Team" created successfully!');
            });
        });

        it('should handle team creation error', async () => {
            (apiClient.createTeam as jest.Mock).mockRejectedValue(
                new Error('Failed to create team')
            );

            renderWithClient(<ProjectsList />);

            await waitFor(() => {
                const addTeamButton = screen.getByRole('button', { name: /add team/i });
                fireEvent.click(addTeamButton);
            });

            const input = screen.getByLabelText('Team Name');
            fireEvent.change(input, { target: { value: 'Failed Team' } });

            const createButton = screen.getByRole('button', { name: /create team/i });
            fireEvent.click(createButton);

            await waitFor(() => {
                expect(toast.error).toHaveBeenCalledWith('Failed to create team');
            });
        });
    });

    describe('Delete Project', () => {
        it('should open delete confirmation modal when clicking delete button', async () => {
            renderWithClient(<ProjectsList />);

            await waitFor(() => {
                expect(screen.getByText('Personal Project 1')).toBeInTheDocument();
            });

            // Find the project card and hover to show delete button
            const project1Card = screen.getByText('Personal Project 1').closest('.group');
            const deleteButton = within(project1Card!).getByTitle('Delete project');

            fireEvent.click(deleteButton);

            await waitFor(() => {
                expect(screen.getByRole('heading', { name: 'Delete Project' })).toBeInTheDocument();
                expect(screen.getByText(/Are you sure you want to delete the project/)).toBeInTheDocument();
                expect(screen.getAllByText('Personal Project 1').length).toBeGreaterThan(0);
            });
        });

        it('should close delete modal when clicking Cancel', async () => {
            renderWithClient(<ProjectsList />);

            await waitFor(() => {
                expect(screen.getByText('Personal Project 1')).toBeInTheDocument();
            });

            const project1Card = screen.getByText('Personal Project 1').closest('.group');
            const deleteButton = within(project1Card!).getByTitle('Delete project');
            fireEvent.click(deleteButton);

            await waitFor(() => {
                expect(screen.getByRole('heading', { name: 'Delete Project' })).toBeInTheDocument();
            });

            const cancelButton = screen.getByRole('button', { name: /cancel/i });
            fireEvent.click(cancelButton);

            await waitFor(() => {
                expect(screen.queryByText('Delete Project')).not.toBeInTheDocument();
            });
        });

        it('should delete project successfully', async () => {
            (apiClient.deleteProject as jest.Mock).mockResolvedValue({
                success: true,
            });

            renderWithClient(<ProjectsList />);

            await waitFor(() => {
                expect(screen.getByText('Personal Project 1')).toBeInTheDocument();
            });

            const project1Card = screen.getByText('Personal Project 1').closest('.group');
            const deleteButton = within(project1Card!).getByTitle('Delete project');
            fireEvent.click(deleteButton);

            await waitFor(() => {
                expect(screen.getByRole('heading', { name: 'Delete Project' })).toBeInTheDocument();
            });

            // Scope to the confirmation modal to find the correct button
            const modal = screen.getByTestId('confirmation-modal');
            const confirmButton = within(modal).getByRole('button', { name: /delete project/i });
            fireEvent.click(confirmButton);

            await waitFor(() => {
                expect(apiClient.deleteProject).toHaveBeenCalledWith('project1');
                expect(toast.success).toHaveBeenCalledWith('Project "Personal Project 1" deleted successfully');
            });
        });

        it('should handle delete project error', async () => {
            (apiClient.deleteProject as jest.Mock).mockRejectedValue(
                new Error('Failed to delete project')
            );

            renderWithClient(<ProjectsList />);

            await waitFor(() => {
                expect(screen.getByText('Personal Project 1')).toBeInTheDocument();
            });

            const project1Card = screen.getByText('Personal Project 1').closest('.group');
            const deleteButton = within(project1Card!).getByTitle('Delete project');
            fireEvent.click(deleteButton);

            await waitFor(() => {
                expect(screen.getByRole('heading', { name: 'Delete Project' })).toBeInTheDocument();
            });

            // Scope to the confirmation modal to find the correct button
            const modal = screen.getByTestId('confirmation-modal');
            const confirmButton = within(modal).getByRole('button', { name: /delete project/i });
            fireEvent.click(confirmButton);

            await waitFor(() => {
                expect(toast.error).toHaveBeenCalledWith('Failed to delete project');
            });
        });
    });

    describe('Navigation Links', () => {
        it('should have correct links for personal projects', async () => {
            renderWithClient(<ProjectsList />);

            await waitFor(() => {
                const project1Link = screen.getByText('Personal Project 1').closest('a');
                expect(project1Link).toHaveAttribute('href', '/project/project1');

                const project2Link = screen.getByText('Personal Project 2').closest('a');
                expect(project2Link).toHaveAttribute('href', '/project/project2');
            });
        });

        it('should have correct links for team projects', async () => {
            renderWithClient(<ProjectsList />);

            await waitFor(() => {
                const teamProjectLink = screen.getByText('Team Project 1').closest('a');
                expect(teamProjectLink).toHaveAttribute('href', '/project/project3');
            });
        });

        it('should have correct team navigation links', async () => {
            renderWithClient(<ProjectsList />);

            await waitFor(() => {
                const teamHeading = screen.getByText('Engineering Team');
                // Get the parent container that includes both the heading and the links
                const teamContainer = teamHeading.closest('.mb-12');
                const links = within(teamContainer!).getAllByRole('link');

                // Find the specific links by their text content
                const projectsLink = links.find(link => link.textContent?.includes('Projects'));
                const membersLink = links.find(link => link.textContent?.includes('Members'));
                const settingsLink = links.find(link => link.textContent?.includes('Settings'));

                expect(projectsLink).toHaveAttribute('href', '/teams/team1');
                expect(membersLink).toHaveAttribute('href', '/teams/team1/members');
                expect(settingsLink).toHaveAttribute('href', '/teams/team1/settings');
            });
        });
    });

    describe('Empty States', () => {
        it('should handle empty projects list', async () => {
            (apiClient.getProjects as jest.Mock).mockResolvedValue({
                success: true,
                data: [],
            });

            renderWithClient(<ProjectsList />);

            await waitFor(() => {
                expect(screen.getByText('Personal Projects')).toBeInTheDocument();
                // Should still show create button
                expect(screen.getByText('Create new project')).toBeInTheDocument();
            });
        });

        it('should handle empty teams list', async () => {
            (apiClient.getTeams as jest.Mock).mockResolvedValue({
                success: true,
                data: [],
            });

            renderWithClient(<ProjectsList />);

            await waitFor(() => {
                expect(screen.getByText('Personal Projects')).toBeInTheDocument();
                // Should not show any team sections
                expect(screen.queryByText('Engineering Team')).not.toBeInTheDocument();
            });
        });

        it('should handle undefined data from API', async () => {
            (apiClient.getProjects as jest.Mock).mockResolvedValue({
                success: true,
                data: undefined,
            });
            (apiClient.getTeams as jest.Mock).mockResolvedValue({
                success: true,
                data: undefined,
            });

            renderWithClient(<ProjectsList />);

            await waitFor(() => {
                expect(screen.getByText('Personal Projects')).toBeInTheDocument();
            });
        });
    });

    describe('Data Filtering', () => {
        it('should correctly filter personal vs team projects', async () => {
            renderWithClient(<ProjectsList />);

            await waitFor(() => {
                // Personal projects should not include team projects
                const personalSection = screen.getByText('Personal Projects').closest('div');
                expect(within(personalSection!).queryByText('Team Project 1')).not.toBeInTheDocument();
            });
        });

        it('should handle projects with teamId as object', async () => {
            const projectsWithObjectTeamId = [
                {
                    _id: 'project4',
                    name: 'Complex Team Project',
                    teamId: { _id: 'team1', name: 'Engineering Team', organizationId: 'org1' },
                    createdAt: '2024-01-04T00:00:00.000Z',
                    currentUserRole: 'owner',
                },
            ];

            (apiClient.getProjects as jest.Mock).mockResolvedValue({
                success: true,
                data: projectsWithObjectTeamId,
            });

            renderWithClient(<ProjectsList />);

            await waitFor(() => {
                expect(screen.getByText('Complex Team Project')).toBeInTheDocument();
            });
        });
    });

    describe('UI Interactions', () => {
        it('should apply hover effects to project cards', async () => {
            renderWithClient(<ProjectsList />);

            await waitFor(() => {
                const projectCard = screen.getByText('Personal Project 1').closest('.project-card');
                expect(projectCard).toHaveClass('hover:scale-105');
            });
        });

        it('should render Plus icons correctly', async () => {
            renderWithClient(<ProjectsList />);

            await waitFor(() => {
                const plusIcons = screen.getAllByTestId('plus-icon');
                expect(plusIcons.length).toBeGreaterThan(0);
            });
        });

        it('should render project cards with correct styling', async () => {
            renderWithClient(<ProjectsList />);

            await waitFor(() => {
                const projectCard = screen.getByText('Personal Project 1').closest('.project-card');
                expect(projectCard).toHaveClass('h-24', 'rounded-lg', 'p-4', 'text-white');
            });
        });
    });
});
