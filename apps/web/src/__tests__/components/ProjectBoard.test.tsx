import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { ProjectBoard } from '../../components/ProjectBoard';
import { apiClient } from '@/lib/api';
import '@testing-library/jest-dom';

// Mock API
jest.mock('@/lib/api', () => ({
    apiClient: {
        getProjectById: jest.fn(),
        getCurrentUser: jest.fn(),
        updateTask: jest.fn(),
        createTask: jest.fn(),
        deleteTask: jest.fn(),
        createTaskGroup: jest.fn(),
        updateTaskGroup: jest.fn(),
        updateProject: jest.fn(),
        deleteProject: jest.fn(),
        addProjectMember: jest.fn(),
        removeProjectMember: jest.fn(),
    },
}));

// Mock child components
jest.mock('../../components/SortableTaskList', () => ({
    SortableTaskList: ({ list, onTaskClick }: any) => {
        return (
            <div data-testid={`list-${list._id}`}>
                {list.name}
                {list.tasks.map((task: any) => (
                    <div
                        key={task._id}
                        onClick={() => onTaskClick(task)}
                        data-testid={`task-${task._id}`}
                    >
                        {task.name}
                    </div>
                ))}
            </div>
        );
    },
}));

jest.mock('../../components/AddList', () => ({
    AddList: ({ onCreateList }: any) => {
        return <button onClick={() => onCreateList('New List')}>Add List</button>;
    },
}));

jest.mock('../../components/TaskDetailModal', () => ({
    TaskDetailModal: ({ isOpen, onClose, task }: any) => {
        if (!isOpen) return null;
        return (
            <div data-testid="task-modal">
                {task.name}
                <button key="close" onClick={onClose}>Close</button>
            </div>
        );
    },
}));

jest.mock('../../components/ProjectSettingsModal', () => ({
    ProjectSettingsModal: ({ isOpen, onClose }: any) => {
        if (!isOpen) return null;
        return (
            <div data-testid="settings-modal">
                <button onClick={onClose}>Close</button>
            </div>
        );
    },
}));

// Mock dnd-kit
jest.mock('@dnd-kit/core', () => ({
    DndContext: ({ children }: any) => <div>{children}</div>,
    useSensor: jest.fn(),
    useSensors: jest.fn(),
    PointerSensor: jest.fn(),
}));

jest.mock('@dnd-kit/sortable', () => ({
    SortableContext: ({ children }: any) => <div>{children}</div>,
    horizontalListSortingStrategy: {},
}));

// Mock useRouter
jest.mock('next/navigation', () => ({
    useRouter: () => ({
        push: jest.fn(),
    }),
}));

// Mock Toast
jest.mock('react-toastify', () => ({
    toast: {
        success: jest.fn(),
        error: jest.fn(),
    },
}));

const mockProject = {
    _id: 'project1',
    name: 'Test Project',
    taskGroups: [
        {
            _id: 'group1',
            name: 'To Do',
            position: 0,
            tasks: [
                { _id: 'task1', name: 'Task 1', complete: false, position: 0 },
            ],
        },
    ],
    labels: [],
    members: [],
};

const mockUser = {
    _id: 'user1',
    fullName: 'Test User',
};

describe('ProjectBoard', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (apiClient.getProjectById as jest.Mock).mockResolvedValue({ success: true, data: mockProject });
        (apiClient.getCurrentUser as jest.Mock).mockResolvedValue({ success: true, data: mockUser });
    });

    it('renders project board with data', async () => {
        render(<ProjectBoard projectId="project1" />);

        expect(screen.getByText('Loading project...')).toBeInTheDocument();

        await waitFor(() => {
            expect(screen.getByText('Test Project')).toBeInTheDocument();
            expect(screen.getByTestId('list-group1')).toBeInTheDocument();
            expect(screen.getByText('Task 1')).toBeInTheDocument();
        });
    });

    it('opens task detail modal when task is clicked', async () => {
        render(<ProjectBoard projectId="project1" />);

        await waitFor(() => {
            expect(screen.getByText('Task 1')).toBeInTheDocument();
        });

        const taskDiv = screen.getByTestId('task-task1');
        fireEvent.click(taskDiv);

        await waitFor(() => {
            expect(screen.getByTestId('task-modal')).toBeInTheDocument();
        });
    });

    it('opens settings modal when settings button is clicked', async () => {
        render(<ProjectBoard projectId="project1" />);

        await waitFor(() => {
            expect(screen.getByText('Settings')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('Settings'));

        expect(screen.getByTestId('settings-modal')).toBeInTheDocument();
    });

    it('creates a new list', async () => {
        (apiClient.createTaskGroup as jest.Mock).mockResolvedValue({
            success: true,
            data: { _id: 'group2', name: 'New List', position: 1, tasks: [] },
        });

        render(<ProjectBoard projectId="project1" />);

        await waitFor(() => {
            expect(screen.getByText('Add List')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('Add List'));

        await waitFor(() => {
            expect(apiClient.createTaskGroup).toHaveBeenCalledWith({
                projectId: 'project1',
                name: 'New List',
                position: 1,
            });
            expect(screen.getByText('New List')).toBeInTheDocument();
        });
    });
});
