import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TaskCard } from '@/components/TaskCard';

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
    CSS: { Transform: { toString: jest.fn() } }
}));

jest.mock('@/components/ui/ProfileIcon', () => ({
    ProfileIcon: () => <div data-testid="profile-icon" />
}));

describe('TaskCard', () => {
    const mockTask = {
        _id: '1',
        name: 'Test Task',
        complete: false,
        dueDate: null,
        labels: [],
        assigned: []
    };

    const mockProps = {
        task: mockTask,
        onUpdate: jest.fn(),
        onDelete: jest.fn(),
        onClick: jest.fn(),
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders task name', () => {
        render(<TaskCard {...mockProps} />);
        expect(screen.getByText('Test Task')).toBeInTheDocument();
    });

    it('toggles edit mode and updates name', async () => {
        const user = userEvent.setup();
        render(<TaskCard {...mockProps} />);

        await user.click(screen.getByText('Test Task'));

        const input = screen.getByDisplayValue('Test Task');
        await user.clear(input);
        await user.type(input, 'Updated Task{Enter}');

        expect(mockProps.onUpdate).toHaveBeenCalledWith('1', { name: 'Updated Task' });
    });

    it('toggles completion status', async () => {
        const user = userEvent.setup();
        render(<TaskCard {...mockProps} />);

        await user.click(screen.getByTitle('Mark as complete'));

        expect(mockProps.onUpdate).toHaveBeenCalledWith('1', { complete: true });
    });

    it('shows delete confirmation', async () => {
        const user = userEvent.setup();
        render(<TaskCard {...mockProps} />);

        // Need to hover to see delete button usually, but in test we can try clicking if it's in DOM
        // The opacity might hide it visually but accessible
        // Using getByTitle 'Delete task'
        await user.click(screen.getByTitle('Delete task'));

        expect(screen.getByRole('heading', { name: 'Delete Task' })).toBeInTheDocument(); // Modal existence check if applicable, or getByText with selector
        expect(screen.getByText('Are you sure you want to delete this task? This action cannot be undone.')).toBeInTheDocument();

        // Confirm delete
        const deleteBtn = screen.getByText('Delete Task', { selector: 'button' });
        await user.click(deleteBtn);

        expect(mockProps.onDelete).toHaveBeenCalledWith('1');
    });
});
