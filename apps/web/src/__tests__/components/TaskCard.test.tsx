import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { TaskCard } from '../../components/TaskCard';
import { Task } from '@/lib/api';
import '@testing-library/jest-dom';

// Mock dnd-kit
jest.mock('@dnd-kit/sortable', () => ({
    useSortable: () => ({
        attributes: {},
        listeners: {},
        setNodeRef: jest.fn(),
        transform: null,
        transition: null,
        isDragging: false,
    }),
}));

jest.mock('@dnd-kit/utilities', () => ({
    CSS: {
        Transform: {
            toString: jest.fn(),
        },
    },
}));

// Mock ConfirmationModal
jest.mock('@/components/ui/ConfirmationModal', () => ({
    ConfirmationModal: ({ isOpen, onConfirm }: { isOpen: boolean, onConfirm: () => void }) => {
        if (!isOpen) return null;
        return <button onClick={onConfirm}>Confirm Delete</button>;
    },
}));

// Mock ProfileIcon
jest.mock('@/components/ui/ProfileIcon', () => ({
    ProfileIcon: () => {
        return <div data-testid="profile-icon" />;
    },
}));

// Mock Card
jest.mock('@/components/ui/Card', () => ({
    Card: (props: any) => {
        return <div {...props} data-testid="card">{props.children}</div>;
    },
}));

// Mock Icons
jest.mock('@/components/icons', () => ({
    CheckCircle: () => {
        return <div data-testid="check-circle" />;
    },
}));

const mockTask: Task = {
    _id: 'task1',
    name: 'Test Task',
    description: 'Description',
    complete: false,
    position: 0,
    taskGroupId: 'group1',
    assigned: [],
    labels: [
        {
            _id: 'label1',
            projectLabelId: {
                _id: 'pl1',
                name: 'Bug',
                labelColorId: { _id: 'c1', colorHex: '#ff0000', name: 'Red', position: 0 }
            },
            assignedDate: '2023-01-01'
        }
    ],
    dueDate: '2023-12-31',
    hasTime: false,
} as unknown as Task;

describe('TaskCard', () => {
    const mockOnUpdate = jest.fn();
    const mockOnDelete = jest.fn();
    const mockOnClick = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders task details correctly', () => {
        render(
            <TaskCard
                task={mockTask}
                onUpdate={mockOnUpdate}
                onDelete={mockOnDelete}
                onClick={mockOnClick}
            />
        );

        expect(screen.getByText('Test Task')).toBeInTheDocument();
        expect(screen.getByText('Bug')).toBeInTheDocument();
        // Due date format might vary, but "Dec 31" should be there
        expect(screen.getByText(/Dec 31/)).toBeInTheDocument();
    });

    it('calls onClick when card is clicked', () => {
        render(
            <TaskCard
                task={mockTask}
                onUpdate={mockOnUpdate}
                onDelete={mockOnDelete}
                onClick={mockOnClick}
            />
        );

        fireEvent.click(screen.getByText('Test Task').closest('.cursor-pointer')!);
        // Wait, the task name div has onClick to edit.
        // The CARD itself has onClick.
        // But the task name div stops propagation?
        // Let's check the component.
        // Task Name div: onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
        // So clicking task name triggers edit, not card click.

        // Clicking elsewhere on the card should trigger onClick.
        // The Card component wraps everything.
        // Let's click the labels container or just the card container.
        // We can find the card by text 'Bug' and click its parent's parent...
        // Or just click the text 'Bug'.
        fireEvent.click(screen.getByText('Bug'));
        expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it('enters edit mode on task name click', () => {
        render(
            <TaskCard
                task={mockTask}
                onUpdate={mockOnUpdate}
                onDelete={mockOnDelete}
                onClick={mockOnClick}
            />
        );

        fireEvent.click(screen.getByText('Test Task'));
        expect(screen.getByDisplayValue('Test Task')).toBeInTheDocument();
    });

    it('saves task name on blur', () => {
        render(
            <TaskCard
                task={mockTask}
                onUpdate={mockOnUpdate}
                onDelete={mockOnDelete}
                onClick={mockOnClick}
            />
        );

        fireEvent.click(screen.getByText('Test Task'));
        const input = screen.getByDisplayValue('Test Task');
        fireEvent.change(input, { target: { value: 'Updated Task' } });
        fireEvent.blur(input);

        expect(mockOnUpdate).toHaveBeenCalledWith('task1', { name: 'Updated Task' });
    });

    it('toggles completion status', () => {
        render(
            <TaskCard
                task={mockTask}
                onUpdate={mockOnUpdate}
                onDelete={mockOnDelete}
                onClick={mockOnClick}
            />
        );

        const completeButton = screen.getByTitle('Mark as complete');
        fireEvent.click(completeButton);

        expect(mockOnUpdate).toHaveBeenCalledWith('task1', { complete: true });
    });

    it('opens delete confirmation and deletes task', () => {
        render(
            <TaskCard
                task={mockTask}
                onUpdate={mockOnUpdate}
                onDelete={mockOnDelete}
                onClick={mockOnClick}
            />
        );

        const deleteButton = screen.getByTitle('Delete task');
        fireEvent.click(deleteButton);

        const confirmButton = screen.getByText('Confirm Delete');
        fireEvent.click(confirmButton);

        expect(mockOnDelete).toHaveBeenCalledWith('task1');
    });
});
