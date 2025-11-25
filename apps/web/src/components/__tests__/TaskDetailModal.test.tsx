/// <reference types="@testing-library/jest-dom" />
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TaskDetailModal } from '../TaskDetailModal';
import { Task, Project, User } from '@/lib/api';
import '@testing-library/jest-dom';

// Mock API client
jest.mock('@/lib/api', () => ({
    apiClient: {
        getUsers: jest.fn().mockResolvedValue({
            success: true,
            data: [
                { _id: 'user1', fullName: 'User One', initials: 'U1' },
                { _id: 'user2', fullName: 'User Two', initials: 'U2' },
            ],
        }),
        assignUserToTask: jest.fn().mockResolvedValue({ success: true }),
        unassignUserFromTask: jest.fn().mockResolvedValue({ success: true }),
        addLabelToTask: jest.fn().mockResolvedValue({ success: true }),
        removeLabelFromTask: jest.fn().mockResolvedValue({ success: true }),
    },
}));

jest.mock('react-toastify', () => ({
    toast: {
        success: jest.fn(),
        error: jest.fn(),
    },
}));

jest.mock('@/components/ui/Dropdown', () => ({
    Dropdown: ({ trigger, children }: any) => <div>{trigger}{children}</div>,
    DropdownItem: ({ children, onClick }: any) => <div onClick={onClick}>{children}</div>,
    DropdownHeader: ({ children }: any) => <div>{children}</div>,
}));

const mockTask: Task = {
    _id: 'task1',
    name: 'Test Task',
    description: 'Test Description',
    complete: false,
    position: 0,
    taskGroupId: { _id: 'group1', name: 'To Do', position: 0, tasks: [] } as any,
    assigned: [],
    labels: [],
    dueDate: undefined,
    hasTime: false,
} as any;

const mockProject: Project = {
    _id: 'project1',
    name: 'Test Project',
    description: 'Test Project Desc',
    ownerId: 'owner1',
    taskGroups: [],
    labels: [
        { _id: 'label1', name: 'Bug', labelColorId: { _id: 'color1', colorHex: '#ff0000', name: 'Red', position: 0 } },
    ],
    members: [],
} as any;

const mockUser: User = {
    _id: 'user1',
    fullName: 'User One',
    email: 'user1@example.com',
    initials: 'U1',
} as any;

describe('TaskDetailModal', () => {
    const mockOnClose = jest.fn();
    const mockOnUpdateTask = jest.fn();
    const mockOnDeleteTask = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders correctly', () => {
        render(
            <TaskDetailModal
                isOpen={true}
                onClose={mockOnClose}
                task={mockTask}
                project={mockProject}
                currentUser={mockUser}
                onUpdateTask={mockOnUpdateTask}
                onDeleteTask={mockOnDeleteTask}
            />
        );

        expect((screen.getByDisplayValue('Test Task') as any)).toBeInTheDocument();
        expect((screen.getByText('Test Description') as any)).toBeInTheDocument();
        expect((screen.getByText('Status') as any)).toBeInTheDocument();
        expect((screen.getByText('Assignees') as any)).toBeInTheDocument();
        expect((screen.getByText('Labels') as any)).toBeInTheDocument();
    });

    it('updates task name on blur', () => {
        render(
            <TaskDetailModal
                isOpen={true}
                onClose={mockOnClose}
                task={mockTask}
                project={mockProject}
                currentUser={mockUser}
                onUpdateTask={mockOnUpdateTask}
                onDeleteTask={mockOnDeleteTask}
            />
        );

        const input = screen.getByDisplayValue('Test Task');
        fireEvent.change(input, { target: { value: 'Updated Task Name' } });
        fireEvent.blur(input);

        expect((mockOnUpdateTask as any)).toHaveBeenCalledWith('task1', { name: 'Updated Task Name' });
    });

    it('toggles completion status', () => {
        render(
            <TaskDetailModal
                isOpen={true}
                onClose={mockOnClose}
                task={mockTask}
                project={mockProject}
                currentUser={mockUser}
                onUpdateTask={mockOnUpdateTask}
                onDeleteTask={mockOnDeleteTask}
            />
        );

        const button = screen.getByText('Mark Complete');
        fireEvent.click(button);

        expect((mockOnUpdateTask as any)).toHaveBeenCalledWith('task1', { complete: true });
    });

    it('calls onDeleteTask when delete button is clicked and confirmed', () => {
        window.confirm = jest.fn().mockReturnValue(true);

        render(
            <TaskDetailModal
                isOpen={true}
                onClose={mockOnClose}
                task={mockTask}
                project={mockProject}
                currentUser={mockUser}
                onUpdateTask={mockOnUpdateTask}
                onDeleteTask={mockOnDeleteTask}
            />
        );

        const deleteButton = screen.getByText('Delete Task');
        fireEvent.click(deleteButton);

        expect((window.confirm as any)).toHaveBeenCalled();
        expect((mockOnDeleteTask as any)).toHaveBeenCalledWith('task1');
        expect((mockOnClose as any)).toHaveBeenCalled();
    });
});
