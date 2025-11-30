import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TaskDetailModal } from '../../components/TaskDetailModal';
import { Task, Project, User } from '@/lib/api';
import '@testing-library/jest-dom';

// Mock API client
jest.mock('@/lib/api', () => ({
    __esModule: true,
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

        createProjectLabel: jest.fn().mockResolvedValue({ success: true }),
        updateTask: jest.fn().mockResolvedValue({ success: true }),
    },
}));

jest.mock('react-toastify', () => ({
    toast: {
        success: jest.fn(),
        error: jest.fn(),
    },
}));

jest.mock('@/components/ui/Dropdown', () => ({
    Dropdown: ({ trigger, children }: { trigger: React.ReactNode, children: React.ReactNode }) => <div>{trigger}{children}</div>,
    DropdownItem: ({ children, onClick }: { children: React.ReactNode, onClick: () => void }) => <div onClick={onClick}>{children}</div>,
    DropdownHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock('@/components/ui/ConfirmationModal', () => ({
    ConfirmationModal: ({ isOpen, onConfirm }: { isOpen: boolean, onConfirm: () => void }) => (
        isOpen ? <button onClick={onConfirm}>Confirm Delete</button> : null
    ),
}));

const mockTask: Task = {
    _id: 'task1',
    name: 'Test Task',
    description: 'Test Description',
    complete: false,
    position: 0,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    taskGroupId: { _id: 'group1', name: 'To Do', position: 0, tasks: [] } as unknown as any,
    assigned: [],
    labels: [],
    dueDate: undefined,
    hasTime: false,
} as unknown as Task;

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
} as unknown as Project;

const mockUser: User = {
    _id: 'user1',
    fullName: 'User One',
    email: 'user1@example.com',
    initials: 'U1',
} as unknown as User;

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

        expect(screen.getByDisplayValue('Test Task')).toBeInTheDocument();
        expect(screen.getByText('Test Description')).toBeInTheDocument();
        expect(screen.getByText('Status')).toBeInTheDocument();
        expect(screen.getByText('Assignees')).toBeInTheDocument();

    });

    it('updates task name on save', async () => {
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

        const saveButton = screen.getByText('Save Changes');
        fireEvent.click(saveButton);

        await waitFor(() => {
            expect(mockOnUpdateTask).toHaveBeenCalledWith('task1', expect.objectContaining({ name: 'Updated Task Name' }));
        });
    });

    it('toggles completion status on save', async () => {
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

        const saveButton = screen.getByText('Save Changes');
        fireEvent.click(saveButton);

        await waitFor(() => {
            expect(mockOnUpdateTask).toHaveBeenCalledWith('task1', expect.objectContaining({ complete: true }));
        });
    });



    it('calls onDeleteTask when delete button is clicked and confirmed', () => {
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

        const confirmButton = screen.getByText('Confirm Delete');
        fireEvent.click(confirmButton);

        expect(mockOnDeleteTask).toHaveBeenCalledWith('task1');
        expect(mockOnClose).toHaveBeenCalled();
    });
});
